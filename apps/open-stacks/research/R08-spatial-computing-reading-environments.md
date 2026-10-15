# VR and spatial computing as a reading and work environment: research dossier

- **Date of research:** 2026-10-15
- **Track:** R08 (Open Stacks / CAIRN)
- **Scope:** Headsets and display glasses as places to read books, papers, textbooks and lectures for hours at a time, as of late 2026. Covers hardware (price, weight, resolution, pixels per degree, passthrough, Mac compatibility, comfort), desktop-streaming and environment software, ways to build custom environments (skyboxes, WebXR, Gaussian splats, generated worlds, native engines), the evidence on legibility, reading performance, long sessions, eye strain and spatial memory, existing spatial reading apps, and what a spatial interface could do for exploring literature that a flat screen cannot.
- **Method:** About 45 web searches, then direct fetches of primary pages: vendor spec and pricing pages, Apple, Android and Meta developer documentation, WebKit release notes, WWDC26 session pages, arXiv papers and full-text PDFs (Biener et al. 2022, Krokos et al. 2019, Cockburn and McKenzie 2002). I also read Wikipedia wikitext to recover the primary citations behind some 2026 claims, and used Semantic Scholar lookups by DOI for abstracts. **Limitation:** the web-search budget shared by every agent in this run ran out partway through. After that I could only fetch pages directly, so a few items were left unverified and are flagged as such: Meta Remote Desktop on Mac, Virtual Desktop's custom-environment format, Play For Dream specs, and SteamVR Home tooling.
- **Evidence legend:**
  - **(V)** verified on a primary source (vendor, official documentation, or the paper itself)
  - **(S)** reported by a secondary source (press, aggregator or Wikipedia)
  - **(I)** my own inference or calculation
  - Confidence is given as [~NN%] or high/medium/low. Sources older than about two years are marked *(possibly stale)*.

---

## Executive summary

