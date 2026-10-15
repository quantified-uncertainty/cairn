"""Does who pays predict documented failure better than method does?

Reads systems.csv (one row per named system in the catalogue on
concepts/evaluation-systems-in-the-wild.md) and compares two codings as
predictors of a documented major failure:

  payer            evaluated_party / user / third_party / public / mixed
  method_coarse    testing_inspection / expert_judgment / crowd /
                   model_or_index / certification_regulatory / market

plus the binary "does the evaluated party pay the evaluator in any material
way" (evaluated_party_pays_any).

Outcomes:
  est      failure_status == established
  est_all  established or alleged
  capture  established failure of type capture or evaluator_misconduct

Methods: rates with Jeffreys intervals; Monte Carlo permutation tests of the
chi-square statistic (an r x c analogue of Fisher's exact test); Fisher's exact
test on the 2x2 tables; leave-one-out log loss of smoothed per-category rates
(a saturated logistic model with a Jeffreys prior) and of an additive ridge
logistic model; cluster bootstrap over catalogue entries (bullets) for the
difference in predictive skill.

Run: python3 analyze.py  (numpy + scipy only). Seeded; output is deterministic.
"""
import csv
import os
from collections import Counter, defaultdict

import numpy as np
from scipy import optimize, stats

HERE = os.path.dirname(os.path.abspath(__file__))
RNG = np.random.default_rng(20261015)
N_PERM = 20000
N_BOOT = 2000


def load(path=os.path.join(HERE, "systems.csv")):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def outcome(rows, kind):
    if kind == "est":
        return np.array([r["failure_status"] == "established" for r in rows], int)
    if kind == "est_all":
        return np.array([r["failure_status"] in ("established", "alleged") for r in rows], int)
    if kind == "capture":
        return np.array([r["failure_status"] == "established"
                         and r["failure_type"] in ("capture", "evaluator_misconduct") for r in rows], int)
    raise ValueError(kind)


def jeffreys(k, n):
    lo = stats.beta.ppf(0.05, k + 0.5, n - k + 0.5) if k > 0 else 0.0
    hi = stats.beta.ppf(0.95, k + 0.5, n - k + 0.5) if k < n else 1.0
    return lo, hi


def table(x, y, title):
    print(f"\n  {title}")
    print(f"    {'level':26s} {'n':>4s} {'fail':>5s} {'rate':>6s}   90% interval")
    for lev in sorted(set(x), key=lambda v: -np.mean(y[x == v])):
        m = x == lev
        k, n = int(y[m].sum()), int(m.sum())
        lo, hi = jeffreys(k, n)
        print(f"    {lev:26s} {n:4d} {k:5d} {k / n:6.2f}   [{lo:.2f}, {hi:.2f}]")


def chi2_stat(x, y):
    levels = np.unique(x)
    obs = np.array([[np.sum((x == l) & (y == v)) for v in (0, 1)] for l in levels], float)
    exp = obs.sum(1, keepdims=True) * obs.sum(0, keepdims=True) / obs.sum()
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.nansum((obs - exp) ** 2 / exp)


def perm_test(x, y, n=N_PERM):
    s0 = chi2_stat(x, y)
    hits = sum(chi2_stat(x, RNG.permutation(y)) >= s0 - 1e-12 for _ in range(n))
    k = len(np.unique(x))
    v = np.sqrt(s0 / (len(y) * 1)) if k > 1 else 0.0  # Cramer's V for a 2-column table
    return s0, (hits + 1) / (n + 1), v


def loo_logloss_rates(x, y, a=0.5):
    """LOO log loss (nats per system) of per-category Beta(a, a)-smoothed rates."""
    tot = 0.0
    for i in range(len(y)):
        m = (x == x[i])
        m[i] = False
        k, n = y[m].sum(), m.sum()
        p = (k + a) / (n + 2 * a)
        tot -= np.log(p if y[i] else 1 - p)
    return tot / len(y)


def onehot(cols):
    mats = []
    for c in cols:
        levels = sorted(set(c))[1:]
        mats.append(np.column_stack([(c == l).astype(float) for l in levels]) if levels else np.zeros((len(c), 0)))
    return np.column_stack([np.ones(len(cols[0]))] + mats)


