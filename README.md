# CrossReg — Wellesley × MIT Course Matcher

CrossReg helps Wellesley students find MIT subjects that fit their current class schedule and the weekday Exchange Bus timetable.

## What it does

1. Students search the current Wellesley catalog by course code, title, or instructor and add sections to a weekly calendar.
2. Personal time blocks can reserve labs, practices, work, or any other busy period.
3. The matcher removes MIT subjects whose required meeting groups conflict with the complete calendar.
4. Results show compatible lecture, recitation, and lab options and a suggested Exchange Bus trip.
5. Students can add a compatible MIT course to the calendar and remove any Wellesley course, MIT course, or time block with one click.
6. Search and level filters narrow the results. The entire schedule is saved in the browser.

The generated catalog contains the complete set of scheduled courses exposed by the two upstream sources. Wellesley sections without a published meeting time and MIT subjects marked TBA are omitted because compatibility cannot be determined.

## Automatic catalog updates

`scripts/update_catalogs.py` downloads current Wellesley sections from the [Wellesley Course Browser](https://courses.wellesley.edu/) and MIT subject data from the [FireRoad catalog API](https://fireroad.mit.edu/reference/catalog). It generates `data/catalogs.js`, which is checked into the repository so the static site stays fast and available.

The GitHub Actions workflow refreshes that data every weekday and can also be run manually from the Actions tab. When Wellesley switches terms, the displayed term changes automatically. Review `data/shuttle.js` against the official [Exchange Bus schedule](https://www.wellesley.edu/about-us/offices-departments/transportation/shuttle-bus-schedule) at the start of each term.

## Run locally

Open `index.html`, or serve the folder with any static web server. No build step or package installation is required.
