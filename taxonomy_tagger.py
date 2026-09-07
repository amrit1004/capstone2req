"""
Taxonomy Tagging Module for Medical Insights Engine
Extracts 10 labels from each insight using LLM
OPTIMIZED: Parallel processing for faster batch tagging
RAG-ENHANCED: Retrieves similar tagged insights as examples for consistency
HUMAN-IN-THE-LOOP: Learns from human corrections to improve accuracy
"""
import database
import llm_service
import vector_store
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.logger import get_logger

logger = get_logger(__name__)


# Define valid values for each label
LABEL_OPTIONS = {
    'sentiment': ['Positive', 'Negative', 'Neutral', 'Mixed'],
    'insight_type': ['Data Request', 'Feedback', 'Concern', 'Question', 'Recommendation', 'Objection'],
    'topic': ['Efficacy', 'Safety', 'Tolerability', 'Dosing', 'Access', 'Differentiation', 'Evidence', 'Biomarker'],
    'stakeholder': ['KOL', 'Investigator', 'Site Coordinator', 'MSL', 'Payer', 'HCP', 'Medical Director', 'Regulatory'],
    'source_channel': ['Field Visit', 'Advisory Board', 'Conference', 'Email', 'Call', 'Meeting', 'Unknown'],
    'evidence_gap': ['RWE', 'Head-to-head', 'Long-term', 'Subgroup', 'Biomarker', 'Comparative', 'None'],
    'action_required': ['Follow-up', 'Data Generation', 'Internal Review', 'Escalate', 'None']
}


def retrieve_similar_tagged_insights(insight_text: str, top_k: int = 3) -> list:
    """
    RAG: Retrieve similar insights that are already tagged.
    These serve as examples for more consistent tagging.
    """
    try:
        store = vector_store.get_vector_store()
        if store.get_index_size() == 0:
            return []

        # Search for similar insights
        search_results = store.search(insight_text, top_k + 5)  # Get extra to filter

        examples = []
        for result in search_results:
            if len(examples) >= top_k:
                break

            insight_id = result['insight_id']

            # Get tags for this insight
            tags_df = database.get_insight_tags(insight_id)
            if tags_df.empty:
                continue  # Skip untagged insights

            tags = tags_df.iloc[0].to_dict()

            # Get insight description
            insight = database.get_insight_by_id(insight_id)
            if insight is None:
                continue

            examples.append({
                'insight_id': insight_id,
                'description': insight.get('description', '')[:300],  # Truncate
                'tags': {
                    'asset': tags.get('asset', ''),
                    'sentiment': tags.get('sentiment', ''),
                    'insight_type': tags.get('insight_type', ''),
                    'topic': tags.get('topic', ''),
                    'stakeholder': tags.get('stakeholder', ''),
                    'si_id': tags.get('si_id', ''),
                    'csf_id': tags.get('csf_id', ''),
                    'source_channel': tags.get('source_channel', ''),
                    'evidence_gap': tags.get('evidence_gap', ''),
                    'action_required': tags.get('action_required', '')
                }
            })

        return examples
    except Exception as e:
        logger.error(f"RAG retrieval error: {e}")
        return []


def format_examples_for_prompt(examples: list) -> str:
    """Format retrieved examples for LLM prompt."""
    if not examples:
        return ""

    example_text = "\n\nSIMILAR TAGGED INSIGHTS (use as reference for consistency):\n"

    for i, ex in enumerate(examples, 1):
        tags = ex['tags']
        example_text += f"""
Example {i}:
Description: {ex['description']}
Tags: asset={tags['asset']}, sentiment={tags['sentiment']}, insight_type={tags['insight_type']},
      topic={tags['topic']}, stakeholder={tags['stakeholder']}, si_id={tags['si_id']},
      csf_id={tags['csf_id']}, source_channel={tags['source_channel']},
      evidence_gap={tags['evidence_gap']}, action_required={tags['action_required']}
"""

    return example_text


def retrieve_relevant_corrections(insight_text: str, top_k: int = 5) -> list:
    """
    Retrieve relevant human corrections to learn from mistakes.
    This enables human-in-the-loop learning.
    """
    try:
        # Get all corrections
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
        if store.get_index_size() == 0:
            return []

        search_results = store.search(insight_text, top_k * 2)
        similar_ids = {r['insight_id'] for r in search_results}

        # Filter corrections for similar insights
        relevant = corrections_df[corrections_df['insight_id'].isin(similar_ids)]

        if relevant.empty:
            # Fall back to most recent corrections
            relevant = corrections_df.head(top_k)

        corrections = []
        for _, row in relevant.head(top_k).iterrows():
            corrections.append({
                'insight_id': row['insight_id'],
                'description': row['description'][:200] if row['description'] else '',
                'field': row['field_name'],
                'original': row['original_value'],
                'corrected': row['corrected_value'],
                'reason': row['correction_reason']
            })

        return corrections
    except Exception as e:
        logger.error(f"Error retrieving corrections: {e}")
        return []


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


def get_taxonomy_for_area(therapeutic_area: str) -> tuple:
    """Get taxonomy lists for a specific therapeutic area."""
    # Get all SI
    si_df = database.get_taxonomy_si()
    taxonomy_si = si_df.to_dict('records')

    # Get CSF for therapeutic area
    csf_df = database.get_taxonomy_csf(therapeutic_area)
    if csf_df.empty:
        # Fallback to all CSF if no match
        csf_df = database.get_taxonomy_csf()
    taxonomy_csf = csf_df.to_dict('records')

    return taxonomy_si, taxonomy_csf


