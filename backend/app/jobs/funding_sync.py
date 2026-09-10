"""
Funding sync job — Module 4.

Run from backend/ directory:

    python -m app.jobs.funding_sync --query "artificial intelligence" --per-page 25
    python -m app.jobs.funding_sync --query "machine learning healthcare" --pages 2
    python -m app.jobs.funding_sync --query "climate change" --page 2 --per-page 50

Environment variables required:
    DATABASE_URL  - PostgreSQL connection string
"""
import argparse
import json
import logging
import sys

from app.db.session import SessionLocal
from app.models import funding  # noqa: F401 — ensures tables are registered
from app.services.funding_ingestion_service import FundingIngestionService
from app.services.funding_sources.grants_gov_client import GrantsGovClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("funding_sync")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m app.jobs.funding_sync",
        description="Ingest funding opportunities from grants.gov into the database.",
    )
    parser.add_argument("--query", required=True, help="Search keywords, e.g. 'artificial intelligence'")
    parser.add_argument("--page", type=int, default=1, help="Starting page (1-based, default: 1)")
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to fetch (default: 1)")
    parser.add_argument("--per-page", type=int, default=25, dest="per_page", help="Records per page (default: 25)")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    client = GrantsGovClient()
    service = FundingIngestionService(client=client)

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
