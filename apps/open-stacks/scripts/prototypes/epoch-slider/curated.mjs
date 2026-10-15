// Hand-checked inputs for the Epoch Slider build.
//
// CURATED: first-publication years for the works the precomputed answers lean on,
// where the shipped data is wrong or ambiguous (Open Library placeholders, Gutenberg
// "year added", reprints and translations). Each carries the reason. These are standard
// bibliographic facts; the rest of the corpus is dated by the policy in ../epoch-slider.mjs.
export const CURATED = {
  'g:9662': { y: 1748, note: 'First published 1748 as Philosophical Essays concerning Human Understanding; retitled 1758. The e-text follows the posthumous 1777 edition.' },
  'c:OL93547W': { y: 1748, note: 'Catalog year 1900 is a reprint; the work first appeared in 1748.' },
  'c:OL93569W': { y: 1739, note: 'Books I–II 1739, Book III 1740.' },
  'g:58881': { y: 1814, note: 'Essai philosophique sur les probabilités, 1814. The English e-text is the 1902 Truscott & Emory translation.' },
  'g:57359': { y: 1888, note: 'This record is the third edition (1888). The first edition appeared in 1866.' },
  'g:65274': { y: 1923, note: 'Collected in 1923; the essays first appeared 1877–1893.' },
  'g:74864': { y: 1874, note: 'First edition 1874. The e-text is the 1883 printing of the second edition (1877).' },
  'g:39713': { y: 1913, note: 'Halsted’s English translations (1913) of La Science et l’hypothèse (1902), La Valeur de la science (1905) and Science et méthode (1908).' },
  'g:5827': { y: 1912, note: 'First published 1912 (Home University Library).' },
  'c:OL1088577W': { y: 1912, note: 'Catalog year 1900 is a placeholder; first published 1912.' },
  'c:OL708894W': { y: 1902, note: 'La Science et l’hypothèse, 1902; catalog year 1900 is a placeholder.' },
  'g:3207': { y: 1651, note: 'First edition 1651; the e-text keeps the original spelling.' },
  'c:OL653987W': { y: 1651, note: 'First edition 1651.' },
  'g:59': { y: 1637, note: 'Discours de la méthode, 1637. The English e-text is John Veitch’s translation (1850).' },
  'c:OL1151518W': { y: 1637, note: 'Discours de la méthode, Leiden 1637 (catalog year 1644 is the Latin edition).' },
  'g:52090': { y: 1748, note: 'L’Homme machine, Leiden 1748. The English e-text is the Open Court edition (1912).' },
  'g:18269': { y: 1670, note: 'Pensées, published posthumously 1670. The e-text is W. F. Trotter’s translation in the Dutton edition of 1958.' },
  'g:75107': { y: 1843, note: 'Menabrea’s 1842 memoir, translated with notes by Ada Lovelace in Taylor’s Scientific Memoirs, 1843.' },
  'g:57532': { y: 1864, note: 'Passages from the Life of a Philosopher, London 1864.' },
  'g:4238': { y: 1832, note: 'On the Economy of Machinery and Manufactures, 1832.' },
  'g:15114': { y: 1854, note: 'An Investigation of the Laws of Thought, 1854.' },
  'c:OL2630376W': { y: 1854, note: 'First published 1854.' },
  'g:36884': { y: 1847, note: 'The Mathematical Analysis of Logic, 1847.' },
  'g:27942': { y: 1843, note: 'First edition 1843. The e-text is the eighth edition (1882).' },
  'c:OL1068214W': { y: 1843, note: 'First edition 1843.' },
  'g:32625': { y: 1921, note: 'A Treatise on Probability, 1921.' },
  'c:OL35949W': { y: 1921, note: 'First published 1921.' },
  'g:2529': { y: 1921, note: 'The Analysis of Mind, 1921.' },
  'g:68991': { y: 1949, note: 'Giant Brains, or Machines That Think, Wiley 1949.' },
  'g:72572': { y: 1962, note: 'Harper & Row, 1962.' },
  'g:55817': { y: 1893, note: 'Automata Old and New, privately printed for the Sette of Odd Volumes, 1893.' },
  'g:28696': { y: 1896, note: 'Symbolic Logic, Part I, 1896 (the e-text is the fourth edition, 1897).' },
  'c:OL151440W': { y: 1896, note: 'Symbolic Logic, Part I, 1896.' },
  'g:69386': { y: 1921, note: 'Western Society of Engineers, Chicago 1921.' },
  'g:3300': { y: 1776, note: 'An Inquiry into the Nature and Causes of the Wealth of Nations, 1776.' },
  'c:OL14986078W': { y: 1763, note: 'Read to the Royal Society 1763 by Richard Price; Philosophical Transactions 1763 (printed 1764).' },
  'c:OL3295030W': { y: 2007, note: 'The Black Swan, 2007 (catalog year 2005 is an error).' },
  'c:OL716849W': { y: 1981, note: 'The Mind’s I, 1981 (catalog year 1962 is an error).' },
  'c:OL2896994W': { y: 1995, note: 'Artificial Intelligence: A Modern Approach, first edition 1995.' },
  'c:OL4465102W': { y: 1990, note: 'Unified Theories of Cognition, 1990.' },
  'c:OL12970183W': { y: 1982, note: 'Judgment under Uncertainty: Heuristics and Biases, Cambridge 1982.' },
  'c:OL4299940W': { y: 1972, note: 'What Computers Can’t Do, 1972 (this record is the 1992 retitled edition).' },
};

