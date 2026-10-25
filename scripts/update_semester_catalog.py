#!/usr/bin/env python3
"""Build one browser-ready semester catalog from Wellesley and FireRoad data."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
import io
import json
from pathlib import Path
import re

from update_catalogs import MIT_URL, fetch, get_mit, to_24


ROOT = Path(__file__).resolve().parents[1]
WELLESLEY_EXPORT_URL = "https://courses.wellesley.edu/export?semester={semester_code}"


def load_existing(path: Path) -> dict:
    if not path.exists():
        return {}
    match = re.search(
        r"window\.SEMESTER_CATALOGS\[[^\]]+\]=(.*);\s*$",
        path.read_text(encoding="utf-8"),
        re.S,
    )
    return json.loads(match.group(1)) if match else {}


def parse_wellesley_csv(raw: bytes, semester_code: str) -> list[dict]:
    rows = csv.DictReader(io.StringIO(raw.decode("utf-8-sig", "replace")))
    courses = []
    for row in rows:
        times = [value.strip() for value in row.get("Meeting Time(s)", "").split(";") if value.strip()]
        day_groups = [value.strip().upper() for value in row.get("Day(s)", "").split(";") if value.strip()]
        if not times or len(times) != len(day_groups):
            continue

        meetings = []
        for days, time_range in zip(day_groups, times):
            match = re.fullmatch(r"(.+?)\s+-\s+(.+)", time_range)
            if not match or not re.fullmatch(r"[MTWRF]+", days):
                continue
            start, end = to_24(match.group(1)), to_24(match.group(2))
            if start and end:
                meetings.append({"days": list(days), "start": start, "end": end})

        if not meetings:
            continue

        course = row.get("Course", "").strip()
        crn = row.get("CRN", "").strip()
        courses.append(
            {
                "id": f"{semester_code}-{crn or course}",
                "code": course,
                "title": row.get("Title", "").strip(),
                "instructor": row.get("Instructor", "").strip(),
                "meetings": meetings,
            }
        )
    return courses


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", default="2027-spring")
    parser.add_argument("--term", default="Spring 2027")
    parser.add_argument("--semester-code", default="202702")
    parser.add_argument("--mit-season", choices=("fall", "spring"), default="spring")
    parser.add_argument("--wellesley-file", type=Path)
    parser.add_argument("--mit-file", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "data" / "spring-2027.js")
    args = parser.parse_args()
    existing = load_existing(args.output)

    try:
        if args.wellesley_file:
            wellesley_raw = args.wellesley_file.read_bytes()
        else:
            wellesley_raw = fetch(
                WELLESLEY_EXPORT_URL.format(semester_code=args.semester_code),
                insecure=True,
            )
        wellesley = parse_wellesley_csv(wellesley_raw, args.semester_code)
    except Exception as error:
        wellesley = existing.get("wellesley", [])
        print(
            f"Wellesley refresh unavailable; keeping {len(wellesley)} verified sections: {error}"
        )

    try:
        mit_raw = args.mit_file.read_bytes() if args.mit_file else fetch(MIT_URL, insecure=True)
        mit = get_mit(mit_raw, args.mit_season)
    except Exception as error:
        mit = existing.get("mit", [])
        print(f"MIT refresh unavailable; keeping {len(mit)} verified subjects: {error}")

    if not wellesley or not mit:
        raise RuntimeError("No usable catalog data; refusing to replace the semester catalog")

    updated = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z")
    payload = {
        "meta": {
            "term": args.term,
            "updated": updated,
            "sources": {
                "wellesley": WELLESLEY_EXPORT_URL.format(semester_code=args.semester_code),
                "mit": MIT_URL,
            },
        },
        "wellesley": wellesley,
        "mit": mit,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        "window.SEMESTER_CATALOGS=window.SEMESTER_CATALOGS||{};"
        f"window.SEMESTER_CATALOGS[{json.dumps(args.id)}]="
        + json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(wellesley)} Wellesley sections and {len(mit)} MIT subjects "
        f"for {args.term}."
    )


if __name__ == "__main__":
    main()
