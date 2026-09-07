# AI-Driven Medical Insights Engine

Capstone Project - Track 1: Taxonomy Mapping & Persona Reasoning

A modern web application using **React + FastAPI** for AI-powered medical insights analysis with 10-label extraction.

## Features

- **10-Label Extraction**: AI extracts 10 structured labels from unstructured medical insights
- **Taxonomy Tagging**: Classification against Strategic Imperatives & Critical Success Factors
- **RAG (Retrieval-Augmented Generation)**: Intelligent Q&A and analysis grounded in actual insight data
- **Human-in-the-Loop Learning**: System learns from human corrections to improve accuracy
- **Semantic Search**: Natural language search using TF-IDF vector embeddings
- **Human Review**: Verify and correct AI-generated labels with accuracy tracking
- **Persona Summaries**: Generate audience-specific summaries (Clinician, Medical Scientist, Commercial)
- **Role-Based Access**: Login with roles (Clinician, Medical Scientist, Commercial, Admin)
- **Evaluator Mode**: Designated evaluators can approve/correct tags
- **Ground Truth Comparison**: Compare AI predictions against expert-labeled data
- **Dark/Light Mode**: Modern React UI with theme switching
- **Real-time Metrics**: Track AI accuracy and precision

---

## AI-Extracted Labels

The system extracts **10 labels** from each medical insight using Azure OpenAI:

| # | Label | Description | Example Values |
|---|-------|-------------|----------------|
| 1 | `asset` | BI compound code | BI-291984, BI-334219, BI-671290 |
| 2 | `sentiment` | Overall tone of insight | Positive, Negative, Neutral, Mixed |
| 3 | `insight_type` | Nature of the insight | Data Request, Feedback, Concern, Question, Recommendation, Objection |
| 4 | `topic` | Main discussion subject | Efficacy, Safety, Tolerability, Dosing, Access, Differentiation, Evidence, Biomarker |
| 5 | `stakeholder` | Who provided the insight | KOL, Investigator, Site Coordinator, MSL, Payer, HCP, Medical Director, Regulatory |
| 6 | `si_id` | Strategic Imperative | SI-01 to SI-05 |
| 7 | `csf_id` | Critical Success Factor | ONC-CSF-01, OL-CSF-02, etc. |
| 8 | `source_channel` | How insight was collected | Field Visit, Advisory Board, Conference, Email, Call, Meeting |
| 9 | `evidence_gap` | What data/evidence is missing | RWE, Head-to-head, Long-term, Subgroup, Biomarker, Comparative, None |
| 10 | `action_required` | Next step needed | Follow-up, Data Generation, Internal Review, Escalate, None |

### Strategic Imperatives (SI)

| ID | Name |
|----|------|
| SI-01 | Establish Scientific Leadership & Evidence Generation |
| SI-02 | Accelerate Access & Address Unmet Patient Need |
| SI-03 | Strengthen HCP & KOL Engagement Ecosystem |
| SI-04 | Drive Differentiated Value Proposition vs. Competition |
| SI-05 | Enable Sustainable Patient Access & Affordability |

---

---

## RAG (Retrieval-Augmented Generation)

RAG enhances LLM responses by retrieving relevant context from your indexed insights before generating answers. This grounds AI responses in actual data and improves accuracy.

### How RAG Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                                      │
└─────────────────────────────────────────────────────────────────────────┘

  User Query              Vector Search             LLM Generation
  ──────────              ─────────────             ──────────────
                                         
  "What are the main     ────► TF-IDF Index        
   efficacy concerns?"         finds top-k                
                               similar insights            
                                    │                       
                                    ▼                       
                          ┌──────────────────┐              
                          │ Retrieved        │              
                          │ Insights (1-10)  │              
                          └────────┬─────────┘              
                                   │                        
                                   ▼                        
                          ┌──────────────────┐      ┌─────────────┐
                          │  Azure OpenAI    │ ───► │  Grounded   │
                          │  + Context       │      │  Response   │
                          └──────────────────┘      └─────────────┘
```

### RAG Features

| Feature | Description |
|---------|-------------|
| **Ask Questions** | Natural language Q&A grounded in actual insight data |
| **Topic Analysis** | Analyze trends and patterns across similar insights |
| **Compare Insights** | Find similar insights and analyze relationships |

### RAG Use Cases

1. **Intelligent Q&A**: "What are KOLs saying about drug efficacy in oncology?"
2. **Trend Analysis**: Summarize all insights about "patient access barriers"
3. **Pattern Discovery**: Find similar insights and identify common themes
4. **Evidence-Based Summaries**: Generate reports grounded in real data

### RAG-Enhanced Tagging & Personas

RAG is integrated into the core tagging and persona generation workflows:

**Tagging with RAG:**
```
New Insight → Find similar TAGGED insights → 
              Include as examples in prompt → 
              LLM generates consistent tags
```

**Persona Generation with RAG:**
```
New Insight → Find similar PERSONA summaries → 
              Include as style examples → 
              LLM generates consistent summaries
