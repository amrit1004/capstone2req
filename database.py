"""
SQLite Database operations for Medical Insights Engine
"""
import sqlite3
import pandas as pd
from pathlib import Path
import config


def get_connection():
    """Get SQLite database connection."""
    Path(config.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(config.DATABASE_PATH)


def normalize_column_names(df):
    """Normalize column names to lowercase with underscores."""
    # Create mapping for common variations
    column_mapping = {
        'insight_id': 'insight_id',
        'insightid': 'insight_id',
        'insight id': 'insight_id',
        'id': 'insight_id',

        'persona': 'persona',

        'createddate': 'created_date',
        'created_date': 'created_date',
        'created date': 'created_date',
        'date': 'created_date',

        'therapeuticarea': 'therapeutic_area',
        'therapeutic_area': 'therapeutic_area',
        'therapeutic area': 'therapeutic_area',
        'therapy_area': 'therapeutic_area',
        'therapy area': 'therapeutic_area',

        'diseasestate': 'disease_state',
        'disease_state': 'disease_state',
        'disease state': 'disease_state',
        'disease': 'disease_state',

        'region_ro': 'region_ro',
        'regionro': 'region_ro',
        'region ro': 'region_ro',
        'region': 'region_ro',

        'countrycode': 'country_code',
        'country_code': 'country_code',
        'country code': 'country_code',
        'country': 'country_code',

        'description': 'description',
        'insight': 'description',
        'text': 'description',
        'notes': 'description',
        'insight_text': 'description',
        'insight text': 'description',
    }

    # Normalize all column names
    new_columns = []
    for col in df.columns:
        # Convert to lowercase and strip whitespace
        normalized = col.lower().strip().replace(' ', '_')
        # Check if we have a mapping
        if normalized in column_mapping:
            new_columns.append(column_mapping[normalized])
        else:
            new_columns.append(normalized)

    df.columns = new_columns
    return df


def init_database():
    """Initialize database with all required tables."""
    conn = get_connection()
    cursor = conn.cursor()

    # Insights table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS insights (
            insight_id TEXT PRIMARY KEY,
            persona TEXT,
            created_date TEXT,
            therapeutic_area TEXT,
            disease_state TEXT,
            region_ro TEXT,
            country_code TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Strategic Imperatives taxonomy
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS taxonomy_si (
            si_id TEXT PRIMARY KEY,
            si_name TEXT,
            si_description TEXT
        )
    """)

    # Critical Success Factors taxonomy
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS taxonomy_csf (
            csf_id TEXT PRIMARY KEY,
            therapeutic_area TEXT,
            csf_name TEXT,
            parent_si_id TEXT,
            parent_si_name TEXT,
            FOREIGN KEY (parent_si_id) REFERENCES taxonomy_si(si_id)
        )
    """)

    # AI-generated tags for insights (with all 10 labels)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS insight_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            insight_id TEXT UNIQUE,
            asset TEXT,
            sentiment TEXT,
            insight_type TEXT,
            topic TEXT,
            stakeholder TEXT,
            si_id TEXT,
            csf_id TEXT,
            source_channel TEXT,
            evidence_gap TEXT,
            action_required TEXT,
            confidence_score REAL,
            reasoning TEXT,
            is_verified INTEGER DEFAULT 0,
            verified_by TEXT,
            verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (insight_id) REFERENCES insights(insight_id),
            FOREIGN KEY (si_id) REFERENCES taxonomy_si(si_id),
            FOREIGN KEY (csf_id) REFERENCES taxonomy_csf(csf_id)
        )
    """)

    # Human corrections/reviews
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tag_corrections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            insight_id TEXT,
            field_name TEXT,
            original_value TEXT,
            corrected_value TEXT,
            correction_reason TEXT,
            corrected_by TEXT,
            corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (insight_id) REFERENCES insights(insight_id)
        )
    """)

    # Persona summaries
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS persona_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            insight_id TEXT,
            persona_type TEXT,
            summary TEXT,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (insight_id) REFERENCES insights(insight_id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully!")


def load_csv_data():
    """Load CSV data into database tables."""
    conn = get_connection()

    # Load insights
    print(f"Looking for CSV at: {config.INSIGHTS_CSV}")
    try:
        df_insights = pd.read_csv(config.INSIGHTS_CSV, encoding='utf-8')
        print(f"Successfully read CSV with {len(df_insights)} rows")
    except UnicodeDecodeError:
        df_insights = pd.read_csv(config.INSIGHTS_CSV, encoding='latin-1')
        print(f"Read CSV with latin-1 encoding: {len(df_insights)} rows")
    except FileNotFoundError:
        print(f"ERROR: CSV file not found at {config.INSIGHTS_CSV}")
        print("Creating empty insights table...")
        df_insights = pd.DataFrame(columns=['insight_id', 'description', 'persona', 'created_date',
                                            'therapeutic_area', 'disease_state', 'region_ro', 'country_code'])

    print(f"Original columns in insights CSV: {list(df_insights.columns)}")
    df_insights = normalize_column_names(df_insights)
    print(f"Normalized columns: {list(df_insights.columns)}")

    # Ensure required columns exist
    required_cols = ['insight_id', 'description']
    for col in required_cols:
        if col not in df_insights.columns:
            raise ValueError(f"Required column '{col}' not found in insights CSV. Found columns: {list(df_insights.columns)}")

    # Fill missing optional columns
    optional_cols = ['persona', 'created_date', 'therapeutic_area', 'disease_state', 'region_ro', 'country_code']
    for col in optional_cols:
        if col not in df_insights.columns:
            df_insights[col] = ''

    df_insights.to_sql('insights', conn, if_exists='replace', index=False)
    print(f"Loaded {len(df_insights)} insights")

    # Load taxonomy SI
    try:
        df_si = pd.read_csv(config.TAXONOMY_SI_CSV, encoding='utf-8')
    except UnicodeDecodeError:
        df_si = pd.read_csv(config.TAXONOMY_SI_CSV, encoding='latin-1')
    except FileNotFoundError:
        print("Warning: taxonomy_si.csv not found, skipping")
        df_si = pd.DataFrame(columns=['si_id', 'si_name', 'si_description'])

    df_si = normalize_column_names(df_si)
    df_si.to_sql('taxonomy_si', conn, if_exists='replace', index=False)
    print(f"Loaded {len(df_si)} Strategic Imperatives")

    # Load taxonomy CSF
    try:
        df_csf = pd.read_csv(config.TAXONOMY_CSF_CSV, encoding='utf-8')
    except UnicodeDecodeError:
        df_csf = pd.read_csv(config.TAXONOMY_CSF_CSV, encoding='latin-1')
    except FileNotFoundError:
        print("Warning: taxonomy_csf.csv not found, skipping")
        df_csf = pd.DataFrame(columns=['csf_id', 'therapeutic_area', 'csf_name', 'parent_si_id', 'parent_si_name'])

    df_csf = normalize_column_names(df_csf)
    df_csf.to_sql('taxonomy_csf', conn, if_exists='replace', index=False)
    print(f"Loaded {len(df_csf)} Critical Success Factors")

    conn.close()


def get_all_insights():
    """Get all insights from database."""
    conn = None
    try:
        conn = get_connection()
        df = pd.read_sql_query("SELECT * FROM insights", conn)
        return df
    except Exception as e:
        print(f"Error getting all insights: {e}")
        return pd.DataFrame()
    finally:
        if conn:
            conn.close()


def get_insight_by_id(insight_id: str):
    """Get single insight by ID."""
    conn = None
    try:
        conn = get_connection()
        df = pd.read_sql_query(
            "SELECT * FROM insights WHERE insight_id = ?",
            conn,
            params=(insight_id,)
        )
        return df.iloc[0] if len(df) > 0 else None
    except Exception as e:
        print(f"Error getting insight {insight_id}: {e}")
        return None
    finally:
        if conn:
            conn.close()


def get_taxonomy_si():
    """Get all Strategic Imperatives."""
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM taxonomy_si", conn)
    conn.close()
    return df


def get_taxonomy_csf(therapeutic_area: str = None):
    """Get Critical Success Factors, optionally filtered by therapeutic area."""
    conn = get_connection()
    if therapeutic_area:
        df = pd.read_sql_query(
            "SELECT * FROM taxonomy_csf WHERE therapeutic_area = ?",
            conn,
            params=(therapeutic_area,)
        )
    else:
        df = pd.read_sql_query("SELECT * FROM taxonomy_csf", conn)
    conn.close()
    return df


def save_insight_tags(insight_id: str, tags: dict):
    """Save AI-generated tags for an insight."""
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check if tag already exists
        cursor.execute(
            "SELECT id FROM insight_tags WHERE insight_id = ?",
            (insight_id,)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE insight_tags
                SET asset = ?, sentiment = ?, insight_type = ?, topic = ?,
                    stakeholder = ?, si_id = ?, csf_id = ?, source_channel = ?,
                    evidence_gap = ?, action_required = ?, confidence_score = ?, reasoning = ?
                WHERE insight_id = ?
            """, (
                tags.get('asset'),
                tags.get('sentiment'),
                tags.get('insight_type'),
                tags.get('topic'),
                tags.get('stakeholder'),
                tags.get('si_id'),
                tags.get('csf_id'),
                tags.get('source_channel'),
                tags.get('evidence_gap'),
                tags.get('action_required'),
                tags.get('confidence_score', 0.5),
                tags.get('reasoning', ''),
                insight_id
            ))
        else:
            cursor.execute("""
                INSERT INTO insight_tags
                (insight_id, asset, sentiment, insight_type, topic, stakeholder,
                 si_id, csf_id, source_channel, evidence_gap, action_required,
                 confidence_score, reasoning)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                insight_id,
                tags.get('asset'),
                tags.get('sentiment'),
                tags.get('insight_type'),
                tags.get('topic'),
                tags.get('stakeholder'),
                tags.get('si_id'),
                tags.get('csf_id'),
                tags.get('source_channel'),
                tags.get('evidence_gap'),
                tags.get('action_required'),
                tags.get('confidence_score', 0.5),
                tags.get('reasoning', '')
            ))

        conn.commit()
        print(f"Saved tags for {insight_id}")
    except Exception as e:
        print(f"Error saving tags for {insight_id}: {e}")
        raise
    finally:
        if conn:
            conn.close()


