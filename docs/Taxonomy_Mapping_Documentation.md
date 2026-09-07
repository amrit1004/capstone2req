# Taxonomy Mapping Documentation (SI & CSF)

## Medical Insights Engine - Technical Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [What are SI and CSF?](#what-are-si-and-csf)
3. [Database Schema](#database-schema)
4. [Mapping Flow](#mapping-flow)
5. [Step-by-Step Process](#step-by-step-process)
6. [Code Implementation](#code-implementation)
7. [Example Walkthrough](#example-walkthrough)
8. [Key Points](#key-points)

---

## Overview

This document explains how **Strategic Imperatives (SI)** and **Critical Success Factors (CSF)** are mapped to medical insights using LLM classification.

### Key Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   There is NO direct foreign key relationship.                  │
│                                                                  │
│   Mapping happens via LLM CLASSIFICATION:                       │
│                                                                  │
│   1. LLM reads insight text                                     │
│   2. LLM sees available SI/CSF options                          │
│   3. LLM picks the best matching SI and CSF                     │
│   4. Choices stored as TEXT in insight_tags table               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## What are SI and CSF?

### Strategic Imperatives (SI)

High-level business objectives that guide medical affairs strategy.

| SI ID | Name | Description |
|-------|------|-------------|
| SI-01 | Drive Adoption | Increase product usage and acceptance |
| SI-02 | Evidence Generation | Generate clinical and real-world evidence |
| SI-03 | Market Access | Improve payer and formulary access |
| SI-04 | Brand Differentiation | Differentiate from competitors |

### Critical Success Factors (CSF)

Specific goals under each SI, filtered by therapeutic area.

| CSF ID | Name | Parent SI | Therapeutic Area |
|--------|------|-----------|------------------|
| ONC-CSF-01 | Demonstrate efficacy | SI-01 | Oncology |
| ONC-CSF-02 | Generate RWE data | SI-02 | Oncology |
| ONC-CSF-03 | Address safety concerns | SI-01 | Oncology |
| IMM-CSF-01 | Show differentiation | SI-04 | Immunology |
| IMM-CSF-02 | Build KOL advocacy | SI-01 | Immunology |

### Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                    SI ↔ CSF RELATIONSHIP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SI (Global)                 CSF (Per Therapeutic Area)         │
│  ══════════                  ═══════════════════════════        │
│                                                                  │
│  ┌──────────────┐           ┌─────────────────────────┐         │
│  │    SI-01     │◄──────────│ ONC-CSF-01 (Oncology)   │         │
│  │Drive Adoption│◄──────────│ ONC-CSF-03 (Oncology)   │         │
│  │              │◄──────────│ IMM-CSF-02 (Immunology) │         │
│  └──────────────┘           └─────────────────────────┘         │
│                                                                  │
│  ┌──────────────┐           ┌─────────────────────────┐         │
│  │    SI-02     │◄──────────│ ONC-CSF-02 (Oncology)   │         │
│  │Evidence Gen  │◄──────────│ IMM-CSF-03 (Immunology) │         │
│  └──────────────┘           └─────────────────────────┘         │
│                                                                  │
│  Note: Each CSF belongs to ONE SI and ONE Therapeutic Area      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

```sql
-- Strategic Imperatives (Global)
CREATE TABLE taxonomy_si (
    si_id TEXT PRIMARY KEY,      -- e.g., "SI-01"
    si_name TEXT,                -- e.g., "Drive Adoption"
    si_description TEXT          -- Detailed description
);

-- Critical Success Factors (Per Therapeutic Area)
CREATE TABLE taxonomy_csf (
    csf_id TEXT PRIMARY KEY,     -- e.g., "ONC-CSF-01"
    therapeutic_area TEXT,        -- e.g., "Oncology"
    csf_name TEXT,               -- e.g., "Demonstrate efficacy"
    parent_si_id TEXT,           -- e.g., "SI-01" (links to SI)
    description TEXT,
    FOREIGN KEY (parent_si_id) REFERENCES taxonomy_si(si_id)
);

-- Where mapping is stored (NO FK to taxonomy tables)
CREATE TABLE insight_tags (
    insight_id TEXT PRIMARY KEY,
    si_id TEXT,                  -- Stored as TEXT (LLM's choice)
    csf_id TEXT,                 -- Stored as TEXT (LLM's choice)
    sentiment TEXT,
    topic TEXT,
    ...
);
```

### Why No Foreign Key from insight_tags?

```
┌─────────────────────────────────────────────────────────────────┐
│  insight_tags.si_id is TEXT, not a foreign key because:        │
│                                                                  │
│  1. LLM might return variations ("SI-01" vs "SI-1")             │
│  2. Flexibility for new SIs without schema changes              │
│  3. Allows "Unknown" or null values                             │
│  4. Simpler error handling                                      │
│                                                                  │
│  Trade-off: No referential integrity, but more flexibility      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mapping Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE SI/CSF MAPPING FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  STEP 1: Insight Input                                              ││
│  │  ═══════════════════════                                            ││
│  │                                                                      ││
│  │  Insight: "KOL expressed concerns about dosing frequency for        ││
│  │           elderly patients in the Phase 3 oncology trial"           ││
│  │                                                                      ││
│  │  Metadata from insights table:                                      ││
│  │  - insight_id: "INS-042"                                            ││
│  │  - therapeutic_area: "Oncology"   ◄── This determines CSF filter   ││
│  │  - disease_state: "Lung Cancer"                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  STEP 2: Fetch Taxonomy Options                                     ││
│  │  ══════════════════════════════                                     ││
│  │                                                                      ││
│  │  Query 1: SELECT * FROM taxonomy_si                                 ││
│  │  → Returns ALL SIs (not filtered)                                   ││
│  │                                                                      ││
│  │  Query 2: SELECT * FROM taxonomy_csf                                ││
│  │           WHERE therapeutic_area = 'Oncology'                       ││
│  │  → Returns ONLY Oncology CSFs                                       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  STEP 3: Build LLM Prompt                                           ││
│  │  ════════════════════════                                           ││
│  │                                                                      ││
│  │  Prompt includes:                                                   ││
│  │  - Insight text                                                     ││
│  │  - List of SI options with descriptions                             ││
│  │  - List of CSF options (Oncology only) with parent SI               ││
│  │  - RAG context (similar examples)                                   ││
│  │  - HITL context (past corrections)                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  STEP 4: LLM Classification                                         ││
│  │  ══════════════════════════                                         ││
│  │                                                                      ││
│  │  Azure OpenAI GPT-4 analyzes:                                       ││
│  │  - "concerns" → Negative sentiment                                  ││
│  │  - "dosing frequency" → Topic is Dosing                             ││
│  │  - "KOL" → Stakeholder type                                         ││
│  │  - Maps to SI-01 (adoption challenge)                               ││
│  │  - Maps to ONC-CSF-01 (efficacy demonstration)                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  STEP 5: Save to Database                                           ││
│  │  ════════════════════════                                           ││
│  │                                                                      ││
│  │  INSERT INTO insight_tags (insight_id, si_id, csf_id, ...)          ││
│  │  VALUES ('INS-042', 'SI-01', 'ONC-CSF-01', ...)                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Process

### Step 1: Insight Input

The insight comes with a `therapeutic_area` from the original data.

```python
# From insights table
insight = {
    "insight_id": "INS-042",
    "therapeutic_area": "Oncology",      # Key for CSF filtering
    "disease_state": "Lung Cancer",
    "description": "KOL expressed concerns about dosing frequency..."
}
```

---

### Step 2: Fetch Taxonomy Options

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 STEP 2: FETCH TAXONOMY OPTIONS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INPUT: therapeutic_area = "Oncology"                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # taxonomy_tagger.py (line ~179)                                  │ │
│  │                                                                     │ │
│  │  def get_taxonomy_for_area(therapeutic_area: str) -> tuple:        │ │
│  │                                                                     │ │
│  │      # 1. Get ALL Strategic Imperatives (not filtered)             │ │
│  │      si_df = database.get_taxonomy_si()                            │ │
│  │                                                                     │ │
│  │      # 2. Get CSFs ONLY for this therapeutic area                  │ │
│  │      csf_df = database.get_taxonomy_csf(therapeutic_area)          │ │
│  │                                                                     │ │
│  │      if csf_df.empty:                                              │ │
│  │          # Fallback: get ALL CSFs if no match                      │ │
│  │          csf_df = database.get_taxonomy_csf()                      │ │
│  │                                                                     │ │
│  │      return si_df.to_dict('records'), csf_df.to_dict('records')    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  DATABASE QUERIES:                                                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # database.py - get_taxonomy_si()                                 │ │
│  │  SELECT * FROM taxonomy_si                                         │ │
│  │                                                                     │ │
│  │  Returns ALL SIs:                                                  │ │
│  │  ┌──────┬──────────────────────┬─────────────────────────────────┐ │ │
│  │  │si_id │ si_name              │ description                     │ │ │
│  │  ├──────┼──────────────────────┼─────────────────────────────────┤ │ │
│  │  │SI-01 │ Drive Adoption       │ Increase product usage          │ │ │
│  │  │SI-02 │ Evidence Generation  │ Generate clinical evidence      │ │ │
│  │  │SI-03 │ Market Access        │ Improve payer access            │ │ │
│  │  │SI-04 │ Brand Differentiation│ Differentiate from competitors  │ │ │
│  │  └──────┴──────────────────────┴─────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # database.py - get_taxonomy_csf("Oncology")                      │ │
│  │  SELECT * FROM taxonomy_csf WHERE therapeutic_area = 'Oncology'    │ │
│  │                                                                     │ │
│  │  Returns FILTERED CSFs:                                            │ │
│  │  ┌───────────┬────────────────────────┬──────────┬────────────────┐│ │
│  │  │csf_id     │ csf_name               │parent_si │therapeutic_area││ │
│  │  ├───────────┼────────────────────────┼──────────┼────────────────┤│ │
│  │  │ONC-CSF-01 │ Demonstrate efficacy   │ SI-01    │ Oncology       ││ │
│  │  │ONC-CSF-02 │ Generate RWE data      │ SI-02    │ Oncology       ││ │
│  │  │ONC-CSF-03 │ Address safety concerns│ SI-01    │ Oncology       ││ │
│  │  └───────────┴────────────────────────┴──────────┴────────────────┘│ │
│  │                                                                     │ │
│  │  ❌ Immunology CSFs are NOT returned (different TA)                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  OUTPUT:                                                                │
│  taxonomy_si = [                                                        │
│      {"si_id": "SI-01", "si_name": "Drive Adoption", ...},             │
│      {"si_id": "SI-02", "si_name": "Evidence Generation", ...},        │
│      {"si_id": "SI-03", "si_name": "Market Access", ...},              │
│      {"si_id": "SI-04", "si_name": "Brand Differentiation", ...}       │
│  ]                                                                      │
│  taxonomy_csf = [                                                       │
│      {"csf_id": "ONC-CSF-01", "csf_name": "Demonstrate efficacy",      │
│       "parent_si_id": "SI-01", "therapeutic_area": "Oncology"},        │
│      {"csf_id": "ONC-CSF-02", "csf_name": "Generate RWE data",         │
│       "parent_si_id": "SI-02", "therapeutic_area": "Oncology"},        │
│      {"csf_id": "ONC-CSF-03", "csf_name": "Address safety concerns",   │
│       "parent_si_id": "SI-01", "therapeutic_area": "Oncology"}         │
│  ]                                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Reference:**

```python
# database.py

def get_taxonomy_si():
    """Get all Strategic Imperatives."""
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM taxonomy_si", conn)
    conn.close()
    return df

def get_taxonomy_csf(therapeutic_area=None):
    """Get Critical Success Factors, optionally filtered by area."""
    conn = get_connection()
    if therapeutic_area:
        df = pd.read_sql_query(
            "SELECT * FROM taxonomy_csf WHERE therapeutic_area = ?",
            conn, params=(therapeutic_area,)
        )
    else:
        df = pd.read_sql_query("SELECT * FROM taxonomy_csf", conn)
    conn.close()
    return df
```

---

### Step 3: Build LLM Prompt

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 STEP 3: BUILD LLM PROMPT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # llm_service.py - classify_insight() (line ~54)                  │ │
│  │                                                                     │ │
│  │  def classify_insight(insight_text, therapeutic_area,              │ │
│  │                       taxonomy_si, taxonomy_csf, rag_context=""):  │ │
│  │                                                                     │ │
│  │      # 1. Format SI options as readable list                       │ │
│  │      si_list = "\n".join([                                         │ │
│  │          f"- {t['si_id']}: {t['si_name']}"                         │ │
│  │          for t in taxonomy_si                                      │ │
│  │      ])                                                            │ │
│  │                                                                     │ │
│  │      # 2. Format CSF options with parent SI reference              │ │
│  │      csf_list = "\n".join([                                        │ │
│  │          f"- {t['csf_id']}: {t['csf_name']} (under {t['parent_si_id']})"│
│  │          for t in taxonomy_csf                                     │ │
│  │      ])                                                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  FORMATTED OPTIONS:                                                     │
│                                                                          │
│  si_list =                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  - SI-01: Drive Adoption                                          │ │
│  │  - SI-02: Evidence Generation                                     │ │
│  │  - SI-03: Market Access                                           │ │
│  │  - SI-04: Brand Differentiation                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  csf_list =                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  - ONC-CSF-01: Demonstrate efficacy (under SI-01)                 │ │
│  │  - ONC-CSF-02: Generate RWE data (under SI-02)                    │ │
│  │  - ONC-CSF-03: Address safety concerns (under SI-01)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  FULL PROMPT:                                                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  prompt = f"""                                                     │ │
│  │  You are a medical insights analysis expert. Analyze the following │ │
│  │  medical insight and extract all relevant labels.                  │ │
│  │                                                                     │ │
│  │  {rag_context}   ◄── Similar examples + past corrections          │ │
│  │                                                                     │ │
│  │  INSIGHT TEXT:                                                     │ │
│  │  "KOL expressed concerns about dosing frequency for elderly        │ │
│  │   patients in the Phase 3 oncology trial"                          │ │
│  │                                                                     │ │
│  │  THERAPEUTIC AREA: Oncology                                        │ │
│  │                                                                     │ │
│  │  ════════════════════════════════════════════════════════════════  │ │
│  │  STRATEGIC IMPERATIVES (SI) - Choose ONE:                          │ │
│  │  - SI-01: Drive Adoption                                          │ │
│  │  - SI-02: Evidence Generation                                     │ │
│  │  - SI-03: Market Access                                           │ │
│  │  - SI-04: Brand Differentiation                                   │ │
│  │  ════════════════════════════════════════════════════════════════  │ │
│  │                                                                     │ │
│  │  ════════════════════════════════════════════════════════════════  │ │
│  │  CRITICAL SUCCESS FACTORS (CSF) - Choose ONE matching the TA:      │ │
│  │  - ONC-CSF-01: Demonstrate efficacy (under SI-01)                 │ │
│  │  - ONC-CSF-02: Generate RWE data (under SI-02)                    │ │
│  │  - ONC-CSF-03: Address safety concerns (under SI-01)              │ │
│  │  ════════════════════════════════════════════════════════════════  │ │
│  │                                                                     │ │
│  │  Extract these 10 labels and respond in JSON format:               │ │
│  │  {                                                                 │ │
│  │      "asset": "BI compound code or null",                          │ │
│  │      "sentiment": "Positive/Negative/Neutral/Mixed",               │ │
│  │      "insight_type": "Data Request/Feedback/Concern/...",          │ │
│  │      "topic": "Efficacy/Safety/Dosing/...",                        │ │
│  │      "stakeholder": "KOL/Investigator/HCP/...",                    │ │
│  │      "si_id": "SI-XX (from the list above)",                       │ │
│  │      "csf_id": "XXX-CSF-XX (from the list above)",                 │ │
│  │      "source_channel": "Field Visit/Advisory Board/...",           │ │
│  │      "evidence_gap": "RWE/Head-to-head/...",                       │ │
│  │      "action_required": "Follow-up/Data Generation/..."           │ │
│  │  }                                                                 │ │
│  │  """                                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Step 4: LLM Classification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 STEP 4: LLM CLASSIFICATION                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CALL AZURE OPENAI:                                                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # Get LLM settings for tagging use-case                          │ │
│  │  llm_settings = config.get_llm_settings("tagging")                 │ │
│  │  # Returns: {"temperature": 0.2, "max_tokens": 800}                │ │
│  │                                                                     │ │
│  │  # Low temperature = more deterministic/consistent choices         │ │
│  │                                                                     │ │
│  │  response = client.chat.completions.create(                        │ │
│  │      model=config.AZURE_OPENAI_DEPLOYMENT,  # "gpt-4"              │ │
│  │      messages=[                                                    │ │
│  │          {                                                         │ │
│  │              "role": "system",                                     │ │
│  │              "content": "You are a medical insights classification │ │
│  │                          expert. Always respond with valid JSON."  │ │
│  │          },                                                        │ │
│  │          {                                                         │ │
│  │              "role": "user",                                       │ │
│  │              "content": prompt                                     │ │
│  │          }                                                         │ │
│  │      ],                                                            │ │
│  │      temperature=0.2,                                              │ │
│  │      max_completion_tokens=800                                     │ │
│  │  )                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  LLM REASONING (internal):                                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  The LLM analyzes the insight text:                                │ │
│  │                                                                     │ │
│  │  "KOL expressed concerns about dosing frequency for elderly        │ │
│  │   patients in the Phase 3 oncology trial"                          │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  Signal            │  Interpretation                        │  │ │
│  │  ├──────────────────────────────────────────────────────────────┤  │ │
│  │  │  "concerns"        │  Negative sentiment, Insight type=Concern│ │ │
│  │  │  "dosing frequency"│  Topic = Dosing (not Efficacy)          │  │ │
│  │  │  "KOL"             │  Stakeholder = KOL                      │  │ │
│  │  │  "Phase 3 trial"   │  Source = Clinical trial context        │  │ │
│  │  │  "elderly patients"│  Subgroup concern                       │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  For SI selection:                                                 │ │
│  │  - Concern about dosing → impacts product adoption                │ │
│  │  - SI-01 (Drive Adoption) best matches this intent                │ │
│  │                                                                     │ │
│  │  For CSF selection:                                                │ │
│  │  - Looking at Oncology CSFs under SI-01:                          │ │
│  │    - ONC-CSF-01: Demonstrate efficacy ✓ (need to show it works)   │ │
│  │    - ONC-CSF-03: Address safety concerns (not safety issue here)  │ │
│  │  - ONC-CSF-01 is best fit                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  LLM RESPONSE:                                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                 │ │
│  │    "asset": null,                                                  │ │
│  │    "sentiment": "Negative",                                        │ │
│  │    "insight_type": "Concern",                                      │ │
│  │    "topic": "Dosing",                                              │ │
│  │    "stakeholder": "KOL",                                           │ │
│  │    "si_id": "SI-01",                ◄── LLM's choice              │ │
│  │    "csf_id": "ONC-CSF-01",          ◄── LLM's choice              │ │
│  │    "source_channel": "Field Visit",                                │ │
│  │    "evidence_gap": "Subgroup",                                     │ │
│  │    "action_required": "Follow-up",                                 │ │
│  │    "confidence_score": 0.85,                                       │ │
│  │    "reasoning": "KOL expressed negative sentiment about dosing     │ │
│  │                  frequency for elderly subgroup. This impacts      │ │
│  │                  adoption and requires efficacy demonstration."    │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Step 5: Save to Database

```python
# database.py - save_insight_tags()

def save_insight_tags(insight_id: str, tags: dict):
    """Save LLM-generated tags including SI and CSF."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT OR REPLACE INTO insight_tags
        (insight_id, asset, sentiment, insight_type, topic,
         stakeholder, si_id, csf_id, source_channel,
         evidence_gap, action_required, confidence_score,
         reasoning, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        insight_id,
        tags.get('asset'),
        tags.get('sentiment'),
        tags.get('insight_type'),
        tags.get('topic'),
        tags.get('stakeholder'),
        tags.get('si_id'),         # "SI-01"
        tags.get('csf_id'),        # "ONC-CSF-01"
        tags.get('source_channel'),
        tags.get('evidence_gap'),
        tags.get('action_required'),
        tags.get('confidence_score', 0),
        tags.get('reasoning', '')
    ))
    
    conn.commit()
    conn.close()
```

---

## Code Implementation

### Complete Flow in taxonomy_tagger.py

```python
# taxonomy_tagger.py - tag_single_insight()

def tag_single_insight(insight_id: str, use_rag: bool = True) -> dict:
    """
    Tag a single insight with all 10 labels including SI and CSF.
    """
    
    # 1. Get insight from database
    insight = database.get_insight_by_id(insight_id)
    insight_text = str(insight.get('description', ''))
    therapeutic_area = insight.get('therapeutic_area', '')
    
    # 2. Get taxonomy options for this therapeutic area
    taxonomy_si, taxonomy_csf = get_taxonomy_for_area(therapeutic_area)
    # taxonomy_si = ALL SIs
    # taxonomy_csf = Only CSFs for this therapeutic_area
    
    # 3. Build RAG context (similar examples + corrections)
    rag_context = ""
    if use_rag:
        examples = retrieve_similar_tagged_insights(insight_text, top_k=3)
        rag_context = format_examples_for_prompt(examples)
        
        corrections = retrieve_relevant_corrections(insight_text, top_k=3)
        rag_context += format_corrections_for_prompt(corrections)
    
    # 4. Call LLM with taxonomy options
    result = llm_service.classify_insight(
        insight_text=insight_text,
        therapeutic_area=therapeutic_area,
        taxonomy_si=taxonomy_si,      # Passed as options
        taxonomy_csf=taxonomy_csf,    # Passed as options
        rag_context=rag_context
    )
    # result contains: {si_id: "SI-01", csf_id: "ONC-CSF-01", ...}
    
    # 5. Save to database
    database.save_insight_tags(insight_id=insight_id, tags=result)
    
    return result
```

---

## Example Walkthrough

### Input

```
Insight: "Investigator requested head-to-head data comparing our drug 
          to competitor in immunology patients"

Therapeutic Area: "Immunology"
```

### Process

| Step | Action | Result |
|------|--------|--------|
| 1 | Get insight | `therapeutic_area = "Immunology"` |
| 2 | Fetch SI | All 4 SIs returned |
| 3 | Fetch CSF | Only `IMM-CSF-*` returned (Immunology) |
| 4 | Build prompt | SI list + IMM-CSF list included |
| 5 | LLM classifies | Picks `SI-02` (Evidence) + `IMM-CSF-02` |
| 6 | Save | Stored in `insight_tags` |

### Output

```json
{
  "si_id": "SI-02",          // Evidence Generation
  "csf_id": "IMM-CSF-02",    // Generate comparative data (Immunology)
  "sentiment": "Neutral",
  "insight_type": "Data Request",
  "topic": "Evidence",
  "stakeholder": "Investigator",
  "evidence_gap": "Head-to-head"
}
```

---

## Key Points

### Summary Table

| Aspect | Details |
|--------|---------|
| **Relationship** | No FK; LLM picks from options |
| **SI Scope** | Global (all therapeutic areas) |
| **CSF Scope** | Filtered by therapeutic area |
| **Storage** | TEXT fields in `insight_tags` |
| **Selection** | LLM analyzes meaning, not keywords |
| **Consistency** | RAG provides similar examples |
| **Learning** | HITL corrections improve accuracy |

### Why This Approach?

| Benefit | Explanation |
|---------|-------------|
| **Flexible** | New SI/CSF added without code changes |
| **Semantic** | LLM understands meaning, not just keywords |
| **Contextual** | CSFs filtered to relevant therapeutic area |
| **Improvable** | HITL corrections teach better mapping |
| **Consistent** | RAG examples ensure similar insights get similar tags |

### File References

| File | Function | Purpose |
|------|----------|---------|
| `taxonomy_tagger.py` | `get_taxonomy_for_area()` | Fetch SI/CSF options |
| `taxonomy_tagger.py` | `tag_single_insight()` | Main tagging flow |
| `llm_service.py` | `classify_insight()` | Build prompt, call LLM |
| `database.py` | `get_taxonomy_si()` | Query SI table |
| `database.py` | `get_taxonomy_csf()` | Query CSF table (filtered) |
| `database.py` | `save_insight_tags()` | Store results |

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Project: Medical Insights Engine - Capstone*
