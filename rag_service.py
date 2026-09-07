"""
RAG (Retrieval Augmented Generation) Service for Medical Insights Engine

RAG enhances LLM responses by retrieving relevant context from the indexed insights
before generating responses. This improves accuracy and grounds responses in actual data.

FUNCTIONALITY:
1. Query Understanding - Parse user query to understand intent
2. Retrieval - Use vector store to find relevant insights
3. Context Building - Format retrieved insights as context
4. Augmented Generation - Pass context to LLM for informed response

USE CASES IN THIS PROJECT:
- Enhanced Tagging: Retrieve similar tagged insights for better classification consistency
- Smart Q&A: Answer questions about insights using relevant data as context
- Trend Analysis: Find patterns across similar insights
- Evidence-based Summaries: Generate summaries grounded in actual insight data
"""

import database
import vector_store
import config
from openai import AzureOpenAI
from utils.logger import get_logger

logger = get_logger(__name__)


def get_client():
    """Get Azure OpenAI client."""
    return AzureOpenAI(
        api_key=config.AZURE_OPENAI_API_KEY,
        api_version=config.AZURE_OPENAI_API_VERSION,
        azure_endpoint=config.AZURE_OPENAI_ENDPOINT
    )


def retrieve_relevant_insights(query: str, top_k: int = 5) -> list:
    """
    Retrieval step: Find relevant insights using vector similarity search.

    Args:
        query: User's question or search query
        top_k: Number of relevant insights to retrieve

    Returns:
        List of relevant insights with their data
    """
    store = vector_store.get_vector_store()

    if store.get_index_size() == 0:
        return []

    # Search for similar insights
    search_results = store.search(query, top_k)

    # Enrich with full insight data and tags
    enriched_results = []
    for result in search_results:
        insight_id = result['insight_id']

        # Get full insight
        insight = database.get_insight_by_id(insight_id)
        if insight is None:
            continue

        # Get tags if available
        tags_df = database.get_insight_tags(insight_id)
        tags = tags_df.iloc[0].to_dict() if not tags_df.empty else {}

        enriched_results.append({
            'insight_id': insight_id,
            'description': insight.get('description', ''),
            'therapeutic_area': insight.get('therapeutic_area', ''),
            'disease_state': insight.get('disease_state', ''),
            'similarity_score': result.get('score', 0),
            'tags': {
                'asset': tags.get('asset', ''),
                'sentiment': tags.get('sentiment', ''),
                'topic': tags.get('topic', ''),
                'insight_type': tags.get('insight_type', ''),
                'stakeholder': tags.get('stakeholder', '')
            }
        })

    return enriched_results


def build_context(retrieved_insights: list) -> str:
    """
    Context Building: Format retrieved insights into LLM-friendly context.

    Args:
        retrieved_insights: List of retrieved insight dictionaries

    Returns:
        Formatted context string for LLM
    """
    if not retrieved_insights:
        return "No relevant insights found in the database."

    context_parts = ["RELEVANT INSIGHTS FROM DATABASE:\n"]

    for i, insight in enumerate(retrieved_insights, 1):
        tags = insight.get('tags', {})
        context_parts.append(f"""
--- Insight {i} (ID: {insight['insight_id']}, Relevance: {insight['similarity_score']:.2f}) ---
Description: {insight['description']}
Therapeutic Area: {insight['therapeutic_area']}
Disease State: {insight['disease_state']}
Tags: Asset={tags.get('asset', 'N/A')}, Sentiment={tags.get('sentiment', 'N/A')}, Topic={tags.get('topic', 'N/A')}
""")

    return "\n".join(context_parts)


