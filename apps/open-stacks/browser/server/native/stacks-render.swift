// stacks-render: renders PDF pages with Quartz (CoreGraphics + ImageIO) for the Stacks Browser. macOS only.
// Built once by server/pdfnative.mjs:
//   swiftc -O -o "$CACHE/render/bin/stacks-render-<sha1 of this file, 10 hex>" server/native/stacks-render.swift
// Protocol (docs/performance/prerender.md, section 2.2): one JSON command per line on stdin,
// one JSON reply per line on stdout, in order. Every reply has "id" (copied) and "ok".
//   {"id":1,"op":"hello"}
//   {"id":2,"op":"info","file":"/abs/doc.pdf"}
//   {"id":3,"op":"render","file":…,"k":0,"h":2200,"box":[0,0,1,1],"q":0.8,"out":"/abs/d0.jpg","lane":"fg"}
//   {"id":4,"op":"lum","file":…,"ks":[0,1,2],"h":400,"out":"/abs/dir/p"}         -> p-<k>.pgm (8-bit P5)
//   {"id":5,"op":"text","file":…,"ks":[0,1],"out":"/abs/t.txt"}                   -> those pages joined by \f
//   {"id":6,"op":"sprite","file":…,"cells":[{"k":0,"box":[x0,y0,x1,y1]},{"k":1,"box":null}],
//            "cw":80,"ch":120,"cols":32,"q":0.6,"out":"/abs/s0.jpg","lane":"ahead"}
//   {"id":7,"op":"close","file":…}      {"id":8,"op":"quit"}
// Boxes are fractions of the displayed page (rotation applied, y down), as everywhere in the app.
import Foundation
import CoreGraphics
import ImageIO
import PDFKit

setvbuf(stdout, nil, _IOLBF, 0)

struct Fail: Error, CustomStringConvertible { let description: String; init(_ s: String) { description = s } }

// ---------------------------------------------------------------- documents ----
var docs = [String: CGPDFDocument]()
var lru = [String]()
func doc(_ path: String) throws -> CGPDFDocument {
  if let d = docs[path] { lru.removeAll { $0 == path }; lru.append(path); return d }
  guard let d = CGPDFDocument(URL(fileURLWithPath: path) as CFURL) else { throw Fail("cannot open") }
  if d.isEncrypted && !d.isUnlocked && !d.unlockWithPassword("") { throw Fail("encrypted") }
  docs[path] = d; lru.append(path)
  while lru.count > 8 { docs.removeValue(forKey: lru.removeFirst()) }
  return d
}

