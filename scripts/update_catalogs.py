#!/usr/bin/env python3
"""Download current course data and write the browser-ready catalog."""
from datetime import datetime
from html import unescape
from pathlib import Path
import argparse, json, re, ssl, urllib.request
ROOT=Path(__file__).resolve().parents[1]
MIT_URL="https://fireroad.mit.edu/courses/all?full=true"; WELLESLEY_URL="https://courses.wellesley.edu/"
HEADERS={"User-Agent":"Wellesley-MIT-Course-Finder/2.0 (+https://github.com/melodygillian/Wellesley-MIT-course-finder)"}
def fetch(url,insecure=False):
    context=ssl._create_unverified_context() if insecure else None
    with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),context=context,timeout=90) as response:return response.read()
def hhmm(hour,minute=0,evening=False):
    hour=int(hour);minute=int(minute or 0)
    if evening or hour<8:hour+=12
    return f"{hour:02d}:{minute:02d}"
def mit_time(raw,evening=False):
    raw=raw.upper().replace(" PM","");match=re.fullmatch(r"(\d{1,2})(?:\.(\d{2}))?(?:-(\d{1,2})(?:\.(\d{2}))?)?",raw)
    if not match:return None
    sh,sm,eh,em=match.groups();start=hhmm(sh,sm,evening)
    if eh:end=hhmm(eh,em,evening)
    else:
        total=int(start[:2])*60+int(start[3:])+60;end=f"{total//60:02d}:{total%60:02d}"
    return start,end
def mit_groups(schedule):
    groups=[]
    for section in (schedule or "").split(";"):
        pieces=section.split(",");options=[]
        if len(pieces)<2:continue
        for value in pieces[1:]:
            bits=value.split("/")
            if value=="TBA" or len(bits)<4:continue
            parsed=mit_time(bits[3],bits[2]=="1")
            if parsed and re.fullmatch(r"[MTWRF]+",bits[1]):options.append({"days":list(bits[1]),"start":parsed[0],"end":parsed[1],"room":bits[0]})
        unique=[]
        for option in options:
            if option not in unique:unique.append(option)
        if unique:groups.append({"type":pieces[0],"options":unique})
    return groups
def get_mit(raw=None):
    courses=[]
    for row in json.loads(raw if raw is not None else fetch(MIT_URL)):
        if not row.get("offered_fall") or not row.get("schedule"):continue
        groups=mit_groups(row["schedule"])
        if groups:courses.append({"code":row["subject_id"],"title":row["title"],"level":row.get("level",""),"description":row.get("description",""),"groups":groups,"url":row.get("url") or "https://student.mit.edu/catalog/index.cgi"})
    return courses
def clean(value):return re.sub(r"\s+"," ",unescape(re.sub(r"<[^>]+>","",value))).strip()
def to_24(value):
    match=re.fullmatch(r"(\d{1,2}):(\d{2})\s*([AP]M)",value.strip(),re.I)
    if not match:return None
    hour=int(match[1])%12+(12 if match[3].upper()=="PM" else 0);return f"{hour:02d}:{match[2]}"
def get_wellesley(raw=None):
    page=(raw if raw is not None else fetch(WELLESLEY_URL)).decode("utf-8","replace");term_match=re.search(r"Listing for:\s*<b>([^<]+)",page);courses=[]
    for block in re.findall(r'<div class="w-clearfix courseitem">(.*?)(?=<div class="w-clearfix courseitem">|</body>)',page,re.S):
        head=re.search(r'id=bgrnd_\d+>\s*(.*?)\s*<span class="professorname">(.*?)</span>',block,re.S);detail=re.search(r'class="coursename_small"><p>(.*?)</p><span class="professorname">(.*?)</span>',block,re.S);crn=re.search(r"displayCourse\('([^']+)'",block)
        if not head or not detail:continue
        code=clean(head[1]);info=clean(head[2]);title=clean(detail[1]);instructor=clean(detail[2]);meetings=[]
        for meeting in re.finditer(r"(?:^|;)\s*([MTWRF]+)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)",info,re.I):
            start,end=to_24(meeting[2]),to_24(meeting[3])
            if start and end:meetings.append({"days":list(meeting[1].upper()),"start":start,"end":end})
        if meetings:courses.append({"id":(crn[1] if crn else code).replace('"',''),"code":code,"title":title,"instructor":instructor,"meetings":meetings})
    return (clean(term_match[1]) if term_match else "Current term"),courses
def main():
    parser=argparse.ArgumentParser();parser.add_argument("--mit-file",type=Path);parser.add_argument("--wellesley-file",type=Path);args=parser.parse_args()
    wellesley_raw=args.wellesley_file.read_bytes() if args.wellesley_file else None;mit_raw=args.mit_file.read_bytes() if args.mit_file else None
    existing_path=ROOT/"data"/"catalogs.js"
    if existing_path.exists():existing=json.loads(existing_path.read_text(encoding="utf-8")[len("window.CATALOG_DATA="):-2])
    else:
        target=ROOT/"data";meta_file=target/"catalog-meta.js";well_file=target/"wellesley.js"
        meta=json.loads(meta_file.read_text(encoding="utf-8")[len("window.CATALOG_META="):-2]) if meta_file.exists() else {}
        wellesley_existing=json.loads(well_file.read_text(encoding="utf-8")[len("window.WELLESLEY_COURSES="):-2]) if well_file.exists() else []
        mit_existing=[]
        for part in sorted(target.glob("mit-*.js")):
            raw=part.read_text(encoding="utf-8");mit_existing.extend(json.loads(raw[raw.index("push(")+5:-3]))
        existing={"meta":meta,"wellesley":wellesley_existing,"mit":mit_existing}
    try:term,wellesley=get_wellesley(wellesley_raw)
    except Exception as error:term,wellesley=existing.get("meta",{}).get("term","Current term"),existing.get("wellesley",[]);print(f"Wellesley refresh unavailable; keeping {len(wellesley)} verified sections: {error}")
    try:mit=get_mit(mit_raw)
    except Exception as error:mit=existing.get("mit",[]);print(f"MIT refresh unavailable; keeping {len(mit)} verified subjects: {error}")
    if not wellesley or not mit:raise RuntimeError("No usable catalog data; refusing to replace the existing catalog")
    payload={"meta":{"term":term,"updated":datetime.now().astimezone().strftime("%Y-%m-%d %H:%M %Z"),"sources":{"wellesley":WELLESLEY_URL,"mit":MIT_URL}},"wellesley":wellesley,"mit":mit}
    target=ROOT/"data"; (target/"catalog-meta.js").write_text("window.CATALOG_META="+json.dumps(payload["meta"],separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")
    (target/"wellesley.js").write_text("window.WELLESLEY_COURSES="+json.dumps(wellesley,separators=(",",":"),ensure_ascii=False)+";\n",encoding="utf-8")
    for old in target.glob("mit-*.js"):old.unlink()
    for index,start in enumerate(range(0,len(mit),350),1):(target/f"mit-{index}.js").write_text("window.MIT_COURSE_PARTS=window.MIT_COURSE_PARTS||[];window.MIT_COURSE_PARTS.push("+json.dumps(mit[start:start+350],separators=(",",":"),ensure_ascii=False)+");\n",encoding="utf-8")
    print(f"Wrote {len(wellesley)} Wellesley sections and {len(mit)} MIT subjects for {term}.")
if __name__=="__main__":main()
