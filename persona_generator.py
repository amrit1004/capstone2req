"""
Persona-specific Summary Generator for Medical Insights Engine
OPTIMIZED: Generates all 3 personas in ONE API call + parallel processing
"""
import json
import database
import config
from openai import AzureOpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed


def get_client():
    """Get Azure OpenAI client."""
    return AzureOpenAI(
        api_key=config.AZURE_OPENAI_API_KEY,
        api_version=config.AZURE_OPENAI_API_VERSION,
        azure_endpoint=config.AZURE_OPENAI_ENDPOINT
    )


def generate_all_personas_single_call(insight_text: str, tags: dict = None) -> dict:
    """Generate all 3 persona summaries in ONE API call."""
    client = get_client()

    tag_context = ""
    if tags:
        tag_context = f"""
Context:
- Topic: {tags.get('topic', 'N/A')}
- Sentiment: {tags.get('sentiment', 'N/A')}
- Stakeholder: {tags.get('stakeholder', 'N/A')}
- Strategic Imperative: {tags.get('si_name', 'N/A')}
"""

    prompt = f"""Generate 3 different summaries of this medical insight, each tailored for a specific audience.

INSIGHT:
{insight_text}
{tag_context}

Generate summaries for these 3 personas:

1. CLINICIAN: A practicing physician focused on patient care, treatment decisions, and clinical outcomes.
2. MEDICAL_SCIENTIST: A researcher focused on scientific evidence, mechanisms, data gaps, and research opportunities.
3. COMMERCIAL: A business professional focused on market positioning, competitive landscape, and strategic value.

Respond in JSON format:
{{
    "clinician": "2-3 sentence summary for clinicians...",
    "medical_scientist": "2-3 sentence summary for medical scientists...",
    "commercial": "2-3 sentence summary for commercial team..."
}}

Each summary should emphasize aspects most relevant to that audience. Use appropriate terminology."""

    response = client.chat.completions.create(
        model=config.AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": "You are a medical communications expert. Respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_completion_tokens=600
    )

    try:
        content = response.choices[0].message.content
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(content[start:end])
    except:
        pass

    return {
        "clinician": "Error generating summary",
        "medical_scientist": "Error generating summary",
        "commercial": "Error generating summary"
    }


def generate_summaries_for_insight(insight_id: str) -> dict:
    """Generate all three persona summaries for an insight (single API call)."""
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        return {"error": "Insight not found"}

    # Get tags for context
    tags_df = database.get_insight_tags(insight_id)
    tags = tags_df.iloc[0].to_dict() if not tags_df.empty else None

    # Generate all 3 in one call
    all_summaries = generate_all_personas_single_call(
        insight_text=str(insight.get('description', '')),
        tags=tags
    )

    summaries = {}
    persona_mapping = {
        'clinician': config.PERSONAS.get('clinician', {'name': 'Clinician'}),
        'medical_scientist': config.PERSONAS.get('medical_scientist', {'name': 'Medical Scientist'}),
        'commercial': config.PERSONAS.get('commercial', {'name': 'Commercial'})
    }

    for persona_key, summary_text in all_summaries.items():
        persona_info = persona_mapping.get(persona_key, {'name': persona_key})

        # Save to database
        database.save_persona_summary(
            insight_id=insight_id,
            persona_type=persona_key,
            summary=summary_text
        )

        summaries[persona_key] = {
            'persona_name': persona_info.get('name', persona_key),
            'summary': summary_text
        }

    return summaries


def _generate_worker(insight_id: str) -> dict:
    """Worker function for parallel processing."""
    try:
        generate_summaries_for_insight(insight_id)
        return {'insight_id': insight_id, 'status': 'success'}
    except Exception as e:
        return {'insight_id': insight_id, 'status': 'failed', 'error': str(e)}


def generate_all_summaries(progress_callback=None, max_workers=10) -> dict:
    """Generate persona summaries for all insights using parallel processing."""
    insights_df = database.get_all_insights()
    total = len(insights_df)
    insight_ids = insights_df['insight_id'].tolist()

    results = {
        'total': total,
        'success': 0,
        'failed': 0
    }

    completed = 0
    print(f"Starting parallel persona generation with {max_workers} workers...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_id = {executor.submit(_generate_worker, iid): iid for iid in insight_ids}

        for future in as_completed(future_to_id):
            completed += 1
            result = future.result()

            if result['status'] == 'success':
                results['success'] += 1
                print(f"Generated {completed}/{total}: {result['insight_id']} - SUCCESS")
            else:
                results['failed'] += 1
                print(f"Generated {completed}/{total}: {result['insight_id']} - FAILED: {result.get('error')}")

            if progress_callback:
                progress_callback(completed, total)

    return results


def get_summaries_for_display(insight_id: str) -> dict:
    """Get stored summaries for display, or generate if missing."""
    summaries_df = database.get_persona_summaries(insight_id)

    if summaries_df.empty:
        return generate_summaries_for_insight(insight_id)

    result = {}
    for _, row in summaries_df.iterrows():
        persona_key = row['persona_type']
        persona_info = config.PERSONAS.get(persona_key, {})
        result[persona_key] = {
            'persona_name': persona_info.get('name', persona_key),
            'summary': row['summary'],
            'generated_at': row['generated_at']
        }

    return result


def compare_persona_summaries(insight_id: str) -> dict:
    """Get a comparison view of all persona summaries."""
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        return {"error": "Insight not found"}

    summaries = get_summaries_for_display(insight_id)

    return {
        'insight_id': insight_id,
        'original_text': insight.get('description', ''),
        'therapeutic_area': insight.get('therapeutic_area', ''),
        'disease_state': insight.get('disease_state', ''),
        'summaries': summaries
    }
