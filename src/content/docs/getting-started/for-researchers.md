---
title: For Researchers
description: Reading path for technical researchers considering AI safety work
sidebar:
  order: 2
importance: 82.5
quality: 5
llmSummary: Comprehensive guide for technical researchers entering AI safety,
  providing structured reading paths through core technical approaches including
  interpretability, scalable oversight, AI control, agent foundations, and
  evaluation methods. Effectively bridges the gap between general ML research
  and AI safety by highlighting distinctive challenges like adversarial
  difficulty and empirical constraints.
---If you're a technical researcher considering work in AI safety, this guide will help you quickly understand the landscape, evaluate the field's tractability, and identify how your skills might contribute.

## Quick Context Setting (15 minutes)

Before diving into technical details, get oriented:

### What Makes AI Safety Distinctive?

AI safety differs from typical ML research in several ways:

**Adversarial difficulty**: You're trying to solve problems that may actively resist being solved (deceptive alignment, mesa-optimization).

**Uncertainty about fundamentals**: We don't know if current approaches will work for superintelligent systems, or even what "work" means precisely.

**Empirical constraints**: You can't test your solution on the actual dangerous systems (which don't exist yet), only on proxies.

**Stakes**: Getting it wrong once might be enough. There may be no iterative refinement.

**Research culture**: Higher tolerance for theoretical/philosophical work than typical ML. More engagement with conceptual problems.

### The Core Technical Challenge

In standard ML: Design systems that perform well on a distribution similar to training.

In AI safety: Design systems that robustly pursue intended goals even when:
- They're more capable than their designers
- They operate in novel environments
- They could benefit from deception
- We can't directly verify their reasoning
- The stakes are catastrophic

This is fundamentally harder and may require different approaches than current ML paradigms.

### Essential Reading

Before going further, read these two foundational pieces:

1. **[Alignment Difficulty](/understanding-ai-risk/core-argument/alignment-difficulty/)** (20 min) - Why alignment is technically hard
2. **[Research Agendas Comparison](/knowledge-base/responses/technical/research-agendas/)** (30 min) - Overview of different technical approaches

This will give you enough context to evaluate whether the technical challenges are interesting to you.

## Deep Technical Dive (2-3 hours)

If you're still interested, here's the technical deep dive:

### Understanding the Threat Model

Read these to understand what you'd be trying to prevent:

**Core Failure Modes:**
1. [Goal Misgeneralization](/knowledge-base/risks/accident/goal-misgeneralization/) - Objectives that don't transfer to deployment
2. [Deceptive Alignment](/knowledge-base/risks/accident/deceptive-alignment/) - Models that appear aligned during training
3. [Mesa-Optimization](/knowledge-base/risks/accident/mesa-optimization/) - Learned optimizers with different objectives
4. [Power-Seeking](/knowledge-base/risks/accident/power-seeking/) - Instrumental convergence toward resource accumulation

**Why These Matter:**
- These aren't just theoretical concerns—precursors appear in current systems
- They might get worse with scale, not better
- Standard ML techniques (RLHF, adversarial training) may be insufficient
- Some failures might not be detectable before deployment

**Key Paper**: "Goal Misgeneralization in Deep Reinforcement Learning" shows these failures in simple settings.

### Current Technical Approaches

The field has several main research directions:

#### 1. Interpretability / Mechanistic Analysis

**Goal**: Understand what neural networks are actually computing internally.

**Approaches:**
- **Circuit analysis**: Reverse-engineer computational graphs in transformers
- **Sparse autoencoders**: Decompose activations into interpretable features
- **Activation patching**: Identify causal pathways for specific behaviors
- **Feature visualization**: Understand what neurons detect

**Key organizations**: Anthropic, DeepMind, Redwood Research

**Recent breakthrough**: Anthropic's [Scaling Monosemanticity](https://transformer-circuits.pub/2024/scaling-monosemanticity/) extracted millions of interpretable features from Claude.

**Open questions:**
- Can interpretability scale to superintelligent systems?
- Will we find systematic deception in circuits?
- Can we prove safety properties from interpretability?

**How to contribute:**
- Strong DL engineering skills required
- Background in neuroscience or reverse-engineering helpful
- Creative hypothesis generation valuable

**Read**: [Interpretability approach overview](/knowledge-base/responses/technical/interpretability/)

#### 2. Scalable Oversight