/// A page as pdf.js shows it: the crop box (clipped to the media box), rotated by /Rotate.
struct Geom { let page: CGPDFPage; let box: CGRect; let rot: Int; let w: CGFloat; let h: CGFloat }
func geom(_ d: CGPDFDocument, _ k: Int) throws -> Geom {
  guard k >= 0, k < d.numberOfPages, let p = d.page(at: k + 1) else { throw Fail("no page \(k)") }
  let media = p.getBoxRect(.mediaBox)
  var box = p.getBoxRect(.cropBox).intersection(media)
  if box.isNull || box.width < 1 || box.height < 1 { box = media }
  let rot = ((Int(p.rotationAngle) % 360) + 360) % 360
  let swap = rot == 90 || rot == 270
  return Geom(page: p, box: box, rot: rot, w: swap ? box.height : box.width, h: swap ? box.width : box.height)
}
/// PDF user space -> the displayed page at scale s, Quartz orientation (origin bottom left).
func pageTransform(_ g: Geom, _ s: CGFloat) -> CGAffineTransform {
  let x0 = g.box.minX, y0 = g.box.minY, bw = g.box.width, bh = g.box.height
  switch g.rot {
  case 90:  return CGAffineTransform(a: 0, b: -s, c: s, d: 0, tx: -y0 * s, ty: (x0 + bw) * s)
  case 180: return CGAffineTransform(a: -s, b: 0, c: 0, d: -s, tx: (x0 + bw) * s, ty: (y0 + bh) * s)
  case 270: return CGAffineTransform(a: 0, b: s, c: -s, d: 0, tx: (y0 + bh) * s, ty: -x0 * s)
  default:  return CGAffineTransform(a: s, b: 0, c: 0, d: s, tx: -x0 * s, ty: -y0 * s)
  }
}
func context(_ w: Int, _ h: Int, gray: Bool) throws -> CGContext {
  let cs = gray ? CGColorSpaceCreateDeviceGray() : CGColorSpace(name: CGColorSpace.sRGB)!
  let info = gray ? CGImageAlphaInfo.none.rawValue : CGImageAlphaInfo.noneSkipLast.rawValue
  guard let c = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: cs, bitmapInfo: info) else { throw Fail("no context \(w)x\(h)") }
  c.setFillColor(gray ? CGColor(gray: 1, alpha: 1) : CGColor(red: 1, green: 1, blue: 1, alpha: 1))
  c.fill(CGRect(x: 0, y: 0, width: w, height: h))
  c.interpolationQuality = .high
  c.setShouldAntialias(true)
  c.setShouldSmoothFonts(false)
  return c
}
/// Region fr of page g, the whole page being fh px tall. Returns the image and its place in the full page (px).
func draw(_ g: Geom, fh: Int, fr: [CGFloat], gray: Bool) throws -> (img: CGImage, fw: Int, fh: Int, rect: [Int]) {
  let s = CGFloat(fh) / g.h
  let FW = max(1, Int((g.w * s).rounded())), FH = fh
  let X0 = Int((fr[0] * CGFloat(FW)).rounded()), Y0 = Int((fr[1] * CGFloat(FH)).rounded())
  let OW = max(1, min(FW - X0, Int(((fr[2] - fr[0]) * CGFloat(FW)).rounded())))
  let OH = max(1, min(FH - Y0, Int(((fr[3] - fr[1]) * CGFloat(FH)).rounded())))
  let c = try context(OW, OH, gray: gray)
  c.translateBy(x: CGFloat(-X0), y: CGFloat(-(FH - Y0 - OH)))
  c.concatenate(pageTransform(g, s))
  c.clip(to: g.box)
  c.drawPDFPage(g.page)
  guard let img = c.makeImage() else { throw Fail("no image") }
  return (img, FW, FH, [X0, Y0, OW, OH])
}
func fileSize(_ path: String) -> Int { var st = stat(); return stat(path, &st) == 0 ? Int(st.st_size) : 0 }
/// Write atomically: <out>.part, then rename.
func writeJPEG(_ img: CGImage, _ out: String, _ q: Double) throws -> Int {
  let tmp = out + ".part"
  guard let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: tmp) as CFURL, "public.jpeg" as CFString, 1, nil) else { throw Fail("no JPEG encoder") }
  CGImageDestinationAddImage(dst, img, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
  guard CGImageDestinationFinalize(dst) else { throw Fail("JPEG encode failed") }
  guard rename(tmp, out) == 0 else { throw Fail("rename failed") }
  return fileSize(out)
}
func writePGM(_ img: CGImage, _ out: String) throws {
  // A grey bitmap context's rows are stored top row first, as PGM wants.
  guard let data = img.dataProvider?.data, let p = CFDataGetBytePtr(data) else { throw Fail("no pixels") }
  var buf = Data("P5\n\(img.width) \(img.height)\n255\n".utf8)
  for y in 0..<img.height { buf.append(p + y * img.bytesPerRow, count: img.width) }
  try buf.write(to: URL(fileURLWithPath: out + ".part"))
  guard rename(out + ".part", out) == 0 else { throw Fail("rename failed") }
}

// ------------------------------------------------------------------ helpers ----
func setLane(_ lane: String?) {
  let q: qos_class_t
  switch lane ?? "" {
  case "fg": q = QOS_CLASS_USER_INTERACTIVE
  case "near": q = QOS_CLASS_USER_INITIATED
  case "idle": q = QOS_CLASS_BACKGROUND
  default: q = QOS_CLASS_UTILITY
  }
  pthread_set_qos_class_self_np(q, 0)
}
func reply(_ o: [String: Any]) {
  guard let d = try? JSONSerialization.data(withJSONObject: o), let s = String(data: d, encoding: .utf8) else { print("{\"ok\":false,\"error\":\"reply\"}"); return }
  print(s)
}
func str(_ c: [String: Any], _ k: String) throws -> String { guard let v = c[k] as? String, !v.isEmpty else { throw Fail("missing \(k)") }; return v }
func int(_ c: [String: Any], _ k: String) throws -> Int { guard let v = c[k] as? Int else { throw Fail("missing \(k)") }; return v }
func boxOf(_ v: Any?) -> [CGFloat]? {
  guard let a = v as? [Double], a.count == 4, a[0] < a[2], a[1] < a[3] else { return nil }
  return a.map { CGFloat(max(0, min(1, $0))) }
}

