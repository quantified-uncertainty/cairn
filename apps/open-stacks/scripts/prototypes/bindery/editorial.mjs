/**
 * The Bindery: editorial source for the precomputed volumes.
 *
 * Everything in this file was written by Claude in October 2026 and is
 * AI-generated (notes, one-line reasons, route rationales, substitution
 * notes). The build script (../bindery.mjs) resolves every reference below to
 * a real record in the shared data files (or to a verified open-textbook URL
 * from research/R01-open-books.md) and fails if any reference does not
 * resolve, if a quotation is not verbatim, or if a "not in this corpus" claim
 * turns out to be false.
 *
 * Reference formats
 *   pg:<gutenberg id>#<chapter key>   chapter of a full text in data/texts/
 *   pgx:<gutenberg id>#<key>          excerpt fetched from Gutenberg at build time
 *                                     (book must exist in data/gutenberg.json)
 *   ol:<work id>[#<toc label>]        Open Library work in data/catalog.json, with an
 *                                     optional chapter from a fetched edition TOC
 *   arxiv:<id>                        paper in data/papers.json
 *   ox:<book slug>/<section slug>     OpenStax section (book in data/openstax.json,
 *                                     section verified against the OpenStax archive)
 *   ft:<key>                          free textbook from FREE_TEXTS below (R01 §4)
 *
 * Notes are arrays of strings and {q, src} quotation objects; quotations must
 * appear verbatim (after whitespace normalisation) in the cited text.
 */

export const PROVENANCE =
  'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)';

/** Free, legal textbook chapters named in research/R01-open-books.md §4 and §6. */
export const FREE_TEXTS = {
  'fpp3-5.9': {
    work: 'Forecasting: Principles and Practice (3rd ed.)',
    by: 'Rob J. Hyndman, George Athanasopoulos',
    year: 2021,
    piece: '§5.9 Evaluating distributional forecast accuracy',
    url: 'https://otexts.com/fpp3/toolbox.html#sec-distaccuracy',
    terms: 'Free online (OTexts)',
    words: 1293,
    difficulty: 'technical',
    measured: 'Section headings and word count read from the live page, 2026-10-15',
  },
  'jaynes-1-2': {
    work: 'Probability Theory: The Logic of Science',
    by: 'E. T. Jaynes',
    year: 2003,
    piece: 'Ch. 1–2 Plausible reasoning; The quantitative rules',
    url: 'https://bayes.wustl.edu/etj/prob/book.pdf',
    terms: "Partial: the editor's 95-page PDF holds the front matter and chapters 1–3 only",
    words: 21698,
    pages: 44,
    difficulty: 'technical',
    catalog: 'OL5911565W',
    measured: 'PDF pages 20–63 (pdftotext word count), fetched 2026-10-15',
  },
  'mackay-36': {
    work: 'Information Theory, Inference, and Learning Algorithms',
    by: 'David J. C. MacKay',
    year: 2003,
    piece: 'Ch. 36 Decision theory',
    url: 'https://www.inference.org.uk/itila/book.html',
    terms: 'Free PDF for on-screen viewing (Cambridge University Press permission)',
    pageRange: [451, 456],
    difficulty: 'technical',
    catalog: 'OL8325677W',
    measured: 'Page range from Open Library edition OL7749839M table of contents',
  },
  'ppa-2': {
    work: 'Patterns, Predictions, and Actions',
    by: 'Moritz Hardt, Benjamin Recht',
    year: 2022,
    piece: 'Ch. 2 Fundamentals of prediction',
    url: 'https://mlstory.org/prediction.html',
    terms: 'Full preprint free online (Princeton University Press)',
    words: 8085,
    pages: 24,
    difficulty: 'technical',
    measured: 'Chapter PDF (mlstory.org/pdf/prediction.pdf), 24 pages, fetched 2026-10-15',
  },
  'ppa-causal': {
    work: 'Patterns, Predictions, and Actions',
    by: 'Moritz Hardt, Benjamin Recht',
    year: 2022,
    piece: 'Ch. 9 Causality',
    url: 'https://mlstory.org/causal.html',
    terms: 'Full preprint free online (Princeton University Press)',
    words: 9973,
    pages: 27,
    difficulty: 'technical',
    measured: 'Chapter PDF (mlstory.org/pdf/causal.pdf), 27 pages, fetched 2026-10-15',
  },
  'gs-6': {
    work: 'Introduction to Probability',
    by: 'Charles M. Grinstead, J. Laurie Snell',
    year: 1997,
    piece: 'Ch. 6 Expected Value and Variance',
    url: 'https://math.dartmouth.edu/~prob/prob/prob.pdf',
    terms: 'GNU Free Documentation License',
    pageRange: [225, 284],
    difficulty: 'technical',
    measured: 'Page range from the PDF table of contents, fetched 2026-10-15',
  },
};

