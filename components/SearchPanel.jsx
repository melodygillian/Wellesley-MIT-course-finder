// SearchPanel.jsx - Catalog search options
const SearchPanel = ({ searchMode, onSearchModeChange, onSearch, semesterLabel }) => {
  return (
    <div className="border-4 border-black p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Search {semesterLabel} Catalog</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => onSearchModeChange('mit')}
          className={`px-6 py-3 border-2 border-black font-bold ${
            searchMode === 'mit' ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          MIT ONLY
        </button>
        <button
          onClick={() => onSearchModeChange('wellesley')}
          className={`px-6 py-3 border-2 border-black font-bold ${
            searchMode === 'wellesley' ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          WELLESLEY ONLY
        </button>
        <button
          onClick={() => onSearchModeChange('both')}
          className={`px-6 py-3 border-2 border-black font-bold ${
            searchMode === 'both' ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          BOTH SCHOOLS
        </button>
      </div>
      
      <button
        onClick={onSearch}
        className="w-full bg-black text-white py-4 font-bold text-lg hover:bg-gray-800 transition"
      >
        🔍 FIND COMPATIBLE COURSES
      </button>
    </div>
  );
};
