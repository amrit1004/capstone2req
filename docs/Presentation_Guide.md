# Presentation Guide - Medical Insights Engine

## Team Presentation for Capstone Evaluation

---

## Overview

| Total Time | 20-25 minutes |
|------------|---------------|
| Team Size | 4 members |
| Per Person | ~5-6 minutes each |

---

## Presentation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIMELINE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MEMBER 1 (5 min)          MEMBER 2 (6 min)                             │
│  ══════════════            ══════════════                               │
│  Introduction &            AI Tagging &                                 │
│  Architecture              Taxonomy Mapping                             │
│                                                                          │
│         │                        │                                       │
│         ▼                        ▼                                       │
│                                                                          │
│  MEMBER 3 (6 min)          MEMBER 4 (6 min)                             │
│  ══════════════            ══════════════                               │
│  RAG & Search              Human-in-the-Loop                            │
│  Assistant                 & Personas                                   │
│                                                                          │
│         │                        │                                       │
│         ▼                        ▼                                       │
│                                                                          │
│              Q&A SESSION (5 min)                                        │
│              ══════════════════                                         │
│              All members answer                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Member 1: Introduction & Architecture

**Duration:** 5 minutes

### What to Cover

| Topic | Time |
|-------|------|
| Project Introduction | 1 min |
| Problem Statement | 1 min |
| Architecture Overview | 2 min |
| Tech Stack | 1 min |

### What to Show

1. **Dashboard Page** (home screen)
2. **Architecture Diagram** (from docs or draw on whiteboard)
3. **Project Structure** (briefly in VS Code)

### Script

```
SLIDE/SCREEN: Dashboard

"Good morning/afternoon. I'm [Name] and along with my team - [Names] - 
we'll be presenting our capstone project: Medical Insights Engine.

PROBLEM STATEMENT:
Pharmaceutical companies collect thousands of medical insights from 
clinical trials, KOL interactions, and field visits. Manually analyzing 
and categorizing these insights is:
- Time-consuming (hours per insight)
- Inconsistent (different people tag differently)
- Not scalable (thousands of insights)

OUR SOLUTION:
We built an AI-driven platform that:
1. Automatically tags insights using GPT-4
2. Learns from human corrections
3. Provides intelligent search using RAG
4. Generates role-specific summaries

ARCHITECTURE:
[Show diagram or draw]

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────►│   FastAPI   │────►│  Azure      │
│   Frontend  │     │   Backend   │     │  OpenAI     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   SQLite    │
                    │   + TF-IDF  │
                    └─────────────┘

TECH STACK:
- Frontend: React 18, Tailwind CSS, Recharts
- Backend: FastAPI (Python)
- Database: SQLite
- AI: Azure OpenAI GPT-4
- Vector Search: TF-IDF (scikit-learn)

Key design decisions:
- TF-IDF instead of embeddings API = cost-effective, works offline
- SQLite = simple deployment, no separate DB server
- Modular architecture with services layer

Now [Member 2] will demonstrate our AI tagging system."
```

### Demo Steps

1. Open browser → Show Dashboard
2. Point to metrics cards (Total Insights, Tagged, Verified)
3. Show the pie chart (SI distribution)
4. Briefly show project structure in VS Code (optional)

---

## Member 2: AI Tagging & Taxonomy Mapping

**Duration:** 6 minutes

### What to Cover

| Topic | Time |
|-------|------|
| Taxonomy Explanation (SI/CSF) | 1.5 min |
| Tagging Demo | 2 min |
| How LLM Maps SI/CSF | 1.5 min |
| LLM Presets | 1 min |

### What to Show

1. **Tagging Page** - Tag single insight
2. **Tag Results** - Show 10 labels generated
3. **Taxonomy Tables** (optional - in database)

### Script

```
SCREEN: Tagging Page

"Thank you [Member 1]. I'll now demonstrate our AI tagging system.

TAXONOMY STRUCTURE:
Our system uses a two-level taxonomy:

1. Strategic Imperatives (SI) - High-level business goals
   - SI-01: Drive Adoption
   - SI-02: Evidence Generation
   - SI-03: Market Access
   - SI-04: Brand Differentiation

2. Critical Success Factors (CSF) - Specific goals per therapeutic area
   - ONC-CSF-01: Demonstrate efficacy (Oncology, under SI-01)
   - IMM-CSF-01: Build KOL advocacy (Immunology, under SI-01)

[DEMO: Tag an insight]

Let me select an insight and tag it...

[Click 'Generate Tags' on an insight]

The system extracts 10 labels:
- Sentiment: Positive/Negative/Neutral
- Topic: Efficacy, Safety, Dosing, etc.
- Stakeholder: KOL, Investigator, HCP
- SI and CSF mapping
- And 5 more labels...

HOW SI/CSF MAPPING WORKS:
[Show the result]

The LLM doesn't use hardcoded rules. Instead:
1. We fetch all SI options (global)
2. We fetch CSF options filtered by therapeutic area
3. We include these as options in the prompt
4. LLM reads the insight text and CHOOSES the best match
5. Stored as text in the database

For example, this insight mentions 'dosing concerns' - 
the LLM mapped it to SI-01 (Drive Adoption) because 
dosing issues affect product adoption.

LLM PRESETS:
We use different settings for different tasks:
- Tagging: temperature=0.2 (precise, consistent)
- Personas: temperature=0.6 (more creative)
- RAG: temperature=0.5 (balanced)

Now [Member 3] will show our RAG-powered search."
```

