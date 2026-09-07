# Medical Insights Engine - Complete Application Documentation

## AI-Driven Medical Insights Analysis Platform

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Workflows](#core-workflows)
   - [Workflow 1: Data Import](#workflow-1-data-import)
   - [Workflow 2: Vector Index Building](#workflow-2-vector-index-building)
   - [Workflow 3: AI Tagging](#workflow-3-ai-tagging)
   - [Workflow 4: Human Review (HITL)](#workflow-4-human-review-hitl)
   - [Workflow 5: RAG Query](#workflow-5-rag-query)
   - [Workflow 6: Persona Generation](#workflow-6-persona-generation)
   - [Workflow 7: Authentication](#workflow-7-authentication)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Frontend Pages](#frontend-pages)
9. [Configuration](#configuration)
10. [Use Cases](#use-cases)

---

## Application Overview

### What is Medical Insights Engine?

A **capstone project** that demonstrates an AI-powered platform for analyzing medical insights from clinical trials, KOL interactions, and field visits.

### Key Features

| Feature | Description |
|---------|-------------|
| **AI Tagging** | Automatically classify insights with 10 taxonomy labels |
| **RAG Assistant** | Ask questions answered from your insight database |
| **Human-in-the-Loop** | Review, correct, and improve AI predictions |
| **Persona Summaries** | Generate role-specific summaries (Clinician, Scientist, Commercial) |
| **Role-Based Access** | Different views based on user role |
| **Ground Truth Comparison** | Evaluate AI accuracy against human labels |

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MEDICAL INSIGHTS ENGINE - OVERVIEW                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  Excel  │───►│ Import  │───►│ Vector  │───►│   AI    │             │
│   │  Data   │    │   to    │    │  Index  │    │ Tagging │             │
│   │         │    │   DB    │    │  Build  │    │         │             │
│   └─────────┘    └─────────┘    └─────────┘    └────┬────┘             │
│                                                      │                   │
│                                                      ▼                   │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │ Persona │◄───│   RAG   │◄───│  Human  │◄───│  Tags   │             │
│   │Summaries│    │  Query  │    │ Review  │    │ Stored  │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      FRONTEND (React + Vite)                         ││
│  │  Port: 5173                                                          ││
│  │                                                                      ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │Dashboard │ │ Tagging  │ │  Review  │ │   RAG    │ │ Personas │  ││
│  │  │          │ │          │ │          │ │  Chat    │ │          │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  │                                                                      ││
│  └──────────────────────────────┬──────────────────────────────────────┘│
│                                 │ HTTP/REST                              │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      BACKEND (FastAPI)                               ││
│  │  Port: 8000                                                          ││
│  │                                                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────┐││
│  │  │                     API ENDPOINTS                                │││
│  │  │  /api/insights  /api/tags  /api/rag  /api/personas  /api/auth   │││
│  │  └─────────────────────────────────────────────────────────────────┘││
│  │                                 │                                    ││
│  │                                 ▼                                    ││
│  │  ┌─────────────────────────────────────────────────────────────────┐││
│  │  │                    SERVICES LAYER                                │││
│  │  │  TaggingService  RAGService  PersonaService  AuthService        │││
│  │  └─────────────────────────────────────────────────────────────────┘││
│  │                                 │                                    ││
│  │         ┌───────────────────────┼───────────────────────┐           ││
│  │         ▼                       ▼                       ▼           ││
│  │  ┌────────────┐         ┌────────────┐         ┌────────────┐      ││
│  │  │  SQLite    │         │  TF-IDF    │         │Azure OpenAI│      ││
│  │  │  Database  │         │  Vector    │         │   GPT-4    │      ││
│  │  │            │         │  Store     │         │            │      ││
│  │  └────────────┘         └────────────┘         └────────────┘      ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | UI Framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Icons** | Lucide React | Icon library |
| **Charts** | Recharts | Data visualization |
| **Backend** | FastAPI (Python) | REST API |
| **Database** | SQLite | Data storage |
| **Vector Search** | TF-IDF (sklearn) | Similarity search |
| **LLM** | Azure OpenAI GPT-4 | AI inference |
| **Logging** | Python logging | Centralized logs |

---

## Project Structure

```
capstone2req/
│
├── backend/
│   └── main.py                 # FastAPI application & endpoints
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Card.jsx        # Reusable UI components
│       │   └── Sidebar.jsx     # Navigation sidebar
│       ├── context/
│       │   └── AuthContext.jsx # Authentication state
│       ├── pages/
│       │   ├── Dashboard.jsx   # Overview & metrics
│       │   ├── Tagging.jsx     # AI tagging interface
│       │   ├── Review.jsx      # Human review (HITL)
│       │   ├── RAG.jsx         # RAG chat assistant
│       │   ├── Personas.jsx    # Persona summaries
│       │   ├── Metrics.jsx     # Ground truth comparison
│       │   ├── Search.jsx      # Vector search
│       │   └── Login.jsx       # Authentication
│       └── api.js              # API client
│
├── services/                    # Business logic layer
│   ├── tagging.py              # TaggingService
│   ├── rag.py                  # RAGService
│   ├── personas.py             # PersonaService
│   ├── search.py               # SearchService
│   └── auth.py                 # AuthService
│
├── data_access/                 # Database layer
│   ├── base.py                 # BaseRepository
│   ├── insights.py             # InsightsRepository
│   ├── tags.py                 # TagsRepository
│   ├── users.py                # UsersRepository
│   └── taxonomy.py             # TaxonomyRepository
│
├── utils/                       # Utilities
│   ├── logger.py               # Centralized logging
│   ├── constants.py            # Application constants
│   └── exceptions.py           # Custom exceptions
│
├── docs/                        # Documentation
│   ├── RAG_Documentation.md
│   ├── HITL_Documentation.md
│   └── Application_Documentation.md
│
├── config.py                    # Configuration & LLM presets
├── database.py                  # Database operations
├── taxonomy_tagger.py           # AI tagging logic
├── persona_generator.py         # Persona generation
├── rag_service.py               # RAG pipeline
├── vector_store.py              # TF-IDF indexing
└── llm_service.py               # Azure OpenAI client
```

---

## Core Workflows

---

### Workflow 1: Data Import

**Purpose**: Load medical insights from Excel into the database.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW 1: DATA IMPORT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User uploads Excel file                                        │
│  ────────────────────────────────                                       │
│  Frontend: Tagging.jsx                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  <input type="file" onChange={handleFileUpload} />                 │ │
│  │  Expected columns: insight_id, therapeutic_area, disease_state,    │ │
│  │                    description                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API receives file                                              │
│  ─────────────────────────                                              │
│  Endpoint: POST /api/insights/upload                                    │
│  File: backend/main.py (line ~80)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/insights/upload")                                 │ │
│  │  async def upload_insights(file: UploadFile):                      │ │
│  │      df = pd.read_excel(file.file)                                 │ │
│  │      database.import_insights(df)                                  │ │
│  │      return {"imported": len(df)}                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Save to database                                               │
│  ────────────────────────                                               │
│  Function: database.import_insights()                                   │
│  File: database.py (line ~200)                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def import_insights(df):                                          │ │
│  │      for _, row in df.iterrows():                                  │ │
│  │          cursor.execute("""                                        │ │
│  │              INSERT OR REPLACE INTO insights                       │ │
│  │              (insight_id, therapeutic_area, disease_state,         │ │
│  │               description)                                         │ │
│  │              VALUES (?, ?, ?, ?)                                   │ │
│  │          """, (row['insight_id'], ...))                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  RESULT: Insights stored in SQLite                                      │
│  ─────────────────────────────────                                      │
│  Table: insights                                                        │
│  Database: medical_insights.db                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Upload UI | `frontend/src/pages/Tagging.jsx` | `handleFileUpload()` |
| API Endpoint | `backend/main.py` | `upload_insights()` ~line 80 |
| DB Save | `database.py` | `import_insights()` ~line 200 |

---

### Workflow 2: Vector Index Building

**Purpose**: Create TF-IDF vectors for similarity search.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  WORKFLOW 2: VECTOR INDEX BUILDING                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User clicks "Build Index"                                      │
│  ──────────────────────────────────                                     │
│  Frontend: Search.jsx                                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  <Button onClick={handleBuildIndex}>Build Vector Index</Button>    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API triggers build                                             │
│  ──────────────────────────                                             │
│  Endpoint: POST /api/vector/build                                       │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/vector/build")                                    │ │
│  │  async def build_vector_index():                                   │ │
│  │      vector_store.build_vector_store()                             │ │
│  │      return {"status": "success"}                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Load insights from DB                                          │
│  ─────────────────────────────                                          │
│  Function: build_vector_store()                                         │
│  File: vector_store.py (line ~150)                                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def build_vector_store():                                         │ │
│  │      insights_df = database.get_all_insights()                     │ │
│  │                                                                     │ │
│  │      # Combine text fields                                         │ │
│  │      for _, row in insights_df.iterrows():                         │ │
│  │          text = f"{row['therapeutic_area']} {row['disease_state']} │ │
│  │                   {row['description']}"                            │ │
│  │          texts.append(text)                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: Build TF-IDF matrix                                            │
│  ───────────────────────────                                            │
│  File: vector_store.py (line ~85)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  self.vectorizer = TfidfVectorizer(                                │ │
│  │      max_features=5000,        # Top 5000 terms                    │ │
│  │      stop_words='english',     # Remove common words               │ │
│  │      ngram_range=(1, 2),       # Unigrams + bigrams                │ │
│  │      min_df=1,                                                     │ │
│  │      max_df=0.95                                                   │ │
│  │  )                                                                 │ │
│  │                                                                     │ │
│  │  self.vectors = self.vectorizer.fit_transform(texts)               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: Save to disk (pickle)                                          │
│  ─────────────────────────────                                          │
│  File: vector_store.py (line ~55)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def _save_index(self):                                            │ │
│  │      pickle.dump(self.vectorizer, open('tfidf_vectorizer.pkl'))    │ │
│  │      pickle.dump(self.vectors, open('tfidf_vectors.pkl'))          │ │
│  │      pickle.dump(self.insight_ids, open('insight_ids.pkl'))        │ │
│  │      pickle.dump(self.documents, open('documents.pkl'))            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  RESULT: Vector index ready for search                                  │
│  ─────────────────────────────────────                                  │
│  Files: chroma_data/*.pkl                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Build Button | `frontend/src/pages/Search.jsx` | `handleBuildIndex()` |
| API Endpoint | `backend/main.py` | `build_vector_index()` |
| Load Data | `vector_store.py` | `build_vector_store()` ~line 150 |
| TF-IDF | `vector_store.py` | `add_insights_batch()` ~line 72 |
| Save Index | `vector_store.py` | `_save_index()` ~line 55 |

---

### Workflow 3: AI Tagging

**Purpose**: Automatically classify insights with 10 taxonomy labels.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW 3: AI TAGGING                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User clicks "Tag All" or selects insight                       │
│  ────────────────────────────────────────────────                       │
│  Frontend: Tagging.jsx                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  <Button onClick={handleTagAll}>Tag All Insights</Button>          │ │
│  │  // or                                                              │ │
│  │  <Button onClick={() => handleTagSingle(insightId)}>Tag</Button>   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API receives request                                           │
│  ────────────────────────────                                           │
│  Endpoint: POST /api/tags/generate or /api/tags/generate-all            │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/tags/generate")                                   │ │
│  │  async def generate_tags(insight_id: str):                         │ │
│  │      result = taxonomy_tagger.tag_single_insight(insight_id)       │ │
│  │      return result                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Retrieve similar tagged insights (RAG)                         │
│  ──────────────────────────────────────────────                         │
│  Function: retrieve_similar_tagged_insights()                           │
│  File: taxonomy_tagger.py (line ~30)                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def retrieve_similar_tagged_insights(insight_text, top_k=3):      │ │
│  │      store = vector_store.get_vector_store()                       │ │
│  │      search_results = store.search(insight_text, top_k + 5)        │ │
│  │                                                                     │ │
│  │      for result in search_results:                                 │ │
│  │          tags = database.get_insight_tags(result['insight_id'])    │ │
│  │          if not tags.empty:                                        │ │
│  │              examples.append({...})  # Use as example              │ │
│  │                                                                     │ │
│  │      return examples                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: Retrieve relevant corrections (HITL)                           │
│  ────────────────────────────────────────────                           │
│  Function: retrieve_relevant_corrections()                              │
│  File: taxonomy_tagger.py (line ~106)                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def retrieve_relevant_corrections(insight_text, top_k=5):         │ │
│  │      corrections_df = pd.read_sql_query("""                        │ │
│  │          SELECT tc.*, i.description                                │ │
│  │          FROM tag_corrections tc                                   │ │
│  │          JOIN insights i ON tc.insight_id = i.insight_id           │ │
│  │      """, conn)                                                    │ │
│  │                                                                     │ │
│  │      # Filter to corrections from similar insights                 │ │
│  │      similar_ids = vector_store.search(insight_text)               │ │
│  │      relevant = corrections_df[corrections_df['insight_id']        │ │
│  │                                .isin(similar_ids)]                 │ │
│  │      return relevant                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: Build LLM prompt with context                                  │
│  ─────────────────────────────────────                                  │
│  Function: classify_insight()                                           │
│  File: llm_service.py (line ~54)                                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  prompt = f"""                                                     │ │
│  │  {rag_context}  # Similar examples + corrections                   │ │
│  │                                                                     │ │
│  │  INSIGHT TEXT: "{insight_text}"                                    │ │
│  │  THERAPEUTIC AREA: {therapeutic_area}                              │ │
│  │                                                                     │ │
│  │  STRATEGIC IMPERATIVES: {si_list}                                  │ │
│  │  CRITICAL SUCCESS FACTORS: {csf_list}                              │ │
│  │                                                                     │ │
│  │  Extract these 10 labels in JSON format:                           │ │
│  │  - asset, sentiment, insight_type, topic, stakeholder              │ │
│  │  - si_id, csf_id, source_channel, evidence_gap, action_required    │ │
│  │  """                                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 6: Call Azure OpenAI                                              │
│  ─────────────────────────                                              │
│  File: llm_service.py (line ~112)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  llm_settings = config.get_llm_settings("tagging")                 │ │
│  │  # Returns: {"temperature": 0.2, "max_tokens": 800}                │ │
│  │                                                                     │ │
│  │  response = client.chat.completions.create(                        │ │
│  │      model=config.AZURE_OPENAI_DEPLOYMENT,                         │ │
│  │      messages=[                                                    │ │
│  │          {"role": "system", "content": "You are a medical..."},    │ │
│  │          {"role": "user", "content": prompt}                       │ │
│  │      ],                                                            │ │
│  │      temperature=llm_settings["temperature"],                      │ │
│  │      max_completion_tokens=llm_settings["max_tokens"]              │ │
│  │  )                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 7: Parse response and save                                        │
│  ────────────────────────────────                                       │
│  Function: save_insight_tags()                                          │
│  File: database.py (line ~365)                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  result = json.loads(response.choices[0].message.content)          │ │
│  │  # {sentiment: "Negative", topic: "Dosing", ...}                   │ │
│  │                                                                     │ │
│  │  database.save_insight_tags(                                       │ │
│  │      insight_id=insight_id,                                        │ │
│  │      tags=result                                                   │ │
│  │  )                                                                 │ │
│  │  # Saved to insight_tags table with is_verified=0                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  RESULT: Tags stored, ready for human review                            │
│  ───────────────────────────────────────────                            │
│  Table: insight_tags (is_verified = 0)                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Tag Button | `frontend/src/pages/Tagging.jsx` | `handleTagAll()` |
| API Endpoint | `backend/main.py` | `generate_tags()` |
| RAG Examples | `taxonomy_tagger.py` | `retrieve_similar_tagged_insights()` ~line 30 |
| HITL Corrections | `taxonomy_tagger.py` | `retrieve_relevant_corrections()` ~line 106 |
| LLM Prompt | `llm_service.py` | `classify_insight()` ~line 54 |
| LLM Call | `llm_service.py` | Azure OpenAI ~line 112 |
| Save Tags | `database.py` | `save_insight_tags()` ~line 365 |

---

### Workflow 4: Human Review (HITL)

**Purpose**: Review AI tags, verify or correct them, enabling continuous learning.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW 4: HUMAN REVIEW (HITL)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: Load unverified tags                                           │
│  ────────────────────────────                                           │
│  Frontend: Review.jsx                                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  useEffect(() => {                                                 │ │
│  │      const res = await getUnverifiedTags()                         │ │
│  │      setTags(res.data.tags)                                        │ │
│  │  }, [])                                                            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API returns unverified                                         │
│  ──────────────────────────────                                         │
│  Endpoint: GET /api/tags/unverified                                     │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.get("/api/tags/unverified")                                  │ │
│  │  async def get_unverified():                                       │ │
│  │      tags = database.get_insight_tags()                            │ │
│  │      unverified = tags[tags['is_verified'] == 0]                   │ │
│  │      return {"tags": unverified.to_dict('records')}                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Human reviews tags                                             │
│  ──────────────────────────                                             │
│  User sees each insight with AI-generated tags                          │
│  Options: Verify (approve) or Correct (edit)                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │  INS-042: "KOL expressed concerns about dosing frequency"    │  │ │
│  │  │                                                               │  │ │
│  │  │  Sentiment: [Negative ▼]  Topic: [Dosing ▼]                  │  │ │
│  │  │                                                               │  │ │
│  │  │  [✓ Verify]  [Edit & Save]                                   │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                       ┌────────────┴────────────┐                       │
│                       ▼                         ▼                       │
│               ┌─────────────┐           ┌─────────────┐                 │
│               │   VERIFY    │           │   CORRECT   │                 │
│               │  (Approve)  │           │   (Edit)    │                 │
│               └──────┬──────┘           └──────┬──────┘                 │
│                      │                         │                        │
│                      ▼                         ▼                        │
│  STEP 4A: Verify tag                   STEP 4B: Save correction         │
│  ───────────────────                   ────────────────────────         │
│  Endpoint: POST /api/tags/verify       Endpoint: POST /api/tags/correct │
│  File: backend/main.py                 File: backend/main.py            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  # VERIFY                              # CORRECT                   │ │
│  │  @app.post("/api/tags/verify")         @app.post("/api/tags/correct│ │
│  │  async def verify_tag(req):            async def correct_tag(req): │ │
│  │      database.verify_tag(                  database.save_tag_      │ │
│  │          insight_id,                           correction(         │ │
│  │          verified_by                           insight_id,         │ │
│  │      )                                         field_name,         │ │
│  │                                                original_value,     │ │
│  │  # Updates:                                    corrected_value,    │ │
│  │  # is_verified = 1                             corrected_by,       │ │
│  │  # verified_by = "user"                        reason              │ │
│  │                                            )                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                      │                         │                        │
│                      ▼                         ▼                        │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  DATABASE UPDATES:                                                 │ │
│  │                                                                     │ │
│  │  insight_tags:              tag_corrections:                       │ │
│  │  - is_verified = 1          - insight_id                           │ │
│  │  - verified_by = "john"     - field_name = "topic"                 │ │
│  │  - verified_at = NOW()      - original_value = "Efficacy"          │ │
│  │                             - corrected_value = "Dosing"           │ │
│  │                             - corrected_by = "john"                │ │
│  │                             - correction_reason = "..."            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  RESULT: Correction stored for future learning                          │
│  ─────────────────────────────────────────────                          │
│  Next time similar insight is tagged, this correction                   │
│  will be retrieved and included in LLM prompt                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Review UI | `frontend/src/pages/Review.jsx` | Component |
| Get Unverified | `backend/main.py` | `get_unverified()` |
| Verify Tag | `database.py` | `verify_tag()` ~line 430 |
| Save Correction | `database.py` | `save_tag_correction()` ~line 445 |
| Retrieve for Learning | `taxonomy_tagger.py` | `retrieve_relevant_corrections()` ~line 106 |

---

### Workflow 5: RAG Query

**Purpose**: Answer questions using retrieved insight context.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW 5: RAG QUERY                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User asks question                                             │
│  ──────────────────────────                                             │
│  Frontend: RAG.jsx (Chat interface)                                     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  User: "What are the main efficacy concerns for oncology?"         │ │
│  │                                                                     │ │
│  │  const handleQuery = async () => {                                 │ │
│  │      const res = await ragQuery(query)                             │ │
│  │      setMessages([...messages, {role: 'assistant', ...res.data}])  │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API receives query                                             │
│  ──────────────────────────                                             │
│  Endpoint: POST /api/rag/query                                          │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/rag/query")                                       │ │
│  │  async def rag_query_endpoint(request: RAGRequest):                │ │
│  │      result = rag_service.rag_query(request.query, request.top_k)  │ │
│  │      return result                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Retrieve relevant insights                                     │
│  ───────────────────────────────────                                    │
│  Function: retrieve_relevant_insights()                                 │
│  File: rag_service.py (line ~38)                                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def retrieve_relevant_insights(query, top_k=5):                   │ │
│  │      store = vector_store.get_vector_store()                       │ │
│  │      search_results = store.search(query, top_k)                   │ │
│  │      # Returns: [{insight_id, score, document}, ...]               │ │
│  │                                                                     │ │
│  │      # Enrich with full data and tags                              │ │
│  │      for result in search_results:                                 │ │
│  │          insight = database.get_insight_by_id(result['insight_id'])│ │
│  │          tags = database.get_insight_tags(result['insight_id'])    │ │
│  │          enriched_results.append({...})                            │ │
│  │                                                                     │ │
│  │      return enriched_results                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: Build context                                                  │
│  ─────────────────────                                                  │
│  Function: build_context()                                              │
│  File: rag_service.py (line ~89)                                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def build_context(retrieved_insights):                            │ │
│  │      context = "RELEVANT INSIGHTS FROM DATABASE:\n"                │ │
│  │                                                                     │ │
│  │      for i, insight in enumerate(retrieved_insights):              │ │
│  │          context += f"""                                           │ │
│  │          --- Insight {i} (ID: {insight['insight_id']}) ---         │ │
│  │          Description: {insight['description']}                     │ │
│  │          Therapeutic Area: {insight['therapeutic_area']}           │ │
│  │          Tags: {insight['tags']}                                   │ │
│  │          """                                                       │ │
│  │                                                                     │ │
│  │      return context                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: Generate response with LLM                                     │
│  ───────────────────────────────────                                    │
│  Function: rag_query()                                                  │
│  File: rag_service.py (line ~117)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  llm_settings = config.get_llm_settings("rag_query")               │ │
│  │  # Returns: {"temperature": 0.5, "max_tokens": 1000}               │ │
│  │                                                                     │ │
│  │  response = client.chat.completions.create(                        │ │
│  │      model=config.AZURE_OPENAI_DEPLOYMENT,                         │ │
│  │      messages=[                                                    │ │
│  │          {"role": "system", "content": "You are a medical..."},    │ │
│  │          {"role": "user", "content": f"""                          │ │
│  │              Context: {context}                                    │ │
│  │              Question: {query}                                     │ │
│  │              Answer based on the provided context.                 │ │
│  │          """}                                                      │ │
│  │      ],                                                            │ │
│  │      temperature=llm_settings["temperature"],                      │ │
│  │      max_completion_tokens=llm_settings["max_tokens"]              │ │
│  │  )                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 6: Return answer with sources                                     │
│  ───────────────────────────────────                                    │
│  File: rag_service.py (line ~164)                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  return {                                                          │ │
│  │      'query': query,                                               │ │
│  │      'answer': response.choices[0].message.content,                │ │
│  │      'sources': [                                                  │ │
│  │          {                                                         │ │
│  │              'insight_id': i['insight_id'],                        │ │
│  │              'relevance_score': i['similarity_score'],             │ │
│  │              'preview': i['description'][:150]                     │ │
│  │          }                                                         │ │
│  │          for i in retrieved_insights                               │ │
│  │      ],                                                            │ │
│  │      'num_sources': len(retrieved_insights)                        │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Chat UI | `frontend/src/pages/RAG.jsx` | `handleQuery()` |
| API Endpoint | `backend/main.py` | `rag_query_endpoint()` |
| Retrieve | `rag_service.py` | `retrieve_relevant_insights()` ~line 38 |
| Build Context | `rag_service.py` | `build_context()` ~line 89 |
| LLM Call | `rag_service.py` | `rag_query()` ~line 117 |

---

### Workflow 6: Persona Generation

**Purpose**: Generate role-specific summaries for different audiences.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   WORKFLOW 6: PERSONA GENERATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User selects insight                                           │
│  ─────────────────────────────                                          │
│  Frontend: Personas.jsx                                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  <select onChange={e => setSelectedInsight(e.target.value)}>       │ │
│  │      {insights.map(i => <option>{i.insight_id}</option>)}          │ │
│  │  </select>                                                         │ │
│  │  <Button onClick={handleViewSummaries}>View Summaries</Button>     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API generates summaries                                        │
│  ───────────────────────────────                                        │
│  Endpoint: POST /api/personas/generate                                  │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/personas/generate")                               │ │
│  │  async def generate_personas(insight_id: str):                     │ │
│  │      result = persona_generator.generate_summaries_for_insight(    │ │
│  │          insight_id                                                │ │
│  │      )                                                             │ │
│  │      return result                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Retrieve similar examples (RAG)                                │
│  ───────────────────────────────────────                                │
│  Function: retrieve_similar_persona_examples()                          │
│  File: persona_generator.py (line ~28)                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def retrieve_similar_persona_examples(insight_text, top_k=2):     │ │
│  │      store = vector_store.get_vector_store()                       │ │
│  │      search_results = store.search(insight_text, top_k + 3)        │ │
│  │                                                                     │ │
│  │      for result in search_results:                                 │ │
│  │          summaries = database.get_persona_summaries(               │ │
│  │              result['insight_id']                                  │ │
│  │          )                                                         │ │
│  │          if not summaries.empty:                                   │ │
│  │              examples.append({                                     │ │
│  │                  'clinician': ...,                                 │ │
│  │                  'medical_scientist': ...,                         │ │
│  │                  'commercial': ...                                 │ │
│  │              })                                                    │ │
│  │                                                                     │ │
│  │      return format_examples(examples)                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: Generate all 3 personas in ONE call                            │
│  ───────────────────────────────────────────                            │
│  Function: generate_all_personas_single_call()                          │
│  File: persona_generator.py (line ~100)                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  llm_settings = config.get_llm_settings("personas")                │ │
│  │  # Returns: {"temperature": 0.6, "max_tokens": 600}                │ │
│  │                                                                     │ │
│  │  prompt = f"""                                                     │ │
│  │  {rag_context}  # Similar examples for consistency                 │ │
│  │                                                                     │ │
│  │  INSIGHT: {insight_text}                                           │ │
│  │                                                                     │ │
│  │  Generate 3 summaries for:                                         │ │
│  │  1. CLINICIAN: Patient care focus                                  │ │
│  │  2. MEDICAL_SCIENTIST: Scientific evidence focus                   │ │
│  │  3. COMMERCIAL: Market positioning focus                           │ │
│  │                                                                     │ │
│  │  Respond in JSON:                                                  │ │
│  │  {{"clinician": "...", "medical_scientist": "...",                 │ │
│  │    "commercial": "..."}}                                           │ │
│  │  """                                                               │ │
│  │                                                                     │ │
│  │  response = client.chat.completions.create(...)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: Save to database                                               │
│  ────────────────────────                                               │
│  Function: save_persona_summary()                                       │
│  File: database.py (line ~520)                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  for persona_type, summary in all_summaries.items():               │ │
│  │      database.save_persona_summary(                                │ │
│  │          insight_id=insight_id,                                    │ │
│  │          persona_type=persona_type,  # clinician, etc.             │ │
│  │          summary=summary                                           │ │
│  │      )                                                             │ │
│  │                                                                     │ │
│  │  # Saved to persona_summaries table                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 6: Display based on user role                                     │
│  ───────────────────────────────────                                    │
│  Frontend: Personas.jsx                                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  const { role } = useAuth()                                        │ │
│  │                                                                     │ │
│  │  // Admin sees all 3, others see only their role                   │ │
│  │  const visiblePersonas = role === 'admin'                          │ │
│  │      ? ['clinician', 'medical_scientist', 'commercial']            │ │
│  │      : [role]                                                      │ │
│  │                                                                     │ │
│  │  {visiblePersonas.map(persona => (                                 │ │
│  │      <Card>{summaries[persona]}</Card>                             │ │
│  │  ))}                                                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Persona UI | `frontend/src/pages/Personas.jsx` | Component |
| API Endpoint | `backend/main.py` | `generate_personas()` |
| RAG Examples | `persona_generator.py` | `retrieve_similar_persona_examples()` ~line 28 |
| Generate All | `persona_generator.py` | `generate_all_personas_single_call()` ~line 100 |
| Save | `database.py` | `save_persona_summary()` ~line 520 |

---

### Workflow 7: Authentication

**Purpose**: User login/signup with role-based access control.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW 7: AUTHENTICATION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: User fills login/signup form                                   │
│  ─────────────────────────────────────                                  │
│  Frontend: Login.jsx                                                    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  // Signup                                                         │ │
│  │  const handleSubmit = async () => {                                │ │
│  │      await registerApi({                                           │ │
│  │          name,                                                     │ │
│  │          email,                                                    │ │
│  │          password,                                                 │ │
│  │          role: 'clinician',        // or medical_scientist, etc.  │ │
│  │          is_evaluator: true        // Can review tags              │ │
│  │      })                                                            │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 2: API handles auth                                               │
│  ────────────────────────                                               │
│  Endpoints: POST /api/auth/register, /api/auth/login                    │
│  File: backend/main.py                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  @app.post("/api/auth/register")                                   │ │
│  │  async def register(request: RegisterRequest):                     │ │
│  │      result = database.register_user(                              │ │
│  │          username=request.name,                                    │ │
│  │          email=request.email,                                      │ │
│  │          password=request.password,  # Hashed with SHA-256         │ │
│  │          role=request.role,                                        │ │
│  │          is_evaluator=request.is_evaluator                         │ │
│  │      )                                                             │ │
│  │      return result                                                 │ │
│  │                                                                     │ │
│  │  @app.post("/api/auth/login")                                      │ │
│  │  async def login(request: LoginRequest):                           │ │
│  │      result = database.login_user(request.email, request.password) │ │
│  │      return result                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 3: Database operations                                            │
│  ───────────────────────────                                            │
│  File: database.py (line ~550)                                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  def register_user(username, email, password, role, is_evaluator): │ │
│  │      password_hash = hashlib.sha256(password.encode()).hexdigest() │ │
│  │                                                                     │ │
│  │      cursor.execute("""                                            │ │
│  │          INSERT INTO users                                         │ │
│  │          (name, email, password_hash, role, is_evaluator)          │ │
│  │          VALUES (?, ?, ?, ?, ?)                                    │ │
│  │      """, (username, email, password_hash, role, is_evaluator))    │ │
│  │                                                                     │ │
│  │  def login_user(email, password):                                  │ │
│  │      user = get_user_by_email(email)                               │ │
│  │      if user['password_hash'] == hash(password):                   │ │
│  │          return {'success': True, 'user': {...}}                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 4: Store in AuthContext                                           │
│  ─────────────────────────────                                          │
│  File: frontend/src/context/AuthContext.jsx                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  const AuthContext = createContext()                               │ │
│  │                                                                     │ │
│  │  export function AuthProvider({ children }) {                      │ │
│  │      const [user, setUser] = useState(null)                        │ │
│  │                                                                     │ │
│  │      const login = (userData) => {                                 │ │
│  │          setUser(userData)                                         │ │
│  │          localStorage.setItem('user', JSON.stringify(userData))    │ │
│  │      }                                                             │ │
│  │                                                                     │ │
│  │      const value = {                                               │ │
│  │          user,                                                     │ │
│  │          role: user?.role,                                         │ │
│  │          isEvaluator: user?.is_evaluator,                          │ │
│  │          login,                                                    │ │
│  │          logout                                                    │ │
│  │      }                                                             │ │
│  │                                                                     │ │
│  │      return <AuthContext.Provider value={value}>...                │ │
│  │  }                                                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  STEP 5: Role-based UI                                                  │
│  ─────────────────────                                                  │
│  Used across all pages                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  // Personas.jsx - Show only relevant persona                      │ │
│  │  const { role } = useAuth()                                        │ │
│  │  if (role === 'clinician') show only clinician summary             │ │
│  │  if (role === 'admin') show all summaries                          │ │
│  │                                                                     │ │
│  │  // Review.jsx - Only evaluators can verify                        │ │
│  │  const { isEvaluator } = useAuth()                                 │ │
│  │  if (!isEvaluator) disable verify button                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code References:**

| Step | File | Function/Line |
|------|------|---------------|
| Login UI | `frontend/src/pages/Login.jsx` | Component |
| Register API | `backend/main.py` | `register()` |
| Login API | `backend/main.py` | `login()` |
| DB Operations | `database.py` | `register_user()`, `login_user()` ~line 550 |
| Auth Context | `frontend/src/context/AuthContext.jsx` | Provider |

---

## Database Schema

```sql
-- Core tables
insights            -- Raw medical insights
insight_tags        -- AI-generated tags (10 labels)
tag_corrections     -- Human corrections for HITL
persona_summaries   -- Role-specific summaries
taxonomy_si         -- Strategic Imperatives
taxonomy_csf        -- Critical Success Factors
users               -- Authentication

-- Vector storage (files)
chroma_data/
  ├── tfidf_vectorizer.pkl
  ├── tfidf_vectors.pkl
  ├── insight_ids.pkl
  └── documents.pkl
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights` | GET | Get all insights |
| `/api/insights/upload` | POST | Upload Excel file |
| `/api/tags/generate` | POST | Tag single insight |
| `/api/tags/generate-all` | POST | Tag all insights |
| `/api/tags/verify` | POST | Verify a tag |
| `/api/tags/correct` | POST | Save correction |
| `/api/rag/query` | POST | RAG question |
| `/api/rag/summarize-topic` | POST | Topic analysis |
| `/api/rag/compare` | POST | Compare insights |
| `/api/personas/generate` | POST | Generate summaries |
| `/api/vector/build` | POST | Build index |
| `/api/vector/search` | POST | Search insights |
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login user |
| `/api/metrics` | GET | Get metrics |
| `/api/ground-truth/compare` | POST | Compare to ground truth |

---

## Frontend Pages

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/` | Overview, metrics, charts |
| Tagging | `/tagging` | Upload data, trigger AI tagging |
| Review | `/review` | Human review, verify/correct tags |
| RAG | `/rag` | Chat assistant |
| Personas | `/personas` | View persona summaries |
| Search | `/search` | Vector search |
| Metrics | `/metrics` | Ground truth comparison |
| Login | `/login` | Authentication |

---

## Configuration

### LLM Presets (`config.py`)

```python
LLM_PRESETS = {
    "tagging": {"temperature": 0.2, "max_tokens": 800},    # Precise
    "personas": {"temperature": 0.6, "max_tokens": 600},   # Creative
    "rag_query": {"temperature": 0.5, "max_tokens": 1000}, # Balanced
    "rag_summary": {"temperature": 0.4, "max_tokens": 1200}
}
```

### Environment Variables

```
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

---

## Use Cases

| Use Case | Workflow | User Role |
|----------|----------|-----------|
| Import clinical trial data | Workflow 1 | Admin |
| Build search index | Workflow 2 | Admin |
| Auto-tag 1000 insights | Workflow 3 | Admin |
| Review AI tags | Workflow 4 | Evaluator |
| Correct wrong tag | Workflow 4 | Evaluator |
| Ask "What are safety concerns?" | Workflow 5 | Any |
| Get clinician summary | Workflow 6 | Clinician |
| Compare AI vs ground truth | Metrics page | Admin |

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Project: Medical Insights Engine - Capstone*
