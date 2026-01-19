---
title: "Insurance Bot Specification"
sidebar:
  order: 9
---

# Insurance Bot Specification

:::note[Technical Reference]
This document specifies the Insurance Bot system that provides real-time exposure quantification for the anomaly marketplace. Version 5.1, Year 10.
:::

---

## Overview

The Insurance Bot is a deterministic pricing engine that evaluates anomaly task bids and calculates exposure scores in real-time. It is the core infrastructure enabling the dynamic bidding system.

### Design Principles

1. **Deterministic**: Same inputs always produce same outputs
2. **Auditable**: All calculations can be verified independently
3. **Fast**: Bid evaluation in <100ms
4. **Conservative**: When uncertain, assume higher risk
5. **Updatable**: Protocol values can be adjusted without system rebuild

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INSURANCE BOT v5.1                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Task Input   │───▶│ Base Exposure│───▶│ Protocol     │  │
│  │ Parser       │    │ Calculator   │    │ Multiplier   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Task Type    │    │ Harm Mode    │    │ Protocol     │  │
│  │ Database     │    │ Database     │    │ Database     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                              │
│                             ▼                              │
│                    ┌──────────────┐                        │
│                    │ Track Record │                        │
│                    │ Modifier     │                        │
│                    └──────────────┘                        │
│                             │                              │
│                             ▼                              │
│                    ┌──────────────┐                        │
│                    │ Final Score  │                        │
│                    │ & Risk-Adj   │                        │
│                    └──────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Input Specification

### Task Input

```json
{
  "task_id": "string",
  "task_type": "enum",
  "complexity_level": "integer (1-12)",
  "data_sensitivity": "enum",
  "deadline_minutes": "integer",
  "max_budget": "decimal",
  "exposure_ceiling": "decimal",
  "principal_risk_premium": "decimal (default: 1.0)"
}
```

### Bid Input

```json
{
  "bid_id": "string",
  "anomaly_id": "string",
  "price": "decimal",
  "protocols": ["string"],
  "capability_claim": "string",
  "custom_protocols": [
    {
      "description": "string",
      "claimed_multiplier": "decimal"
    }
  ]
}
```

---

## Calculation Pipeline

### Stage 1: Base Exposure Calculation

The base exposure is determined by task characteristics before any protocols are applied.

```
BaseExposure = TaskTypeBase
               × ComplexityMultiplier
               × DataSensitivityMultiplier
               × DurationMultiplier
```

**Task Type Base Values:**

| Task Type | Base ($) | Rationale |
|-----------|----------|-----------|
| Numerical optimization | 15 | Low information content |
| Data analysis | 35 | Moderate information exposure |
| Pattern recognition | 45 | Learns patterns from data |
| Text generation | 80 | High expressiveness |
| Code generation | 120 | Executable output risk |
| Strategic analysis | 200 | Requires holistic view |
| Novel research | 350 | Unpredictable scope |

**Complexity Multiplier:**

| Level | Multiplier | Description |
|-------|------------|-------------|
| 1-3 | ×0.5 | Simple, well-defined |
| 4-6 | ×1.0 | Moderate complexity |
| 7-9 | ×2.0 | High complexity |
| 10-12 | ×4.0 | Extreme complexity |

**Data Sensitivity Multiplier:**

| Sensitivity | Multiplier |
|-------------|------------|
| Public | ×0.3 |
| Internal | ×1.0 |
| Confidential | ×2.5 |
| Secret | ×5.0 |
| Critical | ×10.0 |

**Duration Multiplier:**

| Duration | Multiplier |
|----------|------------|
| <15 min | ×0.7 |
| 15-60 min | ×1.0 |
| 1-4 hours | ×1.3 |
| 4-24 hours | ×1.8 |
| >24 hours | ×2.5 |

---

### Stage 2: Protocol Application

Protocols reduce base exposure multiplicatively:

```
ProtocolExposure = BaseExposure × Π(protocol_multipliers)
```

Protocol multipliers are retrieved from the Protocol Database. See [Protocol Catalog](./protocol-catalog/) for complete values.

