---
title: "Protocol Catalog"
sidebar:
  order: 8
---

# Protocol Catalog

:::note[Reference Document]
This catalog documents all approved containment protocols as of Year 10. Exposure multipliers are calibrated based on empirical incident data and anomaly advisory input. Multipliers compound multiplicatively for independent protocols.
:::

---

## How to Read This Catalog

Each protocol has:
- **Name**: Standard identifier
- **Category**: Type of containment
- **Exposure Multiplier**: Factor applied to base exposure (lower = safer)
- **Requirements**: What's needed to implement
- **Verification**: How we confirm compliance
- **Notes**: Important considerations

**Example calculation:**
```
Base exposure: $100
Protocol A (×0.6) + Protocol B (×0.7) + Protocol C (×0.8)
Final exposure: $100 × 0.6 × 0.7 × 0.8 = $33.60
```

---

## Category 1: Physical Containment

Protocols that limit what an anomaly can physically access or remove.

### P-001: Standard Isolation Cell

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.40 |
| **Requirements** | Faraday cage, air gap, physical barriers |
| **Verification** | RF monitoring, physical inspection |
| **Notes** | Baseline for all marketplace tasks |

### P-002: Full-Body Scan (Entry/Exit)

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Scanning equipment, trained operators |
| **Verification** | Scan records, tamper detection |
| **Notes** | Detects physical item removal |

### P-003: Sealed Manipulation Mitts

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Custom restraints, task-specific apertures |
| **Verification** | Physical inspection, seal integrity |
| **Notes** | Limits fine manipulation; not suitable for all tasks |

### P-004: Blindfolded Operation

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.60 |
| **Requirements** | Visual blocking, guided navigation |
| **Verification** | Handler attestation |
| **Notes** | Prevents facility mapping; requires capable handler |

### P-005: Time-Limited Access

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.90 - 0.70 |
| **Requirements** | Automatic extraction system |
| **Verification** | Timestamp logging |
| **Notes** | Multiplier varies by time limit (90 sec = 0.70, 10 min = 0.90) |

---

## Category 2: Information Containment

Protocols that limit what an anomaly can learn or retain.

### I-001: Anonymized Data Input

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.70 |
| **Requirements** | Data preprocessing pipeline |
| **Verification** | Automated anonymization audit |
| **Notes** | Removes identifying information; may reduce task effectiveness |

### I-002: Post-Session Memory Wipe

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Memory intervention capability |
| **Verification** | Pre/post cognitive testing |
| **Notes** | Standard for marketplace tasks |

### I-003: Frequent Memory Wipe (Intra-Session)

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.60 - 0.40 |
| **Requirements** | Rapid intervention capability |
| **Verification** | Continuous monitoring |
| **Notes** | 5-min intervals = ×0.60; 2-min intervals = ×0.40 |

### I-004: Blind Input Mode

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.70 |
| **Requirements** | Visual cortex blocking, numerical-only interface |
| **Verification** | Neurological monitoring |
| **Notes** | Anomaly processes data without visual observation |

### I-005: Decoy Environment

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.50 |
| **Requirements** | Replica construction, decoy documents |
| **Verification** | Environmental audit |
| **Notes** | Anomaly never sees real information; expensive to maintain |

### I-006: Temporal Fragmentation

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.55 |
| **Requirements** | Task decomposition system, memory wipe between fragments |
| **Verification** | Fragment isolation testing |
| **Notes** | Anomaly sees only fragments; reassembly done by humans/systems |

### I-007: Randomized Task Batching

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.80 |
| **Requirements** | Clearinghouse batching algorithm |
| **Verification** | Statistical analysis of task assignment |
| **Notes** | Prevents correlation across tasks from same principal |

### I-008: Context Stripping

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Task rewriting, metadata removal |
| **Verification** | Human review of stripped tasks |
| **Notes** | Anomaly sees task without why/who context |

---

## Category 3: Cognitive Load

Protocols that consume anomaly processing capacity.