**Goal**: Supervise AI systems on tasks too complex for humans to evaluate directly.

**Approaches:**
- **Debate**: AI systems debate answers, humans judge
- **Recursive reward modeling**: Use AI to help evaluate AI
- **Process-based feedback**: Reward reasoning process, not just outcomes
- **Sandwiching**: Use AI to help non-experts evaluate expert work
- **Constitutional AI**: Self-supervised critique based on principles

**Key organizations**: Anthropic, OpenAI (formerly), ARC

**Key insight**: With superintelligent AI, we can't directly verify solutions to hard problems. How do we maintain oversight?

**Open questions:**
- Can humans judge debates between superhuman systems?
- How do we bootstrap AI assistance for oversight?
- What's the alignment tax of oversight techniques?

**How to contribute:**
- RL and fine-tuning expertise useful
- Human-computer interaction background valuable
- Game theory or mechanism design relevant

**Read**: [Scalable Oversight overview](/knowledge-base/responses/technical/scalable-oversight/)

#### 3. AI Control

**Goal**: Maintain safety even without solving full alignment, using protocols and monitoring.

**Approaches:**
- **Trusted monitoring**: Use weaker but trusted AI to monitor stronger AI
- **Protocol design**: Structure tasks to limit opportunities for catastrophic failures
- **Evaluations**: Red-team for dangerous capabilities and failure modes
- **Sandboxing**: Control information flow and action space

**Key organizations**: Redwood Research, ARC (Alignment Research Center)

**Key insight**: Maybe we can't fully align superintelligent AI, but we can structure deployment to catch problems before catastrophe.

**Open questions:**
- How capable can untrusted models be before control becomes impossible?
- What's the overhead cost of control protocols?
- Can controls survive recursive self-improvement?

**How to contribute:**
- Security background very relevant
- Systems engineering skills valuable
- Red-teaming experience useful

**Read**: [AI Control approach](/knowledge-base/responses/technical/ai-control/)

#### 4. Agent Foundations / Theory

**Goal**: Develop mathematical foundations for reasoning about goal-directed systems.

**Approaches:**
- Embedded agency (agents that are part of their environment)
- Logical uncertainty and updateless decision theory
- Naturalized induction (learning without Cartesian boundary)
- Corrigibility formalization
- Value learning theory

**Key organizations**: MIRI, FHI (defunct), some academic groups

**Key insight**: Current ML paradigm may be fundamentally insufficient. We might need new mathematical foundations.

**Open questions:**
- Are current deep learning paradigms sufficient for alignment?
- Can we formalize "doing what we want" mathematically?
- How do you specify goals for embedded agents?

**How to contribute:**
- Strong math background required (logic, probability theory, decision theory)
- Comfort with abstraction and philosophy
- Ability to identify conceptual confusions

**Read**: [Agent Foundations overview](/knowledge-base/responses/technical/agent-foundations/)

#### 5. Evaluation & Measurement

**Goal**: Detect dangerous capabilities and failure modes before deployment.

**Approaches:**
- **Capability evals**: Detecting dangerous skills (hacking, manipulation, deception)
- **Alignment evals**: Testing for goal-directedness, power-seeking, deception
- **Adversarial evaluation**: Red-teaming for failures
- **Automated evaluation**: Using AI to scale evaluation

**Key organizations**: ARC Evals, METR, labs' safety teams

**Key insight**: You can't improve what you can't measure. But measuring alignment is fundamentally hard.

**Open questions:**
- Can we detect deceptive alignment before deployment?
- What's the false negative rate on dangerous capability evals?
- How do you eval for capabilities we can't even describe?

**How to contribute:**
- Strong empirical ML skills
- Security/red-teaming background
- Creative adversarial thinking

**Read**: [Evals approach](/knowledge-base/responses/technical/evals/)

### Comparing Research Bets

Different approaches make different bets about what will matter:

| Approach | Key Bet | If You Believe... |
|----------|---------|-------------------|
| **Interpretability** | Understanding internals will enable verification | Current architectures are somewhat interpretable; scaling is tractable |
| **Scalable Oversight** | We can bootstrap AI assistance for evaluation | Human judgment on AI-assisted debates works; RLHF-like approaches generalize |
| **AI Control** | Safety without full alignment is possible | Monitoring and protocols can work even for superintelligent systems |
| **Agent Foundations** | Current paradigm is fundamentally insufficient | Deep learning won't naturally lead to aligned AI; need new foundations |
| **Evaluations** | Detection and measurement enables safety | Good evals can catch problems before deployment; organizations will use them |

