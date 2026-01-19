---
title: "Linear Logic for Delegation Risk Budgets"
description: "Type systems that enforce resource constraints for AI safety"
author: "Research compiled from academic sources"
date: "2025-12-13"
---

# Linear Logic for Delegation Risk Budgets: A Research Survey

## Executive Summary

This document surveys the intersection of linear logic, type systems, and capability-based security as potential foundations for enforcing trust and risk budgets in AI safety systems. Linear logic provides a mathematical foundation for reasoning about resources that must be used exactly once, while type systems can enforce these constraints at compile time. Capability-based security adds unforgeable tokens of authority that can be revoked or attenuated. Together, these concepts offer a rigorous framework for implementing delegation risk framework and risk budgeting in AI systems.

---

## 1. Linear Logic Foundations (Girard 1987)

### 1.1 Core Concept: Resources Used Exactly Once

Linear logic was introduced by Jean-Yves Girard in his seminal 1987 paper "Linear Logic" (Theoretical Computer Science 50(1): 1–101). The fundamental idea is that **each assumption in a proof should be used exactly once**: no more (no copying via contraction), but no less (no deleting via weakening).

Linear logic is a **substructural logic** that emphasizes the treatment of logical hypotheses as consumable resources. Unlike classical or intuitionistic logic, linear logic forbids the free duplication (contraction) or deletion (weakening) of assumptions.

**Key intuition**: Linear implication φ ⊸ ψ is thought of as a causal process of bringing about ψ by consuming φ. The formula acquires the intuitive sense of "you can get ψ at the cost of φ." Once φ is used, it is "used up" and no longer available.

### 1.2 Multiplicative vs Additive Connectives

Linear logic decomposes classical logical connectives into more primitive forms:

**Multiplicative Connectives** (⊗, ⅋, 1, ⊥):
- **⊗ (tensor)**: Multiplicative conjunction - combines resources that are both available
- **⅋ (par)**: Multiplicative disjunction - dual to tensor
- **1 (one)**: Multiplicative unit for tensor
- **⊥ (bottom)**: Multiplicative unit for par

In multiplicative rules, the context is **split** between premises. For example, in the tensor rule, if Γ ⊢ A and Δ ⊢ B, then Γ,Δ ⊢ A ⊗ B.

**Additive Connectives** (⊕, &, 0, ⊤):
- **& (with)**: Additive conjunction - internal choice
- **⊕ (oplus)**: Additive disjunction - external choice
- **⊤ (top)**: Additive unit for &
- **0 (zero)**: Additive unit for ⊕

In additive rules, the context is **shared** (not split). For example, in the with rule, if Γ ⊢ A and Γ ⊢ B, then Γ ⊢ A & B.

### 1.3 The Exponentials (! and ?)

To recover the full expressive power of classical and intuitionistic logic, linear logic includes two **modal operators**:

- **! (of-course or "bang")**: Permits contraction and weakening to be applied to !B in the left-hand sequent context
- **? (why-not)**: Permits contraction and weakening to be applied to ?B on the right-hand sequent context

The exponentials provide **controlled reuse** of resources. They follow algebraic laws similar to exponentiation:
- !(B & C) ≡ (!B ⊗ !C)
- ?(B ⊕ C) ≡ (?B ⅋ ?C)

### 1.4 Resource Interpretation of Proofs

Girard discovered that usual logical connectors such as ⇒ (implication) could be broken up into more elementary linear connectors. This provided a new linear logic where hypotheses are used once and only once. Surprisingly, all the power of usual logic can be recovered by means of the recursive logical operators (the exponentials).

**Phase semantics** (Girard 1987) provides a model for linear logic using resource-aware interpretations. Linear logic is often described as a **logic of resource management** or a **resource-sensitive logic**.

### 1.5 Fragments and Complexity

- **MLL (Multiplicative Linear Logic)**: Contains only multiplicatives. MLL entailment is NP-complete.
- **MALL (Multiplicative-Additive Linear Logic)**: Contains multiplicatives and additives (no exponentials). MALL entailment is PSPACE-complete.
- **MELL (Multiplicative-Exponential Linear Logic)**: Contains multiplicatives and exponentials. MELL entailment is at least EXPSPACE-hard.

