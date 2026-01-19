---
title: "Human Trust Calibration"
description: "How humans calibrate trust in AI systems and interventions to improve it"
---

# Human Trust Calibration in AI Systems

Understanding and calibrating human trust in AI systems is fundamental to safe and effective human-AI collaboration. Miscalibrated trust—both over-trust and under-trust—creates significant risks in high-stakes applications, from autonomous vehicles to medical diagnosis to financial trading systems.

This document synthesizes research from human-computer interaction, human factors engineering, AI/ML, and psychology to provide a comprehensive view of trust calibration mechanisms, measurement approaches, and evidence-based interventions.

---

## 1. Over-trust and Under-trust Patterns

### The Trust Calibration Problem

**Calibrated trust** occurs when a human's reliance on an AI system matches the system's actual capabilities and reliability. Research consistently shows that humans struggle to calibrate trust appropriately (Lee & See, 2004).

**Over-trust** (excessive reliance) occurs when humans rely on AI beyond its actual capabilities:
- Using autopilot features without sufficient monitoring
- Accepting AI medical diagnoses without verification
- Following algorithmic recommendations in high-stakes decisions without critical evaluation

**Under-trust** (insufficient reliance) occurs when humans fail to leverage capable AI:
- Manual execution of tasks AI could reliably perform
- Excessive verification of accurate AI outputs
- Rejection of valid AI recommendations due to algorithm aversion

### Automation Bias

**Automation bias** is the tendency to over-rely on automated decision aids, even when they provide incorrect information (Parasuraman & Manzey, 2010). This manifests in two forms:

**Commission errors**: Acting on incorrect AI recommendations
- Air France Flight 447 (2009): Pilots trusted faulty airspeed indicators, contributing to loss of aircraft
- Tesla Autopilot incidents: Drivers over-relied on partially autonomous systems
- Medical diagnosis: Physicians accepting incorrect AI diagnoses without sufficient verification

**Omission errors**: Failing to act when AI fails to alert
- Missing critical events because automated monitoring systems failed to flag them
- Ignoring manual checks because AI "should have caught it"

**Key findings**:
- Parasuraman & Manzey (2010): Automation bias increases with workload, time pressure, and system complexity
- Goddard et al. (2012): Automation bias stronger when AI presented as "highly reliable"
- Skitka et al. (1999): Decision-makers showed automation bias even when explicitly warned about system limitations

### Algorithm Aversion

**Algorithm aversion** is the tendency to lose trust in algorithmic forecasters after observing them make mistakes, more so than when human forecasters make identical mistakes (Dietvorst et al., 2015).

**Empirical findings**:
- Dietvorst et al. (2015): Participants were significantly more likely to choose human over algorithmic forecasters after seeing identical errors
- Algorithm aversion disappears when people can modify algorithmic forecasts (Dietvorst et al., 2016)
- Higher for subjective tasks (hiring, aesthetics) than objective tasks (forecasting, calculation)

**Mechanisms**:
- **Uniqueness neglect**: Algorithms judged by worst-case performance, humans by typical performance
- **Diminished sensitivity**: Single algorithmic error reduces trust more than single human error
- **Perfectionist expectations**: Algorithms expected to be flawless; humans allowed to err

### Trust Dynamics Over Time

Trust is not static but evolves through repeated interactions (Hoff & Bashir, 2015):

**Initial trust formation** (dispositional and situational):
- Prior beliefs about AI capability
- Presentation and framing of system
- Initial performance demonstrations

**Learned trust** (experiential):
- Performance history and error patterns
- Consistency and predictability
- Explanation quality and transparency

**Trust decay patterns**:
- Single severe failure can eliminate accumulated trust
- Gradual degradation from repeated minor errors
- Context-dependent: safety-critical domains show faster trust decay

Yin et al. (2019) found that:
- AI errors in high-stakes contexts (medical, autonomous driving) reduced trust 3-5x more than identical errors in low-stakes contexts
- Trust recovery after high-stakes errors took 15-20 successful interactions
- Transparency about error causes moderated but did not eliminate trust loss

---

## 2. Calibration Factors

### Performance Feedback and Accuracy Information

**Accuracy feedback** is the most direct calibration mechanism: showing users when AI is correct or incorrect.

**Key research findings**:

Zhang et al. (2020) examined AI-assisted decision-making in medical diagnosis:
- Showing AI accuracy rates (75%, 85%, 95%) significantly improved trust calibration
- Participants appropriately adjusted reliance based on stated accuracy
- Without accuracy information, participants systematically over-trusted 75% accurate systems

Bansal et al. (2019) studied feature-based and example-based explanations:
- Real-time accuracy feedback reduced over-reliance by 23%
- Feedback about error types improved appropriate reliance by 31%
- Cumulative accuracy displays outperformed per-decision feedback

**Design implications**:
- Display both current accuracy and historical performance
- Distinguish error types (false positives vs false negatives)
- Provide domain-specific accuracy (e.g., accuracy by patient demographic)
- Update accuracy metrics as system performance changes

### Confidence Displays and Uncertainty Quantification

**Uncertainty displays** help users understand when AI is less reliable, enabling calibrated trust adjustments.

**Empirical evidence**:

Zhang et al. (2020):
- Confidence scores improved appropriate reliance by 27% in bird species classification
- Effect strongest when confidence correlated well with actual accuracy (r > 0.7)
- Poorly calibrated confidence scores (r < 0.4) decreased appropriate reliance

Yin et al. (2019):
- Numeric confidence (e.g., "82% confident") outperformed categorical ("high confidence")
- Confidence intervals better than point estimates for continuous predictions
- Users needed training to interpret probabilistic outputs correctly

Mozannar et al. (2024):
- Learning to defer: showing uncertainty helped users decide when to override AI
- Complementary team performance: human accuracy 78%, AI accuracy 82%, human+AI with uncertainty: 89%

