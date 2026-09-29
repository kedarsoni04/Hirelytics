"""
Hirelytics — Database Seeding Launcher (Root Level)

Run this script from the project root:
    python seed_demo_data.py
    python seed_demo_data.py --reset

Or from src/:
    python -m app.seed_demo_data
"""

import sys
from pathlib import Path

# Ensure 'src' is in sys.path
src_dir = str(Path(__file__).resolve().parent / "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)


from app.seed_demo_data import seed_data  # pyright: ignore[reportMissingImports]
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hirelytics Demo Database Seeder")
    parser.add_argument(
        "--reset",
        "--force",
        dest="reset",
        action="store_true",
        help="Clear previous demo seed data and re-seed fresh",
    )
    args = parser.parse_args()
    seed_data(reset=args.reset)
