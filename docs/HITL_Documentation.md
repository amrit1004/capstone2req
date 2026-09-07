# Human-in-the-Loop (HITL) Documentation

## Medical Insights Engine - Technical Documentation

---

## Table of Contents

1. [What is Human-in-the-Loop?](#what-is-human-in-the-loop)
2. [Why HITL?](#why-hitl)
3. [Architecture Overview](#architecture-overview)
4. [HITL Workflow](#hitl-workflow)
5. [How Corrections Improve Future Predictions](#how-corrections-improve-future-predictions)
6. [Implementation Details](#implementation-details)
7. [Code Walkthrough](#code-walkthrough)
8. [Database Schema](#database-schema)
9. [Frontend Integration](#frontend-integration)
10. [Benefits & Best Practices](#benefits--best-practices)

---

## What is Human-in-the-Loop?

**Human-in-the-Loop (HITL)** is a machine learning approach where humans actively participate in the AI pipeline to:

1. **Review** AI-generated outputs
2. **Correct** mistakes when found
3. **Improve** future predictions using those corrections

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HUMAN-IN-THE-LOOP CYCLE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│         ┌──────────┐                                                │
│         │   AI     │                                                │
│         │ Predicts │◄─────────────────────────────┐                 │
│         └────┬─────┘                              │                 │
│              │                                    │                 │
│              ▼                                    │                 │
│         ┌──────────┐                              │                 │
│         │  Human   │                              │                 │
│         │ Reviews  │                              │                 │
│         └────┬─────┘                              │                 │
│              │                                    │                 │
│       ┌──────┴──────┐                             │                 │
│       ▼             ▼                             │                 │
│  ┌─────────┐   ┌─────────┐                        │                 │
│  │ Correct │   │ Approve │                        │                 │
│  │  (Edit) │   │  (OK)   │                        │                 │
│  └────┬────┘   └────┬────┘                        │                 │
│       │             │                             │                 │
│       ▼             ▼                             │                 │
│  ┌──────────────────────┐                         │                 │
│  │   Save Correction    │                         │                 │
│  │   to Database        │─────────────────────────┘                 │
│  └──────────────────────┘                                           │
│       │                                                              │
│       └──► Used as examples for future predictions                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Simple Analogy

Think of HITL like **training a new employee**:
- Employee (AI) does work
- Manager (Human) reviews and corrects
- Employee learns from corrections
- Over time, fewer corrections needed

---

## Why HITL?

### Problems with Pure AI

| Problem | Description |
|---------|-------------|
| **Errors** | AI makes mistakes, especially on edge cases |
| **No Learning** | Without feedback, AI repeats same mistakes |
| **Trust** | Users don't trust unreviewed AI outputs |
| **Domain Nuance** | AI misses domain-specific subtleties |

### How HITL Solves These

| Solution | How HITL Helps |
|----------|----------------|
| **Quality Control** | Humans catch and fix errors |
| **Continuous Improvement** | Corrections become training examples |
| **Trust Building** | Verified tags marked as "human-approved" |
| **Domain Expertise** | Human knowledge feeds back to AI |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HITL ARCHITECTURE IN MEDICAL INSIGHTS ENGINE         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         TAGGING FLOW                                 ││
│  │                                                                      ││
│  │   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐  ││
│  │   │  Insight │────►│ Retrieve │────►│   LLM    │────►│   Save   │  ││
│  │   │   Text   │     │ Similar  │     │  Predict │     │   Tags   │  ││
│  │   └──────────┘     │ Examples │     │   Tags   │     └──────────┘  ││
│  │                    │    +     │     │          │           │        ││
│  │                    │ Correct- │     │          │           │        ││
│  │                    │   ions   │     │          │           ▼        ││
│  │                    └──────────┘     └──────────┘     ┌──────────┐  ││
│  │                          ▲                           │  Review  │  ││
│  │                          │                           │   Page   │  ││
│  │                          │                           └────┬─────┘  ││
│  │                          │                                │        ││
│  │                    ┌─────┴──────┐                   ┌─────┴─────┐  ││
│  │                    │ Corrections│◄──────────────────│  Human    │  ││
│  │                    │   Table    │                   │ Corrects  │  ││
│  │                    └────────────┘                   └───────────┘  ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                       DATABASE TABLES                                ││
│  │                                                                      ││
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐   ││
│  │   │    insights    │  │  insight_tags  │  │  tag_corrections   │   ││
│  │   │                │  │                │  │                    │   ││
│  │   │  - insight_id  │  │  - insight_id  │  │  - insight_id      │   ││
│  │   │  - description │  │  - sentiment   │  │  - field_name      │   ││
│  │   │  - disease     │  │  - topic       │  │  - original_value  │   ││
│  │   │                │  │  - is_verified │  │  - corrected_value │   ││
│  │   │                │  │  - verified_by │  │  - corrected_by    │   ││
│  │   │                │  │                │  │  - reason          │   ││
│  │   └────────────────┘  └────────────────┘  └────────────────────┘   ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## HITL Workflow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HITL COMPLETE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1: AI TAGGING (with learning from past corrections)              │
│  ════════════════════════════════════════════════════════               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  New Insight: "KOL expressed concerns about dosing frequency"    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Retrieve Similar Tagged Insights (RAG)                  │   │
│  │                                                                   │   │
│  │  Found 3 similar insights with their tags:                       │   │
│  │  - INS-042: topic=Dosing, sentiment=Negative                     │   │
│  │  - INS-089: topic=Efficacy, sentiment=Negative                   │   │
│  │  - INS-156: topic=Dosing, sentiment=Neutral                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP 2: Retrieve Relevant Corrections (HITL Learning)          │   │
│  │                                                                   │   │
│  │  Found 2 relevant past corrections:                              │   │
│  │                                                                   │   │
│  │  Correction 1:                                                   │   │
│  │    Field: topic                                                  │   │
│  │    AI predicted: Efficacy ❌                                     │   │
│  │    Human corrected: Dosing ✓                                     │   │
│  │    Reason: "Frequency relates to dosing, not efficacy"          │   │
│  │                                                                   │   │
│  │  Correction 2:                                                   │   │
│  │    Field: sentiment                                              │   │
│  │    AI predicted: Neutral ❌                                      │   │
│  │    Human corrected: Negative ✓                                   │   │
│  │    Reason: "'Concerns' indicates negative sentiment"            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP 3: Send to LLM with Context                               │   │
│  │                                                                   │   │
│  │  Prompt includes:                                                │   │
│  │  - Insight text                                                  │   │
│  │  - Similar tagged examples (consistency)                         │   │
│  │  - Past corrections (avoid repeating mistakes)                   │   │
│  │  - Taxonomy options                                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: LLM Generates Tags                                     │   │
│  │                                                                   │   │
│  │  {                                                               │   │
│  │    "sentiment": "Negative",     ← Learned from correction!      │   │
│  │    "topic": "Dosing",           ← Learned from correction!      │   │
│  │    "stakeholder": "KOL",                                        │   │
│  │    "insight_type": "Concern"                                    │   │
│  │  }                                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP 5: Save to insight_tags (is_verified = FALSE)             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                                                                          │
│  PHASE 2: HUMAN REVIEW                                                  │
│  ═════════════════════                                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Human reviewer sees the tags on Review page                     │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │  Insight: "KOL expressed concerns about dosing frequency"   │ │   │
│  │  │                                                              │ │   │
│  │  │  AI Tags:                                                    │ │   │
│  │  │    Sentiment: [Negative ▼]  ✓ Correct                       │ │   │
│  │  │    Topic:     [Dosing ▼]    ✓ Correct                       │ │   │
│  │  │    Stakeholder: [KOL ▼]     ✓ Correct                       │ │   │
│  │  │                                                              │ │   │
│  │  │  [✓ Verify]  [✎ Edit]                                       │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                          ┌─────────┴─────────┐                          │
│                          ▼                   ▼                          │
│                    ┌──────────┐        ┌──────────┐                     │
│                    │  VERIFY  │        │  CORRECT │                     │
│                    │ (All OK) │        │  (Error) │                     │
│                    └────┬─────┘        └────┬─────┘                     │
│                         │                   │                           │
│                         ▼                   ▼                           │
│               ┌─────────────────┐   ┌─────────────────┐                 │
│               │ is_verified = 1 │   │ Save correction │                 │
│               │ verified_by =   │   │ to database     │                 │
│               │ "evaluator"     │   │                 │                 │
│               └─────────────────┘   └────────┬────────┘                 │
│                                              │                          │
│                                              ▼                          │
│                              ┌───────────────────────────┐              │
│                              │  Correction saved to      │              │
│                              │  tag_corrections table    │              │
│                              │                           │              │
│                              │  - insight_id             │              │
│                              │  - field_name: "topic"    │              │
│                              │  - original: "Efficacy"   │              │
│                              │  - corrected: "Safety"    │              │
│                              │  - reason: "..."          │              │
│                              │  - corrected_by: "john"   │              │
│                              └───────────────────────────┘              │
│                                              │                          │
│                                              │                          │
│                                              ▼                          │
│                    ┌─────────────────────────────────────────┐          │
│                    │  FUTURE TAGGING WILL USE THIS CORRECTION │         │
│                    │  AS A LEARNING EXAMPLE                   │         │
│                    └─────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How Corrections Improve Future Predictions

### The Learning Mechanism

Unlike traditional ML fine-tuning, we use **In-Context Learning**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IN-CONTEXT LEARNING vs FINE-TUNING                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FINE-TUNING (Traditional)           IN-CONTEXT LEARNING (Our Approach) │
│  ═════════════════════════           ═══════════════════════════════════│
│                                                                          │
│  - Requires many examples            - Works with few examples           │
│  - Retrains model weights            - No retraining needed              │
│  - Expensive (compute)               - Cheap (just prompt)               │
│  - Static after training             - Dynamic, real-time learning       │
│  - Needs ML expertise                - Simple database storage           │
│                                                                          │
│                                                                          │
│  HOW IN-CONTEXT LEARNING WORKS:                                         │
│  ───────────────────────────────                                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  LLM PROMPT                                                        │ │
│  │                                                                     │ │
│  │  "You are a medical insights tagger.                               │ │
│  │                                                                     │ │
│  │   LEARN FROM THESE PAST CORRECTIONS:                               │ │
│  │                                                                     │ │
│  │   Correction 1:                                                    │ │
│  │   Insight: 'Doctor worried about injection frequency'             │ │
│  │   Field: topic                                                     │ │
│  │   AI said: Efficacy ❌                                             │ │
│  │   Human corrected: Dosing ✓                                        │ │
│  │   Why: 'Frequency relates to dosing schedule'                      │ │
│  │                                                                     │ │
│  │   Correction 2:                                                    │ │
│  │   Insight: 'Patient expressed frustration with side effects'      │ │
│  │   Field: sentiment                                                 │ │
│  │   AI said: Neutral ❌                                              │ │
│  │   Human corrected: Negative ✓                                      │ │
│  │   Why: 'Frustration is clearly negative'                           │ │
│  │                                                                     │ │
│  │   NOW TAG THIS NEW INSIGHT:                                        │ │
│  │   'KOL expressed concerns about dosing frequency'                  │ │
│  │                                                                     │ │
│  │   Apply the learnings above to avoid similar mistakes."            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Result: LLM learns to tag "concerns" as Negative, "frequency" as Dosing│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Relevance-Based Retrieval

Not all corrections are used - only **relevant** ones:

```python
def retrieve_relevant_corrections(insight_text: str, top_k: int = 5):
    """
    Find corrections that are relevant to the current insight.
    Uses vector similarity to find corrections from similar insights.
    """
    
    # Step 1: Get all corrections from database
    corrections = database.get_all_corrections()
    
    # Step 2: Find insights similar to current one
    similar_insights = vector_store.search(insight_text, top_k=20)
    similar_ids = {result['insight_id'] for result in similar_insights}
    
    # Step 3: Filter corrections to only those from similar insights
    relevant_corrections = [
        c for c in corrections 
        if c['insight_id'] in similar_ids
    ]
    
    # Step 4: Return most recent relevant corrections
    return relevant_corrections[:top_k]
```

---

## Implementation Details

### File Structure

```
capstone2req/
├── taxonomy_tagger.py       # Main tagging with HITL integration
├── database.py              # Correction storage
├── services/
│   └── tagging.py           # Tagging service wrapper
├── frontend/
│   └── src/pages/Review.jsx # Human review interface
└── docs/
    └── HITL_Documentation.md
```

### Key Functions

#### 1. Retrieve Corrections (`taxonomy_tagger.py`)

```python
def retrieve_relevant_corrections(insight_text: str, top_k: int = 5) -> list:
    """
    Retrieve relevant human corrections to learn from mistakes.
    This enables human-in-the-loop learning.
    """
    try:
        # Get all corrections with their insight descriptions
        conn = database.get_connection()
        corrections_df = pd.read_sql_query("""
            SELECT tc.*, i.description
            FROM tag_corrections tc
            JOIN insights i ON tc.insight_id = i.insight_id
            ORDER BY tc.corrected_at DESC
            LIMIT 50
        """, conn)
        conn.close()

        if corrections_df.empty:
            return []

        # Use vector search to find corrections for similar insights
        store = vector_store.get_vector_store()
        search_results = store.search(insight_text, top_k * 2)
        similar_ids = {r['insight_id'] for r in search_results}

        # Filter corrections for similar insights
        relevant = corrections_df[corrections_df['insight_id'].isin(similar_ids)]

        if relevant.empty:
            # Fall back to most recent corrections
            relevant = corrections_df.head(top_k)

        # Format corrections for return
        corrections = []
        for _, row in relevant.head(top_k).iterrows():
            corrections.append({
                'insight_id': row['insight_id'],
                'description': row['description'][:200],
                'field': row['field_name'],
                'original': row['original_value'],
                'corrected': row['corrected_value'],
                'reason': row['correction_reason']
            })

        return corrections
        
    except Exception as e:
        logger.error(f"Error retrieving corrections: {e}")
        return []
```

#### 2. Format Corrections for LLM Prompt

```python
def format_corrections_for_prompt(corrections: list) -> str:
    """Format corrections as learning examples for LLM."""
    if not corrections:
        return ""

    text = "\n\nHUMAN CORRECTIONS (learn from these mistakes - avoid repeating them):\n"

    for i, c in enumerate(corrections, 1):
        text += f"""
Correction {i}:
Insight: {c['description']}...
Field: {c['field']}
AI predicted: {c['original']} ❌
Human corrected to: {c['corrected']} ✓
Reason: {c['reason']}
"""

    text += "\nAPPLY THESE LEARNINGS to avoid similar mistakes.\n"
    return text
```

#### 3. Tag with HITL Context (`taxonomy_tagger.py`)

```python
def tag_single_insight(insight_id: str, use_rag: bool = True) -> dict:
    """
    Tag a single insight with all 10 labels.
    RAG-Enhanced: Retrieves similar tagged insights as examples.
    Human-in-the-Loop: Learns from human corrections.
    """
    # Get insight
    insight = database.get_insight_by_id(insight_id)
    insight_text = str(insight.get('description', ''))

    # Get appropriate taxonomy
    therapeutic_area = insight.get('therapeutic_area', '')
    taxonomy_si, taxonomy_csf = get_taxonomy_for_area(therapeutic_area)

    # Build RAG context
    rag_context = ""
    if use_rag:
        # Get similar tagged examples (consistency)
        examples = retrieve_similar_tagged_insights(insight_text, top_k=3)
        rag_context = format_examples_for_prompt(examples)
        
        # HITL: Get relevant corrections (learning)
        corrections = retrieve_relevant_corrections(insight_text, top_k=3)
        corrections_context = format_corrections_for_prompt(corrections)
        
        if corrections:
            logger.debug(f"HITL: Found {len(corrections)} corrections for {insight_id}")
            rag_context += corrections_context  # Append to context

    # Classify using LLM with RAG + HITL context
    result = llm_service.classify_insight(
        insight_text=insight_text,
        therapeutic_area=therapeutic_area,
        taxonomy_si=taxonomy_si,
        taxonomy_csf=taxonomy_csf,
        rag_context=rag_context  # Includes both examples AND corrections
    )

    # Save to database
    database.save_insight_tags(insight_id=insight_id, tags=result)

    return result
```

#### 4. Save Correction (`database.py`)

```python
def save_tag_correction(
    insight_id: str,
    field_name: str,
    original_value: str,
    corrected_value: str,
    corrected_by: str,
    correction_reason: str = ""
) -> bool:
    """
    Save a human correction to the database.
    This will be used for future HITL learning.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO tag_corrections 
            (insight_id, field_name, original_value, corrected_value, 
             corrected_by, correction_reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            insight_id, 
            field_name, 
            original_value, 
            corrected_value,
            corrected_by, 
            correction_reason
        ))
        
        # Also update the actual tag
        cursor.execute(f"""
            UPDATE insight_tags 
            SET {field_name} = ?, is_verified = 1, verified_by = ?
            WHERE insight_id = ?
        """, (corrected_value, corrected_by, insight_id))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Saved correction for {insight_id}.{field_name}: {original_value} → {corrected_value}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving correction: {e}")
        return False
```

---

## Database Schema

### Tables

```sql
-- Main tags table
CREATE TABLE insight_tags (
    insight_id TEXT PRIMARY KEY,
    asset TEXT,
    sentiment TEXT,
    insight_type TEXT,
    topic TEXT,
    stakeholder TEXT,
    si_id TEXT,
    csf_id TEXT,
    source_channel TEXT,
    evidence_gap TEXT,
    action_required TEXT,
    confidence_score REAL,
    reasoning TEXT,
    is_verified INTEGER DEFAULT 0,    -- 0 = AI only, 1 = Human verified
    verified_by TEXT,                  -- Who verified
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corrections table (HITL learning data)
CREATE TABLE tag_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_id TEXT NOT NULL,
    field_name TEXT NOT NULL,          -- Which field was corrected
    original_value TEXT,               -- What AI predicted
    corrected_value TEXT,              -- What human corrected to
    corrected_by TEXT NOT NULL,        -- Who made the correction
    correction_reason TEXT,            -- Why (learning context)
    corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (insight_id) REFERENCES insights(insight_id)
);

-- Index for fast retrieval
CREATE INDEX idx_corrections_insight ON tag_corrections(insight_id);
CREATE INDEX idx_corrections_field ON tag_corrections(field_name);
```

### Example Data

```
tag_corrections table:
┌────┬────────────┬─────────────┬──────────────┬──────────────┬─────────────┬──────────────────────────────┐
│ id │ insight_id │ field_name  │ original     │ corrected    │ corrected_by│ correction_reason            │
├────┼────────────┼─────────────┼──────────────┼──────────────┼─────────────┼──────────────────────────────┤
│ 1  │ INS-042    │ topic       │ Efficacy     │ Dosing       │ john@med.com│ Frequency = dosing schedule  │
│ 2  │ INS-089    │ sentiment   │ Neutral      │ Negative     │ jane@med.com│ "Concerns" implies negative  │
│ 3  │ INS-156    │ stakeholder │ HCP          │ KOL          │ john@med.com│ Dr. Smith is a known KOL     │
│ 4  │ INS-201    │ insight_type│ Feedback     │ Concern      │ jane@med.com│ Safety issue = concern       │
└────┴────────────┴─────────────┴──────────────┴──────────────┴─────────────┴──────────────────────────────┘
```

---

## Frontend Integration

### Review Page Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVIEW PAGE UI                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Review & Correct Tags                                              │ │
│  │                                                                     │ │
│  │  Filter: [Unverified ▼]  [All Topics ▼]  Page: [< 1/15 >]          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  INS-042                                                 ⏳ Pending │ │
│  │  ─────────────────────────────────────────────────────────────────  │ │
│  │  "KOL expressed concerns about the dosing frequency for elderly     │ │
│  │   patients in the Phase 3 oncology trial..."                        │ │
│  │                                                                     │ │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────────────┐ │ │
│  │  │ Sentiment   │ Topic       │ Stakeholder │ Insight Type        │ │ │
│  │  │ [Negative▼] │ [Dosing ▼]  │ [KOL ▼]     │ [Concern ▼]         │ │ │
│  │  └─────────────┴─────────────┴─────────────┴─────────────────────┘ │ │
│  │                                                                     │ │
│  │  Correction Reason (if editing):                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────┐   │ │
│  │  │ Enter why you're making this correction...                  │   │ │
│  │  └─────────────────────────────────────────────────────────────┘   │ │
│  │                                                                     │ │
│  │  [✓ Verify as Correct]  [💾 Save Corrections]                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tags/unverified` | GET | Get unverified tags for review |
| `/api/tags/verify` | POST | Mark tag as verified |
| `/api/tags/correct` | POST | Save a correction |
| `/api/corrections` | GET | Get all corrections (for analysis) |

### Correction API Request

```javascript
// Frontend: Save a correction
const saveCorrection = async (data) => {
  await axios.post('/api/tags/correct', {
    insight_id: 'INS-042',
    field_name: 'topic',
    original_value: 'Efficacy',
    corrected_value: 'Dosing',
    corrected_by: user.email,
    correction_reason: 'Frequency relates to dosing schedule, not efficacy'
  });
};
```

---

## Benefits & Best Practices

### Benefits

| Benefit | Description |
|---------|-------------|
| **Continuous Improvement** | AI gets better with every correction |
| **No Retraining Required** | Uses in-context learning |
| **Transparent Learning** | Can see exactly what AI learned from |
| **Domain Adaptation** | Learns your organization's conventions |
| **Quality Assurance** | Human verification builds trust |
| **Audit Trail** | All corrections logged with reasons |

### Best Practices

| Practice | Why |
|----------|-----|
| **Always add reason** | Helps AI understand the "why" |
| **Be consistent** | Same error type should have same correction |
| **Correct early** | Early corrections prevent cascading errors |
| **Review corrections** | Ensure corrections are themselves correct |
| **Track metrics** | Monitor correction rate over time |

### Measuring HITL Effectiveness

```python
def calculate_hitl_metrics():
    """Calculate how effective HITL is being."""
    
    # Get all tags and corrections
    tags = database.get_insight_tags()
    corrections = database.get_corrections()
    
    metrics = {
        'total_tagged': len(tags),
        'total_verified': len(tags[tags['is_verified'] == 1]),
        'total_corrections': len(corrections),
        'correction_rate': len(corrections) / len(tags) * 100,
        'most_corrected_field': corrections['field_name'].mode()[0],
    }
    
    # Group corrections by field
    field_corrections = corrections.groupby('field_name').size().to_dict()
    metrics['corrections_by_field'] = field_corrections
    
    return metrics
```

**Expected trend**: Correction rate should **decrease over time** as AI learns from past corrections.

---

## Data Storage - Correction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                WHERE CORRECTIONS ARE STORED & USED                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: HUMAN MAKES CORRECTION (Frontend)                              │
│  ══════════════════════════════════════════                             │
│                                                                          │
│  User clicks "Save Correction" on Review page                           │
│                         │                                                │
│                         ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  API Request: POST /api/tags/correct                               │ │
│  │  {                                                                 │ │
│  │    "insight_id": "INS-042",                                        │ │
│  │    "field_name": "topic",                                          │ │
│  │    "original_value": "Efficacy",                                   │ │
│  │    "corrected_value": "Dosing",                                    │ │
│  │    "corrected_by": "john@example.com",                             │ │
│  │    "correction_reason": "Frequency relates to dosing"              │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  STEP 2: SAVED TO DATABASE (Backend)                                    │
│  ═══════════════════════════════════                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  DATABASE: medical_insights.db                                     │ │
│  │                                                                     │ │
│  │  TABLE: tag_corrections                                            │ │
│  │  ┌────┬───────────┬───────────┬──────────┬──────────┬───────────┐ │ │
│  │  │ id │insight_id │field_name │ original │corrected │ reason    │ │ │
│  │  ├────┼───────────┼───────────┼──────────┼──────────┼───────────┤ │ │
│  │  │ 1  │ INS-042   │ topic     │ Efficacy │ Dosing   │ Frequency │ │ │
│  │  │ 2  │ INS-089   │ sentiment │ Neutral  │ Negative │ Concerns  │ │ │
│  │  │ 3  │ INS-156   │ stakeholdr│ HCP      │ KOL      │ Dr.Smith  │ │ │
│  │  └────┴───────────┴───────────┴──────────┴──────────┴───────────┘ │ │
│  │                                                                     │ │
│  │  TABLE: insight_tags (also updated)                                │ │
│  │  - topic = "Dosing" (corrected value)                              │ │
│  │  - is_verified = 1                                                 │ │
│  │  - verified_by = "john@example.com"                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  STEP 3: RETRIEVED FOR FUTURE TAGGING                                  │
│  ════════════════════════════════════                                   │
│                                                                          │
│  When tagging NEW insight: "Patient asked about injection frequency"   │
│                         │                                                │
│                         ▼                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  retrieve_relevant_corrections()                                   │ │
│  │                                                                     │ │
│  │  1. Vector search: Find insights similar to new one                │ │
│  │     → Similar: INS-042, INS-089, INS-201                           │ │
│  │                                                                     │ │
│  │  2. Query corrections for those insights:                          │ │
│  │     SELECT * FROM tag_corrections                                  │ │
│  │     WHERE insight_id IN ('INS-042', 'INS-089', 'INS-201')         │ │
│  │                                                                     │ │
│  │  3. Found correction from INS-042:                                 │ │
│  │     "topic: Efficacy → Dosing (Frequency relates to dosing)"       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  STEP 4: INCLUDED IN LLM PROMPT                                        │
│  ══════════════════════════════                                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  LLM PROMPT (sent to Azure OpenAI GPT-4):                          │ │
│  │                                                                     │ │
│  │  "Tag this insight: 'Patient asked about injection frequency'      │ │
│  │                                                                     │ │
│  │   LEARN FROM THESE PAST CORRECTIONS:                               │ │
│  │                                                                     │ │
│  │   Correction 1:                                                    │ │
│  │   Insight: 'KOL expressed concerns about dosing frequency'         │ │
│  │   Field: topic                                                     │ │
│  │   AI predicted: Efficacy ❌                                        │ │
│  │   Human corrected: Dosing ✓                                        │ │
│  │   Reason: Frequency relates to dosing schedule                     │ │
│  │                                                                     │ │
│  │   Apply these learnings to avoid similar mistakes."                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         │                                                │
│                         ▼                                                │
│  STEP 5: AI PRODUCES BETTER PREDICTION                                 │
│  ═════════════════════════════════════                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  AI Response:                                                      │ │
│  │  {                                                                 │ │
│  │    "topic": "Dosing",  ◄─── Learned from correction!              │ │
│  │    "sentiment": "Neutral",                                         │ │
│  │    ...                                                             │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Storage Summary Table

| What | Where Stored | Table/File | When Used |
|------|--------------|------------|-----------|
| Original AI tags | SQLite | `insight_tags` | Displayed on Review page |
| Human corrections | SQLite | `tag_corrections` | Retrieved for future tagging |
| Correction reason | SQLite | `tag_corrections.correction_reason` | Included in LLM prompt |
| Verified status | SQLite | `insight_tags.is_verified` | Filter reviewed vs pending |
| Who verified | SQLite | `insight_tags.verified_by` | Audit trail |
| Vector index | Pickle | `chroma_data/*.pkl` | Finding similar insights |

### Code: Saving a Correction

```python
# database.py - save_tag_correction()

def save_tag_correction(insight_id, field_name, original_value, 
                        corrected_value, corrected_by, reason):
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Save to corrections table (for future learning)
    cursor.execute("""
        INSERT INTO tag_corrections
        (insight_id, field_name, original_value, corrected_value, 
         correction_reason, corrected_by)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (insight_id, field_name, original_value, corrected_value, 
          reason, corrected_by))
    
    # 2. Update the actual tag
    cursor.execute(f"""
        UPDATE insight_tags 
        SET {field_name} = ?, is_verified = 1, verified_by = ?
        WHERE insight_id = ?
    """, (corrected_value, corrected_by, insight_id))
    
    conn.commit()
    conn.close()
```

### Code: Retrieving Corrections for Learning

```python
# taxonomy_tagger.py - retrieve_relevant_corrections()

def retrieve_relevant_corrections(insight_text, top_k=5):
    # 1. Get corrections joined with insight descriptions
    corrections_df = pd.read_sql_query("""
        SELECT tc.*, i.description
        FROM tag_corrections tc
        JOIN insights i ON tc.insight_id = i.insight_id
        ORDER BY tc.corrected_at DESC
        LIMIT 50
    """, conn)
    
    # 2. Find similar insights using vector search
    store = vector_store.get_vector_store()
    search_results = store.search(insight_text, top_k * 2)
    similar_ids = {r['insight_id'] for r in search_results}
    
    # 3. Filter corrections to only similar insights
    relevant = corrections_df[
        corrections_df['insight_id'].isin(similar_ids)
    ]
    
    return relevant.head(top_k).to_dict('records')
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HITL IN A NUTSHELL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. TAG      → AI generates tags for insight                           │
│   2. RETRIEVE → Find relevant past corrections                          │
│   3. LEARN    → Include corrections as examples in prompt               │
│   4. REVIEW   → Human reviews AI output                                 │
│   5. CORRECT  → Human fixes errors with reason                          │
│   6. STORE    → Correction saved to database                            │
│   7. REPEAT   → Next insight benefits from this correction              │
│                                                                          │
│   Result: AI continuously improves from human feedback                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `taxonomy_tagger.py` | HITL integration in tagging |
| `database.py` | Correction storage |
| `Review.jsx` | Human review UI |

### Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `retrieve_relevant_corrections()` | taxonomy_tagger.py | Find relevant corrections |
| `format_corrections_for_prompt()` | taxonomy_tagger.py | Format for LLM |
| `save_tag_correction()` | database.py | Store correction |
| `verify_tag()` | database.py | Mark as verified |

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Project: Medical Insights Engine - Capstone*