/** Excerpts fetched from Project Gutenberg at build time (start/end are line markers). */
export const EXTRA_TEXTS = {
  '18269#233': {
    book: 18269,
    title: 'Pensée 233 (the wager)',
    work: "Pascal's Pensées",
    by: 'Blaise Pascal',
    year: 1670,
    start: /^233$/m,
    end: /^234$/m,
  },
  '50189#III': {
    book: 50189,
    title: 'The Ethics of Belief',
    work: 'The Scientific Basis of Morals, and Other Essays',
    by: 'William Kingdon Clifford',
    year: 1877,
    start: /^III\. THE ETHICS OF BELIEF\.$/m,
    end: /^IV\. THE ETHICS OF RELIGION\.$/m,
  },
  '23921#foretell': {
    book: 23921,
    title: 'How to Foretell Weather',
    work: 'Barometer and Weather Guide',
    by: 'Robert FitzRoy',
    year: 1859,
    start: /^HOW TO FORETELL WEATHER\.$/m,
    end: /^MARINE BAROMETER,$/m,
  },
};

/*
 * Track fields
 *   ref         the record (see formats above)
 *   imp         editor's importance, 1–5 (the allocator's value weight)
 *   core        always bound, at least as a gist
 *   diff        old | popular | standard | technical (reading speed)
 *   why         one line, AI-generated
 *   sub         {ref, loses} or {covered: <ref in this volume>, loses} or {loses}:
 *               what "open web only" / "library card" access keys do to this track
 */