def get_insight_tags(insight_id: str = None):
    """Get tags for insights."""
    conn = get_connection()
    try:
        if insight_id:
            df = pd.read_sql_query("""
                SELECT it.*
                FROM insight_tags it
                WHERE it.insight_id = ?
            """, conn, params=(insight_id,))
        else:
            df = pd.read_sql_query("""
                SELECT it.*
                FROM insight_tags it
            """, conn)

        # Add si_name and csf_name if taxonomy tables exist
        if not df.empty:
            try:
                si_df = pd.read_sql_query("SELECT si_id, si_name FROM taxonomy_si", conn)
                if not si_df.empty:
                    df = df.merge(si_df, on='si_id', how='left')
                else:
                    df['si_name'] = None
            except:
                df['si_name'] = None

            try:
                csf_df = pd.read_sql_query("SELECT csf_id, csf_name FROM taxonomy_csf", conn)
                if not csf_df.empty:
                    df = df.merge(csf_df, on='csf_id', how='left')
                else:
                    df['csf_name'] = None
            except:
                df['csf_name'] = None
    except Exception as e:
        print(f"Error getting tags: {e}")
        df = pd.DataFrame()
    finally:
        conn.close()
    return df


def verify_tag(insight_id: str, verified_by: str):
    """Mark a tag as verified by human reviewer."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE insight_tags
        SET is_verified = 1, verified_by = ?, verified_at = CURRENT_TIMESTAMP
        WHERE insight_id = ?
    """, (verified_by, insight_id))
    conn.commit()
    conn.close()


