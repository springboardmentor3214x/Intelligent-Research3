"""
Repeatable research sync job — Module 3.

Run from backend/ directory:

    python -m app.jobs.research_sync --query "machine learning healthcare"
    python -m app.jobs.research_sync --query "climate change" --per-page 50 --pages 2
    python -m app.jobs.research_sync --query "cancer immunotherapy" --page 1 --per-page 25

Environment variables required (see .env.example):
    DATABASE_URL   - PostgreSQL connection string
    OPENALEX_MAILTO - (optional) polite-pool e-mail for OpenAlex
"""

import argparse
import json
import logging
import sys

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import research_paper  # noqa: F401 — ensures table is registered
from app.services.research_ingestion_service import ResearchIngestionService
from app.services.research_sources.openalex_client import OpenAlexClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("research_sync")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m app.jobs.research_sync",
        description="Ingest research papers from OpenAlex into the database.",
    )
    parser.add_argument(
        "--query",
        required=True,
        help="Search keyword(s) to query OpenAlex, e.g. 'machine learning healthcare'",
    )
    parser.add_argument(
        "--page",
        type=int,
        default=1,
        help="Starting page number (1-based, default: 1)",
    )
    parser.add_argument(
        "--pages",
        type=int,
        default=1,
        help="Number of pages to fetch (default: 1)",
    )
    parser.add_argument(
        "--per-page",
        type=int,
        default=25,
        dest="per_page",
        help="Records per page, max 200 (default: 25)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    settings = get_settings()

    # Build client — mailto is read from env if set, never hardcoded
    mailto: str | None = getattr(settings, "OPENALEX_MAILTO", None) or None
    client = OpenAlexClient(mailto=mailto)
    service = ResearchIngestionService(client=client)

    totals = {"fetched": 0, "inserted": 0, "updated": 0, "skipped_duplicates": 0, "failed": 0}

    db = SessionLocal()
    try:
        for page_num in range(args.page, args.page + args.pages):
            logger.info(
                "Syncing page %d/%d for query=%r per_page=%d",
                page_num, args.page + args.pages - 1, args.query, args.per_page,
            )
            summary = service.run_sync(
                db=db,
                query=args.query,
                page=page_num,
                per_page=args.per_page,
            )
            for k in totals:
                totals[k] += getattr(summary, k)

            # Stop early if no results returned (end of result set)
            if summary.fetched == 0:
                logger.info("No more results — stopping early.")
                break

    finally:
        db.close()

    result = json.dumps(totals, indent=2)
    print(result)
    logger.info("Final totals: %s", result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
