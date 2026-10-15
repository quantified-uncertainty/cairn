---
title: University and Employer Access
description: What an unaffiliated Bay Area researcher can get from UC Berkeley, Stanford and SF State as of October 2026 (free walk-in database terminals, paid community cards with no remote access, the UC Berkeley Extension card that includes remote e-resources but requires a paid course, and visiting-scholar appointments), what each costs once eligibility is priced in, how employers license O'Reilly, JSTOR, Springer Nature and Elsevier, what those licenses forbid, and why tools built on them should link rather than ingest.
---

*Status: draft, October 2026. Prices, eligibility rules and product statuses are as of 2026-10-15 unless another date is given. The UC Berkeley, Stanford and SF State library pages, UC Berkeley's visiting-scholar fee and exception pages, the UC Berkeley Extension help center, a sample of 76 Extension course sections, and the JSTOR, Springer Nature and Elsevier licensing pages were re-checked that day. Unverified, and flagged where they come up: whether Extension's "Start Anytime" online courses qualify for the \$25 library card, whether non-alumni members of the Cal Alumni Association can get a UC Berkeley card, what UC Berkeley's own publisher licenses say about AI use, and IEEE and ACM corporate pricing. Sources: the [R03 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md), the [R09 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md) for license terms, and primary sources linked inline.*

A university library holds what no public library or consumer subscription sells: the full journal backfile of the big publishers, specialist databases, and stacks of out-of-print monographs. The problem is that publisher licenses decide who counts as an authorized user, and for remote access the answer is nearly always "current affiliates". This chapter covers what is still open to everyone else in the Bay Area, what the paid routes cost once you include the price of becoming eligible, and how the same licensing logic applies to access through an employer.

## The short version

