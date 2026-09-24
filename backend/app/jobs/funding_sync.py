"""
backend/app/jobs/funding_sync.py
Author: Kaviya (Member 4 — Module 4: Funding Data Ingestion)

CLI entry-point for the repeatable funding opportunity sync job.

Usage:
    cd backend
    python -m app.jobs.funding_sync                          # default keywords + limit
    python -m app.jobs.funding_sync --keywords "AI health"   # custom keywords
    python -m app.jobs.funding_sync --limit 100              # fetch up to 100 records
    python -m app.jobs.funding_sync --sources nih            # only NIH RePORTER
    python -m app.jobs.funding_sync --sources grants         # only Grants.gov
    python -m app.jobs.funding_sync --sources nih grants     # both (default)

The job:
  1. Creates all DB tables if they don't exist (idempotent — safe to run on
     a fresh database; the proper migration is `alembic upgrade head`).
  2. Runs the ingestion service for each enabled source.
  3. Prints a human-readable summary table.
  4. Exits with code 0 on success, 1 if any source had errors.

This script is designed to be run on a schedule (cron / task scheduler) or
manually during development.  It does NOT start a web server.
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.schemas.funding import IngestionSummary
from app.services.funding_ingestion import run_ingestion
from app.services.funding_sources.grants_gov_client import GrantsGovClient
from app.services.funding_sources.nih_reporter_client import NIHReporterClient

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("funding_sync")

# ── Default search keywords (covers broad research areas) ─────────────────────
DEFAULT_KEYWORDS = [
    "artificial intelligence",
    "machine learning",
    "biomedical research",
    "data science",
    "healthcare technology",
    "computer science",
    "engineering innovation",
]


def _ensure_tables() -> None:
    """
    Create all tables if they don't exist.
    Use `alembic upgrade head` for production; this is a dev convenience.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified / created.")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="funding_sync",
        description="Sync funding opportunities from NIH RePORTER and Grants.gov.",
    )
    parser.add_argument(
        "--keywords",
        nargs="+",
        default=DEFAULT_KEYWORDS,
        metavar="KEYWORD",
        help="Keywords to search for (space-separated). Default: broad research terms.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        metavar="N",
        help="Maximum records to fetch per source (default: 50).",
    )
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=["nih", "grants"],
        default=["nih", "grants"],
        metavar="SOURCE",
        help="Sources to sync: nih | grants (default: both).",
    )
    return parser


def _print_summary(summaries: list[IngestionSummary], elapsed_s: float) -> None:
    """Print a formatted sync summary table."""
    separator = "─" * 72
    print(f"\n{'Funding Sync Report':^72}")
    print(separator)
    print(
        f"{'Source':<20} {'Fetched':>8} {'Inserted':>9} "
        f"{'Updated':>8} {'Dup skip':>9} {'Malformed':>10}"
    )
    print(separator)
    total_inserted = total_updated = 0
    has_errors = False

    for s in summaries:
        print(
            f"{s.source:<20} {s.fetched:>8} {s.inserted:>9} "
            f"{s.updated:>8} {s.skipped_duplicates:>9} {s.skipped_malformed:>10}"
        )
        total_inserted += s.inserted
        total_updated += s.updated
        if s.errors:
            has_errors = True
            for err in s.errors:
                print(f"  ⚠  ERROR: {err}")

    print(separator)
    print(
        f"{'TOTAL':<20} "
        f"{'':>8} {total_inserted:>9} {total_updated:>8}"
    )
    print(separator)
    print(f"Elapsed: {elapsed_s:.1f}s   Status: {'✗ ERRORS' if has_errors else '✓ OK'}\n")


async def _run(args: argparse.Namespace) -> int:
    """Main async entry point."""
    _ensure_tables()

    # ── Build enabled sources ─────────────────────────────────────────────────
    source_map = {
        "nih":    NIHReporterClient(),
        "grants": GrantsGovClient(),
    }
    enabled_sources = [source_map[s] for s in args.sources]

    logger.info(
        "Starting sync — keywords=%r limit=%d sources=%r",
        args.keywords,
        args.limit,
        [c.source_id for c in enabled_sources],
    )

    start = datetime.now(timezone.utc)
    summaries: list[IngestionSummary] = []
    exit_code = 0

    db: Session = SessionLocal()
    try:
        for client in enabled_sources:
            summary = await run_ingestion(
                db=db,
                source_client=client,
                keywords=args.keywords,
                limit=args.limit,
            )
            summaries.append(summary)
            if summary.errors:
                exit_code = 1
    finally:
        db.close()

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    _print_summary(summaries, elapsed)
    return exit_code


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()
    sys.exit(asyncio.run(_run(args)))


if __name__ == "__main__":
    main()