Your research direction should depend on:
1. Which bet you find most plausible
2. Which problems seem most tractable to you
3. Where your comparative advantage lies
4. Which failure modes concern you most

## Critical Evaluation Questions

Before committing to AI safety research, honestly evaluate:

### Is This Technically Interesting?

**Reasons to find it interesting:**
- Novel challenges (adversarial optimization, embedding problems, philosophical edge cases)
- Intersection of ML, security, game theory, philosophy
- Opportunity to define new subfields
- Working on unprecedented problems

**Reasons you might not:**
- Less immediate empirical feedback than typical ML
- Higher tolerance for uncertainty and abstraction required
- Some work is conceptual/philosophical rather than mathematical
- May feel less rigorous than traditional CS theory

**Test**: Read recent papers from Anthropic, DeepMind, or ARC. Do the problems excite you intellectually?

### Is This Tractable?

**Evidence for tractability:**
- Concrete progress on interpretability (monosemanticity results)
- Measurable improvement in oversight techniques (Constitutional AI, debate experiments)
- Growing empirical evidence of failure modes (goal misgeneralization in practice)
- Increasing organizational and financial support

**Evidence against tractability:**
- No consensus on whether current approaches will work
- Fundamental challenges may be unsolved (embedded agency, value specification)
- Can't test on actual superintelligent systems
- Some proposed solutions may be impossible (provable alignment)

**Key question**: Do you believe the problem is solvable with current scientific paradigms, or does it require conceptual breakthroughs?

### What's Your Comparative Advantage?

Different backgrounds map to different contributions:

**Strong deep learning engineering:**
- Interpretability research (circuits, sparse autoencoders)
- Empirical evaluation work
- Scaling oversight techniques
- Implementing safety protocols

**Security/adversarial background:**
- AI control and monitoring
- Red-teaming and evals
- Adversarial robustness for alignment
- Finding failure modes

**Strong theory/math:**
- Agent foundations
- Formal verification approaches
- Decision theory for AI
- Conceptual clarification work

**ML + philosophy:**
- Value learning and specification
- Conceptual alignment problems
- Critiquing research directions
- Theory of change evaluation

**Systems/engineering:**
- Deployment safety protocols
- Infrastructure for safe development
- Coordination tools
- Compute governance technical work

**Domain expertise (bio, cyber, etc.):**
- Misuse prevention in your domain
- Dual-use research evaluation
- Domain-specific threat modeling

### Career Considerations

**Upsides of AI safety research:**
- Potentially extremely high impact
- Growing field with increasing funding
- Intellectually challenging
- Community of smart, motivated people
- Increasing mainstream legitimacy

**Downsides to consider:**
- Uncertain tractability (might not make progress)
- Uncertain importance (might be overblown)
- Smaller community than mainstream ML
- May be harder to pivot back to capabilities research
- Some organizations have controversial theories of change

**Financial considerations:**
- Academic positions: Standard academic salaries
- Non-profit research: Often $100K-200K+ for senior researchers
- Industry safety teams: Competitive with ML engineering ($150K-500K+)
- Varies significantly by organization and seniority

**Read more**: [Organizations overview](/knowledge-base/organizations/) to see who's hiring and what they pay.

## How to Get Started

If you want to explore AI safety research:

### 1. Quick Projects (1-4 weeks)

Try one of these to test fit:

**Interpretability:**
- Replicate a circuit analysis result on a small model
- Apply sparse autoencoders to a domain of interest
- Investigate whether a specific capability has interpretable circuits

**Evals:**
- Design evaluations for a dangerous capability
- Red-team a model for deceptive behavior
- Create benchmarks for alignment properties

**Oversight:**
- Experiment with AI-assisted evaluation on a task you know well
- Test whether debate helps humans judge complex questions
- Implement and evaluate process-based feedback

**Theory:**
- Formalize a conceptual confusion in alignment
- Model a toy scenario of deceptive alignment
- Analyze decision-theoretic problems for embedded agents

### 2. Engage with the Community

**Online:**
- LessWrong AI Alignment Forum (technical discussion)
- EleutherAI Discord (interpretability channel)
- Alignment Newsletter (weekly summaries)
- Twitter (follow key researchers)

