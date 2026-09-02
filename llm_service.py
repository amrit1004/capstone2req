"""
Azure OpenAI LLM Service for Medical Insights Engine
"""
import json
import time
from openai import AzureOpenAI
import config


def retry_on_error(func, max_retries=3, delay=2):
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Retry {attempt + 1}/{max_retries} after error: {e}")
            time.sleep(delay * (attempt + 1))


def get_client():
    """Get Azure OpenAI client."""
    return AzureOpenAI(
        api_key=config.AZURE_OPENAI_API_KEY,
        api_version=config.AZURE_OPENAI_API_VERSION,
        azure_endpoint=config.AZURE_OPENAI_ENDPOINT
    )


def get_embedding(text: str) -> list:
    """Get embedding vector for text."""
    client = get_client()
    response = client.embeddings.create(
        input=text,
        model=config.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
    )
    return response.data[0].embedding


def get_embeddings_batch(texts: list) -> list:
    """Get embeddings for multiple texts."""
    client = get_client()
    response = client.embeddings.create(
        input=texts,
        model=config.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
    )
    return [item.embedding for item in response.data]


def classify_insight(insight_text: str, therapeutic_area: str,
                     taxonomy_si: list, taxonomy_csf: list) -> dict:
    """
    Classify an insight and extract all 10 labels.
    Returns comprehensive tags including SI, CSF, sentiment, etc.
    """
    client = get_client()

    # Format taxonomy for prompt
    si_list = "\n".join([f"- {t['si_id']}: {t['si_name']}" for t in taxonomy_si])
    csf_list = "\n".join([f"- {t['csf_id']}: {t['csf_name']} (under {t['parent_si_id']})" for t in taxonomy_csf])

    prompt = f"""You are a medical insights analysis expert. Analyze the following medical insight and extract all relevant labels.

INSIGHT TEXT:
"{insight_text}"

THERAPEUTIC AREA: {therapeutic_area}

STRATEGIC IMPERATIVES (SI) - Choose ONE:
{si_list}

CRITICAL SUCCESS FACTORS (CSF) - Choose ONE matching the therapeutic area:
{csf_list}

Extract the following 10 labels and respond in JSON format:

{{
    "asset": "BI compound code (e.g., BI-291984) or null if not mentioned",
    "sentiment": "One of: Positive, Negative, Neutral, Mixed",
    "insight_type": "One of: Data Request, Feedback, Concern, Question, Recommendation, Objection",
    "topic": "One of: Efficacy, Safety, Tolerability, Dosing, Access, Differentiation, Evidence, Biomarker",
    "stakeholder": "One of: KOL, Investigator, Site Coordinator, MSL, Payer, HCP, Medical Director, Regulatory",
    "si_id": "SI-XX (from the list above)",
    "csf_id": "XXX-CSF-XX (from the list above, matching therapeutic area)",
    "source_channel": "One of: Field Visit, Advisory Board, Conference, Email, Call, Meeting, Unknown",
    "evidence_gap": "One of: RWE, Head-to-head, Long-term, Subgroup, Biomarker, Comparative, None",
    "action_required": "One of: Follow-up, Data Generation, Internal Review, Escalate, None",
    "confidence_score": 0.0 to 1.0,
    "reasoning": "Brief 1-2 sentence explanation of key classifications"
}}

GUIDELINES:
- Extract BI compound codes (format: BI-XXXXXX) from the text for 'asset'
- Sentiment: Positive=enthusiasm/support, Negative=concern/skepticism, Neutral=informational, Mixed=both
- Insight type: What is the nature of this communication?
- Topic: What is the main subject being discussed?
- Stakeholder: Identify the role of the person providing the insight
- Source channel: Infer from context (e.g., "field interaction"=Field Visit, "advisory board"=Advisory Board)
- Evidence gap: What type of data/evidence is being requested or is missing?
- Action required: What follow-up is needed?

Respond ONLY with valid JSON, no other text."""

    def make_request():
        return client.chat.completions.create(
            model=config.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a medical insights classification expert. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_completion_tokens=800
        )

    response = retry_on_error(make_request)

    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except json.JSONDecodeError:
        # Try to extract JSON from response
        content = response.choices[0].message.content
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(content[start:end])
        return {
            "asset": None,
            "sentiment": "Neutral",
            "insight_type": "Feedback",
            "topic": "Evidence",
            "stakeholder": "HCP",
            "si_id": "SI-01",
            "csf_id": None,
            "source_channel": "Unknown",
            "evidence_gap": "None",
            "action_required": "None",
            "confidence_score": 0.3,
            "reasoning": "Failed to parse LLM response"
        }


def generate_persona_summary(insight_text: str, persona_type: str,
                            persona_info: dict, tags: dict = None) -> str:
    """
    Generate a persona-specific summary of the insight.
    """
    client = get_client()

    tag_context = ""
    if tags:
        tag_context = f"""
Classification:
- Strategic Imperative: {tags.get('si_name', 'N/A')}
- Topic: {tags.get('topic', 'N/A')}
- Sentiment: {tags.get('sentiment', 'N/A')}
- Stakeholder: {tags.get('stakeholder', 'N/A')}
"""

    prompt = f"""You are writing a summary of a medical insight for a specific audience.

ORIGINAL INSIGHT:
{insight_text}
{tag_context}

TARGET AUDIENCE: {persona_info['name']}
AUDIENCE DESCRIPTION: {persona_info['description']}
FOCUS AREAS: {persona_info['focus']}

Write a concise summary (2-3 sentences) of this insight tailored specifically for this audience.
Emphasize the aspects most relevant to their role and priorities.
Use appropriate terminology for the audience level.

Summary:"""

    def make_request():
        return client.chat.completions.create(
            model=config.AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": f"You are a medical communications expert writing for {persona_info['name']}s."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_completion_tokens=300
        )

    response = retry_on_error(make_request)
    return response.choices[0].message.content.strip()


def semantic_search_query(query: str) -> str:
    """
    Enhance a user query for better semantic search.
    """
    client = get_client()

    prompt = f"""Expand this medical insights search query with relevant medical terminology and synonyms.
Keep it concise but comprehensive.

Original query: {query}

Enhanced query (one line):"""

    response = client.chat.completions.create(
        model=config.AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_completion_tokens=100
    )

    return response.choices[0].message.content.strip()