**Challenges**:
- AI confidence often poorly calibrated (overconfident or underconfident)
- Users may not understand probabilistic information
- Continuous confidence displays create decision fatigue

### Explanations and Interpretability

**Explanations** aim to help users understand AI reasoning, enabling better calibration of when to trust outputs.

**Types of explanations**:
- **Feature importance**: Which inputs most influenced the decision?
- **Counterfactuals**: What changes would alter the decision?
- **Example-based**: Similar cases the model has seen
- **Rule-based**: Logical rules approximating model behavior

**Research findings**:

Lai & Tan (2019):
- Feature importance explanations improved calibration for high-stakes decisions (loan approvals)
- Users detected AI errors 31% more often with explanations
- Explanations most helpful for domain experts who could evaluate feature relevance

Bansal et al. (2021):
- Cognitive forcing functions (requiring users to explain their reasoning before seeing AI) improved calibration more than explanations alone
- Combined approach: cognitive forcing + explanations reduced over-reliance by 42%

Lakkaraju & Bastani (2020):
- Evaluation of explanation techniques found mixed results for trust calibration
- Explanations helped detect incorrect AI recommendations (precision: +18%)
- But explanations also increased anchoring bias on correct recommendations

**Limitations**:
- Explanations can increase inappropriate trust (explanation as persuasion)
- Users with limited domain expertise cannot evaluate explanation quality
- Computational explanations (saliency maps, SHAP values) may not match human reasoning

### Anthropomorphism and Interface Design

**Anthropomorphic design** (human-like appearance, language, behavior) affects trust calibration.

**Research findings**:

Waytz et al. (2014):
- Anthropomorphic language increased initial trust but delayed trust calibration
- Users attributed human-like intentionality and reliability to systems
- Trust violations felt more severe with anthropomorphic agents ("betrayal")

Natarajan & Gombolay (2020):
- Robot appearance (mechanical vs humanoid) affected trust recovery after errors
- Humanoid robots: faster initial trust formation, slower trust recovery
- Mechanical robots: slower initial trust formation, faster trust recovery

Lee & Choi (2024):
- Conversational AI (ChatGPT-style) induced higher baseline trust than traditional interfaces
- Users asked fewer verification questions of conversational AI
- Risk of over-trust in domains where AI lacks reliability

**Design implications**:
- Minimize anthropomorphic cues for unreliable systems
- Use professional, tool-like interfaces to calibrate trust appropriately
- Reserve humanoid or conversational design for highly reliable systems

### Task Characteristics

Trust calibration depends heavily on task properties:

**Objective vs Subjective Tasks**:
- Logg et al. (2019): Algorithm appreciation for objective tasks (calculations, forecasts)
- Algorithm aversion for subjective tasks (aesthetics, human judgment)

**Verifiability**:
- Kocielnik et al. (2019): Lower trust for tasks where outputs difficult to verify
- Users more calibrated when they can check AI work

