CREATE TABLE IF NOT EXISTS research_papers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(1000) NOT NULL,
    abstract TEXT,
    publication_year INTEGER,
    research_area VARCHAR(255),
    keywords VARCHAR(1000),
    journal VARCHAR(500),
    doi VARCHAR(255) UNIQUE,
    pdf_url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_research_papers_title
    ON research_papers(title);

CREATE INDEX IF NOT EXISTS idx_research_papers_authors
    ON research_papers(authors);

CREATE INDEX IF NOT EXISTS idx_research_papers_publication_year
    ON research_papers(publication_year);

CREATE INDEX IF NOT EXISTS idx_research_papers_research_area
    ON research_papers(research_area);

CREATE INDEX IF NOT EXISTS idx_research_papers_keywords
    ON research_papers(keywords);