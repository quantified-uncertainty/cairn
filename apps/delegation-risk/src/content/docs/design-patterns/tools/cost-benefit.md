---
title: "Cost-Benefit Analysis"
sidebar:
  order: 4
---

# Cost-Benefit Analysis

:::note[TL;DR]
Decomposed architectures add **1.5-2x overhead** in latency and cost. Break-even point: worth it when expected incident cost exceeds ~$5,000/month. For customer-facing or autonomous systems, ROI is typically positive.
:::

This page provides concrete numbers for evaluating whether to adopt the framework.

---

## Engineering Costs

### Initial Implementation

| Task | Monolithic Agent | Decomposed System | Delta |
|------|-----------------|-------------------|-------|
| Architecture design | 1-2 days | 3-5 days | +2-3 days |
| Component implementation | 3-5 days | 5-10 days | +2-5 days |
| Verification layers | 0 days | 2-4 days | +2-4 days |
| Integration testing | 2-3 days | 4-6 days | +2-3 days |
| **Total** | **6-10 days** | **14-25 days** | **+8-15 days** |

**Rough cost at $150/hr**: Decomposition adds $10,000-18,000 in initial engineering.

### Ongoing Maintenance

| Task | Monolithic | Decomposed | Delta |
|------|-----------|------------|-------|
| Monitoring review | 2 hr/week | 4 hr/week | +2 hr/week |
| Component updates | 2 hr/week | 3 hr/week | +1 hr/week |
| Incident investigation | Varies | Easier (isolated) | -20% time |
| **Monthly overhead** | ~16 hr | ~28 hr | **+12 hr** |

**Rough cost**: Decomposition adds ~$1,800/month in maintenance.

---

## Runtime Costs

### Latency Overhead

Based on [preliminary experiments](/design-patterns/tools/empirical-tests/):

| Metric | Monolithic | Decomposed | Overhead |
|--------|-----------|------------|----------|
| Median latency | 2.3s | 4.1s | 1.8x |
| P99 latency | 8.2s | 12.1s | 1.5x |

**Why it's not worse**:
- Narrow components use smaller, faster models
- Parallel execution where possible
- Verification is mostly fast code

**When latency matters**:
- Real-time chat: 1.8x may be noticeable
- Batch processing: Negligible impact
- Async workflows: No user-facing impact

### API/Compute Costs

| Component | Model | Cost per 1K calls |
|-----------|-------|-------------------|
| **Monolithic** | GPT-4 | $120 |
| **Decomposed** | | |
| - Coordinator | GPT-3.5 | $2 |
| - Summarizer | Fine-tuned 7B | $5 |
| - Analyzer | Fine-tuned 7B | $5 |
| - Verifier | Code + small LLM | $3 |
| **Decomposed Total** | | $15 |

Wait—decomposed is *cheaper*? Yes, when you use appropriate models per component:

| Scenario | Monolithic | Decomposed | Savings |
|----------|-----------|------------|---------|
| Simple tasks (80%) | GPT-4: $120 | Narrow models: $15 | 87% |
| Complex tasks (20%) | GPT-4: $120 | GPT-4 + narrow: $45 | 62% |
| **Weighted average** | $120 | $21 | **82%** |

:::tip[Key Insight]
Decomposition often *reduces* API costs because you only use expensive frontier models where needed. Most components can use fine-tuned 7B models at 1/10th the cost.
:::

### Total Runtime Cost Comparison

For 100,000 tasks/month:

| Cost Type | Monolithic | Decomposed |
|-----------|-----------|------------|
| API costs | $12,000 | $2,100 |
| Compute (verification) | $0 | $500 |
| Monitoring infrastructure | $200 | $400 |
| **Total** | **$12,200** | **$3,000** |

In this scenario, decomposition saves $9,200/month in runtime costs.

---

## Risk Reduction Benefits

### Incident Cost Estimation

| Incident Type | Probability (Mono) | Probability (Decomp) | Damage | Delegation Risk Mono | Delegation Risk Decomp |
|--------------|-------------------|---------------------|--------|----------|------------|
| Data leak | 0.5%/mo | 0.1%/mo | $50,000 | $250 | $50 |
| Harmful output (public) | 2%/mo | 0.3%/mo | $20,000 | $400 | $60 |
| Service disruption | 1%/mo | 0.5%/mo | $10,000 | $100 | $50 |
| Compliance violation | 0.3%/mo | 0.05%/mo | $100,000 | $300 | $50 |
| **Total Delegation Risk** | | | | **$1,050/mo** | **$210/mo** |