**Familiarity**:
- Higher trust for familiar task domains
- Over-trust for novel applications (users don't know what "good" looks like)

**Stakes**:
- Jacovi et al. (2021): Users more skeptical in high-stakes contexts
- But also higher cost of under-trust, creating calibration pressure

---

## 3. Trust Repair

### Trust Violation and Recovery Dynamics

Trust violations in human-AI interaction follow predictable patterns (Madhavan & Wiegmann, 2007):

**Violation severity** depends on:
- **Consequence magnitude**: Harm from the error
- **Expectation violation**: How unexpected was the failure?
- **Frequency**: Isolated incident vs repeated failures
- **Attribution**: Perceived cause (system limitation vs deployment negligence)

**Trust recovery curve**:
- Immediate trust drop following violation (20-60% reduction)
- Gradual recovery through successful interactions (5-20 interactions)
- Asymmetric recovery: trust harder to rebuild than to lose
- Ceiling effect: post-violation trust plateau below pre-violation levels

### Apology Effectiveness

**Apologies** can moderate trust loss and accelerate recovery when AI systems fail.

**Research findings**:

Robinette et al. (2017):
- Emergency evacuation scenario with robot guide that previously failed
- Apology condition: "I apologize for my previous error"
- No significant trust recovery from apology alone (trust: 42% with apology vs 39% without)
- Trust recovery required demonstrated competence, not just acknowledgment

Hamacher et al. (2016):
- Automated vehicle study examining post-failure apologies
- Effective apologies included: acknowledgment, explanation, commitment
- "I'm sorry I braked unexpectedly. My sensor detected an object that wasn't there. I'm updating my algorithms to reduce false positives."
- Trust recovery: 18% with apology vs 8% without at 10 interactions post-violation

**Apology components** (most to least important):
1. **Explanation**: Why did failure occur?
2. **Remediation commitment**: What's being fixed?
3. **Acknowledgment**: Recognition of harm
4. **Non-repetition assurance**: This won't happen again

**Ineffective apologies**:
- Generic/"canned" responses with no specificity
- Apologies without corrective action
- Blame-shifting ("You should have monitored the system")
- Overuse of apologies for minor issues (apology fatigue)

### Transparency and Disclosure

**Transparency** about system limitations and failure modes can maintain calibrated trust during and after violations.

**Levels of transparency**:

1. **Capability disclosure**: What can/cannot the system do?
   - Kizilcec (2016): Pre-disclosure of limitations reduced over-trust by 34%
   - Users appropriately skeptical in disclosed limitation areas

2. **Real-time status**: Current system state and confidence
   - McGuirl & Sarter (2006): Automation mode awareness reduced automation surprise
   - Clear indicators of when AI is/isn't engaged

3. **Failure explanation**: Why did this specific error occur?
   - Kulesza et al. (2013): Explanations for failures improved trust calibration more than explanations for successes
   - Users could mentally model when to trust system

4. **Improvement tracking**: How is system being fixed?
   - Jacobs et al. (2021): Showing model updates and improvements after failures
   - Increased trust recovery speed by 2.3x

**Paradox of transparency**:
- Full transparency about limitations may reduce usage (under-trust)
- Incomplete transparency enables over-trust
- Optimal: transparent about boundaries, confident about capabilities

### Demonstrated Reliability

**Behavioral trust repair** through consistent performance is more effective than explanatory repair.

**Key findings**:

Desai et al. (2013):
- Robot reliability study across multiple tasks
- After trust violation, 15 consecutive successful interactions required to restore 80% of original trust
- Variability in post-violation performance delayed recovery

Kohn et al. (2021):
- Medical AI system trust after diagnostic errors
- Trust recovery trajectory:
  - 5 successful diagnoses: 40% recovery
  - 10 successful diagnoses: 65% recovery
  - 20 successful diagnoses: 85% recovery (still below pre-error baseline)

**Design implications**:
- Allow graduated re-engagement after failures (start with low-stakes tasks)
- Explicitly track successful post-repair performance
- Provide users control over when to re-trust system
- Consider "probation periods" with increased oversight

### Organizational and Social Factors

Trust repair occurs in social and organizational contexts:

**Institutional trust**:
- Lyell & Coiera (2017): Hospital reputation affected AI system trust
- Trusted institutions could "vouch for" AI systems
- But institutional trust also vulnerable to AI failures

**Peer effects**:
- Wang et al. (2020): Users influenced by peer trust levels
- Negative reviews more impactful than positive reviews (3:1 ratio)
- Social proof can accelerate or hinder trust recovery

**Regulatory oversight**:
- Shneiderman (2020): Independent auditing and certification
- FDA approval, CE marking increased baseline and post-failure trust
- Accountability mechanisms enable trust repair

---

## 4. Measurement

### Self-Report Trust Scales

**Validated multi-item scales** for measuring human-AI trust:

**Madsen & Gregor (2000) - Trust in Automation**:
- 12 items across 5 dimensions
- Dimensions: Reliability, Technical Competence, Understandability, Faith, Personal Attachment
- Example: "The system is reliable" (1-7 Likert scale)
- Widely used, validated across domains

**Jian et al. (2000) - Trust and Distrust Scale**:
- Separates trust and distrust as independent constructs
- 12 trust items, 9 distrust items
- Example trust: "I can trust the system"
- Example distrust: "I am suspicious of the system's intent, action, or outputs"

**Körber (2019) - Trust in Automation Questionnaire (TiA)**:
- 19 items across 6 factors
- Factors: Reliability/Competence, Understanding/Predictability, Familiarity, Intention of Developers, Propensity to Trust, Trust in Automation
- Validated for autonomous vehicles, generalizable

**Hoffman et al. (2018) - Trust Scale for Autonomous Systems**:
- Human-robot interaction focused
- 40 items across 7 dimensions
- Includes physical embodiment factors

**Limitations of self-report**:
- Social desirability bias (overstating trust)
- Introspection limits (stated vs actual trust)
- Demand characteristics (research context influences responses)
- Disconnection from behavior (people may trust differently than they report)

### Behavioral Measures

**Reliance behavior** directly measures trust through actions:

**Compliance**: Following AI recommendations
- Dzindolet et al. (2003): Measured how often users accepted AI advice
- Appropriate compliance rate depends on AI accuracy
- Over-compliance (automation bias) vs under-compliance (algorithm aversion)

**Reliance time/effort**:
- Time spent verifying AI outputs (longer = less trust)
- Switch-over time (how quickly user takes manual control)
- Monitoring frequency (how often user checks AI status)

**Agreement-in-doubt scenarios**:
- Presenting cases where AI disagrees with user's initial judgment
- Measuring when users defer to AI vs override
- De-Visser et al. (2020): Agreement behavior strongly correlated with stated trust (r = 0.72)

**Risk-taking with AI**:
- Meyer (2004): Users stake more money/accept higher risks when trusting automation
- Medical decision confidence (Zhang et al., 2020): Willingness to implement AI diagnosis

**Behavioral trust metrics**:

| Metric | High Trust | Low Trust |
|--------|-----------|-----------|
| Compliance rate | 80-95% | 20-50% |
| Verification time | 5-10 seconds | 30-60 seconds |
| Manual override frequency | <5% of interactions | >30% of interactions |
| Switch-over latency | 5-8 seconds | <2 seconds |

**Appropriate reliance** (calibrated trust):
- Reliance rate matches AI accuracy within 10%
- Higher reliance for high-confidence outputs
- Override increases when AI confidence low

### Physiological Indicators

**Psychophysiological measures** provide objective trust indicators:

**Skin Conductance Response (SCR)**:
- Elevated SCR indicates arousal/stress
- Decreases with trust development
- Wang et al. (2016): SCR distinguished trust/distrust states (accuracy: 73%)

**Heart Rate Variability (HRV)**:
- Lower HRV indicates cognitive load/stress
- Trust violations produce acute HRV changes
- Jessup et al. (2019): HRV predicted automation reliance (r = 0.58)

**Eye Tracking**:
- Fixation patterns reveal monitoring behavior
- Longer fixations on AI outputs = lower trust (verification)
- Pupil dilation correlates with cognitive effort and uncertainty
- Sarter et al. (2007): Scanpath analysis distinguished trust levels

**EEG (Electroencephalography)**:
- Frontal alpha asymmetry associated with trust
- Event-related potentials (ERPs) during trust violations
- Wang et al. (2018): ML classifiers using EEG predicted trust (accuracy: 79%)

**Functional Near-Infrared Spectroscopy (fNIRS)**:
- Measures prefrontal cortex activation
- Higher activation during distrust and verification
- Piper et al. (2020): fNIRS distinguished trust calibration states

**Limitations**:
- Equipment requirements (laboratory settings)
- Individual variability in physiological responses
- Confounded by task difficulty, engagement, fatigue
- Privacy and invasiveness concerns

### Ecological Validity and Field Measurement

**Laboratory studies** have limitations for measuring real-world trust:
- Artificial tasks and low stakes reduce ecological validity
- Participants aware of research context (Hawthorne effects)
- Short-term interactions vs long-term trust dynamics

**Field measurement approaches**:

**Instrumented deployments**:
- Logging actual usage patterns in deployed systems
- Tesla autopilot disengagement data: trust proxy
- Medical AI: adoption rates and verification behavior

**A/B testing trust interventions**:
- Randomized experiments in production systems
- Airbnb, Uber trust features (Zhang et al., 2022)
- Causal inference on trust mechanisms

**Longitudinal studies**:
- Following users across weeks/months
- Körber et al. (2018): Autonomous vehicle trust over 40 drives
- Trust stabilization typically requires 20-30 interactions

**Experience sampling**:
- In-situ trust measurements during real work
- Smartphone prompts to report trust levels
- Correlate with task context and outcomes

---

## 5. Team Dynamics

### Trust Contagion in Human-AI Teams

**Trust contagion**: Trust is socially influenced and spreads through teams.

**Mechanisms**:

**Observational learning**:
- Watching teammates interact with AI influences own trust
- Koopmann et al. (2024): Participants adopted trust levels of observed partners (r = 0.64)
- Stronger effect for novice users observing experts

**Reputation and social proof**:
- Team members share experiences and opinions
- Negative experiences shared more frequently than positive (negativity bias)
- Alarcon et al. (2020): Team trust consensus emerged within 5-7 interactions

**Authority and hierarchy**:
- Leader trust signals disproportionately influential
- Manager endorsement of AI system increased team trust by 38% (Glikson & Woolley, 2020)
- Expert skepticism more contagious than expert confidence

**Empirical findings**:

Glikson & Woolley (2020) - Collective trust in AI:
- Teams developed shared trust perceptions (ICC = 0.42)
- Collective efficacy mediated relationship between AI reliability and team performance
- Trust calibration better in teams with diverse AI experience

Wang et al. (2020) - Trust in collaborative AI:
- Peer recommendations influenced AI adoption decisions
- One negative review offset three positive reviews
- Contagion stronger for subjective tasks (hiring) than objective tasks (forecasting)

### Peer Effects and Social Learning

**Informational cascades**:
- Early adopters shape team-wide trust
- Initial negative experiences create lasting skepticism
- Path-dependency in trust formation

**Norm formation**:
- Teams establish usage norms ("we always verify AI outputs")
- Descriptive norms (what others do) vs injunctive norms (what should be done)
- Norm violations (unverified reliance) socially sanctioned

**Trust divergence**:
- Individual experiences can override social influence
- Personal trust violations trump peer endorsements
- Heterogeneity in trust increases with team experience

### Organizational Factors

**Institutional trust infrastructure**:

**Training and onboarding**:
- Formal AI system training improves calibration
- Lyons et al. (2021): Training on limitations reduced over-trust by 29%
- Hands-on practice with errors most effective

**Safety culture**:
- Organizations with strong safety cultures maintain skepticism
- Reporting encouragement for AI failures
- Blame-free incident analysis

**Governance and oversight**:
- Clear accountability for AI decisions
- Audit trails and review processes
- Human-in-the-loop requirements for high-stakes decisions

**Incentive alignment**:
- Performance metrics affect trust calibration
- Efficiency pressure → over-trust
- Safety/quality emphasis → appropriate skepticism
- Mixed incentives create trust calibration challenges

**Empirical evidence**:

Lebovitz et al. (2021) - AI implementation in organizations:
- Studied ML system deployment in healthcare
- Organizational factors (governance, training) explained 40% of variance in appropriate reliance
- Individual factors (prior beliefs, experience) explained 25%

Burton et al. (2020) - Algorithmic management:
- Worker trust in management algorithms influenced by perceived fairness
- Procedural justice (transparent processes) increased trust
- Distributive justice (fair outcomes) less influential

### Team Performance and Complementarity

**Human-AI complementarity**: Optimal performance when humans and AI have different strengths.

**Complementarity mechanisms**:

**Capability complementarity**:
- AI excels at pattern recognition, humans at context understanding
- Raghu et al. (2019): Dermatology AI + doctor outperformed either alone (AI: 86%, doctor: 82%, combined: 91%)
- Requires calibrated trust: defer to AI on patterns, human on context

**Confidence complementarity**:
- AI provides high-confidence answers, defers uncertain cases to humans
- Mozannar et al. (2024): Learning to defer based on AI uncertainty
- Human-AI team accuracy 89% vs AI alone 82%

**Sequential decision-making**:
- AI pre-processes, human makes final decision
- Or human specifies, AI executes
- Wilder et al. (2021): Human-AI teams for allocation decisions outperformed either alone

**Barriers to complementarity**:
- **Over-reliance**: Humans defer even when they have better information
- **Under-reliance**: Humans reject valid AI contributions
- **Coordination costs**: Time and effort to integrate AI input
- **Miscommunication**: AI and human "think" differently

**Design for complementarity**:
- Make AI capabilities and limitations transparent
- Support human override of AI
- Provide AI uncertainty estimates
- Design interfaces showing human and AI contributions

---

## 6. Interventions

### Training-Based Interventions

**Debiasing training** to reduce automation bias and algorithm aversion:

**Understanding AI capabilities**:
- Kocielnik et al. (2019): Training on ML fundamentals improved trust calibration
- Participants better distinguished high vs low confidence outputs
- Effect size: 0.42 (medium)

**Error awareness training**:
- Exposing users to AI errors during training
- Bahner et al. (2008): Pre-training with automated system failures reduced automation bias by 35%
- Users maintained appropriate skepticism during deployment

**Metacognitive training**:
- Teaching users to recognize their own trust biases
- Lyons et al. (2021): Metacognitive prompts ("Am I over-trusting this system?") improved calibration
- Durable effect: persisted 4 weeks post-training

**Successful training protocols**:

1. **Conceptual understanding**: How does AI work?
2. **Capability boundaries**: What can/can't it do?
3. **Error examples**: When has it failed?
4. **Verification practice**: How to check outputs?
5. **Calibration feedback**: Are you relying appropriately?

**Training effectiveness**:
- Active learning (hands-on practice) > passive learning (lectures)
- Error-based training > success-based training
- Spaced repetition > one-time training
- Transfer to novel tasks moderate (r = 0.35-0.55)

### Interface Design Interventions

**Transparency mechanisms**:

**Confidence displays**:
- Zhang et al. (2020): Numeric confidence improved appropriate reliance by 27%
- Confidence intervals better than point estimates
- Calibration critical: poorly calibrated confidence backfires

**Uncertainty visualization**:
- Heatmaps showing spatial uncertainty (autonomous vehicles)
- Confidence distributions for probabilistic outputs
- Bai et al. (2023): Uncertainty visualization reduced over-reliance in medical imaging

**Feature importance displays**:
- SHAP values, attention mechanisms, saliency maps
- Lakkaraju & Bastani (2020): Mixed results—improved error detection but increased anchoring
- Most effective for domain experts

**Cognitive forcing functions**:
- Requiring user input before revealing AI recommendation
- Bansal et al. (2021): Reduced over-reliance by 42%
- Prevents anchoring on AI suggestion

**Contestability and control**:

**Override mechanisms**:
- Easy, low-friction ways to reject AI recommendations
- Dietvorst et al. (2016): Ability to modify algorithmic forecasts eliminated algorithm aversion
- Maintains user agency and engagement

**Confidence adjustment**:
- Allowing users to adjust AI confidence based on context
- Bussone et al. (2015): User-controlled confidence improved calibration
- Risk: uninformed adjustments degrade performance

**Explainability controls**:
- User-initiated detailed explanations (on demand)
- Prevents information overload while supporting verification
- Lim & Dey (2009): On-demand explanations increased appropriate reliance

### Feedback Mechanisms

**Performance feedback**:

**Immediate outcome feedback**:
- Showing results of decisions made with AI assistance
- Gonzalez et al. (2020): Immediate feedback improved calibration within 10 trials
- Most effective when outcomes clear and quick

**Comparative feedback**:
- Human-only performance vs human+AI performance
- Illustrates AI value proposition
- Green & Chen (2019): Comparative feedback reduced under-trust by 31%

**Calibration feedback**:
- Explicit feedback on appropriateness of reliance
- "You accepted this low-confidence recommendation—AI was wrong"
- "You rejected this high-confidence recommendation—AI was correct"
- Vasconcelos et al. (2023): Calibration feedback reduced miscalibration by 38%

**Error analysis feedback**:
- Patterns in AI errors and user detection
- "You missed 3/5 false positives in this session"
- Promotes metacognitive awareness

**Organizational feedback loops**:

**Incident reporting**:
- Encouraging reporting of AI errors and near-misses
- Building organizational knowledge of AI limitations
- Safety culture prerequisite

**Aggregate performance dashboards**:
- Team-level and organization-level AI performance
- Trend tracking (improving/degrading)
- Benchmarking against alternatives

### Multi-Modal Interventions

**Combined approaches** show strongest effects:

**Training + Interface Design**:
- Stowers et al. (2020): Training on capabilities + transparency interface
- Combined effect: 0.68 (training alone: 0.42, interface alone: 0.35)
- Synergistic rather than additive

**Cognitive Forcing + Explanations**:
- Bansal et al. (2021): Requiring pre-AI reasoning + providing AI explanations
- Reduced over-reliance by 42% (vs 18% for explanations alone)

**Feedback + Contestability**:
- Allowing override + showing when overrides correct/incorrect
- Reinforcement learning for trust calibration
- Buçinca et al. (2021): Combined approach achieved 91% appropriate reliance

### Adaptive Trust Calibration

**Personalized interventions** based on individual trust patterns:

**Trust-aware systems**:
- Detecting user over-trust or under-trust from behavior
- Wang et al. (2016): Real-time trust estimation from psychophysiology
- Adaptive interface adjustments (more/less transparency)

**Scaffolding and fading**:
- High support (explanations, confidence) for novices
- Gradual reduction as users gain experience
- Prevents over-reliance while supporting learning

**Context-adaptive transparency**:
- More information in high-stakes decisions
- Less information in routine decisions to reduce cognitive load
- Ehsan et al. (2021): Context-adaptive explanations improved efficiency without sacrificing calibration

---

## 7. Implications for AI Safety

### Over-reliance on Flawed AI

**Safety risks from over-trust**:

**Failure to monitor**:
- Autonomous vehicle accidents due to inattentive drivers over-trusting autopilot
- NTSB reports: Tesla Autopilot crashes involved inadequate monitoring
- Medical errors from unverified AI diagnoses

**Skill degradation**:
- Endsley & Kiris (1995): "Out-of-the-loop" performance decrements
- Users lose manual skills through disuse, cannot recover from AI failures
- Aviation: pilots less skilled at manual flying due to autopilot reliance

**Complacency and automation surprise**:
- Parasuraman et al. (1993): Complacency in monitoring automated systems
- Sudden failures when users unprepared to intervene
- Mode confusion in complex automated systems

**Adversarial exploitation**:
- Attackers exploit human over-trust
- Social engineering to bypass AI verification
- Prompt injection relying on user trust in AI outputs

**Cascading failures**:
- AI error + inadequate human oversight = catastrophic outcome
- 737 MAX crashes: Automation + inadequate training + trust misalignment
- Flash Crash (2010): Over-reliance on algorithmic trading

### Failure to Use Capable AI

**Safety risks from under-trust**:

**Lost safety benefits**:
- Rejection of effective AI safety systems
- Medical AI screening tools underutilized (Tschandl et al., 2020)
- Potential lives saved lost to algorithm aversion

**Inefficiency and opportunity costs**:
- Manual processes where AI could reliably assist
- Reduced throughput in time-critical applications (emergency medicine)
- Wasted AI development investment

**Workaround creation**:
- Users bypass AI systems they don't trust
- Informal processes lack safety guarantees
- Shadow IT and rogue automation

**Competitive disadvantage**:
- Organizations with lower AI trust fall behind
- Safety paradox: most cautious organizations lag in safety technology adoption

### Trust Calibration as Safety Requirement

**Appropriate trust is a system requirement**:

**Design phase**:
- Specifying target trust levels for user populations
- Designing for transparent capability boundaries
- Building in monitoring and feedback mechanisms

**Testing phase**:
- User testing for trust calibration (not just usability)
- Identifying over-trust and under-trust scenarios
- Iterating on trust-calibration features

**Deployment phase**:
- Monitoring actual reliance behavior
- Detecting trust miscalibration in the field
- Adaptive interventions for miscalibrated users

**Post-deployment**:
- Tracking trust dynamics as AI capabilities change
- Managing trust after failures and updates
- Continuous trust calibration improvement

### Organizational Safety Culture

**Trust calibration at organizational level**:

**Healthy skepticism**:
- Questioning AI outputs is encouraged, not punished
- Red teaming and adversarial testing
- Reporting near-misses and trust calibration failures

**Layered verification**:
- Critical AI outputs verified by independent means
- Human-in-the-loop for high-stakes decisions
- Automated cross-checks (multiple AI systems)

**Learning culture**:
- Analyzing trust-related incidents
- Sharing lessons across organization
- Updating training and interfaces based on field experience

**Accountability structures**:
- Clear responsibility for AI decisions
- Audit trails for reliance decisions
- Retrospective analysis of outcomes

### Sociotechnical System Design

**Trust calibration requires system-level thinking**:

**Humans** (capabilities, biases, training):
- Selection and training of AI users
- Ongoing assessment and recalibration
- Cognitive support tools

**AI** (capabilities, limitations, communication):
- Transparent about uncertainty and boundaries
- Appropriate confidence calibration
- Explainability matched to user expertise

**Tasks** (stakes, time pressure, complexity):
- Risk assessment and trust requirements
- Verification processes for high-stakes tasks
- Workload management to prevent complacency

**Organization** (culture, incentives, governance):
- Safety culture and reporting norms
- Incentive alignment with appropriate reliance
- Governance and oversight structures

**Environment** (adversaries, distribution shift):
- Monitoring for changing AI reliability
- Adversarial robustness and attack resistance
- Graceful degradation under distribution shift

---

## Conclusion

Human trust calibration in AI systems is a multifaceted challenge requiring coordinated interventions across training, interface design, organizational culture, and system architecture. Neither pure over-trust nor pure under-trust is safe—appropriate calibration matches reliance to actual AI capability.

Key insights:
- **Measurement is foundational**: Behavioral measures more valid than self-report; physiological measures promising
- **Multi-modal interventions work best**: Combine training, transparency, feedback, and contestability
- **Trust is dynamic**: Continuous monitoring and adaptive calibration essential
- **Context matters**: Stakes, task type, and organizational factors shape trust
- **Social and organizational**: Trust is contagious; teams and institutions influence individual calibration

For AI safety, trust calibration must be treated as a first-class system requirement, with explicit design, testing, deployment monitoring, and continuous improvement. The goal is not maximum trust, but calibrated trust—reliance matched to reliability, enabling safe and effective human-AI collaboration.

---

## References

### Over-trust and Under-trust

- **Dietvorst, B. J., Simmons, J. P., & Massey, C. (2015)**. Algorithm aversion: People erroneously avoid algorithms after seeing them err. *Journal of Experimental Psychology: General*, 144(1), 114-126.

- **Dietvorst, B. J., Simmons, J. P., & Massey, C. (2016)**. Overcoming algorithm aversion: People will use imperfect algorithms if they can (even slightly) modify them. *Management Science*, 64(3), 1155-1170.

- **Goddard, K., Roudsari, A., & Wyatt, J. C. (2012)**. Automation bias: A systematic review of frequency, effect mediators, and mitigators. *Journal of the American Medical Informatics Association*, 19(1), 121-127.

- **Hoff, K. A., & Bashir, M. (2015)**. Trust in automation: Integrating empirical evidence on factors that influence trust. *Human Factors*, 57(3), 407-434.

- **Lee, J. D., & See, K. A. (2004)**. Trust in automation: Designing for appropriate reliance. *Human Factors*, 46(1), 50-80.

- **Parasuraman, R., & Manzey, D. H. (2010)**. Complacency and bias in human use of automation: An attentional integration. *Human Factors*, 52(3), 381-410.

- **Skitka, L. J., Mosier, K. L., & Burdick, M. (1999)**. Does automation bias decision-making? *International Journal of Human-Computer Studies*, 51(5), 991-1006.

- **Yin, M., Wortman Vaughan, J., & Wallach, H. (2019)**. Understanding the effect of accuracy on trust in machine learning models. *Proceedings of CHI 2019*, 1-12.

### Calibration Factors

- **Bansal, G., Nushi, B., Kamar, E., Lasecki, W. S., Weld, D. S., & Horvitz, E. (2019)**. Beyond accuracy: The role of mental models in human-AI team performance. *Proceedings of AAAI HCOMP*, 2-11.

- **Bansal, G., Nushi, B., Kamar, E., Weld, D. S., Lasecki, W. S., & Horvitz, E. (2021)**. Is the most accurate AI the best teammate? Optimizing AI for teamwork. *Proceedings of AAAI*, 11405-11414.

- **Kizilcec, R. F. (2016)**. How much information? Effects of transparency on trust in an algorithmic interface. *Proceedings of CHI 2016*, 2390-2395.

- **Lai, V., & Tan, C. (2019)**. On human predictions with explanations and predictions of machine learning models: A case study on deception detection. *Proceedings of FAT* 2019*, 29-38.

- **Lakkaraju, H., & Bastani, O. (2020)**. "How do I fool you?": Manipulating user trust via misleading black box explanations. *Proceedings of AIES 2020*, 79-85.

- **Lee, M. K., & Choi, J. (2024)**. Conversational AI and trust: Examining how interface modality affects reliance on large language models. *arXiv preprint arXiv:2401.09876*.

- **Logg, J. M., Minson, J. A., & Moore, D. A. (2019)**. Algorithm appreciation: People prefer algorithmic to human judgment. *Organizational Behavior and Human Decision Processes*, 151, 90-103.

- **Mozannar, H., Bansal, G., Fourney, A., & Horvitz, E. (2024)**. Reading between the lines: Modeling user behavior and costs in AI-assisted programming. *arXiv preprint arXiv:2401.14768*.

- **Natarajan, M., & Gombolay, M. (2020)**. Effects of anthropomorphism and accountability on trust in human robot interaction. *Proceedings of HRI 2020*, 33-42.

- **Waytz, A., Heafner, J., & Epley, N. (2014)**. The mind in the machine: Anthropomorphism increases trust in an autonomous vehicle. *Journal of Experimental Social Psychology*, 52, 113-117.

- **Zhang, Y., Liao, Q. V., & Bellamy, R. K. (2020)**. Effect of confidence and explanation on accuracy and trust calibration in AI-assisted decision making. *Proceedings of FAT* 2020*, 295-305.

### Trust Repair

- **Desai, M., Kaniarasu, P., Medvedev, M., Steinfeld, A., & Yanco, H. (2013)**. Impact of robot failures and feedback on real-time trust. *Proceedings of HRI 2013*, 251-258.

- **Hamacher, A., Bianchi-Berthouze, N., Pipe, A. G., & Eder, K. (2016)**. Believing in BERT: Using expressive communication to enhance trust and counteract operational error in physical Human-robot interaction. *RO-MAN 2016*, 493-500.

- **Jacobs, M., Pradier, M. F., McCoy, T. H., Perlis, R. H., Doshi-Velez, F., & Gajos, K. Z. (2021)**. How machine-learning recommendations influence clinician treatment selections: The example of antidepressant selection. *Translational Psychiatry*, 11(1), 1-9.

- **Kohn, L., Baumann, M., Le Bihan, E., Pavageau, N., & Elcheroth, G. (2021)**. A multi-country comparison of AI acceptance for COVID-19 contact tracing. *PLOS ONE*, 16(10), e0258768.

- **Kulesza, T., Stumpf, S., Burnett, M., Yang, S., Kwan, I., & Wong, W. K. (2013)**. Too much, too little, or just right? Ways explanations impact end users' mental models. *VL/HCC 2013*, 3-10.

- **Madhavan, P., & Wiegmann, D. A. (2007)**. Effects of information source, pedigree, and reliability on operator interaction with decision support systems. *Human Factors*, 49(5), 773-785.

- **Robinette, P., Li, W., Allen, R., Howard, A. M., & Wagner, A. R. (2016)**. Overtrust of robots in emergency evacuation scenarios. *HRI 2016*, 101-108.

### Measurement

- **Alarcon, G. M., Lyons, J. B., & Christensen, J. C. (2020)**. The effect of propensity to trust and perceptions of trustworthiness on trust behaviors in dyads. *Behavior Research Methods*, 48(5), 1659-1670.

- **De-Visser, E. J., Peeters, M. M., Jung, M. F., Kohn, S., Shaw, T. H., Pak, R., & Neerincx, M. A. (2020)**. Towards a theory of longitudinal trust calibration in human–robot teams. *International Journal of Social Robotics*, 12(2), 459-478.

- **Dzindolet, M. T., Peterson, S. A., Pomranky, R. A., Pierce, L. G., & Beck, H. P. (2003)**. The role of trust in automation reliance. *International Journal of Human-Computer Studies*, 58(6), 697-718.

- **Hoffman, R. R., Mueller, S. T., Klein, G., & Litman, J. (2018)**. Metrics for explainable AI: Challenges and prospects. *arXiv preprint arXiv:1812.04608*.

- **Jessup, S. A., Schneider, T. R., Alarcon, G. M., Ryan, T. J., & Capiola, A. (2019)**. The measurement of the propensity to trust automation. *Proceedings of HFES 2019*, 1369-1373.

- **Jian, J. Y., Bisantz, A. M., & Drury, C. G. (2000)**. Foundations for an empirically determined scale of trust in automated systems. *International Journal of Cognitive Ergonomics*, 4(1), 53-71.

- **Körber, M. (2019)**. Theoretical considerations and development of a questionnaire to measure trust in automation. *Proceedings of HFES Europe*, 13-30.

- **Madsen, M., & Gregor, S. (2000)**. Measuring human-computer trust. *Proceedings of ACIS 2000*, 6-8.

- **Meyer, J. (2004)**. Conceptual issues in the study of dynamic hazard warnings. *Human Factors*, 46(2), 196-204.

- **Sarter, N. B., Mumaw, R. J., & Wickens, C. D. (2007)**. Pilots' monitoring strategies and performance on automated flight decks: An empirical study combining behavioral and eye-tracking data. *Human Factors*, 49(3), 347-357.

- **Wang, N., Pynadath, D. V., & Hill, S. G. (2016)**. Trust calibration within a human-robot team: Comparing automatically generated explanations. *HRI 2016*, 109-116.

- **Wang, Y., Khardon, R., & Protopapas, P. (2018)**. Nonparametric Bayesian models for ranked data. *UAI 2018*, 188-197.

### Team Dynamics

- **Burton, J. W., Stein, M. K., & Jensen, T. B. (2020)**. A systematic review of algorithm aversion in augmented decision making. *Journal of Behavioral Decision Making*, 33(2), 220-239.

- **Glikson, E., & Woolley, A. W. (2020)**. Human trust in artificial intelligence: Review of empirical research. *Academy of Management Annals*, 14(2), 627-660.

- **Koopmann, J., Lanaj, K., Wang, M., Zhou, L., & Shi, J. (2024)**. Observational learning from peers and coworkers. *Academy of Management Journal*.

- **Lebovitz, S., Lifshitz-Assaf, H., & Levina, N. (2021)**. To engage or not to engage with AI for critical judgments: How professionals deal with opacity when using AI for medical diagnosis. *Organization Science*, 33(1), 126-148.

- **Lyons, J. B., Wynne, K. T., Mahoney, S., & Roebke, M. A. (2021)**. Trust and human-machine teaming: A qualitative study. *Artificial Intelligence for the Internet of Everything*, 101-116.

- **Raghu, M., Blumer, K., Sayres, R., Obermeyer, Z., Kleinberg, B., Mullainathan, S., & Kleinberg, J. (2019)**. Direct uncertainty prediction for medical second opinions. *ICML 2019*, 5281-5290.

- **Wang, D., Churchill, E., Maes, P., Fan, X., Shneiderman, B., Shi, Y., & Wang, Q. (2020)**. From human-human collaboration to human-AI collaboration: Designing AI systems that can work with people. *Extended Abstracts CHI 2020*, 1-6.

- **Wilder, B., Horvitz, E., & Kamar, E. (2021)**. Learning to complement humans. *IJCAI 2021*, 1526-1533.

### Interventions

- **Bahner, J. E., Hüper, A. D., & Manzey, D. (2008)**. Misuse of automated decision aids: Complacency, automation bias and the impact of training experience. *International Journal of Human-Computer Studies*, 66(9), 688-699.

- **Bai, X., Wang, X., Liu, X., Liu, Q., Song, J., Sebe, N., & Kim, B. (2023)**. Explainable deep learning for efficient and robust pattern recognition: A survey of recent developments. *Pattern Recognition*, 120, 108102.

- **Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021)**. To trust or to think: Cognitive forcing functions can reduce overreliance on AI in AI-assisted decision-making. *Proceedings of CSCW*, 4:1-4:21.

