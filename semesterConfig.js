// semesterConfig.js - Configuration for available semesters
const SEMESTER_CONFIG = {
  available: [
    {
      id: '2026-spring',
      label: 'Spring 2026',
      mitCatalog: 'MIT_CATALOG_2026_SPRING',
      wellesleyCatalog: 'WELLESLEY_CATALOG_2026_SPRING'
    },
    {
      id: '2025-fall',
      label: 'Fall 2025',
      mitCatalog: 'MIT_CATALOG_2025_FALL',
      wellesleyCatalog: 'WELLESLEY_CATALOG_2025_FALL'
    }
    // Add more semesters here as they become available
    // {
    //   id: '2027-spring',
    //   label: 'Spring 2027',
    //   mitCatalog: 'MIT_CATALOG_2027_SPRING',
    //   wellesleyCatalog: 'WELLESLEY_CATALOG_2027_SPRING'
    // }
  ],
  default: '2026-spring' // Default semester to show
};

// Helper function to get catalog data
function getCatalogData(semesterId) {
  const semester = SEMESTER_CONFIG.available.find(s => s.id === semesterId);
  if (!semester) return { mit: '', wellesley: '' };
  
  return {
    mit: window[semester.mitCatalog] || '',
    wellesley: window[semester.wellesleyCatalog] || ''
  };
}
