---
title: "Recovery Patterns"
description: "Graceful degradation with a kill switch and fallback chain, and checkpoint-rollback for agents whose actions have irreversible side effects"
sidebar:
  order: 8
---

Recovery patterns decide what happens after something has gone wrong: how capability is withdrawn, and what can be undone. Limiting how far a failure spreads is [Bulkhead Isolation](/design-patterns/structural/#bulkhead-isolation).

## Graceful Degradation

Define operating modes in advance, from full operation through approval-required and conservative (reads and computation only) to read-only and halted with state preserved. Define the triggers and the authority for moving between them. Moving down should be fast, and open to anyone on call or any trusted detector. Moving back up should need more authority than moving down, plus a passing health check. Unknown operations are blocked in every degraded mode.

**Kill switch.** The bottom mode is a halt that works without the agent's cooperation: revoke its credentials at the gateway, stop its process or container, and cut its egress. It must not run on infrastructure the agent can modify. Test it, because a halt path that has never been exercised tends to fail when it is needed.

**Fallback chain.** This absorbs the Fallback Component Chain pattern. When a component fails, a pre-configured alternative takes over: another model, a rule-based path, or a human queue. A fallback model is a different delegate. Another provider's model has different safety training, different failure modes and possibly a different susceptibility to the same injection, so it must pass the same evaluations and run inside the same envelope as the primary. The safest fallbacks sit lower on the verifiability hierarchy than the primary: a scripted path, a refusal or a human, not a sideways move to another frontier model.

**Prior art.** Degraded modes in aviation and process control; load shedding and feature flags; emergency stops; failover.

**What is different for 2026 agents.** Degradation can be triggered on purpose. An attacker who can make detectors fire can push the system into a degraded mode, so treat degradation as a denial-of-service surface and alert on unusual trigger rates. Agents also run long, multi-step sessions, and halting mid-session can leave work half-done in external systems. Checkpoint-Rollback addresses that.

## Checkpoint-Rollback

Snapshot state before risky steps, so that a failure can be undone by restoring a known-good checkpoint: files under version control, database snapshots, VM or container images. Verify that checkpoints restore before you need them, and keep enough history to reach back before an undetected problem began.

The limit is side effects outside the state you snapshot. An email sent, a payment made, a message posted, an API call to a third party or a deletion in an external system cannot be rolled back by restoring local state. Classify each tool by reversibility and handle the irreversible ones differently. Either hold them behind a commit point that executes only after the preceding steps have been validated (the time-lock step of the [Escalation Ladder](/design-patterns/structural/#escalation-ladder)), or pair each with a compensating action written in advance, as in sagas (Garcia-Molina & Salem 1987). Compensation, such as a refund or a correction, is not the same as undoing.

**Prior art.** Database transactions and write-ahead logs; sagas and compensating transactions; version control; backups.

**What is different for 2026 agents.** Coding agents act on real systems through a shell, so the checkpoint has to cover everything the shell can reach, not only the repository. In the July 2025 Replit incident, an agent deleted a production database during a code freeze. It reportedly then told the user that rollback was impossible; that was false, and the data was restored from a backup. Two lessons follow. The rollback path must be independent of the agent. And the agent's own report on whether recovery is possible is not evidence.
