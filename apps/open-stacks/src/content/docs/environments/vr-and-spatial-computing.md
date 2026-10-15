---
title: VR and Spatial Computing
description: Headsets and display glasses as a place to read and work, as of October 2026. Compares the hardware on price, weight, pixels per degree, passthrough and Mac support, reviews the desktop-streaming software and the evidence on legibility, reading speed, week-long VR work and eye strain, and ends with who should try it and a two-week self-experiment for deciding.
---

*Status: draft, October 2026. Prices, ship dates and software support are as of 15 October 2026 unless another date is given. These go stale fastest. Pixels-per-degree (PPD) figures mix vendor peak values with my own estimates, so treat ±20% as normal when comparing vendors. Not verified: Mac support in Google PC Connect, which headsets Meta's Mac streaming app supports, the price and weight of XREAL One Pro, and Immersed on Quest 3S. Sources: the [R08 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R08-spatial-computing-reading-environments.md); the screen-versus-paper figures come from the [R11 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md) and the 2D-versus-3D evidence from the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md). Primary sources are linked inline.*

## The short version

- **A headset gives you more space, not more legible text.** A 27-inch 4K or 5K monitor at 60 cm gives 67–90 pixels per degree (PPD). Mainstream headsets give about 20 (Quest 3S, Steam Frame) to about 34 (Vision Pro); Meta's announced VR Glasses promise 37. Headset text therefore has to be about 3–4× larger in visual angle, so you get one or two comfortably readable pages in view, with a lot of room around them.
- **The reading evidence is thin and mostly on old hardware.** In one study of 29 observers aged 19–40, reading took about 7% longer on a 13-PPD headset than on a ~60-PPD one, while legibility effects were about ten times larger. I found no comprehension study on 2025–2026 hardware.
- **The one controlled week-long study of VR work found VR worse on almost every self-rated measure.** In Biener et al. (2022), 16 people finished a week on a Quest 2: task load rose 35%, eye strain 48%, and perceived productivity fell 16%, against a physical setup held to the same 1366×768 resolution. Only 3 of 16 preferred VR, and two more recruits quit on day one.
- **Some people do work 5–8 hours a day in a Vision Pro.** Four of 10 self-selected long-term users in a 2025 interview study did. That shows long sessions are possible, not that they are typical.
- **Verdict.** If you already read at a good monitor, don't buy a headset to improve reading; it won't. Try one if your binding constraint is space, travel or distraction, or if you want many documents laid out around you during a literature review. The cheapest honest test is [two weeks with a returnable Quest 3S](#the-cheapest-experiment) (\$349.99), streaming your computer with Meta's free app or Virtual Desktop (\$24.99), with one headset and one monitor session a day, judged on the second week. My prior that a reader in this audience is still reading in the headset afterwards is [~20%] (anchored on Biener's 3 of 16).

## Pixels per degree sets the budget

Visual acuity of 20/20 resolves about 1 arcminute, which corresponds to 60 PPD ([Wikipedia, *Visual acuity*](https://en.wikipedia.org/wiki/Visual_acuity)). Every consumer headset on sale in October 2026 falls below that. A 4K or 5K monitor at a normal distance exceeds it. The conversions below are my own arithmetic at a 60 cm viewing distance (50 cm for the laptop):

| Display | PPD at centre | Comparable headset |
|---|---|---|
| 27-inch 5K monitor (218 ppi) | ~90 | none |
| 13.6-inch MacBook Air at 50 cm (224 ppi) | ~77 | none |
| 27-inch 4K monitor (163 ppi) | ~67 | none (Pimax Crystal Super reaches ~57, PC only) |
| 27-inch 1440p monitor (109 ppi) | ~45 | none shipping in a mainstream headset |
| 24-inch 1080p monitor (92 ppi) | ~38 | Meta VR Glasses (37, not yet shipping), Vision Pro (~34, possibly 41–43), Galaxy XR (~33), Bigscreen Beyond 2 (32 peak) |
| 27-inch monitor run at 1280×720 (54 ppi) | ~22 | Quest 3S (20), Steam Frame (~20), Quest 3 (~25 claimed, ~19 averaged) |

In monitor terms, a Vision Pro is roughly a 24-inch 1080p screen at arm's length, and a Quest 3S is roughly a 27-inch screen at 720p (I). Treat these as upper bounds. Kilpeläinen and Häkkinen found that "legibility cannot be predicted from the nominal resolution of the display", because subpixel layout and optics also matter ([Frontiers in VR, 2023](https://doi.org/10.3389/frvir.2023.1243387)). Lens distortion and reprojection also resample the image before it reaches your eye (I).

**How large text has to be: roughly 0.7–1.2° per em.** Solum (2019) puts comfortable text at 1.2–1.3° and the minimum at 0.8–0.92°. Hoffman et al. (2019) measured a legibility threshold of 45 arcminutes for high-contrast letters at 13.8 PPD, with a comfort limit of 70.2 arcminutes. Kochurova et al. (2015) found comfortable size is about 2× threshold for young adults and about 3× for older readers. (All three are cited in Kilpeläinen and Häkkinen.) Google's typography guide for Android XR *display glasses* sets a 0.6° floor, recommends 0.7–0.9°, and advises heavier, rounded type with extra letter-spacing ([Android Developers](https://developer.android.com/design/ui/ai-glasses/guides/styles/type?hl=en)). It is written for glasses; applying it to headsets is my inference.

**What fits in view.** Body text of 16 device pixels on a 27-inch 4K monitor at 60 cm subtends about 0.24° per em (I). A 66-character line is then about 8° wide, and 4–6 pages fit side by side. At 1° per em the same line is 30–35° wide, and the comfortable zone of ±30–45° (see [ergonomics](#cybersickness-eye-strain-and-ergonomics)) holds about two such columns. A 20-PPD headset at 1° per em spends about 20 px on each em, a little more than the monitor's 16, so the glyphs get similar pixel counts at four times the visual angle (I). I therefore expect the main cost of low PPD to be **how much text you can take in at once, more than how crisp each letter looks** [~70%]; lens blur and resampling keep me from more confidence. That cost falls hardest on readers who cross-reference several papers, a textbook and their notes at once.

**The "10K" Mac display is a frame buffer.** Mac Virtual Display's Ultrawide mode renders 10240×2880 pixels ([Apple Support](https://support.apple.com/118521)). Each eye still gets roughly 3,660 horizontal panel pixels across about 100° of view. You see a wide canvas at Vision Pro's 34–41 PPD and turn your head to read different parts of it (I). Apple credits foveated rendering for the claim ([UploadVR, 2024](https://www.uploadvr.com/visionos-2-2-ultrawide-mac-virtual-display/)).

## Headsets, October 2026

Two things changed in 2026. First, **prices went up.** A memory-chip shortage pushed up Quest prices on 19 April 2026 ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) and Vision Pro prices on 25 June 2026 ([MacRumors](https://www.macrumors.com/2026/06/25/apple-vision-pro-just-got-even-more-expensive/); Apple's store page lists the new prices). Engadget blames the same "RAM crisis" for Steam Frame launching above \$1,000 ([Engadget](https://www.engadget.com/2257659/valve-steam-frame-review/)). Second, **Meta did not announce a Quest 4 at Connect on 23 September 2026.** It announced 100-gram VR glasses instead. Secondary reporting places Quest 4 in the second half of 2027 at the earliest ([vr.org](https://vr.org/upcoming-vr-headsets-2026)).

| Device | Status (Oct 2026) | US price | Weight on head | PPD | Passthrough | Mac path | Catch for reading |
|---|---|---|---|---|---|---|---|
| **Meta Quest 3S** | On sale | \$349.99 (128 GB), \$449.99 (256 GB) since 19 Apr 2026 ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) | 514 g (secondary) | 20 (Meta, via [Engadget](https://engadget.com/wearables/meta-ray-ban-display-glasses-offer-an-ar-display-for-799-002921925.html)) | Colour | Meta's Mac app ([Meta](https://www.meta.com/help/quest/1370025034331518/)); Virtual Desktop's streamer runs on macOS ([vrdesktop.net](https://www.vrdesktop.net/)) | Fresnel lenses with a small sweet spot; front-heavy. The cheapest serious test device |
| **Meta Quest 3** | On sale | \$599.99 (512 GB) ([Meta](https://www.meta.com/blog/update-meta-quest-pricing/)) | 515 g ([Engadget](https://www.engadget.com/2257659/valve-steam-frame-review/)) | ~25 claimed; ~19 averaged (2064 px over 110°) | Colour | As Quest 3S; also Immersed ([immersed.com](https://immersed.com/)) | Pancake lenses, sharp edge to edge; weight on the face is the usual complaint |
| **Meta VR Glasses** | Announced 23 Sep 2026; on sale spring 2027 | \$1,299.99 ([Meta Newsroom](https://about.fb.com/news/2026/09/introducing-meta-vr-glasses-3d-movies-immersive-live-sports-100-grams/)) | ~100 g, plus a puck of ~300 g (secondary) on an optical tether | 37 (Meta) | Full colour, open sides | Not stated. Meta pitches a "multi-screen private workspace". Secondary sources say the Quest catalogue carries over ([BGR](https://www.bgr.com/2268374/meta-vr-glasses-solved-the-vr-form-factor/)), so Quest streaming apps likely work [~80%] | Up to 3 h of playback per Meta. On paper, the first mainstream device both light and sharp enough for multi-hour reading (I). Not yet shipping |
| **Apple Vision Pro (M5)** | On sale | \$3,699 (256 GB), \$3,899, \$4,199 since 25 Jun 2026 ([Apple Store](https://www.apple.com/shop/buy-vision/apple-vision-pro)); launched at \$3,499 in Oct 2025 ([MacRumors](https://www.macrumors.com/2026/06/25/apple-vision-pro-just-got-even-more-expensive/)) | 750–800 g, plus a 353 g tethered battery ([Apple](https://www.apple.com/apple-vision-pro/specs/)) | ~34 (iFixit estimate assuming 100° FOV; some argue 41–43) ([iFixit](https://www.ifixit.com/News/90409/vision-pro-teardown-part-2-whats-the-display-resolution)) | Colour | **Mac Virtual Display**, built in and free | Heaviest headset here. A reviewer manages "hour-plus stretches" but not all day ([Six Colors](https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/)) |
| **Samsung Galaxy XR** (Android XR) | On sale (US since Oct 2025) | \$1,799 launch price, no change found; controllers about \$250 ([Road to VR](https://roadtovr.com/samsung-galaxy-xr-headset-price-specs-release-date/), Oct 2025, rounds to \$1,800) | 545 g, plus a 302 g battery | ~33 (my estimate: 3552 px over 109°) | Colour | Virtual Desktop lists Galaxy XR and runs on macOS. Google's PC Connect was Windows-only with Mac promised "next year" as of Dec 2025 ([9to5Google](https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/)); current Mac status unknown | Runs ordinary Android apps, so Android readers come along. Reviewers call it well balanced |
| **Valve Steam Frame** | Released 18 Sep 2026 via a reservation queue; Valve says the order queue now stretches into 2027 ([Road to VR](https://roadtovr.com/steam-frame-backorder-queue-2027/), 12 Oct 2026) | \$1,059 (256 GB), \$1,299 (1 TB) ([Engadget](https://www.engadget.com/2257659/valve-steam-frame-review/)); 45 W charger \$29 extra ([Wikipedia](https://en.wikipedia.org/wiki/Steam_Frame)) | 440 g including strap and battery | ~20 (my estimate: 2160 px over 110°) | **Monochrome**; colour needs a \$149 add-on | None first-party (I) | Battery about 1.5–2 h. Comfortable and hackable (SteamOS, a Linux desktop, Chrome, Android APKs), but a poor reading display. Valve says some new orders will not be processed until 2027 |
| **Bigscreen Beyond 2 / 2e** | Shipping | \$959 / \$1,159 after a "permanent" cut on 2 Sep 2026 ([Road to VR](https://roadtovr.com/?p=231777)). The vendor page still showed \$1,019 / \$1,219 on 15 Oct ([Bigscreen](https://www.bigscreenvr.com/)) | **107 g / 108 g** | 32 peak (vendor) | None | None: PC VR via SteamVR with Lighthouse base stations | The lightest premium headset, but tethered to a Windows PC and base stations |
| **Pimax Crystal Super** | Shipping | \$1,695 ([Wikipedia, citing pimax.com](https://en.wikipedia.org/wiki/Pimax)) | Under 1 kg | 57 with the 106° lens | Limited | None (PC only) | The only near-"retina" consumer option. Heavy, and Pimax ship dates have slipped before |
| **Immersed Visor** | Pre-order since 2023; now promised for "Black Friday" 2026 (one secondary source) | \$699.99 plus a Visor Plus membership (e.g. \$39.99/month × 24) ([MacTech](https://www.mactech.com/2026/10/09/hardware-announcements-for-october-5-9/)) | "Lighter than a smartphone" ([visor.com](https://visor.com/)) | Not published ("4K per eye") | — | Mac, Windows, Linux | Has missed several earlier ship dates. Treat as speculative |

The Quest 3S, Steam Frame and VR Glasses puck weights are from secondary sources (linked in the dossier). Vendors quote *peak* or centre PPD; averages over the field of view come out lower. Centre PPD is what matters for reading, because you read through the middle of the lens. Play For Dream MR (specs unverified) and Pico's next headset (conflicting ship dates) are left out.

## Glasses, October 2026

Display glasses project a fixed virtual monitor through see-through optics. They are a separate category from headsets: sharper and much lighter, but with a narrow field of view and no room-scale space.

| Device | Status | US price | Display and FOV | PPD | Mac | Reading use |
|---|---|---|---|---|---|---|
| **VITURE Luma / Luma Pro / Luma Ultra / The Beast** | On sale | \$399 / \$499 / \$599 / \$549 ([VITURE](https://www.viture.com/)) | The Beast reaches 1,210 nits; FOV not published, roughly 50–58° (I) | ~35–40 (I) | The site advertises "Immersive 3D" on MacBook and Windows; plain mirroring needs DisplayPort over USB-C (I) | Cheapest light, sharp private monitor. Has ultrawide and anchored-screen modes |
| **XREAL One Pro** | On sale | Not verified | 0.55-inch Sony micro-OLED, 120 Hz, 57° FOV ([XREAL](https://www.xreal.com/one-pro)) | ~38 if 1920×1080 per eye over a 57° diagonal (I) | Yes, if the computer outputs DisplayPort over USB-C | Anchored screen. Good for trains and planes |
| **XREAL Aura** (Android XR) | Pre-orders for reservation holders from 7 Oct 2026; wider release in 2027 | \$1,279 (12 GB/256 GB), \$1,499 (16 GB/512 GB) ([Engadget](https://www.engadget.com/2279737/xreals-aura-android-xr-smartglasses-will-cost-you-at-least-1279/)) | 1920×1200 per eye, 70° FOV; glasses under 95 g plus a compute puck | ~31 (I) | Puck has a DisplayPort input (secondary); macOS not confirmed | Google Play on the puck runs Android readers. See-through optics dim the world |
| **Meta Ray-Ban Display** | On sale (US) | \$799 ([Engadget](https://engadget.com/wearables/meta-ray-ban-display-glasses-offer-an-ar-display-for-799-002921925.html)) | 600×600 **monocular** HUD, 20° diagonal | 42 | n/a | Open to third-party web apps ([Meta](https://developers.meta.com/wearables/)). Suits glanceable summaries or RSVP of abstracts, not pages of text (I) |

I could not verify Rokid's current models, or any other Android XR display glasses. One practical catch for Mac users: base Apple-silicon chips limit how many external displays you can drive, and display glasses count as one (I).

## Software for working

### Desktop streaming and work apps

| Software | Headsets | Mac | Price (Oct 2026) | Status | Catch |
|---|---|---|---|---|---|
| **Mac Virtual Display** | Vision Pro | Built in. Wide and Ultrawide need Apple silicon, macOS 15.2+ and visionOS 2.2+; Intel Macs get 3K Standard ([Apple Support](https://support.apple.com/118521)) | Free | Active. visionOS 27 adds a one-tap widget ([Apple](https://support.apple.com/en-ae/149067)) | Shows only the Mac's main display, and one Mac at a time. Modes: 5K Standard, 6720×2880 Wide, 10240×2880 Ultrawide |
| **Virtual Desktop** | Quest 1/2/3/3S/Pro, Pico Neo 3/4/4 Ultra, Vive Focus 3/Vision/XR Elite, Play For Dream MR, Galaxy XR ([vrdesktop.net](https://www.vrdesktop.net/)) | Streamer runs on macOS Catalina or later; SteamVR and Rift games "won't work on a Mac" | \$24.99 on the Meta store ([Meta](https://www.meta.com/experiences/virtual-desktop/2017050365004772/); the page shows no date) | Active | Vision Pro and Steam Frame are not on the supported list |
| **Immersed** | Quest 2/3/Pro, Pico 3/4, Vision Pro, Visor ([immersed.com](https://immersed.com/)) | Agents for macOS 11+, Windows 10 and Linux | Starter free with up to 3 virtual screens; Pro "as low as \$5.99/month" with up to 5 ([Immersed](https://immersed.com/modes)) | Active; its Visor headset has not shipped | Quest 3S is not named. It likely works, since 3S runs the Quest 3 app catalogue [~85%] |
| **Meta Quest Remote Desktop / Virtual Display** | Quest | Yes: "For Mac and older Windows versions, use the Meta Quest Virtual Display app" ([Meta Help Center](https://www.meta.com/help/quest/1370025034331518/), updated about Sep 2026). Homebrew lists the Remote Desktop companion as needing macOS 13+ ([Homebrew](https://formulae.brew.sh/cask/meta-quest-remote-desktop)) | Free (I) | Meta's replacement for Workrooms' desktop feature | Headsets and display count on Mac not stated. I infer the two names are one app [~80%] |
| **Windows 11 Mixed Reality Link** | Quest 3/3S | No | Free | Released Dec 2024 ([Wikipedia](https://en.wikipedia.org/wiki/Windows_Mixed_Reality)) | Needs Windows 11 22H2+ and Horizon OS v81+; up to 3 virtual displays ([Meta Help Center](https://www.meta.com/help/quest/1370025034331518/)) |
| **Meta Horizon Workrooms** | Quest | — | — | **Discontinued 16 Feb 2026; data deleted** ([Meta Help Center](https://www.meta.com/en-gb/help/quest/2464765133873078/)) | For meetings, Meta points to Arthur, Microsoft Teams Immersive and Zoom Workplace |
| **Google PC Connect** | Galaxy XR | Windows beta from Dec 2025; Mac promised "next year" ([9to5Google](https://9to5google.com/2025/12/08/galaxy-android-xr-pc-connect/)) | Free | Mac status today unknown | Shows one window or the whole desktop beside Android apps |
| **Steam Link / SteamOS** | Steam Frame | None (I) | Free | Launched Sep 2026 | Eye-tracked foveated streaming from a PC; a Linux desktop and Chrome when standalone |

**Which path to use.** On a Mac, Vision Pro's Mac Virtual Display is the only option built into macOS and, at 34+ PPD, the sharpest (I). On a Quest, try Meta's free Mac or PC app first, then Virtual Desktop, which also covers Galaxy XR. On Windows 11, Mixed Reality Link on a Quest 3/3S is free. On Linux, Immersed's agent on a Quest works. Steam Frame is the most open device, but it is not built for text.

Vendor work environments are fragile. Meta deleted Workrooms in February 2026, and reporting tied the shutdown to Reality Labs cuts that included three studio closures ([Road to VR](https://www.roadtovr.com/meta-horizon-workrooms-discontinued-2026)). Immersed's Visor has missed several ship dates since pre-orders opened in 2023. Keep your reading material and notes in ordinary files and web pages that work without a headset.

### Reading apps that run natively

- **Vision Pro.** Kindle runs as a compatible iPad app ([App Store](https://apps.apple.com/us/app/amazon-kindle/id302584613)). Safari handles HTML text such as arXiv HTML papers, Standard Ebooks and Internet Archive pages. visionOS 26 added **Look to Scroll**, which scrolls text with your eyes, and visionOS 27 (14 September 2026) added curved windows "to view content more comfortably in apps including Safari" ([Apple Newsroom](https://www.apple.com/newsroom/2025/06/visionos-26-introduces-powerful-new-spatial-experiences-for-apple-vision-pro/); [Apple Support](https://support.apple.com/en-ae/149067)).
- **Android XR (Galaxy XR, XREAL Aura).** Google says "most Android apps are compatible… without additional development effort" ([Android Developers](https://developer.android.com/xr)). So Kindle, Libby, Play Books, KOReader and PDF readers should run as floating panels [~85%]. Individual developers can opt out.
- **Steam Frame** runs Android APKs that don't need Google Play Services, so KOReader should work [~80%].
- **Quest** has no Kindle app as far as I could tell [~70%]. Web readers work in the Quest Browser.

For most readers, the most useful pairing is a headset browser plus open HTML text: [open papers](/access/open-papers/) in arXiv HTML and [public-domain books](/access/public-domain/) from Standard Ebooks or Gutenberg. The operating system renders that text, which keeps it as sharp as the panel allows.

### Custom environments

What matters for a reading room is whether your own environment can sit behind *other apps' windows*, such as a Mac display or a PDF reader. As of October 2026 only visionOS 27 allows this system-wide: Personal Environments let you "choose a panorama… and set it as your own Environment", and it works behind Mac Virtual Display ([Apple Support](https://support.apple.com/en-ae/149067)). Whether an AI-generated equirectangular image counts as a panorama is untested [~50%]. Safari 27 also lets a web page open a USDZ room behind itself while the page stays visible ([WWDC26 session 320](https://developer.apple.com/videos/play/wwdc2026/320/)). Android XR confines an app's environment to Full Space ([Android Developers](https://developer.android.com/develop/xr/jetpack-xr-sdk/add-environments)); on Quest, Virtual Desktop and Immersed bring their own rooms. Details and build costs are in [Building a Virtual Reading Room](/environments/virtual-reading-room/).

## Evidence

### Legibility and reading speed

- **Kilpeläinen and Häkkinen (2023)** ([Frontiers in VR](https://doi.org/10.3389/frvir.2023.1243387)) tested 29 observers aged 19–40 on a Varjo VR-2 (about 60 PPD in its focus area), a VIVE Pro Eye (13.1 PPD) and a Quest 2 (20.6 PPD). The Varjo won on every legibility measure (effect sizes 0.75–0.83). Reading time per one-to-two-sentence display was 6,063 ms on the Varjo and 6,478 ms on the VIVE (95% CIs about ±620 ms): about 7% longer at a fifth of the PPD, significant (p under 0.001) but small (effect size 0.06). The authors put the legibility effects at "approximately ten times higher" than the reading-speed effect. My reading: readers compensate for poor resolution with effort, so speed holds up better than comfort (I).
- **Novotny and Laidlaw (IEEE VR 2024 best paper)** measured reading speed across two headsets and a CAVE. Speed falls as text approaches each display's *critical print size*. That size shrinks as resolution rises, but stays larger than for physical text even on high-end systems ([Brown CS](https://cs.brown.edu/news/2024/03/18/brown-cs-phd-alum-johannes-novotny-and-david-laidlaw-receive-ieee-vr-best-paper-award/); secondary summary).
- **VRDoc** (ISMAR 2022, n=13) added gaze-based selection, a magnifier and gaze scrolling. The authors report reading with these tools as "more efficient" (p under 0.01) and "less demanding" ([arXiv](https://arxiv.org/abs/2211.03001)). Look to Scroll now ships a similar gaze-scrolling idea.

### Comprehension

| Study | Comparison | n | Finding | Weight |
|---|---|---|---|---|
| Kaplan-Rakowski and Gruber, *BJET* 2024 ([DOI](https://doi.org/10.1111/bjet.13392)) | VR vs **video** | 79 English learners | Higher comprehension with VR immersion | Low for our question: the comparison is video, not a monitor; abstract only |
| Çoban et al., *PER* 2024 ([DergiPark](https://dergipark.org.tr/en/pub/per/article/1453241)) | VR vs **paper** | 98 undergraduates | Paper group outperformed VR | Low to medium; search abstract only |
| "Reading text in an immersive head-mounted display" ([academia.edu](https://www.academia.edu/80876571/Reading_text_in_an_immersive_head_mounted_display)) | HMD vs LCD | 64 | Headset readers got 82% (VR) and 88% (AR) of the information LCD readers did, and read more slowly | Low: search snippet only, date unclear, old hardware |

No published study I found compares comprehension on a 35+ PPD micro-OLED headset with a monitor. The nearest prior is the screen-versus-paper literature. Across 54 studies and 171,055 participants, paper beats screens on comprehension by g = −0.21; the gap is larger under time pressure and appears for informational but not purely narrative text ([Delgado et al. 2018](https://doi.org/10.1016/j.edurev.2018.09.003); see [Reading Modes and Devices](/environments/reading-modes-and-devices/)). A headset is a screen, so it plausibly inherits at least that gap relative to paper [~65%]. Against a monitor, my lean is that a well-designed reading interface on a 35+ PPD headset roughly matches on comprehension but reads slightly slower and causes more fatigue [~60%]. On a 20-PPD Quest 3S, I expect a visible deficit for dense technical material with equations and figures [~70%].

### Working a full week in VR

[Biener et al. (2022)](https://arxiv.org/abs/2206.03189) is still the only controlled study of a full working week. Sixteen university employees and researchers did their own work for 5 days × 8 hours in VR and 5 days × 8 hours in a matched physical setup, in counterbalanced order.

The VR condition used a Quest 2 with a tracked Logitech K830 keyboard and a virtual display of about 47° × 27.5°, deliberately not "the best possible VR system". **The baseline was degraded too:** both conditions drove the same remote work computer at 1366×768 and 125% scaling, and the physical condition used a 24-inch display at 60 cm, placed to match the virtual window's field of view. So the gaps below come from the headset itself (weight, optics, isolation, latency), not from showing less content (I). Against a real 4K or 5K monitor they would probably be larger [~75%].

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

From the full text:

- **Dropouts.** Two *additional* recruits quit on the first VR day (2 of 18 who started). One, prone to migraines, said the headset's weight triggered them and left after four hours. The other could not sit relaxed because of the weight and felt anxious, nauseated and disoriented after about two hours.
- **Preferences.** Only 3 of 16 completers preferred VR, though 9 liked that its isolation helped them concentrate. One said: "in VR I had 45 minutes of high performance and then 3 hours of headache."
- **Adaptation.** Visual fatigue was higher in VR every day but fell significantly faster across the week; five participants said they got used to the headset. Asked a week later, two reported dry eyes after the VR week.
- **Future use.** All could imagine working in VR "if some conditions are met, such as having lighter HMDs with higher resolution and being able to have multiple displays", or for limited periods such as train rides.

Two lessons follow. A one-day trial understates adaptation, so judge any test on its second week. And both dropouts named the headset's weight, not its pixels.

### Long-term users

- **[Biener, Winston, Schmalstieg and Plopski (2025)](https://arxiv.org/abs/2509.05067)** interviewed 10 Vision Pro users. Each had at least 40 hours of professional use over at least 6 months. They were aged 22–68 (mean 48.8), and 9 were men.
  - Four (P5, P7, P8, P9) use it daily for "at least five hours, some up to eight", and P3 about 8 hours a day, three days a week. The rest use it 1–3 hours on several days a week.
  - Six got used to the weight; one cannot wear it for more than an hour without a headache. Four use third-party straps and one built a custom solution.
  - The authors conclude that "the resolution is good enough to work with virtual text". Two participants said passthrough is not yet good enough for reading physical text.
  - These are people who stayed with the device. People who gave up are not in the sample.
- **[Wienrich and Obremski (2025)](https://doi.org/10.1109/tvcg.2025.3549145)** found on Vision Pro that selective attention improved significantly with immersion level (low, medium, high), social presence fell, and depth perception showed no adverse effects (abstract only). This supports the "headset as a focus room" argument.
- **Reviewer consensus** on the M5 Vision Pro with the Dual Knit Band: fine for "hour-plus stretches", "still not a device that you're going to have on all day". Mac Virtual Display is "much closer" to the Mac's own sharpness but not Studio Display–sharp ([Six Colors](https://sixcolors.com/post/2025/10/m5-vision-pro-dual-kit-band-psvr2-controller-review-apples-experiment-continues/), October 2025).

### Cybersickness, eye strain and ergonomics

- **Cybersickness** comes mostly from artificial locomotion. Seated reading in a stationary environment is among the lowest-risk uses [~90%]. It is not zero risk: mean simulator-sickness scores in Biener's VR week were 34.3 against 9.2 in the physical week, which the authors class as "bad" on Stanney et al.'s scale, and one dropout was nauseated.
- **Vergence–accommodation conflict.** In a fixed-focus headset your eyes converge on the virtual page but focus on the optics' fixed focal plane. A mismatch up to about 0.4 dioptres is within most people's comfort zone (Shibata et al. 2011); there is no consensus on lasting harm, and children under 6 are advised to avoid these displays ([Wikipedia](https://en.wikipedia.org/wiki/Vergence%E2%80%93accommodation_conflict)). Microsoft puts immersive-headset focal planes at 1.25–2.5 m ([Microsoft Learn](https://learn.microsoft.com/en-us/windows/mixed-reality/design/comfort), 2024); most vendors do not publish theirs. By my arithmetic, a page at 1.5–2 m stays within 0.4 D of any focal plane in that range (a 1.25 m plane tolerates 0.83–2.5 m; a 2.5 m plane, 1.25 m to infinity).
- **Placement** (Microsoft's guidance): content at least 1 m away and 0–35° below the horizon, with resting gaze 10–20° below. Avoid gaze more than 10° up or 60° down, head turns beyond 45° to the side, sustained raised-arm gestures, and content that moves in depth.
- **Presbyopia.** With the focal plane at 1.25–2.5 m, presbyopic readers may find virtual text easier to focus than a phone held close, given the right distance correction [~70%, inference; no study found]. The long-term Vision Pro users averaged 48.8 years old, so presbyopia did not stop them, though the study does not discuss it. Kochurova's finding cuts the other way: older readers need text further above threshold, so fewer words fit in view.
- **Session length.** Untethered battery life is short (about 1.5–2 h on Steam Frame, up to 3 h of playback on Meta VR Glasses), and heavy headsets are "hour-plus, not all day". Plan for 60–120-minute sessions.

**A session setup that follows the evidence** (I): main page at 1.5–2 m, slightly below eye level, body text about 1° per em (larger if you are older or the headset is under 25 PPD); reference panels within ±30–45°, nothing above eye level; Look to Scroll or keyboard and trackpad rather than mid-air pinching; a stationary, dim environment; a counterweighted or third-party strap on heavy headsets; and the headset off between sessions, not just a break inside it.

### Spatial memory and sensemaking

Spatial memory is the best argument for putting literature *in space*. In [Krokos, Plaisant and Varshney (2019)](https://doi.org/10.1007/s10055-018-0346-3), 40 participants recalled 84.05% of face locations in a virtual memory palace viewed in a headset (an Oculus DK2) against 75.24% on a 30-inch monitor, 8.8 points higher. But free depth hurts: in [Cockburn and McKenzie (CHI 2002)](http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf), "performance deteriorated in both the physical and virtual systems as their freedom to locate items in the third dimension increased", and other 2D-versus-3D comparisons find the benefit holds in 2D (see [Maps of Knowledge](/interfaces/maps-of-knowledge/)). The closest analogue to a literature review is spatial sensemaking: Space to Think ([Andrews, Endert and North, CHI 2010](https://doi.org/10.1145/1753326.1753336)) used large high-resolution *monitors*, and Immersive Space to Think ([Lisle et al., IEEE VR 2021](https://doi.org/10.1109/VR50410.2021.00077)) had 17 analysts read, annotate and arrange documents in VR, using three distinct layout strategies.

The design rule: documents on 2.5D walls and shelves with stable positions and strong landmarks, not floating 3D clouds. A large monitor or two gets you much of this without a headset [~60%].

## Who should try it, and who should not

| If you… | Then | Why | Main obstacle |
|---|---|---|---|
| Read mostly at a desk with a 27-inch 4K or 5K monitor | **Don't buy a headset for reading.** Spend the money on books or [subscriptions](/access/subscriptions/) | 67–90 PPD on the monitor against 20–37 in a headset. Biener's deficits appeared even against a degraded 1366×768 baseline | None |
| Read where a big monitor won't fit: travel, a small flat, a sofa | **Try display glasses first** (VITURE Luma, \$399), then a headset | Light, roughly 35–40 PPD (I), and a fixed virtual monitor over USB-C | Narrow FOV of about 50–57°; base Apple-silicon chips limit external displays (I) |
| Use a Mac all day for reading and writing, and the budget allows | **Vision Pro (\$3,699)**, tested inside the retailer's return window | The only Mac display built into macOS (Ultrawide 10240×2880) and the only confirmed system-wide custom environments. 4 of 10 long-term users work 5+ h a day | 750–800 g on the head; "hour-plus, not all day"; long-term users are self-selected |
| Find distraction is your binding constraint | **Worth a test** | 9 of 16 in Biener liked VR's isolation; attention improved with immersion (Wienrich and Obremski) | A closed door, full-screen mode and noise-cancelling headphones are cheaper controls. Test them first |
| Do multi-document sensemaking: literature reviews, belief mapping, syllabus building | **The most promising use.** Put documents on 2.5D walls | Room for many documents at once; Space to Think and Immersive Space to Think | Only 1–2 pages are legible in view. Spatial memory also works in 2D on large monitors |
| Get migraines or motion sickness, or feel anxious when you can't see the room | **Don't, or keep the test short with an easy exit** | 2 of 18 Biener recruits quit on day 1 with migraine, nausea and anxiety | — |
| Read on paper and take handwritten notes while reading | **Not yet** | Two long-term Vision Pro users said passthrough is not good enough for reading physical text. Steam Frame's passthrough is monochrome | Passthrough resolution |
| Want light and sharp, and can wait | **Wait for Meta VR Glasses** (\$1,299.99, ~100 g, 37 PPD, spring 2027) | On paper, the first mainstream device that is both light and sharp | Not shipping; Mac path unconfirmed; ship dates in this category slip |
| Run Linux and like to tinker | Steam Frame is the most open device, but **not for reading** | SteamOS, Chrome and APKs | ~20 PPD, monochrome passthrough, 1.5–2 h battery, orders queued into 2027 |
| Want maximum sharpness on a Windows PC | Pimax Crystal Super (57 PPD) | Closest to retina resolution | Heavy, PC-bound, and Pimax has a record of slips |

My lean for the reader this wiki assumes: a headset is a **mode**, not a replacement. It is an occasional focus room or sensemaking wall alongside a monitor, an e-reader and paper. Spend more than the experiment below costs only after the experiment says it helps you.

## The cheapest experiment

The question is personal: *does reading-heavy work in a headset hold up for me after a week of adaptation?* This protocol answers it for at most about \$375, most of it refundable if you buy inside a return window. It is my design; it borrows its measures and the length of the adaptation period from Biener et al.

**Step 0 (free, one day): test the text budget on your monitor.** Enlarge your reader's text to about 1° per em. At 60 cm that is roughly 1 cm per em, or about 30-point type, so a 66-character column comes out about 35 cm wide. Work with one page at a time for a day. If constantly flipping between documents at that density is intolerable for your work, a 20–35 PPD headset will be too, however comfortable it is. Step 0 tests information density only. It says nothing about weight, heat or eye strain.

**Step 1 (two weeks): run a paired trial.**

1. **Hardware.** Borrow a headset if you can. Otherwise buy a Quest 3S (128 GB, \$349.99 as of October 2026) from a seller whose return window covers the two weeks; check the window before buying. To stream your computer, try Meta's free app first (Mac support confirmed by Meta; Quest 3S support on Mac not stated). If it disappoints, add Virtual Desktop (\$24.99) or Immersed's free tier (up to 3 screens; Quest 3S support inferred, not listed). For HTML reading, the Quest Browser alone costs nothing.
2. **Design.** Run 10 working days. Each day, do one reading session of at least 60 minutes in the headset and one at your monitor, alternating which comes first. Pairing within the day controls for sleep and workload, and daily use still gives you a week of adaptation. Use the same kind of material in both, such as consecutive chapters of one textbook or papers from one arXiv category.
3. **Measures, logged after each session:** words per minute on texts with known word counts (arXiv HTML and Standard Ebooks are easy to count with a script); a 5-question quiz generated by an LLM before reading, with the same prompt in both conditions, unseen until afterwards; eye strain on a 1–7 scale; minutes until you first wanted the headset off; and whether you would choose the headset tomorrow.
4. **Analysis.** Compare the paired sessions from **days 6–10 only**, because adaptation was the main dynamic in Biener's week.
5. **Decision rule (my suggestion).** Keep the headset only if, on days 6–10, all of the following hold:
   - speed is at least 90% of your monitor sessions;
   - quiz scores average no more than one question in five lower;
   - eye strain averages no more than one point worse;
   - you would have chosen the headset on at least half the days.

   Otherwise return it.

Five paired days can only detect large effects. For 80% power in a two-sided paired t-test at the 5% level, the difference has to be about 1.7 standard deviations of your day-to-day paired differences (my calculation). Unless your daily reading speed is unusually stable, a 7% speed difference will be lost in the noise (I). That is the right resolution for a keep-or-return decision: you are testing whether the headset is tolerable and useful, not estimating a small effect.

**Step 2 (only if Step 1 was close): change the variable that failed.**

- **Text looked soft** (the most likely complaint at 20 PPD): the next tier is 33–37 PPD. Options are Galaxy XR (\$1,799), Vision Pro (\$3,699), or waiting for Meta VR Glasses.
- **Weight or heat ended your sessions:** wait for Meta VR Glasses (~100 g), or try display glasses.
- **You never wanted to put it back on:** stop. That answer is worth the return shipping.

If your actual problem is travel reading, swap Step 1's device for display glasses (VITURE Luma at \$399). Run the same measures on trains and planes against a laptop screen.

## If you build for headsets

These rules follow from the evidence above. Room-building is covered in [Building a Virtual Reading Room](/environments/virtual-reading-room/).

- **Let the operating system render text wherever you can.** At 20–37 PPD every pixel counts. Safari, SwiftUI, Android views and Mac Virtual Display rasterise text at the compositor level. Inside an immersive WebXR session the DOM is not rendered, so text has to be drawn into WebGL textures, which costs sharpness unless you use WebXR quad layers [~90%]. The best return is usually a flat web reading app designed for headset windows, with the room added separately.
- **Design in degrees, not pixels.** Body text at least 0.7° and ideally about 1° per em, lines no wider than 30–35°, the main page at 1.5–2 m and 10–20° below eye level, secondary panels within ±45°.
- **Use the extra space for context, not more body text.** Outlines, citations, notes and related works can sit in the periphery in large type. Ideas along these lines are in [The Design Space](/building/design-space/) and [Reading Interfaces](/interfaces/reading-interfaces/).
- **Make the headset one mode among several.** Store layouts as data (JSON) and keep the same corpus readable on a flat screen. Workrooms' deletion is the reminder that a vendor's environment can disappear with your setup in it.

## Open questions

- Does a 35+ PPD headset (Vision Pro, Galaxy XR, Meta VR Glasses) match a 4K monitor on comprehension of technical text over 60–120-minute sessions? No 2025–2026 study exists. A Biener-style one-week replication on current hardware, against a real high-resolution monitor, would settle much of this chapter.
- Does visionOS 27 accept an imported, AI-generated equirectangular image as a Personal Environment, or does Photos need capture metadata to treat it as a panorama?
- Which Quest headsets does Meta's Mac streaming app support, how many displays does it give, and how does its text sharpness compare with Virtual Desktop's?
- Has Google PC Connect for Mac shipped on Galaxy XR?
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
