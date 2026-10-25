#!/usr/bin/env python3
"""Build a compact planning index from Wellesley's official major pages."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from html import unescape
import json
from pathlib import Path
import re
from urllib.parse import urljoin

from update_catalogs import fetch


ROOT = Path(__file__).resolve().parents[1]
CATALOG_YEAR = "2026-2027"
PROGRAMS_URL = f"https://catalog.wellesley.edu/index.php?view=programs&year={CATALOG_YEAR}"


def text(value: str) -> str:
    value = re.sub(r"<script\b.*?</script>|<style\b.*?</style>", " ", value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>|</p>|</li>|</tr>|</h[1-6]>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value).replace("\xa0", " ")
    return re.sub(r"\s+", " ", value).strip()


def major_links(page: str) -> list[tuple[str, str]]:
    links = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.I | re.S):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.I | re.S)
        if len(cells) < 2:
            continue
        name = text(cells[0])
        match = re.search(r'<a[^>]+href="([^"]+)"[^>]*>\s*Major\s*</a>', cells[1], re.I | re.S)
        if name and match:
            links.append((name, urljoin(PROGRAMS_URL, unescape(match.group(1)))))
    return links


def course_patterns(value: str) -> list[dict]:
    patterns = []
    above = {(subject, int(number)) for subject, number in re.findall(r"\babove\s+([A-Z]{2,5})\s*(\d{3})\b", value, re.I)}
    for subject, number in above:
        patterns.append({"type": "above", "subject": subject.upper(), "number": number})
    for subject, start, end in re.findall(r"\b([A-Z]{2,5})\s+(\d{3})\s*[-–]\s*(\d{3})\b", value):
        patterns.append({"type": "range", "subject": subject, "start": int(start), "end": int(end)})
    for level, subject in re.findall(r"\b(?:any\s+)?([123])00-level\s+([A-Z]{2,5})\b", value):
        if subject not in {"UNITS", "COURSES", "WORK"}:
            patterns.append({"type": "level", "subject": subject, "level": int(level)})
    for subject, level in re.findall(r"\b([A-Z]{2,5})\s+(?:courses?\s+)?at\s+(?:the\s+)?([123])00\s+level\b", value):
        patterns.append({"type": "level", "subject": subject, "level": int(level)})
    ranges = {(p["subject"], p["start"], p["end"]) for p in patterns if p["type"] == "range"}
    for subject, number, suffix in re.findall(r"\b([A-Z]{2,5})\s*([0-9]{3})([A-Z]?)\b", value):
        number_value = int(number)
        if any(subject == s and start <= number_value <= end for s, start, end in ranges):
            continue
        if (subject, number_value) in above:
            continue
        pattern = {"type": "course", "code": f"{subject} {number}{suffix}"}
        if pattern not in patterns:
            patterns.append(pattern)
    return patterns


def requirement_fragment(page: str) -> str:
    section = re.search(r"<div class=['\"]section-right['\"]>(.*)</div>\s*</div>", page, re.I | re.S)
    body = section.group(1) if section else page
    headings = list(re.finditer(r"<h([2-5])\b[^>]*>(.*?)</h\1>", body, re.I | re.S))
    start = None
    for heading in headings:
        label = text(heading.group(2)).lower()
        if "major" in label and ("requirement" in label or label in {"the major", "major"}):
            start = heading.end()
            break
    if start is None:
        return body
    end = len(body)
    for heading in headings:
        if heading.start() <= start:
            continue
        label = text(heading.group(2)).lower()
        if any(stop in label for stop in ("honors", "minor", "graduate study", "advanced placement", "teacher certification")):
            end = heading.start()
            break
    return body[start:end]


def requirement_items(fragment: str) -> list[dict]:
    blocks = re.findall(r"<(h[3-5]|p|li|tr|div)\b[^>]*>(.*?)</\1>", fragment, re.I | re.S)
    items = []
    context = "Major requirements"
    saw_current_policy = False
    for tag, raw in blocks:
        value = text(raw)
        if not value:
            continue
        lower = value.lower()
        if "fall 2026" in lower or "fall 2025" in lower:
            saw_current_policy = True
        if saw_current_policy and lower.startswith("for students") and any(word in lower for word in ("prior", "before")):
            break
        if tag.lower().startswith("h"):
            context = value[:140]
            continue
        if len(value) > 520:
            sentences = re.split(r"(?<=[.!?;])\s+", value)
        else:
            sentences = [value]
        for sentence in sentences:
            sentence = sentence.strip()
            lower_sentence = sentence.lower()
            patterns = course_patterns(sentence)
            signals = (
                "required", "requirement", "must ", "must be", "complete", "consists",
                "at least", "one course", "two course", "three course", "four course",
                "five course", "six course", "seven course", "eight course", "nine course",
                "units", "courses include", "one of the following", "choose",
            )
            if tag.lower() != "li" and not patterns and not any(signal in lower_sentence for signal in signals):
                continue
            excluded = any(
                signal in lower_sentence
                for signal in (
                    "do not count", "does not count", "not count toward", "not required",
                    "recommended", "encouraged", "particularly relevant", "exception of",
                )
            )
            item = {
                "label": sentence[:420],
                "group": context,
                "patterns": [] if excluded else patterns,
            }
            if item not in items:
                items.append(item)
    return items[:140]


def parse_major(name: str, url: str) -> dict:
    page = fetch(url, insecure=True).decode("utf-8", "replace")
    fragment = requirement_fragment(page)
    items = requirement_items(fragment)
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name,
        "source": url,
        "requirements": items,
    }


def main() -> None:
    page = fetch(PROGRAMS_URL, insecure=True).decode("utf-8", "replace")
    links = major_links(page)
    with ThreadPoolExecutor(max_workers=6) as executor:
        majors = list(executor.map(lambda pair: parse_major(*pair), links))
    majors = [major for major in majors if major["requirements"]]
    output = ROOT / "data" / "requirements.js"
    output.write_text(
        "window.DEGREE_REQUIREMENTS="
        + json.dumps(
            {
                "catalogYear": CATALOG_YEAR,
                "source": PROGRAMS_URL,
                "generalSource": "https://www.wellesley.edu/about-us/offices-departments/registrar/degree-requirements",
                "majors": majors,
            },
            separators=(",", ":"),
            ensure_ascii=False,
        )
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(majors)} official major requirement pages to {output}")


if __name__ == "__main__":
    main()