def fit_ridge_logit(X, y, lam=1.0):
    def nll(b):
        z = X @ b
        return np.sum(np.logaddexp(0, z) - y * z) + 0.5 * lam * np.sum(b[1:] ** 2)

    def grad(b):
        p = 1 / (1 + np.exp(-(X @ b)))
        g = X.T @ (p - y)
        g[1:] += lam * b[1:]
        return g

    return optimize.minimize(nll, np.zeros(X.shape[1]), jac=grad, method="L-BFGS-B").x


def loo_logloss_logit(cols, y, lam=1.0):
    X = onehot(cols)
    tot = 0.0
    for i in range(len(y)):
        m = np.ones(len(y), bool)
        m[i] = False
        b = fit_ridge_logit(X[m], y[m], lam)
        p = 1 / (1 + np.exp(-(X[i] @ b)))
        tot -= np.log(p if y[i] else 1 - p)
    return tot / len(y)


def cluster_boot_diff(xa, xb, y, groups, n=N_BOOT):
    """Bootstrap (resampling catalogue entries) of LOO log-loss(method) - LOO log-loss(payer).
    Positive = payer predicts better."""
    ug = np.unique(groups)
    idx_by_g = {g: np.where(groups == g)[0] for g in ug}
    diffs = []
    for _ in range(n):
        pick = RNG.choice(ug, len(ug), replace=True)
        idx = np.concatenate([idx_by_g[g] for g in pick])
        yy = y[idx]
        if yy.sum() in (0, len(yy)):
            continue
        diffs.append(loo_logloss_rates(xb[idx], yy) - loo_logloss_rates(xa[idx], yy))
    d = np.array(diffs)
    return d.mean(), np.percentile(d, [5, 95]), np.mean(d > 0)


