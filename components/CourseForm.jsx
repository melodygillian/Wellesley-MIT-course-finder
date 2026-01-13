// CourseForm.jsx - Form to add courses to schedule
const CourseForm = ({ onAddCourse }) => {
  const [newCourse, setNewCourse] = React.useState({
    name: '',
    days: [],
    startTime: '',
    endTime: '',
    location: 'MIT'
  });

  const daysOfWeek = ['M', 'T', 'W', 'R', 'F'];

  const toggleDay = (day) => {
    setNewCourse(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSubmit = () => {
    if (newCourse.name && newCourse.days.length > 0 && newCourse.startTime && newCourse.endTime) {
      onAddCourse({ ...newCourse, id: Date.now() });
      setNewCourse({ name: '', days: [], startTime: '', endTime: '', location: 'MIT' });
    }
  };

  return (
    <div className="border-4 border-black p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        ➕ Add Course to Your Schedule
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-bold mb-2">Course Name</label>
          <input
            type="text"
            value={newCourse.name}
            onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
            className="w-full px-4 py-2 border-2 border-black"
            placeholder="e.g., CS 220"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-2">Location</label>
          <select
            value={newCourse.location}
            onChange={(e) => setNewCourse({...newCourse, location: e.target.value})}
            className="w-full px-4 py-2 border-2 border-black"
          >
            <option value="MIT">MIT</option>
            <option value="Wellesley">Wellesley</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-bold mb-2">Days</label>
          <div className="flex gap-2">
            {daysOfWeek.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 border-2 border-black font-bold ${
                  newCourse.days.includes(day)
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Start</label>
            <input
              type="time"
              value={newCourse.startTime}
              onChange={(e) => setNewCourse({...newCourse, startTime: e.target.value})}
              className="w-full px-4 py-2 border-2 border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">End</label>
            <input
              type="time"
              value={newCourse.endTime}
              onChange={(e) => setNewCourse({...newCourse, endTime: e.target.value})}
              className="w-full px-4 py-2 border-2 border-black"
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white py-3 font-bold hover:bg-gray-800 transition"
      >
        ADD COURSE
      </button>
    </div>
  );
};
