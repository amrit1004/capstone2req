"""
Persona-specific Summary Generator for Medical Insights Engine
OPTIMIZED: Generates all 3 personas in ONE API call + parallel processing
RAG-ENHANCED: Retrieves similar persona summaries as examples for consistency
"""
import json
import database
import config
import vector_store
from openai import AzureOpenAI
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.logger import get_logger

logger = get_logger(__name__)


def get_client():
    """Get Azure OpenAI client."""
    return AzureOpenAI(
        api_key=config.AZURE_OPENAI_API_KEY,
        api_version=config.AZURE_OPENAI_API_VERSION,
        azure_endpoint=config.AZURE_OPENAI_ENDPOINT
    )


import time

def retrieve_similar_persona_examples(insight_text: str, top_k: int = 2) -> str:
    """
    RAG: Retrieve similar insights with persona summaries as examples.
    """
    try:
        store = vector_store.get_vector_store()
        if store.get_index_size() == 0:
            return ""

        search_results = store.search(insight_text, top_k + 3)

        examples = []
        for result in search_results:
            if len(examples) >= top_k:
                break

            insight_id = result['insight_id']

            # Get persona summaries for this insight
            summaries_df = database.get_persona_summaries(insight_id)
            if summaries_df.empty:
                continue

            # Get insight
            insight = database.get_insight_by_id(insight_id)
            if insight is None:
                continue

            # Format summaries
            persona_texts = {}
            for _, row in summaries_df.iterrows():
                persona_texts[row['persona_type']] = row['summary']

            if len(persona_texts) >= 3:
                examples.append({
                    'description': insight.get('description', '')[:200],
                    'clinician': persona_texts.get('clinician', ''),
                    'medical_scientist': persona_texts.get('medical_scientist', ''),
                    'commercial': persona_texts.get('commercial', '')
                })

        if not examples:
            return ""

        example_text = "\n\nSIMILAR INSIGHTS WITH PERSONA SUMMARIES (use as reference for style):\n"
        for i, ex in enumerate(examples, 1):
            example_text += f"""
Example {i}:
Insight: {ex['description']}...
- Clinician summary: {ex['clinician'][:150]}...
- Medical Scientist summary: {ex['medical_scientist'][:150]}...
- Commercial summary: {ex['commercial'][:150]}...
"""
        return example_text

    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return ""


def retry_on_error(func, max_retries=3, delay=2):
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            logger.warning(f"Retry {attempt + 1}/{max_retries} after error: {e}")
            time.sleep(delay * (attempt + 1))


def generate_all_personas_single_call(insight_text: str, tags: dict = None, rag_context: str = "") -> dict:
    """Generate all 3 persona summaries in ONE API call. RAG-enhanced with examples."""
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
{rag_context}

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

    llm_settings = config.get_llm_settings("personas")

    def make_request():
        return client.chat.completions.create(
            model=config.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a medical communications expert. Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=llm_settings["temperature"],
            max_completion_tokens=llm_settings["max_tokens"]
        )

    response = retry_on_error(make_request)

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


def generate_summaries_for_insight(insight_id: str, use_rag: bool = True) -> dict:
    """
    Generate all three persona summaries for an insight (single API call).
    RAG-Enhanced: Retrieves similar persona summaries as examples for consistency.
    """
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        return {"error": "Insight not found"}

    insight_text = str(insight.get('description', ''))

    # Get tags for context
    tags_df = database.get_insight_tags(insight_id)
    tags = tags_df.iloc[0].to_dict() if not tags_df.empty else None

    # RAG: Retrieve similar persona examples
    rag_context = ""
    if use_rag:
        rag_context = retrieve_similar_persona_examples(insight_text, top_k=2)
        if rag_context:
            logger.debug(f"RAG: Found persona examples for {insight_id}")

    # Generate all 3 in one call
    all_summaries = generate_all_personas_single_call(
        insight_text=insight_text,
        tags=tags,
        rag_context=rag_context
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


def generate_all_summaries(progress_callback=None, max_workers=10, limit=None, skip_generated=False) -> dict:
    """Generate persona summaries using parallel processing. Optionally limit count and skip generated."""
    insights_df = database.get_all_insights()

    # Skip already generated insights if requested
    if skip_generated:
        summaries_df = database.get_persona_summaries()
        generated_ids = set(summaries_df['insight_id'].tolist()) if not summaries_df.empty else set()
        insights_df = insights_df[~insights_df['insight_id'].isin(generated_ids)]
        logger.info(f"Skipping {len(generated_ids)} already generated insights")

    # Apply limit if specified
    if limit and limit > 0:
        insights_df = insights_df.head(limit)

    total = len(insights_df)
    insight_ids = insights_df['insight_id'].tolist()

    results = {
        'total': total,
        'success': 0,
        'failed': 0
    }

    completed = 0
    logger.info(f"Starting persona generation with {max_workers} workers")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_id = {executor.submit(_generate_worker, iid): iid for iid in insight_ids}

        for future in as_completed(future_to_id):
            completed += 1
            result = future.result()

            if result['status'] == 'success':
                results['success'] += 1
                logger.info(f"Generated {completed}/{total}: {result['insight_id']} - SUCCESS")
            else:
                results['failed'] += 1
                logger.warning(f"Generated {completed}/{total}: {result['insight_id']} - FAILED: {result.get('error')}")

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
