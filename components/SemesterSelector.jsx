// SemesterSelector.jsx - Dropdown to select semester
const SemesterSelector = ({ selectedSemester, onSemesterChange }) => {
  return (
    <div className="border-4 border-black p-6 mb-8 bg-gray-50">
      <div className="flex items-center gap-4">
        <label className="text-lg font-bold">Select Semester:</label>
        <select
          value={selectedSemester}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="px-6 py-3 border-2 border-black font-bold text-lg bg-white cursor-pointer"
        >
          {SEMESTER_CONFIG.available.map(semester => (
            <option key={semester.id} value={semester.id}>
              {semester.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Course catalog and schedules will be displayed for the selected semester
      </p>
    </div>
  );
};
