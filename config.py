"""
Configuration settings for the Medical Insights Engine
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Azure OpenAI Configuration (only for chat/tagging - embeddings use local model)
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "https://your-resource.openai.azure.com/")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "your-api-key-here")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")  # Your chat model deployment name

# Database Configuration
DATABASE_PATH = os.getenv("DATABASE_PATH", "data/medical_insights.db")

# Vector Store Configuration (ChromaDB with local embeddings)
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "data/chroma_store")
CHROMA_COLLECTION_NAME = "medical_insights"

# Data Paths
INSIGHTS_CSV = "data/insights_data.csv"
TAXONOMY_SI_CSV = "data/taxonomy_si.csv"
TAXONOMY_CSF_CSV = "data/taxonomy_csf.csv"

# Persona Definitions
PERSONAS = {
    "clinician": {
        "name": "Clinician",
        "description": "A practicing physician focused on patient care and treatment decisions",
        "focus": "clinical relevance, patient outcomes, treatment protocols, safety considerations"
    },
    "medical_scientist": {
        "name": "Medical Scientist",
        "description": "A researcher focused on scientific evidence and mechanisms",
        "focus": "scientific evidence, mechanisms of action, clinical trial data, biomarkers, statistical significance"
    },
    "commercial": {
        "name": "Commercial/Sales",
        "description": "A business professional focused on market positioning and value",
        "focus": "market differentiation, competitive landscape, value proposition, access barriers, stakeholder needs"
    }
}
