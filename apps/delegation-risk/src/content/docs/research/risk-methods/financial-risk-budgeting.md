---
title: "Risk Budgeting and Tail Measures"
description: "How banks allocate a firm-wide risk limit: coherent risk measures, Euler and Shapley allocation, risk-appetite cascades, the failures of LTCM, 2008 and risk parity, and which parts apply to delegation risk."
---

Banks and asset managers set a firm-wide risk limit and push it down to business lines, desks and positions. That is the closest financial precedent for a delegation-risk budget. This page covers the mathematics (coherent risk measures, Euler and Shapley allocation), the practice, and the failures, and says which parts apply.

One point comes first. Delegation risk as this site defines it, $\sum P(\text{harm}) \times D$, is an expected loss. Expectation is linear, so a system's delegation risk is the sum of its components' expected losses whatever their correlation, and each component's share is simply its own expected loss. Allocating an expected-loss budget needs none of the machinery below. That machinery matters for **tail measures** (standard deviation, Value-at-Risk, Expected Shortfall), which is where correlation enters. Anyone who holds capital against delegation losses, an insurer in particular, works with tail measures, which is why correlated AI losses are what insurers exclude ([The Insurer's Dilemma](/delegation-risk/insurers-dilemma/#correlated-losses-and-the-limits-of-insurability)). Correlation also matters for AND-structured defenses, covered in [Risk Propagation](/delegation-risk/risk-propagation/).

## Coherent risk measures

This page uses one sign convention throughout: $L$ is a loss, positive when money is lost. Artzner, Delbaen, Eber and Heath (1999) call a risk measure $\rho$ **coherent** if it satisfies:

| Axiom | Statement (loss convention) | Meaning |
|---|---|---|
| Monotonicity | $L_1 \le L_2$ a.s. $\Rightarrow \rho(L_1) \le \rho(L_2)$ | Larger losses, more risk |
| Translation invariance | $\rho(L + c) = \rho(L) + c$ | A certain extra loss adds one-for-one |
| Positive homogeneity | $\rho(\lambda L) = \lambda \rho(L)$ for $\lambda \ge 0$ | Doubling a position doubles its risk |
| Subadditivity | $\rho(L_1 + L_2) \le \rho(L_1) + \rho(L_2)$ | Merging does not create risk |

On a finite probability space every coherent measure can be written $\rho(L) = \sup_{Q \in \mathcal{Q}} E_Q[L]$: the worst expected loss over a set of probability models. Expected loss itself is coherent, with $\mathcal{Q}$ a single model.

**Value-at-Risk** is the $\alpha$-quantile of $L$. It is not subadditive in general. The standard example (McNeil, Frey and Embrechts 2005) uses 100 bonds, each priced at 100, paying 105 at year end and defaulting independently with probability 2%. Holding 100 units of one bond gives a 95% VaR of −500, a gain, because default is less likely than 5%. Holding one unit of each bond gives a 95% VaR of 25, since five or more defaults have probability above 5%. VaR calls the diversified portfolio riskier. The cause here is skewed, discrete losses, not heavy tails as such: at the usual confidence levels, VaR is subadditive when losses are jointly elliptical (multivariate normal or Student t).

**Expected Shortfall** averages the quantiles beyond $\alpha$:

$$\mathrm{ES}_\alpha(L) = \frac{1}{1-\alpha}\int_\alpha^1 \mathrm{VaR}_u(L)\,du$$

It is coherent (Acerbi and Tasche 2002). For continuous distributions it equals $E[L \mid L \ge \mathrm{VaR}_\alpha(L)]$. For distributions with an atom at the quantile, that conditional form can fail subadditivity, so the integral is the definition to use. Spectral risk measures generalize ES by weighting quantiles with any non-decreasing weight function. The Basel Committee's revised market-risk standard (2016, revised 2019) replaced 99% VaR with 97.5% ES for internal models; implementation has slipped in several jurisdictions.

## Euler allocation

If $\rho(x)$ is positively homogeneous and differentiable in the position sizes $x_i$, Euler's theorem gives

$$\rho(x) = \sum_i x_i \frac{\partial \rho}{\partial x_i}$$

so the contributions $RC_i = x_i \, \partial\rho/\partial x_i$ add up exactly to the total. For smooth measures they are also the only contributions compatible with ranking units by return on risk-adjusted capital (Tasche 2007, Proposition 2.1). For $L = \sum_i L_i$ the contributions are:

| Measure | Euler contribution of component $i$ |
|---|---|
| Expected loss | $E[L_i]$ |
| Standard deviation | $\mathrm{Cov}(L_i, L) / \sigma(L)$ |
| VaR (continuous case) | $E[L_i \mid L = \mathrm{VaR}_\alpha(L)]$ |
| ES (continuous case) | $E[L_i \mid L \ge \mathrm{VaR}_\alpha(L)]$ |

Under multivariate normality with zero means, the VaR contribution reduces to $x_i \beta_i \mathrm{VaR}_p$, known as component VaR. It is not CoVaR, which is Adrian and Brunnermeier's (2016) systemic-risk measure: the VaR of the financial system conditional on one institution being in distress.

An illustrative Monte Carlo example, with made-up distributions: two lognormal losses that share a common normal factor, $L_1 = e^{0.5Z + 0.8W_1}$ and $L_2 = e^{0.9Z + 0.3W_2}$, and an independent exponential loss $L_3$ with mean 1. Their expected losses are 1.56, 1.57 and 1.00, so $L_3$ carries 24% of the expected loss but only about 6% of the 99% ES. The two lognormal components are both heavier-tailed and positively correlated, and both features raise their share of the tail. A budget set on expected loss and one set on ES can allocate very differently.

### When Euler does not apply

Euler allocation needs the risk measure to scale with each component's activity. Three common features of AI delegation break that:

- **Thresholds.** A component that is harmless below some permission level and dangerous above it has no meaningful gradient near the threshold.
- **Fixed-size harms.** A single leaked credential does full damage at the first unit of exposure.
- **Interaction harms.** Collusion or capability that emerges from composition belongs to a coalition of components, not to any one of them.

For these, use the **Shapley value**, which averages each component's marginal contribution over all orders of joining:

$$\phi_i = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!\,(n-|S|-1)!}{n!}\,\bigl[v(S \cup \{i\}) - v(S)\bigr]$$