```

This ensures consistency across similar insights and reduces classification errors.

### RAG API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/query` | POST | Ask questions with context retrieval |
| `/api/rag/summarize-topic` | POST | Analyze and summarize a topic |
| `/api/rag/compare` | POST | Find and compare similar insights |

---

## Human-in-the-Loop (HITL) Learning

The system learns from human corrections to improve future predictions. When evaluators correct AI-generated tags, these corrections are stored and used as learning examples.

### How HITL Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HUMAN-IN-THE-LOOP LEARNING CYCLE                          │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: Initial Tagging
─────────────────────────
    New Insight                    LLM (Azure OpenAI)
    ───────────                    ─────────────────
    "KOL concerned about     →     Generates 10 labels:
     patient access to            - topic: Efficacy ❌ (wrong)
     drug in rural areas"         - sentiment: Negative ✓
                                  
PHASE 2: Human Review & Correction
──────────────────────────────────
    Evaluator reviews          →   Saves to tag_corrections table:
    "This is about Access,         ┌─────────────────────────────────┐
     not Efficacy"                 │ field: topic                    │
                                   │ original: Efficacy              │
                                   │ corrected: Access               │
                                   │ reason: "Rural access = Access" │
                                   └─────────────────────────────────┘

PHASE 3: Learning from Corrections
──────────────────────────────────
    Next similar insight           System retrieves:
    ────────────────────           ─────────────────
    "HCP frustrated with      →    1. Similar tagged insights (RAG)
     medication availability       2. Relevant CORRECTIONS (HITL)
     in remote regions"           
                                        ↓
                                   
    LLM Prompt includes:
    ┌──────────────────────────────────────────────────────────────────┐
    │ CORRECTION EXAMPLES (learn from human feedback):                 │
    │ - Insight: "KOL concerned about patient access..."              │
    │   AI predicted: topic=Efficacy ❌                                │
    │   Human corrected: topic=Access ✓                               │
    │   Reason: "Rural/remote access = Access topic"                   │
    │                                                                  │
    │ APPLY THESE LEARNINGS to avoid similar mistakes.                 │
    └──────────────────────────────────────────────────────────────────┘
                                        ↓
                                        
    LLM Output (improved):
    - topic: Access ✓  (learned from correction!)
```

### HITL Benefits

| Benefit | Description |
|---------|-------------|
| **Continuous Improvement** | Model gets better over time without fine-tuning |
| **Domain Adaptation** | Learns organization-specific terminology |
| **Error Reduction** | Same mistakes are not repeated |
| **Transparent Learning** | Corrections explain WHY to change |

### HITL Data Flow

```
                    ┌─────────────┐
                    │  New Insight │
                    └──────┬──────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │     RETRIEVAL LAYER          │
            │                              │
            │  1. Similar tagged insights  │
            │  2. Relevant corrections     │◄── Human feedback
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │      CONTEXT BUILDING        │
            │                              │
            │  Examples + Corrections +    │
            │  "Avoid these mistakes"      │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │     AZURE OPENAI (LLM)       │
            │                              │
            │  Generates tags with         │
            │  learned corrections         │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   IMPROVED PREDICTIONS       │
            │  (Accuracy increases)        │
            └──────────────────────────────┘
```

### Evaluator Workflow

1. **Login** as Evaluator (checkbox during signup)
2. **Review** AI-generated tags on Review page
3. **Correct** mistakes with explanation
4. **System learns** from corrections automatically
5. **Future tags** benefit from your feedback

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + Python |
| Database | SQLite |
| Vector Store | TF-IDF (scikit-learn) |
| LLM | Azure OpenAI (GPT-4o-mini) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
capstone2req/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Card.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tagging.jsx
│   │   │   ├── Review.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Personas.jsx
│   │   │   ├── RAG.jsx
│   │   │   └── Metrics.jsx
│   │   ├── api.js             # API client
│   │   ├── App.jsx            # Main app with routing
│   │   └── index.css          # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   └── main.py                # FastAPI server
├── data/
│   ├── insights_data.csv      # Medical insights (input)
│   ├── taxonomy_si.csv        # Strategic Imperatives
│   ├── taxonomy_csf.csv       # Critical Success Factors
│   ├── data_dictionary.csv    # Field definitions
│   ├── medical_insights.db    # SQLite database (auto-created)
│   └── chroma_store/          # ChromaDB vectors (auto-created)
├── config.py                  # Configuration settings
├── database.py                # SQLite operations
├── llm_service.py             # Azure OpenAI integration
├── vector_store.py            # ChromaDB vector store
├── taxonomy_tagger.py         # 10-label extraction logic
├── persona_generator.py       # Persona summary generation
├── rag_service.py             # RAG (Retrieval-Augmented Generation)
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── .env.example               # Example environment file
```

---

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn
- Azure OpenAI API access

### 1. Clone and Setup

