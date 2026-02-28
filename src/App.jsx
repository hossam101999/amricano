import { useState, useEffect, useMemo, useReducer, useCallback, useRef } from 'react';
import TargetScoreGame from './TargetScoreGame';
import AchievementBadge from './components/AchievementBadge';
import Confetti from './components/Confetti';
import ConfirmDialog from './components/ConfirmDialog';
import InstallHelpDialog from './components/InstallHelpDialog';
import Toast from './components/Toast';
import { avatarColor } from './utils/avatar';
import { historyReducer, initialHistoryState } from './utils/history';
import { createId } from './utils/id';
const TOAST_DURATION = 5000;
const CONFETTI_DURATION = 5000;
const ACHIEVEMENT_DURATION = 5000;
const MAX_BOARDS = 10;
const MAX_NAME_LENGTH = 20;
const ANIMATION_DURATION = 300;
const normalizePerson = (person) => {
  const rawPoints = person?.points;
  const parsedPoints = typeof rawPoints === 'number' ? rawPoints : Number(rawPoints);
  return {
    id: person?.id ?? createId(),
    name: typeof person?.name === 'string' ? person.name : '',
    points: Number.isFinite(parsedPoints) ? parsedPoints : 0,
    created: person?.created ?? Date.now(),
    lastUpdated: person?.lastUpdated ?? Date.now(),
  };
};
const normalizeBoard = (board, fallbackName) => ({
  id: board?.id ?? createId(),
  name: typeof board?.name === 'string' && board.name.trim() ? board.name : fallbackName || 'Scoreboard',
  people: Array.isArray(board?.people) ? board.people.map(normalizePerson) : [],
  created: board?.created ?? new Date().toISOString(),
});
const createDefaultBoard = () => ({
  id: createId(),
  name: 'Main Scoreboard',
  people: [],
  created: new Date().toISOString(),
});

const displayModeQueries = [
  '(display-mode: standalone)',
  '(display-mode: fullscreen)',
  '(display-mode: minimal-ui)',
];

