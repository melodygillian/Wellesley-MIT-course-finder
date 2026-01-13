// ConsultDeptSection.jsx - Display courses needing department consultation
const ConsultDeptSection = ({ courses }) => {
  if (courses.length === 0) return null;

  return (
    <div className="border-4 border-black p-6">
      <h2 className="text-2xl font-bold mb-4">
        Courses Requiring Department Consultation
      </h2>
      <p className="text-sm mb-4 text-gray-600">
        Below courses are not offered regularly. Contact the department for schedule details.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {courses.map((course, idx) => (
          <div key={idx} className="border border-black p-3 bg-gray-50">
            <div className="font-bold">{course.code}</div>
            <div className="text-sm">{course.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