**Risk reduction**: $840/month in expected incident cost avoided.

### Incident Response Savings

When incidents do occur, decomposition helps:

| Metric | Monolithic | Decomposed |
|--------|-----------|------------|
| Time to identify root cause | 4-8 hours | 1-2 hours |
| Time to fix | 2-4 hours | 0.5-1 hour |
| Blast radius | Entire system | Single component |
| Rollback complexity | Full redeploy | Component swap |

**Estimated savings per incident**: 4-6 hours of engineering time (~$600-900).

---

## Break-Even Analysis

### When Does Decomposition Pay Off?

**Fixed costs** (one-time):
- Additional engineering: $10,000-18,000

**Monthly costs**:
- Additional maintenance: +$1,800
- Additional monitoring: +$200
- API cost savings: -$9,200 (if high volume)
- Risk reduction: -$840

**Net monthly impact** (high-volume scenario): **-$8,040** (savings)

**Break-even**: Initial investment recovered in 1.5-2 months.

### Break-Even by Use Case

| Use Case | Monthly Volume | API Savings | Risk Reduction | Break-Even |
|----------|---------------|-------------|----------------|------------|
| Internal tool | 1,000 tasks | -$90 | -$100 | 5-8 months |
| Customer-facing | 50,000 tasks | -$4,600 | -$500 | 2-3 months |
| High-volume SaaS | 500,000 tasks | -$46,000 | -$800 | < 1 month |
| Autonomous agent | 10,000 tasks | -$900 | -$2,000 | 3-4 months |

:::note[Key Finding]
For any system with either (a) >10,000 tasks/month or (b) significant incident cost potential, decomposition has positive ROI within 6 months.
:::

---

## Decision Framework

### Quick Assessment

Answer these questions:

1. **What's your monthly task volume?**
   - < 1,000: Light decomposition (2-3 components)
   - 1,000-50,000: Standard decomposition
   - > 50,000: Full decomposition + optimization

2. **What's worst-case incident cost?**
   - < $5,000: May not be worth full framework
   - $5,000-50,000: Standard application
   - > $50,000: Full framework + extensive verification

3. **Is latency critical?**
   - Real-time (<1s): Careful component design, parallel execution
   - Interactive (<5s): Standard decomposition acceptable
   - Async/batch: Latency overhead irrelevant

4. **What's your engineering capacity?**
   - Limited: Start with 2-3 component decomposition
   - Moderate: 5-7 components with verification
   - High: Full framework implementation

### ROI Calculator

```
Monthly Savings = API_Savings + Risk_Reduction - Maintenance_Overhead

Where:
  API_Savings = Volume × (Mono_Cost - Decomp_Cost)
  Risk_Reduction = DR_Mono - DR_Decomp
  Maintenance_Overhead = ~$2,000/month

Break_Even_Months = Initial_Investment / Monthly_Savings
```

**Example**:
- Volume: 50,000 tasks/month
- API savings: 50,000 × ($0.12 - $0.02) = $5,000
- Risk reduction: $1,050 - $210 = $840
- Maintenance: -$2,000
- **Monthly savings**: $3,840
- Initial investment: $15,000
- **Break-even**: 3.9 months

---

## When NOT to Use This Framework

Be honest about when decomposition isn't worth it:

| Situation | Recommendation |
|-----------|----------------|
| Prototype/MVP | Skip—validate idea first, add safety later |
| < 100 tasks/month | Skip—overhead exceeds benefit |
| Pure internal tool, no sensitive data | Light application only |
| Latency-critical (< 500ms) | Careful design or skip |
| No engineering capacity for maintenance | Skip until capacity exists |

:::caution
Don't over-engineer safety for systems that don't need it. The framework is valuable for production systems with real risk, not for every AI application.
:::

---

## Summary

| Metric | Value |
|--------|-------|
| Initial engineering overhead | +$10,000-18,000 |
| Monthly maintenance overhead | +$2,000 |
| Latency overhead | 1.5-2x |
| API cost savings | 50-80% (when using narrow models) |
| Risk reduction | 70-80% (attack success rate) |
| Typical break-even | 2-6 months |
| Best for | Customer-facing, autonomous, >10K tasks/mo |

---

## See Also

- [Empirical Tests](/design-patterns/tools/empirical-tests/) — Experiment data behind these numbers
- [Quick Start](/design-patterns/tools/quick-start/) — Begin implementation
- [Decision Guide](/design-patterns/tools/decision-guide/) — Choose the right level of decomposition