### Demo Steps

1. Go to Tagging page
2. Select an insight from dropdown
3. Click "Generate Tags"
4. Wait for result (show loading state)
5. Show the 10 labels generated
6. Highlight SI and CSF fields
7. Explain the mapping briefly

---

## Member 3: RAG & Search Assistant

**Duration:** 6 minutes

### What to Cover

| Topic | Time |
|-------|------|
| What is RAG | 1 min |
| Vector Index (TF-IDF) | 1 min |
| Chat Demo | 2.5 min |
| Topic Analysis Demo | 1.5 min |

### What to Show

1. **Search Page** - Build index
2. **RAG Page** - Chat interface
3. **Topic Analysis** - Summarize a topic

### Script

```
SCREEN: RAG Assistant Page

"Thank you [Member 2]. I'll demonstrate our RAG-powered assistant.

WHAT IS RAG?
RAG stands for Retrieval-Augmented Generation. 

Traditional LLM:
- Answers from training data
- May hallucinate
- Doesn't know your private data

With RAG:
- First RETRIEVES relevant documents from our database
- Then AUGMENTS the prompt with this context
- Finally GENERATES a grounded response

Think of it like an open-book exam - the AI looks up 
relevant information before answering.

HOW WE BUILT IT:
[Show Search page briefly]

1. Vector Index using TF-IDF (not expensive embeddings API)
   - Each insight converted to a 5000-dimension vector
   - Stored locally as pickle files
   - Search uses cosine similarity

2. When you ask a question:
   - Convert question to vector
   - Find top 5 similar insights
   - Include them as context
   - Send to GPT-4

[DEMO: Chat]
[Go to RAG page, Chat tab]

Let me ask: 'What are the main efficacy concerns?'

[Type and send]

Notice:
- The response cites specific insight IDs
- Sources shown below with relevance scores
- Answer is grounded in actual data, not hallucinated

[DEMO: Topic Analysis]
[Click Topic Analysis tab]

Let me analyze 'dosing':

[Type 'dosing' and click Analyze]

This retrieves all dosing-related insights and generates
a structured summary with key themes and recommendations.

The difference from simple search:
- Search returns raw documents
- RAG synthesizes information into actionable insights

Now [Member 4] will show Human-in-the-Loop and Personas."
```

### Demo Steps

1. Briefly show Search page (mention Build Index button)
2. Go to RAG page
3. Chat tab - Ask "What are the main efficacy concerns?"
4. Show the answer with sources
5. Click Topic Analysis tab
6. Type "dosing" and analyze
7. Show the structured summary

---

## Member 4: Human-in-the-Loop & Personas

**Duration:** 6 minutes

### What to Cover

| Topic | Time |
|-------|------|
| Why HITL | 1 min |
| Review & Correct Demo | 2 min |
| How Corrections Improve AI | 1 min |
| Persona Summaries Demo | 2 min |

### What to Show

1. **Review Page** - Verify/correct tags
2. **Personas Page** - Generate summaries
3. **Role-based filtering** (if logged in as specific role)

### Script

```
SCREEN: Review Page

"Thank you [Member 3]. I'll demonstrate Human-in-the-Loop 
and Persona generation.

WHY HUMAN-IN-THE-LOOP?
AI is powerful but makes mistakes. HITL means:
- Humans review AI outputs
- Correct errors when found
- AI learns from these corrections

It's like training a new employee - they improve with feedback.

[DEMO: Review Page]

Here's our Review page showing unverified tags.

[Show an insight with tags]

If the AI got it right, I click 'Verify'.
[Click Verify on one]

If there's an error, I can correct it.
[Select a field, change value, add reason]

For example, if AI said 'Efficacy' but it should be 'Dosing',
I correct it and add reason: 'Frequency relates to dosing'.

HOW CORRECTIONS IMPROVE FUTURE TAGGING:
[Explain without demo]

When we tag a NEW insight:
1. System finds similar insights using vector search
2. Retrieves corrections made on similar insights
3. Includes them in the LLM prompt as examples
4. LLM learns: 'Don't make this mistake again'

This is In-Context Learning - no retraining needed.

[DEMO: Personas Page]

PERSONA SUMMARIES:
[Go to Personas page]

Different roles need different views:
- Clinician: Patient care focus
- Medical Scientist: Evidence focus
- Commercial: Market positioning focus

[Select an insight, click View Summaries]

The AI generates 3 different summaries in ONE API call.
Each highlights what matters to that audience.

[Show the 3 summaries]

Notice how:
- Clinician summary mentions patient impact
- Scientist summary mentions evidence gaps
- Commercial summary mentions competitive positioning

ROLE-BASED ACCESS:
If I log in as a Clinician, I only see my relevant summary.
Admins see all three.

CONCLUSION:
To summarize our project:
1. AI Tagging - Automates insight classification
2. RAG Search - Intelligent Q&A grounded in data
3. Human-in-the-Loop - Continuous improvement
4. Personas - Role-specific views

Thank you. We're happy to take questions."
```

