"""
FastAPI Backend for Medical Insights Engine
"""
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import io

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
    try:
        print("Initializing database...")
        database.init_database()
        print("Loading CSV data...")
        database.load_csv_data()
        print("Database ready!")
    except Exception as e:
        print(f"ERROR during startup: {e}")
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Tagging failed: {str(e)}")


@app.post("/api/tags/batch")
async def tag_all_insights():
    """Tag all insights."""
    try:
        results = taxonomy_tagger.tag_all_insights()
        return {"success": True, "results": results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch tagging failed: {str(e)}")


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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error building index: {str(e)}")


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


# ============ GROUND TRUTH COMPARISON ============

LABEL_COLUMNS = ['asset', 'sentiment', 'insight_type', 'topic', 'stakeholder',
                 'si_id', 'csf_id', 'source_channel', 'evidence_gap', 'action_required']


@app.get("/api/ground-truth/export-template")
async def export_ground_truth_template(limit: int = 100, random: bool = True):
    """Export CSV template for ground truth labeling."""
    try:
        insights_df = database.get_all_insights()

        # Take sample - random or first N
        if random and len(insights_df) > limit:
            sample_df = insights_df.sample(n=limit, random_state=42)[['insight_id']].copy()
            sample_df = sample_df.reset_index(drop=True)
            descriptions = insights_df.set_index('insight_id').loc[sample_df['insight_id'], 'description'].values
        else:
            sample_df = insights_df.head(limit)[['insight_id']].copy()
            descriptions = insights_df.head(limit)['description'].values

        # Add empty columns for labels
        for col in LABEL_COLUMNS:
            sample_df[col] = ''

        # Add description for reference
        sample_df['description_reference'] = descriptions

        # Convert to CSV
        output = io.StringIO()
        sample_df.to_csv(output, index=False)
        output.seek(0)

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ground_truth_template.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ground-truth/compare")
async def compare_ground_truth(file: UploadFile = File(...)):
    """Upload ground truth CSV and compare with AI predictions."""
    try:
        # Read uploaded CSV
        contents = await file.read()
        ground_truth_df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        # Get AI tags
        ai_tags_df = database.get_insight_tags()

        if ai_tags_df.empty:
            raise HTTPException(status_code=400, detail="No AI tags found. Run tagging first.")

        # Merge on insight_id
        merged = ground_truth_df.merge(
            ai_tags_df,
            on='insight_id',
            suffixes=('_gt', '_ai'),
            how='inner'
        )

        if merged.empty:
            raise HTTPException(status_code=400, detail="No matching insight IDs found between ground truth and AI tags.")

        # Calculate accuracy per label
        results = {
            'total_compared': len(merged),
            'label_accuracy': {},
            'overall_accuracy': 0,
            'confusion_details': [],
            'mismatches': []
        }

        total_correct = 0
        total_labels = 0

        for label in LABEL_COLUMNS:
            gt_col = f"{label}_gt" if f"{label}_gt" in merged.columns else label
            ai_col = f"{label}_ai" if f"{label}_ai" in merged.columns else label

            if gt_col not in merged.columns or ai_col not in merged.columns:
                continue

            # Count matches (case-insensitive, ignore empty)
            matches = 0
            comparisons = 0

            for _, row in merged.iterrows():
                gt_val = str(row.get(gt_col, '')).strip().lower()
                ai_val = str(row.get(ai_col, '')).strip().lower()

                # Skip if ground truth is empty
                if gt_val and gt_val != 'nan':
                    comparisons += 1
                    if gt_val == ai_val:
                        matches += 1
                    else:
                        # Record mismatch
                        if len(results['mismatches']) < 50:  # Limit to 50
                            results['mismatches'].append({
                                'insight_id': row['insight_id'],
                                'label': label,
                                'ground_truth': row.get(gt_col, ''),
                                'ai_prediction': row.get(ai_col, '')
                            })

            if comparisons > 0:
                accuracy = (matches / comparisons) * 100
                results['label_accuracy'][label] = {
                    'accuracy': round(accuracy, 2),
                    'correct': matches,
                    'total': comparisons
                }
                total_correct += matches
                total_labels += comparisons

        if total_labels > 0:
            results['overall_accuracy'] = round((total_correct / total_labels) * 100, 2)

        return results

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error comparing: {str(e)}")


@app.get("/api/ground-truth/sample")
async def get_sample_ground_truth():
    """Get sample ground truth data for reference."""
    try:
        sample_path = Path("data/ground_truth_sample.csv")
        if sample_path.exists():
            df = pd.read_csv(sample_path)
            return {"sample": df.to_dict('records')}
        return {"sample": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