// Catalog and Gutenberg records of the same work that the automatic matcher misses.
export const SAME_WORK = {
  'g:9662': 'c:OL93547W',
  'g:3207': 'c:OL653987W',
  'g:5827': 'c:OL1088577W',
  'g:15114': 'c:OL2630376W',
  'g:27942': 'c:OL1068214W',
  'g:32625': 'c:OL35949W',
  'g:4705': 'c:OL93569W',
  'g:3300': 'c:OL76827W',
  'g:28696': 'c:OL151440W',
  'g:2529': 'c:OL1088578W',
  'g:59': 'c:OL1151518W',
};

// Full texts available for quotation and for dating vocabulary. textYear is the year of
// the WORDS in the e-text (edition or translation), which is what the linter uses.
export const TEXT_SOURCES = {
  9662: { key: 'g:9662', textYear: 1777, note: 'Posthumous 1777 text (Selby-Bigge, 1902); first published 1748' },
  4705: { key: 'g:4705', textYear: 1739, note: 'Gutenberg #4705; edition not stated' },
  58881: { key: 'g:58881', textYear: 1902, note: 'English translation by Truscott & Emory, 1902, of the 1814 Essai' },
  57359: { key: 'g:57359', textYear: 1888, note: 'Third edition, 1888' },
  65274: { key: 'g:65274', textYear: 1923, note: 'Collected 1923' },
  74864: { key: 'g:74864', textYear: 1883, note: '1883 printing of the second edition; first edition 1874' },
  39713: { key: 'g:39713', textYear: 1913, note: 'Halsted’s translation, 1913' },
  5827: { key: 'g:5827', textYear: 1912, note: 'First edition, 1912' },
  34901: { key: 'g:34901', textYear: 1859, note: 'First edition text, 1859' },
  1228: { key: 'g:1228', textYear: 1859, note: 'First edition, 1859' },
  3207: { key: 'g:3207', textYear: 1651, note: 'First edition text, 1651, original spelling' },
  59: { key: 'g:59', textYear: 1850, note: 'John Veitch’s translation, 1850, of the 1637 Discours' },
  52090: { key: 'g:52090', textYear: 1912, note: 'Open Court English edition, 1912, of L’Homme machine (1748)' },
  18269: { key: 'g:18269', textYear: 1958, note: 'W. F. Trotter’s translation, Dutton edition of 1958' },
  75107: { key: 'g:75107', textYear: 1843, note: 'Taylor’s Scientific Memoirs, 1843: Lovelace’s translation and notes' },
  57532: { key: 'g:57532', textYear: 1864, note: 'First edition, London 1864' },
  3300: { key: 'g:3300', textYear: 1776, note: 'Gutenberg #3300; edition not stated (Smith revised the text until 1789)' },
  27942: { key: 'g:27942', textYear: 1882, note: 'Eighth edition, 1882; first edition 1843' },
  2529: { key: 'g:2529', textYear: 1921, note: 'First edition, 1921' },
  68991: { key: 'g:68991', textYear: 1949, note: 'Wiley, 1949' },
  4238: { key: 'g:4238', textYear: 1832, note: 'Second edition, 1832' },
  55817: { key: 'g:55817', textYear: 1893, note: 'Privately printed, 1893' },
  28696: { key: 'g:28696', textYear: 1897, note: 'Fourth edition, 1897' },
  25447: { key: 'g:25447', textYear: 1917, note: 'Second edition as Mysticism and Logic, 1917' },
  72572: { key: 'g:72572', textYear: 1962, note: 'Harper & Row, 1962' },
  69386: { key: 'g:69386', textYear: 1921, note: 'Western Society of Engineers, 1921' },
};

