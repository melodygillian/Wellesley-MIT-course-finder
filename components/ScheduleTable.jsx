// ScheduleTable.jsx - Visual weekly schedule grid
const ScheduleTable = ({ courses, onRemoveCourse }) => {
  const daysOfWeek = ['M', 'T', 'W', 'R', 'F'];
  const timeSlots = Array.from({length: 28}, (_, i) => {
    const hour = Math.floor(i/2) + 8;
    const min = i % 2 === 0 ? '00' : '30';
    return `${hour}:${min}`;
  });

  const getCourseInSlot = (day, time) => {
    return ScheduleManager.getCourseInSlot(courses, day, time);
  };

  if (courses.length === 0) return null;

  return (
    <div className="border-4 border-black mb-8 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-black text-white">
            <th className="border-2 border-black p-3 text-left">Time</th>
            {daysOfWeek.map(day => (
              <th key={day} className="border-2 border-black p-3">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(time => (
            <tr key={time}>
              <td className="border-2 border-black p-2 font-mono text-sm">{time}</td>
              {daysOfWeek.map(day => {
                const course = getCourseInSlot(day, time);
                return (
                  <td key={day} className="border-2 border-black p-0">
                    {course && ScheduleManager.timeToMinutes(time) === ScheduleManager.timeToMinutes(course.startTime) && (
                      <div className="bg-black text-white p-2 text-xs font-bold relative group">
                        <div>{course.name}</div>
                        <div className="text-gray-300 text-xs">{course.location}</div>
                        <button
                          onClick={() => onRemoveCourse(course.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
