// App.jsx - Main application component
const { useState, useEffect } = React;

const App = () => {
  const [selectedSemester, setSelectedSemester] = useState(SEMESTER_CONFIG.default);
  const [existingCourses, setExistingCourses] = useState([]);
  const [searchMode, setSearchMode] = useState('both');
  const [results, setResults] = useState([]);
  const [consultDeptCourses, setConsultDeptCourses] = useState([]);

  // Clear schedule when semester changes
  useEffect(() => {
    setExistingCourses([]);
    setResults([]);
    setConsultDeptCourses([]);
  }, [selectedSemester]);

  const handleAddCourse = (course) => {
    setExistingCourses([...existingCourses, course]);
  };

  const handleRemoveCourse = (id) => {
    setExistingCourses(existingCourses.filter(c => c.id !== id));
  };

  const handleSearch = () => {
    const catalogData = getCatalogData(selectedSemester);
    let allCourses = [];
    let allConsultDept = [];
    
    if (searchMode === 'mit' || searchMode === 'both') {
      const { courses, consultDept } = CourseParser.parseMITCourse(catalogData.mit);
      allCourses = [...allCourses, ...courses];
      allConsultDept = [...allConsultDept, ...consultDept];
    }
    
    if (searchMode === 'wellesley' || searchMode === 'both') {
      const { courses, consultDept } = CourseParser.parseWellesleyCourse(catalogData.wellesley);
      allCourses = [...allCourses, ...courses];
      allConsultDept = [...allConsultDept, ...consultDept];
    }
    
    const compatible = ScheduleManager.findCompatibleCourses(existingCourses, allCourses);
    
    const withBusRecommendations = compatible.map(course => {
      const busRecommendations = course.meetingTimes.map(time => 
        BusScheduleHelper.findBestBusOption(time, course.source, existingCourses)
      ).filter(Boolean);
      
      return { ...course, busRecommendations };
    });
    
    setResults(withBusRecommendations);
    setConsultDeptCourses(allConsultDept);
  };

  const currentSemester = SEMESTER_CONFIG.available.find(s => s.id === selectedSemester);

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="border-b-4 border-black pb-6 mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">Course Schedule Finder</h1>
          <p className="text-xl text-gray-600">MIT & Wellesley Cross-Registration</p>
        </div>

        <SemesterSelector 
          selectedSemester={selectedSemester}
          onSemesterChange={setSelectedSemester}
        />

        <CourseForm onAddCourse={handleAddCourse} />
        
        <ScheduleTable 
          courses={existingCourses} 
          onRemoveCourse={handleRemoveCourse} 
        />
        
        <SearchPanel 
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          onSearch={handleSearch}
          semesterLabel={currentSemester?.label}
        />
        
        <ResultsList results={results} />
        
        <ConsultDeptSection courses={consultDeptCourses} />
      </div>
    </div>
  );
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