// Sense drift: words the corpus attests early, but in another sense. The linter marks
// them amber before `until`, with these period lines as evidence (each verified verbatim).
export const SENSE_DRIFT = [
  {
    term: 'computer', re: '\\bcomputers?\\b', until: 1946,
    gloss: 'In every source on the shelf before the late 1940s, a computer is a person who computes.',
    now: 'a programmable machine',
    kwic: [
      { text: 74864, key: 'g:74864', y: 1883, line: 'The great table of logarithms of the French Revolutionary Government was worked out by a staff of sixty or eighty computers, most of whom were acquainted only with the rules of arithmetic' },
      { text: 57359, key: 'g:57359', y: 1888, line: 'to deter any but the most persevering computers from undergoing the requisite labour' },
      { text: 39713, key: 'g:39713', y: 1913, line: 'Gauss was at the same time a geometer of genius and a very precocious and accurate computer' },
      { text: 68991, key: 'g:68991', y: 1949, line: 'large staffs of human computers. These mechanical brains not only calculate, however. They also remember and reason' },
    ],
  },
  {
    term: 'information', re: '\\binformation\\b', until: 1948,
    gloss: 'Before the late 1940s, information is news or instruction given to someone, not a quantity a machine handles.',
    now: 'a measurable quantity (Shannon)',
    kwic: [
      { text: 9662, key: 'g:9662', y: 1777, line: 'This question I propose as much for the sake of information, as with an intention of raising difficulties.' },
      { text: 74864, key: 'g:74864', y: 1883, line: 'To know that one feeling differs from another gives purely negative information.' },
      { text: 68991, key: 'g:68991', y: 1949, line: 'A machine can handle information; it can calculate, conclude, and choose' },
    ],
  },
  {
    term: 'intelligence', re: '\\bintelligen(ce|t)\\b', until: 1950,
    gloss: 'On the early shelves intelligence is understanding, or news gathered from others (as in “secret intelligence”). No source before 1950 credits a machine with it.',
    now: 'a capacity that machines might have',
    kwic: [
      { text: 3207, key: 'g:3207', y: 1651, line: 'by confederacy, and secret intelligence, getting knowledge of the private actions of an ignorant, unwary man' },
      { text: 9662, key: 'g:9662', y: 1777, line: 'spreads the intelligence. And this is so well known, that no man of sense gives attention to these reports' },
    ],
  },
  {
    term: 'memory', re: '\\bmemor(y|ies)\\b', until: 1946,
    gloss: 'Babbage’s engine has a “store” and a “mill”; memory is a faculty of minds, not of machines, until the stored-program computers of the late 1940s.',
    now: 'a machine’s storage',
    kwic: [
      { text: 75107, key: 'g:75107', y: 1843, line: 'the collection of columns of Variables may be regarded as a store of numbers, accumulated there by the mill' },
    ],
  },
];