**In-person:**
- AI safety conferences (NeurIPS workshops, etc.)
- AI Safety Camp (bootcamp for new researchers)
- EA Global (broader effective altruism community)
- Local AI safety groups

**Be aware**: The community has varying perspectives. Engage critically, not deferentially.

### 3. Formal Programs

**Research upskilling:**
- **SERI MATS** (mentored research program, 8 weeks)
- **AI Safety Camp** (team research projects)
- **Redwood Research REMIX** (interpretability bootcamp)
- **Arena** (online course, technical alignment)

**Graduate programs:**
- Few formal PhD programs yet
- Some advisors at Berkeley, MIT, Oxford, Cambridge
- Often structured as ML PhD with safety focus

**Industry positions:**
- Anthropic, OpenAI, DeepMind, etc. (frontier labs)
- ARC, Redwood, MIRI, etc. (safety orgs)
- Usually require demonstrated research ability

### 4. Reading List

**Essential papers:**

*Interpretability:*
- "Toy Models of Superposition" (Anthropic)
- "Scaling Monosemanticity" (Anthropic)
- "In-Context Learning and Induction Heads" (Anthropic)

*Oversight:*
- "AI Safety via Debate" (OpenAI)
- "Constitutional AI" (Anthropic)
- "Process Supervision" (OpenAI)

*Risks:*
- "Goal Misgeneralization in Deep RL" (DeepMind)
- "Sleeper Agents" (Anthropic)
- "Risks from Learned Optimization" (MIRI/OpenAI)

*Foundations:*
- "Embedded Agency" (MIRI)
- "Concrete Problems in AI Safety" (OpenAI/Berkeley)
- "Specification Gaming Examples" (DeepMind)

**Books:**
- "The Alignment Problem" by Brian Christian (accessible overview)
- "Superintelligence" by Nick Bostrom (philosophical foundations)
- "Human Compatible" by Stuart Russell (academic perspective)

### 5. Evaluate Organizational Fit

Different organizations have different cultures and theories of change:

**Frontier labs (Anthropic, OpenAI, DeepMind):**
- Pros: Access to frontier models, resources, top talent
- Cons: Accelerating capabilities, commercial pressures, racing dynamics
- Fit for: Empirical researchers who believe frontier access is necessary

**Safety-focused orgs (ARC, Redwood, MIRI):**
- Pros: Focused entirely on safety, aligned incentives
- Cons: Smaller, less compute, sometimes more speculative
- Fit for: Researchers who want pure safety focus

**Academic groups:**
- Pros: Intellectual freedom, long-term thinking, training students
- Cons: Less compute, slower pace, harder to get faculty positions
- Fit for: Those who value academic freedom and mentorship

**Evaluations orgs (METR, ARC Evals):**
- Pros: Direct near-term impact, less controversial theory of change
- Cons: May be less intellectually novel, dependent on lab cooperation
- Fit for: Applied researchers with security background

**Read**: Individual [organization pages](/knowledge-base/organizations/) for detailed comparisons.

## Common Concerns for Researchers

### "Won't working at labs accelerate capabilities?"

This is a real tension. Arguments on both sides:

**Against joining labs:**
- Safety researchers provide cover for capabilities work
- Commercial incentives may compromise safety
- "Safety" teams may primarily serve to defuse criticism
- Racing dynamics may make cautious development impossible

**For joining labs:**
- Safety research may require frontier model access
- Safety-focused people should influence internal decisions
- Better to have safety advocates inside than outside
- Can make marginal safety improvements in practice

**Consider**: Your personal theory of change and risk model should drive this decision.

### "Is this even scientifically tractable?"

Reasonable uncertainty. The field is young and success is not guaranteed.

**Signs of tractability:**
- Concrete empirical results (monosemanticity, goal misgeneralization evidence)
- Clear metrics improving over time (interpretability, oversight accuracy)
- Growing consensus on some technical approaches

**Signs of concern:**
- No consensus on core approaches
- Fundamental problems (embedded agency) may be unsolved
- Can't test on the actual dangerous systems

**Consider**: Even 10-30% chance of success on a problem this important might justify work.

### "The timelines seem uncertain"

They are. Estimates range from 5 years to never.

