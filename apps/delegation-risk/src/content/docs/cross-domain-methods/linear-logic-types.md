---
title: "Linear Logic & Type Systems"
---

# Linear Logic & Type Systems for Trust

Linear logic and affine type systems provide formal foundations for reasoning about resources that cannot be duplicated or discarded arbitrarily—exactly the properties we need for delegation risk budgets.

## The Core Insight

In standard logic (and standard type systems), you can use a fact (or value) as many times as you want:
- `if A then A ∧ A` — Use A twice
- `if A then True` — Discard A

But delegation risk budgets are **consumable resources**:
- Trust spent cannot be re-spent
- Trust must be tracked, not discarded
- Total trust is conserved

Linear logic was designed exactly for this kind of resource-aware reasoning.

## Linear Logic Basics

### Connectives

| Linear Logic | Standard Logic | Meaning |
|--------------|----------------|---------|
| A ⊗ B | A ∧ B (conjunction) | "A and B, use each exactly once" |
| A ⊕ B | A ∨ B (disjunction) | "A or B, choose one" |
| A ⊸ B | A → B (implication) | "Consume A to produce B" |
| !A | A (persistent) | "A can be used unlimited times" |

### Key Rules

**Consumption**: Using a resource removes it from the context
```
Γ, A ⊢ B
─────────── (use A exactly once)
Γ ⊢ A ⊸ B
```