const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  const matchesDisplayMode = displayModeQueries.some((query) =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false
  );
  return matchesDisplayMode || window.navigator.standalone === true;
};
function App() {
  const [activeView, setActiveView] = useState('scoreboard');
  const [boards, setBoards] = useState([]);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteBoardId, setConfirmDeleteBoardId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isInStandaloneMode());
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [{ entries: history, index: historyIndex }, dispatchHistory] = useReducer(historyReducer, initialHistoryState);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAchievement, setShowAchievement] = useState(null);
  const [showBoardManager, setShowBoardManager] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [pointLabel, setPointLabel] = useState("points");
  const [targetScore, setTargetScore] = useState("");
  const [winner, setWinner] = useState(null);
  const [winningTimestamp, setWinningTimestamp] = useState(null);
  const achievementTimerRef = useRef(null);
  const confettiTimerRef = useRef(null);
  useEffect(() => {
    const savedBoards = localStorage.getItem('scoreboard-boards');
    const savedDarkMode = localStorage.getItem('scoreboard-darkmode');
    const savedPointLabel = localStorage.getItem('scoreboard-pointlabel');
    const savedTargetScore = localStorage.getItem('scoreboard-targetscore');
    const savedWinner = localStorage.getItem('scoreboard-winner');
    const savedWinningTimestamp = localStorage.getItem('scoreboard-winning-timestamp');
    if (savedDarkMode) {
      try {
        setDarkMode(JSON.parse(savedDarkMode));
      } catch (error) {
        setDarkMode(false);
      }
    }
    if (savedPointLabel) setPointLabel(savedPointLabel);
    if (savedTargetScore) setTargetScore(Number(savedTargetScore));
    if (savedWinner) {
      try {
        setWinner(JSON.parse(savedWinner));
      } catch (error) {
        setWinner(null);
      }
    }
    if (savedWinningTimestamp) setWinningTimestamp(Number(savedWinningTimestamp));
    let nextBoards = [];
    if (savedBoards) {
      try {
        const parsed = JSON.parse(savedBoards);
        if (Array.isArray(parsed) && parsed.length > 0) {
          nextBoards = parsed.map((board, index) => normalizeBoard(board, `Board ${index + 1}`));
        }
      } catch (error) {
        nextBoards = [];
      }
    }
    if (nextBoards.length === 0) nextBoards = [createDefaultBoard()];
    setBoards(nextBoards);
    setCurrentBoardId(nextBoards[0].id);
  }, []);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  useEffect(() => {
    if (boards.length > 0) localStorage.setItem('scoreboard-boards', JSON.stringify(boards));
    localStorage.setItem('scoreboard-darkmode', JSON.stringify(darkMode));
    localStorage.setItem('scoreboard-pointlabel', pointLabel);
    localStorage.setItem('scoreboard-targetscore', targetScore.toString());
    if (winner) {
      localStorage.setItem('scoreboard-winner', JSON.stringify(winner));
      localStorage.setItem('scoreboard-winning-timestamp', winningTimestamp?.toString() || Date.now().toString());
    } else {
      localStorage.removeItem('scoreboard-winner');
      localStorage.removeItem('scoreboard-winning-timestamp');
    }
  }, [boards, darkMode, pointLabel, targetScore, winner, winningTimestamp]);
  useEffect(() => {
    const updateInstallStatus = () => {
      const standalone = isInStandaloneMode();
      setIsInstalled(standalone);
      if (standalone) {
        setInstallPrompt(null);
      }
    };
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      if (isInStandaloneMode()) {
        setInstallPrompt(null);
        return;
      }
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setToast({ message: 'App installed!', type: 'success' });
    };
    updateInstallStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);
  const currentBoard = boards.find(b => b.id === currentBoardId);
  const people = currentBoard?.people || [];
  useEffect(() => {
    if (boards.length === 0) return;
    const exists = boards.some((board) => board.id === currentBoardId);
    if (!exists) setCurrentBoardId(boards[0].id);
  }, [boards, currentBoardId]);
  useEffect(() => {
    if (!currentBoard) return;
    dispatchHistory({ type: 'reset', people: currentBoard.people || [] });
    setWinner(null);
    setWinningTimestamp(null);
  }, [currentBoardId]);
  useEffect(() => {
    return () => {
      if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, []);
  const canInstall = installPrompt && !isInstalled;
  const platform = useMemo(() => {
    const ua = navigator.userAgent || '';
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    return { isIos, isAndroid };
  }, []);
  const boardToDelete = confirmDeleteBoardId !== null ? boards.find((board) => board.id === confirmDeleteBoardId) : null;
  const setPeople = useCallback((newPeople) => {
    setBoards((prevBoards) => prevBoards.map((b) => (b.id === currentBoardId ? { ...b, people: newPeople } : b)));
  }, [currentBoardId]);
  const saveToHistory = useCallback((prevPeople, newPeople) => {
    dispatchHistory({ type: 'record', prev: prevPeople, next: newPeople });
  }, []);
  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
  }, []);
  const checkForWinner = useCallback((updatedPeople) => {
    const qualifiedPeople = updatedPeople.filter(p => p.points >= targetScore);
    if (qualifiedPeople.length > 0) {
      const maxPoints = Math.max(...qualifiedPeople.map(p => p.points));
      const tiedWinners = qualifiedPeople.filter(p => p.points === maxPoints);
      if (tiedWinners.length > 1) {
        if (!winner || tiedWinners.some(w => w.id !== winner?.id)) {
          const winnerNames = tiedWinners.map(w => w.name).join(' and ');
          setWinner({ id: 'tie', name: winnerNames, points: maxPoints, isTie: true });
          setWinningTimestamp(Date.now());
          setShowAchievement({ 
            icon: '🏆', 
            title: '🏆 TIE! 🏆', 
            description: `${winnerNames} are tied with ${maxPoints} ${pointLabel}!`
          });
          triggerConfetti();
          if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
          achievementTimerRef.current = setTimeout(() => setShowAchievement(null), ACHIEVEMENT_DURATION);
        }
        return tiedWinners;
      } else {
        const newWinner = qualifiedPeople[0];
        if (!winner || winner.id !== newWinner.id || winner.points !== newWinner.points) {
          setWinner(newWinner);
          setWinningTimestamp(Date.now());
          const message = newWinner.points === targetScore 
            ? `${newWinner.name} hit exactly ${targetScore} ${pointLabel}!`
            : `${newWinner.name} is winning with ${newWinner.points} ${pointLabel}!`;
          setShowAchievement({ 
            icon: '🏆', 
            title: newWinner.points >= targetScore ? '🏆 WINNER! 🏆' : '🏆 NEW LEADER! 🏆', 
            description: message
          });
          triggerConfetti();
          if (achievementTimerRef.current) clearTimeout(achievementTimerRef.current);
          achievementTimerRef.current = setTimeout(() => setShowAchievement(null), ACHIEVEMENT_DURATION);
        }
        return newWinner;
      }
    } else if (winner) {
      setWinner(null);
      setWinningTimestamp(null);
    }
    return null;
  }, [targetScore, pointLabel, winner, triggerConfetti]);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);
  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    setInstallPrompt(null);
    showToast(choiceResult?.outcome === 'accepted' ? 'Installing...' : 'Installation canceled', 'info');
  }, [installPrompt, showToast]);
  const handleAddOrUpdate = useCallback((e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Please enter a name', 'error');
      return;
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      showToast(`Name must be less than ${MAX_NAME_LENGTH} characters`, 'error');
      return;
    }
    const isDuplicate = people.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== editId);
    if (isDuplicate) {
      showToast('A person with this name already exists', 'error');
      return;
    }
    const timestamp = Date.now();
    let updated;
    if (editId !== null) {
      updated = people.map((p) => p.id === editId ? { ...p, name: trimmedName, lastUpdated: timestamp } : p);
    } else {
      const newPerson = { 
        id: createId(),
        name: trimmedName, 
        points: 0,
        created: timestamp,
        lastUpdated: timestamp,
      };
      updated = [...people, newPerson];
    }
    setPeople(updated);
    saveToHistory(people, updated);
    checkForWinner(updated);
    showToast(editId !== null ? 'Person updated!' : 'Person added!');
    setName("");
    setEditId(null);
    setShowForm(false);
  }, [name, editId, people, setPeople, saveToHistory, checkForWinner, showToast]);
  const handleEdit = useCallback((personId) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    setName(person.name);
    setEditId(personId);
    setShowForm(true);
  }, [people]);
  const handleDelete = useCallback((personId) => {
    setConfirmDeleteId(personId);
  }, []);
  const confirmDeleteAction = useCallback(() => {
    if (confirmDeleteId === null) return;
    const updated = people.filter((person) => person.id !== confirmDeleteId);
    setPeople(updated);
    saveToHistory(people, updated);
    if (editId === confirmDeleteId) {
      setEditId(null);
      setName("");
      setShowForm(false);
    }
    checkForWinner(updated);
    showToast('Person deleted!');
    setConfirmDeleteId(null);
  }, [confirmDeleteId, people, setPeople, saveToHistory, editId, checkForWinner, showToast]);
  const adjustPoints = useCallback((personId, delta) => {
    const target = people.find((person) => person.id === personId);
    if (!target) return;
    const newPoints = Math.max(0, Math.floor(target.points + delta));
    if (newPoints === target.points && delta < 0) {
      showToast('Score cannot be negative', 'error');
      return;
    }
    const timestamp = Date.now();
    const updated = people.map((person) => person.id !== personId ? person : { ...person, points: newPoints, lastUpdated: timestamp });
    setPeople(updated);
    saveToHistory(people, updated);
    checkForWinner(updated);
    showToast(`${delta > 0 ? '+' : ''}${delta} ${pointLabel}`, 'info');
  }, [people, pointLabel, setPeople, saveToHistory, checkForWinner, showToast]);
  const resetAllPoints = useCallback(() => {
    if (people.length === 0) return;
    setConfirmReset(true);
  }, [people]);
  const clearAll = useCallback(() => {
    if (people.length === 0) return;
    setConfirmClear(true);
  }, [people]);
  const confirmResetAction = useCallback(() => {
    const timestamp = Date.now();
    const updated = people.map(p => ({ ...p, points: 0, lastUpdated: timestamp }));
    setPeople(updated);
    saveToHistory(people, updated);
    setWinner(null);
    setWinningTimestamp(null);
    showToast('All points reset!', 'info');
    setConfirmReset(false);
  }, [people, setPeople, saveToHistory, showToast]);
  const confirmClearAction = useCallback(() => {
    setPeople([]);
    saveToHistory(people, []);
    setEditId(null);
    setName("");
    setShowForm(false);
    setWinner(null);
    setWinningTimestamp(null);
    showToast('All data cleared!', 'info');
    setConfirmClear(false);
  }, [people, setPeople, saveToHistory, showToast]);
  const createBoard = useCallback(() => {
    const trimmedName = newBoardName.trim();
    if (!trimmedName) {
      showToast('Please enter a board name', 'error');
      return;
    }
    if (boards.length >= MAX_BOARDS) {
      showToast(`Maximum ${MAX_BOARDS} boards allowed`, 'error');
      return;
    }
    const newBoard = {
      id: createId(),
      name: trimmedName,
      people: [],
      created: new Date().toISOString(),
    };
    setBoards((prevBoards) => [...prevBoards, newBoard]);
    setCurrentBoardId(newBoard.id);
    setNewBoardName("");
    setShowBoardManager(false);
    setWinner(null);
    setWinningTimestamp(null);
    showToast('Board created!', 'success');
  }, [newBoardName, boards.length, showToast]);
  const deleteBoard = useCallback((boardId) => {
    if (boards.length === 1) {
      showToast('Cannot delete the last board', 'error');
      return;
    }
    const board = boards.find(b => b.id === boardId);
    setConfirmDeleteBoardId(boardId);
  }, [boards, showToast]);
  const confirmDeleteBoardAction = useCallback(() => {
    if (confirmDeleteBoardId === null) return;
    if (boards.length <= 1) {
      showToast('Cannot delete the last board', 'error');
      setConfirmDeleteBoardId(null);
      return;
    }
    const remaining = boards.filter(b => b.id !== confirmDeleteBoardId);
    setBoards(remaining);
    if (currentBoardId === confirmDeleteBoardId) {
      setCurrentBoardId(remaining[0].id);
      setWinner(null);
      setWinningTimestamp(null);
    }
    setConfirmDeleteBoardId(null);
    showToast('Board deleted', 'info');
  }, [confirmDeleteBoardId, boards, currentBoardId, showToast]);
  const sortedPeople = useMemo(() => [...people].sort((a, b) => b.points - a.points), [people]);
  const pointsRankById = useMemo(() => {
    const ranked = [...people].sort((a, b) => b.points - a.points);
    const rankMap = new Map();
    ranked.forEach((person, index) => rankMap.set(person.id, index + 1));
    return rankMap;
  }, [people]);
  const getBoardTitle = useCallback(() => currentBoard?.name || 'Scoreboard', [currentBoard]);
  const handleTargetScoreChange = useCallback((e) => {
    let value = e.target.value;
    if (value.startsWith('0') && value.length > 1) value = parseInt(value, 10).toString();
    if (value.includes('.')) value = value.split('.')[0];
    setTargetScore(value);
    setTimeout(() => checkForWinner(people), 0);
  }, [people, checkForWinner]);
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes confetti { 0% { transform: translateY(0) rotateZ(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotateZ(360deg); opacity: 0; } }
      @keyframes winnerPulse { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(251, 191, 36, 0); } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); } }
      @keyframes winnerText { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      .animate-slideIn { animation: slideIn ${ANIMATION_DURATION}ms ease-out; }
      .animate-scaleIn { animation: scaleIn ${ANIMATION_DURATION}ms ease-out; }
      .animate-fadeIn { animation: fadeIn ${ANIMATION_DURATION}ms ease-out; }
      .animate-confetti { animation: confetti linear infinite; }
      .person-card { animation: fadeIn ${ANIMATION_DURATION}ms ease-out; }
      .winner-glow { animation: winnerPulse 2s infinite; border: 3px solid #fbbf24; }
      .winner-title { animation: winnerText 1s ease infinite; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return (
    <>
      {activeView === 'scoreboard' ? (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100'} p-4 md:p-8`}>
          {showConfetti && <Confetti />}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          {showAchievement && (
            <div className="fixed top-20 right-4 z-50 animate-slideIn">
              <AchievementBadge {...showAchievement} />
            </div>
          )}
          {confirmDeleteId !== null && (
            <ConfirmDialog
              title="Delete person?"
              message={`Delete ${people.find((person) => person.id === confirmDeleteId)?.name || 'this person'}? This cannot be undone.`}
              confirmLabel="Delete"
              confirmTone="danger"
              onConfirm={confirmDeleteAction}
              onCancel={() => setConfirmDeleteId(null)}
            />
          )}
          {confirmReset && (
            <ConfirmDialog
              title="Reset points?"
              message="Set everyone's points to zero. This cannot be undone."
              confirmLabel="Reset"
              confirmTone="warning"
              onConfirm={confirmResetAction}
              onCancel={() => setConfirmReset(false)}
            />
          )}
          {confirmClear && (
            <ConfirmDialog
              title="Clear all people?"
              message="Remove everyone from this board. This cannot be undone."
              confirmLabel="Clear"
              confirmTone="danger"
              onConfirm={confirmClearAction}
              onCancel={() => setConfirmClear(false)}
            />
          )}
          {confirmDeleteBoardId !== null && (
            <ConfirmDialog
              title="Delete board?"
              message={`Delete ${boardToDelete?.name || 'this board'}? This cannot be undone.`}
              confirmLabel="Delete"
              confirmTone="danger"
              onConfirm={confirmDeleteBoardAction}
              onCancel={() => setConfirmDeleteBoardId(null)}
            />
          )}
          {showInstallHelp && (
            <InstallHelpDialog
              isIos={platform.isIos}
              isAndroid={platform.isAndroid}
              onClose={() => setShowInstallHelp(false)}
            />
          )}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{winner ? (winner.isTie ? '🤝' : '🏆') : '🏅'}</div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {getBoardTitle()}
                    </h1>
                    {winner && (
                      <div className="mt-2">
                        <span className="winner-title text-2xl font-bold text-yellow-500">
                          {winner.isTie ? `🤝 ${winner.name} ARE TIED! 🤝` : `🏆 ${winner.name} IS WINNING! 🏆`}
                        </span>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold mt-1">
                          Target: {targetScore} {pointLabel} | Current: {winner.points} {pointLabel}
                        </p>
                      </div>
                    )}
                    {!winner && boards.length > 1 && (
                      <button
                        onClick={() => setShowBoardManager(!showBoardManager)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                        aria-label="Switch board"
                      >
                        Switch Board ({boards.length} total)
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="h-11 w-11 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    title="Toggle Dark Mode"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                  <button
                    onClick={() => setActiveView('game')}
                    className="h-11 w-11 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center text-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    title="Open Target Score Game"
                    aria-label="Open target score game"
                  >
                    🧮
                  </button>
                  {!isInstalled && (
                    <button
                      onClick={() => canInstall ? handleInstall() : setShowInstallHelp(true)}
                      className={`h-11 px-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm font-semibold active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${canInstall ? '' : 'opacity-60'}`}
                      title={canInstall ? 'Install App' : 'Install not available'}
                      aria-label={canInstall ? 'Install app' : 'Install not available'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v10m0 0l-3-3m3 3l3-3M5 17h14" />
                      </svg>
                      <span className="hidden sm:inline">Install</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fadeIn">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="target-score" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      🎯 TARGET SCORE
                    </label>
                    <input
                      id="target-score"
                      type="number"
                      min="0"
                      step="1"
                      value={targetScore}
                      onChange={handleTargetScoreChange}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-600 border-2 border-gray-200 dark:border-gray-500 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 dark:text-white"
                      aria-label="Target score"
                    />
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 font-semibold">
                      The person with the highest score above {targetScore} {pointLabel} WINS! 🏆
                    </p>
                  </div>
                </div>
              </div>
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
                          aria-label={`Switch to board ${board.name}`}
                        >
                          {board.name} ({board.people.length} people)
                        </button>
                        {boards.length > 1 && (
                          <button
                            onClick={() => deleteBoard(board.id)}
                            className="ml-2 text-red-500 hover:text-red-700 p-1 rounded"
                            aria-label={`Delete board ${board.name}`}
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
                      onKeyDown={(e) => e.key === 'Enter' && createBoard()}
                      maxLength={MAX_NAME_LENGTH}
                      aria-label="New board name"
                    />
                    <button
                      onClick={createBoard}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      disabled={boards.length >= MAX_BOARDS}
                      aria-label="Create board"
                    >
                      Create
                    </button>
                  </div>
                  {boards.length >= MAX_BOARDS && (
                    <p className="text-xs text-red-500 mt-2">Maximum {MAX_BOARDS} boards reached</p>
                  )}
                </div>
              )}
              {people.length > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetAllPoints}
                    className="w-full sm:w-auto h-11 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors active:scale-95"
                    aria-label="Reset all points"
                  >
                    Reset Points
                  </button>
                  <button
                    onClick={clearAll}
                    className="w-full sm:w-auto h-11 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors active:scale-95"
                    aria-label="Clear all people"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {sortedPeople.length === 0 && people.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No people yet. Click <span className="font-bold text-purple-600">+ Add Person</span> to get started!
                  </p>
                </div>
              )}
              {sortedPeople.map((p) => {
                const position = pointsRankById.get(p.id) || 0;
                const isWinner = winner && (winner.id === p.id || (winner.isTie && winner.name.includes(p.name)));
                return (
                  <div
                    key={p.id}
                    className={`person-card bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all ${isWinner ? 'winner-glow' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                        <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8 flex-shrink-0">
                          {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position > 0 ? `#${position}` : '#-'}
                        </div>
                        <div className={`w-14 h-14 ${avatarColor(p.name)} rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0`}>
                          {p.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-bold text-gray-800 dark:text-white truncate flex items-center gap-2">
                            {p.name}
                            {isWinner && <span className="text-yellow-500 text-2xl" aria-label="Winner">👑</span>}
                          </div>
                          <div className={`text-2xl font-extrabold ${p.points < 0 ? 'text-red-500 dark:text-red-400' : p.points >= targetScore ? 'text-yellow-500 dark:text-yellow-400' : 'text-purple-600 dark:text-purple-400'}`}>
                            {p.points} {pointLabel}
                            {p.points >= targetScore && (
                              <span className="ml-2 text-sm bg-yellow-500 text-white px-3 py-1 rounded-full font-bold">
                                {p.points === targetScore ? 'TARGET HIT!' : 'OVER THE TOP!'} 🏆
                              </span>
                            )}
                          </div>
                          {p.created && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Joined {new Date(p.created).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                          onClick={() => adjustPoints(p.id, -5)}
                          className="h-11 min-w-[52px] px-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 font-bold rounded-lg transition-colors text-sm sm:text-base active:scale-95"
                          title="Subtract 5"
                          aria-label={`Subtract 5 points from ${p.name}`}
                        >
                          -5
                        </button>
                        <button
                          onClick={() => adjustPoints(p.id, -1)}
                          className="h-11 w-11 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 font-bold rounded-lg transition-colors text-base active:scale-95"
                          title="Subtract 1"
                          aria-label={`Subtract 1 point from ${p.name}`}
                        >
                          −
                        </button>
                        <button
                          onClick={() => adjustPoints(p.id, 1)}
                          className="h-11 w-11 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 font-bold rounded-lg transition-colors text-base active:scale-95"
                          title="Add 1"
                          aria-label={`Add 1 point to ${p.name}`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => adjustPoints(p.id, 5)}
                          className="h-11 min-w-[52px] px-2 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 font-bold rounded-lg transition-colors text-sm sm:text-base active:scale-95"
                          title="Add 5"
                          aria-label={`Add 5 points to ${p.name}`}
                        >
                          +5
                        </button>
                        <div className="hidden sm:block w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button
                          onClick={() => handleEdit(p.id)}
                          className="h-11 w-11 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg shadow transition-all active:scale-95"
                          title="Edit"
                          aria-label={`Edit ${p.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="h-11 w-11 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow transition-all active:scale-95"
                          title="Delete"
                          aria-label={`Delete ${p.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scaleIn">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditId(null);
                      setName("");
                    }}
                    className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    {editId !== null ? 'Edit Person' : 'Add Person'}
                  </h2>
                  <form onSubmit={handleAddOrUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="person-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <input
                        id="person-name"
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                        placeholder="Enter name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={MAX_NAME_LENGTH}
                        autoFocus
                        required
                        aria-label="Person name"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all transform hover:scale-105"
                    >
                      {editId !== null ? "Update" : "Add"}
                    </button>
                  </form>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setShowForm(true);
                setEditId(null);
                setName("");
              }}
              className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300 z-30"
              title="Add Person"
              aria-label="Add person"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <TargetScoreGame onBack={() => setActiveView('scoreboard')} showToast={showToast} />
      )}
    </>
  );
}
export default App;
