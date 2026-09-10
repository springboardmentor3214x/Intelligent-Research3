"""
Matches the FundingOpportunity contract from the work-division doc.
Coordinate final field names/types with Member 4 (data ingestion) before
treating this as locked — they're the one inserting real records.
"""
from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class FundingOpportunity(Base):
    __tablename__ = "funding_opportunities"

    id = Column(String, primary_key=True, default=gen_uuid)
    external_id = Column(String, nullable=True, index=True)  # ID from the source, for dedup
    title = Column(String, nullable=False)
    organization = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    funding_amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True, index=True)
    eligibility = Column(Text, nullable=True)
    research_areas = Column(Text, nullable=True)  # stored as comma-separated; see note below
    keywords = Column(Text, nullable=True)        # comma-separated for SQLite simplicity
    funding_type = Column(String, nullable=True)
    country = Column(String, nullable=True)
    source = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    application_url = Column(String, nullable=True)
    status = Column(String, default="open")  # open | closed | expired
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # NOTE: research_areas/keywords are plain comma-separated strings here to
    # keep the SQLite demo dependency-free. In Postgres, use ARRAY(String) or
    # a proper join table instead — mention this to Member 4 before they build
    # their ingestion pipeline against this schema.


class SavedFunding(Base):
    __tablename__ = "saved_funding"
    __table_args__ = (UniqueConstraint("user_id", "funding_id", name="uq_user_funding"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=False, index=True)
    funding_id = Column(String, ForeignKey("funding_opportunities.id"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    funding = relationship("FundingOpportunity")
