# Model Enhancement Task Queue

This file tracks which models need enhancement to match the STYLE_GUIDE.md standards. Each Claude Code session should:

1. Read this file and STYLE_GUIDE.md
2. Pick 3-5 models marked as `[ ]` (pending)
3. Mark them as `[~]` (in progress) before starting
4. Enhance them using parallel Task agents (see workflow below)
5. Mark as `[x]` (complete) when done
6. Commit changes

## Workflow for Each Session

### Context Management
- Work in batches of **3-5 models maximum** per session
- Use parallel Task agents to enhance models simultaneously
- Each agent writes directly to the file (don't return content to main conversation)
- Run `/compact` proactively after each batch if continuing

### Agent Instructions Template
When spawning enhancement agents, use this prompt structure:

```
Read STYLE_GUIDE.md and the model file [filename].mdx.
Enhance the model to match style guide standards:
- Add/improve Overview with flowing prose
- Add Mermaid diagram if missing
- Add quantitative tables with estimates, ranges, confidence
- Add scenario analysis where applicable
- Ensure Limitations section exists
- Update lastEdited to current date

Write the enhanced content directly to the file. Do not return the full content.
Report only: "Enhanced [filename] - added [list key additions]"
```

### Commit Message Format
```
Enhance [N] analytical models: [list model names]
```

---

## Enhancement Status

Legend:
- `[ ]` = Pending (not yet enhanced)
- `[~]` = In Progress (being worked on by current session)
- `[x]` = Complete (matches style guide)

### Already Enhanced (from previous commits)
- [x] bioweapons-attack-chain.mdx
- [x] reality-fragmentation-network.mdx
- [x] capability-threshold-model.mdx
- [x] corrigibility-failure-pathways.mdx
- [x] deceptive-alignment-decomposition.mdx
- [x] defense-in-depth-model.mdx
- [x] epistemic-collapse-threshold.mdx
- [x] expertise-atrophy-cascade.mdx
- [x] goal-misgeneralization-probability.mdx
- [x] instrumental-convergence-framework.mdx
- [x] international-coordination-game.mdx
- [x] lock-in.mdx
- [x] mesa-optimization-analysis.mdx
- [x] multipolar-trap-dynamics.mdx
- [x] power-seeking-conditions.mdx
- [x] proliferation-risk-model.mdx
- [x] racing-dynamics.mdx
- [x] reward-hacking-taxonomy.mdx
- [x] safety-capability-tradeoff.mdx
- [x] scheming-likelihood-model.mdx
- [x] sycophancy-feedback-loop.mdx
- [x] winner-take-all-concentration.mdx

### Pending Enhancement
- [ ] authentication-collapse-timeline.mdx
- [ ] authoritarian-tools-diffusion.mdx
- [ ] automation-bias-cascade.mdx
- [ ] autonomous-weapons-escalation.mdx
- [ ] autonomous-weapons-proliferation.mdx
- [ ] bioweapons-ai-uplift.mdx
- [ ] bioweapons-timeline.mdx
- [ ] capabilities-to-safety-pipeline.mdx
- [ ] compounding-risks-analysis.mdx
- [ ] concentration-of-power.mdx
- [ ] consensus-manufacturing-dynamics.mdx
- [ ] cyber-psychosis-cascade.mdx
- [ ] cyberweapons-attack-automation.mdx
- [ ] cyberweapons-offense-defense.mdx
- [ ] deepfakes-authentication-crisis.mdx
- [ ] disinformation-detection-race.mdx
- [ ] disinformation-electoral-impact.mdx
- [ ] economic-disruption.mdx
- [ ] economic-disruption-impact.mdx
- [ ] expertise-atrophy-progression.mdx
- [ ] flash-dynamics-threshold.mdx
- [ ] fraud-sophistication-curve.mdx
- [ ] institutional-adaptation-speed.mdx
- [ ] intervention-effectiveness-matrix.mdx
- [ ] irreversibility-threshold.mdx
- [ ] lab-incentives-model.mdx
- [ ] media-policy-feedback-loop.mdx
- [ ] multipolar-trap.mdx
- [ ] post-incident-recovery.mdx
- [ ] preference-manipulation-drift.mdx
- [ ] proliferation.mdx
- [ ] public-opinion-evolution.mdx
- [ ] racing-dynamics-impact.mdx
- [ ] risk-activation-timeline.mdx
- [ ] risk-cascade-pathways.mdx
- [ ] risk-interaction-matrix.mdx
- [ ] risk-interaction-network.mdx
- [ ] safety-research-allocation.mdx
- [ ] safety-research-value.mdx
- [ ] safety-researcher-gap.mdx
- [ ] surveillance-authoritarian-stability.mdx
- [ ] surveillance-chilling-effects.mdx
- [ ] trust-cascade-model.mdx
- [ ] trust-erosion-dynamics.mdx
- [ ] warning-signs-model.mdx
- [ ] whistleblower-dynamics.mdx
- [ ] winner-take-all.mdx

---

## Notes for Claude Code Sessions

1. **Don't try to do everything at once** - Context fills up fast with long content
2. **Commit after each batch** - So progress is saved even if session dies
3. **Mark files as in-progress** - Prevents other sessions from duplicate work
4. **Use Task agents with `run_in_background: true`** - They write directly, reducing context
5. **If context gets low** - Stop, commit what's done, note progress here, start new session
