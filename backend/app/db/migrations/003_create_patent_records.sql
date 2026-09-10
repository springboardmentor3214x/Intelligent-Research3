-- Migration 003: Create patent_records table for Module 5 — Patent Landscape Analysis

CREATE TABLE IF NOT EXISTS patent_records (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL DEFAULT 'uspto',
    source_patent_id VARCHAR(500),
    patent_number VARCHAR(200),
    title VARCHAR(2000) NOT NULL,
    abstract TEXT,
    assignee VARCHAR(500),
    assignee_normalized VARCHAR(500),
    inventors TEXT, -- JSON array of inventors
    filing_date DATE,
    publication_date DATE,
    grant_date DATE,
    filing_year INTEGER,
    country VARCHAR(10),
    patent_classification VARCHAR(500),
    all_classifications TEXT, -- JSON array of IPC/CPC codes
    technology_domain VARCHAR(255),
    keywords TEXT, -- JSON array of keywords
    citation_count INTEGER DEFAULT 0,
    claims_text TEXT,
    description_text TEXT,
    source_url VARCHAR(2000),
    raw_metadata TEXT, -- JSON
    title_fingerprint VARCHAR(500),
    assignee_fingerprint VARCHAR(255),
    cluster_id INTEGER,
    cluster_label VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

-- Constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_patent_source_ext'
    ) THEN
        ALTER TABLE patent_records
            ADD CONSTRAINT uq_patent_source_ext UNIQUE (source, source_patent_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_patent_number'
    ) THEN
        ALTER TABLE patent_records
            ADD CONSTRAINT uq_patent_number UNIQUE (patent_number);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patent_records_source ON patent_records(source);
CREATE INDEX IF NOT EXISTS idx_patent_records_patent_number ON patent_records(patent_number);
CREATE INDEX IF NOT EXISTS idx_patent_records_title ON patent_records(title);
CREATE INDEX IF NOT EXISTS idx_patent_records_assignee ON patent_records(assignee);
CREATE INDEX IF NOT EXISTS idx_patent_records_assignee_norm ON patent_records(assignee_normalized);
CREATE INDEX IF NOT EXISTS idx_patent_records_filing_date ON patent_records(filing_date);
CREATE INDEX IF NOT EXISTS idx_patent_records_filing_year ON patent_records(filing_year);
CREATE INDEX IF NOT EXISTS idx_patent_records_classification ON patent_records(patent_classification);
CREATE INDEX IF NOT EXISTS idx_patent_records_domain ON patent_records(technology_domain);
CREATE INDEX IF NOT EXISTS idx_patent_records_cluster_id ON patent_records(cluster_id);
CREATE INDEX IF NOT EXISTS idx_patent_records_title_fp ON patent_records(title_fingerprint);
CREATE INDEX IF NOT EXISTS idx_patent_records_assignee_fp ON patent_records(assignee_fingerprint);
