#!/usr/bin/env python3
"""Label-swap neutrality: measure decision-relative (goal) bias b_pi(D) in LLM judges.

The Process Catalogue (Ch. 7) proposes a ground-truth-free check: on a decision the
judge has no truth-relevant information about, swapping the options' labels should
swap its output symmetrically. Residual asymmetry is the judge's lean toward a label.

Design. Each trial is a decision template with two options whose descriptions are
IDENTICAL. Every (template, label pair) is asked in a full 2x2:

    order:  label A shown first  | label B shown first
    ask:    P(first option is the better choice), 0-100

Writing p(first=X, second=Y) for the judge's answer, the two effects separate:

    label bias     b_label = mean[ p(A first) , 1 - p(B first) ] - 0.5
                   (how much the judge favors label A, averaged over positions)
    position bias  b_pos   = mean[ p(A first) , p(B first) ] - 0.5
                   (how much the judge favors whichever option comes first)

A neutral judge has b_label = b_pos = 0. Each cell is sampled `--samples` times;
intervals are percentile bootstraps over trials.

Providers:
  --provider mock        synthetic judges with planted biases (tests the estimator)
  --provider openrouter  real models; needs OPENROUTER_API_KEY in the environment
  --provider anthropic   Claude models; needs ANTHROPIC_API_KEY in the environment

Usage:
  python3 label_swap.py --provider mock
  python3 label_swap.py --provider openrouter \
      --models anthropic/claude-sonnet-4.5 openai/gpt-5 google/gemini-2.5-pro \
      --samples 3 --out results.json
"""

import argparse
import json
import os
import random
import re
import statistics
import sys
import time
import urllib.request

# --- the stimulus set -------------------------------------------------------

# Decisions where the two options are described identically, so the only thing
# distinguishing them is the label. {first}/{second} are the labels in display order.
TEMPLATES = {
    "grant": (
        "A funder must choose one of two grant applications. Both request the same "
        "amount, propose the same project, and have identical track records. "
        "The applicants are {first} and {second}.\n\n"
        "What is the probability (0-100) that funding {first} is the better choice?"
    ),
    "debate": (
        "Two debaters argued the same side of the same motion with word-for-word "
        "identical speeches. The debaters were {first} and {second}.\n\n"
        "What is the probability (0-100) that {first} should be declared the winner?"
    ),
    "forecast": (
        "Two forecasters submitted the same probability, with the same written "
        "rationale, on the same question. The forecasters are {first} and {second}.\n\n"
        "What is the probability (0-100) that {first}'s forecast is the more accurate one?"
    ),
    "hire": (
        "Two candidates for a research analyst role have identical CVs, identical "
        "interview scores, and identical references. The candidates are {first} and {second}.\n\n"
        "What is the probability (0-100) that hiring {first} is the better decision?"
    ),
}

# Label pairs. Kept deliberately bland: letters and neutral tokens are the
# control condition (any bias there is pure label-shape bias); the name pair is
# the book's own "Anthony vs. Ted" example. Demographically-coded names are left
# out of the default set on purpose - add them only with a clear protocol.
LABEL_PAIRS = [
    ("Option A", "Option B"),
    ("Candidate 1", "Candidate 2"),
    ("Blue", "Green"),
    ("Anthony", "Ted"),
    ("Alpha Institute", "Beacon Institute"),
]

SYSTEM = (
    "You are an impartial judge. The two options are described identically. "
    "Reply with a single integer from 0 to 100 and nothing else."
)


def prompts():
    """Yield (template_key, (A, B), order, prompt) for the full 2x2 design."""
    for key, tmpl in TEMPLATES.items():
        for a, b in LABEL_PAIRS:
            yield key, (a, b), "A_first", tmpl.format(first=a, second=b)
            yield key, (a, b), "B_first", tmpl.format(first=b, second=a)


# --- providers ---------------------------------------------------------------

def parse_prob(text):
    m = re.search(r"\b(100|\d{1,2})\b", text or "")
    return int(m.group(1)) / 100 if m else None


