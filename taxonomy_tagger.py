"""
Taxonomy Tagging Module for Medical Insights Engine
Extracts 10 labels from each insight using LLM
"""
import database
import llm_service


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
        return {"error": "Insight not found"}

    # Get appropriate taxonomy
    therapeutic_area = insight['therapeutic_area']
    taxonomy_si, taxonomy_csf = get_taxonomy_for_area(therapeutic_area)

    # Classify using LLM
    result = llm_service.classify_insight(
        insight_text=insight['description'],
        therapeutic_area=therapeutic_area,
        taxonomy_si=taxonomy_si,
        taxonomy_csf=taxonomy_csf
    )

    # Save to database
    database.save_insight_tags(insight_id=insight_id, tags=result)

    return result


def tag_all_insights(progress_callback=None) -> dict:
    """Tag all insights in database."""
    insights_df = database.get_all_insights()
    total = len(insights_df)
    results = {
        'total': total,
        'success': 0,
        'failed': 0,
        'details': []
    }

    for idx, row in insights_df.iterrows():
        try:
            result = tag_single_insight(row['insight_id'])
            results['success'] += 1
            results['details'].append({
                'insight_id': row['insight_id'],
                'status': 'success',
                'result': result
            })
        except Exception as e:
            results['failed'] += 1
            results['details'].append({
                'insight_id': row['insight_id'],
                'status': 'failed',
                'error': str(e)
            })

        if progress_callback:
            progress_callback(idx + 1, total)

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