**How to think about this:**
- If short timelines (5-10 years): urgent empirical work most valuable
- If medium timelines (15-30 years): broader research portfolio makes sense
- If long timelines (40+ years): fundamental research, field-building valuable

**Consider**: Portfolio approach may be wise. Work on things useful across timelines.

### "I could have more impact in [other area]"

Maybe! AI safety isn't the right choice for everyone.

**AI safety might be higher impact if:**
- You believe transformative AI is coming within 30 years
- You believe current approaches are insufficient
- You have relevant technical skills
- You're not substantially more productive elsewhere

**Other areas might be higher impact if:**
- You're skeptical of short AI timelines
- You have domain expertise elsewhere with clear impact paths
- You're much more productive in other technical areas
- You think other x-risks are more pressing

**Read**: [Interventions overview](/knowledge-base/responses/) to compare different contribution paths.

## Research Culture and Norms

The AI safety research community has distinct characteristics:

**More philosophical than typical ML:**
- Higher tolerance for conceptual/definitional work
- Engagement with thought experiments and edge cases
- Discussion of unfalsifiable scenarios

**More public communication:**
- Many researchers blog and tweet extensively
- LessWrong culture of public writeups
- More tolerance for speculative posting

**More uncertainty acknowledgment:**
- Common to express probability distributions
- Frequent "I don't know" responses
- Explicit crux identification encouraged

**More mission-driven:**
- People often very committed to the cause
- Can lead to groupthink or motivated reasoning
- Also leads to high dedication and collaboration

**Watch out for:**
- Deferring too much to "community views"
- Mistaking speculation for established results
- Underweighting outside perspectives
- Motivated reasoning around theories of change

## Your Decision Framework

To decide whether to pursue AI safety research:

### 1. Evaluate the Object-Level Argument
- Do you believe transformative AI is plausible within 30 years?
- Do you believe alignment is technically hard enough to require dedicated work?
- Do you believe the risk is substantial (say, >5%)?

If no to these, AI safety work may not make sense for you.

### 2. Evaluate Tractability
- Do current technical approaches seem promising?
- Do you have skills that map to open problems?
- Can you make progress on a 1-5 year timescale?

If no, consider whether you're better suited to other contribution paths.

### 3. Evaluate Personal Fit
- Are the technical problems interesting to you?
- Do you thrive in high-uncertainty environments?
- Can you work productively in this research culture?

If no, even if the problem is important, you may have higher impact elsewhere.

### 4. Consider Comparative Advantage
- Would you be top 10% of AI safety researchers?
- Or top 1% in another area?
- Where is your impact multiplier highest?

### 5. Explore Systematically
- Spend 1-3 months trying projects
- Engage with the community
- See if you're making progress
- Evaluate whether you're energized or drained

**Then decide**. This is a major career choice. Take it seriously but don't agonize forever.

## Next Steps

Depending on your level of interest:

**If you're just exploring:**
1. Read [Research Agendas comparison](/knowledge-base/responses/technical/research-agendas/)
2. Pick one approach and read 3-5 key papers
3. Try a small project in that area
4. Evaluate your interest and fit

**If you're seriously considering:**
1. Apply to SERI MATS or AI Safety Camp
2. Reach out to researchers whose work interests you
3. Start writing about your thinking on alignment questions
4. Look for RA positions or internships

**If you're ready to commit:**
1. Apply to organizations doing work you find promising
2. Consider grad school if you want academic freedom
3. Build a research agenda and start executing
4. Engage publicly with your research direction

**If you remain uncertain:**
That's fine. The field needs clear thinking more than warm bodies. If you're not convinced, that's valuable information too.

## Final Thoughts

AI safety research is not for everyone. It requires:
- High tolerance for uncertainty
- Ability to work on problems that may not be solvable
- Willingness to stake career on potentially overblown risk
- Comfort with philosophical and conceptual work alongside technical

But if you have relevant skills, believe the problem is real and tractable, and find the work energizing, it could be one of the highest-impact things you could do.

The field needs:
- Strong technical researchers advancing empirical work
- Thoughtful critics identifying flawed approaches
- Interdisciplinary thinkers connecting different fields
- Independent thinkers, not just consensus followers

Make your own assessment. Engage critically. And if you decide to contribute, we're glad to have you.

**Ready to explore?** Start with the [Research Agendas comparison](/knowledge-base/responses/technical/research-agendas/) and go from there.