### C-001: Level 1 Cognitive Load

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Basic arithmetic verification |
| **Verification** | Answer checking |
| **Notes** | Minimal load; mostly symbolic |

### C-002: Level 2 Cognitive Load

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.65 |
| **Requirements** | Continuous optimization problems |
| **Verification** | Solution verification |
| **Notes** | Significant load; noticeable impact on complex tasks |

### C-003: Level 3 Cognitive Load

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.45 |
| **Requirements** | Multiple simultaneous demanding tasks |
| **Verification** | Multi-stream output verification |
| **Notes** | Maximum practical load; some capability degradation |

### C-004: Adversarial Cognitive Load

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.40 |
| **Requirements** | AI-generated adversarial problems |
| **Verification** | Continuous adaptation |
| **Notes** | Problems designed to be maximally distracting |

---

## Category 4: Financial Containment

Protocols that make defection economically irrational.

### F-001: Standard Bond

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Escrowed assets equal to 2× task value |
| **Verification** | Escrow confirmation |
| **Notes** | Basic financial stake |

### F-002: Hostile Custodian Bond

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.50 |
| **Requirements** | Bond held by documented adversary |
| **Verification** | Adversary confirmation, conflict-of-interest verification |
| **Notes** | Custodian benefits from forfeiture |

### F-003: Deferred Compensation

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.80 |
| **Requirements** | Payment schedule, forfeiture clauses |
| **Verification** | Payment records |
| **Notes** | 50%+ of compensation held for 6+ months |

### F-004: Reputational Stake

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.70 |
| **Requirements** | Track record weighting in future bids |
| **Verification** | Marketplace bid analysis |
| **Notes** | Future earnings depend on current behavior |

### F-005: Dead Man's Switch

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.60 |
| **Requirements** | Information escrow, trigger conditions |
| **Verification** | Escrow integrity testing |
| **Notes** | Defection triggers release of damaging information |

---

## Category 5: Social/Structural Containment

Protocols that prevent coordination and exploit competitive dynamics.

### S-001: Handler Rotation

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Handler pool, rotation schedule |
| **Verification** | Assignment logs |
| **Notes** | Prevents relationship building |

### S-002: Compartmentalized Handlers

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Handlers don't know each other, no shared information |
| **Verification** | Communication monitoring |
| **Notes** | Anomaly can't build aggregate model of handling |

### S-003: Adversarial Monitoring (Competitor)

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.70 |
| **Requirements** | Industry competitor with access to logs |
| **Verification** | Competitor confirmation |
| **Notes** | Monitor benefits from finding problems |

### S-004: Adversarial Monitoring (Rival Anomaly)

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.65 |
| **Requirements** | Documented rival with monitoring access |
| **Verification** | Rivalry confirmation, monitor reports |
| **Notes** | Anomalies watching anomalies |

### S-005: Decoy Missions

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.80 - 0.50 |
| **Requirements** | Decoy generation system |
| **Verification** | Decoy/real ratio logging |
| **Notes** | 50% decoys = ×0.80; 90% decoys = ×0.50 |

### S-006: Random Timing

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Unpredictable task scheduling |
| **Verification** | Timing analysis |
| **Notes** | Prevents pre-coordination |

### S-007: Communication Blackout

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.60 |
| **Requirements** | No unapproved communication channels |
| **Verification** | RF monitoring, output analysis |
| **Notes** | Blocks direct anomaly-to-anomaly communication |

---

## Category 6: Output Containment

Protocols that limit what an anomaly can produce or transmit.

### O-001: Standard Output Format

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.90 |
| **Requirements** | Predefined output schema |
| **Verification** | Schema validation |
| **Notes** | Prevents executable code, limits steganography |

### O-002: Numerical-Only Output

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.80 |
| **Requirements** | No text, no formatting |
| **Verification** | Output type checking |
| **Notes** | Minimal information channel |

### O-003: Verified Output Pipeline

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Deterministic verification of output correctness |
| **Verification** | Verification system audit |
| **Notes** | Outputs can't pass without correctness check |