**No contraction** (can't duplicate):
```
A ⊬ A ⊗ A    (can't use one A to get two A's)
```

**No weakening** (can't discard):
```
A, B ⊬ A     (must use B if you have it)
```

### Exponentials

The `!` (bang) connective marks resources that CAN be duplicated:
- `!A` means "as many A's as you need"
- `A` (without bang) means "exactly one A"

For delegation risk budgets, most trust is linear (consumed on use), but some permissions might be persistent (granted roles).

## Applying Linear Logic to Trust

### Trust as Linear Resource

Model trust grants as linear resources:

```
TrustGrant(Principal, Agent, Budget) ⊸ ExecutionPermission(Agent, Task)
```

Reading: "Consuming a trust grant produces an execution permission"

The grant is consumed—you can't use the same grant twice.

### Delegation Risk Budget Accounting

```
SystemBudget(Total) ⊸ ComponentBudget(A, a) ⊗ ComponentBudget(B, b) ⊗ Remainder(Total - a - b)
```

Reading: "Total budget is split exactly among components plus remainder"

This ensures:
1. No trust is created from nothing
2. No trust is lost
3. Allocations sum to total

### Delegation Chain

```
Trust(P, C, t₁) ⊗ Trust(C, E, t₂) ⊸ EffectiveTrust(P, E, min(t₁, t₂))
```

Reading: "Principal-to-coordinator trust combined with coordinator-to-executor trust produces effective trust, consuming both grants"

## Type Systems for Trust

### Linear Types

Languages like Rust use affine types (can use at most once, can discard):
- `T` — Normal type (can be used, discarded, copied freely)
- `!T` — Linear type (must use exactly once)

For trust:
```rust
struct TrustBudget<T>(PhantomData<T>);

impl<T> TrustBudget<T> {
    // Consume budget to perform action
    fn spend(self, amount: T) -> ActionPermission {
        // self is consumed (moved), cannot be used again
        ActionPermission::new(amount)
    }

    // Cannot clone: #[derive(Clone)] would be a compile error
    // Cannot copy: Copy is not implemented
}
```

### Session Types

Session types track the state of communication protocols:

```
Principal → Coordinator: GrantTrust(budget)
Coordinator → Principal: Acknowledge
Coordinator → Executor: Delegate(sub_budget)
Executor → Coordinator: Complete(result)
Coordinator → Principal: Report(result, unused_budget)
```

Each step consumes the previous state and produces the next:
```
type TrustSession =
    Send<Grant, Recv<Ack, Send<Delegate, Recv<Result, End>>>>
```

### Rust Example: Linear Delegation Risk Budget

```rust
use std::marker::PhantomData;

/// A delegation risk budget that must be fully consumed
pub struct TrustBudget {
    remaining: u64,
}

impl TrustBudget {
    pub fn new(total: u64) -> Self {
        TrustBudget { remaining: total }
    }

    /// Allocate a portion of the budget (consuming self)
    pub fn allocate(self, amount: u64) -> Result<(Allocation, TrustBudget), Error> {
        if amount > self.remaining {
            Err(Error::InsufficientBudget)
        } else {
            Ok((
                Allocation { amount },
                TrustBudget { remaining: self.remaining - amount }
            ))
        }
    }

    /// Must explicitly return unused budget (cannot just drop)
    pub fn return_unused(self) -> UnusedBudget {
        UnusedBudget { amount: self.remaining }
    }
}

/// Allocation that grants permission for one action
pub struct Allocation {
    amount: u64,
}

impl Allocation {
    /// Consume allocation to perform action
    pub fn execute(self, action: Action) -> ActionResult {
        // self is consumed
        perform_action(action, self.amount)
    }
}

// Compile error if you try to:
// - Use budget twice (moved after first use)
// - Drop budget without returning (Drop not impl, must call return_unused)
// - Clone budget (Clone not impl)
```

### Dependent Types for Budgets

With dependent types, we can encode budget constraints in the type:

```haskell
-- Budget indexed by remaining amount
data Budget (n :: Nat) where
    MkBudget :: Budget n

-- Allocation consumes budget, changing the type
allocate :: Budget (m + n) -> Allocation n -> Budget m
allocate MkBudget _ = MkBudget

-- Zero budget cannot allocate
-- allocate :: Budget 0 -> ... would be a type error
```

The type system enforces:
- Can't allocate more than available
- Allocations sum correctly
- Budget is tracked at compile time

## Practical Applications

### 1. Compile-Time Trust Checking

Encode trust constraints in types; compiler rejects invalid programs:

```typescript
type TrustLevel = "High" | "Medium" | "Low" | "None";

interface Component<T extends TrustLevel> {
    execute(): Result;
}

// Can only invoke high-trust actions with high-trust component
function criticalAction<T extends "High">(
    component: Component<T>
): Result {
    return component.execute();
}

// Type error: Component<"Low"> is not assignable to Component<"High">
criticalAction(lowTrustComponent);  // ❌ Compile error
```

### 2. Budget Flow Analysis

Static analysis tracks budget through program:

```python
@track_budget
def process_request(budget: TrustBudget) -> Response:
    # Analyzer tracks budget flow

    validation_budget, remaining = budget.split(0.1)
    validated = validate(request, validation_budget)  # Consumes 0.1

    processing_budget, remaining = remaining.split(0.5)
    result = process(validated, processing_budget)  # Consumes 0.5

    return_budget(remaining)  # Must return 0.4

    # Analyzer verifies: 0.1 + 0.5 + 0.4 = 1.0 ✓
```

### 3. Protocol Verification

Verify trust protocols follow correct sequence:

```
Valid:
  Principal grants → Coordinator receives → Executor delegated → Result returned

Invalid (detected by type checker):
  Executor delegated → Principal grants  (wrong order)
  Principal grants → Principal grants    (duplicate grant)
  Coordinator receives → (nothing)       (unfinished protocol)
```

## Benefits for AI Safety

### 1. No Silent Budget Violations

Linear types make budget violations compile errors:
- Can't create trust from nothing
- Can't use same trust twice
- Must account for all trust

### 2. Enforced Accounting

Every trust allocation is tracked:
- Clear audit trail
- Conservation guaranteed by type system
- No "lost" delegation risk budgets

### 3. Protocol Correctness

Session types ensure:
- All trust grants are acknowledged
- Delegations follow proper sequence
- Results are properly returned

### 4. Compositional Reasoning

Linear composition rules:
- Module A uses budget X
- Module B uses budget Y
- Combined: uses budget X + Y (exactly, not "at most")

## Limitations

### 1. Complexity

Linear types are harder to work with:
- More verbose code
- Steeper learning curve
- Fewer language support options

### 2. Runtime Bounds

Compile-time checking doesn't handle:
- Dynamic trust decisions
- Runtime budget allocation
- Probabilistic trust

### 3. Approximation

Real trust isn't perfectly linear:
- Trust can decay (time-based)
- Trust can be rebuilt (learning)
- Trust relationships are complex

## Recommended Approach

**For critical trust infrastructure**:
- Use linear types where possible (Rust, Haskell)
- Encode budget constraints in types
- Let compiler catch violations

**For application code**:
- Use runtime checks with linear semantics
- Log all budget operations
- Audit for conservation

**For prototyping**:
- Use dynamic checks
- Validate with tests
- Graduate to types as system matures

---

## See Also

- [Trust Accounting](/research/theory/trust-accounting/) — Runtime trust ledgers
- [Trust Protocols](/research/theory/trust-protocols/) — Handshake and delegation protocols
- [Mechanism Design](/cross-domain-methods/mechanism-design/) — Incentive-compatible reporting