// --------------------------------------------------------------------- loop ----
while let line = readLine() {
  autoreleasepool {
    guard let data = line.data(using: .utf8), let c = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
      reply(["id": NSNull(), "ok": false, "error": "bad json"]); return
    }
    let id: Any = c["id"] ?? NSNull()
    let t0 = DispatchTime.now().uptimeNanoseconds
    var r: [String: Any] = ["id": id, "ok": true]
    do {
      setLane(c["lane"] as? String)
      switch c["op"] as? String ?? "" {
      case "hello":
        let types = (CGImageDestinationCopyTypeIdentifiers() as? [String]) ?? []
        r["engine"] = "quartz"; r["v"] = 1
        r["os"] = ProcessInfo.processInfo.operatingSystemVersionString
        r["cores"] = ProcessInfo.processInfo.activeProcessorCount
        r["webp"] = types.contains("org.webmproject.webp"); r["heic"] = types.contains("public.heic")
      case "info":
        let d = try doc(try str(c, "file"))
        var pages = [[String: Any]]()
        for k in 0..<d.numberOfPages {
          let g = try geom(d, k)
          var p: [String: Any] = ["w": Double(g.w), "h": Double(g.h)]
          if g.rot != 0 { p["rot"] = g.rot }
          pages.append(p)
        }
        r["n"] = d.numberOfPages; r["pages"] = pages
      case "render":
        let d = try doc(try str(c, "file")), g = try geom(d, try int(c, "k"))
        let fr = boxOf(c["box"]) ?? [0, 0, 1, 1]
        let x = try draw(g, fh: try int(c, "h"), fr: fr, gray: false)
        r["bytes"] = try writeJPEG(x.img, try str(c, "out"), (c["q"] as? Double) ?? 0.8)
        r["w"] = x.rect[2]; r["h"] = x.rect[3]; r["fw"] = x.fw; r["fh"] = x.fh; r["rect"] = x.rect
        r["pw"] = Double(g.w); r["ph"] = Double(g.h)
      case "lum":
        let d = try doc(try str(c, "file")), out = try str(c, "out"), h = (c["h"] as? Int) ?? 400
        var done = [Int]()
        for k in (c["ks"] as? [Int]) ?? [] {
          let g = try geom(d, k)
          try writePGM(try draw(g, fh: h, fr: [0, 0, 1, 1], gray: true).img, "\(out)-\(k).pgm")
          done.append(k)
        }
        r["ks"] = done
      case "text":
        let file = try str(c, "file"), out = try str(c, "out")
        guard let pd = PDFDocument(url: URL(fileURLWithPath: file)) else { throw Fail("PDFKit cannot open") }
        let ks = (c["ks"] as? [Int]) ?? Array(0..<pd.pageCount)
        var parts = [String]()
        for i in ks { parts.append(i >= 0 && i < pd.pageCount ? (pd.page(at: i)?.string ?? "") : "") }
        try parts.joined(separator: "\u{0C}").write(toFile: out + ".part", atomically: false, encoding: .utf8)
        guard rename(out + ".part", out) == 0 else { throw Fail("rename failed") }
        r["n"] = pd.pageCount; r["ks"] = ks
      case "sprite":
        let d = try doc(try str(c, "file"))
        let cw = try int(c, "cw"), ch = try int(c, "ch"), cols = max(1, try int(c, "cols"))
        let cells = (c["cells"] as? [[String: Any]]) ?? []
        let rows = max(1, (cells.count + cols - 1) / cols), W = cols * cw, H = rows * ch
        let ctx = try context(W, H, gray: false)
        for (i, cell) in cells.enumerated() {
          guard let k = cell["k"] as? Int, let b = boxOf(cell["box"]) else { continue } // blank page: a white cell
          let g = try geom(d, k)
          let bw = (b[2] - b[0]) * g.w, bh = (b[3] - b[1]) * g.h
          let s = min(CGFloat(cw) / bw, CGFloat(ch) / bh), dw = bw * s, dh = bh * s
          let cx = CGFloat((i % cols) * cw) + (CGFloat(cw) - dw) / 2
          let cy = CGFloat((i / cols) * ch) + (CGFloat(ch) - dh) / 2           // from the top
          ctx.saveGState()
          ctx.clip(to: CGRect(x: cx, y: CGFloat(H) - cy - dh, width: dw, height: dh))
          let FW = g.w * s, FH = g.h * s
          ctx.translateBy(x: cx - b[0] * FW, y: CGFloat(H) - (cy - b[1] * FH) - FH)
          ctx.concatenate(pageTransform(g, s))
          ctx.clip(to: g.box)
          ctx.drawPDFPage(g.page)
          ctx.restoreGState()
        }
        guard let img = ctx.makeImage() else { throw Fail("no sheet") }
        r["bytes"] = try writeJPEG(img, try str(c, "out"), (c["q"] as? Double) ?? 0.6)
        r["w"] = W; r["h"] = H
      case "close":
        let f = try str(c, "file"); docs.removeValue(forKey: f); lru.removeAll { $0 == f }
      case "quit":
        exit(0)
      default:
        throw Fail("unknown op")
      }
    } catch {
      r = ["id": id, "ok": false, "error": "\(error)"]
    }
    r["ms"] = Double(DispatchTime.now().uptimeNanoseconds - t0) / 1e6
    reply(r)
  }
}
