"""
Persona-specific Summary Generator for Medical Insights Engine
"""
import database
import llm_service
import config


def generate_summaries_for_insight(insight_id: str) -> dict:
    """Generate all three persona summaries for an insight."""
    # Get insight
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        return {"error": "Insight not found"}

    # Get tags for context
    tags_df = database.get_insight_tags(insight_id)
    tags = tags_df.iloc[0].to_dict() if not tags_df.empty else None

    summaries = {}

    for persona_key, persona_info in config.PERSONAS.items():
        try:
            summary = llm_service.generate_persona_summary(
                insight_text=insight['description'],
                persona_type=persona_key,
                persona_info=persona_info,
                tags=tags
            )

            # Save to database
            database.save_persona_summary(
                insight_id=insight_id,
                persona_type=persona_key,
                summary=summary
            )

            summaries[persona_key] = {
                'persona_name': persona_info['name'],
                'summary': summary
            }

        except Exception as e:
            summaries[persona_key] = {
                'persona_name': persona_info['name'],
                'summary': f"Error generating summary: {str(e)}"
            }

    return summaries


def generate_all_summaries(progress_callback=None) -> dict:
    """Generate persona summaries for all insights."""
    insights_df = database.get_all_insights()
    total = len(insights_df)
    results = {
        'total': total,
        'success': 0,
        'failed': 0
    }

    for idx, row in insights_df.iterrows():
        try:
            generate_summaries_for_insight(row['insight_id'])
            results['success'] += 1
        except Exception as e:
            results['failed'] += 1
            print(f"Error generating summaries for {row['insight_id']}: {e}")

        if progress_callback:
            progress_callback(idx + 1, total)

    return results


def get_summaries_for_display(insight_id: str) -> dict:
    """Get stored summaries for display, or generate if missing."""
    summaries_df = database.get_persona_summaries(insight_id)

    if summaries_df.empty:
        # Generate on demand
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
        'original_text': insight['description'],
        'therapeutic_area': insight['therapeutic_area'],
        'disease_state': insight['disease_state'],
        'summaries': summaries
    }
