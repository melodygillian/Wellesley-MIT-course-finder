# Wellesley-MIT-course-finder
Website designed for student to browse for a course to fit in the existing schedule from both MIT and Wellesley catalog, options suggested with the shuttle schedule assuming student is leaving from Wellesley to MIT.

# Course Schedule Finder

A web application to help MIT and Wellesley students find compatible courses across multiple semesters.

## Features

- **Multi-Semester Support**: Easily switch between Spring, Fall, and future semesters
- **Visual Schedule Grid**: See your weekly schedule at a glance
- **Conflict Detection**: Automatically detects time conflicts with buffer periods
- **Cross-Campus Support**: Handles MIT and Wellesley courses
- **Bus Schedule Integration**: Recommends shuttle times for cross-campus courses
- **Department Consultation Alerts**: Identifies courses requiring schedule consultation

## Setup

1. Clone this repository
2. Update catalog data in `data/semesters/` for each semester
3. Open `index.html` in a web browser
4. No build process required - runs directly in the browser

## Adding New Semesters

### 1. Create Catalog Files

Create a new folder in `data/semesters/` (e.g., `2027-spring/`) with:
- `mitCatalog.js` - Define `MIT_CATALOG_2027_SPRING`
- `wellesleyCatalog.js` - Define `WELLESLEY_CATALOG_2027_SPRING`

### 2. Update Configuration

Add the new semester to `data/semesterConfig.js`:
```javascript
{
  id: '2027-spring',
  label: 'Spring 2027',
  mitCatalog: 'MIT_CATALOG_2027_SPRING',
  wellesleyCatalog: 'WELLESLEY_CATALOG_2027_SPRING'
}
```

### 3. Load in HTML

Add script tags in `index.html`:
```html
<script src="data/semesters/2027-spring/mitCatalog.js"></script>
<script src="data/semesters/2027-spring/wellesleyCatalog.js"></script>
```

That's it! The new semester will appear in the dropdown automatically.

## File Structure
```
course-schedule-finder/
├── index.html
├── App.jsx
├── README.md
├── data/
│   ├── semesterConfig.js              # Semester configuration
│   ├── busSchedule.js                 # Bus schedule
│   └── semesters/
│       ├── 2025-fall/
│       │   ├── mitCatalog.js
│       │   └── wellesleyCatalog.js
│       └── 2026-fall/
│           ├── mitCatalog.js
│           └── wellesleyCatalog.js
├── js/
│   ├── CourseParser.js
│   ├── ScheduleManager.js
│   └── BusScheduleHelper.js
└── components/
    ├── SemesterSelector.jsx
    ├── ScheduleTable.jsx
    ├── CourseForm.jsx
    ├── SearchPanel.jsx
    ├── ResultsList.jsx
    └── ConsultDeptSection.jsx
```

## Usage

1. **Select Semester**: Choose the term from the dropdown at the top
2. **Add Your Current Courses**: Enter course details
3. **View Your Schedule**: See courses in a weekly grid
4. **Search for Compatible Courses**: Choose MIT, Wellesley, or both
5. **Review Results**: See compatible courses with bus schedules

## License

MIT License
