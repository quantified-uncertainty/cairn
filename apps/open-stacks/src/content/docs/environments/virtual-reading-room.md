---
title: Building a Virtual Reading Room
description: How hard it is to build your own spatial place to read and work in, as of October 2026, from a 360° skybox to a WebXR library to a native app; which platforms let a custom room sit behind your real windows; a concrete plan for a WebXR stack laid out in LC call-number order over Open Library data; and what the spatial-memory evidence says about whether 3D placement helps recall. The scene is the easy part; legible text and desktop streaming are the hard part.
---

*Status: draft, October 2026. Prices, product statuses and browser support are as of October 15, 2026 unless another date is given. Not verified: Virtual Desktop's custom-environment file format, whether Quest has a system-wide custom environment, WebXR in the Steam Frame's Chrome, Marble's pricing, and whether visionOS accepts an AI-generated panorama as a Personal Environment. Effort estimates are mine and assume one person working with Claude Code. Sources: the [R08 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R08-spatial-computing-reading-environments.md), with catalog facts from [R05](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md), interface evidence from [R06](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md), and primary sources linked inline.*

## The short version

- **The room is cheap.** A 360° panorama behind your windows takes an afternoon. A WebXR scene with shelves takes days. A photoreal scan of a real room takes a week at most. None of these is the bottleneck.
- **Text and your desktop are the hard part.** Mainstream headsets resolve about 20–37 pixels per degree (PPD), against roughly 60 for 20/20 vision. Body text has to be about 3–4× larger in visual angle than on a good monitor, so you get one or two legible pages in view, not five. Putting your real computer's windows into a room *you* built means writing a video streamer, and every stage of a streamer blurs text. The vendors' streamers (Mac Virtual Display, Virtual Desktop) will beat anything a solo builder writes.
- **On Vision Pro, a custom room can sit behind other apps only as a flat panorama.** visionOS 27 (14 September 2026) added Personal Environments, which put a user's panorama behind every app, Mac Virtual Display included. A custom *3D* room exists only inside the app or web page that defines it ([Apple](https://support.apple.com/en-ae/149067)).
- **The cheapest custom 3D reading room is now a web page on Vision Pro.** Safari 27 lets a page open a USDZ environment behind its own window while the page stays visible, so the text is still rendered sharply by the OS ([WWDC26 session 320](https://developer.apple.com/videos/play/wwdc2026/320/)).
- **A WebXR library over an open catalog is a one-to-two-week project.** Open Library has 14.7M works with an LC call number and a sortable `lcc_sort` key. In a 7,127-work sample, though, only about 4% of books were free to read in full, and 28% were borrowable. A virtual library over open metadata is mostly a browsing and routing tool, not a reading room.
- **Spatial memory is real, but the evidence supports stable placement on walls and shelves, not 3D for its own sake.** Data Mountain beat a bookmark list. Immersion added 8.8 percentage points to recall in one n=40 memory-palace study. Free placement in depth did not help and probably hurt.

## What to do

| If you want | Do this | Effort | Main obstacle |
|---|---|---|---|
| A calm place to read your own PDFs and web pages, on a Mac | Vision Pro: Mac Virtual Display (Ultrawide) plus a built-in or Personal Environment | Under an hour | Headset cost (\$3,699 since 25 June 2026, [Apple](https://www.apple.com/shop/buy-vision/apple-vision-pro)) and weight (750–800 g on the head) |
| The same on a cheaper headset | Quest 3 or Galaxy XR with [Virtual Desktop](https://www.vrdesktop.net/)'s macOS or Windows streamer and one of its environments | 1–2 hours | Lower PPD (about 20–32); Virtual Desktop's custom-environment support is unverified |
| Your own room around a reading app you control | Write the reader as an HTML page; add a Safari web environment (Vision Pro) or a WebXR scene (Quest, Android XR) | 0.5–5 days | Text inside a WebXR session must be drawn in WebGL |
| A walkable library to browse | The WebXR build plan below | 1–2 weeks for a prototype | Spine legibility; most "books" route to a borrow or library hold, not a free text |
| Your real desktop inside your own 3D room | Don't build it. Use the platform streamer and accept its environments | n/a | Months of work to match the existing streamers |

The rest of the chapter explains these choices. The hardware itself (prices, PPD and weights by device) is in [VR and Spatial Computing](/environments/vr-and-spatial-computing/).

## The difficulty tiers

Effort figures are my estimates for one person with Claude Code. Cash costs are as of October 2026.

| Tier | What you build | Effort | Cash cost | Works on | Platform constraints | What you get |
|---|---|---|---|---|---|---|
| **0. Configure** | Pick a system environment, curve windows, turn on Look to Scroll, use Mac Virtual Display Ultrawide | 10–30 min | \$0 | Vision Pro best; Quest and Galaxy XR partly | None | A distraction-free reading space today |
| **1. Skybox** | A 360° panorama, photographed or AI-generated, used as the backdrop | 1–3 h | \$0 (phone panorama) to \$20–\$140/month ([Skybox AI](https://skybox.blockadelabs.com/membership); 16K needs the Business tier) | visionOS 27 Personal Environments (if Photos accepts it); Virtual Desktop and Immersed on Quest and Galaxy XR (format unverified); WebXR sky sphere; Android XR (EXR) | No parallax; static lighting; needs about 8K width for Quest and 16K for Vision Pro | Your own backdrop behind real desktop windows |
| **2a. Safari web environment** | An HTML reading app plus a USDZ room opened with `requestImmersive()` | 0.5–2 days | \$0 on static hosting | **visionOS 27 only** | USDZ authoring (Blender plus Apple's add-on, or Reality Composer Pro); not a web standard; unknown whether other apps stay visible | OS-sharp text inside a custom 3D room, shared as a URL |
| **2b. WebXR room** | A three.js, React Three Fiber or A-Frame scene with shelves and text panels | 2–5 days to prototype; 2–4 weeks to polish | \$0–\$10/month hosting | Quest Browser, Android XR Chrome, Vision Pro Safari (VR only) | No DOM inside the session, so all text is WebGL; your desktop needs your own WebRTC; a full session hides other windows | One URL that runs on three platforms; the fastest way to test spatial ideas |
| **3. Splat or generated world** | Scan a real room (Scaniverse, Polycam) or generate one (Marble), clean it in SuperSplat, stream it with Spark | 1–7 days | \$0–\$30/month (Polycam Basic); Marble price unverified | WebXR via Spark; RealityKit on visionOS 27 | 0.5–2.5M splats per frame; large files; vendor risk | A photoreal room with parallax |
| **4. Native app** | visionOS (SwiftUI and RealityKit), Android XR (Jetpack XR), or Unity, Godot or Unreal over OpenXR | 2–8 weeks | \$99/year Apple; \$25 once for Google Play; Meta free (dossier's figures, not rechecked) | One platform per build | Immersive spaces hide other apps, so the app must contain the reader, notes and chat itself | Native text, gaze input, persistence |
| **5. Streaming client or compositor** | Your own Virtual Desktop, or a Linux XR desktop on Steam Frame | Months | Hardware and time | Steam Frame is the most open | Encoder latency, input bridging, store policy | Full control. Not recommended for a reading project |

Two things in this table decide most projects.

1. **Tiers 1–3 are about the room; tiers 4–5 are about the text and the desktop.** Tiers 1–3 fit Claude Code well because they are web code and asset pipelines. Tier 4 needs a person with the hardware for signing, device testing and store review.
2. **You can't have a custom 3D room, sharp OS text and your real desktop all at once without tier 5.** Each cheaper route drops one of the three. Personal Environments keep the desktop and OS text but the room is a flat panorama. A Safari web environment keeps the room and OS text but only for the page that owns it. WebXR keeps the room but loses both OS text and the desktop.

## The hard part: legible text and your desktop

### Text has to be sized in degrees

Comfortable reading in a headset needs body text around 0.7–1.2° per em. The sources are Solum (2019): 1.2–1.3° comfortable and 0.8–0.92° minimum; Hoffman et al. (2019): a 45-arcminute legibility threshold at 13.8 PPD and a comfort limit of 70.2 arcminutes; and Android XR's typography guide, which recommends 0.7–0.9° with a 0.6° floor. The Android XR guide is written for AI display glasses, not headsets ([Android Developers](https://developer.android.com/design/ui/ai-glasses/guides/styles/type?hl=en); the first two are cited in [Kilpeläinen and Häkkinen 2023](https://frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1243387/full)).

Hoffman's comfort limit at 13.8 PPD works out to about 16 pixels, and Android XR's floor is 18 px. Letter height is smaller than an em, so I take a rule of thumb: **design for roughly 20–25 headset pixels per em** (I). The table applies it. It is an inference that assumes legibility is limited by pixels. Kilpeläinen and Häkkinen warn that "legibility cannot be predicted from the nominal resolution of the display," because subpixel layout also matters.

| Display (centre PPD) | Em size at 20–25 px | Width of a 66-character line | Legible pages in the central 40° |
|---|---|---|---|
| 27-inch 4K monitor at 60 cm (~67) | 0.24° (16 px text) | ~8° | 4–6 |
| Quest 3S, Steam Frame (~20) | 1.0–1.25° | 33–41° | 1 |
| Quest 3 (~25, Meta's figure) | 0.8–1.0° | 26–33° | 1 |
| Vision Pro, Galaxy XR (~32–34, estimates) | 0.6–0.8° | 20–26° | 1–2 |
| Meta VR Glasses, spring 2027 (37) | 0.55–0.7° | 18–22° | 1–2 |
| Pimax Crystal Super, PC only (57) | 0.35–0.45° | 12–15° | 2–3 |

Headset PPD figures come from vendors or teardowns, as compiled in [VR and Spatial Computing](/environments/vr-and-spatial-computing/). The monitor's PPD and the other columns are my arithmetic, with an average character taken as half an em. Treat ±20% on any PPD figure as normal.

Three consequences for a builder:

- **A headset gives you more space, not more legible text.** On an 8K skybox or a 10K virtual display the extra pixels go into area. The amount of text you can read without turning your head is fixed by the panel. Use the extra space for context that tolerates large type: outlines, citation cards, shelf labels, notes.
- **Scanned page images fit poorly.** A book page has about 40 lines. At 0.7° per em with 1.2 line spacing, that is about 34° of height, which is the whole comfortable vertical band (0–35° below the horizon, per [Microsoft's comfort guidance](https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort)). Reflowable text (Project Gutenberg, Standard Ebooks, arXiv HTML) reflows to fit. A scan of a page cannot, so you end up panning (I).
- **Reading speed suffers less than legibility.** Kilpeläinen and Häkkinen (n=29) found reading took about 7% longer per display on a 13 PPD headset than on a Varjo with a ~60 PPD focus area, while their letter-legibility measures showed effect sizes about ten times larger. Users notice the blur before it costs them much time ([Frontiers in VR, 2023](https://frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1243387/full)).

### Getting your desktop into the room

The desktop decides whether you can read Zotero, a PDF annotator and a terminal in the room, or only what you built. The options, as of October 2026:

| Route | Headsets | Computer | Price | Room behind it | Status and catch |
|---|---|---|---|---|---|
| **Mac Virtual Display** | Vision Pro | Mac (Apple silicon for Wide and Ultrawide; Intel limited to 3K) | Free | Any system environment, including Personal Environments | Up to 10240×2880 px in Ultrawide. Main display only, one Mac at a time ([Apple Support](https://support.apple.com/118521)) |
| **Virtual Desktop** | Quest 1–3S and Pro, Pico, Vive Focus, Play For Dream, Galaxy XR | Windows, or macOS via its streamer (SteamVR games need Windows) | \$24.99 on the [Quest store](https://www.meta.com/experiences/virtual-desktop/2017050365004772/) (checked October 15, 2026) | Its own environments; custom ones reportedly supported, format unverified | Vision Pro and Steam Frame are not on its supported list ([vrdesktop.net](https://www.vrdesktop.net/)) |
| **Immersed** | Quest 2/3/Pro, Pico, Vision Pro | macOS, Windows, Linux | Free tier plus paid; up to 5 virtual monitors | Its own environments | Active. Its Visor headset has been on pre-order since 2023 ([immersed.com](https://immersed.com/)) |
| **Meta Quest Remote Desktop** | Quest | Windows; Mac unverified | Free | Horizon environments | Meta's recommended replacement for Horizon Workrooms, which shut down on 16 February 2026 ([Meta](https://www.meta.com/en-gb/help/quest/2464765133873078/)) |
| **Google PC Connect** | Galaxy XR | Windows beta (December 2025); Mac promised for 2026, status unknown | Free | Android XR system environments | Single window or whole desktop beside Play apps ([9to5Google](https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/)) |
| **Steam Link** | Steam Frame | Windows PC | Free | SteamVR | Eye-tracked foveated streaming. No first-party Mac path |
| **Your own WebRTC** | Any WebXR browser | Any | \$0 | Your WebXR room | `getDisplayMedia()` into a video texture. Works, but blurrier and laggier than the above (I) |

**Why your own streamer comes out blurry (I).** A desktop frame goes through screen capture, a video encoder, the network, a decoder, resampling onto a quad that is rarely pixel-aligned, and finally lens distortion. Video codecs are tuned for natural images. At typical bitrates, 4:2:0 chroma subsampling and quantisation smear thin coloured text edges, and resampling onto an angled surface costs a large part of the remaining sharpness unless you supersample. WebRTC's [content hints](https://www.w3.org/TR/mst-content-hint/) (`contentHint = "text"`) tell the encoder to keep resolution rather than frame rate, which helps. Vendor streamers win by owning the whole pipeline: Apple credits foveated rendering for Mac Virtual Display's "10K" claim. If the desktop must be in the room, use the vendor's streamer and its environments. Build your own room only around content you render yourself.

**Long sessions are the other half of the problem.** Biener et al. had 16 people do their own work for five 8-hour days on a Quest 2 (about 20 PPD) and five in a matched physical setup. In VR, self-rated task load was 35% higher, eye strain 48% higher and perceived productivity 16% lower, and 2 participants dropped out on day 1 ([arXiv 2206.03189](https://arxiv.org/abs/2206.03189)). A 2025 interview study of 10 long-term Vision Pro users found 4 who work at least five hours a day, while 1 gets a headache after an hour ([arXiv 2509.05067](https://arxiv.org/abs/2509.05067)). Battery life is 1.5–3 hours on most standalone devices. Plan reading sessions of 60–120 minutes, and make the same corpus and layout open on a flat screen, so the headset is one mode of the tool and not a separate silo.

### Layout rules

These follow from the arithmetic above and from [Microsoft's comfort guidance](https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort). Microsoft gives immersive-headset focal distances of 1.25–2.5 m and advises keeping content at 1 m or more.

- **Main reading panel:** 1.5–2 m away, 10–20° below eye level, body text at 20–25 px per em on the target headset.
- **Secondary panels:** within ±45° horizontally. Use vertical space sparingly; avoid gaze angles more than 10° above the horizon.
- **Rendering:** wherever possible, keep text in OS-rendered HTML or native views. Inside WebXR, use compositor layers where supported. Meta documents WebXR Layers as giving "higher quality rendering of imagery and text" and notes that "not all browsers support" them ([Meta](https://developers.meta.com/horizon/documentation/web/webxr-layers/)). Otherwise use SDF text, for example [troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text).
- **Input:** prefer eye scrolling, keyboard and trackpad to mid-air pinching for anything longer than a few minutes.

## Where a custom environment is allowed

The question that matters is whether *your* room can sit behind *other* apps' windows, in particular behind the desktop stream.

| Platform | User-supplied environment behind all apps | Environment from a third-party app | Web route |
|---|---|---|---|
| **visionOS 27** | **Yes, as a panorama.** "Personal Environments allows you to choose a panorama special to you and set it as your own Environment" (released 14 September 2026, [Apple](https://support.apple.com/en-ae/149067)) | Only inside the app's own immersive space. An Apple engineer has said apps can't use the system environments ([forum](https://developer.apple.com/forums/thread/763758), undated). A Full Space hides other apps' windows (I, medium-high) | Safari web environments (`<model>` plus `requestImmersive()`); WebXR, immersive VR only |
| **Android XR** | Not found | A `SpatialEnvironment` (one OpenEXR skybox plus one glTF), **only in Full Space**, with passthrough opacity from 0 to 1 ([Android Developers](https://developer.android.com/develop/xr/jetpack-xr-sdk/add-environments), updated 22 September 2026) | WebXR in Chrome |
| **Horizon OS (Quest)** | Not confirmed | Inside immersive apps; Virtual Desktop and Immersed bring their own | WebXR in Quest Browser |
| **SteamOS (Steam Frame)** | Unknown | OpenXR apps | Chrome on the Linux desktop; WebXR unverified |
| **SteamVR (Windows PC VR)** | SteamVR Home, the launch space, takes community environments; games replace it | "You can even create and submit your own SteamVR Home by using the SteamVR Workshop Tools" ([Steam](https://store.steampowered.com/app/250820/SteamVR/), checked October 15, 2026) | n/a |

**visionOS in detail.** Apple's model has three layers, and each makes a different trade.

- **Personal Environments** are the only user-made backdrop that works behind Mac Virtual Display. They are panoramas, so there is no parallax. Apple says "choose a panorama," and Photos probably identifies panoramas partly from capture metadata (I). Whether a 2:1 image from Skybox AI or Blender qualifies is untested [~50%]. Test it before you build a pipeline around it.
- **Safari web environments** are the cheapest custom 3D room. A `<model>` element with a USDZ file plus `await model.requestImmersive()`, called from a user gesture, "transports the model element beyond the browser bounds while keeping the page visible." The environment opens behind Safari's window, and the Digital Crown exits it. Feature detection, state and styling mirror the Fullscreen API (`document.immersiveEnabled`, `immersivechange`, `:immersive`). Apple's performance advice is to cut vertices and entities, bake lighting into unlit materials, compress with `usdcrush`, and leave the model `display: none` until needed so it isn't downloaded early ([WWDC26 session 320](https://developer.apple.com/videos/play/wwdc2026/320/)). The feature replaces the Spatial Backdrop developer preview ([WebKit, 17 September 2026](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)). The session doesn't say whether other apps' windows stay visible, and the API is not yet a W3C standard.
- **Native immersive spaces** give you full control and RealityKit's native Gaussian splats (new in visionOS 27, [Apple](https://developer.apple.com/visionos/whats-new/)). The price is that your app has to *be* the whole workspace.

**Virtual Desktop and SteamVR.** These are the custom-environment routes for Quest, Galaxy XR and PC VR owners. Virtual Desktop's site lists its headsets and its macOS streamer but doesn't document an environment format, and neither does its Quest store page. The R08 dossier records custom environments and 360° backgrounds as supported but unverified; I'd put [~70%] on a user-supplied 360° image working as a backdrop on Quest. SteamVR Home environments are built with Valve's Workshop Tools and published to the Steam Workshop. That is a level-design job (Source 2 tooling, from prior knowledge, medium confidence), not a skybox drop. SteamVR is Windows-only, so it matters mainly for Bigscreen Beyond and Pimax owners, and for Steam Frame owners streaming from a Windows PC (I).

## WebXR support, October 2026

| Browser and device | Immersive VR | Passthrough AR | Notes | Source |
|---|---|---|---|---|
| **Quest Browser** (Quest 3, 3S) | Yes | Likely [~85%]; not verified here | Meta ships the Immersive Web Emulator and Developer Hub for testing; documents WebXR Layers | [Meta](https://developers.meta.com/horizon/develop/web/) |
| **Chrome on Android XR** (Galaxy XR) | Yes | Yes | Device API, AR Module, Gamepads, Hit Test, Hand Input, Anchors, Depth Sensing, Light Estimation; hands are the default input. Layers not listed | [Android Developers](https://developer.android.com/develop/xr/web) |
| **Safari on visionOS** (Vision Pro) | Yes, since visionOS 2 | No | `immersive-vr` only, `transient-pointer` (gaze and pinch) input, hand tracking with a permission prompt ([WebKit, 2024](https://webkit.org/blog/15443/news-from-wwdc24-webkit-in-safari-18-beta/)); reported on by default since visionOS 2 (Road to VR, 2024). Safari 27 adds texture-array projection layers | WebKit |
| **Chrome on Steam Frame** (SteamOS) | Unverified | Unverified | Chrome runs on the Linux desktop; passthrough is monochrome without a \$149 add-on | R08 |
| **Desktop Chrome and Edge** (PC VR via OpenXR) | Yes | n/a | caniuse marks WebXR "partial" from Chrome 79 | [caniuse](https://caniuse.com/webxr), checked October 15, 2026 |
| **Desktop Firefox; Safari on macOS** | Disabled by default | n/a | | caniuse |
| **Safari on iOS** | Not supported | n/a | So a phone can't preview the immersive mode | caniuse |

For a cross-platform reading room, write against the core WebXR Device API with hand and transient-pointer input. Treat Layers as a progressive enhancement, and test in the Immersive Web Emulator before reaching for the headset.

## Rooms you don't have to model

### 360° skyboxes

An equirectangular image *W* pixels wide gives *W*/360 pixels per degree (I):

| Width | PPD | Fit |
|---|---|---|
| 4,096 px (Skybox AI Essential, \$24/month) | 11.4 | Blurry on every current headset |
| 8,192 px (Standard, \$60/month, with API) | 22.8 | Fine on Quest 3S, Quest 3 and Steam Frame |
| 16,384 px (Business, \$140/month, plus HDRI and a commercial licence) | 45.5 | Needed to look crisp on Vision Pro, Galaxy XR and Meta VR Glasses |

Skybox AI prices are monthly as of October 15, 2026; annual billing is \$20, \$48 and \$112, and there is no free tier ([Blockade Labs](https://skybox.blockadelabs.com/membership)). A skybox has no parallax: it reads as a painted dome, which is fine behind a reading panel and breaks down if you lean or walk. A phone panorama of a real reading room costs nothing and is often the better backdrop.

### Gaussian splats of real libraries

Splats are the cheapest way to get a *real* room with parallax.

- **Capture.** [Scaniverse](https://www.nianticspatial.com/products/capture), now a Niantic Spatial product, processes on device and exports SPZ and USDZ. [Polycam](https://poly.cam/pricing) includes splats on its Basic plan, \$150/year or \$30/month as of October 2026.
- **Clean-up.** [SuperSplat](https://github.com/playcanvas/supersplat) is free, MIT-licensed and runs in the browser; version 3.0 moved to WebGPU.
- **Web rendering.** [Spark](https://github.com/sparkjsdev/spark) is a World Labs three.js renderer under the MIT licence. Version 2.0 (14 April 2026) added level-of-detail streaming with 0.5–2.5M splats per frame depending on the device, and demos of over 100M splats running on Quest and Vision Pro. The current version is 2.3.1 (1 October 2026) ([World Labs](https://www.worldlabs.ai/blog/spark-2.0)).
- **Native rendering.** RealityKit renders splats natively in visionOS 27.

Three cautions (I):

- **Spine text in a phone scan won't be legible** [~80%]. A splat reconstructs the room at roughly photo resolution, and 1–2 cm spine lettering seen from a metre away dissolves. Use the scan for architecture and light, and put catalog-driven shelves with real text in front of it.
- **Get permission.** Many libraries restrict photography, and publishing a scan of an interior is a different act from taking it for yourself. Check the library's policy.
- **I found no published, licensed splat of a well-known reading room** in this research. Niantic's [Into the Scaniverse](https://www.uploadvr.com/niantic-into-the-scaniverse-webxr/) WebXR map of user scans launched in December 2024; its status after Scaniverse's move to an enterprise product is unverified.

### Generated worlds

| Tool | Output | Status and price (October 2026) | Use for a reading room | Catch |
|---|---|---|---|---|
| [Skybox AI](https://skybox.blockadelabs.com/) | 360° panoramas, 4K–16K, HDRI at the top tier | \$24–\$140/month; API from Standard; advertises an MCP integration | Backdrops: one sky per subject, generated in batch | No parallax |
| [World Labs Marble](https://www.worldlabs.ai/blog/marble-world-model) | 3D worlds from text, images, video or panoramas; exports Gaussian splats, collider and high-quality meshes, video | Generally available since 12 November 2025; World API since 21 January 2026; pricing unverified | A walkable room with parallax, streamed through Spark | World Labs signed a definitive agreement on 28 September 2026 to join AMD, expected to close by the end of 2026. The post says nothing about Marble, Spark or the API ([World Labs](https://www.worldlabs.ai/blog/amd-announcement)) |
| [Google Genie 3](https://deepmind.google/models/genie/) | An interactive world model at 720p and 20–24 fps, consistent for "several minutes" | Experimental, through Project Genie | Exploration only | No export, so not an asset source |

**Recommendation.** Keep assets in open formats: glTF or USDZ for rooms, SPZ, PLY or SOG for splats, EXR or equirectangular JPEG for skies. Store each room's source prompt or capture next to it. With Workrooms gone and World Labs changing hands, no vendor's environment system is safe to depend on.

## A build plan: a WebXR library over an open catalog

The target: a library you can walk or scroll through, with shelves in Library of Congress call-number order. Pulling a book opens its record and shows where to read it. It runs from one URL on Quest, Android XR and Vision Pro, with a 2D version of the same shelf for laptops. Total effort is about one to two weeks for a usable prototype (I).

### 1. Data (half a day to two days)

- **Start small.** This wiki's `public/prototypes/data/catalog.json` holds 7,127 Open Library works (CC0, fetched 15 October 2026), already sorted by LC call number. Of these, 91.5% carry a call number. That rate is flattered by sampling: the works were pulled by subject queries that favour well-catalogued books.
- **Fetch one call-number range** from the Search API. R05 found that `lcc:QA-0273*` (probability) returns 4,746 works and that `sort=lcc_sort` works:

  ```
  https://openlibrary.org/search.json?q=lcc:QA-0273*&sort=lcc_sort&limit=100&page=1&fields=key,title,author_name,first_publish_year,lcc,number_of_pages_median,ebook_access,ia,cover_i,id_project_gutenberg,id_standard_ebooks
  ```

  The API allows 1 request per second anonymously and 3 per second with an identifying User-Agent, and it asks you not to bulk-download through it ([Open Library](https://openlibrary.org/developers/api)). One range of about 50 pages is fine.
- **Go to scale with the dumps.** The 2026-09-30 works dump is 4.07 GB gzipped. Open Library's index has 14,734,568 works with an LC call number. At the sample's ~490 bytes per work, that is about 7 GB of uncompressed JSON (I). Shard it by the second-level ranges of the [LC Classification Outline](https://www.loc.gov/aba/cataloging/classification/lcco/), which is also in this repo as `lcc-outline.json`. There are 1,812 of them, such as QA273–280 "Probabilities. Mathematical statistics". Shards average roughly 4 MB but vary widely, and the client loads the current range plus its neighbours.
- **Decide how to handle works with several call numbers.** A work aggregates editions, so it can carry several class numbers. R05 found Leibniz's *Selections* under B2555, B2558, B2597, QA273 and QA611, and `lcc_sort` picks one, sometimes a malformed one. Shelving a work in every class where it was catalogued is more honest and gives more serendipity. Mark the copies as "also shelved at…".

### 2. Layout: call numbers to metres (half a day)

Turn the sorted list into physical positions: spine thickness from page count, as Open Library Explorer does, wrapped onto shelves.

```js
// works: sorted by lcc_sort. Units are metres. A sketch, not tuned.
const SHELF_W = 0.9, SHELVES = 7;
let x = 0, shelf = 0, section = 0;
for (const w of works) {
  const t = 0.004 + 0.00005 * (w.pp ?? 300); // boards plus ~0.05 mm per page
  if (x + t > SHELF_W) { x = 0; shelf++; }
  if (shelf === SHELVES) { shelf = 0; section++; }
  w.pos = { section, shelf, x: x + t / 2, thickness: t };
  x += t;
}
```

The sample's median book has 352 pages, which gives a spine of about 2.2 cm, about 40 books per 90 cm shelf and about 280 per seven-shelf section (I). The QA273 range alone (4,746 works) fills about 17 sections, or roughly 15 m of wall. All 14.7M classed works would fill about 52,000 sections, some 47 km of shelving.

So the library needs **call-number jumps**: type "QA273" or pick a class from an outline, then teleport. It also needs a **seated mode** in which the shelf scrolls past you, which avoids locomotion sickness. Put range signs at aisle ends, generated from the outline (e.g. "QA273–QA280 Probabilities. Mathematical statistics"), at 2° or more so they read from 3–5 m.

### 3. Rendering and spine text (two to four days)

- **Spines.** Draw them as one `InstancedMesh` per section, so a few thousand books cost a handful of draw calls. Colour encodes access status. Height can carry a popularity signal such as Open Library's reading-log count.
- **Spine legibility sets the browsing distance.** At 1 m, 1° is 1.75 cm. A 2.2 cm spine can carry a vertical title at about 0.8–1° per em at that distance, and thinner books can't (I). At 2 m an em of 1° is 3.5 cm, wider than most spines. Browsing therefore happens at about arm's length plus a step, as in a real library, which sits at the near edge of Microsoft's ≥1 m guidance.
- **Pointing at a spine shows a horizontal callout card** (title, author, year, call number) at a comfortable size. This is the move VRDoc's gaze "MagGlass" made for reading, and its n=13 study found reading "more efficient" (p below .01) with it ([arXiv 2211.03001](https://arxiv.org/abs/2211.03001)).
- **Bake spine titles** into a per-section canvas texture at 20–25 px per em, and regenerate when the user approaches. Thousands of live SDF text meshes would cost more than they give.

### 4. Pulling a book: record and where to read (one to two days)

A pull (trigger, pinch, or gaze and pinch on Vision Pro) slides the book out and opens a record panel 1.5 m away. Use a quad layer where the browser supports one. The panel shows title, authors, year, call number, subjects, the cover from the Covers API by cover ID (not rate-limited, unlike lookups by ISBN), the first sentence where Open Library has one (18% of the sample), and a **where-to-read** row computed from the record:

| Signal in the record | Button | Share of the 7,127-work sample |
|---|---|---|
| A Project Gutenberg or Standard Ebooks ID | Read the reflowable text (the best format for a headset) | 0.2% and 0.3% |
| `ebook_access = public` | Read the full scan on the Internet Archive | 3.9% |
| `borrowable` | Borrow through Open Library (account needed) | 28.3% |
| `printdisabled` | For qualified print-disabled readers only; otherwise search inside for page snippets | 32.6% |
| `no_ebook` or `unclassified` | Library holdings and the rest of the [access ladder](/access/access-ladder/) | 31.6% and 3.5% |

The sample is modern non-fiction picked by subject. A shelf of 19th-century literature would have far more public-domain texts. The honest expectation for this wiki's readers is that **most pulls end at a borrow, a library hold or a search-inside snippet**, so the library's value lies in browsing and routing. Add a "readable now" filter that dims everything else. The full routing logic, with HathiTrust, publisher open access and institutional access, belongs in the [reference architecture](/building/reference-architecture/).

**Reading itself should leave the 3D scene.** Inside a WebXR session the DOM isn't rendered, so a book page would have to be redrawn in WebGL, with worse text. Have "Read" end the session (`session.end()`) and open the text in the browser's 2D window, then restore the reader's place in the stacks on return. On Vision Pro you can invert this: the stack browser and reader are HTML, and the library room is a Safari web environment behind them. Both versions share the same data shards and layout file.

### 5. The room (one to three days, optional)

- **On Quest and Android XR:** put a Spark-streamed splat or a Marble world behind the shelves, or a 16K sky sphere.
- **On Vision Pro:** use a baked-lit, low-poly USDZ reading room for the Safari route. In WebXR, use the same splat route as other platforms.

Keep the room dim and low-contrast where the shelves are, because the shelves carry the text.

### 6. Persistence and measurement (one day)

- **Store layout as data, not in the scene.** Keep a JSON file of personal pins (a carrel desk with your current 50–100 books), notes and last positions. Because it is data, it syncs to the 2D version.
- **Never reshuffle placements without asking.** That holds even when an embedding model proposes a better arrangement. The spatial-memory evidence below is the reason.
- **Instrument "neighbour uptake."** Measure how much more likely you are to open a book's shelf neighbour after opening that book. In OhioLINK circulation data, a book whose neighbour was borrowed was **at least 9× more likely** to be borrowed ([McKay, Smith and Chang 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658)). That is the bar a virtual shelf should clear. Compare the VR shelf against the 2D shelf on the same data. If the 2D shelf matches it, the headset is adding comfort, not discovery.

### Effort and cost

| Phase | Effort (I) | Cash |
|---|---|---|
| Data from the sample or one range | 0.5 day | \$0 |
| Data at full scale from the dumps | 1–2 days | \$0 plus a few GB of static hosting |
| Layout and the 2D shelf view | 0.5–1 day | \$0 |
| WebXR stacks, spines, callouts, jumps | 2–4 days | \$0 |
| Record panel and where-to-read routing | 1–2 days | \$0 |
| Room (sky, splat or USDZ) | 1–3 days | \$0–\$140/month for generation tools, or a phone |
| Persistence and instrumentation | 1 day | \$0 |
| **Total** | **~7–13 days** | **\$0–\$10/month hosting**, plus a headset (Quest 3S at \$349.99 since 19 April 2026, [Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) |

Prior art to look at first: [Open Library Explorer](https://blog.openlibrary.org/2020/12/16/introducing-the-open-library-explorer/), a 2020 beta with LCC and Dewey shelves and 3D page-count thickness. R05 found it still linked from Open Library's navigation in October 2026. Harvard's StackLife, the canonical virtual-stack interface, no longer resolves. [Browsing the Stacks](/finding/browsing-the-stacks/) covers the 2D versions.

## Does 3D placement help you remember?

The case for a *spatial* library rests on spatial memory. The evidence supports part of that case.

| Study | n | Comparison | Result | What it implies for a reading room |
|---|---|---|---|---|
| Data Mountain ([Robertson et al., UIST 1998](https://www.microsoft.com/en-us/research/publication/data-mountain-using-spatial-memory-for-document-management/)) | 32 | 100 web pages placed by the user on an inclined 2.5D plane vs IE4 Favorites | Reliably faster retrieval, F(2,18) = 4.84, p under .02 | Personal placement of about 100 items helps retrieval |
| Czerwinski et al. (INTERACT 1999) | 9 | The same users about 6 months later | Retrieval "not significantly slower." Caveat: they had seen their layouts once at 6 weeks and got 5 minutes' review before the trials | Placement memory lasts; the layout, not the thumbnails, carried it |
| [Cockburn and McKenzie, CHI 2001](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf) | — | 2D vs 3D Data Mountain, differing only in dimensions | 2D slightly faster (not significant); users significantly *preferred* 3D | The benefit doesn't need 3D, and preference misleads |
| [Cockburn and McKenzie, CHI 2002](http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf) | 69 (2,070 trials) | Physical and virtual 2D, 2½D and 3D layouts | Retrieval 3.7 / 3.8 / 4.8 s as freedom in depth grew (p = .09, marginal); density had a strong effect (3.2 / 4.2 / 5.0 s, p under .001); physical 2½D and 3D rated more cluttered, virtual ratings did not differ | Free depth doesn't help and may hurt; more items per view cost time |
| [Cockburn 2004](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/revisiting2Dv3D.pdf) | — | Replication of a pro-3D study with tighter controls | Spatial memory "unaffected by the presence or absence of three-dimensional perspective"; items remembered better when "personally meaningful and visually distinctive" | Landmarks and personal meaning matter, perspective doesn't |
| Virtual memory palaces ([Krokos, Plaisant and Varshney 2019](https://link.springer.com/content/pdf/10.1007/s10055-018-0346-3.pdf)) | 40, within-subjects | The same 3D palaces in an Oculus DK2 headset vs on a 30-inch monitor | Recall 84.05% vs 75.24% (8.8 points; paired t-test, Bonferroni–Holm); 70% said the headset helped them focus | *Immersion* helps recall of placed items; this is not a 2D-vs-3D layout comparison |
| Immersive Space to Think ([Lisle et al., IEEE VR 2021](https://doi.org/10.1109/VR50410.2021.00077)) | 17 analysts | Reading, annotating and arranging documents in VR | Three distinct layout strategies | Descriptive; people do use space to organise reading |

The interface literature as a whole points the same way. Hearst's review of 1990s and 2000s comparisons found 3D "inferior, or at best equivalent to 2D or textual interfaces," and in Sebrechts et al. (1999) "the lack of legibility of the text" was a core problem ([*Search User Interfaces*, ch. 10](http://searchuserinterfaces.com/book/sui_ch10_visualization.html), 2009; see [Maps of Knowledge](/interfaces/maps-of-knowledge/)).

**Where I come down.**

- **Stable, personal placement of around 100 items helps retrieval and lasts months** [~85%]. That is Data Mountain's scale and the scale of a carrel or a reading list, not of a library.
- **Immersion adds a modest recall benefit** [~60% that Krokos's 8.8-point effect replicates on 2026 hardware with books instead of faces]. It is one study on a 2014-era headset, and it measured faces in palaces.
- **Free 3D depth adds nothing and probably costs retrieval time** [~75%]. Keep content on walls, shelves and desks (2.5D).
- **In a catalog-ordered library of thousands of books, you won't form memories for individual books** [~70%]. What forms is memory for regions ("probability is the second aisle on the left"), which LC order already gives you in a physical library. Cockburn's density effect points the same way.

**Design consequences.**

- Use the call-number stacks for discovery, where browsing evidence like McKay's applies.
- Give the reader a personal layer for memory: a carrel, wall boards, pinned books, user-placed and visually distinctive, which never moves unless the reader moves it.
- Add distinct landmarks (a window, a map, a different wood per class) so regions are memorable.
- Don't sell the headset on recall. The most defensible reasons to read in one are focus and a large, private workspace. The long-term Vision Pro users in the 2025 interview study used immersive environments to "eliminate distractions."

## Open questions

- Does visionOS 27 accept a 2:1 equirectangular image made in Skybox AI or Blender, with no camera metadata, as a Personal Environment? If it rejects it, does adding panorama EXIF tags fix that?
- While a Safari web environment is open, do other apps' windows (Mac Virtual Display in particular) stay visible?
- What file formats and resolution limits do Virtual Desktop's custom environments accept on Quest 3 and Galaxy XR?
- Which WebXR Layers types (quad, cylinder) do Quest Browser, Android XR Chrome and Safari 27 support in October 2026? How much sharper is a record panel on a quad layer than as SDF text in the scene, measured with Kilpeläinen and Häkkinen's legibility method?
- At 1 m on Quest 3 and on Vision Pro, what is the smallest spine label most readers can read, and what fraction of real books are wide enough to carry it?
- Does a WebXR shelf beat a 2D shelf over the same data on neighbour uptake, relative to McKay's ≥9× physical baseline? A two-week n=1 log would give a first estimate.
- Does Krokos's immersion effect replicate on a 35+ PPD headset when the task is recalling where you placed books or papers rather than faces?
- What happens to Marble, Spark (MIT) and the World API after World Labs' AMD deal closes?
- Does Chrome on the Steam Frame expose WebXR? Did Google PC Connect for Mac ship in 2026?

## Related pages

- [VR and Spatial Computing](/environments/vr-and-spatial-computing/): the headsets, PPD, weights, prices and reading evidence this chapter builds on
- [Reading Modes and Devices](/environments/reading-modes-and-devices/): when a headset beats e-ink, a tablet or a big monitor
- [Browsing the Stacks](/finding/browsing-the-stacks/): shelf browsing in 2D, the neighbour effect and virtual-shelf prior art
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): Open Library, LC Classification and the dumps behind the build plan
- [Maps of Knowledge](/interfaces/maps-of-knowledge/): why 3D information spaces failed and what spatial layout keeps
- [The Access Ladder](/access/access-ladder/): where a pulled book should route when it isn't free
- [A Reference Architecture](/building/reference-architecture/): the catalog-and-routing back end a reading room would sit on
- [Costs and Effort](/building/costs-and-effort/): the build budgets this chapter's estimates fit into
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/): spatial interface ideas next to the others
