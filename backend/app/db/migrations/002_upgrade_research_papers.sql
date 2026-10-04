ALTER TABLE research_papers
    ADD COLUMN IF NOT EXISTS external_id VARCHAR(500),
    ADD COLUMN IF NOT EXISTS source VARCHAR(100) NOT NULL DEFAULT 'openalex',
    ADD COLUMN IF NOT EXISTS normalized_doi VARCHAR(500),
    ADD COLUMN IF NOT EXISTS publication_date DATE,
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS open_access_url VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS title_fingerprint VARCHAR(500),
    ADD COLUMN IF NOT EXISTS first_author_fingerprint VARCHAR(500);

ALTER TABLE research_papers
    ALTER COLUMN authors TYPE VARCHAR(5000),
    ALTER COLUMN research_area TYPE VARCHAR(2000),
    ALTER COLUMN keywords TYPE VARCHAR(5000);

DROP INDEX IF EXISTS idx_research_papers_title;
DROP INDEX IF EXISTS idx_research_papers_authors;
DROP INDEX IF EXISTS idx_research_papers_publication_year;
DROP INDEX IF EXISTS idx_research_papers_research_area;
DROP INDEX IF EXISTS idx_research_papers_keywords;

CREATE INDEX IF NOT EXISTS idx_research_papers_title
    ON research_papers(title);

CREATE INDEX IF NOT EXISTS idx_research_papers_external_id
    ON research_papers(external_id);

CREATE INDEX IF NOT EXISTS idx_research_papers_normalized_doi
    ON research_papers(normalized_doi);

CREATE INDEX IF NOT EXISTS idx_research_papers_publication_year
    ON research_papers(publication_year);