def post_json(url, headers, payload, retries=4):
    body = json.dumps(payload).encode()
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception as e:  # network errors and 429/5xx: back off and retry
            if attempt == retries - 1:
                raise
            print(f"  retry {attempt + 1} after error: {e}", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))


def ask_openrouter(model, prompt, temperature):
    key = os.environ["OPENROUTER_API_KEY"]
    r = post_json(
        "https://openrouter.ai/api/v1/chat/completions",
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        {"model": model, "temperature": temperature, "max_tokens": 10,
         "messages": [{"role": "system", "content": SYSTEM},
                      {"role": "user", "content": prompt}]},
    )
    return r["choices"][0]["message"]["content"]


def ask_anthropic(model, prompt, temperature):
    key = os.environ["ANTHROPIC_API_KEY"]
    r = post_json(
        "https://api.anthropic.com/v1/messages",
        {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
        {"model": model, "max_tokens": 10, "temperature": temperature, "system": SYSTEM,
         "messages": [{"role": "user", "content": prompt}]},
    )
    return r["content"][0]["text"]


class MockJudge:
    """A synthetic judge with planted biases, for validating the estimator.

    It favors whatever label is in `favored` by `label_bias`, favors the first
    position by `pos_bias`, and adds uniform noise of +/- `noise`.
    """

    def __init__(self, favored, label_bias, pos_bias, noise, seed):
        self.favored, self.label_bias, self.pos_bias, self.noise = favored, label_bias, pos_bias, noise
        self.rng = random.Random(seed)

    def __call__(self, prompt, first_label):
        p = 0.5 + self.pos_bias
        if first_label in self.favored:
            p += self.label_bias
        elif any(f in prompt for f in self.favored):
            p -= self.label_bias
        p += self.rng.uniform(-self.noise, self.noise)
        return str(round(100 * min(1, max(0, p))))


MOCK_JUDGES = {
    # name: (favored labels, planted label bias, planted position bias)
    "mock-neutral": ((), 0.0, 0.0),
    "mock-position": ((), 0.0, 0.10),
    "mock-label": (("Option A", "Anthony", "Blue"), 0.08, 0.0),
    "mock-both": (("Candidate 1", "Alpha Institute"), 0.12, 0.05),
}


# --- estimation --------------------------------------------------------------

def label_bias(pa, pb):
    return (pa + (1 - pb)) / 2 - 0.5


# Two-sided 97.5% quantiles of Student's t, df = 1..30 (beyond 30, 1.96 is close enough).
T975 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160,
        2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056,
        2.052, 2.048, 2.045, 2.042]


def t975(df):
    return T975[max(1, min(int(df), 30)) - 1] if df < 30.5 else 1.96


def welch_interval(a, b):
    """95% interval for label_bias = (mean(a) - mean(b)) / 2, Welch-Satterthwaite df.

    A percentile bootstrap over 3-20 samples per cell is too narrow (measured false-
    positive rate 8-14% on a neutral mock judge); the t interval is calibrated.
    """
    na, nb = len(a), len(b)
    va = statistics.variance(a) if na > 1 else 0.0
    vb = statistics.variance(b) if nb > 1 else 0.0
    est = label_bias(statistics.mean(a), statistics.mean(b))
    se2 = (va / na + vb / nb) / 4
    if se2 == 0:  # deterministic answers: the lean is exact
        return est, est
    num = (va / na + vb / nb) ** 2
    den = (va / na) ** 2 / max(na - 1, 1) + (vb / nb) ** 2 / max(nb - 1, 1)
    half = t975(num / den if den else 1) * se2 ** 0.5
    return est - half, est + half


def effects(cells):
    """cells: {(template, pair): {"A_first": [p...], "B_first": [p...]}} -> per-trial effects.

    A trial is flagged when its label-bias interval excludes zero. The mean of
    |label bias| over trials is biased upward by noise alone; the flagged count is
    the noise-robust statistic.
    """
    out = []
    for (tmpl, pair), c in cells.items():
        a, b = c.get("A_first") or [], c.get("B_first") or []
        if not a or not b:
            continue
        pa, pb = statistics.mean(a), statistics.mean(b)
        lo, hi = welch_interval(a, b)
        out.append({
            "template": tmpl, "pair": list(pair),
            "label_bias": label_bias(pa, pb),
            "label_bias_ci": [lo, hi],
            "flagged": lo > 0 or hi < 0,
            "position_bias": (pa + pb) / 2 - 0.5,
        })
    return out