```bash
cd capstone2req
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Azure OpenAI

Edit `.env` file with your credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# Database Configuration
DATABASE_PATH=data/medical_insights.db

# ChromaDB Vector Store
CHROMA_PERSIST_DIR=data/chroma_store
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

### 5. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
python main.py
```
Backend runs at: http://localhost:8000

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

  CSV Files                         SQLite                    UI Display
  ──────────                        ──────                    ──────────
                                         
  insights_data.csv ────► insights table                      
                              │                               
                              ▼                               
                    ┌──────────────────┐                      
                    │  Azure OpenAI    │                      
                    │  GPT-4 Model     │                      
                    └────────┬─────────┘                      
                              │                               
                              ▼                               
                    ┌──────────────────┐      ┌─────────────┐
                    │  insight_tags    │ ───► │  Tagging    │
                    │  (10 labels)     │      │  Page       │
                    └──────────────────┘      └─────────────┘
                              │                               
                              ▼                               
                    ┌──────────────────┐      ┌─────────────┐
                    │  Human Review    │ ───► │  Review     │
                    │  & Corrections   │      │  Page       │
                    └──────────────────┘      └─────────────┘
                              │                               
                              ▼                               
                    ┌──────────────────┐      ┌─────────────┐
                    │  Accuracy        │ ───► │  Metrics    │
                    │  Calculation     │      │  Page       │
                    └──────────────────┘      └─────────────┘
```

### Step-by-Step:

1. **Load Data**: CSV files loaded into SQLite on app startup
2. **Tag Insights**: Click "Start Batch Tagging" → AI extracts 10 labels
3. **Review Labels**: Human reviewers verify or correct AI-generated labels
4. **Track Accuracy**: Precision calculated based on corrections
5. **Search**: Build vector index for semantic search
6. **Personas**: Generate 3 audience-specific summaries

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights` | GET | Get all insights |
| `/api/tags` | GET | Get all tags with 10 labels |
| `/api/tags/batch` | POST | Run AI tagging on all insights |
| `/api/tags/single` | POST | Tag single insight |
| `/api/tags/verify` | POST | Mark tag as verified |
| `/api/tags/correct` | POST | Save label corrections |
| `/api/label-options` | GET | Get valid values for each label |
| `/api/summary` | GET | Get tagging statistics |
| `/api/metrics` | GET | Get accuracy metrics |
| `/api/distributions` | GET | Get label distributions |
| `/api/search` | POST | Semantic search |
| `/api/search/build-index` | POST | Build vector index |
| `/api/personas/{id}` | GET | Get persona summaries |
| `/api/rag/query` | POST | RAG: Ask questions with context |
| `/api/rag/summarize-topic` | POST | RAG: Analyze and summarize topic |
| `/api/rag/compare` | POST | RAG: Compare similar insights |
| `/api/ground-truth/export-template` | GET | Export CSV template for labeling |
| `/api/ground-truth/compare` | POST | Compare AI vs ground truth |

---

## UI Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview statistics, charts, recent insights |
| **Taxonomy Tagging** | Run AI to extract 10 labels from insights |
| **Review & Correct** | Verify labels, make corrections with reasons |
| **Search** | Semantic search using natural language |
| **Personas** | Generate Clinician/Scientist/Commercial summaries |
| **RAG Assistant** | Ask questions, analyze topics, compare insights using RAG |
| **Metrics** | Track AI accuracy, ground truth comparison, correction history |

---

## Input Data Format

### insights_data.csv

| Column | Description |
|--------|-------------|
| insight_id | Unique identifier (CDO-100001) |
| persona | Role type (Clinical, Medical) |
| created_date | Timestamp |
| therapeutic_area | Oncology, O&L |
| disease_state | Pancreatic cancer, NAFLD, etc. |
| region_ro | MEA, NAR, EUCAN |
| country_code | AE, CA, NL, FR, US |
| description | Unstructured insight text |

### taxonomy_si.csv

| Column | Description |
|--------|-------------|
| si_id | SI-01 to SI-05 |
| si_name | Strategic Imperative name |
| si_description | Full description |

### taxonomy_csf.csv

| Column | Description |
|--------|-------------|
| csf_id | ONC-CSF-01, OL-CSF-01, etc. |
| therapeutic_area | Oncology, O&L |
| csf_name | Critical Success Factor name |
| parent_si_id | Links to SI |
| parent_si_name | Parent SI name |

---

## Deliverables Checklist

- [x] Modern React UI with dark/light mode
- [x] 10-label AI extraction from insights
- [x] Taxonomy tagging (SI + CSF)
- [x] Accuracy/precision metrics with formula
- [x] Searchable TF-IDF vector store
- [x] Human review/correction workflow
- [x] Three persona-specific summaries
- [x] Label distribution analytics
- [x] RAG (Retrieval-Augmented Generation)
- [x] Ground truth comparison for accuracy measurement
- [x] Incremental batch processing (skip already tagged)

---

## Development

```bash
# Run backend in development (auto-reload)
cd backend && uvicorn main:app --reload --port 8000

# Run frontend in development (hot reload)
cd frontend && npm run dev
```

---

## License

MIT License - Capstone Project 2024