def analyse(rows, label, outcome_kind="est", full=True):
    rows = [r for r in rows if r["payer"] not in ("n/a", "unknown")]
    y = outcome(rows, outcome_kind)
    payer = np.array([r["payer"] for r in rows])
    meth = np.array([r["method_coarse"] for r in rows])
    groups = np.array([r["entry_group"] for r in rows])
    print(f"\n=== {label} | outcome={outcome_kind} | n={len(y)} systems, "
          f"{len(np.unique(groups))} catalogue entries, failures={y.sum()} ({y.mean():.2f}) ===")
    if full:
        table(payer, y, "By payer")
        table(meth, y, "By method (coarse)")
    sp, pp, vp = perm_test(payer, y)
    sm, pm, vm = perm_test(meth, y)
    print(f"\n  Permutation chi-square: payer chi2={sp:.2f} p={pp:.3f} V={vp:.2f} | "
          f"method chi2={sm:.2f} p={pm:.3f} V={vm:.2f}")

    ep = np.array([r["evaluated_party_pays_any"] for r in rows])
    m = np.isin(ep, ["yes", "no"])
    t = np.array([[np.sum((ep[m] == "yes") & (y[m] == 1)), np.sum((ep[m] == "yes") & (y[m] == 0))],
                  [np.sum((ep[m] == "no") & (y[m] == 1)), np.sum((ep[m] == "no") & (y[m] == 0))]])
    orr = stats.contingency.odds_ratio(t)
    ci = orr.confidence_interval(0.90)
    fp = stats.fisher_exact(t).pvalue
    print(f"  Evaluated party pays anything? yes: {t[0, 0]}/{t[0].sum()} failed, "
          f"no: {t[1, 0]}/{t[1].sum()} failed; OR={orr.statistic:.2f} "
          f"90% CI [{ci.low:.2f}, {ci.high:.2f}], Fisher p={fp:.3f}")

    # Does the 2x2 association survive conditioning on method?
    ys, es, ms = y[m], (ep[m] == "yes").astype(int), meth[m]
    num = den = 0.0
    for s in np.unique(ms):
        k = ms == s
        a, b = np.sum(es[k] & ys[k]), np.sum(es[k] & (1 - ys[k]))
        c, d = np.sum((1 - es[k]) & ys[k]), np.sum((1 - es[k]) & (1 - ys[k]))
        num += a * d / k.sum()
        den += b * c / k.sum()
    obs = np.sum(es & ys)
    strata = [np.where(ms == s)[0] for s in np.unique(ms)]
    hits = 0
    for _ in range(N_PERM):
        yp = ys.copy()
        for idx in strata:
            yp[idx] = RNG.permutation(ys[idx])
        hits += np.sum(es & yp) >= obs
    print(f"  ...within method strata: Mantel-Haenszel OR={num / den:.2f}, "
          f"stratified permutation p={(hits + 1) / (N_PERM + 1):.3f} (one-sided)")
    unk = ep == "unknown"
    for as_ in ("yes", "no"):
        e2 = np.where(unk, as_, ep)
        k2 = e2 != "n/a"
        t2 = [[np.sum((e2[k2] == "yes") & (y[k2] == 1)), np.sum((e2[k2] == "yes") & (y[k2] == 0))],
              [np.sum((e2[k2] == "no") & (y[k2] == 1)), np.sum((e2[k2] == "no") & (y[k2] == 0))]]
        print(f"  ...if the {unk.sum()} 'unknown' rows were all '{as_}': "
              f"OR={stats.contingency.odds_ratio(t2).statistic:.2f}, Fisher p={stats.fisher_exact(t2).pvalue:.3f}")

    base = loo_logloss_rates(np.zeros(len(y), int), y)
    lp, lm = loo_logloss_rates(payer, y), loo_logloss_rates(meth, y)
    le = loo_logloss_rates(es, ys)
    lme = loo_logloss_rates(ms, ys)
    lne = loo_logloss_rates(np.zeros(len(ys), int), ys)
    print(f"  LOO log loss (nats/system, lower is better): null={base:.4f} payer={lp:.4f} method={lm:.4f}")
    print(f"  ...on the {len(ys)} rows with known evaluated_party_pays_any: null={lne:.4f} "
          f"evaluated-pays={le:.4f} method={lme:.4f}")
    if full:
        lpl = loo_logloss_logit([payer], y)
        lml = loo_logloss_logit([meth], y)
        lbl = loo_logloss_logit([payer, meth], y)
        print(f"  Ridge logistic LOO: payer={lpl:.4f} method={lml:.4f} payer+method={lbl:.4f}")
        mean, (lo, hi), pr = cluster_boot_diff(payer, meth, y, groups)
        print(f"  Cluster bootstrap of [LOO(method) - LOO(payer)]: mean={mean:+.4f}, "
              f"90% interval [{lo:+.4f}, {hi:+.4f}], share>0 (payer better)={pr:.2f}")


def collapse_to_entries(rows):
    """One row per catalogue entry: failure if any member failed; payer/method by modal value."""
    by = defaultdict(list)
    for r in rows:
        by[r["entry_group"]].append(r)
    out = []
    rank = {"established": 2, "alleged": 1, "none_found": 0}
    for g, rs in by.items():
        best = max(rs, key=lambda r: rank[r["failure_status"]])
        mode = lambda k: Counter(r[k] for r in rs).most_common(1)[0][0]
        out.append(dict(rs[0], payer=mode("payer"), method_coarse=mode("method_coarse"),
                        evaluated_party_pays_any=mode("evaluated_party_pays_any"),
                        failure_status=best["failure_status"], failure_type=best["failure_type"]))
    return out


def main():
    rows = load()
    print(f"{len(rows)} systems coded; payer counts: {dict(Counter(r['payer'] for r in rows))}")
    print(f"failure_status counts: {dict(Counter(r['failure_status'] for r in rows))}")
    print(f"established failure types: "
          f"{dict(Counter(r['failure_type'] for r in rows if r['failure_status'] == 'established'))}")

    analyse(rows, "PRIMARY")
    analyse(rows, "SENSITIVITY: established + alleged", "est_all", full=False)
    analyse(rows, "SENSITIVITY: capture/misconduct only", "capture", full=False)
    hi = [r for r in rows if r["payer_confidence"] != "low" and r["failure_confidence"] != "low"]
    analyse(hi, "SENSITIVITY: drop low-confidence codings", full=False)
    analyse(collapse_to_entries(rows), "SENSITIVITY: one row per catalogue entry", full=False)


if __name__ == "__main__":
    main()
