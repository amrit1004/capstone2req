"""
Taxonomy Tagging Module for Medical Insights Engine
Extracts 10 labels from each insight using LLM
OPTIMIZED: Parallel processing for faster batch tagging
"""
import database
import llm_service
from concurrent.futures import ThreadPoolExecutor, as_completed


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


def tag_single_insight(insight_id: str) -> dict:
    """Tag a single insight with all 10 labels."""
    # Get insight
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        raise ValueError(f"Insight not found: {insight_id}")

    # Get appropriate taxonomy
    therapeutic_area = insight.get('therapeutic_area', '') or ''
    taxonomy_si, taxonomy_csf = get_taxonomy_for_area(therapeutic_area)

    # Classify using LLM
    try:
        result = llm_service.classify_insight(
            insight_text=str(insight.get('description', '')),
            therapeutic_area=therapeutic_area,
            taxonomy_si=taxonomy_si,
            taxonomy_csf=taxonomy_csf
        )
    except Exception as e:
        print(f"LLM Error for {insight_id}: {e}")
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
        print(f"Skipping {len(tagged_ids)} already tagged insights")

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
    print(f"Starting parallel batch tagging with {max_workers} workers...")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_id = {executor.submit(_tag_single_worker, iid): iid for iid in insight_ids}

        for future in as_completed(future_to_id):
            completed += 1
            result = future.result()

            if result['status'] == 'success':
                results['success'] += 1
                print(f"Tagged {completed}/{total}: {result['insight_id']} - SUCCESS")
            else:
                results['failed'] += 1
                results['last_error'] = result['error']
                print(f"Tagged {completed}/{total}: {result['insight_id']} - FAILED: {result['error']}")

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