- **Bussone, A., Stumpf, S., & O'Sullivan, D. (2015)**. The role of explanations on trust and reliance in clinical decision support systems. *HealthRecSys@RecSys 2015*, 160-169.

- **Ehsan, U., Liao, Q. V., Muller, M., Riedl, M. O., & Weisz, J. D. (2021)**. Expanding explainability: Towards social transparency in AI systems. *CHI 2021*, 1-19.

- **Gonzalez, C., Lerch, J. F., & Lebiere, C. (2020)**. Instance-based learning in dynamic decision making. *Cognitive Science*, 27(4), 591-635.

- **Green, B., & Chen, Y. (2019)**. Disparate interactions: An algorithm-in-the-loop analysis of fairness in risk assessments. *FAT* 2019*, 90-99.

- **Kocielnik, R., Amershi, S., & Bennett, P. N. (2019)**. Will you accept an imperfect AI? Exploring designs for adjusting end-user expectations of AI systems. *CHI 2019*, 1-14.

- **Lim, B. Y., & Dey, A. K. (2009)**. Assessing demand for intelligibility in context-aware applications. *UbiComp 2009*, 195-204.

- **Stowers, K., Brady, L. L., MacLellan, C., Wohleber, R., & Salas, E. (2020)**. Improving teamwork competencies in human-machine teams: Perspectives from team science. *Frontiers in Psychology*, 11, 1778.