// Vocabulary whose first attestation in the corpus the linter checks. `cs` = case-sensitive.
export const LEXICON = [
  ['probability', '\\bprobabilit(y|ies)\\b'], ['chance', '\\bchances?\\b'], ['odds', '\\bodds\\b'], ['risk', '\\brisks?\\b'],
  ['uncertainty', '\\buncertaint(y|ies)\\b'], ['statistics', '\\bstatistic(s|al|ally)?\\b'], ['frequency', '\\bfrequenc(y|ies)\\b'],
  ['induction', '\\binduction\\b'], ['inference', '\\binferences?\\b'], ['evidence', '\\bevidence\\b'], ['testimony', '\\btestimony\\b'],
  ['miracle', '\\bmiracles?\\b'], ['likelihood', '\\blikelihoods?\\b'], ['prior probability', '\\bprior probabilit'], ['posterior', '\\bposterior\\b'],
  ['Bayesian', '\\bbayesian\\b'], ['base rate', '\\bbase[- ]rates?\\b'], ['expected value', '\\bexpected values?\\b'], ['expected utility', '\\bexpected utilit'],
  ['utility', '\\butility\\b'], ['insurance', '\\binsurances?\\b'], ['lottery', '\\blotter(y|ies)\\b'], ['mortality', '\\bmortality\\b'],
  ['sample', '\\bsampl(e|es|ing)\\b'], ['variance', '\\bvariance\\b'], ['normal distribution', '\\bnormal distribution'], ['Poisson', '\\bpoisson\\b'],
  ['regression', '\\bregressions?\\b'], ['correlation', '\\bcorrelations?\\b'], ['p-value', '\\bp-values?\\b'], ['confidence interval', '\\bconfidence intervals?\\b'],
  ['calibration', '\\bcalibrat(ion|ed|e)\\b'], ['forecast', '\\bforecast(s|ing|er|ers)?\\b'], ['prediction', '\\bpredictions?\\b'],
  ['superforecaster', '\\bsuperforecast'], ['black swan', '\\bblack swans?\\b'], ['fat tails', '\\b(fat|heavy|thick)[- ]tail(s|ed)?\\b'], ['tail risk', '\\btail risks?\\b'],
  ['extreme value', '\\bextreme[- ]values?\\b'], ['power law', '\\bpower[- ]laws?\\b'], ['catastrophe', '\\bcatastroph(e|es|ic)\\b'], ['existential risk', '\\bexistential risks?\\b'],
  ['rare event', '\\brare events?\\b'], ['outlier', '\\boutliers?\\b'], ['simulation', '\\bsimulations?\\b'], ['Monte Carlo', '\\bmonte carlo\\b'],
  ['decision theory', '\\bdecision theory\\b'], ['game theory', '\\b(game theory|theory of games)\\b'], ['heuristic', '\\bheuristics?\\b'], ['cognitive bias', '\\bcognitive bias'],
  ['scoring rule', '\\bscoring rules?\\b'], ['Brier score', '\\bbrier\\b'], ['entropy', '\\bentropy\\b'], ['information theory', '\\binformation theory\\b'],
  ['dataset', '\\bdata ?sets?\\b'], ['algorithm', '\\balgorithms?\\b'], ['computer', '\\bcomputers?\\b'], ['computing', '\\bcomputing\\b'], ['computation', '\\bcomputations?\\b'],
  ['program', '\\bprogram(s|med|ming)?\\b'], ['software', '\\bsoftware\\b'], ['machine', '\\bmachines?\\b'], ['automaton', '\\bautomat(on|ons|a)\\b'], ['robot', '\\brobots?\\b'],
  ['artificial intelligence', '\\bartificial intelligence\\b'], ['AI', '\\bAI\\b', true], ['machine learning', '\\bmachine learning\\b'], ['neural network', '\\bneural net(work)?s?\\b'],
  ['deep learning', '\\bdeep learning\\b'], ['language model', '\\blanguage models?\\b'], ['LLM', '\\bLLMs?\\b', true], ['chatbot', '\\bchat ?bots?\\b'], ['benchmark', '\\bbenchmarks?\\b'],
  ['reasoning', '\\breasoning\\b'], ['logic', '\\blogic(al)?\\b'], ['symbolic logic', '\\bsymbolic logic\\b'], ['Boolean', '\\bboolean\\b'], ['cybernetics', '\\bcybernetics?\\b'],
  ['feedback', '\\bfeedback\\b'], ['intelligence', '\\bintelligen(ce|t)\\b'], ['consciousness', '\\bconsciousness\\b'], ['cognition', '\\bcognition\\b'], ['cognitive science', '\\bcognitive science\\b'],
  ['Turing test', '\\bturing test\\b'], ['Chinese room', '\\bchinese room\\b'], ['memory', '\\bmemor(y|ies)\\b'], ['chain of thought', '\\bchain[- ]of[- ]thought\\b'], ['alignment', '\\balignment\\b'],
  ['digital', '\\bdigital\\b'], ['electronic', '\\belectronic\\b'], ['brain', '\\bbrains?\\b'], ['mind', '\\bminds?\\b'], ['thinking machine', '\\bthinking machines?\\b'],
  ['calculating machine', '\\bcalculating (machine|engine)s?\\b'], ['logical machine', '\\blogical machines?\\b'], ['analytical engine', '\\banalytical engine\\b'], ['reckoning', '\\breckoning\\b'],
  ['inverse probability', '\\binverse probabilit'], ['rule of succession', '\\brule of succession\\b'], ['law of large numbers', '\\blaw of large numbers\\b'],
  ['degree of belief', '\\bdegrees? of belief\\b'], ['subjective probability', '\\bsubjective probabilit'], ['risk management', '\\brisk management\\b'],
  ['reference class', '\\breference class'], ['expert system', '\\bexpert systems?\\b'], ['information', '\\binformation\\b'], ['data', '\\bdata\\b'],
].map(([term, re, cs]) => ({ term, re, cs: !!cs }));
