"""
FastAPI Backend for Medical Insights Engine
"""
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Set working directory to project root
PROJECT_ROOT = Path(__file__).parent.parent
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT))

import database
import taxonomy_tagger
import persona_generator
import vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    database.init_database()
    database.load_csv_data()
    yield
    # Shutdown
    pass


app = FastAPI(title="Medical Insights Engine API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class TagRequest(BaseModel):
    insight_id: str

class CorrectionRequest(BaseModel):
    insight_id: str
    corrections: Dict[str, str]
    reason: str
    corrected_by: str

class VerifyRequest(BaseModel):
    insight_id: str
    verified_by: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Medical Insights Engine API is running"}


@app.get("/api/insights")
async def get_insights():
    """Get all insights."""
    df = database.get_all_insights()
    return {"insights": df.to_dict('records')}


@app.get("/api/insights/{insight_id}")
async def get_insight(insight_id: str):
    """Get single insight by ID."""
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"insight": insight.to_dict()}


@app.get("/api/taxonomy/si")
async def get_taxonomy_si():
    """Get all Strategic Imperatives."""
    df = database.get_taxonomy_si()
    return {"taxonomy_si": df.to_dict('records')}


@app.get("/api/taxonomy/csf")
async def get_taxonomy_csf(therapeutic_area: Optional[str] = None):
    """Get Critical Success Factors."""
    df = database.get_taxonomy_csf(therapeutic_area)
    return {"taxonomy_csf": df.to_dict('records')}


@app.get("/api/label-options")
async def get_label_options():
    """Get valid options for each label."""
    return taxonomy_tagger.get_label_options()


@app.get("/api/tags")
async def get_all_tags():
    """Get all insight tags."""
    df = database.get_insight_tags()
    return {"tags": df.to_dict('records')}


@app.get("/api/tags/{insight_id}")
async def get_insight_tag(insight_id: str):
    """Get tags for a specific insight."""
    df = database.get_insight_tags(insight_id)
    if df.empty:
        return {"tag": None}
    return {"tag": df.iloc[0].to_dict()}


@app.post("/api/tags/single")
async def tag_single_insight(request: TagRequest):
    """Tag a single insight."""
    try:
        result = taxonomy_tagger.tag_single_insight(request.insight_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tags/batch")
async def tag_all_insights():
    """Tag all insights."""
    try:
        results = taxonomy_tagger.tag_all_insights()
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tags/verify")
async def verify_tag(request: VerifyRequest):
    """Verify a tag."""
    try:
        database.verify_tag(request.insight_id, request.verified_by)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tags/correct")
async def correct_tag(request: CorrectionRequest):
    """Save corrections for multiple fields."""
    try:
        database.save_bulk_correction(
            insight_id=request.insight_id,
            corrections=request.corrections,
            reason=request.reason,
            corrected_by=request.corrected_by
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/summary")
async def get_tagging_summary():
    """Get tagging summary statistics."""
    try:
        summary = taxonomy_tagger.get_tagging_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics")
async def get_accuracy_metrics():
    """Get accuracy metrics."""
    try:
        metrics = database.get_accuracy_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/distributions")
async def get_label_distributions():
    """Get distribution of each label."""
    try:
        distributions = database.get_label_distribution()
        return distributions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search/build-index")
async def build_search_index():
    """Build vector search index."""
    try:
        store = vector_store.build_vector_store()
        return {"success": True, "index_size": store.get_index_size()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search")
async def search_insights(request: SearchRequest):
    """Search insights."""
    try:
        store = vector_store.get_vector_store()
        if store.get_index_size() == 0:
            raise HTTPException(status_code=400, detail="Vector index is empty. Build index first.")

        results = store.search(request.query, request.top_k)

        # Enrich with insight data
        enriched_results = []
        for r in results:
            insight = database.get_insight_by_id(r['insight_id'])
            if insight is not None:
                enriched_results.append({
                    **r,
                    'insight': insight.to_dict()
                })

        return {"results": enriched_results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/personas/generate/{insight_id}")
async def generate_persona_summaries(insight_id: str):
    """Generate persona summaries for an insight."""
    try:
        summaries = persona_generator.generate_summaries_for_insight(insight_id)
        return {"success": True, "summaries": summaries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/personas/generate-all")
async def generate_all_persona_summaries():
    """Generate persona summaries for all insights."""
    try:
        results = persona_generator.generate_all_summaries()
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/personas/{insight_id}")
async def get_persona_summaries(insight_id: str):
    """Get persona summaries for an insight."""
    try:
        comparison = persona_generator.compare_persona_summaries(insight_id)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
