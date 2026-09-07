"""
Taxonomy Repository - SI/CSF taxonomy data operations
"""
from typing import Optional
import pandas as pd
from data_access.base import BaseRepository
from utils.logger import get_logger

logger = get_logger(__name__)


class TaxonomyRepository(BaseRepository):
    """Repository for taxonomy data operations."""

    def get_all_si(self) -> pd.DataFrame:
        """Get all Strategic Imperatives."""
        return self.execute_query("SELECT * FROM taxonomy_si")

    def get_si_by_id(self, si_id: str) -> Optional[dict]:
        """Get SI by ID."""
        df = self.execute_query(
            "SELECT * FROM taxonomy_si WHERE si_id = ?",
            (si_id,)
        )
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def get_all_csf(self) -> pd.DataFrame:
        """Get all Critical Success Factors."""
        return self.execute_query("SELECT * FROM taxonomy_csf")

    def get_csf_by_therapeutic_area(self, area: str) -> pd.DataFrame:
        """Get CSF filtered by therapeutic area."""
        return self.execute_query(
            "SELECT * FROM taxonomy_csf WHERE therapeutic_area = ?",
            (area,)
        )

    def get_csf_by_si(self, si_id: str) -> pd.DataFrame:
        """Get CSF under a specific SI."""
        return self.execute_query(
            "SELECT * FROM taxonomy_csf WHERE parent_si_id = ?",
            (si_id,)
        )

    def get_csf_by_id(self, csf_id: str) -> Optional[dict]:
        """Get CSF by ID."""
        df = self.execute_query(
            "SELECT * FROM taxonomy_csf WHERE csf_id = ?",
            (csf_id,)
        )
        if df.empty:
            return None
        return df.iloc[0].to_dict()

    def insert_si(self, si_id: str, si_name: str, description: str = "") -> bool:
        """Insert new SI."""
        return self.execute_write(
            """INSERT OR REPLACE INTO taxonomy_si
               (si_id, si_name, description)
               VALUES (?, ?, ?)""",
            (si_id, si_name, description)
        )

    def insert_csf(
        self,
        csf_id: str,
        csf_name: str,
        parent_si_id: str,
        therapeutic_area: str,
        description: str = ""
    ) -> bool:
        """Insert new CSF."""
        return self.execute_write(
            """INSERT OR REPLACE INTO taxonomy_csf
               (csf_id, csf_name, parent_si_id, therapeutic_area, description)
               VALUES (?, ?, ?, ?, ?)""",
            (csf_id, csf_name, parent_si_id, therapeutic_area, description)
        )

    def get_taxonomy_tree(self) -> dict:
        """Get full taxonomy as nested structure."""
        si_df = self.get_all_si()
        csf_df = self.get_all_csf()

        tree = {}
        for _, si in si_df.iterrows():
            si_id = si['si_id']
            tree[si_id] = {
                'name': si['si_name'],
                'description': si.get('description', ''),
                'csf': []
            }

            si_csfs = csf_df[csf_df['parent_si_id'] == si_id]
            for _, csf in si_csfs.iterrows():
                tree[si_id]['csf'].append({
                    'csf_id': csf['csf_id'],
                    'name': csf['csf_name'],
                    'therapeutic_area': csf.get('therapeutic_area', '')
                })

        return tree