def rag_query(query: str, top_k: int = 5, system_prompt: str = None) -> dict:
    """
    Full RAG Pipeline: Retrieve relevant context and generate augmented response.

    Args:
        query: User's question about medical insights
        top_k: Number of insights to retrieve for context
        system_prompt: Optional custom system prompt

    Returns:
        Dictionary with answer, sources, and metadata
    """
    # Step 1: Retrieve relevant insights
    retrieved_insights = retrieve_relevant_insights(query, top_k)

    # Step 2: Build context
    context = build_context(retrieved_insights)

    # Step 3: Generate response with context
    client = get_client()

    default_system = """You are a medical insights analyst assistant.
Answer questions based on the provided context from the medical insights database.
Be specific and cite insight IDs when referencing data.
If the context doesn't contain relevant information, say so clearly."""

    messages = [
        {"role": "system", "content": system_prompt or default_system},
        {"role": "user", "content": f"""Context:
{context}

Question: {query}

Please answer based on the provided context. Reference specific insights by ID when applicable."""}
    ]

    llm_settings = config.get_llm_settings("rag_query")

    response = client.chat.completions.create(
        model=config.AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
        temperature=llm_settings["temperature"],
        max_completion_tokens=llm_settings["max_tokens"]
    )

    answer = response.choices[0].message.content

    return {
        'query': query,
        'answer': answer,
        'sources': [
            {
                'insight_id': i['insight_id'],
                'relevance_score': round(i['similarity_score'], 3),
                'therapeutic_area': i['therapeutic_area'],
                'preview': i['description'][:150] + '...' if len(i['description']) > 150 else i['description']
            }
            for i in retrieved_insights
        ],
        'num_sources': len(retrieved_insights)
    }


def rag_summarize_topic(topic: str, top_k: int = 10) -> dict:
    """
    RAG-based topic summarization: Find insights about a topic and summarize trends.

    Args:
        topic: Topic to summarize (e.g., "efficacy concerns", "dosing questions")
        top_k: Number of insights to analyze

    Returns:
        Summary with key themes and supporting insights
    """
    retrieved_insights = retrieve_relevant_insights(topic, top_k)
    context = build_context(retrieved_insights)

    client = get_client()

    messages = [
        {"role": "system", "content": """You are a medical insights analyst.
Analyze the provided insights and create a structured summary identifying:
1. Key themes and patterns
2. Sentiment trends
3. Common stakeholder concerns
4. Recommended actions"""},
        {"role": "user", "content": f"""Analyze these insights about "{topic}":

{context}

Provide a structured summary with key findings and recommendations."""}
    ]

    llm_settings = config.get_llm_settings("rag_summary")

    response = client.chat.completions.create(
        model=config.AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
        temperature=llm_settings["temperature"],
        max_completion_tokens=llm_settings["max_tokens"]
    )

    return {
        'topic': topic,
        'summary': response.choices[0].message.content,
        'insights_analyzed': len(retrieved_insights),
        'source_ids': [i['insight_id'] for i in retrieved_insights]
    }


def rag_compare_insights(insight_id: str, top_k: int = 5) -> dict:
    """
    Find and compare similar insights to a given insight.

    Args:
        insight_id: The insight to find comparisons for
        top_k: Number of similar insights to retrieve

    Returns:
        Comparison analysis with similar insights
    """
    # Get the source insight
    insight = database.get_insight_by_id(insight_id)
    if insight is None:
        return {'error': 'Insight not found'}

    description = insight.get('description', '')

    # Find similar insights (excluding self)
    retrieved = retrieve_relevant_insights(description, top_k + 1)
    similar_insights = [i for i in retrieved if i['insight_id'] != insight_id][:top_k]

    if not similar_insights:
        return {
            'insight_id': insight_id,
            'similar_insights': [],
            'analysis': 'No similar insights found.'
        }

    context = build_context(similar_insights)

    client = get_client()

    messages = [
        {"role": "system", "content": "You are a medical insights analyst comparing similar insights."},
        {"role": "user", "content": f"""Compare this insight with similar ones:

ORIGINAL INSIGHT ({insight_id}):
{description}

SIMILAR INSIGHTS:
{context}

Analyze: What patterns emerge? How does the original compare? Any unique aspects?"""}
    ]

    llm_settings = config.get_llm_settings("rag_query")

    response = client.chat.completions.create(
        model=config.AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
        temperature=llm_settings["temperature"],
        max_completion_tokens=llm_settings["max_tokens"]
    )

    return {
        'insight_id': insight_id,
        'original_description': description,
        'similar_insights': [
            {'insight_id': i['insight_id'], 'similarity': round(i['similarity_score'], 3)}
            for i in similar_insights
        ],
        'analysis': response.choices[0].message.content
    }
