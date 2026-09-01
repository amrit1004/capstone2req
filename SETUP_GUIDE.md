# Setup Guide - Medical Insights Engine

Complete guide for setting up the project on a new machine and using your own data.

---

## Part 1: New Machine Setup

### Step 1: Prerequisites

Install the following software:

| Software | Version | Download Link |
|----------|---------|---------------|
| Python | 3.9+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| Git | Latest | https://git-scm.com/downloads |

Verify installations:
```bash
python --version
node --version
npm --version
git --version
```

### Step 2: Clone/Copy Project

**Option A - From Git:**
```bash
git clone <your-repo-url>
cd capstone2req
```

**Option B - Copy folder:**
Copy the entire `capstone2req` folder to your new machine.

### Step 3: Install Python Dependencies

```bash
cd capstone2req
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 5: Configure Azure OpenAI

1. Open `.env` file in the project root
2. Update with your Azure OpenAI credentials:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-actual-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=your-gpt4-deployment-name
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=your-embedding-deployment-name
```

### Step 6: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 7: Access the App

Open browser: http://localhost:5173

---

## Part 2: Using Your Own Data

### Step 1: Prepare Your CSV Files

Export your Excel sheets to CSV format with these exact structures:

#### File 1: `data/insights_data.csv`

| Column Name | Required | Description |
|-------------|----------|-------------|
| Insight_ID | Yes | Unique ID (e.g., CDO-100001) |
| Persona | Yes | Clinical, Medical |
| CreatedDate | Yes | Date timestamp |
| TherapeuticArea | Yes | Oncology, O&L, etc. |
| DiseaseState | Yes | Disease name |
| Region_RO | Yes | MEA, NAR, EUCAN |
| CountryCode | Yes | Country code (AE, US, etc.) |
| Description | Yes | The insight text (this is what AI analyzes) |

**Example row:**
```csv
Insight_ID,Persona,CreatedDate,TherapeuticArea,DiseaseState,Region_RO,CountryCode,Description
CDO-100001,Clinical,2024-03-30 18:27:02,Oncology,Pancreatic cancer,MEA,AE,"A site coordinator requested additional fatigue data for BI-291984..."
```

#### File 2: `data/taxonomy_si.csv`

| Column Name | Required | Description |
|-------------|----------|-------------|
| SI_ID | Yes | SI-01, SI-02, etc. |
| SI_Name | Yes | Strategic Imperative name |
| SI_Description | Yes | Full description |

**Example:**
```csv
SI_ID,SI_Name,SI_Description
SI-01,Establish Scientific Leadership & Evidence Generation,"Build recognized scientific leadership..."
```

#### File 3: `data/taxonomy_csf.csv`

| Column Name | Required | Description |
|-------------|----------|-------------|
| CSF_ID | Yes | ONC-CSF-01, OL-CSF-01, etc. |
| Therapeutic_Area | Yes | Must match TherapeuticArea in insights |
| CSF_Name | Yes | Critical Success Factor name |
| Parent_SI_ID | Yes | Links to SI (SI-01, SI-02, etc.) |
| Parent_SI_Name | Yes | Parent SI name |

**Example:**
```csv
CSF_ID,Therapeutic_Area,CSF_Name,Parent_SI_ID,Parent_SI_Name
ONC-CSF-01,Oncology,KOLs understand mechanism-of-action differentiation,SI-01,Establish Scientific Leadership & Evidence Generation
```

### Step 2: Export from Excel

1. Open your Excel file
2. Go to each sheet (Insights_Data, Taxonomy_SI, Taxonomy_CSF)
3. File → Save As → CSV UTF-8 (Comma delimited)
4. Save with exact names:
   - `insights_data.csv`
   - `taxonomy_si.csv`
   - `taxonomy_csf.csv`

### Step 3: Replace Data Files

1. Navigate to `capstone2req/data/` folder
2. Delete or backup existing CSV files
3. Copy your new CSV files here
4. **Delete the old database** (important!):
   ```bash
   # Windows
   del data\medical_insights.db
   
   # Mac/Linux
   rm data/medical_insights.db
   ```

### Step 4: Delete Old Vector Store (if exists)

```bash
# Windows
rmdir /s /q data\chroma_store

# Mac/Linux
rm -rf data/chroma_store
```

### Step 5: Restart the Application

1. Stop both servers (Ctrl+C)
2. Start backend again:
   ```bash
   cd backend
   python main.py
   ```
3. Start frontend again:
   ```bash
   cd frontend
   npm run dev
   ```

The app will automatically:
- Create new SQLite database
- Load your CSV data
- Be ready for tagging

---

## Part 3: Using the Application

### Workflow Steps:

1. **Dashboard** - View overview and statistics

2. **Taxonomy Tagging**
   - Click "Start Batch Tagging"
   - AI will extract 10 labels from each insight
   - Wait for completion

3. **Review & Correct**
   - Enter your name as reviewer
   - Review each insight's labels
   - Click "Approve All" if correct
   - Click "Edit" to make corrections
   - Provide reason for corrections

4. **Search** (Optional)
   - Click "Build Index" first
   - Then search using natural language

5. **Personas** (Optional)
   - Select an insight
   - Click "View Summaries" to see 3 versions

6. **Metrics**
   - View accuracy/precision scores
   - See correction history

---

## Troubleshooting

### Issue: "Module not found" error
```bash
pip install -r requirements.txt
```

### Issue: "Port already in use"
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Issue: Database errors after changing data
```bash
# Delete database and restart
del data\medical_insights.db
# Then restart backend
```

### Issue: API key error
- Check `.env` file has correct Azure OpenAI credentials
- Ensure no extra spaces in the values
- Verify your Azure deployment names are correct

### Issue: Frontend not loading
```bash
cd frontend
npm install
npm run dev
```

### Issue: CORS errors
- Make sure backend is running on port 8000
- Make sure frontend is running on port 5173

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `.env` | Azure OpenAI credentials |
| `data/*.csv` | Input data files |
| `data/medical_insights.db` | SQLite database |
| `data/chroma_store/` | Vector embeddings |

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### Commands

| Action | Command |
|--------|---------|
| Start Backend | `cd backend && python main.py` |
| Start Frontend | `cd frontend && npm run dev` |
| Install Python deps | `pip install -r requirements.txt` |
| Install Node deps | `cd frontend && npm install` |

---

## Data Column Name Mapping

If your Excel has different column names, rename them to match:

| Your Column Name | Required Name |
|------------------|---------------|
| Insight ID | Insight_ID |
| Created Date | CreatedDate |
| Therapeutic Area | TherapeuticArea |
| Disease State | DiseaseState |
| Region | Region_RO |
| Country | CountryCode |
| Description / Notes | Description |

**Important:** Column names are case-sensitive in the code. Follow the exact naming.

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify all prerequisites are installed
3. Ensure CSV files have correct column names
4. Check Azure OpenAI credentials in `.env`
