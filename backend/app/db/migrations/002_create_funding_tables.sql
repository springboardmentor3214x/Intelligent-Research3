-- Module 4 — Funding Opportunity Tables Migration
-- Run manually if not using SQLAlchemy auto-create (init_db)

CREATE TABLE IF NOT EXISTS funding_opportunities (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(500),
    source VARCHAR(100) NOT NULL DEFAULT 'grants_gov',
    title VARCHAR(1000) NOT NULL,
    organization VARCHAR(500),
    description TEXT,
    funding_amount FLOAT,
    funding_amount_min FLOAT,
    funding_amount_max FLOAT,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    deadline DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    funding_type VARCHAR(100),
    country VARCHAR(120),
    research_areas TEXT,  -- JSON array
    keywords TEXT,        -- JSON array
    eligibility TEXT,
    source_url VARCHAR(2000),
    application_url VARCHAR(2000),
    title_fingerprint VARCHAR(500),
    org_fingerprint VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_funding_source_ext UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_funding_title ON funding_opportunities(title);
CREATE INDEX IF NOT EXISTS idx_funding_organization ON funding_opportunities(organization);
CREATE INDEX IF NOT EXISTS idx_funding_deadline ON funding_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_funding_status ON funding_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_funding_country ON funding_opportunities(country);
CREATE INDEX IF NOT EXISTS idx_funding_type ON funding_opportunities(funding_type);
CREATE INDEX IF NOT EXISTS idx_funding_external_id ON funding_opportunities(external_id);
CREATE INDEX IF NOT EXISTS idx_funding_title_fp ON funding_opportunities(title_fingerprint);
CREATE INDEX IF NOT EXISTS idx_funding_org_fp ON funding_opportunities(org_fingerprint);
CREATE INDEX IF NOT EXISTS idx_funding_source ON funding_opportunities(source);

-- Module 3 — Saved Research Papers
CREATE TABLE IF NOT EXISTS saved_research_papers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paper_id INTEGER NOT NULL REFERENCES research_papers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_paper_user_paper UNIQUE (user_id, paper_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_papers_user ON saved_research_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_papers_paper ON saved_research_papers(paper_id);

-- Module 4 — Saved Funding Opportunities
CREATE TABLE IF NOT EXISTS saved_funding_opportunities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    funding_id INTEGER NOT NULL REFERENCES funding_opportunities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_funding_user UNIQUE (user_id, funding_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_funding_user ON saved_funding_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_funding_id ON saved_funding_opportunities(funding_id);