def save_correction(insight_id: str, field_name: str, original_value: str,
                    corrected_value: str, reason: str, corrected_by: str):
    """Save a human correction to a specific field."""
    conn = get_connection()
    cursor = conn.cursor()

    # Save correction record
    cursor.execute("""
        INSERT INTO tag_corrections
        (insight_id, field_name, original_value, corrected_value, correction_reason, corrected_by)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (insight_id, field_name, original_value, corrected_value, reason, corrected_by))

    # Update the tag field dynamically
    valid_fields = ['asset', 'sentiment', 'insight_type', 'topic', 'stakeholder',
                    'si_id', 'csf_id', 'source_channel', 'evidence_gap', 'action_required']

    if field_name in valid_fields:
        cursor.execute(f"""
            UPDATE insight_tags
            SET {field_name} = ?, is_verified = 1, verified_by = ?, verified_at = CURRENT_TIMESTAMP
            WHERE insight_id = ?
        """, (corrected_value, corrected_by, insight_id))

    conn.commit()
    conn.close()


def save_bulk_correction(insight_id: str, corrections: dict, reason: str, corrected_by: str):
    """Save multiple field corrections at once."""
    conn = get_connection()
    cursor = conn.cursor()

    valid_fields = ['asset', 'sentiment', 'insight_type', 'topic', 'stakeholder',
                    'si_id', 'csf_id', 'source_channel', 'evidence_gap', 'action_required']

    # Get original values
    cursor.execute("SELECT * FROM insight_tags WHERE insight_id = ?", (insight_id,))
    row = cursor.fetchone()

    if row:
        columns = [description[0] for description in cursor.description]
        original = dict(zip(columns, row))

        for field_name, new_value in corrections.items():
            if field_name in valid_fields:
                original_value = original.get(field_name, '')

                # Save correction record
                cursor.execute("""
                    INSERT INTO tag_corrections
                    (insight_id, field_name, original_value, corrected_value, correction_reason, corrected_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (insight_id, field_name, original_value, new_value, reason, corrected_by))

                # Update field
                cursor.execute(f"""
                    UPDATE insight_tags
                    SET {field_name} = ?
                    WHERE insight_id = ?
                """, (new_value, insight_id))

        # Mark as verified
        cursor.execute("""
            UPDATE insight_tags
            SET is_verified = 1, verified_by = ?, verified_at = CURRENT_TIMESTAMP
            WHERE insight_id = ?
        """, (corrected_by, insight_id))

    conn.commit()
    conn.close()


def save_persona_summary(insight_id: str, persona_type: str, summary: str):
    """Save persona-specific summary."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if summary exists
    cursor.execute(
        "SELECT id FROM persona_summaries WHERE insight_id = ? AND persona_type = ?",
        (insight_id, persona_type)
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE persona_summaries
            SET summary = ?, generated_at = CURRENT_TIMESTAMP
            WHERE insight_id = ? AND persona_type = ?
        """, (summary, insight_id, persona_type))
    else:
        cursor.execute("""
            INSERT INTO persona_summaries (insight_id, persona_type, summary)
            VALUES (?, ?, ?)
        """, (insight_id, persona_type, summary))

    conn.commit()
    conn.close()


