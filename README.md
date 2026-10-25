# CrossReg — Wellesley × MIT Course Matcher

CrossReg helps Wellesley students find MIT subjects that fit their current class schedule and the weekday Exchange Bus timetable.

## What it does

1. Students search the current Wellesley catalog by course code, title, or instructor and add sections to a weekly calendar.
2. Personal time blocks can reserve labs, practices, work, or any other busy period.
3. The matcher removes MIT subjects whose required meeting groups conflict with the complete calendar.
4. Results show compatible lecture, recitation, and lab options and a suggested Exchange Bus trip.
5. Students can add a compatible MIT course to the calendar and remove any Wellesley course, MIT course, or time block with one click.
6. Search, level, and minimum student-rating filters narrow the results. Each result shows its FireRoad course-evaluation rating, estimated weekly workload, formal prerequisites, any clearly worded recommended preparation, and 🍂 Fall / 🌸 Spring offering badges.
7. A short guide at the top explains the complete planning flow. The entire schedule is saved in the browser.
8. Semester tabs keep Spring 2027 as the default while preserving Fall 2026 schedules and course data for reference.
9. The degree planner covers the 55 major pages in Wellesley's official 2026–27 catalog plus college-wide graduation requirements. Students can check off completed requirement groups, see possible Spring 2027 matches for the remaining machine-readable rules, and add a section directly to the calendar.

The generated catalog contains the complete set of scheduled courses exposed by the two upstream sources. Wellesley sections without a published meeting time and MIT subjects marked TBA are omitted because compatibility cannot be determined.

## Automatic catalog updates

`scripts/update_semester_catalog.py` downloads Spring 2027 sections from the [Wellesley Course Browser](https://courses.wellesley.edu/) spreadsheet export and Spring offerings from the [FireRoad catalog API](https://fireroad.mit.edu/reference/catalog). The generated browser-ready file is checked into the repository so the static site stays fast and available. The prior Fall 2026 catalog remains available through its tab.

`scripts/update_requirements.py` rebuilds the planning index from the official [2026–27 Programs of Study](https://catalog.wellesley.edu/index.php?view=programs&year=2026-2027). The interface preserves the official requirement wording and links to each major page because cohort rules, concentrations, placement, transfer credit, and advisor approvals cannot always be reduced to a course-code checklist.

The GitHub Actions workflow refreshes Spring 2027 every weekday and can also be run manually from the Actions tab. The weekday trips in `data/shuttle.js` were last verified against the official [Exchange Bus schedule](https://www.wellesley.edu/about-us/offices-departments/transportation/shuttle-bus-schedule) on October 24, 2026.

## Run locally

Open `index.html`, or serve the folder with any static web server. No build step or package installation is required.