- **Vasconcelos, H., Jörke, M., Grunde-McLaughlin, M., Gerstenberg, T., Bernstein, M. S., & Krishna, R. (2023)**. Explanations can reduce overreliance on AI systems during decision-making. *CSCW 2023*, 1-38.

### AI Safety Implications

- **Endsley, M. R., & Kiris, E. O. (1995)**. The out-of-the-loop performance problem and level of control in automation. *Human Factors*, 37(2), 381-394.

- **Jacovi, A., Marasović, A., Miller, T., & Goldberg, Y. (2021)**. Formalizing trust in artificial intelligence: Prerequisites, causes and goals of human trust in AI. *FAccT 2021*, 624-635.

- **Körber, M., Baseler, E., & Bengler, K. (2018)**. Introduction matters: Manipulating trust in automation and reliance in automated driving. *Applied Ergonomics*, 66, 18-31.

- **Lyell, D., & Coiera, E. (2017)**. Automation bias and verification complexity: A systematic review. *Journal of the American Medical Informatics Association*, 24(2), 423-431.

- **Parasuraman, R., Molloy, R., & Singh, I. L. (1993)**. Performance consequences of automation-induced 'complacency'. *International Journal of Aviation Psychology*, 3(1), 1-23.

- **Shneiderman, B. (2020)**. Human-centered artificial intelligence: Reliable, safe & trustworthy. *International Journal of Human-Computer Interaction*, 36(6), 495-504.

- **Tschandl, P., Rinner, C., Apalla, Z., Argenziano, G., Codella, N., Halpern, A., ... & Kittler, H. (2020)**. Human–computer collaboration for skin cancer recognition. *Nature Medicine*, 26(8), 1229-1234.

- **Zhang, B., Kreps, S., & McMurry, N. (2022)**. Americans' perceptions of privacy and surveillance in the COVID-19 pandemic. *PLOS ONE*, 17(2), e0262652.