def get_persona_summaries(insight_id: str):
    """Get all persona summaries for an insight."""
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT * FROM persona_summaries WHERE insight_id = ?",
        conn,
        params=(insight_id,)
    )
    conn.close()
    return df


def get_accuracy_metrics():
    """Calculate accuracy metrics for AI tagging."""
    conn = get_connection()

    # Total tags
    total = pd.read_sql_query("SELECT COUNT(*) as count FROM insight_tags", conn).iloc[0]['count']

    # Verified tags
    verified = pd.read_sql_query(
        "SELECT COUNT(*) as count FROM insight_tags WHERE is_verified = 1",
        conn
    ).iloc[0]['count']

    # Corrections made (unique insights with corrections)
    corrections = pd.read_sql_query(
        "SELECT COUNT(DISTINCT insight_id) as count FROM tag_corrections",
        conn
    ).iloc[0]['count']

    # Total correction records
    total_corrections = pd.read_sql_query(
        "SELECT COUNT(*) as count FROM tag_corrections",
        conn
    ).iloc[0]['count']

    conn.close()

    if verified > 0:
        precision = (verified - corrections) / verified * 100
    else:
        precision = 0

    return {
        'total_tagged': int(total),
        'total_verified': int(verified),
        'total_corrections': int(corrections),
        'total_field_corrections': int(total_corrections),
        'precision': float(max(0, precision))
    }


def get_label_distribution():
    """Get distribution of each label for analytics."""
    conn = get_connection()

    distributions = {}
    labels = ['sentiment', 'insight_type', 'topic', 'stakeholder', 'source_channel',
              'evidence_gap', 'action_required']

    for label in labels:
        df = pd.read_sql_query(f"""
            SELECT {label} as value, COUNT(*) as count
            FROM insight_tags
            WHERE {label} IS NOT NULL AND {label} != ''
            GROUP BY {label}
        """, conn)
        distributions[label] = df.to_dict('records')

    conn.close()
    return distributions


if __name__ == "__main__":
    init_database()
    load_csv_data()
