#!/usr/bin/env node
/**
 * Evidence Ledger: build the precomputed claims ledger.
 *
 *   node scripts/prototypes/evidence-ledger.mjs
 *
 * Input:  public/prototypes/data/papers.json (arXiv metadata, CC0, fetched 2026-10-15)
 * Output: public/prototypes/data/evidence-ledger/ledger.json
 *
 * What this does
 * - LEDGER below is hand-authored extraction: Claude read the abstracts of the
 *   200 papers tagged `forecasting` in papers.json (plus keyword hits on
 *   forecasting / prediction markets / superforecasters in the other themes)
 *   and recorded every quantitative claim bearing on the proposition
 *   "LLM-based forecasting systems match human superforecaster accuracy on
 *   real-world questions": metric, value, human baseline, dataset, year, where
 *   the claim places LLM systems relative to human benchmarks ("standing"),
 *   and the verbatim abstract span(s) carrying it. Each paper also gets a
 *   proposed likelihood ratio, a plausible LR band and a one-line rationale.
 *   Papers without a relevant figure or measured comparison were set aside
 *   (SET_ASIDE, with the reason).
 * - Every quoted span is verified here by exact substring match against the
 *   abstract after whitespace normalisation. A claim whose span fails is
 *   dropped (and reported); a paper left with no claim is dropped too.
 * - All extracted content is AI-generated and labelled with PROVENANCE.
 *
 * Re-running is deterministic: same papers.json in, same ledger.json out.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PAPERS = join(APP, 'public/prototypes/data/papers.json');
const OUT_DIR = join(APP, 'public/prototypes/data/evidence-ledger');

const PROVENANCE = 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)';

const PROPOSITION = {
  text: 'LLM-based forecasting systems match human superforecaster accuracy on real-world questions.',
  resolution:
    'Resolves YES if, as of October 2026, the best LLM-based forecasting systems show no reliably measurable accuracy gap (Brier or log score) to superforecasters or equivalent elite human forecasters on real-world questions that resolve after the systems’ training cutoffs.',
  asOf: '2026-10-15',
  priorDefault: 0.4,
};

// Dependence groups: entries that share a benchmark, a comparison design or a team.
const GROUPS = {
  market: 'Scored against prediction-market prices',
  metaculus: 'Metaculus question sets',
  forecastbench: 'ForecastBench questions',
  turtel: 'Same team (Turtel et al.)',
  schoenegger: 'Same team (Schoenegger et al.)',
  leakage: 'Leakage audits',
  correlation: 'Correlated-error studies',
};

// standing: where a claim places LLM systems relative to human benchmarks.
//   above_elite | at_elite | below_elite (elite = superforecasters / pro or expert forecasters)
//   between (above crowd, below elite) | above_crowd | at_crowd | below_crowd (crowd = crowd / market / survey panel)
//   at_individual (≈ individual humans) | none (no human baseline in the claim)
// system: single | ensemble | agentic | trained | human+AI
const LEDGER = [
  {
    id: '2312.06941', short: 'Abolghasemi et al.', type: 'Controlled experiment', system: 'single', group: null,
    lr: 1.0, lo: 0.8, hi: 1.1,
    rationale: '2023 chatbots roughly tie individual retail-sales forecasters. Old, off-domain and measured against individuals rather than elites, so about as likely whether or not today’s best systems reach parity.',
    claims: [
      { metric: 'MAPE, retail sales', value: 'No consistent LLM advantage', baseline: '123 individual human forecasters', dataset: 'Retail sales, standard and promotional periods', year: 2023, standing: 'at_individual',
        quotes: ['Utilizing a controlled experimental setup with 123 human forecasters and five LLMs', 'The findings indicate that LLMs do not consistently outperform humans in forecasting accuracy'] },
    ],
  },
  {
    id: '2402.07862', short: 'Schoenegger et al. (assistants)', type: 'Preregistered experiment', system: 'human+AI', group: 'schoenegger',
    lr: 1.0, lo: 0.9, hi: 1.25,
    rationale: 'LLM advice makes people 24–28% more accurate on six questions. That shows real signal in the models, but it measures augmentation, not a model matching superforecasters on its own.',
    claims: [
      { metric: 'Human accuracy with an LLM assistant', value: '+24% to +28% vs control', baseline: 'Humans given a weaker, non-forecasting model', dataset: '6 questions, N = 991', year: 2024, standing: 'none',
        quotes: ['Participants (N = 991) answered a set of six forecasting questions', 'significantly enhances prediction accuracy by between 24 percent and 28 percent compared to the control group'] },
      { metric: 'Same, outlier item removed (exploratory)', value: '+41% vs +29%', baseline: 'Control group', dataset: '6 questions, N = 991', year: 2024, standing: 'none',
        quotes: ['the superforecasting assistant increased accuracy by 41 percent, compared with 29 percent for the noisy assistant'] },
    ],
  },
  {
    id: '2402.19379', short: 'Wisdom of the Silicon Crowd', type: 'Preregistered experiment', system: 'ensemble', group: 'schoenegger',
    lr: 1.1, lo: 1.0, hi: 1.5,
    rationale: 'A twelve-model ensemble ties a 925-person tournament crowd. Matching the crowd is a precondition for parity, but 31 questions is a small test, the crowd is not elite, and these are early-2024 models.',
    claims: [
      { metric: 'Brier score, aggregate', value: 'Not statistically different', baseline: 'Crowd of 925 tournament forecasters', dataset: '31 binary tournament questions', year: 2024, standing: 'at_crowd',
        quotes: ['We compare the aggregated LLM predictions on 31 binary questions to that of a crowd of 925 human forecasters from a three-month forecasting tournament', 'the LLM crowd outperforms a simple no-information benchmark and is not statistically different from the human crowd'] },
      { metric: 'Accuracy gain from seeing the human median', value: '+17% to +28%', baseline: 'Same models without the human median', dataset: 'GPT-4 and Claude 2', year: 2024, standing: 'none',
        quotes: ['improving accuracy by between 17% and 28%'] },
    ],
  },
  {
    id: '2505.17989', short: 'Outcome-based RL', type: 'System report', system: 'trained', group: 'turtel', self: true,
    lr: 1.25, lo: 1.0, hi: 1.5,
    rationale: 'Simulated bets against Polymarket prices returned over 10%, a hint of an edge over a strong human aggregate. But it is the builders’ own simulation, and betting profit need not mean better accuracy.',
    claims: [
      { metric: 'Simulated trading ROI vs market price', value: 'Over 10% ROI', baseline: 'Polymarket prices', dataset: 'Prediction-market test set', year: 2025, standing: 'above_crowd',
        quotes: ['in a Polymarket trading simulation, we estimate that its bets would have yielded a return on investment of over 10% across all questions in the test set'] },
      { metric: 'Accuracy vs a frontier model', value: '14B model matches or beats o1', baseline: 'o1 (no human baseline)', dataset: 'Prediction-market questions with news', year: 2025, standing: 'none',
        quotes: ['a compact (14B) reasoning model can be trained to match or surpass the predictive accuracy of frontier models like o1'] },
    ],
  },
  {
    id: '2507.04562', short: 'Lu (Metaculus vs experts)', type: 'Benchmark result', system: 'single', group: 'metaculus',
    lr: 0.67, lo: 0.4, hi: 0.9,
    rationale: 'The cleanest elite comparison in the set: on 464 Metaculus questions, frontier models significantly trail expert forecasters. These are mid-2025 models without heavy scaffolding, so it bears on today only partly.',
    claims: [
      { metric: 'Brier score', value: 'Above crowd (“ostensibly”), significantly below experts', baseline: 'Metaculus crowd; group of expert forecasters', dataset: '464 Metaculus questions', year: 2025, standing: 'between',
        quotes: ['I evaluate state-of-the-art LLMs on 464 forecasting questions from Metaculus, comparing their performance against top forecasters', 'Frontier models achieve Brier scores that ostensibly surpass the human crowd but still significantly underperform a group of experts'] },
    ],
  },
  {
    id: '2510.03349', short: 'AgentCaster (tornadoes)', type: 'Benchmark result', system: 'agentic', group: null,
    lr: 0.8, lo: 0.67, hi: 1.0,
    rationale: 'Expert meteorologists clearly beat LLM agents at tornado outlooks. A real-world forecast, but drawing risk polygons from forecast maps is far from typical forecasting questions.',
    claims: [
      { metric: 'TornadoBench', value: 'Experts significantly better', baseline: 'Domain-expert human forecasters', dataset: '40 days, 500+ tornado reports', year: 2025, standing: 'below_elite',
        quotes: ['including over 500 tornado reports', 'Notably, human experts significantly outperform state-of-the-art models'] },
    ],
  },
  {
    id: '2511.02458', short: 'SPF personas (ECB)', type: 'Experiment', system: 'single', group: null,
    lr: 1.1, lo: 0.9, hi: 1.25,
    rationale: 'GPT-4o roughly matches professional macro forecasters, but most of the 50 rounds fall inside its training data, and the panel is economists, not superforecasters.',
    claims: [
      { metric: 'Point-forecast accuracy (inflation, GDP, unemployment)', value: 'Similar; gaps significant but modest', baseline: 'ECB Survey of Professional Forecasters', dataset: '50 quarterly rounds, 2013–2025', year: 2025, standing: 'at_crowd',
        quotes: ['we prompt GPT-4o to replicate the ECB Survey of Professional Forecasters across 50 quarterly rounds (2013-2025)', 'GPT-4o and human forecasters achieve remarkably similar accuracy levels, with differences that are statistically significant yet practically modest'] },
    ],
  },
  {
    id: '2511.07678', short: 'AIA Forecaster', type: 'System report', system: 'agentic', group: 'forecastbench', self: true,
    lr: 2.5, lo: 1.5, hi: 4,
    rationale: 'The only direct parity claim: equal to superforecasters on ForecastBench, a benchmark built to resist leakage. Discounted because it is self-reported, gives no figure in the abstract, and the same system trails liquid markets.',
    claims: [
      { metric: 'ForecastBench score', value: 'Equal to superforecasters (no figure given)', baseline: 'Human superforecasters', dataset: 'ForecastBench', year: 2025, standing: 'at_elite',
        quotes: ['On the ForecastBench benchmark (Karger et al., 2024), the AIA Forecaster achieves performance equal to human superforecasters, surpassing prior LLM baselines'] },
      { metric: 'Accuracy on a market-sourced benchmark', value: 'Below market consensus', baseline: 'Liquid prediction-market consensus', dataset: 'New benchmark from liquid markets', year: 2025, standing: 'below_crowd',
        quotes: ['While the AIA Forecaster underperforms market consensus on this benchmark, an ensemble combining AIA Forecaster with market consensus outperforms consensus alone'] },
    ],
  },
  {
    id: '2512.22625', short: 'Deliberating AI crowds', type: 'Experiment', system: 'ensemble', group: 'metaculus',
    lr: 1.0, lo: 0.9, hi: 1.1,
    rationale: 'Cross-model deliberation cuts log loss by about 4%. Useful headroom, but there is no human comparison, so it barely bears on parity.',
    claims: [
      { metric: 'Log loss', value: '−0.020 (about 4%)', baseline: 'Same models without deliberation', dataset: '202 Metaculus AI-tournament questions, Q2 2025', year: 2025, standing: 'none',
        quotes: ['Using 202 resolved binary questions from the Metaculus Q2 2025 AI Forecasting Tournament', 'reducing Log Loss by 0.020 or about 4 percent in relative terms (p = 0.017)'] },
    ],
  },
  {
    id: '2601.06336', short: 'Future-as-Label', type: 'System report', system: 'trained', group: 'turtel', self: true,
    lr: 1.1, lo: 1.0, hi: 1.25,
    rationale: 'Training on resolved outcomes buys a 27% Brier gain for a mid-size open model. Evidence that method can close gaps, but not a comparison with humans.',
    claims: [
      { metric: 'Brier score', value: '−27%; calibration error halved', baseline: 'Pretrained Qwen3-32B (no human baseline)', dataset: 'Real-world forecasting benchmarks incl. Metaculus', year: 2026, standing: 'none',
        quotes: ['Qwen3-32B trained using Foresight Learning improves Brier score by 27% and halves calibration error relative to its pretrained baseline'] },
    ],
  },
  {
    id: '2601.07992', short: 'Fake date tests', type: 'Measurement audit', system: 'single', group: 'leakage',
    lr: 0.9, lo: 0.8, hi: 1.0,
    rationale: 'Every model tested shows lookahead bias in-sample, so parity claims built on backtests are inflated. A small discount on the literature’s strongest claims.',
    claims: [
      { metric: 'Fake-date test pass rate', value: 'None of the models pass', baseline: 'None', dataset: 'Macroeconomic backtests', year: 2026, standing: 'none',
        quotes: ['none of the modern LLMs tested in this study passed our first test, signaling the presence of lookahead bias in their in-sample forecasts'] },
    ],
  },
  {
    id: '2604.04220', short: 'TimeSeek (Kalshi)', type: 'Benchmark result', system: 'agentic', group: 'market',
    lr: 0.8, lo: 0.67, hi: 1.0,
    rationale: 'Frontier models, alone or in pairs, don’t beat Kalshi prices. Liquid markets are a bar that superforecasters don’t always clear either, so this counts only mildly against.',
    claims: [
      { metric: 'Brier skill score vs market', value: 'Below market overall', baseline: 'Kalshi market prices', dataset: '150 Kalshi markets × 5 checkpoints, 15,000 forecasts', year: 2026, standing: 'below_crowd',
        quotes: ['We evaluate 10 frontier models on 150 CFTC-regulated Kalshi binary markets at five temporal checkpoints, with and without web search, for 15,000 forecasts total', 'Simple two-model ensembles reduce error without surpassing the market overall'] },
      { metric: 'Effect of web search', value: 'Helps overall; hurts in 12% of pairs', baseline: 'Same model without search', dataset: 'Model–checkpoint pairs', year: 2026, standing: 'none',
        quotes: ['Web search improves pooled Brier Skill Score (BSS) for every model overall, yet hurts in 12% of model-checkpoint pairs'] },
    ],
  },
  {
    id: '2605.00844', short: 'The Oracle’s Fingerprint', type: 'Measurement audit', system: 'single', group: 'correlation',
    lr: 0.9, lo: 0.8, hi: 1.0,
    rationale: 'Models from three labs share failure modes (r = 0.77), which caps what multi-model ensembles can gain: weak evidence against near-term parity.',
    claims: [
      { metric: 'Pairwise forecast-error correlation', value: 'r = 0.77', baseline: 'None', dataset: '568 resolved binary questions', year: 2026, standing: 'none',
        quotes: ['GPT-4o, Claude, and Gemini exhibit highly correlated forecasting errors on 568 resolved binary prediction questions (mean pairwise error correlation r = 0.77, p < 0.001; r = 0.78 excluding likely-leaked questions)'] },
    ],
  },
  {
    id: '2605.03762', short: 'OracleProto', type: 'Measurement audit', system: 'agentic', group: 'leakage',
    lr: 1.0, lo: 0.9, hi: 1.1,
    rationale: 'A measurement tool: shows leakage can be held near 1%, which makes later parity tests more trustworthy, but it measures no gap itself.',
    claims: [
      { metric: 'Residual leakage after temporal masking', value: '1.37%', baseline: 'None', dataset: '300 questions, 24,300 trials', year: 2026, standing: 'none',
        quotes: ['We evaluate 27 model-configuration pairs on 300 FutureX-Past-derived questions over 24,300 prediction trials', 'An audit finds only 1.37% residual leakage in retrieval results after temporal masking and leakage filtering'] },
    ],
  },
  {
    id: '2605.16358', short: 'LEAF', type: 'Measurement audit', system: 'agentic', group: 'leakage',
    lr: 0.9, lo: 0.8, hi: 1.0,
    rationale: '8.6% of naively retrieved context leaked the future, so unaudited retrieval-based results may overstate skill.',
    claims: [
      { metric: 'Future-information leakage in context', value: '8.6% → 1.6%', baseline: 'None', dataset: '500 audited tasks', year: 2026, standing: 'none',
        quotes: ['A comprehensive audit across 500 tasks by 47 domain specialists demonstrates that our pipeline suppresses future information leakage from 8.6% to 1.6%'] },
    ],
  },
  {
    id: '2607.18269', short: 'Wisdom of LLM Crowds', type: 'Benchmark result', system: 'ensemble', group: 'market',
    lr: 0.67, lo: 0.5, hi: 0.9,
    rationale: 'Even with the market frozen at each model’s training cutoff, 15 LLMs and learned aggregates stay well behind it, and contamination had inflated apparent gains about fourfold.',
    claims: [
      { metric: 'Accuracy vs market at model cutoff', value: 'Substantially less accurate', baseline: 'Prediction-market prices', dataset: '254 binary market questions, 15 LLMs', year: 2026, standing: 'below_crowd',
        quotes: ['We elicited probability estimates from 15 LLMs on 254 binary prediction market questions', 'Even when the prediction market is evaluated at each model\'s training cutoff, LLMs remained substantially less accurate'] },
      { metric: 'Frontier vs local gap, contaminated vs clean', value: '35.8% → 8.9%', baseline: 'None', dataset: 'Questions resolving after all cutoffs', year: 2026, standing: 'none',
        quotes: ['the apparent capability gap between frontier cloud models and smaller local models collapsed from 35.8% to 8.9% on a clean subset of questions'] },
    ],
  },
  {
    id: '2606.26583', short: 'DPO monoculture', type: 'Experiment', system: 'trained', group: 'correlation',
    lr: 0.9, lo: 0.8, hi: 1.0,
    rationale: 'Preference-tuned agents converge, so a ten-agent LLM market does worse than one agent. Crowds of similar models miss the wisdom-of-crowds boost that superforecaster teams rely on.',
    claims: [
      { metric: 'Accuracy, LLM market vs one agent', value: '67.6% vs 70.2%', baseline: 'None', dataset: 'LLM-agent prediction markets', year: 2026, standing: 'none',
        quotes: ['the 10-agent market (67.6%) fails to match a single standalone agent (70.2%)'] },
    ],
  },
  {
    id: '2607.09921', short: 'Merger-arb forecaster', type: 'System report', system: 'trained', group: null, self: true,
    lr: 1.25, lo: 1.0, hi: 2.0,
    rationale: 'A fine-tuned system beats calibrated market-implied odds by 24% on 400+ out-of-sample deals. An LLM system beating a strong human aggregate, but in one narrow, document-heavy domain, and self-reported.',
    claims: [
      { metric: 'Class-balanced Brier score', value: '0.151; 24% below market-implied', baseline: 'Calibrated market-implied probabilities', dataset: '400+ M&A deals, 42 countries', year: 2026, standing: 'above_crowd',
        quotes: ['On an out-of-sample set of more than 400 large deals spanning 42 countries, our finetuned system achieves the best performance of any method we evaluate, reducing class-balanced Brier score to 0.151', 'This is 24\\% below calibrated market-implied probabilities'] },
    ],
  },
  {
    id: '2607.24573', short: 'LLM-SoccerArena', type: 'Benchmark result', system: 'agentic', group: null,
    lr: 1.0, lo: 0.9, hi: 1.1,
    rationale: 'A prospective, leak-proof test, but the abstract reports no human or bookmaker comparison, so it says nothing about parity.',
    claims: [
      { metric: 'Brier score, web vs no web', value: '−0.023', baseline: 'Same LLMs without web access', dataset: '2026 World Cup: 104 matches + 15 questions', year: 2026, standing: 'none',
        quotes: ['seven LLMs generated forecasts for all 104 matches and 15 tournament-related questions', 'LLMs with web access outperform those without, but only by a small margin (i.e., a 0.023 improvement in Brier score)'] },
    ],
  },
  {
    id: '2609.22246', short: 'The Corroboration Illusion', type: 'Experiment', system: 'agentic', group: 'forecastbench',
    lr: 0.9, lo: 0.8, hi: 1.0,
    rationale: 'Planted articles push retrieval forecasters from Brier 0.18 to 0.37. That tests robustness rather than ordinary accuracy, so it earns only a small discount.',
    claims: [
      { metric: 'Brier score under news poisoning', value: '0.18 → 0.37', baseline: 'Same forecaster, clean corpus', dataset: '500 ForecastBench questions', year: 2026, standing: 'none',
        quotes: ['We evaluate the attack on 500 resolved ForecastBench questions', 'A single LLM-written article per question flips 56% of forecasts across the 0.5 boundary', 'degrading the Brier score from 0.18 to 0.37'] },
    ],
  },
  {
    id: '2609.28876', short: 'Forecast-Dojo', type: 'Benchmark result', system: 'agentic', group: 'market',
    lr: 0.67, lo: 0.5, hi: 0.9,
    rationale: 'With research tools and dated news, all 12 models still trail Polymarket’s historical prices on 1,568 events: recent, leak-controlled, and against a strong human aggregate.',
    claims: [
      { metric: 'Brier score and accuracy vs market', value: 'All 12 models trail the market', baseline: 'Historical Polymarket forecasts', dataset: '1,568 Polymarket events', year: 2026, standing: 'below_crowd',
        quotes: ['Forecast-Dojo contains 1,568 Polymarket events', 'Every model still trails historical market forecasts in both Brier score and accuracy'] },
      { metric: 'Effect of research tools', value: 'Lower Brier for 12 of 12 models', baseline: 'Same models without tools', dataset: 'Forecast-Dojo', year: 2026, standing: 'none',
        quotes: ['In an evaluation of 12 models, research tools lower Brier score for all 12'] },
    ],
  },
  {
    id: '2609.33257', short: 'Two Heads (weak-to-strong)', type: 'Benchmark result', system: 'ensemble', group: 'forecastbench',
    lr: 1.1, lo: 1.0, hi: 1.25,
    rationale: 'Pairs of weaker models match the best single model in 11 of 16 groups. Aggregation is a cheap lever, but there is no comparison with humans.',
    claims: [
      { metric: 'Brier score, weak pair vs strongest single model', value: 'Match or beat in 11 of 16 groups', baseline: 'Strongest individual LLM', dataset: 'ForecastBench, 70 LLM forecasters', year: 2026, standing: 'none',
        quotes: ['we evaluate 70 LLM forecasters across 16 comparison groups', 'Learned linear pooling identifies a weaker pair that matches or outperforms the strongest individual in 11 of 16 groups and comes within 5% of its Brier score in all 16 groups'] },
    ],
  },
];

// Short chart labels for claims (key `${id}|${claimIndex}`); the full value stays in `value`.
const FIGS = {
  '2402.07862|0': '+24–28%', '2402.07862|1': '+41% vs +29%', '2402.19379|1': '+17–28%',
  '2505.17989|1': '14B ≈ o1', '2512.22625|0': '−0.020 log loss', '2601.06336|0': '−27% Brier',
  '2601.07992|0': '0 pass', '2604.04220|1': 'hurts 12%', '2605.00844|0': 'r = 0.77',
  '2605.03762|0': '1.37% leak', '2605.16358|0': '8.6→1.6% leak', '2607.18269|1': 'gap 35.8→8.9%',
  '2606.26583|0': '67.6 vs 70.2%', '2607.24573|0': '−0.023 Brier', '2609.22246|0': 'Brier .18→.37',
  '2609.28876|1': '12 of 12', '2609.33257|0': '11 of 16',
  '2312.06941|0': '≈ individuals', '2402.19379|0': '≈ crowd', '2505.17989|0': '>10% ROI', '2507.04562|0': '< experts',
  '2510.03349|0': '< experts', '2511.02458|0': '≈ SPF panel', '2511.07678|0': '= supers', '2511.07678|1': '< market',
  '2604.04220|0': '< market', '2607.18269|0': '< market', '2607.09921|0': '−24% vs market', '2609.28876|0': '< market',
};

// Read and set aside: relevant-looking papers with no figure or measured comparison,
// or papers that turned out to be about a different question.
const SET_ASIDE = [
  { id: '2506.00723', kind: 'no-figure', reason: 'Methodological critique: argues parity claims are fragile because of temporal leakage, but gives no figure to enter.', quote: 'with some works claiming these systems match or exceed human performance' },
  { id: '2606.29661', kind: 'no-figure', reason: 'Background framing rather than a measured result in this paper.', quote: 'Top AI forecasting systems are approaching superforecaster-level accuracy on future world events' },
  { id: '2412.18544', kind: 'no-figure', reason: 'Background framing; the paper’s own figures are about consistency metrics, not human comparisons.', quote: 'Recent work showing LLM forecasters rapidly approaching human-level performance' },
  { id: '2510.17638', kind: 'no-figure', reason: 'Prophet Arena: qualitative findings only in the abstract (calibration, market returns, slower aggregation than markets).', quote: 'slower information aggregation compared to markets when resolution nears' },
  { id: '2607.14051', kind: 'no-figure', reason: 'Hindcast: a leak-closing evaluation method; the abstract reports no scores.' },
  { id: '2602.21229', kind: 'no-figure', reason: 'Mention markets: an LLM-plus-market mixture beats the market, but no figures, and the winning mixture contains the market price.', quote: 'a mixture of the market probability and MCP (MixMCP) outperforms the market baseline' },
  { id: '2609.22497', kind: 'no-figure', reason: 'Study 4 tests sports forecasting against a real prediction market, but the abstract gives no figures.' },
  { id: '2511.18394', kind: 'no-figure', reason: 'Forecasting ability varies by domain and framing; no figures in the abstract.' },
  { id: '2512.23847', kind: 'no-figure', reason: 'Lookahead-bias test for stock forecasts; qualitative result only.', quote: 'collapses essentially to zero right after the training-data cutoff' },
  { id: '2608.23058', kind: 'no-figure', reason: 'Survey; concludes measurement is the central limitation. No figures.', quote: 'The evidence indicates that measurement is a central limitation.' },
  { id: '2608.28482', kind: 'no-figure', reason: 'Compares scoring rules as training objectives; no figures and no human baseline.' },
  { id: '2501.06496', kind: 'no-figure', reason: '600+ binary questions; news context helps. No result figures and no human baseline.' },
  { id: '2507.23163', kind: 'no-figure', reason: 'Argumentative coherence filter improves human and LLM forecasts; no figures.' },
  { id: '2409.11540', kind: 'adjacent', reason: 'Stock-return expectations: better-calibrated intervals than surveys, but human-like extrapolation bias and no accuracy figure.' },
  { id: '2607.06166', kind: 'adjacent', reason: 'Theory of when forecasts become trading profit; no accuracy figure.' },
  { id: '2607.03015', kind: 'adjacent', reason: 'Trading agent for prediction markets; reports returns, not forecast accuracy.' },
  { id: '2403.03230', kind: 'other-question', reason: 'Predicting the results of published neuroscience studies, not future world events; no figures in the abstract.' },
  { id: '2405.07828', kind: 'other-question', reason: 'Tweet-sentiment election pipeline compared with polls; no figures.' },
  { id: '2412.09385', kind: 'other-question', reason: 'AGI-by-2030 estimates from 16 LLMs: the question is unresolved, so no accuracy can be scored.' },
  { id: '2512.05998', kind: 'other-question', reason: 'Predicting whether other models answer math questions correctly, not real-world events.' },
  { id: '2605.30802', kind: 'other-question', reason: 'Resolving prediction-market questions after the fact, not forecasting them.' },
  { id: '2604.15674', kind: 'other-question', reason: 'Arbitrating disputed market resolutions, not forecasting.' },
  { id: '2606.30987', kind: 'other-question', reason: 'LLMs score the quality of human forecasters’ rationales; not LLM forecasting accuracy.' },
  { id: '2605.11220', kind: 'human-only', reason: 'About the human baseline: prediction markets underperform simple baselines for disease forecasting. No LLMs.' },
  { id: '2102.00517', kind: 'human-only', reason: 'Human prediction markets and surveys forecasting replications. No LLMs.' },
  { id: '2008.13005', kind: 'human-only', reason: 'Human crowd forecasts of the 2018 World Cup. No LLMs.' },
  { id: '2407.01231', kind: 'other-question', reason: 'MIRAI: relational event prediction from GDELT, no human baseline and no figures.' },
  { id: '2406.16964', kind: 'other-question', reason: 'Numeric time-series forecasting, not judgmental forecasting of events (stands for roughly a hundred similar papers in the theme).' },
];

// Precomputed examples of the live "extract with Claude" step, shown when live generation is unavailable.
const LIVE_EXAMPLES = [
  {
    id: '2606.29661',
    result: {
      relevant: true,
      reason: 'States where top AI forecasting systems stand relative to superforecasters, on Metaculus AI Benchmark questions.',
      evidence_type: 'Background statement in a benchmark study',
      self_reported: false,
      claims: [
        { metric: 'Accuracy on future world events', value: '“approaching” superforecaster level', baseline: 'Superforecasters', dataset: 'Field-level statement (Metaculus AI Benchmark context)', year: 2026, standing: 'below_elite', system: 'ensemble',
          quote: 'Top AI forecasting systems are approaching superforecaster-level accuracy on future world events' },
      ],
      lr: 0.8,
      lr_quote: 'Top AI forecasting systems are approaching superforecaster-level accuracy on future world events',
      rationale: 'Builders of top systems describe them as “approaching” superforecaster level in mid-2026: an admitted gap, though background framing rather than a measurement.',
    },
  },
  {
    id: '2409.11540',
    result: {
      relevant: true,
      reason: 'Compares LLM stock-return forecasts with a human crowd platform and surveys, but scores biases and calibration rather than accuracy on resolved questions.',
      evidence_type: 'Empirical study',
      self_reported: false,
      claims: [
        { metric: 'Calibration of 80% intervals', value: 'Better calibrated than surveys', baseline: 'Survey evidence (human)', dataset: 'Historical stock returns', year: 2024, standing: 'none', system: 'single',
          quote: 'When prompted for 80% confidence interval predictions, LLM responses are better calibrated than survey evidence but are pessimistic about outliers' },
      ],
      lr: 1.0,
      lr_quote: 'LLM forecasts over-extrapolate, placing excessive weight on recent performance similar to humans',
      rationale: 'Mixed and adjacent: human-like extrapolation bias alongside better-calibrated intervals, on stock returns rather than forecasting questions. Not diagnostic.',
    },
  },
  {
    id: '2605.30802',
    result: {
      relevant: false,
      reason: 'Not this question: it measures how well LLM agents resolve prediction-market questions after the fact, not how well they forecast them.',
      evidence_type: 'Experiment',
      self_reported: false,
      claims: [
        { metric: 'Resolution accuracy', value: '83.43%', baseline: 'Single-LLM oracles', dataset: '1,189 KalshiBench questions', year: 2026, standing: 'none', system: 'ensemble',
          quote: 'Independent aggregation with confidence-weighted voting achieves the highest accuracy at 83.43 percent' },
      ],
      lr: null,
      lr_quote: null,
      rationale: 'No likelihood ratio: resolution accuracy says nothing about forecasting skill.',
    },
  },
];

// ---------------------------------------------------------------------------

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const data = JSON.parse(readFileSync(PAPERS, 'utf-8'));
const byId = new Map(data.papers.map((p) => [p.id, p]));
const failures = [];
const verify = (id, quote) => {
  const p = byId.get(id);
  if (!p) return false;
  return norm(p.ab).includes(norm(quote)) || norm(p.t).includes(norm(quote));
};
const meta = (p) => ({ id: p.id, t: p.t, a: p.a, y: p.y, c: p.c, th: p.th });

const papers = [];
for (const e of LEDGER) {
  const p = byId.get(e.id);
  if (!p) { failures.push(`${e.id}: not in papers.json`); continue; }
  const claims = [];
  e.claims.forEach((c, ci) => {
    const bad = c.quotes.filter((q) => !verify(e.id, q));
    if (bad.length) { failures.push(`${e.id}: dropped claim "${c.metric}" (span not found: ${bad.map((b) => JSON.stringify(b.slice(0, 60))).join(', ')})`); return; }
    claims.push(FIGS[`${e.id}|${ci}`] ? { ...c, fig: FIGS[`${e.id}|${ci}`] } : c);
  });
  if (!claims.length) { failures.push(`${e.id}: dropped paper (no verified claims)`); continue; }
  papers.push({ ...meta(p), ab: p.ab, short: e.short, type: e.type, system: e.system, group: e.group, self: !!e.self, lr: e.lr, lo: e.lo, hi: e.hi, rationale: e.rationale, claims });
}

const setAside = [];
for (const s of SET_ASIDE) {
  const p = byId.get(s.id);
  if (!p) { failures.push(`${s.id}: set-aside paper not in papers.json`); continue; }
  const quote = s.quote && verify(s.id, s.quote) ? s.quote : undefined;
  if (s.quote && !quote) failures.push(`${s.id}: set-aside quote dropped`);
  setAside.push({ ...meta(p), kind: s.kind, reason: s.reason, quote });
}

const live = [];
for (const ex of LIVE_EXAMPLES) {
  const p = byId.get(ex.id);
  if (!p) { failures.push(`${ex.id}: live example not in papers.json`); continue; }
  const r = { ...ex.result };
  r.claims = r.claims.filter((c) => verify(ex.id, c.quote) || (failures.push(`${ex.id}: live claim dropped`), false));
  if (r.lr_quote && !verify(ex.id, r.lr_quote)) { failures.push(`${ex.id}: live LR quote failed`); r.lr = null; r.lr_quote = null; }
  live.push({ ...meta(p), ab: p.ab, result: r });
}

// Screening stats: what was read.
const kw = /superforecast|forecastbench|metaculus|good judgment|brier|judgmental forecast|prediction market|polymarket|kalshi|forecasting tournament|forecasters?\b/i;
const screened = data.papers.filter((p) => p.th.includes('forecasting') || kw.test(p.t + ' ' + p.ab));
const out = {
  provenance: PROVENANCE,
  source: { file: 'papers.json', note: data.source, fetched: data.fetched },
  built: PROPOSITION.asOf,
  proposition: PROPOSITION,
  groups: GROUPS,
  screened: { total: screened.length, forecastingTheme: data.papers.filter((p) => p.th.includes('forecasting')).length, admitted: papers.length, setAsideListed: setAside.length },
  papers: papers.sort((a, b) => a.y.localeCompare(b.y)),
  setAside,
  liveExamples: live,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'ledger.json'), JSON.stringify(out, null, 1) + '\n');
const nClaims = papers.reduce((n, p) => n + p.claims.length, 0);
console.log(`evidence-ledger: ${papers.length} papers, ${nClaims} claims verified; ${setAside.length} set aside; ${live.length} live examples; screened ${screened.length}.`);
if (failures.length) { console.log('Dropped or failed:'); for (const f of failures) console.log('  - ' + f); }
