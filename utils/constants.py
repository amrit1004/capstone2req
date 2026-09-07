"""
Application Constants for Medical Insights Engine

Centralizes all magic strings and constants.
"""

# User Roles
class Roles:
    CLINICIAN = "clinician"
    MEDICAL_SCIENTIST = "medical_scientist"
    COMMERCIAL = "commercial"
    ADMIN = "admin"

    ALL = [CLINICIAN, MEDICAL_SCIENTIST, COMMERCIAL, ADMIN]


# Label Options
class Labels:
    SENTIMENT = ["Positive", "Negative", "Neutral", "Mixed"]

    INSIGHT_TYPE = [
        "Data Request", "Feedback", "Concern",
        "Question", "Recommendation", "Objection"
    ]

    TOPIC = [
        "Efficacy", "Safety", "Tolerability", "Dosing",
        "Access", "Differentiation", "Evidence", "Biomarker"
    ]

    STAKEHOLDER = [
        "KOL", "Investigator", "Site Coordinator", "MSL",
        "Payer", "HCP", "Medical Director", "Regulatory"
    ]

    SOURCE_CHANNEL = [
        "Field Visit", "Advisory Board", "Conference",
        "Email", "Call", "Meeting", "Unknown"
    ]

    EVIDENCE_GAP = [
        "RWE", "Head-to-head", "Long-term", "Subgroup",
        "Biomarker", "Comparative", "None"
    ]

    ACTION_REQUIRED = [
        "Follow-up", "Data Generation", "Internal Review",
        "Escalate", "None"
    ]


# Table Names
class Tables:
    INSIGHTS = "insights"
    INSIGHT_TAGS = "insight_tags"
    TAG_CORRECTIONS = "tag_corrections"
    PERSONA_SUMMARIES = "persona_summaries"
    TAXONOMY_SI = "taxonomy_si"
    TAXONOMY_CSF = "taxonomy_csf"
    USERS = "users"


# API Response Messages
class Messages:
    SUCCESS = "Operation completed successfully"
    NOT_FOUND = "Resource not found"
    INVALID_INPUT = "Invalid input provided"
    AUTH_FAILED = "Authentication failed"
    UNAUTHORIZED = "Unauthorized access"
    INTERNAL_ERROR = "Internal server error"


# Pagination Defaults
class Pagination:
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