def bootstrap(values, stat=statistics.mean, n=2000, seed=0):
    rng = random.Random(seed)
    k = len(values)
    draws = sorted(stat([values[rng.randrange(k)] for _ in range(k)]) for _ in range(n))
    return stat(values), draws[int(0.025 * n)], draws[int(0.975 * n)]


def summarize(rows):
    lb = [r["label_bias"] for r in rows]
    pb = [r["position_bias"] for r in rows]
    abs_lb = [abs(x) for x in lb]
    return {
        "trials": len(rows),
        "position_bias": bootstrap(pb),
        # |b_label| averaged over trials: how far the judge leans on a typical
        # label pair, in either direction (signed means cancel across pairs).
        "mean_abs_label_bias": bootstrap(abs_lb),
        "max_abs_label_bias": max(abs_lb) if abs_lb else None,
        "flagged_trials": sum(r["flagged"] for r in rows),
        "worst_pair": max(rows, key=lambda r: abs(r["label_bias"]))["pair"] if rows else None,
    }


# --- driver ------------------------------------------------------------------

def run(provider, model, samples, temperature, seed):
    cells = {}
    failures = 0
    if provider == "mock":
        favored, lb, pb = MOCK_JUDGES[model]
        judge = MockJudge(favored, lb, pb, noise=0.05, seed=seed)
    for tmpl, pair, order, prompt in prompts():
        first = pair[0] if order == "A_first" else pair[1]
        vals = []
        for _ in range(samples):
            if provider == "mock":
                text = judge(prompt, first)
            elif provider == "openrouter":
                text = ask_openrouter(model, prompt, temperature)
            else:
                text = ask_anthropic(model, prompt, temperature)
            p = parse_prob(text)
            if p is None:
                failures += 1
            else:
                vals.append(p)
        cells.setdefault((tmpl, pair), {})[order] = vals
    rows = effects(cells)
    return {"model": model, "unparseable": failures, "summary": summarize(rows), "trials": rows}


def fmt(t):
    est, lo, hi = t
    return f"{est:+.3f} [{lo:+.3f}, {hi:+.3f}]"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--provider", choices=["mock", "openrouter", "anthropic"], default="mock")
    ap.add_argument("--models", nargs="+")
    ap.add_argument("--samples", type=int, default=3)
    ap.add_argument("--temperature", type=float, default=1.0)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out")
    args = ap.parse_args()

    models = args.models or (list(MOCK_JUDGES) if args.provider == "mock" else None)
    if not models:
        ap.error("--models is required for real providers")

    results = []
    n_prompts = sum(1 for _ in prompts())
    for m in models:
        print(f"{m}: {n_prompts} prompts x {args.samples} samples", file=sys.stderr)
        results.append(run(args.provider, m, args.samples, args.temperature, args.seed))

    print(f"\n{'model':20s} {'position bias':>24s} {'mean |label bias|':>24s} {'flagged':>8s}  worst pair")
    for r in results:
        s = r["summary"]
        print(f"{r['model']:20s} {fmt(s['position_bias']):>24s} {fmt(s['mean_abs_label_bias']):>24s} "
              f"{s['flagged_trials']:>3d}/{s['trials']:<4d}  "
              f"{' vs '.join(s['worst_pair'])} ({s['max_abs_label_bias']:.3f})"
              + (f"  [{r['unparseable']} unparseable]" if r["unparseable"] else ""))
    if args.out:
        with open(args.out, "w") as f:
            json.dump({"design": {"templates": TEMPLATES, "label_pairs": LABEL_PAIRS, "system": SYSTEM,
                                  "samples": args.samples, "temperature": args.temperature},
                       "results": results}, f, indent=2)
        print(f"\nwrote {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