**Key References**:
- Girard, J.-Y. (1987). "Linear Logic". *Theoretical Computer Science* 50(1): 1–101.
- [Stanford Encyclopedia of Philosophy: Linear Logic](https://plato.stanford.edu/entries/logic-linear/)
- [Linear Logic - Wikipedia](https://en.wikipedia.org/wiki/Linear_logic)

---

## 2. Linear Types in Programming

### 2.1 Rust's Ownership/Borrowing as Affine Types

Rust's type system is based on **affine types** rather than strictly linear types. The key distinction:

| Type System | Weakening? | Contraction? | Uses |
|-------------|------------|--------------|------|
| Normal types | YES | YES | Any number |
| Affine types | YES | NO | At most once |
| Linear types | NO | NO | Exactly once |

**Rust uses affine types**: Most types in Rust can be used **zero or one times** (not exactly once). Values can be silently dropped (weakening is allowed), but cannot be duplicated (contraction is forbidden).

**Ownership model**: Rust's ownership system is based on prior work in linear and affine types, particularly Baker's work on Linear Lisp (1992) where linearity enabled efficient reuse of objects in memory. The resemblance is especially strong between Rust without borrowing and Baker's "use-once" variables.

**Borrowing**: The core idea of borrowing is to **suspend linear/affine type rules for some delimited time**. It's a combination of region-based memory management with linear/affine types. In Rust, `&mut` references provide mutable borrows with exclusive access, while `&` references provide shared immutable access.

**Benefits**:
- Memory safety without garbage collection
- Deterministic resource cleanup
- Prevention of use-after-free and double-free errors
- Thread safety guarantees (Send and Sync traits)

### 2.2 Linear Haskell

Linear Haskell extends Haskell with **linear types** through a graded function arrow. The proposal aims to add linearity without fundamentally changing the language.

**Linear function types**: In Linear Haskell, a function type `a ⊸ b` (linear arrow) indicates that if the result is consumed exactly once, then the argument is consumed exactly once.

**Multiplicity polymorphism**: Linear Haskell uses multiplicities on the binders rather than on the types, making it easier to combine linear and non-linear programs.

**Applications**:
- Safe memory management in inline-java (coordinating Haskell and Java garbage collectors)
- Protocol enforcement at compile time
- Resource-safe APIs

### 2.3 Uniqueness Types (Clean, Idris)

**Uniqueness types** are very similar to linear types, to the point that the terms are often used interchangeably. The distinction: actual linear typing allows a non-linear value to be typecast to a linear form while still retaining multiple references to it, whereas uniqueness typing guarantees at most a single reference.

**Clean**: Uses uniqueness types designed to ensure that values have at most a single reference to them. This enables safe in-place updates and efficient I/O operations.

**Idris 1**: Had experimental uniqueness types inspired by linear types, Clean's uniqueness types, and Rust's ownership. Values with unique types are guaranteed to have at most one reference at run-time, allowing safe in-place updates.

**Idris 2**: Moved to **Quantitative Type Theory (QTT)** with multiplicities on binders. The `1` multiplicity expresses that a variable must be used exactly once. The QTT approach to linearity is much easier to combine with other non-linear programs than the earlier uniqueness typing system.

### 2.4 Session Types for Protocols

**Session types** provide a structured way of prescribing communication protocols of message-passing systems. Binary session types govern interactions along channels with two endpoints.

**Connection to linear logic**: Binary session types without general recursion exhibit a **Curry-Howard isomorphism with linear logic**. Session types can be developed as a system for tracking correct communication behavior built on top of a linear usage discipline for channel resources.

**Linearity requirement**: For session typing to make sense, **each session endpoint must be used exactly once**. This is the largest barrier to implementation.

**Verification approaches**:
- **Static verification**: Conformance checked fully at compile time
- **Dynamic verification**: Session types compiled into communicating finite-state machines, checked at runtime
- **Hybrid verification**: Message ordering checked statically, linearity checked dynamically

**Multiparty Session Types (MPST)**: Extend binary session types to encompass interactions with more than two participants. Global types describe top-down interactions, then are "projected" into local types for each participant.

**Implementations**:
- Rust: Binary session types using Rust's affine typing
- Scala: Continuation-passing approach with dynamic linearity checking
- OCaml: ocaml-mpst library with static linear usage verification

**Key benefit**: **Protocol correctness** guarantees - well-typed programs cannot get stuck in communication deadlocks or send wrong message types.

**Key References**:
- [Session Types - Simon Fowler](https://simonjf.com/2016/05/28/session-type-implementations.html)
- [Session Types Tutorial](https://www.doc.ic.ac.uk/~rhu/popl14tutorial.pdf)

### 2.5 Practical Benefits

Linear types enable several practical benefits in programming:

1. **Memory safety**: Guaranteed memory deallocation without garbage collection
2. **Protocol correctness**: Enforcing state machines and communication protocols
3. **Resource management**: Files, sockets, locks managed safely
4. **Concurrency**: Preventing data races and ensuring thread safety
5. **Performance**: Enabling in-place updates and avoiding unnecessary copies

**Key References**:
- [Rust Ownership - Without Boats](https://without.boats/blog/ownership/)
- [What Vale Taught Me About Linear Types](https://verdagon.dev/blog/linear-types-borrowing)
- [Idris 2: Quantitative Type Theory in Practice](https://arxiv.org/pdf/2104.00480)

---

## 3. Bounded Linear Logic

### 3.1 Girard, Scedrov, Scott (1992)

**"Bounded Linear Logic: A Modular Approach to Polynomial-Time Computability"** by Jean-Yves Girard, Andre Scedrov, and Philip J. Scott was published in *Theoretical Computer Science* 97(1): 1–66, 1992.

**Core contribution**: A logical framework for programming languages that treats **requirements on computation resources as part of the formal program specification**. The paper proves that the numerical functions representable in this calculus are **exactly the PTIME (polynomial time) functions**.

**Key idea**: By bounding the exponential modality with resource polynomials, the logic can characterize polynomial-time computation. The modality !ⁿA indicates that A can be used at most n times, where n is a polynomial expression.

**Modular paradigm**: Bounded linear logic provides a typed, modular approach to polynomial-time computation that allows compositional reasoning about complexity.

### 3.2 Ghica and Smith (2014)

**"Bounded Linear Types in a Resource Semiring"** by Dan R. Ghica and Alex I. Smith was presented at ESOP (European Symposium on Programming) in 2014.

**Generalization**: Introduces a bounded linear typing discipline on a **general notion of resource which can be modeled in a semiring**. This provides both:
- A general type-inference procedure, parameterized by the decision procedure of the semiring equational theory
- A coherent categorical semantics

**Connection to BLL**: When resources are taken to be polynomials, the system recovers Bounded Linear Logic.

**Application**: The paper presents a complex application to **calculating and controlling timing of execution** in a (recursion-free) higher-order functional programming language with local store.

**Key References**:
- Ghica, D. R., & Smith, A. I. (2014). "Bounded linear types in a resource semiring". *ESOP 2014*, LNCS 8410, pp. 331-350.
- [PDF](https://pure-oai.bham.ac.uk/ws/portalfiles/portal/23697858/esop14.pdf)

### 3.3 QBAL - Quantified Bounded Affine Logic

**QBAL** extends Girard, Scedrov and Scott's bounded linear logic with the **possibility of quantifying over resource variables**. This generalization makes bounded linear logic considerably more flexible while preserving soundness and completeness for polynomial time.

**Formulas**: QBAL formulas include quantification over resource variables:
- ∀α.A (quantification over resource polynomials)
- !ˣ<ᵖA (bounded modality with polynomial bound p)
- ∀(x₁,...,xₙ) : C.A (bounded first-order quantification)

**Boundedness condition**: For every quantified variable xᵢ, there must be a resource polynomial pᵢ not containing the variables x₁,...,xₙ such that C |= {x₁≤p₁,...,xₙ≤pₙ}. Any function representable in QBAL is polynomial-time computable.

**Embeddings**: QBAL provides compositional embeddings of:
- Leivant's Ramified Recurrence (RRW)
- Hofmann's Linear Functional Programming Language (LFPL)

**Related work**: **SBAL (Stratified Bounded Affine Logic)** is a restricted version that characterizes **logarithmic space** rather than polynomial time.

**Key Reference**:
- Dal Lago, U., & Hofmann, M. (2009). "Bounded Linear Logic, Revisited". *Logical Methods in Computer Science*.

### 3.4 Polynomial Time Guarantees from Type Systems

The progression from bounded linear logic to practical type systems demonstrates how **type-level resource tracking can provide complexity guarantees**:

1. **BLL (1992)**: Theoretical foundation linking linear logic to PTIME
2. **LFPL (Hofmann)**: Practical functional language with polynomial-time guarantee
3. **QBAL**: More flexible system with quantification over resources
4. **Resource semirings (Ghica & Smith)**: General framework parameterized by semiring structure

**Implication for delegation risk budgets**: These systems demonstrate that **type systems can statically enforce quantitative bounds** on resource consumption. This could be adapted to enforce trust/risk budgets in AI systems.

---

## 4. Object Capabilities

### 4.1 Dennis & Van Horn (1966) - Original Concept

**"Programming Semantics for Multiprogrammed Computations"** by Jack B. Dennis and Earl C. Van Horn, published in *Communications of the ACM* 9(3), 1966, introduced the concept of capabilities.

**Core concept**: A process contains a pointer to a list of capabilities called a **C-list**. Each capability in the C-list:
- Names an object in the system
- Specifies the access rights permitted to that object

**Sphere of protection**: The computation's C-list defines the sphere of protection under which the process can run - i.e., the devices, segments, etc. the process can access.

**Key properties**:
- Capabilities are **unforgeable** - they cannot be created arbitrarily
- They can be **delegated** - passed from one subject to another
- They combine **designation** (naming an object) and **authority** (rights to access it)

### 4.2 Mark Miller's Work on Capability Security

**Mark S. Miller** is Chief Scientist at Agoric and a leading researcher in object-capabilities, programming language design, and secure distributed systems.

**PhD Thesis**: "Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control" (Johns Hopkins University, 2006).

**Key contributions**:
- E language: A capability-secure programming language
- Caja: "Safe active content in sanitized JavaScript" (2008)
- Object-capability model formalization

**"Capability Myths Demolished"** (2003) by Mark Miller, Ka-Ping Yee, and Jonathan Shapiro clarified misconceptions about capability-based security.

### 4.3 Languages: E, Joe-E, Pony, Cadence, Austral

**E Language**:
- One of the first modern object-capability languages
- Influenced later capability-secure languages
- Combined capabilities with actor model for distributed computing

**Joe-E**:
- A capability-safe subset of Java
- Enforces object-capability model through restrictions on Java features
- Demonstrated capability security in mainstream language contexts

**Pony**:
- Open-source, object-oriented, actor-model, capability-secure language
- Uses **deny capabilities** (reference capabilities) - expresses what a subject is NOT able to do
- Combines object-capability security with reference capabilities in the type system
- High performance with memory safety guarantees

**Cadence**:
- Smart contract language with resource types (linear types)
- Capability-based security built into static type system
- Capabilities are values representing the right to access objects
- Used in blockchain/Web3 contexts

**Austral**:
- Systems programming language with linear types AND capability-based security
- Features: strong static types, linear types, capability-based security, strong modularity
- **Capabilities as linear types**: Capabilities are linear values that cannot be duplicated
- Solves supply chain attacks: code must be explicitly passed capabilities to access privileged resources
- Simpler borrowing model than Rust

### 4.4 Relationship to Linear Types

**Natural synergy**: Linear types and capabilities combine powerfully:

1. **Unforgeable tokens**: Capabilities are references that cannot be forged
2. **Linear capabilities**: Capabilities implemented as linear types cannot be duplicated
3. **Exclusive access**: Linear capabilities guarantee no aliases exist (CAPSTONE project)
4. **Revocation**: Linear types make capability revocation tractable

**CAPSTONE** (USENIX Security 2023): Introduces **linear capabilities** - guaranteed to be alias-free, meaning no other capability grants overlapping memory accesses. A domain holding a linear capability has exclusive access to the associated memory region.

**Key insight**: Linear types provide the **mechanism** (use-exactly-once), while capabilities provide the **policy** (unforgeable authority). Together they enable fine-grained authority control with static verification.

**Key References**:
- [Object-Capability Model - Wikipedia](https://en.wikipedia.org/wiki/Object_capability_model)
- [Austral Capability-Based Security](https://austral-lang.org/tutorial/capability-based-security)
- [Wyvern: A Capability-Based Module System](https://drops.dagstuhl.de/entities/document/10.4230/DARTS.3.2.2)

---

## 5. Applying to Trust/Risk Budgets

### 5.1 Linear Types for "Risk Budget Consumed Exactly Once"

The core insight: **Risk budgets are consumable resources** that can be modeled with linear types.

**Conceptual mapping**:
- **Linear type**: Risk budget allocation
- **Consuming the value**: Performing a risky operation
- **Type checking**: Ensures budget is neither exceeded (used twice) nor wasted (unused)

**Example type signatures**:
```
// Allocate risk budget
allocate_risk : () ⊸ RiskBudget

// Consume budget to perform risky action
risky_action : (RiskBudget, Action) ⊸ Result

// Split budget between parallel operations
split_budget : RiskBudget ⊸ (RiskBudget, RiskBudget)
```

**Benefits**:
- **Static verification**: Compiler ensures risk budgets are consumed properly
- **No double-spending**: Linear types prevent using the same budget twice
- **Exhaustiveness**: Type system ensures all allocated budgets are used or explicitly discarded
- **Compositional reasoning**: Budget splitting and merging can be tracked through types

### 5.2 Type-Level Tracking of Trust Provenance

**Trust provenance** tracks the origin and transformation history of trust/risk measurements.

**Dependent types approach**: Use dependent types to track trust levels in types themselves:
```
data TrustLevel = Untrusted | Low | Medium | High

// Data tagged with trust level
data Trusted (t : TrustLevel) (a : Type) : Type

// Operations must preserve or reduce trust
sanitize : Trusted Untrusted String ⊸ Trusted Low String
verify : Trusted Low Data ⊸ Maybe (Trusted High Data)
```

**Graded modal types**: Use graded modalities to track trust provenance:
- The grade indicates the trust level or source
- Type system ensures trust cannot be increased without justification
- Downgrading is always allowed; upgrading requires evidence

**Quantitative Type Theory (QTT)**: Use multiplicities to track usage:
- `0` for erased/unused trust tokens
- `1` for linear delegation risk budgets
- `ω` for reusable trust assertions (after verification)

### 5.3 Capability-Based Authority Limiting

**Capabilities as trust tokens**: Each capability represents authority derived from a delegation risk budget.

**Hierarchical trust domains**:
```
// Root capability with full authority
type RootCap : Capability

// Attenuated capability with limited authority
attenuate : RootCap ⊸ (LimitedCap, RootCap)

// Use limited capability for risky action
use_limited : (LimitedCap, Action) ⊸ Result
```

**Advantages**:
- **Unforgeable**: Capabilities cannot be created from nothing
- **Delegatable**: Can pass limited authority to sub-components
- **Revocable**: Parent can revoke child capabilities
- **Composable**: Multiple capabilities can be combined with appropriate rules

**Application to AI safety**:
- AI agent receives limited capabilities based on trust level
- Capabilities can be revoked if trust decreases
- Sub-agents receive attenuated capabilities
- Linearity ensures capabilities aren't duplicated improperly

### 5.4 Practical Implementation Challenges

**Challenge 1: Ergonomics**
- Linear types can be restrictive and difficult to use
- Solution: Borrowing mechanisms (like Rust), focus/adoption (like Vault)

**Challenge 2: Legacy integration**
- Existing AI systems not written with linear types
- Solution: Gradual typing, hybrid verification (static + dynamic)

**Challenge 3: Runtime overhead**
- Some linearity checks may need runtime support
- Solution: Zero-cost abstractions, compile-time verification where possible

**Challenge 4: Expressiveness**
- Some trust patterns may not fit linear discipline
- Solution: Combine with other type system features (effects, coeffects, graded modalities)

**Challenge 5: Verification complexity**
- Complex systems may be hard to type-check
- Solution: Type inference, SMT solvers, gradual refinement

---

## 6. Existing Work Combining These

### 6.1 Linear Types + Capabilities

**Austral**: Most directly combines linear types with capability-based security in a systems programming language.
- Linear types for resource safety
- Capabilities for authority control
- Explicit destructors for resources
- Simpler than Rust's borrow checker

**Wyvern**: Object-oriented language with:
- Capability-safe module system
- Structural typing
- Type-based encapsulation
- Capability-safe reflection
- "Capabilities: Effects for Free" (Craig et al., 2018)

**Pony**: Combines object capabilities with reference capabilities:
- Reference capabilities express denial of permissions (what you CAN'T do)
- Actor model with capability security
- Type system prevents data races

**CAPSTONE**: Hardware capability system with linear capabilities:
- Linear capabilities guarantee exclusive access
- Alias-free memory regions
- Built on CHERI capability model

### 6.2 Quantitative Type Theories (QTT)

**Atkey (2018)**: "Syntax and Semantics of Quantitative Type Theory" (LICS 2018)
- Each variable binding has a quantity (0, 1, or ω)
- `0` = used zero times (erased/irrelevant)
- `1` = used exactly once (linear)
- `ω` = used unrestricted times (normal)
- Semantics via Quantitative Categories with Families

**McBride (2016)**: "I Got Plenty o' Nuttin'"
- Early version of QTT with usage tracking
- Had issues with substitution property (fixed by Atkey)

**Idris 2** (Brady 2020): "Quantitative Type Theory in Practice"
- Practical implementation of QTT in dependently-typed language
- Supports linear and dependent types
- Allows precision in expressing when functions can run
- Linearity for resource management + dependent types for verification

**Applications**:
- Guaranteeing safe memory usage
- Preventing insecure information flow
- Quantifying information leakage
- Identifying irrelevant computations

### 6.3 Graded Modal Types

**Orchard, Liepelt, Eades (2019)**: "Quantitative Program Reasoning with Graded Modal Types" (ICFP 2019)
- Graded modalities parameterized by effect/coeffect system
- Semiring-indexed modal types
- Resource analysis via grading

**Moon, Eades, Orchard (2021)**: "Graded Modal Dependent Type Theory" (ESOP 2021)
- Combines grading with dependent types
- Parameterizable analysis of data flow
- Applicable to various purposes (resource usage, security, information flow)

**Gaboardi et al. (2016)**: "Combining Effects and Coeffects via Grading"
- Unified framework for effects (what computation does) and coeffects (what computation needs)
- Graded monad structure

**The Granule Project**: Research language centered on graded modal types
- User-customizable graded modalities
- BLL-style resource-bounded graded necessity
- Security-lattice graded necessity
- Effect-graded possibility modality for I/O

**Information-flow control**: Graded coeffects for tracking information flow
- Security levels as grades
- Type system prevents information leakage
- Non-interference theorems

### 6.4 Resource-Aware Program Analysis

**RaRust** (2025): "Automatic Linear Resource Bound Analysis for Rust via Prophecy Potentials"
- Type-based linear resource-bound analysis for Rust
- Automatic Amortized Resource Analysis (AARA) methodology
- Prophecy potentials to reason about borrows compositionally
- Polynomial resource bounds verified automatically

**Iris**: Higher-order concurrent separation logic framework
- Resource algebras for user-defined resources
- Fractional permissions for shared access
- Temporal reasoning about resource ownership
- Implemented in Coq proof assistant

**Separation Logic**: Resource-sensitive logic for concurrent programs
- Resources as predicates over heap fragments
- Separating conjunction (∗) for disjoint resource ownership
- Fractional permissions for read/write access control
- Concurrent Separation Logic (CSL) for thread reasoning

**Coeffects**: Dual to effects, capturing dataflow and context requirements
- Effects: what computation does
- Coeffects: what computation needs (resources, environment, context)
- Graded coeffect systems track resource requirements in types

**Key References**:
- [RaRust Paper (arXiv 2025)](https://arxiv.org/abs/2502.19810)
- [Iris from the Ground Up](https://people.mpi-sws.org/~dreyer/papers/iris-ground-up/paper.pdf)
- [Quantitative Program Reasoning with Graded Modal Types](https://dl.acm.org/doi/10.1145/3341714)

---

## 7. Practical Implementation Path

### 7.1 What Would a "Delegation Risk Budget Type System" Look Like?

A practical delegation risk budget type system would combine several concepts:

**Core components**:

1. **Linear/Affine types for budgets**:
```haskell
-- Affine: can use at most once (allows dropping)
data RiskBudget : Affine where
  Budget : Float -> RiskBudget

-- Linear: must use exactly once (no dropping)
data CriticalRiskBudget : Linear where
  CriticalBudget : Float -> CriticalRiskBudget
```

2. **Graded modalities for trust levels**:
```haskell
-- Grade represents trust level
data Trusted : (level : TrustLevel) -> Type -> Type

-- Can only increase trust with evidence
upgrade : Trusted Low a -> Evidence -> Maybe (Trusted High a)

-- Can always decrease trust
downgrade : Trusted High a -> Trusted Low a
```

3. **Capabilities for authority**:
```haskell
-- Capability grants authority to perform action
data ActionCap : Capability where
  Cap : TrustBudget -> ActionPermission -> ActionCap

-- Use capability (consumes it)
use : ActionCap ⊸ Action ⊸ Result
```

4. **Effects for tracking risk operations**:
```haskell
-- Effect system tracks risky operations
data RiskEffect : Effect where
  AllocateRisk : Float -> RiskEffect RiskBudget
  ConsumeRisk : RiskBudget -> Action -> RiskEffect Result

-- Handler bounds total risk
runWithRiskBound : (max : Float) -> Eff [Risk] a -> Maybe a
```

5. **Dependent types for verification**:
```haskell
-- Prove budget is sufficient at type level
risky_action : (budget : RiskBudget)
            -> {auto prf : budget.amount >= required}
            -> Action
            ⊸ Result
```

**Integration approach**:
```haskell
-- Complete example
module TrustBudget where

-- Trust levels form a lattice
data TrustLevel = Untrusted | Low | Medium | High | Verified

-- Resources are linear
data Resource : Linear

-- Capabilities are unforgeable and linear
data Capability : (resource : Resource) -> (level : TrustLevel) -> Linear

-- Risk budget is quantified
data RiskBudget : (amount : Float) -> Affine

-- Operations consume budget and require capability
execute : Capability res level
       -> RiskBudget amount
       -> {auto prf : level >= required_trust}
       -> {auto prf : amount >= required_budget}
       -> Action res
       ⊸ (Result, RiskBudget remaining)
```

### 7.2 Integration with Existing Languages

**Approach 1: Embedded DSL**
- Implement delegation risk budget system as library in host language
- Use type system features of host (Haskell's linear types, Rust's affine types)
- Advantage: Works with existing tooling
- Disadvantage: Limited by host language capabilities

**Approach 2: Language extension**
- Extend existing language with delegation risk budget primitives
- Examples: Linear Haskell extended Haskell, Idris 2 extended Idris 1
- Advantage: Tailored precisely to needs
- Disadvantage: Requires compiler modifications

**Approach 3: New language**
- Design language from scratch (like Austral)
- Advantage: No compromises, can optimize for delegation risk budgets
- Disadvantage: Adoption challenges, tooling from scratch

**Approach 4: Gradual typing**
- Start with dynamic checks, gradually add static types
- Example: TypeScript's gradual approach to JavaScript
- Advantage: Incremental adoption, works with legacy code
- Disadvantage: Weaker guarantees than full static typing

**Realistic path**: Hybrid approach
1. Start with embedded DSL in typed language (Rust, Haskell, Idris)
2. Validate concepts with dynamic runtime checks
3. Gradually strengthen to static verification
4. Extract core ideas into standalone language if needed

### 7.3 Runtime Enforcement vs Compile-Time

**Compile-time verification**:

*Advantages*:
- Zero runtime overhead
- Catch errors before deployment
- Stronger guarantees (if it compiles, certain properties hold)
- Better for safety-critical systems

*Disadvantages*:
- May reject valid programs (conservative)
- Can be difficult to type complex patterns
- Slower development iteration
- Requires sophisticated type inference

**Runtime enforcement**:

*Advantages*:
- More flexible, accepts more programs
- Easier to understand for developers
- Faster development iteration
- Can provide detailed error messages with context

*Disadvantages*:
- Performance overhead
- Errors only caught when code path executes
- May fail in production
- No static guarantees

**Hybrid approach** (recommended):

1. **Static verification for critical properties**:
   - Linearity of core resources (budgets, capabilities)
   - Trust level monotonicity (can't increase without justification)
   - Basic resource bounds

2. **Dynamic verification for complex properties**:
   - Exact budget amounts (may depend on runtime data)
   - Complex trust calculations
   - Adaptive trust adjustments

3. **Gradual refinement**:
   - Start with dynamic checks
   - Add type annotations incrementally
   - Refine to static verification where feasible
   - Keep dynamic checks as defense-in-depth

**Examples from practice**:

- **Scala session types**: Message order static, linearity dynamic
- **Rust**: Ownership static, some lifetime checks dynamic (RefCell)
- **Granule**: Mix of static grading and dynamic checks
- **Liquid Haskell**: Refinement types with SMT solver (hybrid static/dynamic)

**For delegation risk budgets specifically**:

```
Static (compile-time):
✓ Budget is linear (used exactly once)
✓ Capability is unforgeable
✓ Trust levels form proper lattice
✓ Operations require appropriate trust level

Dynamic (runtime):
✓ Budget amount is sufficient
✓ Trust calculation accuracy
✓ Capability revocation
✓ Adaptive trust updates based on behavior
```

### 7.4 Tooling and Developer Experience

**Essential tools**:

1. **Type inference**: Minimize annotation burden
2. **Error messages**: Explain linearity violations clearly
3. **IDE support**: Show budget/trust flows visually
4. **Debugging**: Track resource usage through execution
5. **Testing**: Verify budget enforcement in tests
6. **Documentation**: Examples and patterns for common cases

**Learning from existing systems**:
- Rust's borrow checker errors (improved over time)
- Haskell's type error messages
- Idris's interactive development
- F*'s SMT-based verification

---

## 8. Related Historical Work

### 8.1 Henry Baker's Linear Lisp (1992-1995)

**"Lively Linear Lisp: 'Look Ma, No Garbage!'"** (1992)
- Efficient implementation of linear logic in functional language
- Runs within constant factor of non-linear logic performance
- No garbage collection needed
- Linear Lisp allows RPLACX operations (in-place updates) safely

**"'Use-Once' Variables and Linear Objects"** (1995)
- Programming languages should have use-once variables
- Linear objects are cheap: no synchronization or tracing GC needed
- Ideal for directly manipulating inherently linear resources (freelists, engine ticks)
- A use-once variable must be dynamically referenced exactly once within its scope

**Core concept**: A function is a "black box" which consumes its arguments and produces its result. Every parameter and local variable must be referenced exactly once - it's a runtime error otherwise.

**Influence**: Baker's work directly influenced Rust's ownership model, particularly Rust without borrowing.

### 8.2 Cyclone (2002)

**"Region-Based Memory Management in Cyclone"** by Grossman and Morrisett (PLDI 2002)
- Type-safe C derivative with safe manual memory management
- Region-based memory management with static typing discipline
- Support for region subtyping
- Integration with stack allocation and optional GC
- Type-and-effect system or linear types guarantee pointers to deallocated regions are never followed

**Key features**:
- Pattern matching, algebraic datatypes, exceptions
- Unique pointers, reference counted objects, dynamic regions
- Safe from buffer overflows, format string attacks, use-after-free, etc.

**Connection to Rust**: Cyclone's region-based memory management and linearity influenced Rust's design. Rust brings region-based memory management and linearity/uniqueness together in a coherent model. Cyclone is no longer supported - many ideas migrated to Rust.

### 8.3 Vault (2002)

**"Adoption and Focus: Practical Linear Types for Imperative Programming"** by Fahndrich and DeLine (PLDI 2002)

**Problem**: Linear types force hard division between linear and nonlinear types, imposing aliasing restrictions on anything that transitively points to linear objects.

**Solution**: Two constructs:
- **Adoption**: Safely allows aliasing objects with protocols being checked
- **Focus**: Allows aliasing data structures that point to linear objects, with safe access

**Impact**: Demonstrated that linear types could work in imperative programming with appropriate flexibility mechanisms. Influenced later work on making linearity more ergonomic.

### 8.4 Separation Logic and Iris

**Separation Logic** (O'Hearn, Reynolds, Yang, ~2000)
- Resource logic where propositions denote facts AND ownership
- Separating conjunction (∗): resources are disjoint
- Frame rule: local reasoning about state
- Concurrent Separation Logic (Brookes 2004): ownership transferred between threads

**Iris** (Concurrent Separation Logic framework)
- Higher-order concurrent separation logic
- Resource algebras for user-defined resources
- Implemented in Coq proof assistant
- Modular foundation for reasoning about concurrent programs
- Received 2023 Alonzo Church Award

**Connection to linear logic**: Separation logic is inspired by linear logic's resource interpretation. The separating conjunction has similar properties to linear logic's multiplicative conjunction.

---

## 9. Complexity and Implicit Computational Complexity

### 9.1 Hofmann's LFPL

**Linear Functional Programming Language (LFPL)** by Martin Hofmann uses a novel "payment" system:
- Special type called "diamonds" tracks iteration
- Construction of data must be "paid for" with diamonds
- Iterability is saved during construction, released during iteration
- All valid programs run in polynomial time
- Complete for polynomial-time functions

**Key insight**: By controlling iteration through resource types, computational complexity can be bounded.

### 9.2 Leivant's Ramified Recurrence

**Daniel Leivant's work** on ramified recurrence characterizes complexity classes:

**"Ramified Recurrence and Computational Complexity I"**: Word recurrence and poly-time
- Recurrence ramified into tiers
- Functions over word algebras are exactly those computable in polynomial time

**"Ramified Recurrence and Computational Complexity II"**: Substitution and poly-space
- Ramified recurrence with parameter substitution characterizes PSPACE
- Parameter substitution allows space reuse

**"Ramified Recurrence and Computational Complexity III"**: Higher type recurrence
- Extension to higher types
- Characterizes elementary complexity

**Application**: Predicative analysis of recursion schemas provides a method to characterize complexity classes purely through type restrictions.

### 9.3 Light Linear Logic

**Light Linear Logic (LLL)**: A restriction of linear logic that characterizes polynomial time
- Stratification controls recursive calls
- Weak exponential connectives (§, !) control duplication
- All provable functions are polynomial-time computable

**LPL (Light linear Programming Language)**: Typed functional language based on LLL
- All valid programs run in polynomial time
- Complete for polynomial-time functions
- Higher-order with algebraic data types
- Natural programming style

**Connection to bounded linear logic**: Both LLL and BLL characterize polynomial time through different restrictions on linear logic.

---

## 10. Recent Developments (2024-2025)

### 10.1 Effect Systems

**ICFP 2024**: "Abstracting Effect Systems for Algebraic Effect Handlers"
- Effect algebras abstract representation of effect collections
- Safety conditions ensure type-and-effect safety
- Unifies different effect system designs

**OOPSLA 2024**: "Effects and Coeffects in Call-by-Push-Value"
- Combines effects and coeffects in unified framework

**POPL 2025**: "Affect: An Affine Type and Effect System"
- Van Rooij and Krebbers
- Combines affine types with effect tracking

### 10.2 Graded Modal Types

Continuing development in graded modal types for resource analysis:
- Bao et al. (2025): Reachability types with logical relations
- Kellison et al. (2025): Backward error analysis language
- Tang et al. (2025): Modal effect types
- Colledan & Dal Lago (2025): Type-based resource estimation for quantum circuits

### 10.3 Hardware Capabilities

**CHERI (Capability Hardware Enhanced RISC Instructions)**:
- ISA extension for fine-grained memory protection
- Unforgeable capability pointers in hardware
- Tag bit ensures capability validity
- Provenance validity and capability monotonicity
- Implementations for MIPS, ARM, RISC-V, x86
- CHERIoT: Low-overhead version for embedded systems (~3% area overhead)

**CHERIvoke**: Pointer revocation for temporal safety
- Uses CHERI capabilities for temporal memory safety
- Efficient identification and invalidation of pointers
- Heap temporal safety for C/C++

**Application to delegation risk budgets**: Hardware-enforced capabilities provide unforgeable foundation for trust token systems.

---

## 11. Synthesis: Path to Delegation Risk Budget Type Systems

### 11.1 Key Insights from Literature

1. **Linear logic provides mathematical foundation** for "use exactly once" resources (Girard 1987)

2. **Type systems can enforce linearity** statically with acceptable ergonomics (Rust, Linear Haskell, Idris 2)

3. **Bounded variants provide complexity bounds** - BLL, QBAL, LFPL prove polynomial-time guarantees possible (Girard/Scedrov/Scott 1992, Hofmann, Dal Lago)

4. **Capabilities provide unforgeable authority** that can be attenuated and revoked (Dennis & Van Horn 1966, Miller 2006)

5. **Linear types + capabilities = powerful combination** for authority control (Austral, CAPSTONE, Wyvern)

6. **Graded modal types track quantities** beyond simple linearity (QTT, graded modalities, coeffects)

7. **Hybrid static/dynamic verification** balances guarantees with flexibility (session types, Granule)

8. **Separation logic provides resource semantics** for concurrent access (Iris, fractional permissions)

### 11.2 Recommended Architecture for Delegation Risk Budgets

**Layer 1: Linear/Affine Types**
- Risk budgets as affine types (can drop, can't duplicate)
- Critical budgets as linear types (must use)
- Compiler enforces single-use constraint

**Layer 2: Graded Modalities**
- Trust levels as grades on types
- Monotonicity enforced: can't increase grade without evidence
- Quantitative tracking of trust amounts

**Layer 3: Capabilities**
- Operations require capabilities derived from budgets
- Capabilities are linear types (unforgeable, non-duplicable)
- Hierarchical attenuation for sub-components

**Layer 4: Effects and Coeffects**
- Effect system tracks risky operations
- Coeffects track required trust/budget
- Handlers bound total risk

**Layer 5: Dependent Types (optional)**
- Refinement types for precise bounds
- Proofs of budget sufficiency
- SMT solver for verification

**Layer 6: Runtime Enforcement**
- Dynamic checks for complex conditions
- Monitoring and revocation
- Adaptive trust adjustment

### 11.3 Implementation Roadmap

**Phase 1: Prototype (6-12 months)**
- Embedded DSL in typed language (Rust or Idris)
- Affine types for budgets
- Simple capability model
- Runtime enforcement with dynamic checks

**Phase 2: Static Verification (12-18 months)**
- Strengthen to compile-time verification
- Add graded modalities for trust levels
- Implement type inference
- Develop proof-of-concept applications

**Phase 3: Refinement (18-24 months)**
- Add dependent type refinements
- Integrate SMT solving for complex properties
- Optimize for performance
- Develop tooling and IDE support

**Phase 4: Production (24+ months)**
- Extract standalone language if needed
- Comprehensive standard library
- Documentation and tutorials
- Real-world deployment in AI safety contexts

### 11.4 Open Research Questions

1. **Compositionality**: How to compose delegation risk budgets across system boundaries?

2. **Adaptivity**: How to adjust budgets based on observed behavior while maintaining type safety?

3. **Uncertainty**: How to represent and track uncertainty in trust calculations?

4. **Revocation**: What are the right semantics for capability revocation in presence of caching/memoization?

5. **Ergonomics**: How to make the system usable for practitioners without deep type theory background?

6. **Verification**: What properties can be proven about delegation risk budget systems? Can we prove "no delegation risk budget overrun"?

7. **Performance**: What is the runtime overhead of enforcement mechanisms?

8. **Integration**: How to integrate with existing AI frameworks (PyTorch, TensorFlow, etc.)?

---

## 12. Conclusion

The convergence of linear logic, type systems, and capability-based security provides a strong theoretical and practical foundation for implementing trust and risk budgets in AI safety systems. The literature demonstrates:

- **Feasibility**: Linear types work in practice (Rust, Haskell, Idris)
- **Safety**: Type systems can enforce complex resource constraints (BLL, LFPL, QBAL)
- **Security**: Capabilities provide unforgeable authority (CHERI, Austral, Wyvern)
- **Expressiveness**: Graded modalities and QTT handle quantitative reasoning
- **Performance**: Systems can be efficient (Rust, Pony, CHERIoT)

For AI safety, this suggests a path forward:
1. Model trust/risk budgets as linear types
2. Use capabilities for authority control
3. Track trust provenance with graded modalities
4. Combine static and dynamic enforcement
5. Build on existing language foundations (Rust/Idris/etc.)

The rich academic literature provides both theoretical foundations (linear logic, BLL, QTT) and practical implementations (Rust, Pony, Austral) that can be adapted for AI safety contexts. While significant engineering work remains, the core concepts are well-understood and proven viable.

---

## References and Key Papers

### Linear Logic Foundations
- **Girard, J.-Y. (1987)**. "Linear Logic". *Theoretical Computer Science* 50(1): 1–101. [DOI](https://doi.org/10.1016/0304-3975(87)90045-4)
- [Stanford Encyclopedia: Linear Logic](https://plato.stanford.edu/entries/logic-linear/)
- [Stanford Encyclopedia: Substructural Logics](https://plato.stanford.edu/entries/logic-substructural/)

### Bounded Linear Logic
- **Girard, J.-Y., Scedrov, A., & Scott, P. (1992)**. "Bounded Linear Logic: A Modular Approach to Polynomial-Time Computability". *Theoretical Computer Science* 97(1): 1–66.
- **Ghica, D. R., & Smith, A. I. (2014)**. "Bounded Linear Types in a Resource Semiring". *ESOP 2014*, LNCS 8410, pp. 331-350. [PDF](https://pure-oai.bham.ac.uk/ws/portalfiles/portal/23697858/esop14.pdf)
- **Dal Lago, U., & Hofmann, M. (2009)**. "Bounded Linear Logic, Revisited". *Logical Methods in Computer Science*. [Link](https://lmcs.episciences.org/1064)

### Linear Types in Programming
- **Atkey, R. (2018)**. "Syntax and Semantics of Quantitative Type Theory". *LICS 2018*. [Link](https://bentnib.org/quantitative-type-theory.html)
- **Brady, E. (2021)**. "Idris 2: Quantitative Type Theory in Practice". *ECOOP 2021*. [PDF](https://drops.dagstuhl.de/storage/00lipics/lipics-vol194-ecoop2021/LIPIcs.ECOOP.2021.9/LIPIcs.ECOOP.2021.9.pdf)
- **Bernardy, J.-P., et al. (2018)**. "Linear Haskell: Practical Linearity in a Higher-Order Polymorphic Language". *POPL 2018*.

### Session Types
- [Session Types Tutorial (POPL 2014)](https://www.doc.ic.ac.uk/~rhu/popl14tutorial.pdf)
- [Session Type Implementations - Simon Fowler](https://simonjf.com/2016/05/28/session-type-implementations.html)

### Object Capabilities
- **Dennis, J. B., & Van Horn, E. C. (1966)**. "Programming Semantics for Multiprogrammed Computations". *Communications of the ACM* 9(3). [PDF](https://www.princeton.edu/~rblee/ELE572Papers/Fall04Readings/ProgramSemantics_DennisvanHorn.pdf)
- **Miller, M. S. (2006)**. "Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control". PhD thesis, Johns Hopkins University.
- **Miller, M. S., Yee, K.-P., & Shapiro, J. (2003)**. "Capability Myths Demolished".

### Historical Work
- **Baker, H. G. (1992)**. "Lively Linear Lisp: 'Look Ma, No Garbage!'". *ACM SIGPLAN Notices* 27(8). [PDF](https://www.cs.utexas.edu/~hunt/research/hash-cons/hash-cons-papers/BakerLinearLisp.pdf)
- **Baker, H. G. (1995)**. "'Use-Once' Variables and Linear Objects". *ACM SIGPLAN Notices* 30(1): 45-52. [Link](https://dl.acm.org/doi/10.1145/199818.199860)
- **Grossman, D., & Morrisett, G. (2002)**. "Region-Based Memory Management in Cyclone". *PLDI 2002*. [PDF](https://www.cs.umd.edu/projects/cyclone/papers/cyclone-regions.pdf)
- **Fahndrich, M., & DeLine, R. (2002)**. "Adoption and Focus: Practical Linear Types for Imperative Programming". *PLDI 2002*. [Link](https://www.microsoft.com/en-us/research/publication/adoption-and-focus-practical-linear-types-for-imperative-programming/)

### Separation Logic and Iris
- **Jung, R., et al. (2018)**. "Iris from the Ground Up". *Journal of Functional Programming*. [PDF](https://people.mpi-sws.org/~dreyer/papers/iris-ground-up/paper.pdf)
- **Brookes, S. (2004)**. "A Semantics for Concurrent Separation Logic". *CONCUR 2004*.

### Graded Modal Types
- **Orchard, D., Liepelt, V. B., & Eades III, H. (2019)**. "Quantitative Program Reasoning with Graded Modal Types". *ICFP 2019*. [Link](https://dl.acm.org/doi/10.1145/3341714)
- **Moon, Z., Eades III, H., & Orchard, D. (2021)**. "Graded Modal Dependent Type Theory". *ESOP 2021*. [Link](https://link.springer.com/chapter/10.1007/978-3-030-72019-3_17)
- **Gaboardi, M., et al. (2016)**. "Combining Effects and Coeffects via Grading". *ICFP 2016*. [Link](https://dl.acm.org/doi/10.1145/2951913.2951939)

### Complexity Theory
- **Leivant, D.**. "Ramified Recurrence and Computational Complexity" series (I-IV). Various venues 1993-2000.
- **Hofmann, M.**. Linear types and polynomial time computation. Various papers 1999-2003.
- **Baillot, P., Gaboardi, M., & Mogbil, V. (2010)**. "A PolyTime Functional Language from Light Linear Logic". *ESOP 2010*.

### Recent Work (2024-2025)
- **RaRust** (2025). "Automatic Linear Resource Bound Analysis for Rust via Prophecy Potentials". [arXiv](https://arxiv.org/abs/2502.19810)
- **Van Rooij, O., & Krebbers, R. (2025)**. "Affect: An Affine Type and Effect System". *POPL 2025*.
- Various ICFP 2024, OOPSLA 2024, POPL 2025 papers on effects, coeffects, and graded types.

### Hardware Capabilities
- [CHERI FAQ](https://www.cl.cam.ac.uk/research/security/ctsrd/cheri/cheri-faq.html)
- **Xia, H., et al. (2019)**. "CHERIvoke: Characterising Pointer Revocation using CHERI Capabilities for Temporal Memory Safety". *MICRO 2019*.

### Languages with Linear Types and/or Capabilities
- **Rust**: [https://www.rust-lang.org/](https://www.rust-lang.org/)
- **Austral**: [https://austral-lang.org/](https://austral-lang.org/)
- **Pony**: [https://www.ponylang.io/](https://www.ponylang.io/)
- **Idris 2**: [https://www.idris-lang.org/](https://www.idris-lang.org/)
- **Wyvern**: [https://wyvernlang.github.io/](https://wyvernlang.github.io/)
- **Granule**: [https://granule-project.github.io/](https://granule-project.github.io/)
- **Cadence**: [https://cadence-lang.org/](https://cadence-lang.org/)

---

*This research survey compiled from academic literature, 2025-12-13*
