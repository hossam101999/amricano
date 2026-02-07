import { useState, useEffect } from 'react';

// Helper for random avatar color
function avatarColor(name) {
  const colors = [
    'bg-gradient-to-br from-pink-400 via-fuchsia-500 to-indigo-500',
    'bg-gradient-to-br from-green-400 via-teal-400 to-blue-500',
    'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500',
    'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400',
    'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
    'bg-gradient-to-br from-red-400 via-rose-400 to-pink-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Confetti Component
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'][Math.floor(Math.random() * 6)],
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Toast Notification Component
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200 font-bold">×</button>
      </div>
    </div>
  );
}

// Confirmation Dialog
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Confirm Action</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Achievement Badge Component
function AchievementBadge({ icon, title, description }) {
  return (
    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-3 text-white shadow-lg animate-scaleIn">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="font-bold text-sm">{title}</div>
      <div className="text-xs opacity-90">{description}</div>
    </div>
  );
}

function App() {
  // State Management
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState('points-desc');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [showBoardManager, setShowBoardManager] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [pointLabel, setPointLabel] = useState("points");
  const [showSettings, setShowSettings] = useState(false);

  // Initialize with default board
  useEffect(() => {
    const savedBoards = localStorage.getItem('scoreboard-boards');
    const savedDarkMode = localStorage.getItem('scoreboard-darkmode');
    const savedPointLabel = localStorage.getItem('scoreboard-pointlabel');
    
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
    if (savedPointLabel) setPointLabel(savedPointLabel);
    
    if (savedBoards) {
      const parsed = JSON.parse(savedBoards);
      setBoards(parsed);
      if (parsed.length > 0) {
        setCurrentBoardId(parsed[0].id);
      }
    } else {
      const defaultBoard = {
        id: Date.now(),
        name: 'Main Scoreboard',
        people: [],
        created: new Date().toISOString(),
      };
      setBoards([defaultBoard]);
      setCurrentBoardId(defaultBoard.id);
    }
  }, []);

  // Save boards to localStorage
  useEffect(() => {
    if (boards.length > 0) {
      localStorage.setItem('scoreboard-boards', JSON.stringify(boards));
    }
  }, [boards]);

  useEffect(() => {
    localStorage.setItem('scoreboard-darkmode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('scoreboard-pointlabel', pointLabel);
  }, [pointLabel]);

  const currentBoard = boards.find(b => b.id === currentBoardId);
  const people = currentBoard?.people || [];

  const setPeople = (newPeople) => {
    setBoards(boards.map(b => 
      b.id === currentBoardId ? { ...b, people: newPeople } : b
    ));
  };

  // Undo/Redo functionality
  const saveToHistory = (newPeople) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPeople);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPeople(history[historyIndex - 1]);
      showToast('Undone', 'info');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPeople(history[historyIndex + 1]);
      showToast('Redone', 'info');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const checkAchievements = (person, oldPoints) => {
    // First 100 points
    if (person.points >= 100 && oldPoints < 100) {
      setShowAchievement({ icon: '🎯', title: 'Century Club', description: 'Reached 100 points!' });
      setTimeout(() => setShowAchievement(null), 4000);
      triggerConfetti();
    }
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    if (!name.trim() || isNaN(points) || points === "") {
      showToast('Please fill in all fields correctly', 'error');
      return;
    }

    const numPoints = Number(points);
    const isDuplicate = people.some((p, i) => 
      p.name.toLowerCase() === name.trim().toLowerCase() && i !== editIndex
    );

    if (isDuplicate) {
      showToast('A person with this name already exists', 'error');
      return;
    }

    if (editIndex !== null) {
      const updated = people.map((p, i) =>
        i === editIndex ? { 
          ...p, 
          name: name.trim(), 
          points: numPoints,
        } : p
      );
      setPeople(updated);
      saveToHistory(updated);
      setEditIndex(null);
      showToast('Person updated successfully!');
    } else {
      const newPerson = { 
        name: name.trim(), 
        points: numPoints,
        created: Date.now(),
      };
      const updated = [...people, newPerson];
      setPeople(updated);
      saveToHistory(updated);
      showToast('Person added successfully!');
    }

    setName("");
    setPoints("");
    setShowForm(false);
  };

  const handleEdit = (idx) => {
    setName(people[idx].name);
    setPoints(people[idx].points);
    setEditIndex(idx);
    setShowForm(true);
  };

  const handleDelete = (idx) => {
    setConfirmDelete(idx);
  };

  const confirmDeleteAction = () => {
    const idx = confirmDelete;
    const updated = people.filter((_, i) => i !== idx);
    setPeople(updated);
    saveToHistory(updated);
    if (editIndex === idx) {
      setEditIndex(null);
      setName("");
      setPoints("");
      setShowForm(false);
    }
    showToast('Person deleted successfully!');
    setConfirmDelete(null);
  };

  const adjustPoints = (idx, delta) => {
    const oldPoints = people[idx].points;
    const updated = people.map((p, i) =>
      i === idx ? { 
        ...p, 
        points: Math.max(0, p.points + delta),
      } : p
    );
    setPeople(updated);
    saveToHistory(updated);
    checkAchievements(updated[idx], oldPoints);
    showToast(`${delta > 0 ? '+' : ''}${delta} ${pointLabel}`, 'info');
  };

  const resetAllPoints = () => {
    if (people.length === 0) return;
    setConfirmReset(true);
  };

  const clearAll = () => {
    if (people.length === 0) return;
    setConfirmClear(true);
  };

  const confirmResetAction = () => {
    const updated = people.map(p => ({ 
      ...p, 
      points: 0,
    }));
    setPeople(updated);
    saveToHistory(updated);
    showToast('All points reset!', 'info');
    setConfirmReset(false);
  };

  const confirmClearAction = () => {
    setPeople([]);
    saveToHistory([]);
    setEditIndex(null);
    setName("");
    setPoints("");
    setShowForm(false);
    showToast('All data cleared!', 'info');
    setConfirmClear(false);
  };

  const createBoard = () => {
    if (!newBoardName.trim()) {
      showToast('Please enter a board name', 'error');
      return;
    }
    const newBoard = {
      id: Date.now(),
      name: newBoardName.trim(),
      people: [],
      created: new Date().toISOString(),
    };
    setBoards([...boards, newBoard]);
    setCurrentBoardId(newBoard.id);
    setNewBoardName("");
    setShowBoardManager(false);
    showToast('Board created!', 'success');
  };

  const deleteBoard = (boardId) => {
    if (boards.length === 1) {
      showToast('Cannot delete the last board', 'error');
      return;
    }
    if (window.confirm('Delete this board?')) {
      const remaining = boards.filter(b => b.id !== boardId);
      setBoards(remaining);
      if (currentBoardId === boardId) {
        setCurrentBoardId(remaining[0].id);
      }
      showToast('Board deleted', 'info');
    }
  };

  // Filtering
  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting
  const sortedPeople = [...filteredPeople].sort((a, b) => {
    switch (sortBy) {
      case 'points-desc': return b.points - a.points;
      case 'points-asc': return a.points - b.points;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      default: return 0;
    }
  });


  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100'} p-4 md:p-8`}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotateZ(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotateZ(360deg); opacity: 0; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-confetti { animation: confetti linear infinite; }
        .person-card { animation: fadeIn 0.3s ease-out; }
      `}</style>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Achievement Popup */}
      {showAchievement && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <AchievementBadge {...showAchievement} />
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete !== null && (
        <ConfirmDialog
          message={`Delete ${people[confirmDelete]?.name}?`}
          onConfirm={confirmDeleteAction}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          message="Reset all points to zero? This cannot be undone."
          onConfirm={confirmResetAction}
          onCancel={() => setConfirmReset(false)}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          message="Delete all people? This cannot be undone."
          onConfirm={confirmClearAction}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🏅</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {currentBoard?.name || 'Scoreboard'}
                </h1>
                {boards.length > 1 && (
                  <button
                    onClick={() => setShowBoardManager(!showBoardManager)}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    Switch Board ({boards.length} total)
                  </button>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Settings"
              >
                ⚙️
              </button>

              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                ↶
              </button>

              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                ↷
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fadeIn">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Point Label (singular)
                  </label>
                  <input
                    type="text"
                    value={pointLabel}
                    onChange={(e) => setPointLabel(e.target.value || 'points')}
                    placeholder="points, stars, coins, etc."
                    className="px-3 py-2 bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Board Manager */}
          {showBoardManager && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fadeIn">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">Manage Boards</h3>
              <div className="space-y-2 mb-4">
                {boards.map(board => (
                  <div key={board.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg">
                    <button
                      onClick={() => {
                        setCurrentBoardId(board.id);
                        setShowBoardManager(false);
                      }}
                      className={`flex-1 text-left font-semibold ${board.id === currentBoardId ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {board.name} ({board.people.length} people)
                    </button>
                    {boards.length > 1 && (
                      <button
                        onClick={() => deleteBoard(board.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="New board name"
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && createBoard()}
                />
                <button
                  onClick={createBoard}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Search & Controls */}
          {people.length > 0 && (
            <div className="mt-4 flex gap-3 flex-wrap">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search people..."
                className="flex-1 min-w-[200px] px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:text-white"
              />
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="points-desc">🔽 Highest Points</option>
                <option value="points-asc">🔼 Lowest Points</option>
                <option value="name-asc">🔤 Name A-Z</option>
                <option value="name-desc">🔤 Name Z-A</option>
              </select>

              <button
                onClick={resetAllPoints}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
              >
                Reset Points
              </button>

              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* People List */}
        <div className="space-y-3">
          {sortedPeople.length === 0 && people.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No people yet. Click <span className="font-bold text-purple-600">+ Add Person</span> to get started!
              </p>
            </div>
          )}

          {sortedPeople.length === 0 && people.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No results found for "{searchTerm}"
              </p>
            </div>
          )}

          {sortedPeople.map((p) => {
            const actualIndex = people.findIndex(person => person.name === p.name);
            const position = [...people].sort((a, b) => b.points - a.points).findIndex(person => person.name === p.name) + 1;
            
            return (
              <div
                key={actualIndex}
                className="person-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Position Badge & Avatar */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8 flex-shrink-0">
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`}
                    </div>
                    <div className={`w-14 h-14 ${avatarColor(p.name)} rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0`}>
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-bold text-gray-800 dark:text-white truncate">{p.name}</div>
                      <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{p.points} {pointLabel}</div>
                      {p.created && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Joined {new Date(p.created).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => adjustPoints(actualIndex, -10)}
                      className="w-9 h-9 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors text-sm"
                      title="Subtract 10"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => adjustPoints(actualIndex, -1)}
                      className="w-9 h-9 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors"
                      title="Subtract 1"
                    >
                      −
                    </button>
                    <button
                      onClick={() => adjustPoints(actualIndex, 1)}
                      className="w-9 h-9 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 font-bold rounded-lg transition-colors"
                      title="Add 1"
                    >
                      +
                    </button>
                    <button
                      onClick={() => adjustPoints(actualIndex, 10)}
                      className="w-9 h-9 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-600 dark:text-green-400 font-bold rounded-lg transition-colors text-sm"
                      title="Add 10"
                    >
                      +10
                    </button>
                    
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                    
                    <button
                      onClick={() => handleEdit(actualIndex)}
                      className="w-10 h-10 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full shadow transition-all"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(actualIndex)}
                      className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow transition-all"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Add Person Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scaleIn">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditIndex(null);
                  setName("");
                  setPoints("");
                }}
                className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                {editIndex !== null ? 'Edit Person' : 'Add Person'}
              </h2>

              <form onSubmit={handleAddOrUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Points</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Enter points"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    min={0}
                    max={9999}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all transform hover:scale-105"
                >
                  {editIndex !== null ? "Update" : "Add"}
                </button>
              </form>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setShowForm(true);
            setEditIndex(null);
            setName("");
            setPoints("");  

          }}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300 z-30"
          title="Add Person"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button> 
      </div>
    </div>
  );
}


 
export default App;
