import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import SessionLocal
from app.models.role import Role
from app.models.user import AccountType, generate_timestamp_ms

ROLES_TO_SEED = [
    {
        "name": AccountType.INDIVIDUAL.value,
        "description": "A standalone individual user with personal access.",
    },
    {
        "name": AccountType.ORG_OWNER.value,
        "description": "The owner of an organization with full administrative control.",
    },
    {
        "name": AccountType.ORG_ADMIN.value,
        "description": "An administrator within an organization with elevated privileges.",
    },
    {
        "name": AccountType.ORG_MEMBER.value,
        "description": "A standard member of an organization with basic access.",
    },
    {
        "name": AccountType.ORG_CLIENT.value,
        "description": "A client associated with an organization with limited access.",
    },
]


def seed_roles():
    db = SessionLocal()
    try:
        inserted = 0
        skipped = 0

        for role_data in ROLES_TO_SEED:
            existing = db.query(Role).filter(Role.name == role_data["name"]).first()
            if existing:
                print(f"  [SKIP] Role already exists: {role_data['name']}")
                skipped += 1
                continue

            now = generate_timestamp_ms()
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                isActive=True,
                createdAt=now,
                updatedAt=now,
            )
            db.add(role)
            inserted += 1
            print(f"  [INSERT] Role seeded: {role_data['name']}")

        db.commit()
        print(f"\nDone. {inserted} inserted, {skipped} skipped.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding roles...\n")
    seed_roles()
