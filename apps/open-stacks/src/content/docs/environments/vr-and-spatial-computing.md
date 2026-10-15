---
title: VR and Spatial Computing
description: Headsets and display glasses as a place to read and work, as of October 2026. Compares the hardware on price, weight, pixels per degree, passthrough and Mac support, reviews the desktop-streaming software and the evidence on legibility, reading speed, week-long VR work and eye strain, and ends with who should try it and a two-week self-experiment for deciding.
---

*Status: draft, October 2026. Prices, ship dates and software support are as of 15 October 2026 unless another date is given. These go stale fastest. Pixels-per-degree (PPD) figures mix vendor peak values with my own averages, so treat ±20% as normal when comparing vendors. Not verified: Mac support in Meta Quest Remote Desktop and in Google PC Connect, the price of XREAL One Pro, and Virtual Desktop's custom-environment format. Sources: the [R08 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R08-spatial-computing-reading-environments.md) and primary sources linked inline.*

## The short version

- **A headset gives you more space, not more legible text.** A good desktop monitor (27-inch 4K or 5K at 60 cm) puts 67–90 pixels into each degree of your vision. Shipping headsets manage about 20 (Quest 3S, Steam Frame) to about 37 (Meta's announced VR Glasses). So headset text has to be about 3–4× larger in visual angle. You get one or two sharply readable pages in view at a time, with a lot of room around them.
- **The evidence on reading in headsets is thin and mostly comes from old hardware.** Reading speed drops a little: about 7% between a low- and a high-resolution headset in one study (n=29). Legibility drops much more. Nobody has tested comprehension on a 2025–2026 headset.
- **The one controlled week-long study of VR work found VR worse on almost every self-rated measure.** In Biener et al. (2022), 16 people finished a week on a Quest 2. Task load rose 35%, eye strain 48%, and perceived productivity fell 16%. The comparison was a physical setup held to the same 1366×768 resolution. Only 3 of the 16 preferred VR, and two more recruits quit on the first day.
- **Some people do work 5–8 hours a day in a Vision Pro.** In a 2025 interview study of 10 self-selected long-term users, 4 did, and they said the text was good enough. So long sessions are possible for some people. The study does not show they are typical.
- **Verdict.** If you already read at a good monitor, don't buy a headset to improve reading; it won't. Try one if your binding constraint is space, travel or distraction, or if you want to lay many documents out around you during a literature review. The cheapest honest test is [two weeks with a Quest 3S](#the-cheapest-experiment) (\$349.99) plus Virtual Desktop (\$24.99): one headset session and one monitor session each day, judged on the second week. My prior that a reader in this audience is still using the headset for reading afterwards is [~20%] (inference, anchored on Biener's 3 of 16).

## Pixels per degree sets the budget

Visual acuity of 20/20 resolves about 1 arcminute, which corresponds to 60 PPD ([Wikipedia, *Visual acuity*](https://en.wikipedia.org/wiki/Visual_acuity)). Every headset sold in October 2026 falls below that. A 4K or 5K monitor at a normal distance exceeds it. The conversions below are my own arithmetic at a 60 cm viewing distance (50 cm for the laptop):

| Display | PPD at centre | Comparable headset |
|---|---|---|
| 27-inch 5K monitor (218 ppi) | ~90 | none |
| 13.6-inch MacBook Air at 50 cm (224 ppi) | ~77 | none |
| 27-inch 4K monitor (163 ppi) | ~67 | none (Pimax Crystal Super reaches ~57, PC only) |
| 27-inch 1440p monitor (109 ppi) | ~45 | none shipping in a mainstream headset |
| 24-inch 1080p monitor (92 ppi) | ~38 | Meta VR Glasses (37), Vision Pro (~34, possibly 41–43), Galaxy XR (~33), Bigscreen Beyond 2 (32 peak) |
| 27-inch monitor run at 1280×720 (54 ppi) | ~22 | Quest 3S (20), Steam Frame (~20), Quest 3 (~25 claimed, ~19 averaged) |

In monitor terms, then, a Vision Pro is roughly a 24-inch 1080p screen at arm's length, and a Quest 3S is roughly a 27-inch screen at 720p (I). Treat these as upper bounds. Kilpeläinen and Häkkinen found that "legibility cannot be predicted from the nominal resolution of the display", because subpixel layout and optics also matter ([Frontiers in VR, 2023](https://doi.org/10.3389/frvir.2023.1243387)). Lens distortion and reprojection also resample the image before it reaches your eye (I).

**How large text has to be.** The guidance points to roughly 0.7–1.2° per em:

- Solum (2019) puts comfortable text at 1.2–1.3° and the minimum at 0.8–0.92°.
- Hoffman et al. (2019) measured a legibility threshold of 45 arcminutes for high-contrast letters at 13.8 PPD, with a comfort limit of 70.2 arcminutes.
- Kochurova et al. (2015) found comfortable size is about 2× threshold for young adults and about 3× for older readers.

All three are cited in Kilpeläinen and Häkkinen (2023). Google's typography guide for Android XR *display glasses* sets a 0.6° floor and recommends 0.7–0.9°. It also advises heavier, rounded type with extra letter-spacing and no thin condensed fonts ([Android Developers](https://developer.android.com/design/ui/ai-glasses/guides/styles/type?hl=en)). That page is written for glasses, not headsets, but the typographic advice carries over as an inference.

**What fits in view.** By comparison, 16 px body text on a 27-inch 4K monitor at 60 cm subtends about 0.24° per em (I). A 66-character line at about 1° per em is 30–35° wide in a headset. On that monitor the same line is about 8° wide, and 4–6 pages fit side by side. In a headset, the comfortable zone for content is within ±30–45° of straight ahead (see [ergonomics](#cybersickness-eye-strain-and-ergonomics)), which holds about two such columns. A 20-PPD headset at 1° per em spends about 20 px on each em. That is roughly what a laptop spends on body text, so the glyphs are drawn with similar pixel counts; they just occupy four times the visual angle (I). **The cost of low PPD is mostly in how much text you can take in at once, and less in how crisp each letter looks.** That matters for this wiki's readers, who often cross-reference several papers, a textbook and their notes at the same time.

**The "10K" Mac display is a frame buffer.** Mac Virtual Display's Ultrawide mode renders 10240×2880 pixels ([Apple Support](https://support.apple.com/118521)). Each eye still gets roughly 3,660 horizontal panel pixels across about 100° of view. You see a wide canvas at Vision Pro's 34–41 PPD and turn your head to read different parts of it (I). Apple credits foveated rendering for the claim ([UploadVR, 2024](https://www.uploadvr.com/visionos-2-2-ultrawide-mac-virtual-display/)).

## Headsets, October 2026

Two things changed in 2026. First, **prices went up.** A memory-chip shortage pushed up Quest prices on 19 April 2026 ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) and Vision Pro prices on 25 June 2026 ([MacRumors](https://www.macrumors.com/2026/06/25/apple-vision-pro-just-got-even-more-expensive/); Apple's store page confirms the new prices). Reviewers also blame the shortage for Steam Frame launching above \$1,000. Second, **Meta did not announce a Quest 4 at Connect on 23 September 2026.** It announced 100-gram VR glasses instead. Secondary reporting places Quest 4 in the second half of 2027 at the earliest ([vr.org](https://vr.org/upcoming-vr-headsets-2026)).

| Device | Status (Oct 2026) | US price | Weight on head | PPD | Passthrough | Mac path | Catch for reading |
|---|---|---|---|---|---|---|---|
| **Meta Quest 3S** | On sale | \$349.99 (128 GB), \$449.99 (256 GB) since 19 Apr 2026 ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) | 514 g | 20 (Meta, via [Engadget](https://engadget.com/wearables/meta-ray-ban-display-glasses-offer-an-ar-display-for-799-002921925.html)) | Colour | Virtual Desktop streamer runs on macOS ([vrdesktop.net](https://www.vrdesktop.net/)) | Fresnel lenses with a small sweet spot; front-heavy. The cheapest serious test device |
| **Meta Quest 3** | On sale | \$599.99 (512 GB) ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) | 515 g | ~25 claimed; ~19 averaged (2064 px over 110°) | Colour | Virtual Desktop; Immersed ([immersed.com](https://immersed.com/)) | Pancake lenses, sharp edge to edge; weight on the face is the usual complaint |
| **Meta VR Glasses** | Announced 23 Sep 2026; ships spring 2027 | \$1,299.99 ([Meta Newsroom](https://about.fb.com/news/2026/09/introducing-meta-vr-glasses-3d-movies-immersive-live-sports-100-grams/)) | ~100 g, plus a puck of ~300 g (secondary) on an optical tether | 37 (Meta) | Full colour, open sides | Not stated. Secondary sources say the Quest catalogue carries over ([BGR](https://www.bgr.com/2268374/meta-vr-glasses-solved-the-vr-form-factor/)), so Quest streaming apps likely work [~80%] | Up to 3 h of playback per Meta. The first mainstream device whose weight and sharpness both suit multi-hour reading. Not yet shipping |
| **Apple Vision Pro (M5)** | On sale | \$3,699 (256 GB), \$3,899, \$4,199 since 25 Jun 2026. Launched at \$3,499 in Oct 2025 ([Apple Store](https://www.apple.com/shop/buy-vision/apple-vision-pro)) | 750–800 g, plus a 353 g tethered battery ([Apple](https://www.apple.com/apple-vision-pro/specs/)) | ~34 (iFixit estimate assuming 100° FOV; some argue 41–43) ([iFixit](https://www.ifixit.com/News/90409/vision-pro-teardown-part-2-whats-the-display-resolution)) | Colour | **Mac Virtual Display**, native and free | Heaviest headset here. A reviewer manages "hour-plus stretches" but not all day ([Six Colors](https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/)) |
| **Samsung Galaxy XR** (Android XR) | On sale (US since Oct 2025) | \$1,799; controllers \$249 ([Road to VR](https://roadtovr.com/samsung-galaxy-xr-headset-price-specs-release-date/)) | 545 g, plus a 302 g battery | ~33 (my estimate: 3552 px over 109°) | Colour | Virtual Desktop lists Galaxy XR and runs on macOS. Google's PC Connect was Windows-only with Mac promised "next year" as of Dec 2025 ([9to5Google](https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/)); current Mac status unknown | Runs ordinary Android apps, so Android readers come along. Reviewers call it well balanced |
| **Valve Steam Frame** | Released 18 Sep 2026 via a reservation queue | \$1,059 (256 GB), \$1,299 (1 TB); 45 W charger \$29 extra ([Wikipedia](https://en.wikipedia.org/wiki/Steam_Frame)) | 440 g including strap and battery | ~20 (my estimate: 2160 px over 110°) | **Monochrome**; colour needs a \$149 add-on | None first-party (I) | Battery about 1.5–2 h ([Engadget](https://www.engadget.com/2257659/valve-steam-frame-review/)). Comfortable and hackable (SteamOS, a Linux desktop, Chrome, Android APKs), but a poor reading display |
| **Bigscreen Beyond 2 / 2e** | Shipping | \$959 / \$1,159 after a "permanent" cut on 2 Sep 2026 ([Road to VR](https://roadtovr.com/?p=231777)). The vendor page still showed \$1,019 / \$1,219 on 15 Oct ([Bigscreen](https://www.bigscreenvr.com/)) | **107 g / 108 g** | 32 peak (vendor) | None | None: PC VR via SteamVR with Lighthouse base stations | The lightest premium headset, but tethered to a Windows PC and base stations |
| **Pimax Crystal Super** | Shipping | \$1,695 ([Wikipedia, citing pimax.com](https://en.wikipedia.org/wiki/Pimax)) | Under 1 kg | 57 with the 106° lens | Limited | None (PC only) | The only near-"retina" consumer option. Heavy, and Pimax ship dates have slipped before |
| **Immersed Visor** | Pre-order since 2023; now promised for "Black Friday" 2026 (one secondary source) | \$699.99 plus a Visor Plus membership (e.g. \$39.99/month × 24) ([MacTech](https://www.mactech.com/2026/10/09/hardware-announcements-for-october-5-9/)) | "Lighter than a smartphone" ([visor.com](https://visor.com/)) | Not published ("4K per eye") | — | Mac, Windows, Linux | Has missed several earlier ship dates. Treat as speculative |

Weights for Quest 3/3S, Galaxy XR and Steam Frame come from secondary sources (Wikipedia and press spec sheets, linked in the dossier). Vendors quote *peak* or centre PPD, and simple averages over the field of view come out lower. Centre PPD is what matters for reading, because you look at text through the middle of the lens. Virtual Desktop also lists the Play For Dream MR, but I could not verify its specs. Pico's next headset has conflicting ship-date reports, so it is not included.

## Glasses, October 2026

Display glasses project a fixed virtual monitor through see-through optics. They are a separate category from headsets: sharper and much lighter, but with a narrow field of view and no room-scale space.

| Device | Status | US price | Display and FOV | PPD | Mac | Reading use |
|---|---|---|---|---|---|---|
| **VITURE Luma / Luma Pro / Luma Ultra / The Beast** | On sale | \$399 / \$499 / \$599 / \$549 ([VITURE](https://www.viture.com/)) | The Beast reaches 1,210 nits; FOV roughly 50–58° (I) | ~35–40 (I) | "MacBook and Windows" for some features | Cheapest light, sharp private monitor. Has ultrawide and anchored-screen modes |
| **XREAL One Pro** | On sale | Not verified | 0.55-inch Sony micro-OLED, 120 Hz, 57° FOV ([XREAL](https://www.xreal.com/one-pro)) | ~38–39 if 1920×1080 per eye (I) | Yes, if the computer outputs DisplayPort over USB-C | Anchored screen. Good for trains and planes |
| **XREAL Aura** (Android XR) | Pre-orders for reservation holders from 7 Oct 2026; wider release in 2027 | \$1,279 (12 GB/256 GB), \$1,499 (16 GB/512 GB) ([Engadget](https://www.engadget.com/2279737/xreals-aura-android-xr-smartglasses-will-cost-you-at-least-1279/)) | 1920×1200 per eye, 70° FOV; glasses under 95 g plus a compute puck | ~32 (I) | Puck has a DisplayPort input (secondary); macOS not confirmed | Google Play on the puck runs Android readers. See-through optics dim the world |
| **Meta Ray-Ban Display** | On sale (US) | \$799 ([Engadget](https://engadget.com/wearables/meta-ray-ban-display-glasses-offer-an-ar-display-for-799-002921925.html)) | 600×600 **monocular** HUD, 20° | 42 | n/a | Open to third-party web apps ([Meta](https://developers.meta.com/wearables/)). Suits glanceable summaries or RSVP of abstracts, not pages of text (I) |

I could not verify Rokid's current models, or any other Android XR display glasses, this session. One practical catch for Mac users: base Apple-silicon chips limit how many external displays you can drive, and display glasses count as one (I).

## Software for working

### Desktop streaming and work apps

| Software | Headsets | Mac | Price (Oct 2026) | Status | Catch |
|---|---|---|---|---|---|
| **Mac Virtual Display** | Vision Pro | Native. Wide and Ultrawide need Apple silicon, macOS 15.2+ and visionOS 2.2+; Intel Macs get 3K Standard ([Apple Support](https://support.apple.com/118521)) | Free | Active. visionOS 27 adds a one-tap widget ([Apple](https://support.apple.com/en-ae/149067)) | Mirrors only the Mac's main display, and one Mac at a time. Modes: 5K Standard, 6720×2880 Wide, 10240×2880 Ultrawide |
| **Virtual Desktop** | Quest 1/2/3/3S/Pro, Pico Neo 3/4/4 Ultra, Vive Focus 3/Vision/XR Elite, Play For Dream MR, Galaxy XR ([vrdesktop.net](https://www.vrdesktop.net/)) | The streamer runs on macOS; SteamVR and Rift games "won't work on a Mac" | \$24.99 on the Meta store ([Meta](https://www.meta.com/experiences/virtual-desktop/2017050365004772/)) | Active | Vision Pro and Steam Frame are not on the supported list |
| **Immersed** | Quest 2/3/Pro, Pico 3/4, Vision Pro, Visor ([immersed.com](https://immersed.com/)) | Agents for macOS 11+, Windows 10 and Linux | Starter free with up to 3 virtual screens; Pro "as low as \$5.99/month" with up to 5 ([Immersed](https://immersed.com/modes)) | Active; its Visor headset has not shipped | Quest 3S is not named on the page; it likely works, since 3S runs the Quest 3 app catalogue [~85%] |
| **Meta Quest Remote Desktop** | Quest | Not verified | Free | Meta's suggested replacement for Workrooms' desktop feature | Unclear whether it works with Macs |
| **Windows 11 Mixed Reality Link** | Quest 3/3S | No | Free | Released Dec 2024 ([Wikipedia](https://en.wikipedia.org/wiki/Windows_Mixed_Reality)) | Windows 11 PCs only |
| **Meta Horizon Workrooms** | Quest | — | — | **Discontinued 16 Feb 2026; data deleted** ([Meta Help Center](https://www.meta.com/en-gb/help/quest/2464765133873078/)) | For meetings, Meta points to Arthur, Microsoft Teams Immersive and Zoom Workplace |
| **Google PC Connect** | Galaxy XR | Windows beta from Dec 2025; Mac promised "next year" ([9to5Google](https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/)) | Free | Mac status today unknown | Shows one window or the whole desktop beside Android apps |
| **Steam Link / SteamOS** | Steam Frame | None (I) | Free | Launched Sep 2026 | Eye-tracked foveated streaming from a PC; a Linux desktop and Chrome when standalone |
| **SteamVR Home** | PC VR (Beyond, Pimax) | No: SteamVR dropped macOS (I, high confidence) | Free | Not verified this session | Workshop environments (prior knowledge, medium confidence) |

If you use a Mac, Vision Pro with Mac Virtual Display is the only first-party path. Second is Virtual Desktop on Quest 3/3S or Galaxy XR. On Windows, Virtual Desktop or Mixed Reality Link on a Quest is the cheap route. On Linux, Immersed's agent on a Quest works, and Steam Frame is the most open device, though it is not built for text.

Workrooms is not the only casualty: vendors' work environments have closed or slipped repeatedly. Reporting tied the Workrooms shutdown to Reality Labs cuts, including three studio closures ([Road to VR](https://www.roadtovr.com/meta-horizon-workrooms-discontinued-2026)). Immersed's Visor has missed several ship dates since pre-orders opened in 2023. So keep your reading material and notes in ordinary files and web pages that work without a headset.

### Reading apps that run natively

- **Vision Pro.** Kindle runs as a compatible iPad app ([App Store](https://apps.apple.com/us/app/amazon-kindle/id302584613)). Safari handles HTML text such as arXiv HTML papers, Standard Ebooks and Internet Archive pages. visionOS 26 added **Look to Scroll**, which scrolls text with your eyes, and visionOS 27 (14 September 2026) added curved windows "to view content more comfortably in apps including Safari" ([Apple Newsroom](https://www.apple.com/newsroom/2025/06/visionos-26-introduces-powerful-new-spatial-experiences-for-apple-vision-pro/); [Apple Support](https://support.apple.com/en-ae/149067)).
- **Android XR (Galaxy XR, XREAL Aura).** Google says "most Android apps are compatible… without additional development effort" ([Android Developers](https://developer.android.com/xr)). So Kindle, Libby, Play Books, KOReader and PDF readers should run as floating panels [~85%]. Individual developers can opt out.
- **Steam Frame** runs Android APKs that don't need Google Play Services, so KOReader should work (I).
- **Quest** has no Kindle app as far as I could tell (I, medium confidence). Web readers work in the Quest Browser.

For most readers, the most useful pairing is a headset browser plus open HTML text: [open papers](/access/open-papers/) in arXiv HTML and [public-domain books](/access/public-domain/) from Standard Ebooks or Gutenberg. The operating system renders that text, which keeps it as sharp as the panel allows.

### Environment rules by platform

The question that matters for building your own reading room is whether your own environment can sit behind *other apps' windows*, such as a Mac display, a PDF reader or a chat window.

| Platform | Your own environment, system-wide | An app's own environment | Web route |
|---|---|---|---|
| **visionOS 27** | **Yes, from 27.0.** Personal Environments let you "choose a panorama… and set it as your own Environment" ([Apple Support](https://support.apple.com/en-ae/149067)). It works behind Mac Virtual Display. Untested whether an AI-generated equirectangular image counts as a panorama [~50%] | Only inside the app's own immersive space. I believe other apps' windows are hidden while it is open (I, medium-high) | **Safari web environments**: a page opens a USDZ room behind itself with `<model>` and `requestImmersive()`, and the page stays visible ([WWDC26 session 320](https://developer.apple.com/videos/play/wwdc2026/320/); [WebKit](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)) |
| **Android XR** | Not found | `SpatialEnvironment` (an EXR skybox plus one glTF), in Full Space only ([Android Developers](https://developer.android.com/develop/xr/jetpack-xr-sdk/add-environments)) | WebXR in Chrome |
| **Horizon OS (Quest)** | Not confirmed | Inside immersive apps. Virtual Desktop and Immersed bring their own | WebXR in Quest Browser |
| **SteamOS (Frame)** | Unknown | OpenXR apps | Chrome on the Linux desktop; WebXR status unknown |

How to build these rooms (skyboxes, splats, WebXR, Safari web environments) and what each costs is in [Building a Virtual Reading Room](/environments/virtual-reading-room/).

## Evidence

### Legibility and reading speed

- **Kilpeläinen and Häkkinen (2023)** ([Frontiers in VR](https://doi.org/10.3389/frvir.2023.1243387)) tested 29 observers on three headsets: a Varjo VR-2 (about 60 PPD in its focus area), a VIVE Pro Eye (13.1 PPD) and a Quest 2 (20.6 PPD).
  - The Varjo won on every legibility measure, with effect sizes of 0.75–0.83.
  - Reading time per one-to-two-sentence display was 6,063 ± 624 ms on the Varjo and 6,478 ± 623 ms on the VIVE. That is about 7% longer at roughly a fifth of the PPD.
  - Legibility measures detected device differences with about **10× larger effect sizes** than reading speed did.
  - In practice, readers make up for poor resolution by working harder and choosing larger text. Speed holds up better than comfort does (I).
- **Novotny and Laidlaw (IEEE VR 2024 best paper)** measured reading speed across two headsets and a CAVE. Speed falls as text approaches each display's *critical print size*. That size shrinks as resolution rises, but stays larger than for physical text even on high-end systems ([Brown CS](https://cs.brown.edu/news/2024/03/18/brown-cs-phd-alum-johannes-novotny-and-david-laidlaw-receive-ieee-vr-best-paper-award/); secondary summary).
- **VRDoc** (ISMAR 2022, n=13) added gaze-based selection, a magnifier and gaze scrolling. The authors report reading with these tools as "more efficient" (p under 0.01) and "less demanding" ([arXiv](https://arxiv.org/abs/2211.03001)). A similar idea now ships as Look to Scroll.

### Comprehension

| Study | Comparison | n | Finding | Weight |
|---|---|---|---|---|
| Kaplan-Rakowski and Gruber, *BJET* 2024 ([DOI](https://doi.org/10.1111/bjet.13392)) | VR vs **video** | 79 English learners | Higher comprehension with VR immersion | Low for our question: the comparison is video, not a monitor |
| Çoban et al., *PER* 2024 ([DergiPark](https://dergipark.org.tr/en/pub/per/article/1453241)) | VR vs **paper** | 98 undergraduates | Paper group outperformed VR | Low to medium; search abstract only |
| "Reading text in an immersive head-mounted display" ([academia.edu](https://www.academia.edu/80876571/Reading_text_in_an_immersive_head_mounted_display)) | HMD vs LCD | 64 | Headset readers got 82% (VR) and 88% (AR) of the information LCD readers did, and read more slowly | Low: search snippet only, date unclear, old hardware |

No published study I found compares comprehension on a 35+ PPD micro-OLED headset with a monitor. The wider screen-versus-paper literature gives the nearest prior. Across 54 studies, paper beats screens on comprehension by g = −0.21, and the gap is larger under time pressure and present for informational but not narrative text ([Delgado et al. 2018](https://doi.org/10.1016/j.edurev.2018.09.003); see [Reading Modes and Devices](/environments/reading-modes-and-devices/)). A headset is a screen, so it plausibly inherits at least that gap [~65%]. My lean: a well-designed reading interface on a 35+ PPD headset roughly matches a monitor on comprehension, but reads slightly slower and causes more fatigue [~60%]. On a 20-PPD Quest 3S, I would expect a visible deficit for dense technical material with equations and figures [~70%].

### Working a full week in VR

[Biener et al. (2022)](https://arxiv.org/abs/2206.03189) is still the only controlled study of a full working week. Sixteen university employees and researchers did their own work for 5 days × 8 hours in VR and 5 days × 8 hours in a matched physical setup, in counterbalanced order.

- **Hardware:** a Quest 2 with a tracked Logitech K830 keyboard and a virtual display of about 47° × 27.5°. The authors describe it as deliberately not "the best possible VR system".
- **The baseline was also degraded.** Both conditions drove the same work computer at 1366×768 and 125% scaling, and the physical condition used a 24-inch display at 60 cm sized to match the virtual window.
- **Implication (I):** the gaps below come from the headset itself (weight, optics, isolation, latency), not from showing less content. Against a real 4K or 5K monitor the gaps would probably be larger [~75%].

| Self-rated measure | VR vs physical |
|---|---|
| Task load | +35% |
| Frustration | +42% |
| Negative affect | +11% |
| Anxiety | +19% |
| Eye strain | +48% |
| System usability (SUS) | −36% (below average) |
| Flow | −14% |
| Perceived productivity | −16% |
| Wellbeing | −20% |

Further details from the full text:

- **Dropouts.** Two *additional* recruits dropped out on the first VR day, so 2 of 18 who started (11%) quit on day one. One, who had regular migraines, said the headset's weight triggered one and left after four hours. The other could not sit in a relaxed position because of the weight, then felt anxious, nauseated and disoriented after about two hours.
- **Preferences.** Only 3 of the 16 completers preferred VR. Nine liked that its isolation helped them concentrate. One said: "in VR I had 45 minutes of high performance and then 3 hours of headache."
- **Adaptation.** Visual fatigue fell significantly faster across the week in VR than in the physical condition, and five participants said they got used to the headset.
- **After-effects.** A week later, two reported dry eyes and one reported two hours of sleepiness and dizziness after the VR week.
- **Conditions for future use.** All participants could imagine working in VR "if some conditions are met, such as having lighter HMDs with higher resolution", or for limited periods such as train rides.

Two lessons follow. First, a one-day trial understates what adaptation can do, so judge any test on its second week. Second, both dropouts named the headset's weight, not its pixels.

### Long-term users

- **[Biener, Winston, Schmalstieg and Plopski (2025)](https://arxiv.org/abs/2509.05067)** interviewed 10 Vision Pro users. Each had at least 40 hours of professional use over at least 6 months; they were aged 22–68, and 9 were men.
  - Four (P5, P7, P8, P9) use it for "at least five hours, some up to eight" a day. One (P3) uses it about 8 hours a day, three days a week.
  - Six got used to the weight. One cannot wear it for more than an hour without a headache.
  - Four used third-party straps, and one built his own.
  - The paper reports that "the resolution is good enough to work with virtual text". Participants also asked for better passthrough for reading physical text, multiple virtual screens and saved workspaces.
  - This is a sample of people who stayed with the device. People who gave up after a week are not in it.
- **[Wienrich and Obremski (2025)](https://doi.org/10.1109/tvcg.2025.3549145)** found on Vision Pro that selective attention improved significantly with immersion level (low, medium, high), social presence fell, and depth perception showed no adverse effects (abstract). This supports the "headset as a focus room" argument.
- **Reviewer consensus** on the M5 Vision Pro with the Dual Knit Band: fine for "hour-plus stretches", "still not a device that you're going to have on all day". Mac Virtual Display is "much closer" to the Mac's own sharpness but not Studio Display–sharp ([Six Colors](https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/), October 2025).

### Cybersickness, eye strain and ergonomics

- **Cybersickness** comes mostly from artificial locomotion. Seated reading in a stationary environment is among the lowest-risk uses (I, high confidence). It is not zero risk: Biener's participants rated simulator sickness "poor" on the Stanney scale, and one dropout was nauseated.
- **Vergence–accommodation conflict.**
  - In a fixed-focus headset your eyes converge on the virtual page but focus on the optics' fixed focal plane. A mismatch up to about 0.4 dioptres is within most people's comfort zone (Shibata et al. 2011). There is no consensus on lasting harm, and children under 6 are advised to avoid these displays ([Wikipedia](https://en.wikipedia.org/wiki/Vergence%E2%80%93accommodation_conflict)).
  - Microsoft puts immersive-headset focal distances at 1.25–2.5 m ([Microsoft Learn](https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort), 2024).
  - My arithmetic: with a 1.5 m focal plane, content from about 0.94 m to 3.75 m stays within 0.4 D. With a 1.25 m plane, the range is 0.83–2.5 m.
  - A main page at 1.5–2 m is therefore safe on every current headset (I).
- **Placement.** Following Microsoft's comfort guidance:
  - Keep content at least 1 m away, and 0–35° below the horizon. Resting gaze sits 10–20° below.
  - Avoid gaze more than 10° up or 60° down, and head turns beyond 45° to the side.
  - Avoid sustained raised-arm gestures and content that moves in depth.
- **Presbyopia.** The optical focal plane sits at 1.25–2.5 m. Readers with presbyopia may therefore find virtual text easier to focus than a phone held close, provided their distance correction is right [~70%, inference; no study found]. Kochurova's finding cuts the other way: older readers need text further above threshold, so fewer words fit in view.
- **Weight and battery.** Batteries cap most sessions anyway: about 1.5–2 h on Steam Frame and up to 3 h of playback on Meta VR Glasses. Plan for 60–120-minute sessions.

**A session setup that follows the evidence** (I, built from the sources above):

- Put the main page at 1.5–2 m, slightly below eye level, sized so body text is about 1° per em. Use larger text if you are older (Kochurova's 3× comfort factor) or the headset is under 25 PPD.
- Keep reference panels within ±30–45° horizontally, and leave the space above eye level empty.
- Scroll with Look to Scroll or a keyboard and trackpad, not mid-air pinching.
- Use a stationary, dim environment.
- Use a counterweighted or third-party strap on heavy headsets.
- Take the headset off between sessions, not just a break inside it.

### Spatial memory and sensemaking

Spatial memory is the best argument for putting literature *in space*. It also comes with a limit.

- **Immersion helped recall in one study.** In [Krokos, Plaisant and Varshney (2019)](https://doi.org/10.1007/s10055-018-0346-3), 40 participants remembered which face sat where in a virtual memory palace. Recall was 84.05% in a headset (an Oculus DK2) against 75.24% on a 30-inch monitor, 8.8 points higher, and 70% said the headset helped them focus.
- **Free 3D depth hurts.** In [Cockburn and McKenzie (CHI 2002)](http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf), "performance deteriorated in both the physical and virtual systems as their freedom to locate items in the third dimension increased", and users found the 3D versions more cluttered.
- **The benefit is available in 2D.** The R06 dossier's review of 3D information spaces concludes that the spatial-memory benefit people want does not require 3D (see [Maps of Knowledge](/interfaces/maps-of-knowledge/)).
- **Spatial sensemaking is the closest analogue to a literature review.** Space to Think ([Andrews, Endert and North, CHI 2010](https://doi.org/10.1145/1753326.1753336)) studied sensemaking on large high-resolution *monitors*. In Immersive Space to Think ([Lisle et al., IEEE VR 2021](https://doi.org/10.1109/VR50410.2021.00077)), 17 analysts read, annotated and arranged documents in VR using three distinct layout strategies.

The design rule is to put documents on 2.5D walls and shelves with stable positions and strong landmarks, not in floating 3D clouds. A large monitor or two gets you much of this without a headset [~60%, inference].

## Who should try it, and who should not

| If you… | Then | Why | Main obstacle |
|---|---|---|---|
| Read mostly at a desk with a 27-inch 4K or 5K monitor | **Don't buy a headset for reading.** Spend the money on books or [subscriptions](/access/subscriptions/) | 67–90 PPD on the monitor against 20–37 in a headset. Biener's deficits appeared even against a degraded 1366×768 baseline | None |
| Read where a big monitor won't fit: travel, a small flat, a sofa | **Try display glasses first** (VITURE Luma, \$399), then a headset | Light, roughly 35–40 PPD (I), and a fixed virtual monitor over USB-C | Narrow FOV of about 50–57°; base Apple-silicon chips limit external displays (I) |
| Use a Mac all day for reading and writing, and the budget allows | **Vision Pro (\$3,699)**, tested inside the retailer's return window | The only first-party Mac display (Ultrawide 10240×2880) and the only confirmed system-wide custom environments. 4 of 10 long-term users work 5+ h a day | 750–800 g on the head; "hour-plus, not all day"; long-term users are self-selected |
| Find distraction is your binding constraint | **Worth a test** | 9 of 16 in Biener liked VR's isolation; attention improved with immersion (Wienrich and Obremski) | A closed door, full-screen mode and noise-cancelling headphones are cheaper controls. Test them first |
| Do multi-document sensemaking: literature reviews, belief mapping, syllabus building | **The most promising use.** Put documents on 2.5D walls | Room for many documents at once; Space to Think and Immersive Space to Think | Only 1–2 pages are legible in view. Spatial memory also works in 2D on large monitors |
| Get migraines or motion sickness, or feel anxious when you can't see the room | **Don't, or keep the test short with an easy exit** | 2 of 18 Biener recruits quit on day 1 with migraine, nausea and anxiety | — |
| Read on paper and take handwritten notes while reading | **Not yet** | Long-term users say reading physical text through passthrough is limited even on Vision Pro. Steam Frame's passthrough is monochrome | Passthrough resolution |
| Want light and sharp, and can wait | **Wait for Meta VR Glasses** (\$1,299.99, ~100 g, 37 PPD, spring 2027) | The first device that fixes weight and sharpness together | Not shipping; Mac path unconfirmed; ship dates in this category slip |
| Run Linux and like to tinker | Steam Frame is the most open device, but **not for reading** | SteamOS, Chrome and APKs | ~20 PPD, monochrome passthrough, 1.5–2 h battery |
| Want maximum sharpness on a Windows PC | Pimax Crystal Super (57 PPD) | Closest to retina resolution | Heavy, PC-bound, and Pimax has a record of slips |

For the reader this wiki assumes, I lean as follows. A headset is a **mode**, not a replacement: an occasional focus room or sensemaking wall that sits alongside a monitor, an e-reader and paper. Put more money into a headset than an experiment costs only after the experiment says it helps you.

## The cheapest experiment

The question is personal: *does reading-heavy work in a headset hold up for me after a week of adaptation?* Here is a protocol that answers it for at most about \$375, most of it refundable if you buy inside a return window. This is my design. It borrows its measures and the length of the adaptation period from Biener et al.

**Step 0 (free, one day): test the text budget on your monitor.** Enlarge your reader's text to about 1° per em. At 60 cm that is roughly 1 cm per em, or 30-point type, so a 66-character column comes out about 35 cm wide. Work with one page at a time for a day. If constantly flipping between documents at that density is intolerable for your work, a 20–35 PPD headset will be too, however comfortable it is. Step 0 tests information density only. It says nothing about weight, heat or eye strain.

**Step 1 (two weeks): run a paired trial.**

1. **Hardware.** Borrow a headset if you can. Otherwise buy a Quest 3S (128 GB, \$349.99 as of October 2026) from a seller whose return window covers the two weeks; check the window before buying. Add Virtual Desktop (\$24.99) to stream your Mac or PC, or use Immersed's free tier (up to 3 screens; Quest 3S support inferred, not listed). For HTML reading, the Quest Browser alone costs nothing.
2. **Design.** Run 10 working days. Each day, do one reading session of at least 60 minutes in the headset and one at your monitor, and alternate which comes first. Pairing within the day controls for sleep and workload, and daily headset use still gives you a week of adaptation. Use the same kind of material in both conditions, for example consecutive chapters of one textbook or papers from one arXiv category.
3. **Measures, logged after each session:**
   - Words per minute, from texts with known word counts. arXiv HTML and Standard Ebooks are easy to count with a script.
   - A 5-question quiz on the section. Generate it with an LLM before reading and don't look at it until afterwards. Use the same prompt in both conditions.
   - Eye strain on a 1–7 scale, rated immediately after each session.
   - Minutes until you first wanted to take the headset off.
   - Whether you would choose the headset tomorrow.
4. **Analysis.** Compare the paired sessions from **days 6–10 only**, because adaptation was the main dynamic in Biener's week.
5. **Decision rule (my suggestion).** Keep the headset only if, on days 6–10, all of the following hold:
   - speed is at least 90% of your monitor sessions;
   - quiz scores average no more than one question in five lower;
   - eye strain averages no more than one point worse;
   - you would have chosen the headset on at least half the days.

   Otherwise return it.

Five paired days can only detect large effects: for 80% power at the usual 5% level, the difference has to be about 1.7 standard deviations of your day-to-day paired differences. A 7% speed difference will be lost in the noise. That is the right resolution for a keep-or-return decision: you are testing whether the headset is tolerable and useful, not estimating a small effect.

**Step 2 (only if Step 1 was close): change the variable that failed.**

- **Text looked soft** (the most likely complaint at 20 PPD): the next tier is 33–37 PPD. Options are Galaxy XR (\$1,799), Vision Pro (\$3,699), or waiting for Meta VR Glasses.
- **Weight or heat ended your sessions:** wait for Meta VR Glasses (~100 g), or try display glasses.
- **You never wanted to put it back on:** stop. That answer is worth the return shipping.

If your actual problem is travel reading, swap Step 1's device for display glasses (VITURE Luma at \$399). Run the same measures on trains and planes against a laptop screen.

## If you build for headsets

These rules come from the evidence above. Room-building is covered in [Building a Virtual Reading Room](/environments/virtual-reading-room/).

- **Let the operating system render text wherever you can.** At 20–37 PPD every pixel counts. Safari, SwiftUI, Android views and Mac Virtual Display rasterise text at the compositor level. Inside an immersive WebXR session the DOM is not rendered, so text has to be drawn into WebGL textures, which costs sharpness unless you use WebXR quad layers (I, high confidence). The best return is usually a flat web reading app designed for headset windows, with the room added separately.
- **Design in degrees, not pixels.** Body text at least 0.7° and ideally about 1° per em, lines no wider than 30–35°, the main page at 1.5–2 m and 10–20° below eye level, secondary panels within ±45°.
- **Use the extra space for context, not more body text.** Outlines, citations, notes and related works can sit in the periphery in large type. Ideas along these lines are in [The Design Space](/building/design-space/) and [Reading Interfaces](/interfaces/reading-interfaces/).
- **Make the headset one mode among several.** Store layouts as data (JSON) and keep the same corpus readable on a flat screen. Workrooms' deletion is the reminder that a vendor's environment system can disappear with your setup in it.

## Open questions

- Does a 35+ PPD headset (Vision Pro, Galaxy XR, Meta VR Glasses) match a 4K monitor on comprehension of technical text over 60–120-minute sessions? No 2025–2026 study exists. A Biener-style one-week replication on current hardware, against a real high-resolution monitor, would settle much of this chapter.
- Does visionOS 27 accept an imported, AI-generated equirectangular image as a Personal Environment, or does Photos need capture metadata to treat it as a panorama?
- Does Meta Quest Remote Desktop support macOS, and has Google PC Connect for Mac shipped on Galaxy XR?
- Will Meta VR Glasses run Virtual Desktop and Immersed at launch, and what does the puck actually weigh?
- During a Safari web environment on visionOS 27, do other apps' windows (Mac Virtual Display, Notes) stay visible?
- Which price is current for Bigscreen Beyond 2: \$959 (Road to VR) or the \$1,019 the vendor page still showed on 15 October 2026?
- Will Immersed's Visor ship by the end of November 2026?
- Is there any longitudinal clinical evidence, beyond self-report, on vergence–accommodation effects for adults who use headsets 5+ hours a day?
- Does reading in a headset help or hurt presbyopic readers in practice?

## Related pages

- [Reading Modes and Devices](/environments/reading-modes-and-devices/): e-ink, tablets, monitors and paper, and the screen-versus-paper evidence
- [Building a Virtual Reading Room](/environments/virtual-reading-room/): skyboxes, Safari web environments, WebXR and splats, with costs
- [Reading Interfaces](/interfaces/reading-interfaces/): what reading software has tried
- [Maps of Knowledge](/interfaces/maps-of-knowledge/): spatial layouts of literature and why 3D mostly failed
- [The Design Space](/building/design-space/)
- [Prototype Gallery](/building/prototype-gallery/)
- [What to Do First](/start-here/decision-guide/)
- [Cruxes](/start-here/cruxes/)