It is the unique allocation satisfying efficiency, symmetry, additivity and the null-player property. Exact computation needs all $2^n$ coalitions, so it is sampled in practice. For homogeneous differentiable measures its continuous analogue, the Aumann-Shapley value, coincides with Euler. Where a few catastrophic scenarios dominate, enumerating and gating those scenarios directly is cheaper and clearer than any allocation formula.

## Risk budgets in practice

The Financial Stability Board's *Principles for an Effective Risk Appetite Framework* (2013) describe the governance: a written risk appetite statement, risk limits that cascade from the board through business lines and legal entities, and defined roles for the board and senior management. They are principles, not a quantitative regulatory standard. In practice, firms distinguish hard limits, whose breach blocks business, from thresholds, whose breach triggers escalation. Desks carry several kinds of limit at once: VaR or ES, stress-scenario losses, concentration, and notional position size. The non-statistical limits are there because the statistical ones miss things. [Exposure Cascade](/delegation-risk/exposure-cascade/) applies the cascade to delegation; its budgets are expected-loss budgets.

**Risk parity** allocates so that each asset class contributes equally to portfolio variance. Asset $i$ with weight $w_i$ and return $r_i$ contributes $RC_i = w_i \,\mathrm{Cov}(r_i, r_p)$, and these sum to the portfolio variance $\sigma_p^2$; equal contribution means $RC_i = \sigma_p^2 / N$. Because bonds are less volatile than equities, the strategy levers up bonds, and it relies on a low or negative stock-bond correlation. It suffered in March 2020, when the selling reached the most liquid and traditionally safe assets and the usual correlations broke down. In a returns-based analysis of ten public risk-parity mutual funds, maximum drawdowns in the crisis ranged from 13.4% to 42.8%, averaging 22.2%, similar to a 60/40 benchmark ([Institutional Investor](https://institutionalinvestor.com/article/b1l8ycr93db02d/Risk-Parity-Is-Supposed-to-Be-All-Weather-That-s-Not-Happening), citing Markov Processes International).

Risk budgets do not trade the way emission permits do. Cap-and-trade works for CO₂ because it is a uniformly mixed stock pollutant: a tonne emitted anywhere has the same effect, so permits are fungible. Delegation risk is not fungible across contexts and is dominated by tails, so letting components trade budget can concentrate risk where harm is worst. This is the "hot spot" objection raised against trading pollutants that are not uniformly mixed, such as SO₂ and NOx.

## Failures

**LTCM (1998).** Long-Term Capital Management ran leverage of about 30 to 1 at the end of 1997. After Russia's default it lost 44% of its value in August 1998. Fourteen banks and brokers recapitalized it with \$3.625 billion in exchange for 90% ownership, in a rescue arranged by the New York Fed, which put none of its own funds at risk ([Federal Reserve History](https://www.federalreservehistory.org/essays/ltcm-near-failure)). Positions that had looked diversified moved together in the crisis, liquidity disappeared, and leverage turned model error into insolvency.

**2008.** VaR models calibrated on calm years said little about losses beyond the quantile and nothing about exposures the models did not include. ES addresses the first problem, not the second.

**Lessons that transfer.** Short histories understate tails. Correlations rise under stress, which is the financial form of entanglement; against an adaptive adversary, assume they go to one. Measure tails as well as expectations. And pair statistical budgets with hard limits that do not depend on the model, as banks pair VaR limits with notional and concentration limits, and as the site's [exposure envelope](/delegation-risk/runtime-accounting/) does for agents.

## References

- Acerbi, C., & Tasche, D. (2002). Expected Shortfall: a natural coherent alternative to Value at Risk. *Economic Notes* 31(2), 379–388.
- Adrian, T., & Brunnermeier, M. K. (2016). CoVaR. *American Economic Review* 106(7), 1705–1741.
- Artzner, P., Delbaen, F., Eber, J.-M., & Heath, D. (1999). Coherent measures of risk. *Mathematical Finance* 9(3), 203–228.
- Basel Committee on Banking Supervision (2019). *Minimum capital requirements for market risk*.
- Financial Stability Board (2013). *Principles for an Effective Risk Appetite Framework*.
- McNeil, A. J., Frey, R., & Embrechts, P. (2005). *Quantitative Risk Management*. Princeton University Press.
- Tasche, D. (2007). Capital allocation to business units and sub-portfolios: the Euler principle. [arXiv:0708.2542](https://arxiv.org/abs/0708.2542).
