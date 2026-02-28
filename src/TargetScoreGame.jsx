import React, { useMemo, useReducer, useCallback, useEffect, useState } from 'react';
import { createId } from './utils/id';
import { historyReducer } from './utils/history';
import { avatarColor } from './utils/avatar';
const STORAGE_KEY = 'targetScoreGame_state';
const PLAYER_COLORS = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];
const TOAST_DURATION = 3000;
const MAX_PLAYERS = 20;
const MAX_NAME_LENGTH = 20;
const DEFAULT_TARGET_SCORE = 150;
const useLocalStorage = (initialValue) => {
  const [state, setState] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.error('Error loading data:', error);
      return initialValue;
    }
  });
  const updateState = useCallback((newState) => {
    setState(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : newState;
      return updated;
    });
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);
  return [state, updateState];
};
const validateScore = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0 && Number.isInteger(num) ? num : null;
};
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500'
  }[type] || 'bg-gray-500';
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slideIn`}>
      {message}
    </div>
  );
};
const ToastManager = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ top: `${20 + index * 60}px` }} className="fixed right-4 z-50">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        </div>
      ))}
    </>
  );
};
const PlayerCard = React.memo(({ player, targetScore, gameOver, winners, onAddScore, onRemove }) => {
  const [inputValue, setInputValue] = useState('');
  const [showWinnerBanner, setShowWinnerBanner] = useState(false);
  const isWinner = player.score >= targetScore;
  const winnerNames = winners.map(w => w.name).join(', ');
  useEffect(() => {
    if (isWinner) {
      setShowWinnerBanner(true);
      const timer = setTimeout(() => setShowWinnerBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isWinner]);
  const handleAddScore = () => {
    const delta = validateScore(inputValue);
    if (delta) {
      onAddScore(player.id, delta);
      setInputValue('');
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddScore();
  };
  return (
    <div className={`border-2 rounded-xl p-4 transition-all ${
      isWinner && showWinnerBanner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 ${avatarColor(player.name)} rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md`}>
            {player.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{player.name}</span>
              {isWinner && showWinnerBanner && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs animate-pulse">
                  👑 WINNER
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Score: <span className="text-lg font-bold text-purple-600">{player.score}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(player.id)}
          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
          title="Remove player"
          aria-label={`Remove ${player.name}`}
        >
          ✕
        </button>
      </div>
      {!gameOver && !isWinner && (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            min="1"
            step="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            placeholder="Points to add"
            aria-label={`Add points for ${player.name}`}
          />
          <button
            onClick={handleAddScore}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50"
            disabled={!inputValue}
          >
            Add
          </button>
        </div>
      )}
      {gameOver && !isWinner && (
        <div className="text-center py-2 text-gray-500 italic mt-2">
          Game Over - {winnerNames} {winners.length > 1 ? 'have' : 'has'} won!
        </div>
      )}
    </div>
  );
});
PlayerCard.displayName = 'PlayerCard';
const RankingList = React.memo(({ players, gameOver }) => {
  const ranking = useMemo(() => 
    [...players].sort((a, b) => b.score - a.score), 
    [players]
  );
  if (players.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Ranking</h3>
        <p className="text-sm text-gray-500">No players yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Ranking</h3>
      <div className="space-y-2">
        {ranking.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">
              {index + 1}. {player.name} {index === 0 && gameOver && '👑'}
            </span>
            <span className="text-gray-500">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
RankingList.displayName = 'RankingList';
const HistoryLog = React.memo(({ actionLog, historyIndex }) => {
  const visibleLog = actionLog.slice(0, historyIndex);
  if (visibleLog.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">History</h3>
        <p className="text-sm text-gray-500">No score changes yet.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">History</h3>
      <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
        {visibleLog.slice().reverse().map((entry) => (
          <div key={entry.id} className="flex items-center justify-between border-b border-gray-100 pb-1">
            <span className="font-medium">{entry.name}</span>
            <span className={entry.delta > 0 ? 'text-green-600' : 'text-red-600'}>
              {entry.delta > 0 ? '+' : ''}{entry.delta}
            </span>
            <span className="text-gray-500">→ {entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
HistoryLog.displayName = 'HistoryLog';
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Confirm' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full animate-scaleIn">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onConfirm} 
            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onCancel} 
            className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
const Header = React.memo(({ onBack, onResetClick, onClearSave }) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎮</div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Target Score Game</h1>
          <p className="text-sm text-gray-500">First to reach or exceed the target wins!</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={onBack} 
          className="h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
          aria-label="Go back"
        >
          ← Back
        </button>
        <button 
          onClick={onResetClick} 
          className="h-10 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
        >
          Reset Game
        </button>
        <button 
          onClick={onClearSave} 
          className="h-10 px-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors" 
          title="Clear saved game"
        >
          Clear Save
        </button>
      </div>
    </div>
  </div>
));
Header.displayName = 'Header';
const AddPlayerForm = React.memo(({ onAddPlayer, maxPlayers, currentCount }) => {
  const [name, setName] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName && trimmedName.length <= MAX_NAME_LENGTH) {
      onAddPlayer(trimmedName);
      setName('');
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-gray-700">Add Player</label>
        <span className="text-sm text-gray-500">
          {currentCount} / {maxPlayers} players
        </span>
      </div>
      {currentCount >= maxPlayers ? (
        <p className="text-center text-gray-500 py-3">
          Maximum players ({maxPlayers}) reached. Remove some players to add more.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            maxLength={MAX_NAME_LENGTH}
            aria-label="New player name"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Add Player
          </button>
        </form>
      )}
      {name.length > MAX_NAME_LENGTH - 10 && (
        <p className="text-xs text-gray-500 mt-1">
          {name.length}/{MAX_NAME_LENGTH} characters
        </p>
      )}
    </div>
  );
});
AddPlayerForm.displayName = 'AddPlayerForm';
const WinnerAnnouncement = ({ winners }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [winners]);
  if (winners.length === 0 || !visible) return null;
  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-lg text-center font-bold text-lg animate-pulse">
      🎉 {winners.map(w => w.name).join(', ')} {winners.length > 1 ? 'WIN' : 'WINS'}! 🎉
    </div>
  );
};
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page or clear your browser data.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
function TargetScoreGame({ onBack, showToast: externalShowToast }) {
  const [gameState, setGameState] = useLocalStorage({
    targetScore: DEFAULT_TARGET_SCORE,
    players: [],
    gameOver: false,
    winners: [],
    actionLog: [],
    history: { entries: [], index: -1 }
  });
  const [newTargetScore, setNewTargetScore] = useState(gameState.targetScore);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showClearSaveConfirm, setShowClearSaveConfirm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { targetScore, players, gameOver, winners, actionLog, history } = gameState;
  const targetScoreNum = Number(targetScore);
  const [{ entries: historyEntries, index: historyIndex }, dispatchHistory] = useReducer(
    historyReducer, 
    history
  );
  useEffect(() => {
    setGameState(prev => ({ ...prev, history: { entries: historyEntries, index: historyIndex } }));
  }, [historyEntries, historyIndex, setGameState]);
  const showToastMessage = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (externalShowToast) {
      externalShowToast(message, type);
    }
  }, [externalShowToast]);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  useEffect(() => {
    if (players.length > 0 && !gameOver) {
      const newWinners = players.filter(p => p.score >= targetScoreNum);
      if (newWinners.length > 0) {
        setGameState(prev => ({ ...prev, gameOver: true, winners: newWinners }));
      }
    }
  }, [targetScoreNum, players, gameOver, setGameState]);
  useEffect(() => {
    if (players.length === 0 || gameOver) return;
    const newWinners = players.filter(p => p.score >= targetScoreNum);
    if (newWinners.length > 0) {
      setGameState(prev => ({ ...prev, gameOver: true, winners: newWinners }));
      const message = newWinners.length === 1
        ? `🎉 ${newWinners[0].name} wins with ${newWinners[0].score} points!`
        : `🎉 It's a tie between ${newWinners.map(w => w.name).join(' and ')}!`;
      showToastMessage(message, 'success');
    }
  }, [players, targetScoreNum, gameOver, setGameState, showToastMessage]);
  const handleAddPlayer = useCallback((name) => {
    if (players.length >= MAX_PLAYERS) {
      showToastMessage(`Maximum ${MAX_PLAYERS} players allowed`, 'error');
      return;
    }
    const newPlayer = {
      id: createId(),
      name,
      score: 0,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
    };
    const updatedPlayers = [...players, newPlayer];
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers
    }));
    dispatchHistory({ type: 'record', prev: players, next: updatedPlayers });
    showToastMessage(`${name} joined the game!`, 'success');
  }, [players, setGameState, showToastMessage]);
  const handleRemovePlayer = useCallback((playerId) => {
    const player = players.find(p => p.id === playerId);
    const updatedPlayers = players.filter(p => p.id !== playerId);
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      gameOver: false,
      winners: []
    }));
    dispatchHistory({ type: 'record', prev: players, next: updatedPlayers });
    showToastMessage(`${player?.name} removed`, 'info');
  }, [players, setGameState, showToastMessage]);
  const validateAndAdjustScore = useCallback((playerId, delta) => {
    if (gameOver) {
      showToastMessage('Game is over! Start a new game to continue.', 'error');
      return false;
    }
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return false;
    if (targetPlayer.score >= targetScoreNum) {
      showToastMessage(`${targetPlayer.name} has already won!`, 'error');
      return false;
    }
    const newScore = targetPlayer.score + delta;
    if (newScore < 0) {
      showToastMessage('Score cannot be negative', 'error');
      return false;
    }
    return true;
  }, [players, gameOver, targetScoreNum, showToastMessage]);
  const addScore = useCallback((playerId, delta) => {
    if (!validateAndAdjustScore(playerId, delta)) return;
    const updated = players.map(p => 
      p.id === playerId ? { ...p, score: p.score + delta } : p
    );
    setGameState(prev => ({ ...prev, players: updated }));
    dispatchHistory({ type: 'record', prev: players, next: updated });
    const targetPlayer = players.find(p => p.id === playerId);
    const logEntry = {
      id: createId(),
      playerId,
      name: targetPlayer.name,
      delta,
      score: targetPlayer.score + delta,
      timestamp: Date.now(),
    };
    setGameState(prev => ({
      ...prev,
      actionLog: [...prev.actionLog.slice(0, historyIndex), logEntry]
    }));
    showToastMessage(`${delta > 0 ? '+' : ''}${delta} for ${targetPlayer.name}`, 'info');
  }, [players, historyIndex, setGameState, showToastMessage, validateAndAdjustScore]);
  const resetScores = useCallback(() => {
    const resetPlayers = players.map(p => ({ ...p, score: 0 }));
    setGameState(prev => ({ 
      ...prev, 
      players: resetPlayers, 
      gameOver: false, 
      winners: [], 
      actionLog: [] 
    }));
    setShowResetConfirm(false);
    dispatchHistory({ type: 'record', prev: players, next: resetPlayers });
    showToastMessage('All scores reset to zero', 'info');
  }, [players, setGameState, showToastMessage]);
  const clearAllPlayers = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      players: [], 
      gameOver: false, 
      winners: [], 
      actionLog: [] 
    }));
    setShowClearAllConfirm(false);
    dispatchHistory({ type: 'record', prev: players, next: [] });
    showToastMessage('All players removed', 'info');
  }, [players, setGameState, showToastMessage]);
  const updateTargetScore = useCallback((value) => {
    setNewTargetScore(value);
    const validScore = validateScore(value);
    if (validScore) {
      setGameState(prev => ({ 
        ...prev, 
        targetScore: value
      }));
    }
  }, [setGameState]);
  const clearSavedGame = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
      setGameState({
        targetScore: DEFAULT_TARGET_SCORE,
        players: [],
        gameOver: false,
        winners: [],
        actionLog: [],
        history: { entries: [], index: -1 }
      });
      setNewTargetScore(DEFAULT_TARGET_SCORE);
      dispatchHistory({ type: 'reset', people: [] });
      showToastMessage('Saved game cleared', 'info');
      setShowClearSaveConfirm(false);
      setIsLoading(false);
    }, 500);
  }, [setGameState, showToastMessage]);
  const startNewGame = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      players: [], 
      gameOver: false, 
      winners: [],
      actionLog: []
    }));
    dispatchHistory({ type: 'record', prev: players, next: [] });
    showToastMessage('New game started! Add players to begin.', 'success');
  }, [players, setGameState, showToastMessage]);
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-100 p-4 md:p-8">
        <ToastManager toasts={toasts} removeToast={removeToast} />
        {isLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </div>
        )}
        <div className="max-w-5xl mx-auto">
          <Header
            onBack={onBack}
            onResetClick={() => setShowResetConfirm(true)}
            onClearSave={() => setShowClearSaveConfirm(true)}
          />
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 TARGET SCORE
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={newTargetScore}
              onChange={(e) => updateTargetScore(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              placeholder="Enter target score"
              aria-label="Target score"
            />
            <p className="text-sm text-purple-600 mt-2 font-semibold">
              First player to reach or exceed {targetScoreNum} points wins! 🏆
            </p>
          </div>
          <AddPlayerForm
            onAddPlayer={handleAddPlayer}
            maxPlayers={MAX_PLAYERS}
            currentCount={players.length}
          />
          {players.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
            </div>
          )}
          {players.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Score Board</h2>
                    <span className="text-sm text-gray-500">Target: {targetScoreNum}</span>
                  </div>
                  <WinnerAnnouncement winners={winners} />
                  <div className="space-y-3">
                    {players.map(player => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        targetScore={targetScoreNum}
                        gameOver={gameOver}
                        winners={winners}
                        onAddScore={addScore}
                        onRemove={handleRemovePlayer}
                      />
                    ))}
                  </div>
                </div>
                {gameOver && (
                  <button 
                    onClick={startNewGame}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-colors"
                  >
                    New Game
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <RankingList players={players} gameOver={gameOver} />
                <HistoryLog actionLog={actionLog} historyIndex={historyIndex} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-500 text-lg">
                No players yet. Click <span className="font-bold text-purple-600">Add Player</span> to get started!
              </p>
            </div>
          )}
        </div>
        <ConfirmModal
          isOpen={showResetConfirm}
          onConfirm={resetScores}
          onCancel={() => setShowResetConfirm(false)}
          title="Reset Points?"
          message="Set all players' scores to zero. This cannot be undone."
          confirmLabel="Reset"
        />
        <ConfirmModal
          isOpen={showClearAllConfirm}
          onConfirm={clearAllPlayers}
          onCancel={() => setShowClearAllConfirm(false)}
          title="Clear All Players?"
          message="Remove all players from the game. This cannot be undone."
          confirmLabel="Clear All"
        />
        <ConfirmModal
          isOpen={showClearSaveConfirm}
          onConfirm={clearSavedGame}
          onCancel={() => setShowClearSaveConfirm(false)}
          title="Clear Saved Game?"
          message="This will erase all saved data and return to default settings. This cannot be undone."
          confirmLabel="Clear Save"
        />
        {players.length < MAX_PLAYERS && (
          <button
            onClick={() => {
              const name = prompt("Enter player name:");
              if (name?.trim()) handleAddPlayer(name.trim());
            }}
            className="fixed bottom-6 right-6 sm:hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 z-30"
            title="Add Player"
            aria-label="Add player"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
}
export default TargetScoreGame;