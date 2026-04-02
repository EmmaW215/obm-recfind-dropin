"""Seed Database Script — Import JSON data into Supabase PostgreSQL

Usage:
    python scripts/seed_database.py --dry-run     # Validate only
    python scripts/seed_database.py               # Insert into DB (needs DATABASE_URL)
"""
import json, os, sys, argparse, logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "..", "data", "seed")


def load_json(filepath):
    with open(filepath, "r") as f:
        return json.load(f)


def validate_data(facilities, activities):
    """Validate data integrity without DB connection."""
    required_fac = {"id", "name", "facility_type", "address", "latitude", "longitude"}
    required_act = {"id", "name", "category", "age_group", "facility_id", "date", "start_time", "end_time"}
    errors = 0

    for f in facilities:
        missing = required_fac - set(f.keys())
        if missing:
            logger.error(f"Facility {f.get('id','?')} missing: {missing}")
            errors += 1

    facility_ids = {f["id"] for f in facilities}
    orphans = sum(1 for a in activities if a.get("facility_id") not in facility_ids)
    if orphans:
        logger.warning(f"{orphans} activities reference non-existent facilities")
        errors += orphans

    cats = {}
    facs = {}
    for a in activities:
        cats[a.get("category","?")] = cats.get(a.get("category","?"), 0) + 1
        facs[a.get("facility_id","?")] = facs.get(a.get("facility_id","?"), 0) + 1

    logger.info(f"\n{'='*50}")
    logger.info(f"VALIDATION SUMMARY")
    logger.info(f"  Facilities: {len(facilities)}")
    logger.info(f"  Activities: {len(activities)}")
    logger.info(f"  Errors: {errors}")
    logger.info(f"\n  By category:")
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        logger.info(f"    {c:20s} {n:4d}")
    logger.info(f"\n  By facility:")
    for f, n in sorted(facs.items(), key=lambda x: -x[1]):
        logger.info(f"    {f:30s} {n:4d}")

    return errors == 0


def seed_to_db(facilities, activities, db_url):
    """Insert data into PostgreSQL."""
    import psycopg2
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    try:
        for fac in facilities:
            cur.execute("""
                INSERT INTO facilities (id, name, facility_type, address, location,
                    phone, website_url, amenities, has_pool, has_arena, has_fitness, notes)
                VALUES (%s,%s,%s,%s, ST_SetSRID(ST_MakePoint(%s,%s),4326), %s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, updated_at=NOW()
            """, (fac["id"], fac["name"], fac["facility_type"], fac["address"],
                  fac["longitude"], fac["latitude"], fac.get("phone"), fac.get("website_url"),
                  fac.get("amenities",[]), fac.get("has_pool",False),
                  fac.get("has_arena",False), fac.get("has_fitness",False), fac.get("notes")))
        conn.commit()
        logger.info(f"Seeded {len(facilities)} facilities")

        for act in activities:
            cur.execute("""
                INSERT INTO activities (id, program_id, name, category, age_group,
                    facility_id, room, date, start_time, end_time,
                    cost_amount, cost_type, spots_left, is_full, activity_type, source_category)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (id) DO UPDATE SET spots_left=EXCLUDED.spots_left, is_full=EXCLUDED.is_full, updated_at=NOW()
            """, (act["id"], act.get("program_id"), act["name"], act["category"], act["age_group"],
                  act["facility_id"], act.get("room"), act["date"], act["start_time"], act["end_time"],
                  act.get("cost_amount",0), act.get("cost_type","free"), act.get("spots_left"),
                  act.get("is_full",False), act.get("activity_type","drop_in"), act.get("source_category")))
        conn.commit()
        logger.info(f"Seeded {len(activities)} activities")

        cur.execute("SELECT COUNT(*) FROM facilities")
        logger.info(f"DB facilities: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM activities")
        logger.info(f"DB activities: {cur.fetchone()[0]}")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Seed RecFindOBM database")
    parser.add_argument("--dry-run", action="store_true", help="Validate only")
    args = parser.parse_args()

    fac_data = load_json(os.path.join(DATA_DIR, "oakville_facilities.json"))
    prog_data = load_json(os.path.join(DATA_DIR, "oakville_programs.json"))
    facilities = fac_data.get("facilities", [])
    activities = prog_data.get("activities", [])

    valid = validate_data(facilities, activities)

    if args.dry_run:
        logger.info(f"[DRY RUN] {'PASSED' if valid else 'FAILED'} \u2014 no data inserted")
        sys.exit(0 if valid else 1)

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not set. Use --dry-run to validate without DB.")
        sys.exit(1)

    seed_to_db(facilities, activities, db_url)
    logger.info("Seed complete!")


if __name__ == "__main__":
    main()