def tag_single_insight(insight_id: str, use_rag: bool = True) -> dict:
    """
    Tag a single insight with all 10 labels.
    RAG-Enhanced: Retrieves similar tagged insights as examples for consistency.
    Human-in-the-Loop: Learns from human corrections to avoid repeating mistakes.
    """
    # Get insight
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        raise ValueError(f"Insight not found: {insight_id}")

    insight_text = str(insight.get('description', ''))

    # Get appropriate taxonomy
    therapeutic_area = insight.get('therapeutic_area', '') or ''
    taxonomy_si, taxonomy_csf = get_taxonomy_for_area(therapeutic_area)

    # RAG: Retrieve similar tagged insights as examples
    rag_context = ""
    if use_rag:
        # Get similar tagged examples
        examples = retrieve_similar_tagged_insights(insight_text, top_k=3)
        rag_context = format_examples_for_prompt(examples)
        if examples:
            logger.debug(f"RAG: Found {len(examples)} similar examples for {insight_id}")

        # Human-in-the-Loop: Get relevant corrections to learn from
        corrections = retrieve_relevant_corrections(insight_text, top_k=3)
        corrections_context = format_corrections_for_prompt(corrections)
        if corrections:
            logger.debug(f"HITL: Found {len(corrections)} corrections for {insight_id}")
            rag_context += corrections_context

    # Classify using LLM with RAG context
    try:
        result = llm_service.classify_insight(
            insight_text=insight_text,
            therapeutic_area=therapeutic_area,
            taxonomy_si=taxonomy_si,
            taxonomy_csf=taxonomy_csf,
            rag_context=rag_context
        )
    except Exception as e:
        logger.error(f"LLM Error for {insight_id}: {e}")
        raise Exception(f"Azure OpenAI Error: {str(e)}")

    # Save to database
    database.save_insight_tags(insight_id=insight_id, tags=result)

    return result


def _tag_single_worker(insight_id: str) -> dict:
    """Worker function for parallel processing."""
    try:
        result = tag_single_insight(insight_id)
        return {'insight_id': insight_id, 'status': 'success', 'result': result}
    except Exception as e:
        return {'insight_id': insight_id, 'status': 'failed', 'error': str(e)}


def tag_all_insights(progress_callback=None, max_workers=10, limit=None, skip_tagged=False) -> dict:
    """Tag insights in database using parallel processing. Optionally limit count and skip tagged."""
    insights_df = database.get_all_insights()

    # Skip already tagged insights if requested
    if skip_tagged:
        tagged_df = database.get_insight_tags()
        tagged_ids = set(tagged_df['insight_id'].tolist()) if not tagged_df.empty else set()
        insights_df = insights_df[~insights_df['insight_id'].isin(tagged_ids)]
        logger.info(f"Skipping {len(tagged_ids)} already tagged insights")

    # Apply limit if specified
    if limit and limit > 0:
        insights_df = insights_df.head(limit)

    total = len(insights_df)
    insight_ids = insights_df['insight_id'].tolist()

    results = {
        'total': total,
        'success': 0,
        'failed': 0,
        'details': [],
        'last_error': None
    }

    completed = 0
    logger.info(f"Starting batch tagging with {max_workers} workers")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_id = {executor.submit(_tag_single_worker, iid): iid for iid in insight_ids}

        for future in as_completed(future_to_id):
            completed += 1
            result = future.result()

            if result['status'] == 'success':
                results['success'] += 1
                logger.info(f"Tagged {completed}/{total}: {result['insight_id']} - SUCCESS")
            else:
                results['failed'] += 1
                results['last_error'] = result['error']
                logger.warning(f"Tagged {completed}/{total}: {result['insight_id']} - FAILED: {result['error']}")

            if len(results['details']) < 10:
                results['details'].append(result)

            if progress_callback:
                progress_callback(completed, total)

    return results


def get_tagging_summary() -> dict:
    """Get summary of tagging status."""
    insights_df = database.get_all_insights()
    tags_df = database.get_insight_tags()

    total_insights = len(insights_df)
    tagged_insights = len(tags_df)
    verified_tags = len(tags_df[tags_df['is_verified'] == 1]) if not tags_df.empty else 0

    # Get distribution by SI
    si_distribution = {}
    if not tags_df.empty and 'si_id' in tags_df.columns:
        si_counts = tags_df.groupby('si_id').size().to_dict()
        si_df = database.get_taxonomy_si()
        for si_id, count in si_counts.items():
            if si_id:
                si_name = si_df[si_df['si_id'] == si_id]['si_name'].values
                si_name = si_name[0] if len(si_name) > 0 else si_id
                si_distribution[si_name] = count

    # Get distribution by sentiment
    sentiment_distribution = {}
    if not tags_df.empty and 'sentiment' in tags_df.columns:
        sentiment_counts = tags_df['sentiment'].value_counts().to_dict()
        sentiment_distribution = {k: v for k, v in sentiment_counts.items() if k}

    # Get distribution by insight_type
    insight_type_distribution = {}
    if not tags_df.empty and 'insight_type' in tags_df.columns:
        type_counts = tags_df['insight_type'].value_counts().to_dict()
        insight_type_distribution = {k: v for k, v in type_counts.items() if k}

    return {
        'total_insights': total_insights,
        'tagged_insights': tagged_insights,
        'pending_insights': total_insights - tagged_insights,
        'verified_tags': verified_tags,
        'unverified_tags': tagged_insights - verified_tags,
        'si_distribution': si_distribution,
        'sentiment_distribution': sentiment_distribution,
        'insight_type_distribution': insight_type_distribution
    }


def get_label_options():
    """Return valid options for each label."""
    return LABEL_OPTIONS