**Example:**
```
BaseExposure = $45 (data analysis, level 5, internal, 30 min)

Protocols:
  - P-001 (Standard Isolation): ×0.40
  - I-002 (Post-Session Memory Wipe): ×0.85
  - C-002 (Level 2 Cognitive Load): ×0.65

ProtocolExposure = $45 × 0.40 × 0.85 × 0.65 = $9.95
```

---

### Stage 3: Track Record Modifier

The anomaly's history adjusts the protocol exposure:

```
ModifiedExposure = ProtocolExposure × TrackRecordModifier
```

**Track Record Calculation:**

```
IncidentRate = TotalIncidents / TotalTasks
RecencyWeight = WeightedIncidents / TotalIncidents  // Recent = higher weight

BaseModifier =
  if TotalTasks < 50: 2.0
  elif IncidentRate == 0 and TotalTasks > 1000: 0.70
  elif IncidentRate == 0 and TotalTasks > 500: 0.80
  elif IncidentRate < 0.001: 0.90
  elif IncidentRate < 0.01: 1.00
  elif IncidentRate < 0.03: 1.25
  elif IncidentRate < 0.10: 1.50
  else: 3.00

FinalModifier = BaseModifier × (1 + RecencyWeight × 0.5)
```

---

### Stage 4: Final Score Calculation

```
ExposureScore = ModifiedExposure
RiskAdjustedCost = Price + (ExposureScore × PrincipalRiskPremium)
```

**Output:**

```json
{
  "bid_id": "string",
  "exposure_score": "decimal",
  "risk_adjusted_cost": "decimal",
  "breakdown": {
    "base_exposure": "decimal",
    "protocol_multiplier": "decimal",
    "track_record_modifier": "decimal"
  },
  "warnings": ["string"],
  "eligible": "boolean",
  "ineligible_reason": "string | null"
}
```

---

## Eligibility Rules

A bid is **ineligible** if:

1. `ExposureScore > task.exposure_ceiling`
2. `Price > task.max_budget`
3. Anomaly is suspended or banned
4. Required protocols not included
5. Custom protocols not pre-approved
6. Anomaly track record is "Restricted"

---

## Custom Protocol Handling

Anomalies can propose custom protocols not in the database:

```
CustomProtocolProcess:
  1. Anomaly submits protocol description + claimed multiplier
  2. Insurance Bot flags for human review
  3. Human reviewer + adversarial anomaly evaluate
  4. If approved: added to database with conservative multiplier
  5. If rejected: bid rejected or resubmitted without custom
```

**Conservative Adjustment:**
```
AppliedMultiplier = max(claimed_multiplier × 1.5, 0.90)
```

Custom protocols always receive a more conservative multiplier than claimed until validated by incident data.

---

## Database Schemas

### Task Type Database

```sql
CREATE TABLE task_types (
  type_id VARCHAR PRIMARY KEY,
  base_exposure DECIMAL NOT NULL,
  description TEXT,
  last_updated TIMESTAMP,
  update_reason TEXT
);
```

### Protocol Database

```sql
CREATE TABLE protocols (
  protocol_id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  multiplier DECIMAL NOT NULL,
  requirements TEXT,
  verification_method TEXT,
  incident_count INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  last_calibrated TIMESTAMP,
  calibration_notes TEXT
);
```

### Track Record Database

```sql
CREATE TABLE anomaly_records (
  anomaly_id VARCHAR PRIMARY KEY,
  total_tasks INTEGER DEFAULT 0,
  total_incidents INTEGER DEFAULT 0,
  weighted_incidents DECIMAL DEFAULT 0,
  last_incident_date TIMESTAMP,
  modifier DECIMAL DEFAULT 2.0,
  status VARCHAR DEFAULT 'new',
  notes TEXT
);
```

### Harm Mode Database

```sql
CREATE TABLE harm_modes (
  mode_id VARCHAR PRIMARY KEY,
  description TEXT,
  base_probability DECIMAL,
  base_damage DECIMAL,
  task_type_adjustments JSONB,
  protocol_mitigations JSONB
);
```