1. **Resolution is still the limiting factor for reading in a headset, and it hasn't improved much.**
   - Normal 20/20 acuity is about 60 pixels per degree (PPD) (S, Wikipedia *Visual acuity*). A 27-inch 5K Studio Display at 60 cm gives about 90 PPD at its centre (I).
   - Shipping headsets sit at about 20 PPD (Quest 3S and Steam Frame), about 25 (Quest 3), about 32–37 (Galaxy XR, Bigscreen Beyond 2, Vision Pro, Meta VR Glasses), and up to 57 (Pimax Crystal Super, PC-only).
   - So text in a headset has to be **roughly 3–4× larger in visual angle** than on a good monitor (I, from Android XR's 0.6°-minimum guidance, which is written for AI display glasses rather than headsets, and the HMD legibility literature). [corrected in verification]
   - The practical consequence is that a headset gives you *more space* but not *more legible text*. The amount of readable text in view is capped by pixel count, not by field of view.
2. **Vision Pro is still the best headset for reading and working with a Mac, and it now costs more.**
   - **Price:** $3,699 (256 GB), $3,899 and $4,199 since **25 June 2026** (S, MacRumors). Apple blamed memory-chip costs; the M5 model had launched at $3,499 in October 2025.
   - **Weight:** 750–800 g on the head plus a 353 g battery (V, Apple specs).
   - **Mac Virtual Display:** free and native. It runs at up to 5K in Standard mode, 6720×2880 px in Wide, and 10240×2880 px in Ultrawide (V, Apple Support).
3. **The 2025–2026 memory-chip shortage raised prices across the category.**
   - Quest 3S: $299.99 → $349.99. Quest 3 (512 GB): $499.99 → $599.99. Both effective 19 April 2026 (V, Meta blog).
   - Steam Frame launched above $1,000, which reviewers and Wikipedia attribute to the shortage (S).
   - Immersed Visor pre-orders rose by $200 (S).
4. **Valve's Steam Frame shipped in September 2026.**
   - **Price and specs:** $1,059 (256 GB) or $1,299 (1 TB); 2160×2160 LCD per eye; 440 g in total (S/V).
   - **Strengths:** reviewers call it comfortable and praise its PC streaming. It runs SteamOS Linux, a Chrome browser and sideloaded Android APKs, which makes it the most *hackable* headset.
   - **Weaknesses for readers:** passthrough is **monochrome** (colour needs a $149 add-on), resolution is only about 20 PPD, battery life is roughly 1.5–2 hours, and there is no first-party Mac path.
5. **Meta did not announce a Quest 4 at Connect 2026 (23 September).**
   - It announced **Meta VR Glasses** instead: about 100 g on the face, **37 PPD** micro-OLED, $1,299.99, on sale in spring 2027 (V, Meta newsroom), with a tethered compute and battery puck of roughly 300 g (S, Road to VR via vr.org; Meta gives no puck weight). [corrected in verification]
   - It runs Quest software, so the Quest productivity apps should carry over (I [~80%]).
   - This is the first mainstream device whose weight and sharpness both point at multi-hour reading.
6. **Meta shut down Horizon Workrooms on 16 February 2026 (V, Meta Help Center).** Meta now points users to the "Meta Quest Remote Desktop" app and to third-party apps (V). Immersed's Visor headset, first put on pre-order in 2023, is again promised for "Black Friday" 2026 (S, a single source).
7. **visionOS 27 (shipped 14 September 2026) is the biggest change for building your own environment.** Three features matter:
   - **Personal Environments:** pick a panorama and set it as your system Environment (V, Apple Support). This is the first time a user-supplied scene works behind *all* apps, including Mac Virtual Display.
   - **Web environments in Safari:** a website can open an immersive USDZ environment *behind its own still-visible page* using `<model>` plus `requestImmersive()` (V, WebKit and WWDC26 session 320).
   - **3D Gaussian splats in RealityKit** (V).
8. **The cheapest custom reading room on Vision Pro is now a web page.**
   - The reading interface stays in HTML, so text is rendered sharply by Safari, and the room is a USDZ environment behind it (I, built from (V) facts).
   - On Quest and Android XR, WebXR works in the browser (V for Android XR; widely deployed on Quest). Inside an immersive WebXR session, though, text must be drawn in WebGL rather than the DOM.
9. **Android XR (Galaxy XR at $1,799, XREAL Aura glasses at $1,279+) runs ordinary Android apps (V),** so existing e-book and PDF readers come along without changes.
   - Galaxy XR is light-ish at 545 g plus a 302 g battery, with 3552×3840 micro-OLED per eye (V/S).
   - Mac support through Google's PC Connect had only been *promised* for 2026 when last reported (S). Virtual Desktop's streamer already supports macOS and Galaxy XR (V).
10. **Evidence on working in VR for long periods is sobering but dated.**
    - Biener et al. (2022) ran 16 people for 5 days × 8 hours on a Quest 2 (about 20 PPD) against a matched physical setup.
    - In VR, task load was about 35% higher, frustration 42% higher and eye strain 48% higher; usability (SUS) was 36% lower and perceived productivity 16% lower.
    - Two participants dropped out on day 1 with migraine, nausea and anxiety. Visual fatigue improved over the week faster in VR than in the physical condition (V, full text).
    - A 2025 interview study of 10 long-term Vision Pro users found that some work **5–8 hours a day** and said "the resolution is good enough to work with virtual text." One participant gets a headache after an hour (V, arXiv 2509.05067).
11. **Reading speed in a headset is only slightly worse; legibility is clearly worse.**
    - Kilpeläinen and Häkkinen (2023, n=29) found reading time per display about 7% longer on a 13 PPD headset than on a Varjo with a roughly 60 PPD focus area. Their single-letter legibility measures detected device differences with about 10× larger effect sizes (V).
    - Novotny and Laidlaw (IEEE VR 2024 best paper) found that critical print size falls as resolution rises, but stays larger than for physical text even on high-end systems (S).
12. **Spatial memory is the strongest argument for a spatial interface to literature, but more 3D is not automatically better.**
    - Virtual memory palaces viewed in a headset improved recall to 84.05%, against 75.24% on a desktop monitor (n=40, about 8.8 points, Oculus DK2) (V).
    - The Data Mountain (1998) beat IE Favorites for retrieving web pages, and spatial layouts were remembered months later (V/S).
    - Cockburn and McKenzie (2002) found that as freedom to place items *in depth* increased, retrieval performance **got worse** in both physical and virtual systems, and users found 3D more "cluttered" (V).
    - **Design rule:** put content on 2.5D walls and shelves, not in free 3D clouds.
13. **AI-generated and scanned environments are cheap and good enough.**
    - **Skybox AI:** 360° panoramas at $20–$140 a month; 4K, 8K or 16K exports depending on tier (V).
    - **World Labs Marble:** generated 3D worlds exportable as Gaussian splats or meshes; available since 12 November 2025 (V). World Labs **announced it is "joining AMD" on 28 September 2026** (V, blog index), which adds continuity risk.
    - **Spark 2.0** (MIT licence, three.js) streams splat worlds of 100M+ splats on the web with level of detail and runs on Quest 3 and Vision Pro (V).
    - **Google's Genie 3** is interactive at 720p and 20–24 fps, but it is not an exportable asset pipeline (V).
14. **Skybox resolution has to match the headset or the room looks soft (I).**
    - An equirectangular image W pixels wide gives W/360 PPD, so an 8K skybox is about 23 PPD (fine for Quest 3) and a 16K skybox about 45 PPD (needed for Vision Pro).
    - Skybox AI's 4K tier (about 11 PPD) will look blurry in every current headset.
15. **Display glasses and HUD glasses are a separate niche.**
    - **Optical display glasses** such as XREAL One Pro (57° FOV) and VITURE Luma or Beast ($399–$599, MacBook-compatible) give a sharp, light virtual monitor (V). By my estimate that is about 32–39 PPD (I).
    - **Meta Ray-Ban Display** ($799) has a monocular 600×600, 20°, 42 PPD HUD. Since 2026 it is open to third-party *web apps* (V/S), so a glanceable reading surface for abstracts and summaries can be prototyped with ordinary web tooling.

---

## Detailed findings

### 1. Hardware landscape (October 2026)

#### 1.1 Comparison table: headsets

| Device | Status (Oct 2026) | US price | Weight on head | Per-eye display | PPD (claimed → estimate) | FOV | Passthrough | Mac path | Multi-hour comfort notes |
|---|---|---|---|---|---|---|---|---|---|
| **Meta Quest 3S** | On sale | $349.99 (128 GB), $449.99 (256 GB) since 19 Apr 2026 (V)[28] | 514 g (S)[30] | 1832×1920 LCD, Fresnel lenses (S)[30] | 20 (Meta, quoted by Engadget)[36] | 96° H (S)[30] | Colour (S) | Virtual Desktop and Immersed streamers support macOS (V)[48][49] | Fresnel sweet spot is small and the headset is front-heavy. Cheapest way to try reading in VR. |
| **Meta Quest 3** | On sale | $599.99 (512 GB) (V)[28][29] | 515 g (S)[30] | 2064×2208 LCD, pancake (S)[30] | ~25 (Meta, quoted by vr.org)[32] | ~110°×96° (S)[32][33] | Colour, 2×4 MP (S)[30] | Same as 3S. "Meta Quest Remote Desktop" app (V)[38]; Mac support **unverified**. Windows 11 Mixed Reality Link since Dec 2024 (S)[81] | Pancake lenses are sharp edge to edge. Most comfort complaints are about weight on the face. |
| **Meta VR Glasses** | Announced 23 Sep 2026; **spring 2027** | $1,299.99 (V)[31] | ~100 g plus a ~300 g puck on an optical tether (V/S)[31][32] | 2412×2288 micro-OLED (S, UploadVR via vr.org)[32] | **37** (V)[31] | ~70°×66° (S)[32][33] | Full-colour passthrough and open sides (V)[31] | Same OS as Quest 3 per vr.org (S)[32]; Meta's announcement does not state this, though BGR reports the Quest catalogue carries over (S)[33]. Quest streaming apps are therefore likely (I [~80%]) [corrected in verification] | The first sub-150 g device with 35+ PPD from a mainstream vendor. The smaller FOV hardly matters for reading. Puck battery lasts about 3 hours (V). |
| **Apple Vision Pro (M5)** | On sale | **$3,699** (256 GB), $3,899, $4,199 since 25 Jun 2026 (S)[7] | 750–800 g with Light Seal and Dual Knit Band, plus a 353 g battery (V)[6] | About 3660×3200 micro-OLED, 23 M px in total, 7.5 µm pitch (V/S)[6][9]. M5 renders 10% more pixels in the foveated region (S)[8] | ~34 average by iFixit's estimate assuming 100° FOV; some readers argue 41–43 (S)[9] | ~100°×73° (S)[10] | Colour, 6.5 stereo MP (V)[6] | **Mac Virtual Display**: 5K Standard, 6720×2880 Wide, 10240×2880 Ultrawide (V)[11] | Heaviest device here. Reviewers manage hour-plus sessions but "not all day" (S)[8]. Some long-term users do 5–8 h a day (V)[63]. |
| **Samsung Galaxy XR** | On sale (US since Oct 2025, UK since Jul 2026) | $1,799 (V/S)[21][22]; controllers $249 | 545 g plus a 302 g battery (S)[21][22] | 3552×3840 micro-OLED, 6.3 µm (S)[21] | Not published → ~32 average (I) | 109°×100° (S)[21] | Colour, 2 high-res cameras (S)[21] | Virtual Desktop streamer supports macOS and lists Galaxy XR (V)[48]. Google PC Connect was Windows-only beta in Dec 2025, with Mac promised for 2026 (S)[23] | "Comfortable and well-balanced" (S, Android Central via [22]). Runs ordinary Android apps (V)[25]. |
| **Valve Steam Frame** | Launched 14–18 Sep 2026 via a reservation queue | $1,059 (256 GB), $1,299 (1 TB); 45 W PSU $29 extra (S)[1] | **440 g** in total, 185 g core module (V/S)[1][3] | 2160×2160 LCD, pancake (S)[1][3] | Not published → ~20 average (I) | 110°×110°, which Valve calls "conservative" (S)[2][3] | **Monochrome**. Colour needs the $149 Arcturus add-on (S)[1][2] | No first-party Mac path (I). Steam Link plus foveated streaming from a PC (S)[1] | "Possibly the most comfortable VR headset yet" (S, hands-on)[4]. Battery lasts about 1.5–2 h (S)[5]. Opens to a Linux desktop and Chrome (S)[4]. |
| **Bigscreen Beyond 2 / 2e** | Shipping | $959 / $1,159 since 2 Sep 2026 (S)[41]. Vendor page showed $1,019 / $1,219 at fetch time (V)[40] | **107 g / 108 g** (V)[40] | 2560×2560 micro-OLED (V)[40] | **32 peak** (V)[40] | 116° diagonal, 108° H (V)[40] | None | No Mac. PC VR on SteamVR with Lighthouse base stations (V/I) | Lightest premium headset. The tether and base stations make it a desk device. |
| **Pimax Crystal Super / Dream Air / Dream Air SE** | Shipping; Crystal Pro announced 6 Oct 2026 for $1,399 (S)[35] | $1,695 / $1,899 / $899 (S)[42] | Crystal Super < 1 kg; Dream Air 170 g; Dream Air SE 140 g (S)[42] | 3840×3840 QLED; 3840×3552 micro-OLED; 2560×2560 micro-OLED (S)[42] | **57** with the 106° lens, 50 at 127°, 35 at 140° (S)[42] | 106–140° depending on lens (S)[42] | Limited or optional | PC only (I) | The only near-"retina" consumer option, but it is heavy and PC-bound. Pimax shipping timelines have a history of slipping (S). |
| **Play For Dream MR** | Listed as supported by Virtual Desktop (V)[48] | **Not verified** (vendor site returned 503) | — | — | — | — | — | Virtual Desktop (V) | Treat as a gap. |
| **Immersed Visor** | Pre-order since 2023; ship date now "Black Friday" 2026 (S, single source)[51] | $699.99 upfront plus Visor Plus membership: $39.99/mo × 24, $59.99/mo × 12, or $1,349.98 prepaid (S)[51] | "Lighter than a smartphone" (V)[50]; 6 oz (S)[51] | "4K per eye" (V)[50] | Not published | 100° (V)[50] | — | Mac, Windows, Linux (V)[50] | A history of missed dates: March 2025 and others (S)[52]. Treat as speculative. |

**Notes on the PPD column (I).**
- Vendors quote *peak* or centre PPD. Simple averages (horizontal pixels divided by horizontal FOV) are lower: Quest 3 is 2064/110 ≈ 19 average against Meta's 25 claim; Steam Frame is 2160/110 ≈ 20; Galaxy XR is 3552/109 ≈ 33; Vision Pro is 3660/100 ≈ 37.
- For reading, centre PPD is what counts, because you look at text through the lens centre.

#### 1.2 Comparison table: glasses

| Device | Status | US price | Weight | Display | PPD | FOV | Mac | Reading relevance |
|---|---|---|---|---|---|---|---|---|
| **XREAL Aura** (Android XR, formerly Project Aura) | Pre-orders for reservation holders; shipping "soon" in US, CA, JP, KR; wider release 2027 (V/S)[43][44] | $1,279 (12 GB/256 GB), $1,499 (16 GB/512 GB) (V/S)[43] | < 95 g glasses plus a compute puck (Snapdragon Reality Elite) (S)[43][44] | 1920×1200 per eye, optical see-through (S)[45] | ~32 (I) | 70° (S)[43][45] | The puck has a DisplayPort input, so it can act as an external display (S)[45]. Mac not confirmed | Google Play on the puck means Android readers work. See-through optics dim the world (S)[45]. |
| **XREAL One Pro** | On sale | Not verified | Not verified | 0.55" Sony micro-OLED, 120 Hz (V)[46] | ~38–39 if 1920×1080 per eye (I) | 57° (V)[46] | Yes, via USB-C DP Alt Mode (V)[46] | 3DoF/6DoF anchored screen (X1 chip, 3 ms motion-to-photon) (V)[46]. A good "private monitor" for reading on trains and planes. |
| **VITURE Luma / Luma Pro / Luma Ultra / The Beast** | On sale (news items dated Aug 2026) | $399 / $499 / $599 / $549 (V)[47] | Not stated | The Beast reaches 1,210 nits (V)[47] | ~35–40 (I) | ~50–58° (I; the vendor page showed a placeholder) | "MacBook and Windows" for some features (V)[47] | Ultrawide, Anchor and Smooth Follow modes (V)[47]. |
| **Meta Ray-Ban Display** | On sale in the US; CA$1,149, £749, €899 abroad (S)[34] | $799 (V)[36] | Not stated | 600×600 **monocular** HUD (S) | **42** (V, Meta via Engadget)[36] | 20° (S) | n/a | 6 h mixed-use battery; Neural Band EMG input (V)[36]. Third-party **web apps** and a mobile Device Access Toolkit (V)[37]. Good for glanceable summaries and RSVP, not for pages of text (I). |

**Gap:** I could not verify current Rokid models or prices this session.

#### 1.3 What the hardware means for reading (I)

- **Pixel count limits how much text you can read at once (I).**
  - Comfortable reading needs roughly 0.7–1.2° per em: Android XR's typography guide for AI (display) glasses, not headsets, recommends 0.7–0.9° with a 0.6° floor (V)[27] [corrected in verification], Solum (2019) 1.2–1.3° comfortable and 0.8–0.92° minimum, and Dingler et al. (2018) 1.8° (via [66]).
  - A 66-character line at about 1° per em is about 30–35° wide. One comfortable "page" therefore takes up most of your central vision.
  - On a 27-inch 4K monitor at 60 cm, 16 px body text is about 0.24° per em, so the same line is only about 8° wide and 4–6 pages fit side by side. In a headset you get roughly *one or two sharply readable pages in your fovea at a time*, with more space around them.
- **The "10K" Mac Virtual Display is a frame buffer, not what reaches your eye.** The ultrawide buffer is 10240×2880 virtual pixels, but each eye gets roughly 3660 horizontal panel pixels across about 100° of view. You see the window wrapped around you at about 34–41 PPD and turn your head to read different parts. Apple credits foveated rendering for the "10K" claim (V)[12].
- **Weight decides how long you can stay in.**
  - The range today: Vision Pro about 1,100 g including the battery but with only 750–800 g on the head; Galaxy XR 545 g; Quest 3 515 g; Steam Frame 440 g; Beyond 2 107 g; Meta VR Glasses about 100 g.
  - The 2025 Vision Pro study found that comfort is subjective and that third-party straps are common: 4 of 10 users had one and one user built his own (V)[63].
- **Passthrough quality matters if you also read paper or take handwritten notes.** Interviewees said reading physical text through passthrough is limited even on Vision Pro, and asked for better passthrough resolution (V)[63]. Steam Frame's monochrome passthrough rules it out for mixed paper and virtual workflows unless you buy the add-on (S)[2].

### 2. Software: desktop streaming, work environments and their status

| Software | Platforms | Mac support | Price | Status (Oct 2026) | Custom environments | Notes |
|---|---|---|---|---|---|---|
| **Mac Virtual Display** (Apple) | Vision Pro | Native. Apple silicon is needed for Wide and Ultrawide (macOS 15.2+, visionOS 2.2+) (V)[11] | Free | Active. visionOS 27 adds a one-tap widget and Spatial Preview for 3D models (V)[14] | Works with any system Environment, now including **Personal Environments** (V)[14] | Only the Mac's main display is shown; one Mac at a time (V)[11]. Audio comes through the headset (V)[11]. |
| **Virtual Desktop** (Guy Godin) | Quest 1/2/3/3S/Pro, Pico 3/4/4 Ultra, Vive Focus/XR Elite, Play For Dream MR, **Galaxy XR** (V)[48] | Streamer runs on macOS, but SteamVR and Rift games need Windows (V)[48] | Paid app (price not verified) | Active, version 1.34.22 (V)[48] | Supports custom environments and 360 backgrounds (**unverified this session**; format details not confirmed) | Vision Pro and Steam Frame are not among the listed supported headsets (V)[48]; that it is unavailable on them is inferred from their absence (I). [corrected in verification] |
| **Immersed** | Quest 2/3/Pro, Pico 3/4, **Vision Pro**, Visor (V)[49] | macOS 11+, Windows 10, Linux agents (V)[49] | Free tier plus paid; "up to 5 virtual monitors" (V)[49] | Active; Visor headset still not shipped (S)[51] | Own environments | Long-running app with a solo-work focus. |
| **Meta Quest Remote Desktop** | Quest | Windows confirmed; **Mac not verified** | Free | Recommended by Meta as the Workrooms replacement (V)[38] | Uses Horizon environments | — |
| **Windows 11 Mixed Reality Link** | Quest 3/3S | No (Windows 11) | Free | Released Dec 2024 (S)[81] *(possibly stale)* | — | Virtual monitors from a Windows PC. |
| **Meta Horizon Workrooms** | Quest | — | — | **Discontinued 16 Feb 2026**; data deleted (V)[38][39] | — | Meta names Arthur, Teams Immersive and Zoom Workplace as alternatives (V)[38]. |
| **Google PC Connect** | Galaxy XR (Android XR) | Windows-only beta as of Dec 2025, Mac "next year" (S)[23] | Free | Beta; the Mac status today is **unknown** | Android XR system environments | Pulls in a single window or the whole desktop beside Play apps, shares one keyboard and mouse, uses a Stadia-era protocol (S)[23]. |
| **Steam Link / SteamOS** (Steam Frame) | Steam Frame | No first-party path (I) | Free | Launched Sep 2026 | Unknown | Eye-tracked "foveated streaming" (S)[1]. Linux desktop and Chrome in standalone mode (S)[4]. Android APKs run if they don't need Google Play Services (S)[3]. |
| **SteamVR Home** | PC VR | No; SteamVR dropped macOS (I, high confidence) | Free | Not verified this session (dev wiki returned 403) | Workshop environments built with SteamVR Workshop Tools (from prior knowledge, medium confidence) | Mostly relevant to Bigscreen and Pimax owners. |
| **Bigscreen** (social app) | Quest, PC VR | Not verified | Free | Not verified this session | Own environments | — |

**Platform environment model (the key question: can I use my own environment with other apps' windows?)**

| Platform | Built-in environments | User-supplied environment that works system-wide | Third-party app environment | Web route |
|---|---|---|---|---|
| **visionOS 27** | Apple set; adds Thórsmörk (V)[14] | **Yes, from 27.0:** "Personal Environments allows you to choose a panorama special to you and set it as your own Environment" (V)[14]. Whether an AI-generated equirectangular image counts as a "panorama" in Photos is **untested** [~50%] | Only inside the app's own immersive space. An Apple engineer has said developers can't use the system environments in their apps (S, forum)[20]. My understanding is that other apps' windows are hidden while a Full Space is open (I, medium-high) | **Safari web environments**: a `<model>` USDZ plus `requestImmersive()`; the page stays visible in front (V)[17][18] |
| **Android XR** | System set | Not found | Apps can set a `SpatialEnvironment` (EXR skybox plus one glTF) **only in Full Space** (V)[26] | WebXR in Chrome (V)[24] |
| **Horizon OS (Quest)** | Meta set | Not confirmed this session | Inside immersive apps; Virtual Desktop and Immersed bring their own | WebXR in Quest Browser (V, Meta WebXR dev hub)[61] |
| **SteamOS (Frame)** | Unknown | Unknown | OpenXR apps | Chrome on the Linux desktop (S)[4]; WebXR status unknown |

**visionOS 26 and 27 features that matter for reading (V)[14][19]:**
- **visionOS 26 (June 2025):** **Look to Scroll**, which scrolls with your eyes and is available to developers; Safari spatial browsing that "transforms articles… hides distractions"; persistent spatial widgets.
- **visionOS 27 (14 September 2026):**
  - "Windows with curvature help you view content more comfortably in apps including Safari."
  - Panoramas can be turned into spatial scenes.
  - Personal Environments.
  - Web environments in Safari.
  - Spatial Preview from Mac Virtual Display.
  - A Mac Virtual Display widget.
- visionOS 27.0.1 was a security-only update (V)[14].

**Reading apps on spatial platforms:**
- **Kindle** is available on Vision Pro as a compatible iPad app ("Apple Vision: Requires visionOS 1.0 or later") (V)[80].
- **Android XR** says "most Android apps are compatible… without additional development effort" (V)[25], so Android e-reader, PDF and library apps (Kindle, Libby, Play Books, KOReader, Moon+) should run as panels. That is (I) [~85%]; individual developers can opt out.
- **Steam Frame** runs APKs that don't need Google Play Services (S)[3], so open-source readers such as KOReader should work (I).
- **Quest** has no Kindle app (I, medium). The browser handles web readers such as Kindle Cloud Reader, Internet Archive and Standard Ebooks (I).
- **Research prototypes with no commercial successor found:**
  - **VRDoc** (ISMAR 2022): gaze-based Select-and-Snap, MagGlass and Scroll; n=13; reading was "more efficient (p<0.01)" and "less demanding" (V)[68].
  - **Immersive Space to Think (IST)**: 17 analysts read, annotated and spatially arranged historical documents in VR, using three layout strategies (V)[75].
- **WikiVerse**, a 3D "galaxy" of Wikipedia, was unreachable (HTTP 503) during this research, so I can't vouch for its current state.

### 3. Building custom environments

#### 3.1 360° skyboxes

- **Blockade Labs Skybox AI** (V)[53]:
  - **Essential:** $24/seat/mo ($20 billed annually); 100 credits; **4K** exports.
  - **Standard:** $60 ($48 annually); 300 credits; **8K**; API key.
  - **Business:** $140/mo ($112 annually); 500 credits; **16K** plus HDRI; commercial licence.
  - **Enterprise:** custom pricing.
  - The site also advertises an MCP integration and a forthcoming "Next Generation" model (V)[53].
- **Resolution arithmetic (I):** equirectangular PPD = width ÷ 360.

  | Width | PPD | Fit |
  |---|---|---|
  | 4,096 px | 11.4 | Blurry on every headset |
  | 8,192 px | 22.8 | Fine on Quest 3S, Quest 3 and Steam Frame |
  | 16,384 px | 45.5 | Needed to look crisp on Vision Pro, Galaxy XR and Meta VR Glasses |

- A skybox has no parallax, so it feels like a "painted dome." That is fine as a backdrop to reading, but it falls apart if you lean or walk (I).
- **Delivery routes:**
  - visionOS 27 Personal Environment, if Photos accepts the image as a panorama (uncertain).
  - Virtual Desktop or Immersed custom environments on Quest, Galaxy XR and Pico (unverified details).
  - A WebXR sky sphere.
  - An Android XR `SpatialEnvironment`, which needs OpenEXR (V)[26].
  - A visionOS ImmersiveSpace.

#### 3.2 WebXR

- **Android XR Chrome** supports WebXR with these modules: Device API, AR Module, Gamepads, Hit Test, Hand Input, Anchors, Depth Sensing and Light Estimation. Hand input is the default, and camera and 3D-mapping permissions are required (V)[24].
- **Quest Browser** supports WebXR, and Meta provides the Immersive Web Emulator and Meta Quest Developer Hub (V)[61].
- **visionOS Safari** has enabled WebXR by default since visionOS 2, VR sessions only (S, Road to VR 2024 *(possibly stale)*). Safari 27 adds texture-array projection layers (V)[17].
- **Frameworks:** three.js, Babylon.js, A-Frame (1.8.0) and PlayCanvas (V)[60]. R3F with `@react-three/xr` is the React path (I).
- **The main constraint for readers (I, high confidence):** inside an immersive WebXR session the DOM is not rendered, so all text must be drawn into WebGL textures, for example SDF text via troika-three-text or canvas textures. WebXR Layers (quad layers) let the compositor sample text panels directly, which is sharper. Fully support those where they exist, and design for 0.7–1.2° per em.
- **Desktop streaming into WebXR** means doing it yourself, for example WebRTC `getDisplayMedia()` from the computer to a video texture (I). That works, but latency and text sharpness will be worse than Virtual Desktop or Mac Virtual Display.

#### 3.3 Safari web environments on visionOS 27 (new)

- **How it works (V)[18]:**
  - You need a `<model>` element (USDZ) and one call: `await model.requestImmersive()`, triggered by a user gesture.
  - Feature detection uses `document.immersiveEnabled`. State is exposed through `document.immersiveElement`, the `immersivechange` event and the `:immersive` pseudo-class.
  - The environment opens **behind Safari's window and the page stays visible**. The user can leave at any time with the Digital Crown.
  - A 360° HDR environment map can provide lighting, and video can be "docked" into the scene.
- **Performance advice (V)[18]:** use few vertices and entities, bake lighting into unlit materials, compress with `usdcrush`, and keep the model `display:none` until needed so it isn't downloaded early.
- **Why this matters (I):** it is the only route on any platform where an ordinary web reading app (HTML text rendered by the OS) sits in a custom 3D room at no cost and with no app-store review. It replaces the earlier "Spatial Backdrop" developer preview (V)[17].
- **Unknowns:** whether other apps' windows stay visible during a web environment; standardisation status (the explainer is on GitHub under WebKit and is not a W3C standard yet) (S).

#### 3.4 Gaussian splats

- **Capture:**
  - Scaniverse (Niantic Spatial) captures on iOS and Android, processes on device and exports SPZ (about 90% smaller, per the vendor) and USDZ. Pricing is behind a plans page (V)[57].
  - Polycam includes Gaussian splats on its Basic plan, $150/yr or $30/mo; it is unclear whether the free tier includes them (V)[58].
- **Editing:** SuperSplat (PlayCanvas) is free, open source (MIT) and runs in the browser. Editor 3.0 was "rebuilt on WebGPU for far bigger scenes" (V)[56].
- **Web rendering with Spark (World Labs, MIT licence, version 2.3.1 per its CDN URL) (V)[55]:**
  - Reads PLY, SPZ, SPLAT, KSPLAT and SOG.
  - Spark 2.0 (14 April 2026) adds level-of-detail streaming in a .RAD format with 64K-splat chunks, a 16M-splat GPU pool and LRU paging.
  - Its per-frame budget is 0.5–2.5M splats depending on device; demos go up to 106M splats. It runs on WebGL2 and has demos for Quest and Vision Pro (V)[54].
- **Native rendering:** RealityKit on visionOS 27 "now efficiently renders 3D Gaussian Splats" (V)[13]. Unity and Godot have third-party splat plugins (I).

#### 3.5 Generated 3D worlds

- **World Labs Marble** (V)[54]:
  - Available to everyone from 12 November 2025.
  - Inputs: text, images, video or 360° panoramas. Exports: Gaussian splats, collider meshes, high-quality meshes, or camera-controlled video.
  - World API launched 21 January 2026; Spark 2.0 and its level-of-detail streaming in April 2026.
  - **"World Labs is Joining AMD," 28 September 2026.** The announcement (https://www.worldlabs.ai/blog/amd-announcement) says World Labs has signed a definitive agreement to join AMD. Closing is expected by the end of 2026, subject to regulatory approvals, and no price is disclosed. Fei-Fei Li becomes AMD's Executive Vice President and Chief Scientist. The post says nothing about Marble, Spark or the World API. [corrected in verification]
  - Marble's pricing page didn't render for me; earlier reports of $0–$95/mo tiers are **unverified**.
- **Google Genie 3** (V)[59]: a real-time world model at 720p and 20–24 fps; environments stay consistent for "several minutes". It is available through the experimental **Project Genie**. The page doesn't mention exporting worlds, so treat it as a toy for exploration, not an asset source (I).

#### 3.6 Native engines and SDKs

- **visionOS:**
  - Stack: SwiftUI plus RealityKit and Reality Composer Pro 3. CompositorServices can be used directly by other engines on visionOS and macOS (V)[13].
  - Needs Xcode on a Mac and the Apple Developer Program ($99/yr; I, high confidence).
- **Android XR:**
  - Jetpack XR SDK Developer Preview 4 (May 2026). Unity, OpenXR, WebXR, and since May 2026 **official Godot and Unreal support** (V)[25].
  - Environments are an EXR skybox plus a `.glb`, Full Space only, with adjustable passthrough opacity from 0 to 1 (V)[26].
- **Quest and Steam Frame:** OpenXR via Unity, Godot or Unreal (I). Steam Frame's Lepton runtime also runs Android APKs (S)[1].

#### 3.7 Difficulty tiers: "build my own reading and working environment"

| Tier | What you build | Effort (solo, with Claude Code) | Cash cost | Works on | Platform constraints | What you get | Claude Code fit |
|---|---|---|---|---|---|---|---|
| **0. Configure** | Choose an environment, curve windows, turn on Look to Scroll, use Mac Virtual Display Ultrawide | 10–30 min | $0 | Vision Pro (best); Quest and Galaxy XR to a lesser degree | None | A calm, distraction-free reading space today | n/a |
| **1. Skybox** | A 360° panorama, AI-generated or photographed, used as the environment | 1–3 h | $0 (phone panorama) to $20–$112/mo (Skybox AI; 16K needs Business) | visionOS 27 Personal Environments (if accepted as a panorama); Virtual Desktop and Immersed (Quest, Galaxy XR); Android XR app (EXR); WebXR | No parallax. Resolution has to be at least 9K px for Quest 3 and 12–16K for Vision Pro (I). Lighting is static | A personal "reading room" behind real desktop windows | Good for batch-generating and upscaling skyboxes through the Skybox API |
| **2a. Safari web environment** | An HTML reading app plus a USDZ room via `requestImmersive()` | 0.5–2 days | $0 (static hosting) | **visionOS 27 only** (V) | USDZ authoring (Reality Composer Pro, Blender add-on). Whether other apps stay visible is unknown. Not yet a standard | Sharp OS-rendered text inside a custom 3D room, shareable as a URL | **Excellent**: plain web code; only the USDZ needs a Mac-side tool |
| **2b. WebXR room** | A three.js, R3F or A-Frame scene with text panels, shelves and splats | 2–5 days for a prototype; 2–4 weeks to polish | $0–$10/mo hosting | Quest Browser, Android XR Chrome, Vision Pro Safari (VR mode) (V/S) | No DOM inside the session, so text goes through SDF or canvas textures; use WebXR Layers for sharpness. Getting desktop windows in requires your own WebRTC. On Vision Pro, a full WebXR session hides other windows (I) | Cross-platform spatial library or memory-palace prototypes; the fastest way to test ideas | **Excellent**: pure JS/TS; can be tested in the Immersive Web Emulator |
| **3. Splat or generated world** | Scan your study or library with Scaniverse or Polycam, or generate with Marble; clean in SuperSplat; stream with Spark | 1–7 days | $0–$30/mo (Polycam Basic); Marble price unverified | WebXR via Spark (Quest, Vision Pro, Android XR); RealityKit on visionOS 27 | Device budgets of about 0.5–2.5M splats per frame (V). Big files, so streaming LoD is needed. Vendor risk (World Labs joining AMD) | A photoreal "place" with parallax, much stronger for spatial memory than a dome (I) | Good: Spark and three.js code; asset capture is manual |
| **4. Native app** | visionOS SwiftUI/RealityKit, Android XR Jetpack, or Unity/Godot via OpenXR | 2–8 weeks | $99/yr Apple; Google Play $25 one-time; Meta developer free (I, medium-high) | Per platform | Full Space and immersive spaces hide other apps (Android XR environments are Full Space only (V); visionOS likewise (I)). Your app must therefore include the reader, notes and LLM chat itself, or implement desktop streaming | Native text rendering, eye or gaze input, persistence, shared spaces | Medium: Swift and Kotlin are fine, but builds, signing and device testing need a human with hardware |
| **5. Streaming client or compositor** | Your own Virtual Desktop competitor, a Linux XR desktop on Steam Frame, or a custom compositor | Months | Hardware plus time | Steam Frame (Linux) is the most open (S) | Encoding latency, input bridging, store policies | Full control | Low: not recommended for a reading-tool project |

### 4. Evidence: legibility, reading, long sessions, eye strain and ergonomics

#### 4.1 Legibility and PPD

- **Retina benchmark:** 20/20 vision resolves 1 arcminute, which "correspond[s] to 60 PPD" (S, Wikipedia)[79].
- **Kilpeläinen and Häkkinen (2023), *Frontiers in VR*** (V)[66]:
  - **Setup:** 29 observers on a Varjo VR-2 (high-res focus area of about 60 PPD; 16.6 PPD outside it), a VIVE Pro Eye (13.1 PPD) and a Quest 2 (20.6 PPD).
  - **Legibility:** the Varjo was best on every measure, with effect sizes of 0.75–0.83.
  - **Reading speed:** time per one-to-two-sentence display was **6,063 ± 624 ms** on the Varjo against **6,478 ± 623 ms** on the VIVE, about 7% longer on the lower-resolution headset.
  - **Effect sizes:** legibility methods showed about 10× larger effects than reading speed.
  - **Their caution:** "legibility cannot be predicted from the nominal resolution of the display," because subpixel layout matters.
  - **Literature they cite:**
    - Hoffman et al. (2019): legibility threshold of **45 arcmin** for high-contrast letters at **13.8 PPD**, comfort limit 70.2 arcmin.
    - Solum (2019): 1.2–1.3° comfortable, 0.8–0.92° minimum.
    - Kochurova et al. (2015): comfortable size is about 2× threshold for young adults and about 3× for older readers.
- **Novotny and Laidlaw (2024), IEEE TVCG (IEEE VR best paper)** (S)[67]: across two HMDs and a CAVE, reading speed falls as text approaches each display's **critical print size** (CPS). CPS is inversely correlated with resolution, and even high-fidelity VR has a larger CPS than physical text.
- **Android XR glasses typography** (V)[27]: text must be at least **0.6°**, and 0.7–0.9° is recommended. Their worked example is 30 PPD × 0.6° = 18 px. They also advise rounded, heavier type with more letter-spacing and no condensed thin fonts.

#### 4.2 Reading performance and comprehension

- **A 2024 VR-vs-video study** (Kaplan-Rakowski and Gruber, *BJET*, n=79 English learners) found higher comprehension of captions with VR immersion. It compared against *video*, not monitors (S, search abstract only)[69].
- **A 2024 VR-vs-paper study** (Çoban et al., *PER*, n=98 undergraduates) found that the paper group outperformed the VR group on comprehension (S)[70].
- **An older HMD-vs-LCD study** (n=64) found that headset readers obtained 82% (VR) and 88% (AR) of the information that LCD readers did, and read more slowly (S, abstract only; date unclear, *possibly stale*)[71].
- **My read (I):** the evidence is thin, uses small samples and is mostly on pre-2023 hardware (≤20 PPD). No good 2025–2026 study compares reading comprehension on a 35+ PPD micro-OLED headset with a monitor. That is a real gap, and an opportunity for a self-experiment protocol.

#### 4.3 Long sessions: who actually works in VR

- **Biener et al. (2022, IEEE TVCG/ISMAR)**, "Quantifying the Effects of Working in VR for One Week" (V, full text)[62]:
  - **Setup:** 16 participants did their own real work for 5 days × 8 h in VR and 5 days × 8 h in a matched physical setup. Hardware was a Quest 2 with a Logitech K830 keyboard and a virtual curved display, deliberately "not … the best possible VR system".
  - **Self-rated differences in VR:**

    | Measure | Change in VR |
    |---|---|
    | Task load | +35% |
    | Frustration | +42% |
    | Negative affect | +11% |
    | Anxiety | +19% |
    | Eye strain | +48% |
    | System usability (SUS, below average) | −36% |
    | Flow | −14% |
    | Perceived productivity | −16% |
    | Wellbeing | −20% |

  - **Simulator sickness:** "poor" on the Stanney scale.
  - **Dropouts:** 2 on day 1 (migraine, nausea, anxiety).
  - **Change over the week:** visual fatigue fell significantly faster in VR than in the physical condition.
  - **Data:** the dataset is public on GitLab.
- **Biener, Winston, Schmalstieg and Plopski (2025)**, "Long-Term Experiences From Working with XR in the Wild" (V, arXiv HTML)[63]:
  - **Sample:** 10 Vision Pro users, each with at least 40 h of professional use over at least 6 months; ages 22–68, 9 men and 1 woman.
  - **Usage:** P5, P7, P8 and P9 work **5–8 h a day**; P3 does about 8 h a day, three days a week; the others 1–3 h several days a week.
  - **Comfort:** 6 of 10 got used to the weight; P6 can't wear it more than 1 h without a headache.
  - **Environments:** immersive environments are used to "eliminate distractions"; one user preferred a plain black background.
  - **Requests:** native apps, multiple virtual screens, saved workspaces, better passthrough for physical text, and more strap options.
- **Wienrich and Obremski (2025, IEEE TVCG)** (V, abstract)[64]: on Vision Pro, selective attention improved significantly with immersion level (high, medium, low), social presence fell, and no adverse effects on depth perception or user experience were found.
- **Tafesse (2026, *SAGE Open*)** (V, abstract)[65]: an analysis of early adopters' YouTube reviews found seven affordances, with multitasking and virtual environments as adoption drivers. (A search-snippet claim about weight and neck strain shortening sessions could not be confirmed from the abstract.)
- **Reviewers** (S)[8]: the M5 Vision Pro with the 195 g Dual Knit Band is fine for "hour-plus stretches" but is "still not a device that you're going to have on all day." Mac Virtual Display is "much closer" to Mac sharpness but not Studio Display-sharp.

#### 4.4 Eye strain, cybersickness and ergonomics

- **Vergence–accommodation conflict (VAC)** (S, Wikipedia)[77]:
  - Fixed-focus headsets make your eyes converge on content at one distance while focusing on the display's fixed plane. VAC up to about **0.4 D** is within most people's comfort zone (Shibata et al. 2011).
  - There is no consensus on lasting harm. Children under 6 are advised to avoid such displays.
- **Microsoft's comfort guidance** (V)[78] *(updated 2024; principles stable)*:
  - Immersive-headset focal distances are about **1.25–2.5 m**; keep content at 1 m or more.
  - Avoid content that moves in depth and frequent switching between near and far focus.
  - Optimal content sits **0–35° below the horizon**, with resting gaze **10–20° below**.
  - Avoid gaze angles more than 10° up or more than 60° down, and head turns more than 45° to the side.
  - Body-lock HUDs rather than head-lock them, and avoid sustained raised-arm gestures.
- **Implications for a reading layout (I):**
  - Put the main page about 1.5–2 m away, slightly below eye level, at a size that makes text about 1° per em.
  - Keep reference material within ±30–45° horizontally, use vertical space sparingly, and avoid pop-ups that jump close to the face.
  - Prefer eye-scroll (Look to Scroll) or keyboard and trackpad to mid-air pinching for long sessions.
- **Cybersickness:** mostly a problem with locomotion. Seated reading with a stationary environment is among the lowest-risk uses (I, high), but the Biener 2022 dropouts show it is not zero.

### 5. Spatial memory: what a spatial interface could add to exploring literature

- **Virtual memory palaces (Krokos, Plaisant and Varshney, *Virtual Reality*, 2019)** (V, full text)[72]:
  - 40 participants used an Oculus DK2 HMD and a 30-inch desktop monitor in a within-subjects design, recalling faces placed in a palace and a medieval town.
  - Mean recall was **84.05% in the HMD against 75.24% on the desktop** (8.8 points higher; significant with a paired t-test and Bonferroni–Holm correction). Medians were 90.48% against 78.57%, and 70% of users said the HMD helped them focus.
- **Data Mountain (Robertson et al., UIST 1998)** (V, MSR abstract)[73]: documents are placed freely on an inclined 3D plane, and the system showed "statistically reliable advantages over the Microsoft Internet Explorer Favorites mechanism." A follow-up by Czerwinski et al. found spatial memory let users retrieve pages quickly "several months after" organising them (S, as cited in [74]) *(old but foundational)*.
- **The counterpoint: Cockburn and McKenzie (CHI 2002)** (V, full text)[74]: with physical and virtual versions of a Data Mountain-like interface in 2D, 2½D and 3D, "performance deteriorated in both the physical and virtual systems as their freedom to locate items in the third dimension increased," and users found the higher-dimensional interfaces "more 'cluttered' and less efficient." An earlier study had found no difference between 2D and 3D Data Mountain versions.
- **Sensemaking with space:**
  - "Space to Think" (Andrews, Endert and North, CHI 2010) studied large high-resolution displays for sensemaking (V, title and venue via Semantic Scholar)[76].
  - Immersive Space to Think (Lisle et al., IEEE VR 2021) brought this into VR with document reading and markup and found three distinct layout strategies among 17 analysts (V, abstract)[75].
- **Synthesis (I):**
  - Spatial memory is real and exploitable. Stable, *landmarked* positions help, so a document should "live" in the same place every time.
  - Free 3D depth hurts, because occlusion and clutter cost more than the extra dimension gains.
  - The best layout is probably a room with walls, shelves and desks, where documents sit on **2D surfaces at different locations** (2.5D). It should have strong landmarks (windows, a fireplace, distinct shelves) and persist across sessions.
  - This suits an LLM-era literature tool well. Embeddings and clustering can propose *where* things go, while the user keeps control of placement so the memory is theirs.

---

## Numbers that matter

| Quantity | Value | Source | Status |
|---|---|---|---|
| Visual acuity "retina" benchmark | 1 arcmin ≈ **60 PPD** | [79] | S |
| 27-inch 5K Studio Display at 60 cm | ~90 PPD at centre | calculation (218 ppi) | I |
| Quest 3S PPD | **20** | Meta via Engadget [36] | S/V |
| Quest 3 PPD | **~25** (Meta claim) | [32] | S |
| Steam Frame PPD (average estimate) | ~20 (2160 px / 110°) | [1][3] | I |
| Bigscreen Beyond 2 peak PPD | **32** | [40] | V |
| Vision Pro PPD (estimate) | **~34** average (assumes 100° FOV) | iFixit [9] | S |
| Meta VR Glasses PPD | **37** | [31] | V |
| Meta Ray-Ban Display PPD | **42** (600×600, 20°, monocular) | [36] | S/V |
| Pimax Crystal Super PPD | **57** (106° lens) | [42] | S |
| Minimum and recommended text angle (glasses) | **0.6°** minimum; 0.7–0.9° recommended | Android XR [27] | V |
| HMD legibility threshold at 13.8 PPD | **45 arcmin** (comfort 70.2) | Hoffman 2019 via [66] | S |
| Reading time, low vs high resolution HMD | 6,478 vs 6,063 ms per display (~+7%) | [66] | V |
| Vision Pro price | **$3,699** / $3,899 / $4,199 (since 25 Jun 2026) | [7] | S |
| Vision Pro weight | 750–800 g plus 353 g battery | [6] | V |
| Mac Virtual Display Ultrawide | 5120×1440 pt = **10240×2880 px** | [11] | V |
| Galaxy XR | $1,799; 545 g plus 302 g battery; 3552×3840 per eye | [21][22] | S/V |
| Quest 3 / 3S prices | $599.99 / $349.99 (from 19 Apr 2026) | [28] | V |
| Steam Frame | $1,059 / $1,299; 440 g; 2160×2160 LCD | [1][5] | S |
| Steam Frame battery | ~1.5–2 h; Valve publishes no figure | [2][5] | S |
| Meta VR Glasses | $1,299.99; ~100 g plus ~300 g puck; spring 2027 | [31][32] | V/S |
| Bigscreen Beyond 2 / 2e | $959 / $1,159 (from 2 Sep 2026); 107 g / 108 g | [41][40] | S/V |
| XREAL Aura | $1,279 / $1,499; < 95 g; 70° FOV; 1920×1200 per eye | [43][45] | S/V |
| Workrooms shutdown | **16 Feb 2026** | [38] | V |
| visionOS 27 release | **14 Sep 2026**; 27.0.1 by 28 Sep | [15][14] | S/V |
| Safari 27 (web environments) | 17 Sep 2026 | [17] | V |
| Biener 2022 VR vs physical | Task load +35%, frustration +42%, eye strain +48%, SUS −36%, productivity −16%, wellbeing −20% | [62] | V |
| Long-term Vision Pro users | 4 of 10 work ≥5 h a day (P3 about 8 h on 3 days a week) | [63] | V |
| Memory palace recall | 84.05% (HMD) vs 75.24% (desktop), n=40 | [72] | V |
| Skybox AI tiers | $24 / $60 / $140 per month (4K / 8K / 16K) | [53] | V |
| Equirectangular PPD | width ÷ 360 (8K ≈ 23 PPD; 16K ≈ 45 PPD) | calculation | I |
| Spark 2.0 splat budget | 0.5–2.5M splats per frame; demos up to 106M splats | [54] | V |
| Genie 3 | 720p, 20–24 fps, consistent for "several minutes" | [59] | V |
| VAC comfort zone | ~0.4 D | Shibata 2011 via [77] | S |
| Optimal content zone | 1.25–5 m away (HoloLens guidance; immersive headsets have focal distances of 1.25–2.5 m, so keep content ≥1 m); 0–35° below horizon [corrected in verification] | [78] | V |

---

## Surprises and recent changes (2024–2026)

1. **Prices went up, not down.** Memory-chip costs drove increases on Quest (April 2026), Vision Pro (June 2026, +$200 on the base model), Immersed Visor pre-orders (+$200) and Steam Frame's launch price (V/S)[7][28][1]. The usual assumption that "VR hardware gets cheaper every year" broke in 2026.
2. **Meta's next headset is "VR glasses," not a Quest 4.** It weighs about 100 g and has 37 PPD micro-OLED with a tethered puck. Reporting places the Quest 4 ("Griffin") in the second half of 2027 at the earliest (S)[35].
3. **Meta gave up on its own VR office.** Workrooms was deleted on 16 February 2026, alongside Reality Labs cuts that included closing three studios and reportedly laying off about 10% of staff (V/S)[38][39].
4. **Valve made a Linux PC for your face.** Steam Frame runs SteamOS with Proton, Lepton (Android APKs without Google Play Services) and FEX, has foveated streaming, and opens to a Linux desktop and Chrome (S)[1][3][4]. At launch it also has monochrome passthrough and battery life under 2 h.
5. **Apple opened system environments to user content, and websites can now bring their own.** visionOS 27 added Personal Environments and Safari web environments (V)[14][17][18]. Until 2026, custom environments were locked inside each app's Full Space.
6. **Splats went mainstream as a web format.** Spark 2.0 brought level-of-detail streaming (100M+ splats), SuperSplat 3.0 moved to WebGPU, and RealityKit added native 3DGS in visionOS 27 (V)[54][56][13]. Scaniverse turned into a Niantic Spatial enterprise "capture" product (V)[57].
7. **World Labs (Marble, Spark) is "joining AMD"** (28 September 2026), four weeks after launching its Atlas model on 1 September 2026 (V)[54]. [corrected in verification] The announcement describes a definitive agreement expected to close by the end of 2026, subject to regulatory approval, with no price disclosed. It says nothing about what happens to consumer Marble or Spark's MIT development. [corrected in verification]
8. **Android XR glasses are arriving.** XREAL Aura opened pre-orders to reservation holders on 7 October 2026 at $1,279+, with shipping "soon" in the US, Canada, Japan and South Korea. Its 70° FOV is well above the 45–52° typical of consumer AR glasses; neither source calls it the widest so far (S)[43][45]. [corrected in verification] Meta Ray-Ban Display opened to third-party web apps (V/S)[37][34].
9. **Bigscreen cut prices** permanently, to $959 for the Beyond 2 (2 September 2026). That is unusual during the shortage (S)[41].
10. **A long-term "work in Vision Pro" population exists.** Some users report 5–8 h a day after six or more months (V)[63]. This was hypothetical in 2022.

---

## Contested or uncertain points

- **PPD figures are not comparable across vendors.** Some quote peak or centre values (Meta's 25 and 37, Bigscreen's 32 "peak"); others give nothing (Apple, Samsung, Valve). Third-party estimates depend on an assumed FOV: iFixit's 34 for Vision Pro rests on "a rough measurement of 100° FOV," and one reader argues 41–43 [9]. Treat ±20% as normal (I).
- **Vision Pro weight and FOV.** Apple says 750–800 g for M5 (V)[6], while some 2026 blogs say "under 600 g" (S, unreliable). Apple publishes no FOV.
- **Does reading in VR cost comprehension?** Results are mixed (VR beats video; paper beats VR; HMD below LCD in older studies) and there is no 2025–2026 study on modern 35+ PPD devices. [~60%] that a well-designed reading UI on a 35+ PPD headset roughly matches a monitor for comprehension, with slightly slower speed and more fatigue (I).
- **Long-term health effects of VAC** have no consensus [77]. For the 2025 heavy users there is self-report but no clinical data.
- **Is 3D good for spatial memory?** Yes for immersion and embodiment (Krokos), no for free depth placement (Cockburn). The two studies used very different tasks (faces and locations versus web-page thumbnails), so neither settles the matter.
- **Can a user's equirectangular AI skybox become a visionOS Personal Environment?** Apple says "choose a panorama." Photos identifies panoramas partly from capture metadata, so imported 2:1 images may not qualify. [~50%], so test it.
- **Ship dates:** Immersed Visor "Black Friday 2026" (single secondary source)[51]; Meta VR Glasses "spring 2027"; Pico's Project Swan pushed to Q4 2026 or February 2027 (S, conflicting)[35].
- **Mac support:**
  - Galaxy XR PC Connect for Mac had been promised for 2026 [23], and its current status is unknown.
  - Meta Remote Desktop on Mac was not verified.
  - Steam Frame has no Mac path.
  - Display glasses work over USB-C DisplayPort, but base Apple silicon chips limit the number of external displays (I).
- **Bigscreen price discrepancy:** the vendor page fetched today showed $1,019 / $1,219, while Road to VR (2 September 2026) reports a permanent cut to $959 / $1,159. A cached page is the likely explanation [~75%].
- **World Labs and AMD:** the deal terms and what happens to Marble and Spark are unknown.

---

## Implications for someone building tools to explore literature

1. **Render text with the operating system wherever possible.** At 20–37 PPD every pixel counts. OS text rendering in Safari, SwiftUI, Android views or Mac Virtual Display uses subpixel-aware rasterisation and compositor-level sampling. Custom WebGL text, especially resampled from a texture onto a tilted quad, costs sharpness. So the best ROI is a **flat web app designed for headset windows**: large type, high contrast, generous line spacing, eye-scroll friendly. Run it in Vision Pro Safari, Quest Browser or Android XR Chrome, and add the room separately: a Safari web environment, a Personal Environment, or Virtual Desktop and Immersed environments.
2. **Design in degrees, not pixels.**
   - Body text: at least 0.7°, ideally about 1.0° per em.
   - Main page: 1.5–2 m away, 10–20° below eye level.
   - Secondary panels: within ±45° horizontally.
   - Line length: 30–35° maximum.
   - Expect one or two fully legible pages in view at a time. Use the extra space for *context* (outline, citations, notes, related works) rendered in large type, not for more body text.
3. **Exploit spatial memory carefully.**
   - Give every document, author or topic a **stable home** on walls and shelves (2.5D) with landmarks.
   - Never reshuffle positions without asking. Let the user override LLM- or embedding-proposed placements.
   - Avoid free-floating 3D clouds of nodes (Cockburn 2002).
   - Make the "palace" persistent across sessions and devices: store layout as data (JSON), not in the scene.
4. **Plan for 60–120-minute sessions.** Battery life is 1.5–3 h on most devices, and comfort is "hour-plus, not all day" for heavy headsets. Build in break cues, save state instantly, and make the same corpus and layout available on a flat screen, so the headset is a *mode* and not a silo.
5. **Prefer open formats and portable assets.** Use glTF and USDZ for rooms, SPZ, PLY or SOG for splats, EXR or equirectangular images for skies, WebXR for cross-device scenes, and plain HTML for reading surfaces. The 2026 shutdowns, pivots and slips (Workrooms, World Labs joining AMD, Immersed delays) argue against depending on any one vendor's environment system.
6. **Choose the platform by your computer.**
   - **Mac users:** Vision Pro is clearly first (Mac Virtual Display plus Personal Environments plus Safari web environments). Second is Quest 3 or Galaxy XR with Virtual Desktop's macOS streamer. Display glasses (XREAL, VITURE) are the cheap portable option.
   - **Linux and tinkerers:** Steam Frame.
   - **Highest-PPD PC VR:** Pimax Crystal Super, at the cost of weight.
   - **Light and sharp:** wait for Meta VR Glasses (spring 2027).
7. **Claude Code fit.** WebXR and Safari web-environment prototypes are almost entirely web code, an ideal fit, and can be built and iterated without native toolchains. Native visionOS or Android XR work is feasible but needs a human for signing, device testing and store review.
8. **LLMs make the spatial layer cheap to populate.** Use embeddings for topic placement, LLM-written "spine blurbs" and summaries in large type for the periphery, and a vision LLM to read your physical shelf from a splat or photo. Generated skies and worlds (Skybox AI, Marble) make "one room per subject" practical.

---

## Ideas sparked

1. **Stacks Palace (WebXR + Spark).**
   - A persistent, splat-scanned or Marble-generated library room. Each wall is a discipline and each shelf a cluster from embedding plus HDBSCAN.
   - Books and papers are spines with LLM-written blurbs at 1° type. Pull a spine to open the full text as a 2D quad layer at 1.8 m.
   - Positions are stored as JSON and never auto-shuffled. The user "re-shelves," and the LLM only suggests.
   - Runs on Quest, Android XR and Vision Pro from one URL.
2. **Personal Environment pack generator.** A CLI built with Claude Code that turns a reading list ("Russian novels of the 1860s", "Bayesian statistics") into 16K equirectangular skyboxes via the Skybox AI API, adds a calm-lighting pass, and exports:
   - a 2:1 JPEG for visionOS 27 Personal Environments,
   - an EXR for an Android XR `SpatialEnvironment`,
   - a sky-sphere for WebXR.
3. **Safari "reading room" web app (visionOS 27).**
   - The reading interface is plain HTML (EPUB or HTML from Project Gutenberg, Standard Ebooks and arXiv HTML), so text stays OS-sharp.
   - A "Enter room" button calls `requestImmersive()` on a light USDZ study. The room is baked-lit, low-poly and loaded only on demand.
   - Rooms change with the book's setting. A "focus" room is pure black, which one long-term user asked for.
4. **Citation horizon.**
   - The current paper sits front and centre. References are a low band of cards at 20–35° below the horizon, ordered by publication year from left to right.
   - Citing papers sit along the upper edge, faint.
   - Gaze plus dwell (VRDoc-style MagGlass) previews a card. Pinch pins it to a side wall, so a reading session leaves behind a spatial trace of what you looked at.
5. **Data Mountain 2026 for papers.** A sloped desk surface where you toss papers (thumbnail plus LLM title). It is 2.5D, with height used only for "importance," and keeps hard limits on overlap to avoid clutter. Retrieval combines spatial recall with semantic search: "it was on the left, near the Kahneman pile."
6. **Ultrawide abstract wall (no 3D needed).** A Mac web app sized for Mac Virtual Display Ultrawide (10240×2880). It shows a 6×40 grid of abstracts with LLM one-line takeaways and a forecasting-style "how likely is this to change my view" score. You read by turning your head. It is the cheapest high-value spatial tool, because it is just a wide web page.
7. **Belief map room** (aimed at forecasters).
   - Claims extracted by an LLM from a corpus become placards on the walls of a room, grouped by question.
   - Opacity encodes credence, colour encodes direction of evidence, and string-lines link claims to sources.
   - Walking the room becomes a structured literature review. Exports to a flat Markdown or CSV "evidence ledger."
8. **Splat your real bookshelf.**
   - Scan your shelves with Scaniverse or Polycam. A vision LLM OCRs the spines and matches them to Open Library, Internet Archive or HathiTrust records.
   - In VR, tapping a physical spine in the splat opens the free digital copy or the best legal access route.
   - Your physical collection becomes a navigable index to the world's open stacks.
9. **Lecture amphitheatre.** A generated lecture hall where an Internet Archive or YouTube lecture plays on the main screen. The live transcript flows on a side panel in large type, and an LLM "note-taker" pins key definitions to a chalkboard that persists across lectures in the course.
10. **Glance-reader for Ray-Ban Display.** A Meta web app that serves 1–3 sentence summaries, flashcards or RSVP of abstracts on the 42 PPD, 20° HUD, controlled by Neural Band swipes. Triage happens on walks; full reading happens later at the desk or in the headset. The queue is synced through a simple API.
11. **Session hygiene layer.** An overlay for any of these apps that times sessions, nudges 20-20-20 breaks by slowly dimming the environment, logs reading time and comprehension self-ratings, and builds your own n=1 dataset comparing headset and monitor reading (filling the evidence gap noted above).
12. **Shared seminar room.** One Safari web-environment URL (Vision Pro) or WebXR room (Quest and Android XR) where a reading group sees the same text panel and a shared annotation layer stored in a small database. No app store or accounts: just a link and a passage.
13. **Peripheral "context field."** Main text in the centre. In the periphery, at 2–3× size and low contrast, a live LLM-generated outline, glossary of terms just encountered, and "you've seen this idea before in X" back-links. Peripheral vision has poor acuity, so these elements are large and pre-attentive, and they cost no foveal attention until glanced at.
14. **One-room-per-book memory rooms.** For deep reads, generate a small Marble world per book. Chapter notes become objects placed along a path, so revisiting the book means walking the path (a method of loci for the book's argument). Krokos-style recall testing could be built in.

---

## Sources

1. Steam Frame — Wikipedia (wikitext; cites Digital Foundry 14 Sep 2026, UploadVR, PC Gamer, Engadget) — https://en.wikipedia.org/wiki/Steam_Frame — accessed 2026-10-15
2. Steam Frame Specs: Full Hardware Spec Sheet — vr.org — https://vr.org/steam-frame-specs — Oct 2026
3. Valve Steam Frame official announcement details — UploadVR — https://www.uploadvr.com/valve-steam-frame-official-announcement-features-details/ — 2025-11-12
4. Valve Steam Frame hands-on impressions — UploadVR — https://www.uploadvr.com/valve-steam-frame-hands-on-impressions/ — 2025-11-12
5. Valve Steam Frame review — Engadget — https://www.engadget.com/2257659/valve-steam-frame-review/ — 2026-09-14
6. Apple Vision Pro — Tech Specs — Apple — https://www.apple.com/apple-vision-pro/specs/ — accessed 2026-10-15
7. Apple Vision Pro Just Got Even More Expensive — MacRumors — https://www.macrumors.com/2026/06/25/apple-vision-pro-just-got-even-more-expensive/ — 2026-06-25
8. M5 Vision Pro, Dual Knit Band, PSVR2 controller review — Six Colors — https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/ — 2025-10-21
9. Vision Pro Teardown Part 2: What's the Display Resolution? — iFixit — https://www.ifixit.com/News/90409/vision-pro-teardown-part-2-whats-the-display-resolution — 2024-02-07 *(possibly stale; M2 hardware, same panels)*
10. Apple Vision Pro — Wikipedia (wikitext) — https://en.wikipedia.org/wiki/Apple_Vision_Pro — last edited 2026-09-15
11. Use your Mac with Apple Vision Pro — Apple Support — https://support.apple.com/118521 — published 2026-09-14
12. visionOS 2.2 ultrawide Mac Virtual Display — UploadVR — https://www.uploadvr.com/visionos-2-2-ultrawide-mac-virtual-display/ — 2024-12-11
13. What's new in visionOS 27 — Apple Developer — https://developer.apple.com/visionos/whats-new/ — 2026
14. About visionOS 27 Updates — Apple Support — https://support.apple.com/en-ae/149067 — 2026-09-28
15. visionOS 27 is here for Apple Vision Pro — 9to5Mac — https://9to5mac.com/2026/09/14/visionos-27-is-here-for-apple-vision-pro-with-these-new-features/ — 2026-09-14
16. visionOS 27 announced — 9to5Mac — https://9to5mac.com/2026/06/08/visionos-27-announced-with-new-features-for-vision-pro/ — 2026-06-08
17. WebKit Features for Safari 27.0 — WebKit blog — https://webkit.org/blog/18325/webkit-features-for-safari-27-0/ — 2026-09-17
18. Explore immersive website environments in visionOS (WWDC26 session 320) — Apple Developer — https://developer.apple.com/videos/play/wwdc2026/320/ — 2026-06
19. visionOS 26 introduces powerful new spatial experiences — Apple Newsroom — https://www.apple.com/newsroom/2025/06/visionos-26-introduces-powerful-new-spatial-experiences-for-apple-vision-pro/ — 2025-06-09
20. Use visionOS environments during active immersive space? — Apple Developer Forums — https://developer.apple.com/forums/thread/763758 — undated (search result) *(possibly stale)*
21. Samsung Galaxy XR price, specs and release date — Road to VR — https://roadtovr.com/samsung-galaxy-xr-headset-price-specs-release-date/ — 2025-10-21
22. Galaxy XR — Wikipedia — https://en.wikipedia.org/wiki/Galaxy_XR — accessed 2026-10-15
23. Galaxy XR gets PC Connect, Likeness, Travel Mode — 9to5Google — https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/ — 2025-12-08
24. Develop for the web on Android XR (WebXR) — Android Developers — https://developer.android.com/develop/xr/web — accessed 2026-10-15
25. Android XR developer hub — Android Developers — https://developer.android.com/xr — accessed 2026-10-15 (references May 2026 posts)
26. Add spatial environments (Jetpack XR SDK) — Android Developers — https://developer.android.com/develop/xr/jetpack-xr-sdk/add-environments — accessed 2026-10-15
27. Typography for AI glasses — Android Developers — https://developer.android.com/design/ui/ai-glasses/guides/styles/type?hl=en — accessed 2026-10-15
28. An Update on Meta Quest Pricing — Meta — https://www.meta.com/blog/update-meta-quest-pricing/ — 2026-04-16
29. Meta Quest 3 product page — Meta — https://www.meta.com/quest/quest-3/ — accessed 2026-10-15
30. Meta Quest 3 and Meta Quest 3S — Wikipedia (wikitext) — https://en.wikipedia.org/wiki/Meta_Quest_3 and https://en.wikipedia.org/wiki/Meta_Quest_3S — accessed 2026-10-15
31. Introducing Meta VR Glasses — Meta Newsroom — https://about.fb.com/news/2026/09/introducing-meta-vr-glasses-3d-movies-immersive-live-sports-100-grams/ — 2026-09-23
32. Phoenix arrives as Meta VR Glasses — vr.org — https://vr.org/articles/meta-vr-glasses-phoenix-1299-spring-2027-puck-2026 — 2026-09-23
33. Meta's $1,299 VR Glasses — BGR — https://www.bgr.com/2268374/meta-vr-glasses-solved-the-vr-form-factor/ — 2026-09-26
34. Meta Connect 2026: everything announced — vr.org — https://vr.org/meta-connect-2026 — 2026-09
35. Upcoming VR headsets 2026 — vr.org — https://vr.org/upcoming-vr-headsets-2026 — updated 2026-10-07
36. Meta Ray-Ban Display glasses offer an AR display for $799 — Engadget — https://engadget.com/wearables/meta-ray-ban-display-glasses-offer-an-ar-display-for-799-002921925.html — 2025-09-17
37. Meta Wearables developer center — Meta — https://developers.meta.com/wearables/ — accessed 2026-10-15
38. Meta Horizon Workrooms is being discontinued — Meta Help Center — https://www.meta.com/en-gb/help/quest/2464765133873078/ — 2026-01
39. Meta is deleting Horizon Workrooms next month — Road to VR — https://www.roadtovr.com/meta-horizon-workrooms-discontinued-2026 — 2026-01-16
40. Bigscreen Beyond 2 / 2e — Bigscreen — https://www.bigscreenvr.com/ — accessed 2026-10-15
41. Bigscreen drops Beyond 2 price to $959 — Road to VR — https://roadtovr.com/?p=231777 — 2026-09-02
42. Pimax — Wikipedia (spec table; cites pimax.com, accessed 2026-09-05) — https://en.wikipedia.org/wiki/Pimax — accessed 2026-10-15
43. Xreal's Aura Android XR smartglasses will cost you at least $1,279 — Engadget — https://www.engadget.com/2279737/xreals-aura-android-xr-smartglasses-will-cost-you-at-least-1279/ — 2026-10-07
44. XREAL AURA starts at $1,279 — Android Headlines — https://www.androidheadlines.com/2026/10/xreal-aura-starts-at-1279-but-theres-a-catch-if-you-want-one-this-year.html — 2026-10-08
45. XREAL AURA brings 70-degree Android XR glasses — TechTimes — https://www.techtimes.com/articles/319140/20260626/xreal-aura-brings-70-degree-android-xr-glasses-mwc-shanghai-fall-2026-launch-confirmed.htm — 2026-06-26
46. XREAL One Pro — XREAL — https://www.xreal.com/one-pro — accessed 2026-10-15
47. VITURE product lineup — VITURE — https://www.viture.com/ — accessed 2026-10-15
48. Virtual Desktop — vrdesktop.net — https://www.vrdesktop.net/ — accessed 2026-10-15
49. Immersed — immersed.com — https://immersed.com/ — accessed 2026-10-15
50. Visor — visor.com — https://visor.com/ — accessed 2026-10-15
51. Hardware announcements for October 5–9 — MacTech — https://www.mactech.com/2026/10/09/hardware-announcements-for-october-5-9/ — 2026-10-09
52. Immersed Visor public demos set for September — UploadVR — https://www.uploadvr.com/immersed-visor-public-demos-set-for-september/ — 2024-05-29 *(possibly stale)*
53. Blockade Labs (Skybox AI) and membership pricing — https://www.blockadelabs.com/ and https://skybox.blockadelabs.com/membership — accessed 2026-10-15
54. World Labs: home, blog index, Marble launch, Spark 2.0 — https://www.worldlabs.ai/ ; https://www.worldlabs.ai/blog ; https://www.worldlabs.ai/blog/marble-world-model (2025-11-12) ; https://www.worldlabs.ai/blog/spark-2.0 (2026-04-14) — accessed 2026-10-15
55. Spark (3D Gaussian Splatting renderer for three.js) — https://sparkjs.dev/ and https://github.com/sparkjsdev/spark — accessed 2026-10-15
56. SuperSplat — https://github.com/playcanvas/supersplat and https://superspl.at/ — accessed 2026-10-15
57. Scaniverse / Niantic Spatial Capture — https://www.nianticspatial.com/products/capture — accessed 2026-10-15
58. Polycam pricing — https://poly.cam/pricing — accessed 2026-10-15
59. Genie 3 — Google DeepMind — https://deepmind.google/models/genie/ — accessed 2026-10-15
60. A-Frame (1.8.0) and Immersive Web Dev — https://aframe.io/ ; https://immersiveweb.dev/ — accessed 2026-10-15
61. Meta Horizon OS WebXR developer hub — https://developers.meta.com/horizon/develop/web/ — accessed 2026-10-15
62. Biener et al., "Quantifying the Effects of Working in VR for One Week" (IEEE TVCG 28(11), 2022) — https://arxiv.org/abs/2206.03189 — 2022-06 *(older than 2 years; hardware is dated, findings foundational)*
63. Biener, Winston, Schmalstieg, Plopski, "Long-Term Experiences From Working with Extended Reality in the Wild" — https://arxiv.org/abs/2509.05067 (HTML: https://arxiv.org/html/2509.05067) — 2025-09-05
64. Wienrich & Obremski, "Immersion, Attention, and Collaboration in Spatial Computing… Apple Vision Pro" (IEEE TVCG 2025) — https://doi.org/10.1109/tvcg.2025.3549145 — 2025
65. Tafesse, "The User Affordances of Apple Vision Pro: Insights from Early Adopters" (SAGE Open 2026) — https://doi.org/10.1177/21582440261464433 — 2026
66. Kilpeläinen & Häkkinen, "An effective method for measuring text legibility in XR devices…" (Frontiers in VR 4, 2023) — https://frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1243387/full — 2023-09-07
67. Novotny & Laidlaw, "Evaluating Text Reading Speed in VR Scenes and 3D Particle Visualizations" (IEEE TVCG / IEEE VR 2024 best paper) — https://www.vrvis.at/en/news-events/events/186-evaluating-text-reading-speed-in-vr-scenes-and-3d-particle-visualizations-ieee-vr-2024-best-paper and https://cs.brown.edu/news/2024/03/18/brown-cs-phd-alum-johannes-novotny-and-david-laidlaw-receive-ieee-vr-best-paper-award/ — 2024
68. Lee, Healey, Manocha, "VRDoc: Gaze-based Interactions for VR Reading Experience" (ISMAR 2022) — https://arxiv.org/abs/2211.03001 — 2022-11-06 *(possibly stale)*
69. Kaplan-Rakowski & Gruber, "An experimental study on reading in high-immersion virtual reality" (BJET 2024) — https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13392 — 2024 (abstract via search only)
70. Çoban et al., "Comparing Realities: … VR versus Paper-Based Reading" (PER 11(4), 2024) — https://dergipark.org.tr/en/pub/per/article/1453241 — 2024-07 (search only)
71. "Reading text in an immersive head-mounted display" — https://www.academia.edu/80876571/Reading_text_in_an_immersive_head_mounted_display — date unclear (search snippet only) *(possibly stale)*
72. Krokos, Plaisant, Varshney, "Virtual memory palaces: immersion aids recall" (Virtual Reality 23, 2019; open access) — https://link.springer.com/content/pdf/10.1007/s10055-018-0346-3.pdf — 2018/2019 *(old but foundational)*
73. Robertson et al., "Data Mountain: Using Spatial Memory for Document Management" (UIST 1998) — https://www.microsoft.com/en-us/research/publication/data-mountain-using-spatial-memory-for-document-management/ — 1998 *(old but foundational)*
74. Cockburn & McKenzie, "Evaluating the Effectiveness of Spatial Memory in 2D and 3D Physical and Virtual Environments" (CHI 2002) — http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf — 2002 *(old but foundational)*
75. Lisle, Davidson, Gitre, North, Bowman, "Sensemaking Strategies with Immersive Space to Think" (IEEE VR 2021) — https://www.semanticscholar.org/paper/d9177cf8b3a0a82a6f60cd66319c65a39273168b (DOI 10.1109/VR50410.2021.00077) — 2021 *(possibly stale)*
76. Andrews, Endert, North, "Space to Think: Large High-Resolution Displays for Sensemaking" (CHI 2010) — https://www.semanticscholar.org/paper/c64863301f4ae0ab4971c14d8bfb7591d3d885f4 (DOI 10.1145/1753326.1753336) — 2010 *(old but foundational)*
77. Vergence–accommodation conflict — Wikipedia (cites Shibata et al. 2011, J. Vision) — https://en.wikipedia.org/wiki/Vergence%E2%80%93accommodation_conflict — accessed 2026-10-15
78. Comfort — Mixed Reality design guidance — Microsoft Learn — https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort — updated 2024-06-28 *(possibly stale, principles stable)*
79. Visual acuity — Wikipedia — https://en.wikipedia.org/wiki/Visual_acuity — accessed 2026-10-15
80. Amazon Kindle — App Store listing (Apple Vision compatibility) — https://apps.apple.com/us/app/amazon-kindle/id302584613 — accessed 2026-10-15
81. Windows Mixed Reality — Wikipedia (Mixed Reality Link, Dec 2024; cites Windows Central) — https://en.wikipedia.org/wiki/Windows_Mixed_Reality — accessed 2026-10-15
82. Galaxy XR held launch price (March 2026) — SamMobile — https://www.sammobile.com/?p=16649258 — 2026-03-09 (search snippet only)

---

## Verification pass (independent)

An independent fact-check on 2026-10-15. For each load-bearing claim I re-opened the cited source and, where I could, a second source. Papers were checked against their full text (arXiv PDF and HTML, the Springer PDF, the Frontiers HTML, the CHI 2002 PDF), DOIs through Crossref, and the Spark licence through its GitHub LICENSE file and npm metadata. **Limitation:** the shared web-search budget was already used up when this pass started, so independent checking relied on direct fetches of primary and secondary pages, not open searches. A newer contradicting report that only a search would turn up could have been missed.

| # | Claim | Verdict | Correction / note | Source |
|---|---|---|---|---|
| 1 | Vision Pro (M5) prices rose on 25 Jun 2026 to $3,699 / $3,899 / $4,199 from a $3,499 base, because of memory-chip costs | Confirmed | Apple's US store page source now lists $3,699.00 / $3,899.00 / $4,199.00, so this can be upgraded from (S) to (V). The cost explanation is Tim Cook's remark about memory and storage chips for the whole lineup, not a statement specific to Vision Pro. | https://www.macrumors.com/2026/06/25/apple-vision-pro-just-got-even-more-expensive/ ; https://www.apple.com/shop/buy-vision/apple-vision-pro |
| 2 | 750–800 g with Light Seal and Dual Knit Band; 353 g battery; 23M px; 7.5 µm; 90–120 Hz | Confirmed | Refresh rates are 90, 96, 100 and 120 Hz. | https://www.apple.com/apple-vision-pro/specs/ |
| 3 | Mac Virtual Display: 5K Standard; Wide 3360×1440 pt (6720×2880 px); Ultrawide 5120×1440 pt (10240×2880 px); macOS 15.2+ and visionOS 2.2+ | Confirmed | Page published 14 Sep 2026. Intel Macs are limited to 3K Standard. | https://support.apple.com/118521 |
| 4 | visionOS 27: Personal Environments, Safari web environments, curved windows, Mac Virtual Display widget; 27.0.1 security-only (28 Sep 2026) | Confirmed | Wording matches. 9to5Mac confirms release on 14 Sep 2026. | https://support.apple.com/en-ae/149067 ; https://9to5mac.com/2026/09/14/visionos-27-is-here-for-apple-vision-pro-with-these-new-features/ |
| 5 | Safari 27: `<model>` plus `requestImmersive()` on a user gesture; the environment opens behind Safari and the page stays visible | Confirmed | The WebKit 27.0 notes (17 Sep 2026) confirm the Immersive API replaces Spatial Backdrop. | https://developer.apple.com/videos/play/wwdc2026/320/ ; https://webkit.org/blog/18325/webkit-features-for-safari-27-0/ |
| 6 | Quest prices from 19 Apr 2026: 3S 128 GB $349.99, 3S 256 GB $449.99, Quest 3 512 GB $599.99; memory chips | Confirmed | Post dated 16 Apr 2026. | https://www.meta.com/blog/update-meta-quest-pricing/ |
| 7 | Meta VR Glasses: $1,299.99, spring 2027, ~100 g, tethered puck, micro-OLED 37 PPD, up to 3 h playback, same OS as Quest 3 | Corrected | The primary source confirms the price, spring 2027, ~100 g, an optical-tether puck for compute, battery and storage, micro-OLED, 37 PPD and up to 3 h of playback. It does **not** say "same OS as Quest 3": that comes from vr.org (S), and BGR reports the Quest catalogue carries over. The ~300 g puck and 70°×66° FOV are secondary (Road to VR via vr.org and BGR), as stated. Fixed inline. | https://about.fb.com/news/2026/09/introducing-meta-vr-glasses-3d-movies-immersive-live-sports-100-grams/ ; https://vr.org/articles/meta-vr-glasses-phoenix-1299-spring-2027-puck-2026 ; https://www.bgr.com/2268374/meta-vr-glasses-solved-the-vr-form-factor/ |
| 8 | Workrooms discontinued 16 Feb 2026, data deleted; Meta recommends Meta Quest Remote Desktop and third-party apps | Confirmed | Remote Desktop is suggested for desktop use. Arthur, Microsoft Teams Immersive and Zoom Workplace are suggested for meetings. | https://www.meta.com/en-gb/help/quest/2464765133873078/ |
| 9 | Steam Frame: Sep 2026; $1,059 / $1,299; 2160×2160 LCD, pancake; 440 g (185 g core); monochrome passthrough; SteamOS plus APKs; foveated streaming | Confirmed | Pre-orders opened 14 Sep and release was 18 Sep. The 440 g figure includes the facial interface, strap and battery. Engadget confirms the price, 440 g, monochrome cameras and about 1.5–2 h of battery. | https://en.wikipedia.org/wiki/Steam_Frame ; https://vr.org/steam-frame-specs ; https://www.engadget.com/2257659/valve-steam-frame-review/ |
| 10 | Galaxy XR $1,799; 545 g plus 302 g battery; 3552×3840 micro-OLED; 109°×100° | Confirmed | Road to VR rounds the price to $1,800, and Wikipedia gives US$1,799. No later price change was found by direct fetch. | https://roadtovr.com/samsung-galaxy-xr-headset-price-specs-release-date/ ; https://en.wikipedia.org/wiki/Galaxy_XR |
| 11 | Beyond 2: 107 g, 2560×2560, 32 peak PPD; cut on 2 Sep 2026 to $959 / $1,159; vendor showed $1,019 / $1,219 | Confirmed | Road to VR (2 Sep 2026) calls the cut permanent. The vendor page still renders "From $1019" and "From $1219" on 15 Oct, so the discrepancy remains unresolved. The vendor gives 5120×2560 combined, which is 2560×2560 per eye. | https://roadtovr.com/?p=231777 ; https://www.bigscreenvr.com/ |
| 12 | Biener et al. 2022: n=16, 5 d × 8 h, Quest 2; +35% / 42% / 11% / 19% / 48%; −36% / 14% / 16% / 20%; 2 dropouts on day 1 | Confirmed | Every percentage matches the full text, as do the Quest 2 and K830 hardware. | https://arxiv.org/abs/2206.03189 |
| 13 | Long-term Vision Pro study: 10 users, ≥40 h of professional use, ≥6 months; several work 5–8 h a day; one can't exceed 1 h without a headache; resolution good enough for text | Confirmed | P5, P7, P8 and P9 use it daily for "at least five hours, some up to eight". P6 gets a headache after an hour. "The resolution is good enough to work with virtual text." | https://arxiv.org/abs/2509.05067 |
| 14 | Memory palace: Oculus DK2 vs desktop, n=40, 84.05% vs 75.24% | Confirmed | The paper calls the difference "8.8% higher"; it is 8.8 percentage points. Paired t-test with Bonferroni–Holm correction. | https://link.springer.com/content/pdf/10.1007/s10055-018-0346-3.pdf |
| 15 | Cockburn and McKenzie 2002: performance deteriorated as 3D freedom increased; 3D seen as more cluttered | Confirmed | Quoted wording verified in the PDF. | http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf |
| 16 | Kilpeläinen and Häkkinen 2023: n=29; 6,063 ms (Varjo, ~60 PPD focus) vs 6,478 ms (VIVE Pro Eye, 13.1 PPD); legibility effects ~10× larger | Confirmed | "Approximately ten times higher" effect size, verified in the full text. | https://frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1243387/full |
| 17 | Android XR typography: ≥0.6° (30 PPD × 0.6° = 18 px), 0.7–0.9° recommended | Corrected (scope) | The numbers are right, but the page is the **AI glasses** (display glasses) typography guide, not guidance for headsets. Where the dossier applied it to headsets, the text now says so. | https://developer.android.com/design/ui/ai-glasses/guides/styles/type?hl=en |
| 18 | Skybox AI: Essential $24 (4K), Standard $60 (8K plus API), Business $140 (16K plus HDRI plus commercial licence); annual ~20% cheaper | Confirmed | Annual prices are $20 / $48 / $112. There is no free tier. | https://skybox.blockadelabs.com/membership |
| 19 | Spark 2.0: MIT, 14 Apr 2026, LoD, 0.5–2.5M splats per frame, 64K chunks, 106M-splat demo, Quest 3 and Vision Pro; World Labs "joining AMD" on 28 Sep 2026 | Confirmed | MIT is confirmed by the repo LICENSE and npm (2.0.0 published 14 Apr 2026; latest 2.3.1 on 1 Oct 2026). The AMD post exists at /blog/amd-announcement: a definitive agreement, expected to close by the end of 2026 subject to regulatory approval, with no price disclosed. Updated inline. | https://www.worldlabs.ai/blog/spark-2.0 ; https://www.worldlabs.ai/blog/amd-announcement ; https://registry.npmjs.org/@sparkjsdev/spark |
| 20 | Jetpack XR `SpatialEnvironment` = one OpenEXR skybox plus one glTF, visible only in Full Space | Confirmed | Page last updated 22 Sep 2026. Passthrough opacity runs from 0.0 to 1.0. | https://developer.android.com/develop/xr/jetpack-xr-sdk/add-environments |

**Other statements checked (the most suspicious ones):**

| Statement | Verdict | Correction / note | Source |
|---|---|---|---|
| World Labs joined AMD "seven weeks after launching its Atlas model" | Corrected | Atlas was announced on 1 Sep 2026 and the AMD post on 28 Sep 2026, about **four** weeks apart. | https://www.worldlabs.ai/blog |
| World Labs AMD post "returned 404; terms not stated" | Corrected (stale) | The post is at /blog/amd-announcement: a definitive agreement, closing expected by the end of 2026, Fei-Fei Li to become AMD EVP and Chief Scientist. No price is disclosed and Marble and Spark are not addressed. | https://www.worldlabs.ai/blog/amd-announcement |
| "XREAL Aura launched in October 2026 … the widest optical see-through FOV in a consumer product so far" | Corrected | On 7 Oct 2026 pre-orders opened only to reservation holders, with shipping "soon" in the US, Canada, Japan and South Korea and wider release in 2027. Neither cited source claims the "widest" FOV; TechTimes compares it with the 45–52° typical of AR glasses. | https://www.engadget.com/2279737/xreals-aura-android-xr-smartglasses-will-cost-you-at-least-1279/ ; TechTimes [45] |
| Numbers table: "Optimal content zone 1.25–5 m" | Corrected | 1.25–5 m is Microsoft's **HoloLens** optimal hologram zone. For immersive headsets Microsoft gives focal distances of 1.25–2.5 m and advises keeping content at least 1 m away. | https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort |
| Virtual Desktop "Not available on Vision Pro or Steam Frame (V)" | Corrected (evidence level) | The page simply doesn't list them. Absence is an inference, not a vendor statement. | https://www.vrdesktop.net/ |
| Cited DOIs (Tafesse 2026, Wienrich and Obremski 2025, Kaplan-Rakowski and Gruber, Lisle et al. 2021, Andrews et al. 2010) | Confirmed | All resolve in Crossref with matching titles and authors. Kaplan-Rakowski and Gruber appeared online in Oct 2023, in print in BJET 55(2), March 2024, n=79, VR vs video. | https://api.crossref.org/works/10.1111/bjet.13392 |
| Novotny and Laidlaw, IEEE VR 2024 best paper; CPS inversely correlated with resolution | Confirmed | — | https://cs.brown.edu/news/2024/03/18/brown-cs-phd-alum-johannes-novotny-and-david-laidlaw-receive-ieee-vr-best-paper-award/ |
| Workrooms shutdown alongside closure of three studios and a reported ~10% Reality Labs layoff | Confirmed (as reported) | — | https://www.roadtovr.com/meta-horizon-workrooms-discontinued-2026 |
| Six Colors: 195 g Dual Knit Band; "hour-plus stretches", "not … all day" | Confirmed | — | https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/ |
