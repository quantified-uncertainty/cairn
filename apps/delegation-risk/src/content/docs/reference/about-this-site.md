---
title: "About This Site"
sidebar:
  order: 100
---

# About This Site

## How This Documentation Was Created

This documentation was created rapidly—over the course of a few days—with substantial assistance from large language models (primarily Claude). This has implications for how you should read it.

### What This Means

**Strengths of LLM-assisted creation:**
- Rapid exploration of ideas and their implications
- Consistent terminology across ~100,000 words
- Systematic coverage of related concepts
- Quick iteration on structure and framing

**Limitations to be aware of:**
- **Less vetting than traditional documentation**: Most content has not been extensively reviewed by domain experts
- **Possible hallucinated details**: Some specific claims (numbers, citations, examples) may be inaccurate
- **Inherited biases**: The content reflects patterns in LLM training data, which may include errors or biases
- **Untested recommendations**: The practical recommendations have not been validated in production systems

### Epistemic Status

This documentation should be read as **exploratory writing**—an attempt to systematize ideas about delegation risk, not a vetted technical specification.

The core concepts (Delegation Risk quantification, structural safety through decomposition, cross-domain methods) are adapted from established fields and seem sound in principle. But:

- The specific formulas and numbers are illustrative, not validated
- The case studies (except Sydney) are hypothetical scenarios
- The recommendations reflect our current thinking, which may change
- The framework as a whole is untested at scale for AI systems

### Why Publish It Anyway?

We believe the ideas are valuable enough to share even in this form because:

1. **The core insight seems important**: Safety through architecture, not just behavior
2. **Early discussion is valuable**: Getting feedback on the approach while it's still malleable
3. **Transparency about process**: Being clear about how it was made helps readers calibrate
4. **Iteration is possible**: This is living documentation that can be improved

### How to Help

If you find errors, unclear reasoning, or have suggestions:

- Open an issue on [GitHub](https://github.com/quantified-uncertainty/delegation-risk-framework)
- The documentation is open source under CC BY 4.0

We're especially interested in:
- Factual corrections
- Logical inconsistencies
- Missing considerations
- Real-world examples (positive or negative)
- Alternative framings that work better

### Acknowledgments

This documentation was written primarily by Ozzie Gooen with substantial assistance from Claude (Anthropic). The framework draws on ideas from many sources, including Eric Drexler's CAIS, Redwood Research's AI Control work, and decades of nuclear/financial risk management practice.

The rapid creation was an experiment in using LLMs for technical writing at scale. We've tried to be transparent about the process and its limitations.
