window.SEMESTER_CATALOGS = window.SEMESTER_CATALOGS || {};

window.SEMESTER_CATALOGS['2026-fall'] = {
  meta: window.CATALOG_META || { term: 'Fall 2026', updated: 'recently' },
  wellesley: window.WELLESLEY_COURSES || [],
  mit: (window.MIT_COURSE_PARTS || []).flat()
};

window.SEMESTER_CONFIG = {
  default: '2027-spring',
  available: [
    { id: '2027-spring', label: 'Spring 2027' },
    { id: '2026-fall', label: 'Fall 2026' }
  ]
};
