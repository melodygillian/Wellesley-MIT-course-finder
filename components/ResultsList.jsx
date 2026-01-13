// ResultsList.jsx - Display search results
const ResultsList = ({ results }) => {
  if (results.length === 0) return null;

  return (
    <div className="border-4 border-black p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">
        Compatible Courses ({results.length})
      </h2>
      <div className="space-y-4">
        {results.map((course, idx) => (
          <div key={idx} className="border-2 border-black p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-lg">{course.code}</span>
                <span className="ml-2">{course.name}</span>
              </div>
              <span className="px-3 py-1 bg-black text-white text-sm font-bold">
                {course.source}
              </span>
            </div>
            
            <div className="space-y-1 text-sm mb-2">
              {course.meetingTimes.map((time, i) => (
                <div key={i} className="font-mono">
                  {time.days.join('')} {time.startTime} - {time.endTime}
                </div>
              ))}
            </div>
            
            {course.busRecommendations && course.busRecommendations.length > 0 && (
              <div className="mt-3 p-3 bg-gray-100 border border-black">
                <div className="flex items-center gap-2 font-bold mb-2">
                  🚌 Recommended Shuttle
                </div>
                {course.busRecommendations.map((bus, i) => (
                  <div key={i} className="text-sm font-mono">
                    Bus #{bus.busNumber}: Depart {bus.departure} → Arrive {bus.arrival}
                    <span className="text-gray-600 ml-2">
                      ({bus.buffer} min buffer)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