export const VOLUMES = [
  {
    id: 'calibration',
    numeral: 'I',
    title: 'Calibration',
    subtitle: 'from Laplace to LLM forecasters',
    cloth: 'oxblood',
    nominalHours: 20,
    call: 'HB3730 .C35 2026',
    brief:
      'What does it mean for a probability to be right? Calibration, from its classical roots to proper scoring rules and the 2026 papers on training language-model forecasters. Technical; about 20 hours.',
    preface: [
      'A forecaster who says 70% is making a claim that can be checked: of all the things she calls at 70%, about seven in ten should happen. This volume follows that idea from Laplace’s essay of 1814, through the weather offices where it was first put to daily use, to the 2026 papers that train language models on proper scoring rules.',
    ],
    capstone: 'arxiv:2608.28482',
    parts: [
      {
        title: 'What a probability claims',
        note: [
          'Calibration only makes sense if a probability says something that could turn out wrong. Laplace’s second chapter states the tension plainly: ',
          { q: 'Probability is relative, in part to this ignorance, in part to our knowledge.', src: 'pg:58881' },
          ' A number that reports ignorance can still be scored, but only against a run of cases, and that is Venn’s point: his chapter on the measurement of belief argues that the series, not the feeling of confidence, is what a probability statement is about. Read together they give you both axes of a calibration curve, stated confidence against observed frequency. Jaynes, whose opening chapters are free from his editor’s site, rebuilds the rules of probability from plausible reasoning; he joins the volume once there is time to work through derivations.',
        ],
        tracks: [
          { ref: 'pg:58881#II', imp: 5, core: true, diff: 'old', why: 'Laplace’s definition: equally possible cases, relative to what we know and do not know.' },
          { ref: 'pg:57359#VI', imp: 4, core: true, diff: 'old', why: 'Venn’s reply: a degree of belief means something only against a long run of cases.' },
          { ref: 'ox:introductory-statistics-2e/3-3-two-basic-rules-of-probability', imp: 2, diff: 'standard', why: 'A refresher on the addition and multiplication rules, if the notation is rusty.' },
          { ref: 'ft:jaynes-1-2', imp: 4, diff: 'technical', why: 'Probability rebuilt as extended logic, with the product and sum rules derived.' },
          { ref: 'pgx:50189#III', imp: 2, diff: 'old', why: 'The moral case, from 1877, for proportioning belief to evidence.' },
        ],
      },
      {
        title: 'Keeping score',
        note: [
          'Brier’s 1950 paper, which proposed the quadratic score for weather forecasts, is not in this corpus, so this part reaches it through later expositions. Tetlock’s chapter ‘Keeping Score’ explains why forecasts must be scored at all. Niall MacKay’s short paper is the gentlest mathematical introduction here, written as a prologue to Gneiting and Raftery’s review. The FPP3 section extends scoring from single probabilities to whole forecast distributions, with quantile scores and the continuous ranked probability score. Bröcker shows why a proper score splits into reliability, which is calibration, and resolution, the decomposition the capstone paper leans on. Greenberg asks what else a score needs when the goal is training people rather than ranking them.',
        ],
        tracks: [
          {
            ref: 'ol:OL18233878W#3', imp: 5, core: true, diff: 'popular',
            why: 'Why vague forecasts cannot be judged, and how a score fixes that.',
            sub: { covered: 'arxiv:2509.08744', loses: 'Tetlock’s account of why verbal forecasts (“a serious possibility”) cannot be scored, and of his earlier study of expert political judgment.' },
          },
          { ref: 'arxiv:2509.08744', imp: 4, core: true, diff: 'standard', why: 'An elementary introduction to probability scoring and forecast verification.' },
          { ref: 'ft:fpp3-5.9', imp: 3, diff: 'technical', why: 'Quantile scores, the Winkler score and CRPS for whole forecast distributions.' },
          { ref: 'arxiv:0806.0813', imp: 3, diff: 'technical', why: 'Why proper scores decompose into reliability (calibration) and resolution.' },
          { ref: 'arxiv:1401.0398', imp: 3, diff: 'technical', why: 'A survey of proper scoring rules in estimation and model selection.' },
          { ref: 'arxiv:1808.07501', imp: 3, diff: 'standard', why: 'What a scoring rule needs beyond properness when the aim is training people.' },
        ],
      },
      {
        title: 'Weathermen and the overconfident',
        note: [
          'Weather forecasting is where calibrated probabilities were first issued to the public every day. FitzRoy’s guide for barometer owners comes before the numbers: its rules say what a falling glass foretells (',
          { q: 'A fall, with a low thermometer, foretells snow.', src: 'pgx:23921' },
          ') but never how often. Silver’s chapter on weather forecasting picks up the story when forecasts carry percentages that can be checked. Kahneman’s ‘The Illusion of Validity’ and ‘The Outside View’ explain why unscored human judgment drifts toward overconfidence, and the chapter of Noise on selection and aggregation in forecasting covers the two remedies in its title. Mind the access: none of the three in-copyright chapters is free to read in English, and the access keys show what each substitute loses.',
        ],
        tracks: [
          { ref: 'pgx:23921#foretell', imp: 2, diff: 'old', why: 'Barometer rules from 1859, before forecasts carried numbers.' },
          {
            ref: 'ol:OL16700318W#4', imp: 4, core: true, diff: 'popular',
            why: 'Weather forecasting as the success story of calibrated prediction.',
            sub: { ref: 'ox:principles-data-science/5-4-forecast-evaluation-methods', loses: 'Silver’s reporting from inside weather forecasting, the field that first issued calibrated probabilities daily. The OpenStax section covers evaluation methods only.' },
          },
          {
            ref: 'ol:OL15992072W#20', imp: 3, diff: 'popular',
            why: 'Why confidence is a poor guide to accuracy.',
            sub: { ref: 'ox:psychology-2e/7-3-problem-solving', loses: 'Kahneman’s own cases of confident but invalid judgment. The OpenStax section treats heuristics and biases at textbook level.' },
          },
          {
            ref: 'ol:OL15992072W#23', imp: 3, diff: 'popular',
            why: 'Reference classes and base rates as the cure for inside-view optimism.',
            sub: { loses: 'The outside view. No free treatment of reference-class forecasting was found in this corpus.' },
          },
          {
            ref: 'ol:OL17962180W#21', imp: 4, diff: 'popular',
            why: 'Selecting good forecasters and aggregating them.',
            sub: { loses: 'The case that selecting and averaging forecasters reduces noise. Volume III covers aggregation from free sources.' },
          },
        ],
      },
      {
        title: 'Machine forecasters',
        note: [
          'Language models now produce probabilities on request, which makes them forecasters that can be scored like anyone else. The AIA report describes a system that adds statistical calibration on top of an LLM to counter its biases; ConfidenceBench scores verbalized confidence with the Brier score. Paleka and colleagues explain why such results are hard to trust: temporal leakage can make a model look prescient about events it has already read about. The capstone, from August 2026, closes the loop with Part II. Turtel and colleagues train forecasters on five proper scoring rules and find that rules with the same incentive for honesty still produce models that differ in calibration and in how they use the probability scale.',
        ],
        tracks: [
          { ref: 'arxiv:2511.07678', imp: 4, diff: 'standard', why: 'An LLM forecaster with explicit statistical calibration, benchmarked against superforecasters.' },
          { ref: 'arxiv:2607.20526', imp: 3, diff: 'standard', why: 'Brier-scored verbal confidence across 15 frontier models.' },
          { ref: 'arxiv:2506.00723', imp: 4, core: true, diff: 'standard', why: 'How temporal leakage inflates LLM forecasting results.' },
          { ref: 'arxiv:2412.18544', imp: 2, diff: 'technical', why: 'Scoring forecasters today by checking predictions for consistency.' },
          { ref: 'arxiv:2608.28482', imp: 5, core: true, diff: 'technical', why: 'Capstone: five proper scoring rules as training rewards, and how the models differ.' },
        ],
      },
    ],
    rejected: [
      { title: 'Brier, “Verification of forecasts expressed in terms of probability” (1950)', absent: { papers: 'verification of forecasts expressed', catalog: 'verification of forecasts expressed' }, reason: 'Not in papers.json (it predates arXiv) or catalog.json. Reached here through Niall MacKay (arXiv 2509.08744) and FPP3 §5.9.' },
      { title: 'Gneiting & Raftery, “Strictly proper scoring rules, prediction, and estimation” (2007)', absent: { papers: 'strictly proper scoring rules, prediction', catalog: 'strictly proper scoring rules' }, reason: 'Not in this corpus; it is named in the abstract of arXiv 2509.08744, which stands in for it.' },
      { title: 'Tetlock, Expert Political Judgment (2005)', absent: { catalog: 'expert political judgment' }, reason: 'Not in catalog.json. Superforecasting chapter 3 summarises it.' },
      { title: 'Dietrich, Uncertainty, Calibration and Probability (1973)', present: 'OL4470333W', reason: 'Resolves, but it is about calibrating measuring instruments, not forecasts. Dropped as a homonym.' },
    ],
    route: {
      target: 'arxiv:2608.28482',
      concepts: [
        {
          key: 'scoring', name: 'Proper scoring rules',
          needed: 'The paper’s independent variable: five proper scoring rules used as training rewards.',
          nodes: [
            { ref: 'arxiv:2509.08744', adds: 'Elementary account of probability scoring and why properness matters.' },
            { ref: 'ft:fpp3-5.9', adds: 'Scores for whole distributions: quantile, Winkler, CRPS.' },
            { ref: 'ol:OL18233878W#3', adds: 'Why forecasts need scores at all; the Brier score in a tournament.' },
            { ref: 'arxiv:1401.0398', adds: 'The general theory, with uses in estimation and model selection.', needs: ['belief'] },
          ],
        },
        {
          key: 'calib', name: 'Calibration vs. discrimination',
          needed: 'The paper reports calibration error and AUC separately; you need to know why they come apart.',
          nodes: [
            { ref: 'arxiv:2509.08744', adds: 'Forecast verification: reliability diagrams in plain terms.' },
            { ref: 'arxiv:0806.0813', adds: 'Reliability and resolution as separate terms of a proper score.', needs: ['scoring'] },
            { ref: 'arxiv:2408.02841', adds: 'Why calibration metrics alone mislead, and what proper scores add.', needs: ['belief'] },
            { ref: 'ol:OL16700318W#4', adds: 'Calibration in practice: weather forecasts and their biases.' },
          ],
        },
        {
          key: 'bin', name: 'Bias, information and noise',
          needed: 'The paper estimates each model’s profile of bias, information and noise.',
          nodes: [
            { ref: 'ol:OL17962180W#21', adds: 'Selection and aggregation of forecasters, from the authors of Noise.' },
            { ref: 'ol:OL15992072W#20', adds: 'Overconfidence: why confident judgments are not accurate ones.' },
            { ref: 'ox:psychology-2e/7-3-problem-solving', adds: 'Cognitive biases at textbook level: the bias third of the model, not the noise.' },
          ],
          uncharted: [
            { title: 'Satopää et al., the bias–information–noise (BIN) model of forecasting', note: 'Not in this corpus.', search: 'https://scholar.google.com/scholar?q=Satop%C3%A4%C3%A4+bias+information+noise+forecasting' },
          ],
        },
        {
          key: 'belief', name: 'Probability as a checkable claim',
          needed: 'A forecast probability must be the kind of claim a score can reward or punish.',
          nodes: [
            { ref: 'ox:introductory-statistics-2e/3-3-two-basic-rules-of-probability', adds: 'The rules themselves, at textbook pace.' },
            { ref: 'ft:jaynes-1-2', adds: 'Probability derived as the logic of plausible reasoning.' },
            { ref: 'pg:57359#VI', adds: 'Belief measured against series of cases: the frequency reading.' },
            { ref: 'pg:58881#II', adds: 'Probability as a ratio of cases, relative to our ignorance.' },
          ],
        },
        {
          key: 'llm', name: 'LLM forecasters',
          needed: 'The models being trained are LLM forecasters; you need their baseline and the pitfalls of evaluating them.',
          nodes: [
            { ref: 'arxiv:2506.00723', adds: 'Leakage and other reasons LLM forecasting results mislead.' },
            { ref: 'arxiv:2511.07678', adds: 'A strong LLM forecasting system and its calibration layer.', needs: ['scoring'] },
            { ref: 'arxiv:2607.20526', adds: 'Measuring verbalized confidence with the Brier score.', needs: ['scoring'] },
          ],
        },
      ],
    },
  },

  {
    id: 'decision',
    numeral: 'II',
    title: 'An Evening Course in Decision Theory',
    subtitle: 'wagers, expectations and the arguments about them',
    cloth: 'green',
    nominalHours: 5,
    call: 'QA279.4 .E84 2026',
    brief:
      'An evening course in decision theory for a reader who knows some probability: from Pascal’s wager and expected utility to Newcomb’s problem and the agents that make it practical. One evening (5 hours), expandable.',
    preface: [
      'One short pensée of Pascal’s, a chapter of Laplace, and a handful of papers on what an agent should do when a predictor has already guessed its choice. Built for one evening; give it twenty hours and it becomes a short course, with Jeffrey, Ellsberg and the free chapters from MacKay and from Hardt and Recht.',
    ],
    capstone: 'arxiv:2606.29911',
    parts: [
      {
        title: 'The wager',
        note: [
          'Decision theory starts as a gambler’s arithmetic applied to a question with no dice. In Pensée 233 Pascal sets out the bet: ',
          { q: 'Let us weigh the gain and the loss in wagering that God is.', src: 'pgx:18269' },
          ' Strip away the theology and you have a decision matrix, probabilities and payoffs, and the first argument that an infinite payoff swamps any finite stake, the ancestor of every later worry about small probabilities of enormous outcomes. Laplace’s chapter ‘Concerning Hope’ gives the arithmetic its name, mathematical expectation, and then its first correction: moral hope, from a proposal of Daniel Bernoulli’s, under which a gain matters less to the rich than to the poor. Ellenberg’s chapter on lotteries is the modern, cheerful version, when there is time.',
        ],
        tracks: [
          { ref: 'pgx:18269#233', imp: 4, core: true, diff: 'old', why: 'The wager: the first decision matrix, and the first infinite payoff.' },
          { ref: 'pg:58881#IV', imp: 5, core: true, diff: 'old', why: 'Mathematical expectation named, then corrected by “moral hope”.' },
          {
            ref: 'ol:OL17062668W#Eleven', imp: 3, diff: 'popular',
            why: 'Expected value and lotteries, for a general reader.',
            sub: { ref: 'ft:gs-6', loses: 'Ellenberg’s worked lottery stories. Grinstead and Snell cover expected value as a textbook, with exercises.' },
          },
        ],
      },
      {
        title: 'Utility and its discontents',
        note: [
          'If a thousand francs mean less to a rich man, then what we should maximize is not money but something like satisfaction, and the trouble starts. Venn’s chapter on insurance and gambling asks how both can be reasonable when each costs more than it returns on average. Kahneman’s ‘Bernoulli’s Errors’ argues that Bernoulli’s utility of wealth missed a basic fact: people judge outcomes as gains and losses from a reference point, and prospect theory, the next chapter, is the replacement. Pinker’s chapter on rational choice sets out the axioms of expected utility in plain language; read it before Kahneman if the axioms are new. Both Kahneman chapters are in practice buy-or-library: the lendable Open Library copy is a Dutch translation.',
        ],
        tracks: [
          { ref: 'pg:57359#XV', imp: 3, diff: 'old', why: 'Why buying insurance and buying lottery tickets need different explanations.' },
          {
            ref: 'ol:OL15992072W#25', imp: 4, core: true, diff: 'popular',
            why: 'Reference points: what Bernoulli’s utility theory left out.',
            sub: { ref: 'ox:principles-microeconomics-3e/6-3-behavioral-economics-an-alternative-framework-for-consumer-choice', loses: 'Kahneman’s own account of how reference dependence was found. The OpenStax section is a short textbook summary.' },
          },
          {
            ref: 'ol:OL15992072W#26', imp: 3, diff: 'popular',
            why: 'Prospect theory, the descriptive alternative.',
            sub: { covered: 'ox:principles-microeconomics-3e/6-3-behavioral-economics-an-alternative-framework-for-consumer-choice', loses: 'The value function and probability weighting in Kahneman’s own words.' },
          },
          {
            ref: 'ol:OL24340933W#6', imp: 4, diff: 'popular',
            why: 'The expected-utility axioms in plain language.',
            sub: { covered: 'ft:mackay-36', loses: 'A plain-language statement of the axioms. The free chapters state the rule but not the axioms behind it.' },
          },
        ],
      },
      {
        title: 'Beliefs you can act on',
        note: [
          'Expected utility needs probabilities, and the question is whose. Ramsey and Savage, who answered “yours, as revealed by your bets”, are not in this corpus; Jeffrey’s The Logic of Decision (1965) is, and it can be borrowed in English. MacKay’s chapter on decision theory is the shortest complete statement here: choose the action with the best expected utility under your posterior. Hardt and Recht’s ‘Fundamentals of prediction’ shows that a classifier is a decision rule in disguise, its errors priced by a loss function. Ellsberg’s thesis, free in full on the Internet Archive, is the dissent: people treat known and unknown odds differently, and he argues they are not simply making a mistake.',
        ],
        tracks: [
          { ref: 'ol:OL4110659W', imp: 3, diff: 'technical', why: 'Subjective probability and desirability in one framework.' },
          { ref: 'ft:mackay-36', imp: 4, core: true, diff: 'technical', why: 'Six pages: act to maximize expected utility under your posterior.' },
          { ref: 'ft:ppa-2', imp: 3, diff: 'technical', why: 'Prediction as decision: loss functions, risk and the minimum-error rule.' },
          { ref: 'ol:OL5403825W', imp: 3, diff: 'technical', why: 'Ambiguity: known versus unknown odds.' },
        ],
      },
      {
        title: 'Predictors and copies',
        note: [
          'Newcomb’s problem asks what to do when a reliable predictor has already acted on its forecast of your choice. Causal decision theory says your choice cannot change what is in the box; evidential decision theory says your choice is evidence about it. Yudkowsky and Soares propose a third answer, functional decision theory: treat your decision as the output of a function that the predictor also computes. Oesterheld and colleagues explain why this is no longer only a philosopher’s puzzle, since agents built on the same foundation models will meet near-copies of themselves; their dataset tests how LLMs reason about such cases. The capstone, Sjölander’s 2026 paper, restates the debate with nonparametric structural equation models and proposes a fourth theory.',
        ],
        tracks: [
          { ref: 'arxiv:1710.05060', imp: 4, core: true, diff: 'standard', why: 'Functional decision theory, against CDT and EDT.' },
          { ref: 'arxiv:2411.10588', imp: 3, diff: 'standard', why: 'Newcomb-like problems as an evaluation set for LLM reasoning.' },
          { ref: 'arxiv:1506.07359', imp: 2, diff: 'technical', why: 'CDT and EDT extended to agents acting over time.' },
          { ref: 'arxiv:2606.29911', imp: 5, core: true, diff: 'technical', why: 'Capstone: decision theories restated as structural equation models.' },
          { ref: 'arxiv:1308.3780', imp: 2, diff: 'technical', why: 'Decision theory for agents that pay for computation.' },
        ],
      },
    ],
    rejected: [
      { title: 'Savage, The Foundations of Statistics (1954)', absent: { catalog: 'foundations of statistics', author: 'savage' }, reason: 'Not in catalog.json. Jeffrey’s The Logic of Decision stands in for subjective expected utility, and Kadane, Schervish and Seidenfeld’s Rethinking the Foundations of Statistics (OL1992486W) revisits Savage from inside the Bayesian camp.' },
      { title: 'Ramsey, “Truth and Probability” (1926)', absent: { catalog: 'truth and probability', gutenberg: 'truth and probability' }, reason: 'Not in this corpus.' },
      { title: 'Nozick, “Newcomb’s Problem and Two Principles of Choice” (1969)', absent: { catalog: "newcomb's problem", papers: 'two principles of choice' }, reason: 'Not in this corpus; arXiv 1710.05060 restates the problem.' },
      { title: 'Luce & Raiffa, Games and Decisions (1957)', present: 'OL4319281W', reason: 'Resolves, but there is no ebook and no table of contents to choose a chapter from; left out at every budget.' },
    ],
    route: {
      target: 'arxiv:2606.29911',
      concepts: [
        {
          key: 'eu', name: 'Expected utility',
          needed: 'Every decision theory the paper compares is a rule for maximizing some expected value.',
          nodes: [
            { ref: 'ft:mackay-36', adds: 'The rule stated compactly, with worked examples.' },
            { ref: 'ol:OL24340933W#6', adds: 'The axioms behind the rule, in plain language.' },
            { ref: 'ol:OL4110659W', adds: 'Desirability and probability combined in one calculus.' },
            { ref: 'pg:58881#IV', adds: 'Expectation, and Bernoulli’s “moral” correction.' },
            { ref: 'pgx:18269#233', adds: 'The first decision matrix.' },
          ],
        },
        {
          key: 'subj', name: 'Subjective and objective probability',
          needed: 'The paper separates the agent’s subjective model from the world it acts in.',
          nodes: [
            { ref: 'ol:OL4110659W', adds: 'Probabilities as the agent’s own, revealed by preferences.' },
            { ref: 'ol:OL35949W', adds: 'Probability as a logical relation between evidence and conclusion.' },
            { ref: 'ol:OL1992486W', adds: 'Bayesian decision theorists revisit the foundations Savage laid.' },
            { ref: 'pg:57359#VI', adds: 'The frequentist objection to measuring belief directly.' },
          ],
          uncharted: [
            { title: 'Savage, The Foundations of Statistics (1954)', note: 'Not in catalog.json.', search: 'https://openlibrary.org/search?q=savage+foundations+of+statistics' },
          ],
        },
        {
          key: 'causal', name: 'Causal models',
          needed: 'The framework is built from nonparametric structural equation models.',
          nodes: [
            { ref: 'ft:ppa-causal', adds: 'Structural causal models and interventions, free and current.' },
            { ref: 'ol:OL4624598W#Chapter 6', adds: 'Decision analysis and the value of information in belief networks.' },
            { ref: 'ol:OL4624596W', adds: 'The full theory of causal models and counterfactuals.' },
          ],
        },
        {
          key: 'newcomb', name: 'Newcomb-like problems',
          needed: 'Its test cases, the smoking lesion and Newcomb’s problem, are where CDT and EDT disagree.',
          nodes: [
            { ref: 'arxiv:1710.05060', adds: 'The problems, the two classic answers and a third.', needs: ['eu'] },
            { ref: 'arxiv:2411.10588', adds: 'Why the problems matter for interacting AI agents.' },
            { ref: 'arxiv:1506.07359', adds: 'The two theories made precise for sequential agents.', needs: ['eu', 'causal'] },
          ],
          uncharted: [
            { title: 'Nozick, “Newcomb’s Problem and Two Principles of Choice” (1969)', note: 'Not in this corpus.', search: 'https://scholar.google.com/scholar?q=Nozick+Newcomb%27s+problem+and+two+principles+of+choice' },
          ],
        },
      ],
    },
  },

  {
    id: 'crowds',
    numeral: 'III',
    title: 'Many Minds',
    subtitle: 'juries, crowds and model ensembles',
    cloth: 'navy',
    nominalHours: 20,
    call: 'JC328.2 .M36 2026',
    brief:
      'When is a crowd wiser than its members? From Laplace on juries and Hume on testimony to the 2026 papers on ensembles of language models and their correlated errors. About 20 hours.',
    preface: [
      'Laplace thought a court of many enlightened judges was more likely to be right than one, provided each judge was more often right than wrong. Two centuries later the judges are language models trained on much the same text, and whether their errors are independent is the whole question. This volume reads the old arithmetic of juries and averages against the 2026 papers on LLM crowds.',
    ],
    capstone: 'arxiv:2607.18269',
    parts: [
      {
        title: 'Tribunals and testimonies',
        note: [
          'Laplace’s chapter on tribunals opens with a sentence that could be the thesis of every later paper in this volume: ',
          { q: 'the correctness of judgments is as much more probable as the judges are more numerous and more enlightened.', src: 'pg:58881' },
          ' Read it with the chapters on assemblies and testimonies and two conditions emerge. Each judge or witness must be more often right than wrong, which Laplace states, and nothing may make their errors move together, which his arithmetic takes for granted. Hume’s essay on miracles is the sceptic’s half of the same calculation: ',
          { q: 'A wise man, therefore, proportions his belief to the evidence.', src: 'pg:9662' },
          ' Venn’s chapter on testimony, at larger budgets, asks whether witnesses can be treated as a statistical series at all.',
        ],
        tracks: [
          { ref: 'pg:58881#XIII', imp: 5, core: true, diff: 'old', why: 'Courts as probability: more and better judges, more likely right.' },
          { ref: 'pg:58881#XII', imp: 3, diff: 'old', why: 'Elections and assemblies: how votes aggregate opinion.' },
          { ref: 'pg:58881#XI', imp: 3, diff: 'old', why: 'How far a chain of witnesses can be believed.' },
          { ref: 'pg:9662#X', imp: 3, core: true, diff: 'old', why: 'Testimony weighed against experience: the sceptic’s calculation.' },
          { ref: 'pg:57359#XVI', imp: 2, diff: 'old', why: 'Can witnesses be treated as a statistical series?' },
        ],
      },
      {
        title: 'The average as an instrument',
        note: [
          'Averaging is the oldest way to turn many fallible judgments into one better one. Venn’s closing chapter treats the average as an instrument for approximating the truth, warranted by the law of error. Stigler’s ‘Aggregation’, the first of his seven pillars, tells how statisticians learned to gain accuracy by discarding the identity of individual observations. Surowiecki’s book popularized the conditions under which a crowd is wise; read it whole only at large budgets. Mill’s chapter on liberty of discussion supplies the argument for diversity that the later papers rediscover: ',
          { q: 'He who knows only his own side of the case, knows little of that.', src: 'pg:34901' },
        ],
        tracks: [
          { ref: 'pg:57359#XIX', imp: 4, core: true, diff: 'old', why: 'The average as an instrument for approximating the truth.' },
          {
            ref: 'ol:OL20041697W#1', imp: 4, diff: 'popular',
            why: 'Aggregation: gaining accuracy by discarding individual detail.',
            sub: { ref: 'pg:57359#XVIII', loses: 'Stigler’s history of how aggregation became statistics’ first principle. Venn’s chapter on kinds of average covers the idea without the history.' },
          },
          {
            ref: 'ol:OL8036447W', imp: 3, diff: 'popular',
            why: 'The popular statement of when crowds are wise.',
            sub: { ref: 'arxiv:2209.08778', loses: 'The popular synthesis and its conditions for a wise crowd. The substitute is one empirical study of a field prediction market.' },
          },
          { ref: 'pg:34901#II', imp: 3, diff: 'old', why: 'Hearing every side as a condition of knowing your own.' },
        ],
      },
      {
        title: 'When errors move together',
        note: [
          'Every argument in Parts I and II assumes the judges err independently. The chapter of Noise on how groups amplify noise shows the assumption failing among people who influence one another. Neyman and Roughgarden connect two problems usually treated apart: for each proper scoring rule there is a matching way to pool forecasts. Yao reviews Bayesian model averaging and stacking, the statistician’s version of a weighted crowd. Tetlock’s ‘Superteams’ is the counterweight worth knowing: in his tournaments, forecasters who worked in teams beat those who worked alone, which suggests that interaction can help when it is structured.',
        ],
        tracks: [
          {
            ref: 'ol:OL17962180W#8', imp: 4, core: true, diff: 'popular',
            why: 'How social influence turns independent errors into shared ones.',
            sub: { ref: 'arxiv:2609.22497', loses: 'Evidence from human groups. The substitute summarises human deliberation results but studies language models.' },
          },
          { ref: 'arxiv:2102.07081', imp: 3, diff: 'technical', why: 'Each proper scoring rule implies its own way of pooling forecasts.' },
          { ref: 'arxiv:1912.11218', imp: 2, diff: 'technical', why: 'Bayesian model averaging against stacking.' },
          {
            ref: 'ol:OL18233878W#9', imp: 3, diff: 'popular',
            why: 'Teams that share information and still outperform individuals.',
            sub: { ref: 'arxiv:2512.22625', loses: 'The human tournament evidence on teams. The substitute tests deliberation among LLMs.' },
          },
        ],
      },
      {
        title: 'Silicon crowds',
        note: [
          'Schoenegger and colleagues found that a crowd of twelve LLMs could rival a crowd of 925 human tournament forecasters on their questions. Spiro measured why that should not be taken for granted: frontier models from different labs make highly correlated errors, a mean pairwise correlation of 0.77 over 568 questions. Begin and colleagues report the same monoculture in LLM prediction markets, where ten preference-tuned agents had the forecasting power of about 1.4 independent ones. Aitchison and colleagues find the remedy in choosing accurate but diverse models rather than more samples. Douven’s capstone puts it together: learned aggregators beat every single model, and once questions that resolved before the models’ training cutoffs are set aside, the gap between large and small models shrinks from 35.8% to 8.9%.',
        ],
        tracks: [
          { ref: 'arxiv:2402.19379', imp: 4, core: true, diff: 'standard', why: 'Twelve LLMs against 925 human forecasters.' },
          { ref: 'arxiv:2605.00844', imp: 4, diff: 'standard', why: 'Correlated errors across frontier models.' },
          { ref: 'arxiv:2606.26583', imp: 3, diff: 'standard', why: 'Preference tuning and monoculture in LLM markets.' },
          { ref: 'arxiv:2606.29661', imp: 3, diff: 'standard', why: 'Choose diverse models, not more samples.' },
          { ref: 'arxiv:2512.22625', imp: 2, diff: 'standard', why: 'Does deliberation help LLM forecasters?' },
          { ref: 'arxiv:2607.18269', imp: 5, core: true, diff: 'technical', why: 'Capstone: aggregation and contamination in LLM ensembles.' },
        ],
      },
    ],
    rejected: [
      { title: 'Condorcet, Essai sur l’application de l’analyse à la probabilité des décisions (1785)', absent: { catalog: 'condorcet', gutenberg: 'probabilité des décisions' }, reason: 'Not in this corpus. Laplace’s chapters on assemblies and tribunals carry the same argument.' },
      { title: 'Galton, “Vox populi”, Nature (1907)', absent: { catalog: 'vox populi', papers: 'vox populi' }, reason: 'Not in this corpus; Stigler and Surowiecki retell it.' },
      { title: 'List & Pettit, Group Agency (2011)', present: 'OL19853595W', reason: 'Resolves, but Open Library has no access status and no table of contents for it; left for a later edition.' },
    ],
    route: {
      target: 'arxiv:2607.18269',
      concepts: [
        {
          key: 'agg', name: 'Aggregating judgments',
          needed: 'The paper compares classical and learned ways of pooling fifteen models’ probabilities.',
          nodes: [
            { ref: 'arxiv:2102.07081', adds: 'Pooling methods matched to scoring rules.', needs: ['score'] },
            { ref: 'ol:OL20041697W#1', adds: 'Why discarding individual detail gains accuracy.' },
            { ref: 'ol:OL8036447W', adds: 'The conditions for a wise crowd, popularly stated.' },
            { ref: 'pg:57359#XIX', adds: 'The average as an instrument of approximation.' },
            { ref: 'pg:58881#XIII', adds: 'Many judges, each more often right than wrong.' },
          ],
        },
        {
          key: 'indep', name: 'Independence of errors',
          needed: 'A crowd beats its members only if their errors partly cancel.',
          nodes: [
            { ref: 'arxiv:2605.00844', adds: 'Measured error correlations among frontier models.' },
            { ref: 'ol:OL17962180W#8', adds: 'How influence correlates human errors.' },
            { ref: 'pg:34901#II', adds: 'Diversity of opinion as a condition of truth-finding.' },
            { ref: 'pg:58881#XIII', adds: 'The independence the jury arithmetic quietly assumes.' },
          ],
          uncharted: [
            { title: 'Galton, “Vox populi”, Nature (1907)', note: 'Not in this corpus.', search: 'https://scholar.google.com/scholar?q=Galton+Vox+populi+1907' },
          ],
        },
        {
          key: 'score', name: 'Scoring probability forecasts',
          needed: 'Every comparison in the paper is a score on resolved binary questions.',
          nodes: [
            { ref: 'arxiv:2509.08744', adds: 'Scoring and verification from first principles.' },
            { ref: 'ft:fpp3-5.9', adds: 'Scores for distributions, with skill scores.' },
            { ref: 'ol:OL18233878W#3', adds: 'Scores in a forecasting tournament.' },
          ],
        },
        {
          key: 'leak', name: 'Contamination and leakage',
          needed: 'Models may already know the answers; the paper calls this training-cutoff contamination.',
          nodes: [
            { ref: 'arxiv:2506.00723', adds: 'The ways temporal leakage enters LLM forecasting evaluations.' },
            { ref: 'arxiv:2504.14765', adds: 'Evidence that models recall economic data from before their cutoff.' },
            { ref: 'arxiv:2512.23847', adds: 'A statistical test for lookahead bias.' },
          ],
        },
        {
          key: 'testimony', name: 'Testimony',
          needed: 'A model’s probability is testimony from a witness of unknown reliability.',
          nodes: [
            { ref: 'pg:57359#XVI', adds: 'Witnesses as a statistical series.' },
            { ref: 'pg:58881#XI', adds: 'The probability of testimonies, and how it decays along a chain.' },
            { ref: 'pg:9662#X', adds: 'Weighing testimony against experience.' },
          ],
          uncharted: [
            { title: 'Condorcet, Essai sur l’application de l’analyse… (1785)', note: 'Not in this corpus.', search: 'https://scholar.google.com/scholar?q=Condorcet+Essai+sur+l%27application+de+l%27analyse+1785' },
          ],
        },
      ],
    },
  },
];
