import React, { useMemo, useReducer, useCallback, useEffect } from 'react';
import { createId } from './utils/id';
import { historyReducer } from './utils/history';
const PLAYER_COLORS = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const STORAGE_KEY = 'targetScoreGame_state';
function useLocalStorage(initialValue) {
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
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving data:', error);
      }
      return updated;
    });
  }, []);
  return [state, updateState];
}
function PlayerCard({ player, targetScore, gameOver, winners, inputs, onInputChange, onAddScore, onKeyPress }) {
  const isWinner = player.score >= targetScore;
  const winnerNames = winners.map(w => w.name).join(', ');
  return (
    <div className={`border-2 rounded-xl p-4 flex flex-col gap-3 transition-all ${
      isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
    }`} style={{ borderLeftColor: player.color, borderLeftWidth: '4px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold text-gray-900">{player.name}</div>
          {isWinner && (
            <div className="px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 font-bold text-xs">
              👑 WINNER
            </div>
          )}
        </div>
        <div className="text-sm font-semibold">
          Score: <span className="text-lg">{player.score}</span>
        </div>
      </div>
      {!gameOver && !isWinner && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={inputs[player.id] ?? ''}
            onChange={(e) => onInputChange(player.id, e.target.value)}
            onKeyPress={(e) => onKeyPress(e, player.id)}
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            placeholder="Enter points"
          />
          <button
            onClick={() => onAddScore(player.id)}
            className="h-11 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
          >
            Add
          </button>
        </div>
      )}
      {gameOver && !isWinner && (
        <div className="text-center py-2 text-gray-500 italic">
          Game Over - {winnerNames} {winners.length > 1 ? 'have' : 'has'} won!
        </div>
      )}
    </div>
  );
}
function ScoreBoard({ players, targetScore, gameOver, winners, inputs, setInputs, addScore }) {
  const handleKeyPress = (e, playerId) => {
    if (e.key === 'Enter') addScore(playerId);
  };
  const handleInputChange = (playerId, value) => {
    setInputs(prev => ({ ...prev, [playerId]: value }));
  };
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Score Board</h2>
          <p className="text-sm text-gray-500">Target score: {targetScore}</p>
        </div>
      </div>
      {gameOver && winners.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-lg text-center font-bold text-lg">
          🎉 {winners.map(w => w.name).join(', ')} {winners.length > 1 ? 'WIN' : 'WINS'}! 🎉
        </div>
      )}
      <div className="space-y-3">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            targetScore={targetScore}
            gameOver={gameOver}
            winners={winners}
            inputs={inputs}
            onInputChange={handleInputChange}
            onAddScore={addScore}
            onKeyPress={handleKeyPress}
          />
        ))}
      </div>
    </div>
  );
}
function RankingList({ players, gameOver }) {
  const ranking = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
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
}
function HistoryLog({ actionLog, historyIndex }) {
  const visibleLog = actionLog.slice(0, historyIndex);
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">History</h3>
      {visibleLog.length === 0 ? (
        <p className="text-sm text-gray-500">No score changes yet.</p>
      ) : (
        <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
          {visibleLog.slice().reverse().map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b border-gray-100 pb-1">
              <span>{entry.name} {entry.delta >= 0 ? '+' : ''}{entry.delta}</span>
              <span className="text-gray-500">Total {entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function GameSetup({ targetScore, onTargetScoreChange, playerCount, onPlayerCountChange, playerNames, onPlayerNameChange, onStartGame }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Game Setup</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Score</label>
          <input
            type="number"
            min="1"
            value={targetScore}
            onChange={(e) => onTargetScoreChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
            placeholder="150"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Players</label>
          <select
            value={playerCount}
            onChange={(e) => onPlayerCountChange(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
          >
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>{count} Players</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {playerNames.map((name, index) => (
          <div key={index}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Player {index + 1} Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onPlayerNameChange(index, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
              placeholder={`Player ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <button onClick={onStartGame} className="mt-6 w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">
        Start Game
      </button>
    </div>
  );
}
function ResetConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">Reset Game?</h3>
        <p className="text-gray-600 mb-6">This will reset all scores to zero. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">Reset</button>
          <button onClick={onCancel} className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
function Header({ onBack, stage, canUndo, canRedo, onUndo, onRedo, onResetClick, onClearSave }) {
  return (
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
          <button onClick={onBack} className="h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">← Back</button>
          {stage === 'play' && (
            <>
              <button onClick={onUndo} disabled={!canUndo} className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">↶</button>
              <button onClick={onRedo} disabled={!canRedo} className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">↷</button>
              <button onClick={onResetClick} className="h-10 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors">Reset Game</button>
            </>
          )}
          <button onClick={onClearSave} className="h-10 px-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors" title="Clear saved game">Clear Save</button>
        </div>
      </div>
    </div>
  );
}
function TargetScoreGame({ onBack, showToast: externalShowToast }) {
  const [gameState, setGameState] = useLocalStorage({
    stage: 'setup',
    targetScoreInput: '150',
    playerCount: 2,
    playerNames: ['', ''],
    players: [],
    inputs: {},
    gameOver: false,
    winners: [],
    actionLog: [],
    history: { entries: [], index: -1 }
  });
  const { stage, targetScoreInput, playerCount, playerNames, players, inputs, gameOver, winners, actionLog, history } = gameState;
  const targetScore = Number(targetScoreInput);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [toastQueue, setToastQueue] = React.useState([]);
  const [{ entries: historyEntries, index: historyIndex }, dispatchHistory] = useReducer(historyReducer, history);
  useEffect(() => {
    setGameState(prev => ({ ...prev, history: { entries: historyEntries, index: historyIndex } }));
  }, [historyEntries, historyIndex, setGameState]);
  const showToast = (message, type = 'info') => {
    setToastQueue(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
  };
  useEffect(() => {
    if (toastQueue.length > 0 && externalShowToast) {
      const [current] = toastQueue;
      externalShowToast(current.message, current.type);
      setToastQueue(prev => prev.slice(1));
    }
  }, [toastQueue, externalShowToast]);
  useEffect(() => {
    if (players.length === 0 || stage !== 'play') return;
    const newWinners = players.filter(p => p.score >= targetScore);
    if (newWinners.length > 0) {
      setGameState(prev => ({ ...prev, gameOver: true, winners: newWinners }));
      if (newWinners.length === 1) {
        showToast(`🎉 ${newWinners[0].name} wins!`, 'success');
      } else {
        showToast(`🎉 It's a tie between ${newWinners.map(w => w.name).join(' and ')}!`, 'success');
      }
    }
  }, [players, targetScore, stage, setGameState]);
  const handlePlayerCountChange = (count) => {
    setGameState(prev => {
      const nextNames = prev.playerNames.slice(0, count);
      while (nextNames.length < count) nextNames.push('');
      return { ...prev, playerCount: count, playerNames: nextNames };
    });
  };
  const handlePlayerNameChange = (index, value) => {
    setGameState(prev => ({
      ...prev,
      playerNames: prev.playerNames.map((name, i) => i === index ? value : name)
    }));
  };
  const startGame = () => {
    if (!Number.isFinite(targetScore) || targetScore <= 0) {
      showToast('Target score must be greater than 0', 'error');
      return;
    }
    const normalizedNames = playerNames.map((name, index) => name.trim() ? name.trim() : `Player ${index + 1}`);
    const createdPlayers = normalizedNames.map((name, index) => ({
      id: createId(),
      name,
      score: 0,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }));
    setGameState(prev => ({
      ...prev,
      players: createdPlayers,
      inputs: {},
      gameOver: false,
      winners: [],
      actionLog: [],
      stage: 'play'
    }));
    dispatchHistory({ type: 'reset', people: createdPlayers });
    showToast('Game started! First to reach the target wins!', 'success');
  };
  const recordAction = (logEntry) => {
    setGameState(prev => {
      const base = prev.actionLog.slice(0, historyIndex);
      return { ...prev, actionLog: logEntry ? [...base, logEntry] : base };
    });
  };
  const addScore = (playerId) => {
    if (gameOver) {
      showToast('Game is over! Start a new game to continue playing.', 'error');
      return;
    }
    const rawValue = inputs[playerId];
    if (!rawValue) {
      showToast('Enter a value first', 'error');
      return;
    }
    const delta = Number(rawValue);
    if (!Number.isFinite(delta)) {
      showToast('Enter a valid number', 'error');
      return;
    }
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) return;
    if (targetPlayer.score >= targetScore) {
      showToast(`${targetPlayer.name} has already won!`, 'error');
      return;
    }
    const updated = players.map(p => p.id === playerId ? { ...p, score: p.score + delta } : p);
    setGameState(prev => ({ ...prev, players: updated, inputs: { ...prev.inputs, [playerId]: '' } }));
    dispatchHistory({ type: 'record', prev: players, next: updated });
    recordAction({
      id: createId(),
      playerId,
      name: targetPlayer.name,
      delta,
      score: targetPlayer.score + delta,
      timestamp: Date.now(),
    });
  };
  const resetScores = () => {
    if (players.length === 0) return;
    const resetPlayers = players.map(p => ({ ...p, score: 0 }));
    setGameState(prev => ({ ...prev, players: resetPlayers, inputs: {}, gameOver: false, winners: [], actionLog: [] }));
    setShowResetConfirm(false);
    dispatchHistory({ type: 'reset', people: resetPlayers });
    showToast('Scores reset', 'info');
  };
  const undo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setGameState(prev => ({ ...prev, players: historyEntries[nextIndex] }));
      dispatchHistory({ type: 'set-index', index: nextIndex });
      showToast('Undone', 'info');
    }
  };
  const redo = () => {
    if (historyIndex < historyEntries.length - 1) {
      const nextIndex = historyIndex + 1;
      setGameState(prev => ({ ...prev, players: historyEntries[nextIndex] }));
      dispatchHistory({ type: 'set-index', index: nextIndex });
      showToast('Redone', 'info');
    }
  };
  const clearSavedGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState({
      stage: 'setup',
      targetScoreInput: '150',
      playerCount: 2,
      playerNames: ['', ''],
      players: [],
      inputs: {},
      gameOver: false,
      winners: [],
      actionLog: [],
      history: { entries: [], index: -1 }
    });
    dispatchHistory({ type: 'reset', people: [] });
    showToast('Saved game cleared', 'info');
  };
  const setInputs = (updater) => {
    setGameState(prev => ({ ...prev, inputs: typeof updater === 'function' ? updater(prev.inputs) : updater }));
  };
  const setTargetScoreInput = (value) => {
    setGameState(prev => ({ ...prev, targetScoreInput: value }));
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Header
          onBack={onBack}
          stage={stage}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyEntries.length - 1}
          onUndo={undo}
          onRedo={redo}
          onResetClick={() => setShowResetConfirm(true)}
          onClearSave={clearSavedGame}
        />
        {stage === 'setup' ? (
          <GameSetup
            targetScore={targetScoreInput}
            onTargetScoreChange={setTargetScoreInput}
            playerCount={playerCount}
            onPlayerCountChange={handlePlayerCountChange}
            playerNames={playerNames}
            onPlayerNameChange={handlePlayerNameChange}
            onStartGame={startGame}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <ScoreBoard
                players={players}
                targetScore={targetScore}
                gameOver={gameOver}
                winners={winners}
                inputs={inputs}
                setInputs={setInputs}
                addScore={addScore}
              />
              {gameOver && (
                <button onClick={() => setGameState(prev => ({ ...prev, stage: 'setup' }))} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  New Game
                </button>
              )}
            </div>
            <div className="space-y-4">
              <RankingList players={players} gameOver={gameOver} />
              <HistoryLog actionLog={actionLog} historyIndex={historyIndex} />
            </div>
          </div>
        )}
      </div>
      {showResetConfirm && <ResetConfirmModal onConfirm={resetScores} onCancel={() => setShowResetConfirm(false)} />}
    </div>
  );
}
export default TargetScoreGame;