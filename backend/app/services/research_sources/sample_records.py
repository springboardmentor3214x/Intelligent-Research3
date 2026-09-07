"""
Sample OpenAlex-shaped records for development / integration testing.

These are real-structure examples (no live API call needed).
They mirror the exact JSON format OpenAlex returns so tests and
manual runs are reproducible.

DO NOT import these into production ingestion code.
Production ingestion must always call the live API.
"""

# ---------------------------------------------------------------------------
# Record 1 — full record with DOI, abstract, authors, keywords
# ---------------------------------------------------------------------------
SAMPLE_OPENALEX_RECORD_1: dict = {
    "id": "https://openalex.org/W2741809807",
    "doi": "https://doi.org/10.1038/nature14539",
    "title": "Human-level control through deep reinforcement learning",
    "abstract_inverted_index": {
        "The": [0],
        "theory": [1],
        "of": [2],
        "reinforcement": [3],
        "learning": [4],
        "provides": [5],
        "a": [6],
        "normative": [7],
        "account": [8],
    },
    "authorships": [
        {"author": {"display_name": "Volodymyr Mnih"}},
        {"author": {"display_name": "Koray Kavukcuoglu"}},
        {"author": {"display_name": "David Silver"}},
    ],
    "publication_date": "2015-02-26",
    "publication_year": 2015,
    "primary_location": {
        "source": {"display_name": "Nature"},
        "landing_page_url": "https://www.nature.com/articles/nature14539",
    },
    "keywords": [
        {"display_name": "reinforcement learning"},
        {"display_name": "deep learning"},
        {"display_name": "artificial intelligence"},
    ],
    "concepts": [
        {"display_name": "Reinforcement learning", "score": 0.95},
        {"display_name": "Deep learning", "score": 0.88},
    ],
    "open_access": {"oa_url": "https://www.nature.com/articles/nature14539.pdf"},
    "best_oa_location": None,
}

# ---------------------------------------------------------------------------
# Record 2 — missing abstract and DOI (should still be processed)
# ---------------------------------------------------------------------------
SAMPLE_OPENALEX_RECORD_2: dict = {
    "id": "https://openalex.org/W1234567890",
    "doi": None,
    "title": "Attention Is All You Need",
    "abstract_inverted_index": None,
    "authorships": [
        {"author": {"display_name": "Ashish Vaswani"}},
        {"author": {"display_name": "Noam Shazeer"}},
    ],
    "publication_date": "2017-06-12",
    "publication_year": 2017,
    "primary_location": {
        "source": {"display_name": "arXiv"},
        "landing_page_url": "https://arxiv.org/abs/1706.03762",
    },
    "keywords": [],
    "concepts": [
        {"display_name": "Natural language processing", "score": 0.92},
    ],
    "open_access": {"oa_url": "https://arxiv.org/pdf/1706.03762.pdf"},
    "best_oa_location": None,
}

# ---------------------------------------------------------------------------
# Record 3 — missing title (must be rejected by normalizer)
# ---------------------------------------------------------------------------
SAMPLE_OPENALEX_RECORD_MISSING_TITLE: dict = {
    "id": "https://openalex.org/W9999999999",
    "doi": "https://doi.org/10.0000/fake.no.title",
    "title": "",
    "abstract_inverted_index": None,
    "authorships": [],
    "publication_date": None,
    "publication_year": None,
    "primary_location": {},
    "keywords": [],
    "concepts": [],
    "open_access": {},
    "best_oa_location": None,
}

# ---------------------------------------------------------------------------
# Record 4 — DOI with URL prefix (tests normalize_doi)
# ---------------------------------------------------------------------------
SAMPLE_OPENALEX_RECORD_DOI_VARIANTS: list[dict] = [
    {**SAMPLE_OPENALEX_RECORD_1, "doi": "https://doi.org/10.1038/nature14539"},
    {**SAMPLE_OPENALEX_RECORD_1, "doi": "http://dx.doi.org/10.1038/nature14539"},
    {**SAMPLE_OPENALEX_RECORD_1, "doi": "DOI: 10.1038/nature14539"},
    {**SAMPLE_OPENALEX_RECORD_1, "doi": "10.1038/nature14539"},
]

# ---------------------------------------------------------------------------
# Convenience list for bulk tests
# ---------------------------------------------------------------------------
SAMPLE_RECORDS: list[dict] = [
    SAMPLE_OPENALEX_RECORD_1,
    SAMPLE_OPENALEX_RECORD_2,
]