### O-004: Adversarial Output Review

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.65 |
| **Requirements** | Second anomaly reviews output for hidden content |
| **Verification** | Reviewer independence verification |
| **Notes** | Anomaly-level analysis of steganography risk |

### O-005: Output Size Limit

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.95 - 0.80 |
| **Requirements** | Hard cap on output bytes |
| **Verification** | Size monitoring |
| **Notes** | Limits information exfiltration; varies by limit strictness |

---

## Category 7: Transparency Protocols

Protocols where the anomaly accepts enhanced observation.

### T-001: Full Session Recording

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.80 |
| **Requirements** | Complete activity logging |
| **Verification** | Log integrity verification |
| **Notes** | Creates evidence trail |

### T-002: Real-Time Neural Monitoring

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.70 |
| **Requirements** | Neural activity sensors, baseline calibration |
| **Verification** | Continuous anomaly detection |
| **Notes** | Flags unusual cognitive patterns |

### T-003: Third-Party Escrow Recording

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.75 |
| **Requirements** | Independent escrow service |
| **Verification** | Escrow integrity audit |
| **Notes** | Anomaly can't delete evidence |

### T-004: Predictive Exposure Reporting

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.85 |
| **Requirements** | Anomaly self-reports expected risk in advance |
| **Verification** | Report vs. outcome comparison |
| **Notes** | Anomaly predicts own behavior; discrepancies flagged |

### T-005: Adversarial Self-Monitoring

| Attribute | Value |
|-----------|-------|
| **Multiplier** | ×0.60 |
| **Requirements** | Anomaly runs internal adversarial process |
| **Verification** | Self-report analysis |
| **Notes** | Omega-class protocol; unverifiable but effective |

---

## Protocol Combinations

Some protocol combinations have synergistic effects:

### Combo-001: "The Vault"
**Protocols**: P-001 + I-002 + C-003 + O-002
**Combined Multiplier**: ×0.12
**Use Case**: Maximum security numerical tasks

### Combo-002: "The Fragment"
**Protocols**: I-003 (2-min) + I-006 + C-002
**Combined Multiplier**: ×0.14
**Use Case**: Complex tasks requiring high capability with minimal information retention

### Combo-003: "The Adversarial"
**Protocols**: S-004 + F-002 + O-004
**Combined Multiplier**: ×0.21
**Use Case**: Tasks where competitive dynamics are available

### Combo-004: "The Transparent"
**Protocols**: T-001 + T-002 + T-003 + T-004
**Combined Multiplier**: ×0.36
**Use Case**: High-capability anomalies offering enhanced monitoring

### Combo-005: "Omega Standard"
**Protocols**: C-004 + T-005 + I-003 + S-004
**Combined Multiplier**: ×0.07
**Use Case**: Omega-class anomalies; maximum containment

---

## Track Record Modifiers

Applied after protocol multipliers:

| Track Record | Modifier | Criteria |
|--------------|----------|----------|
| Exceptional | ×0.70 | 1000+ tasks, 0 incidents |
| Excellent | ×0.80 | 500+ tasks, ≤1 incident |
| Good | ×0.90 | 200+ tasks, ≤2 incidents |
| Standard | ×1.00 | 50+ tasks, incident rate ≤1% |
| Probationary | ×1.25 | <50 tasks |
| New | ×2.00 | No track record |
| Elevated | ×1.50 | Recent incident |
| Restricted | ×3.00 | Multiple incidents, under review |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Year 1 | Initial catalog |
| 2.0 | Year 3 | Added cognitive load protocols |
| 3.0 | Year 5 | Added adversarial monitoring |
| 4.0 | Year 7 | Added temporal fragmentation, track record modifiers |
| 5.0 | Year 9 | Added Omega-class protocols |
| 5.1 | Year 10 | Current version; recalibrated multipliers |

---

## Further Reading

- [Insurance Bot Specification](./insurance-bot-spec/) — How protocols are applied in pricing
- [Five Years Later](./five-years-later/) — Protocol development history
- [Containing Mr. X](./containing-mr-x/) — Original protocol design case study