### Demo Steps

1. Go to Review page
2. Show an unverified insight
3. Click Verify on one insight
4. Show how to correct (change a dropdown, add reason)
5. Go to Personas page
6. Select an insight
7. Click "View Summaries"
8. Show the 3 different persona summaries
9. Highlight differences between them

---

## Q&A Preparation

### Likely Questions & Answers

| Question | Who Answers | Answer |
|----------|-------------|--------|
| Why TF-IDF instead of embeddings? | Member 1/3 | Cost-effective, no API calls, works offline, good enough for our scale |
| How accurate is the tagging? | Member 2 | We have ground truth comparison in Metrics page, typically 70-85% |
| How does HITL learning work? | Member 4 | In-context learning - corrections included as examples in prompts |
| Can it handle new therapeutic areas? | Member 2 | Yes, just add CSFs to database, no code changes |
| What's the response time? | Member 3 | Tagging: 2-3 sec, RAG: 3-5 sec (depends on Azure OpenAI) |
| How do you handle errors? | Member 1 | Custom exceptions, centralized logging, retry with backoff |
| Is data secure? | Member 1 | Local SQLite, no data sent except to Azure OpenAI (enterprise) |
| What's the scalability? | Member 1 | Current: 1000s of insights. For more: switch to PostgreSQL, add caching |

### Tips for Q&A

1. **Don't know?** Say "That's a great question. Let me check..." or defer to teammate
2. **Technical depth?** Start simple, go deeper if asked
3. **Criticism?** Accept gracefully: "Yes, that's a limitation. With more time, we would..."

---

## Presentation Checklist

### Before Presentation

- [ ] Backend running (`python backend/main.py`)
- [ ] Frontend running (`npm run dev`)
- [ ] Database has sample data (insights, some tags)
- [ ] Vector index built
- [ ] Test each demo flow once
- [ ] Browser zoom level appropriate
- [ ] Dark mode ON (looks better for demos)

### Equipment

- [ ] Laptop charged
- [ ] HDMI/adapter for projector
- [ ] Backup screenshots (in case of tech issues)
- [ ] Internet connection (for Azure OpenAI)

### Each Member Should Know

- [ ] Their section thoroughly
- [ ] Basic understanding of other sections
- [ ] Where to click for their demos
- [ ] How to recover if something fails

---

## Backup Plan (If Demo Fails)

### Screenshots to Prepare

1. Dashboard with metrics
2. Tagging page with results
3. RAG chat with answer
4. Review page with correction
5. Personas page with 3 summaries

### Offline Explanation

If Azure OpenAI is down:
- Show screenshots
- Explain the flow
- Point to code in VS Code
- Show database tables

---

## Timing Guide

```
┌─────────────────────────────────────────────────────────────────────────┐
│  00:00 - 05:00   │  Member 1: Intro & Architecture                     │
│  05:00 - 11:00   │  Member 2: AI Tagging & Taxonomy                    │
│  11:00 - 17:00   │  Member 3: RAG & Search                             │
│  17:00 - 23:00   │  Member 4: HITL & Personas                          │
│  23:00 - 28:00   │  Q&A (All members)                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary Card (Print for Each Member)

### Member 1
```
TOPIC: Introduction & Architecture
TIME: 5 min
SHOW: Dashboard, Architecture diagram
KEY POINTS: Problem, Solution, Tech Stack
HANDOFF: "Now [Member 2] will demonstrate AI tagging"
```

### Member 2
```
TOPIC: AI Tagging & Taxonomy
TIME: 6 min
SHOW: Tagging page, Tag results
KEY POINTS: SI/CSF taxonomy, LLM mapping, 10 labels
HANDOFF: "Now [Member 3] will show RAG search"
```

### Member 3
```
TOPIC: RAG & Search
TIME: 6 min
SHOW: RAG chat, Topic analysis
KEY POINTS: TF-IDF vectors, Retrieval+Generation, Sources
HANDOFF: "Now [Member 4] will show HITL and Personas"
```

### Member 4
```
TOPIC: HITL & Personas
TIME: 6 min
SHOW: Review page, Personas page
KEY POINTS: Verify/Correct, Learning from corrections, 3 personas
HANDOFF: "We're happy to take questions"
```

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Project: Medical Insights Engine - Capstone*
