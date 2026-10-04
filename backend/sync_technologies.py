"""Manual sync script for Module 6 — fetches real data from OpenAlex."""
import asyncio
import sys
sys.path.insert(0, '.')

TECHNOLOGIES = [
    ("Quantum Computing", "Quantum Technology"),
    ("Large Language Models", "Artificial Intelligence"),
    ("CRISPR Gene Editing", "Biotechnology"),
    ("Solid State Battery", "Clean Energy"),
    ("Edge AI", "Artificial Intelligence"),
    ("Blockchain", "Distributed Systems"),
    ("5G Networks", "Telecommunications"),
    ("Autonomous Vehicles", "Robotics & Automation"),
]

async def main():
    from app.db.session import SessionLocal
    from app.services.technology_sync_service import sync_technology

    db = SessionLocal()
    try:
        for name, domain in TECHNOLOGIES:
            print(f"Syncing: {name}...", end=" ", flush=True)
            try:
                result = await sync_technology(db, name, domain=domain, use_demo_fallback=False)
                stage = result.get("stage", "?")
                papers = result.get("research_papers_total", 0)
                orgs = result.get("organizations_found", 0)
                mode = result.get("data_mode", "?")
                print(f"OK | stage={stage} | papers={papers} | orgs={orgs} | mode={mode}")
            except Exception as e:
                print(f"ERROR: {e}")
    finally:
        db.close()
    print("\nSync complete!")

asyncio.run(main())