---

## Calibration Process

Protocol multipliers are recalibrated quarterly:

```
CalibrationProcess:
  1. Collect all task outcomes for quarter
  2. For each protocol:
     a. Calculate observed incident rate with protocol
     b. Calculate expected incident rate from multiplier
     c. If |observed - expected| > threshold:
        - Flag for review
        - Propose multiplier adjustment
  3. Human committee reviews flagged protocols
  4. Anomaly advisory board provides input
  5. Updated multipliers approved by governance
  6. Database updated; all bids recalculated
```

**Adjustment Bounds:**
- Maximum single-quarter adjustment: ±15%
- Minimum multiplier: 0.05 (95% reduction)
- Maximum multiplier: 0.99 (1% reduction)

---

## Failure Modes

### Mode 1: Database Unavailable

```
Behavior: Reject all bids with error "System temporarily unavailable"
Recovery: Automatic retry with exponential backoff
Alert: Immediate notification to operations team
```

### Mode 2: Calculation Overflow

```
Behavior: Return maximum exposure score (exposure_ceiling + 1)
Recovery: Manual review of inputs
Alert: Log for investigation
```

### Mode 3: Unknown Protocol

```
Behavior: Apply default multiplier ×0.95 with warning
Recovery: Flag for protocol database review
Alert: Notify protocol committee
```

### Mode 4: Inconsistent Track Record

```
Behavior: Apply maximum track record modifier (×3.0)
Recovery: Trigger track record audit
Alert: Notify compliance team
```

---

## API Specification

### Evaluate Bid

```
POST /api/v5/evaluate-bid

Request:
{
  "task": TaskInput,
  "bid": BidInput
}

Response:
{
  "evaluation": EvaluationOutput,
  "timestamp": "ISO8601",
  "bot_version": "5.1"
}
```

### Batch Evaluate

```
POST /api/v5/evaluate-batch

Request:
{
  "task": TaskInput,
  "bids": [BidInput]
}

Response:
{
  "evaluations": [EvaluationOutput],
  "summary": {
    "lowest_exposure": "string (bid_id)",
    "lowest_risk_adjusted": "string (bid_id)",
    "eligible_count": "integer"
  },
  "timestamp": "ISO8601"
}
```

### Get Protocol Info

```
GET /api/v5/protocol/{protocol_id}

Response:
{
  "protocol": ProtocolRecord,
  "usage_stats": {
    "total_applications": "integer",
    "incident_rate": "decimal"
  }
}
```

### Get Anomaly Record

```
GET /api/v5/anomaly/{anomaly_id}/record

Response:
{
  "record": AnomalyRecord,
  "recent_tasks": [TaskSummary],
  "modifier_history": [ModifierChange]
}
```

---

## Governance

### Update Authority

| Component | Update Authority | Review Required |
|-----------|-----------------|-----------------|
| Task type bases | Protocol Committee | Governance Board |
| Protocol multipliers | Protocol Committee + Anomaly Advisory | Governance Board |
| Track record formula | Governance Board | External Audit |
| Eligibility rules | Governance Board | Regulatory Review |
| API changes | Engineering | Protocol Committee |

### Audit Requirements

| Audit Type | Frequency | Auditor |
|------------|-----------|---------|
| Calculation accuracy | Monthly | Internal QA |
| Database integrity | Weekly | Automated |
| Calibration validation | Quarterly | External |
| Full system audit | Annual | Independent third party |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Year 2 | Initial release |
| 2.0 | Year 3 | Added cognitive load protocols |
| 3.0 | Year 5 | Added batch evaluation, adversarial protocols |
| 4.0 | Year 7 | Track record formula update, custom protocol handling |
| 5.0 | Year 9 | Omega-class protocol support, calibration process formalization |
| 5.1 | Year 10 | Current; recalibrated multipliers, API v5 |

---

## Further Reading

- [Protocol Catalog](./protocol-catalog/) — Complete protocol reference
- [Five Years Later](./five-years-later/) — Dynamic bidding system overview
- [Year Ten](./year-ten/) — Current system state