- **Walk-in access is free and underused.** As of October 2026, any visitor to UC Berkeley's libraries can use licensed databases on the libraries' public computers ([UC Berkeley Library](https://www.lib.berkeley.edu/help/visitors)). SF State's public research stations need "no account or login", and "you can download and save information to a personal USB drive" ([SF State](https://library.sfsu.edu/community-borrowers)). Stanford gives anyone 7 free day passes a year, 14 for its alumni ([Stanford Libraries](https://library.stanford.edu/about-stanford-libraries/visitor-access)). If you need a few dozen paywalled papers, one planned half-day beats any subscription.
- **No paid community card includes remote e-resources.** That holds for UC Berkeley's \$100 California-resident card, Stanford's \$35–\$1,000 researcher cards and SF State's \$50 community card. They buy building entry and borrowing.
- **The UC Berkeley Extension card does include remote access, but the real price is the course.** The card is \$25 for six months, but you must be registered in a "semester-length (10+ week)" Extension course ([Extension help center](https://berkeleyextension.zendesk.com/hc/en-us/articles/16655644122647-Library-use), updated 2026-09-16). In a sample of Extension's open sections on 2026-10-15, credit courses cost \$665–\$2,100, and the cheapest 3-unit course, the cheapest likely to qualify, was \$810. So expect about \$835 per six months, and take this route only if you want the course anyway.
- **A visiting-scholar appointment is the cheapest full remote access if you have a sponsor.** It costs \$750 for the first year and \$1,500 for a consecutive second year. It needs a department appointment and a faculty sponsor, and the standard expectation is a PhD ([VSPA fee](https://vspa.berkeley.edu/about/university-services-fee); [exception rules](https://vspa.berkeley.edu/staff-faculty/vsvsr-appointment-exceptional-request-guidelines)).
- **For physical research-library books, UC Berkeley's \$100 card is the value option.** It covers 20 books at a time and the Main (Gardner) Stacks ([UC Berkeley Library](https://www.lib.berkeley.edu/find/borrow-renew)). Stanford charges \$1,000 a year for the equivalent. None of these cards includes interlibrary loan.
- **Employer licenses are for reading, not for ingestion.** O'Reilly bans using its content "as input or a prompt to a machine learning or AI system" ([agreement](https://www.oreilly.com/membership-agreement/), 2024-10-09). JSTOR bans LLM training, scraping and systematic downloading ([terms](https://about.jstor.org/terms/), 2026-04-24). Elsevier's website terms bar use "in combination with an artificial intelligence tool" unless a license allows it ([terms](https://www.elsevier.com/legal/elsevier-website-terms-and-conditions), 2026-03-12). Commercial text and data mining (TDM) is a separately priced product at Springer Nature and Elsevier.
- **For tool builders: link, don't ingest.** Store the catalog (identifiers, tables of contents, your notes). Send the reader to the licensed copy through their own authenticated session. Keep Claude on metadata, notes and openly licensed text unless a license explicitly covers AI processing.

## Why remote access is the hard part

The pattern below is my reading of what the three libraries publish, not a quotation from any license [~80%].

- **Licenses are scoped to a population.** A university's e-resource license covers its students, faculty and staff, and usually walk-in users on the premises. Remote access is enforced by checking affiliation, through a campus login, proxy or VPN.
- **Paid community cards don't add you to that population.** The fee buys building and borrowing privileges, which the library controls. Remote e-resources are governed by publisher contracts, which it does not. UC Berkeley says so for Wi-Fi: free basic visitor Wi-Fi "does not include access to Library-licensed resources" ([visitors](https://www.lib.berkeley.edu/help/visitors)). Stanford says it for all of its cards: "access from personal devices or off campus requires a SUNet ID" ([visitor access](https://library.stanford.edu/about-stanford-libraries/visitor-access)).
- **So the routes to remote access are routes to affiliation.** At UC Berkeley the listed paths are an Extension enrollment, a visiting-scholar or postdoc appointment, retired-employee status, Extension faculty status and some campus-affiliate staff roles ([borrow & renew](https://www.lib.berkeley.edu/find/borrow-renew)). Everything else is walk-in.

The same logic is closing public-library routes. LAPL restricted its instant e-card to Los Angeles City residents because "licensing agreements with our digital content vendors require" it ([LAPL](https://lapl.org/library-card/borrowing-policies-and-information)). See [Public Libraries](/access/public-libraries/).

## UC Berkeley

### What each category gets

All rows are from the library's "Borrow & renew" page as of 2026-10-15 ([UC Berkeley Library](https://www.lib.berkeley.edu/find/borrow-renew)) unless another source is linked.

| Category | Price (Oct 2026) | Remote licensed e-resources | Requirements and notes |
|---|---|---|---|
| Visitor, no card | Free | **No** | Databases on library public computers; printing and scanning; one-day Main Stacks pass on request ([visitors](https://www.lib.berkeley.edu/help/visitors)) |
| **California resident** | **\$100/yr (\$95 seniors)** | **No** | California ID or government photo ID plus proof of California residency. 20 books; Main (Gardner) Stacks; no interlibrary borrowing |
| **Extension student, 10+ week course** | **\$25 per 6 months** (course fee extra) | **Yes** | Proof of current registration plus photo ID |
| CSU or community-college student | \$25 per 6 months | No | Proof of current registration plus photo ID |
| Private or parochial K-12 teacher | \$100/yr | No | Government photo ID |
| UC alumni association member (California resident) | Fee not stated | No | Active membership card or proof of payment, plus proof of California residency |
| **Visiting scholar or postdoc** | No card fee listed; appointment fee \$750 first year ([VSPA](https://vspa.berkeley.edu/about/university-services-fee)) | **Yes** | Department appointment, faculty sponsor, VSPA registration |
| Retired UC Berkeley employee; Extension faculty | Free | Yes | Retiree card or appointment |
| Stanford faculty, academic staff, postdocs, grad students | Fee not stated | No | Stanford ID (reciprocal with Stanford's free cards for UC Berkeley grads and faculty) |

**How to apply (paid cards).** Email the Privileges Desk with your name, address, phone and supporting documents, or go to the desk on the first floor of Doe Library. Processing takes 1–3 business days. You collect the card in person with photo ID. The desk accepts cards and checks, not cash ([borrow & renew](https://www.lib.berkeley.edu/find/borrow-renew)).

### Walk-in: public computers and the Gardner Stacks

"Most libraries are open to the public." Visitors without a card can do the following ([visitors](https://www.lib.berkeley.edu/help/visitors), October 2026):

- **Use the libraries' public computers** for "databases, catalogs, and educational resources". This is the free route to UC Berkeley's licensed journals. The page does not say whether you can save files to USB from those computers. I have not verified it.
- **Print and scan** in the libraries.
- **Request a one-day pass to the Main (Gardner) Stacks.** "Permission for Main Stacks access is not automatic." Longer access, up to three months, takes a separate request.

**Decision.** If what you need is articles, a walk-in session is the right first move. Use the \$100 card only for borrowing physical books. The card adds no electronic access that a visitor lacks.

### The \$100 California-resident card

The \$100 card (\$95 for seniors) buys borrowing: 20 books at a time and the Gardner Stacks. It is worth buying if your work runs on print monographs that Bay Area public libraries and Link+ lack: older statistics, philosophy of probability, economic history. For anything electronic it adds nothing over a free visit.

It also excludes interlibrary borrowing. For a single print-only title, Link+ through a public library is free and usually takes under a week ([Public Libraries](/access/public-libraries/)). Buy the card if you expect to borrow several books a year that Link+ cannot supply [inference].

### The Extension route: a \$25 card that requires a course

This is the only route on the page that gives an unaffiliated person UC Berkeley's licensed e-resources from home without a sponsor. The Extension help center describes it this way (updated 2026-09-16, [Extension](https://berkeleyextension.zendesk.com/hc/en-us/articles/16655644122647-Library-use)):

- "After the start of a semester-length (10+ week) Extension course, you can purchase a \$25 6-month borrowing card."
- The card gives access to "licensed electronic resources, such as journals and databases" and up to 20 books at a time.
- You set it up at the Privileges Desk in Doe Library, or by email, with "proof of your current registration" and government photo ID.

**What the course costs.** R03 could not check Extension course prices because the catalog is rendered in JavaScript, and marked them unverified. On 2026-10-15 I queried the public course web service that Extension's course pages call: 20 keyword searches, 76 open sections. All of them were online. Representative prices:

| Course | Format | Units | Dates | Fee (Oct 2026) |
|---|---|---|---|---|
| [ENGLISH X135A American Fiction](https://extension.berkeley.edu/search/publicCourseSearchDetails.do?method=load&courseId=41071) | Online, Start Anytime | 3 | 90–180 days from enrollment | **\$810** |
| PSYCH X139.1 Adolescent Psychology; HISTORY XBW7A U.S. History | Online, Start Anytime | 3–4 | 90–180 days | \$910 |
| STAT X471 Introduction to Biostatistics | Online, Start Anytime | 3 | 90–180 days | \$940 |
| [COMPSCI X461 Artificial Intelligence Foundations](https://extension.berkeley.edu/search/publicCourseSearchDetails.do?method=load&courseId=86614611) | Live Online (Thursday evenings) | 2 | Oct 8 – Dec 17, 2026 | \$1,045 |
| COMPSCI X459.5 Machine Learning and Deep Learning | Online, fixed dates | 2 | Oct 13 – Dec 15, 2026 | \$1,045 |
| STAT X10 Introduction to Statistics; MATH X11 Calculus 1 | Online, Start Anytime | 4 | 90–180 days | \$1,205 |
| ECON X2 Introduction to Microeconomics | Online, Start Anytime | 3 | 90–180 days | \$1,450 |

Across the 63 sample sections worth 2 or more units, fees ran from \$665 to \$2,100, with a median of \$1,045. The cheapest, at \$665, was a 2-unit Start Anytime course, which probably does not meet the ten-week rule (below). The cheapest 3-unit course was \$810. The sample covers only sections that were open on 2026-10-15 and that matched my keywords. Classroom sections and other terms may be priced differently.

**Two eligibility questions to settle before you pay:**

1. **Does a Start Anytime course count as "semester-length (10+ week)"?** These courses have no fixed dates. You must be enrolled "for at least 30 days per semester unit (up to 90 days)" and finish within 180 days ([Extension](https://berkeleyextension.zendesk.com/hc/en-us/articles/16681888913943-Start-Anytime-Online-Courses), updated 2026-02-05). So a 3-unit course runs at least 90 days, about 13 weeks, while a 2-unit course's 60-day minimum falls short of ten weeks. The library rule is phrased in terms of semester-length courses. I put it at [~60%] that the Privileges Desk accepts a 3-unit Start Anytime course. Ask privdesk-library@berkeley.edu before enrolling.
2. **Does a fixed-date course span ten weeks?** Of the 17 fixed-date fall sections in the sample, the longest ran 10 weeks from first to last date (Oct 8 – Dec 17). Most ran 9 weeks or less. A course with 10 weekly meetings spans 9 weeks on the calendar, so the date span alone does not settle it. Check with the desk.

**The arithmetic.** At the cheapest course likely to qualify, the \$810 3-unit course, one six-month window costs about \$835 (\$810 + \$25), roughly \$139 a month. Keeping access continuously means two courses a year, about \$1,670. That is more than twice the first-year visiting-scholar fee.

**The discount stack.** Extension gives "\$50 per course section" off to members of UC alumni associations (the discount text in Extension's course data, October 2026; also listed among [CAA member benefits](https://alumni.berkeley.edu/join/alumni-member-benefits/)). The Cal Alumni Association's Standard membership is \$75/yr and "open to all" ([CAA](https://alumni.berkeley.edu/join/)). At two courses a year, the discount (\$100) slightly exceeds the dues. I put it at [~70%] that the discount applies to non-alumni CAA members. Don't join for this alone.

**The card ends with your registration.** Drops are refunded less a \$35 processing fee, and Start Anytime courses must be dropped within 6 days of registering ([drop policy](https://berkeleyextension.zendesk.com/hc/en-us/articles/16682930159127-Drop-a-course)). The card is issued "after the start" of a course to someone with "current registration". I infer that dropping ends eligibility [~85%].

**Decision.** If you would take an Extension course anyway (statistics, ML, economics, or something unrelated you'd enjoy), the remote-access card is a \$25 add-on and the best deal in this chapter. If you would not, \$835 per six months costs more than a full visiting-scholar year and about four times a year of [JPASS](/access/subscriptions/) (\$199/yr for 120 JSTOR PDFs; [JSTOR](https://about.jstor.org/products/jpass/)), though it reaches far more publishers than JPASS. Pay it only for a bounded project, such as a six-month literature review that spans many publishers.

### Visiting-scholar appointments

A visiting-scholar appointment makes you a temporary affiliate. You get a Cal 1 Card, borrow monographs for a month at a time (up to 20 items), and reach online resources from home through links in UC Library Search or the campus VPN ([visiting scholars](https://www.lib.berkeley.edu/help/visiting-scholars), October 2026).

**What it costs** ([VSPA University Services Fee](https://vspa.berkeley.edu/about/university-services-fee), October 2026):

- Visiting scholar: **\$750** for the first year and **\$1,500** for a consecutive second year.
- Visiting student researcher: \$1,000, then \$2,500.
- "A 12-month break in between appointments reverts the reappointment fee to the 1st-year fee."
- The fee is "strictly non-prorated". Either the sponsoring department or faculty member pays, or the scholar does. If the scholar cannot, "the faculty sponsor must cover it on their behalf".
- R03 notes that a department may also charge its own fee.

**Who qualifies.** Appointments follow UC policy APM-430 and must come from "a UC Berkeley department or Organized Research Unit" ([visiting scholars](https://www.lib.berkeley.edu/help/visiting-scholars)). VSPA's exception rules show the defaults ([VSPA](https://vspa.berkeley.edu/staff-faculty/vsvsr-appointment-exceptional-request-guidelines), October 2026):

- **Degree.** A visiting scholar without a PhD needs an exception and must show "research fitness equivalent to a Ph.D., significant independent research experience, or extensive senior-level industry leadership".
- **Recent PhDs.** Someone who earned a PhD within the last five years is "typically Postdoc-eligible". An exception "is considered only if the candidate holds a professorship, a full-time professional role, or a postdoc appointment elsewhere".
- **Duration.** Appointments run up to 12 months, with a "cumulative two-year limit for Visiting Scholars".
- **Justification.** An exception request needs a short research description and a statement of the "University Benefit".

**What this means in practice** [inference, ~75%]. The route works for someone who already collaborates with a Berkeley faculty member, for example a forecasting or AI-safety researcher co-authoring with a statistics or EECS group. It is not a cold-application product. If you have a collaborator, \$750 buys a year of full remote access, about \$62 a month. That is the cheapest broad remote access on this page.

### Alumni

UC Berkeley gives alumni no remote licensed resources. It points them to "freely available resources" and the Friends of the Library ([alumni](https://www.lib.berkeley.edu/help/alumni)). UC alumni who are paid members of an alumni association and live in California can get a card. The fee is not stated, and it includes no remote access ([borrow & renew](https://www.lib.berkeley.edu/find/borrow-renew)). The library page says "Alumni of any University of California campus", so a non-alumnus who joins the Cal Alumni Association probably does not qualify [~70%].

## Stanford

Stanford sells more access tiers than Berkeley, but every one of them is on-site. "Licensed electronic resources may be accessed on designated public computers within the libraries"; off-campus or personal-device access "requires a SUNet ID" ([Stanford Libraries](https://library.stanford.edu/about-stanford-libraries/visitor-access), as of 2026-10-15).

| Category | Access (on-site) | Access and borrowing | Notes |
|---|---|---|---|
| **Anyone: day pass** | **Free, 7 days a year** (14 for alumni) | — | Register in person at Green, Bowes Art & Architecture, East Asia or Music Library. Bring a physical government photo ID, have your photo taken, state a research purpose |
| **Independent researchers and visitors** | **\$35 / 2 weeks; \$75 / month; \$150 / 3 months; \$450 / year** | \$325 / 3 months; \$500 / 5 months; **\$1,000 / year** | Apply online |
| Stanford alumni | \$10 / 2 weeks; \$15 / month; \$40 / 3 months; \$100 / year | \$125 / 3 months; \$175 / 5 months; \$400 / year | Requires a Stanford Alumni Association digital membership card |
| UC Berkeley grad students, faculty, academic staff | Free | Free | Other UC campuses \$10. UC undergraduates and non-academic staff are not eligible |
| Short-term scholar hosted by a department | — | Free for 90 days | Applied for online |
| Continuing Studies students | No library privileges | — | Per R03 ([Stanford Libraries](https://library.stanford.edu/about-stanford-libraries/visitor-access)) |

**Excluded from all visitor cards:** the Law Library, Lane Medical Library, Hoover Library and the Graduate School of Business Library, and interlibrary loan. Card purchases are non-refundable.

**Decisions.**

- **For e-resources, use the free day passes first.** Seven planned days a year clear a large paywalled-paper backlog [inference] (see [the session plan below](#making-a-walk-in-session-count)).
- **Buy \$35 two-week access only for a concentrated project** that needs more than seven on-site days. At four visits in two weeks it costs about \$9 a visit.
- **Stanford has no Extension-style remote-access route.** Continuing Studies students get no library privileges. Stanford's visiting scholars get cards through ID Card Services, the analogue of Berkeley's appointments; their fees and remote-access terms were not checked. Without an appointment, the Bay Area's remote option is UC Berkeley Extension.
- **Stanford alumni** get on-site access to a major research library for \$100/yr, plus remote databases through the alumni association (below).

## SF State and other walk-in options

**SF State (J. Paul Leonard Library)** is the cheapest and least bureaucratic walk-in route in San Francisco (as of 2026-10-15):

- **Public research stations** on floors 1, 3 and 4 "provide on-site access to many research databases and the Library's OneSearch catalog". "No account or login is required" ([accounts](https://library.sfsu.edu/accounts)). You "can download and save information to a personal USB drive". The stations "do not provide access to email or the open web" ([community borrowers](https://library.sfsu.edu/community-borrowers)), so bring a USB drive. You cannot email files to yourself.
- **Community Borrower card: \$50/year.** You pay by donating \$50 or more through the library's online form, then take the receipt to the Book Checkout & Pickup Desk. It allows 20 items, with 30-day loans for books and 7 days for print periodicals. It excludes "off-campus or wireless access to online databases, ebooks, online journals, and other electronic resources", interlibrary loan, and computer-lab and printer access ([community borrowers](https://library.sfsu.edu/community-borrowers)).
- **Free special-borrower cards** go to SF State Alumni Association members, current students and faculty of other CSU campuses, and OLLI and ElderCollege members ([accounts](https://library.sfsu.edu/accounts)). Whether these include any electronic access is not stated.

**Leads I could not verify** [U]:

- San José State's King Library is shared with San José Public Library, which suggests on-site database access for SJPL cardholders.
- California community-college enrollment (historically about \$46 per unit for residents; San Francisco residents may qualify for Free City College) could give student database access. CCSF and De Anza blocked automated checks, so whether part-time community-college students get remote databases is unknown. Note that UC Berkeley's \$25 card for community-college students does *not* include remote access.

## Alumni library programs

Alumni access varies more between universities than any other route in this chapter. Check your own alma mater before paying for anything.

| Program | What you get (Oct 2026) | Cost | Source |
|---|---|---|---|
| **Stanford Alumni Association** | "Free access to searchable databases containing thousands of journals" with alumni credentials; 14 library day passes a year; discounted access cards | Database access free to all alumni; access card from \$10 / 2 weeks | [SAA perks](https://alumni.stanford.edu/perks/); [Stanford Libraries](https://library.stanford.edu/about-stanford-libraries/visitor-access) |
| UC Berkeley alumni | No remote licensed resources; a card for UC alumni-association members in California, fee not stated | CAA Standard \$75/yr | [UCB alumni](https://www.lib.berkeley.edu/help/alumni); [CAA](https://alumni.berkeley.edu/join/) |
| SF State Alumni Association members | Free special-borrower card | Association dues | [SF State](https://library.sfsu.edu/accounts) |
| JSTOR alumni access | Program page not found in 2026. **Status unknown** | — | R03 [U] |
| EBSCO or ProQuest "alumni editions" | Some universities license alumni database packages | Varies | R03 [U] |

**Action:** search your university's alumni site for "library", "databases" or "JSTOR". If it offers an alumni database package, that is free remote access, which no Bay Area route offers without an affiliation or a paid course.

## The routes compared

Costs are as of 2026-10-15. "Remote" means licensed journals and databases from your own device.

| Route | What you get | Cost (Oct 2026) | Remote? | Main catch | Link |
|---|---|---|---|---|---|
| UC Berkeley walk-in | Licensed databases on public computers; print and scan; Gardner Stacks day pass on request | \$0 | No | Stacks access "not automatic"; USB saving unverified | [UCB visitors](https://www.lib.berkeley.edu/help/visitors) |
| SF State research stations | Databases and OneSearch; save to USB; no login | \$0 | No | Limited number of stations; no email or open web | [SF State](https://library.sfsu.edu/community-borrowers) |
| Stanford day pass | On-site collections and designated e-resource computers | \$0, 7 days/yr | No | In-person registration with photo ID | [Stanford](https://library.stanford.edu/about-stanford-libraries/visitor-access) |
| SF State Community Borrower | 20 items, 30-day loans | \$50/yr | No | No ILL; no computers or printers | [SF State](https://library.sfsu.edu/community-borrowers) |
| UC Berkeley California-resident card | 20 books; Gardner Stacks | \$100/yr (\$95 seniors) | No | California residents only; no ILL | [UCB](https://www.lib.berkeley.edu/find/borrow-renew) |
| Stanford researcher access | On-site collections and e-resources | \$35 / 2 wk to \$450/yr | No | Law, medical, Hoover and GSB libraries excluded | [Stanford](https://library.stanford.edu/about-stanford-libraries/visitor-access) |
| Stanford access and borrowing | The above plus borrowing | \$325 / 3 mo to \$1,000/yr | No | Expensive per book | [Stanford](https://library.stanford.edu/about-stanford-libraries/visitor-access) |
| **UC Berkeley Extension card** | Full licensed e-resources remotely; 20 books | **\$25 / 6 mo + course (\$810+ in the Oct 2026 sample)** | **Yes** | Must be registered in a 10+ week course; Start Anytime eligibility unverified | [Extension](https://berkeleyextension.zendesk.com/hc/en-us/articles/16655644122647-Library-use) |
| **UC Berkeley visiting scholar** | Full remote access; Cal 1 Card; borrowing | **\$750 first year**; \$1,500 consecutive second | **Yes** | Faculty sponsor; PhD norm; 2-year cumulative cap | [VSPA](https://vspa.berkeley.edu/about/university-services-fee) |
| Stanford alumni (SAA) | Alumni database package; 14 day passes | \$0 for databases | Partial (alumni package) | Stanford alumni only | [SAA](https://alumni.stanford.edu/perks/) |
| Employer license | Whatever the org licenses, for named users | \$0 to you (see below for what orgs pay) | Yes | Personal reading only; AI and bulk use usually excluded | [below](#how-organizations-license) |

For where these sit relative to free, public-library and subscription routes, see [The Access Ladder](/access/access-ladder/).

## Making a walk-in session count

Walk-in access is only cheap if the visit is productive. R03's suggestion, which I endorse [inference], is to treat a visit as a batch job prepared at home:

1. **Run the legal open-access cascade first** (Unpaywall, OpenAlex, arXiv, author pages). Only items with no legal free copy go on the visit list. See [Open Papers and Preprints](/access/open-papers/).
2. **Write the visit list as DOIs plus the database path** (for example, "JSTOR → *Econometrica* 1974"). Session time at a shared terminal is the binding constraint [inference].
3. **Bring a USB drive** for SF State, where the stations have no email or web. At UC Berkeley, confirm on your first visit whether the public computers allow saving to USB.
4. **Keep it to personal research scale.** JSTOR's terms forbid users to "systematically print out, download, reproduce or distribute" content and prohibit "downloading or printing substantial portions of a run of a journal" ([JSTOR terms](https://about.jstor.org/terms/), 2026-04-24). A few dozen articles for a project is reading. A script, or a whole run of a journal, is not. Never run download tools on a library terminal.
5. **Tag what you bring home.** File each PDF in Zotero (or your catalog) with provenance "obtained on-site, personal use". The tag stops a later AI pipeline from treating it as open text (next section).

## Employer and corporate access

If you work at a university, a research nonprofit or an AI lab, your employer's licenses are probably your broadest access. They are also the most tightly bound.

### How organizations license

| Product | Pricing (as of 2026-10-15) | What's included | Text and data mining (TDM) and AI position | Source |
|---|---|---|---|---|
| **O'Reilly Teams** | \$499 per member per year (2–25 seats) | Full O'Reilly learning platform, cloud labs, admin | Sponsored users are bound by the membership agreement plus any "additional terms" the sponsor sets | [O'Reilly pricing](https://www.oreilly.com/pricing/); [agreement](https://www.oreilly.com/membership-agreement/) |
| O'Reilly Enterprise | Quoted | Adds SSO/SCIM, Search and Insights APIs, Slack/Teams apps | Same agreement | [O'Reilly pricing](https://www.oreilly.com/pricing/) |
| **JSTOR Corporate Collection** | **\$9,000 to \$65,000 a year**, in 14 tiers | 800+ archive journals | JSTOR terms apply: no LLM training, scraping or systematic downloading | [JSTOR corporate fees](https://about.jstor.org/products/fees/corporate-and-for-profit/) |
| **Springer Nature, academic and government subscribers** | TDM rights "at no additional cost" for subscribed content, added to new or renewed agreements | Subscribed journals and ebooks; database products excluded | Non-commercial research only. "The use of Springer Nature's TDM API incurs additional costs" | [Springer Nature TDM](https://www.springernature.com/gp/researchers/text-and-data-mining) |
| **Springer Nature, commercial research** | "For a fee" | Standard TDM terms plus the TDM API | Priced separately. Non-subscribers' requests for paywalled content are "case-by-case" | [Springer Nature TDM](https://www.springernature.com/gp/researchers/text-and-data-mining) |
| **Elsevier, academic subscribers** | Included | Researchers text-mine ScienceDirect full text with a personal API key, including full-text XML | "For non-commercial research purposes" | [Elsevier TDM](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining) |
| **Elsevier, corporate subscribers** | Negotiated: "contact your Elsevier Account Manager" | — | Website terms bar AI-tool use unless a license permits it | [Elsevier TDM](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining); [terms](https://www.elsevier.com/legal/elsevier-website-terms-and-conditions) |
| IEEE Xplore; ACM Digital Library | Not verified: pricing pages blocked automated access | — | — | R03 [U] |

**How JSTOR's corporate pricing works.** Every institution starts at Tier 1, \$9,000 for 0–5 "significantly accessed" journals. Later fees follow usage:

- Year 2 is priced on Year 1's usage, and Year 3 on Year 2's.
- Year 4 is priced on the average of Years 1–3.
- The top tier, Tier 14, covers 251–300 journals at \$65,000.

JSTOR's worked example runs \$9,000, \$11,000, \$15,000, then \$12,500. The page labels the year-3 fee "Tier 3", but its own table puts 16 journals in Tier 4 at \$15,000 ([JSTOR](https://about.jstor.org/products/fees/corporate-and-for-profit/), October 2026).

Usage-based pricing means a team that routes all its reading through JSTOR raises next year's bill [inference]. A 10-person team buying JPASS individually would pay \$1,990 a year against \$9,000 or more. But JPASS is a personal product. Check its terms before an employer pays for it: Springer+'s terms, for comparison, say it is "not licensed for use by companies or organizations" and require personal email and payment ([Springer Nature](https://support.springernature.com/en/support/solutions/articles/6000273908-what-is-springer-)).

**ACM is opening up.** In Crossref, 24,784 of ACM's 37,502 DOIs from 2026 (66%) carry a Creative Commons license, against 12,114 of 45,892 (26%) in 2024 ([Crossref API](https://api.crossref.org/members/320/works?filter=from-pub-date:2026-01-01&rows=0&facet=license:30), 2026-10-15). About 12,000 of the 2026 DOIs carry no license metadata at all. For current computing research, the case for an ACM Digital Library subscription is weakening [inference]. The 1990s backfile is still recorded under ACM's copyright policy, and ACM's free-to-read backfile is a reading permission, not a license (R03's reading).

### What the licenses forbid

| License | Who may use it | Automated retrieval | AI use | Date |
|---|---|---|---|---|
| [O'Reilly membership agreement](https://www.oreilly.com/membership-agreement/) | "Provided for your personal use only. Sharing … accounts is prohibited." Quotes capped at 250 words | "Any use of 'Web spiders,' or any other automated retrieval mechanisms … is strictly prohibited" | No training an AI system. No storing or transmitting content "as input or a prompt to a machine learning or AI system" without the copyright owner's written permission | Updated 2024-10-09 |
| [JSTOR Terms and Conditions](https://about.jstor.org/terms/) | Not covered in the clauses quoted by R03 and R09 | No automatic downloading or scraping; no systematic printing or downloading; no "substantial portions of a run of a journal" | No using content "to train large language models or other generative AI technologies" | Updated 2026-04-24 |
| [Elsevier website terms](https://www.elsevier.com/legal/elsevier-website-terms-and-conditions) | As licensed; institutional license terms "shall control" in a conflict | No "systematic retrieval"; no "robots, spiders, crawlers or other automated downloading programs" | No use "in combination with an artificial intelligence tool (including to train an algorithm, test, process, analyse, generate output …)" unless a license or Elsevier permits it | Revised 2026-03-12 |
| [Springer+](https://support.springernature.com/en/support/solutions/articles/6000273908-what-is-springer-) | Individuals only; "not licensed for use by companies or organizations" | — | — | Modified 2025-12-09 |

**The pattern** (R03's reading, which I share [~85%]):

- An employer's O'Reilly, JSTOR or Elsevier license covers personal reading by named users.
- It forbids bulk or automated retrieval.
- It increasingly excludes AI processing unless a separate AI or TDM agreement has been negotiated.

Three precise points about the AI clauses:

- **O'Reilly's and Elsevier's clauses do not distinguish cloud from local models.** "A machine learning or AI system" and "an artificial intelligence tool" cover a model on your own laptop as much as a cloud API [~80%, my reading of the text]. Running locally lowers exposure and detection risk. It does not obviously cure the breach.
- **JSTOR's clauses, as quoted in R03 and R09, target training, scraping and systematic downloading.** They do not mention prompting. Whether summarizing a single JSTOR article with an LLM breaches JSTOR's terms is unsettled in the sources checked [uncertain]. The institution's own license may say more.
- **Institutional terms can override website terms.** Elsevier says so explicitly. Your employer or university may have negotiated AI rights you can't see. Ask for the AI and TDM clauses in writing rather than guessing in either direction. Whether UC Berkeley's agreements grant AI rights to Extension or visiting-scholar users is unknown.

**Enforcement lands on the organization.** JSTOR may "suspend or terminate access to a specific user, IP address(es), or other authorization" ([JSTOR terms](https://about.jstor.org/terms/)). In practice that often means a whole campus or office proxy. The institution then turns to the individual: loss of library privileges, or a disciplinary process at an employer ([The Legal Map](/building/legal-map/)). A script that pulls PDFs through your employer's proxy can cut off your colleagues' access too.

**Outside the US the floor is different.** EU research organisations (DSM Directive Art. 3) and UK non-commercial researchers (CDPA s.29A) have TDM exceptions that contracts cannot override. US users have no statutory equivalent ([The Legal Map](/building/legal-map/)).

### What this means for building tools: link, don't ingest

The licenses above allow one thing reliably: a named person reading the content in the publisher's own interface. A tool that respects that can still do most of what a reader wants. It handles discovery, organization, routing and note-taking, and leaves the licensed text where it is.

1. **Store the catalog, not the content.** Keep DOIs and ISBNs, titles, authors, tables of contents, your own notes and highlights, and open-licensed full text. Crossref metadata is free to use. Abstracts may be copyrighted ([The Legal Map](/building/legal-map/)).
2. **Route each item to its best legal copy.** In order:
   - an open-access copy;
   - the publisher's DOI landing page, opened in the reader's browser, where the employer's IP range or single sign-on authenticates them;
   - a library proxy link (for example, SFPL's `ezproxy.sfpl.org/login?url=` pattern, per R03);
   - a "walk-in list" entry for SF State, UC Berkeley or Stanford.

   The tool never fetches the PDF server-side with the user's credentials.
3. **Run AI features only on what you may process:** metadata, tables of contents, your own notes, and openly licensed text. For licensed full text, use a publisher TDM API under an explicit license, or an AI service your institution has approved for that content.
4. **Tag every text chunk with its provenance** ("CC BY", "author copy, personal use", "O'Reilly", "JSTOR", "on-site download"). The assistant declines restricted chunks and says why. R03 calls this a "license firewall". It is a core component of any reading tool that touches licensed content, not a nicety.
5. **Don't pool personal licenses.** A team tool cannot share one person's O'Reilly, Perlego or JPASS seat. The legitimate team path is an organizational license, and even those exclude AI processing unless negotiated.
6. **For corpus-scale work, buy the corpus.** If a project needs full text of thousands of papers (citation analysis, claim extraction, a retrieval index), price it through the publisher's TDM channel: free TDM rights for academic subscribers, "for a fee" for commercial research. Do not build it from proxied downloads.

**A worked example.** Suppose a 10-person forecasting team wants a shared "what should we read on base rates for X" tool. The design that stays inside every license above:

- Claude ranks and summarizes from OpenAlex and Crossref metadata and from open-access full text. It drafts reading notes only from what each member writes.
- Each paywalled item gets a "Read via employer access" button that opens the DOI in the member's browser.
- Paywalled Elsevier and Springer content enters the AI pipeline only if the publisher's account manager confirms AI or TDM rights for the team in writing. Open-access articles under CC BY can go in directly.

The architecture is in [A Reference Architecture](/building/reference-architecture/). The legal ratings behind it are in [The Legal Map](/building/legal-map/).

## Recommendations by reader type

| Reader | Do this | Cost (Oct 2026) | Main obstacle |
|---|---|---|---|
| Bay Area independent researcher reading mostly technical books and arXiv | Get public-library cards first ([Public Libraries](/access/public-libraries/)). Add university walk-in visits when a paywalled paper matters. Skip paid university cards | \$0 | Travel time |
| Needs paywalled papers occasionally (a few a month) | Batch them into a monthly walk-in session: SF State stations with a USB drive, or UC Berkeley public computers. Use JSTOR's free reading or JPASS in between | \$0 (JPASS \$199/yr if needed) | Discipline about batching |
| Six-month literature review across many publishers, with a Berkeley faculty collaborator | Visiting-scholar appointment | \$750 first year | Sponsor; PhD norm (exceptions need a stated "University Benefit") |
| Same, without a collaborator | Enroll in an Extension course you actually want; buy the \$25 card after it starts. Confirm eligibility with the Privileges Desk first | About \$835 per 6 months | Course workload; Start Anytime eligibility [~60%] |
| Needs older print monographs from a research library | UC Berkeley \$100 card (Gardner Stacks, 20 books). Stanford \$325 for 3 months if Stanford holds the collection you need | \$100/yr | No interlibrary loan; in-person pickup |
| Visitor from outside California | Stanford day passes, UC Berkeley walk-in, SF State stations. For a public-library card, Santa Clara County issues free full cards to any US address in person | \$0 | UC Berkeley's \$100 card requires California residency |
| Stanford alumnus | Alumni database package, 14 day passes, \$100/yr access card | \$0–\$100 | On-site only for the full collection |
| Alumnus of another university | Check your alma mater's alumni library benefits before paying for anything | Often \$0 [U] | Varies |
| Employee of a university, nonprofit or AI lab | Read through employer access. Get the AI and TDM clauses in writing before building anything on it | \$0 to you | Contract terms you can't see |
| Building a tool for yourself or a team | Link, don't ingest; provenance tags on every chunk; TDM API for corpus work | Tool cost only | Discipline at the ingestion boundary |

## Open questions

- **Does an Extension "Start Anytime" course qualify for the \$25 remote-access card?** Email privdesk-library@berkeley.edu with a specific course number (for example ENGLISH X135A) and record the answer. If yes, the cheapest remote access without a sponsor is \$835 per six months. If no, it rises to the price of a qualifying fixed-date course.
- **Do UC Berkeley's public computers allow saving to USB, and what do walk-in users agree to at login?** One visit answers both.
- **Do UC Berkeley's publisher agreements grant AI or TDM rights to Extension and visiting-scholar users?** The UC system's licenses with major publishers would say. Check whether the California Digital Library publishes license summaries.
- **Can a non-alumnus Cal Alumni Association member get the alumni library card, or the \$50 Extension discount?** Ask the Privileges Desk and Extension.
- **What share of a forecasting or ML reading list needs university access after the open-access cascade?** Take 100 DOIs from a recent reading list, run Unpaywall and OpenAlex, then check the residue against UC Berkeley's catalog. This turns "walk-in is enough" into a number.
- **Which publishers sell an AI-use addendum to corporate subscribers, and at what price?** Elsevier and Springer Nature both route commercial TDM to sales. A quote request for a 10-seat organization would give the first public data point.
- **Do O'Reilly Enterprise contracts include any AI-use rights** beyond the membership agreement's ban? The Enterprise tier's Search and Insights APIs suggest a programmatic channel exists. Its terms were not checked.
- **What do IEEE Xplore and the ACM Digital Library charge corporate customers?** Their pricing pages blocked automated access. A manual visit or a sales quote resolves it.
- **Does a JSTOR alumni access program still exist,** and which universities offer it?
- **Do Bay Area community colleges (CCSF, De Anza) give part-time students remote database access?** If so, a one-unit enrollment could be the cheapest remote route in the region. Both sites blocked automated checks.

## Related pages

- [The Access Ladder](/access/access-ladder/): where walk-in, Extension and visiting-scholar access sit among all the routes
- [What to Do First](/start-here/decision-guide/): the short decision guide
- [Public Libraries](/access/public-libraries/): free cards, Link+ and why out-of-area e-access is shrinking
- [Cheap Subscriptions](/access/subscriptions/): JPASS, DeepDyve, Springer+ and O'Reilly for what institutions don't cover
- [Open Papers and Preprints](/access/open-papers/): the open-access cascade to run before any walk-in visit
- [The Shadow Libraries](/access/shadow-libraries/): why they stay out of any pipeline
- [The Legal Map](/building/legal-map/): the contract layer, TDM exceptions and the green/yellow/red ratings
- [A Reference Architecture](/building/reference-architecture/): routing to content without ingesting it
- [AI Research Assistants](/finding/ai-research-assistants/): which tools touch licensed full text
- [Directory of Sources and Tools](/reference/directory/)
