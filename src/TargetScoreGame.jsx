import { useMemo, useState, useEffect, useReducer } from 'react';
import { createId } from './utils/id';
import { historyReducer, initialHistoryState } from './utils/history';

function TargetScoreGame({ onBack, showToast: externalShowToast }) {
  const [stage, setStage] = useState('setup');
  const [targetScoreInput, setTargetScoreInput] = useState('150');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [players, setPlayers] = useState([]);
  const [inputs, setInputs] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastQueue, setToastQueue] = useState([]);
  const [{ entries: history, index: historyIndex }, dispatchHistory] = useReducer(
    historyReducer,
    initialHistoryState
  );
  const [actionLog, setActionLog] = useState([]);

  const targetScore = Number(targetScoreInput);
  const playerColors = [
    '#E69F00',
    '#56B4E9',
    '#009E73',
    '#F0E442',
    '#0072B2',
    '#D55E00',
    '#CC79A7'
  ];

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
      setGameOver(true);
      setWinners(newWinners);
      if (newWinners.length === 1) {
        showToast(`🎉 ${newWinners[0].name} wins!`, 'success');
      } else {
        showToast(`🎉 It's a tie between ${newWinners.map(w => w.name).join(' and ')}!`, 'success');
      }
    }
  }, [players, targetScore, stage]);

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    setPlayerNames((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push('');
      return next;
    });
  };

  const startGame = () => {
    if (!Number.isFinite(targetScore) || targetScore <= 0) {
      showToast('Target score must be greater than 0', 'error');
      return;
    }
    const normalizedNames = playerNames.map((name, index) =>
      name.trim() ? name.trim() : `Player ${index + 1}`
    );
    const createdPlayers = normalizedNames.map((name, index) => ({
      id: createId(),
      name,
      score: 0,
      color: playerColors[index % playerColors.length],
    }));
    setPlayers(createdPlayers);
    setInputs({});
    setGameOver(false);
    setWinners([]);
    setActionLog([]);
    dispatchHistory({ type: 'reset', people: createdPlayers });
    setStage('play');
    showToast('Game started! First to reach the target wins!', 'success');
  };

  const recordAction = (logEntry) => {
    setActionLog((prev) => {
      const base = prev.slice(0, historyIndex);
      return logEntry ? [...base, logEntry] : base;
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
    
    const targetPlayer = players.find((player) => player.id === playerId);
    if (!targetPlayer) return;
    
    const isAlreadyWinner = targetPlayer.score >= targetScore;
    if (isAlreadyWinner) {
      showToast(`${targetPlayer.name} has already won!`, 'error');
      return;
    }
    
    const updated = players.map((player) =>
      player.id === playerId ? { ...player, score: player.score + delta } : player
    );
    
    setPlayers(updated);
    dispatchHistory({ type: 'record', prev: players, next: updated });
    recordAction({
      id: createId(),
      playerId,
      name: targetPlayer.name,
      delta,
      score: targetPlayer.score + delta,
      timestamp: Date.now(),
    });
    
    setInputs((prev) => ({ ...prev, [playerId]: '' }));
  };

  const resetScores = () => {
    if (players.length === 0) return;
    const resetPlayers = players.map((player) => ({ ...player, score: 0 }));
    setPlayers(resetPlayers);
    setInputs({});
    setGameOver(false);
    setWinners([]);
    setShowResetConfirm(false);
    dispatchHistory({ type: 'reset', people: resetPlayers });
    setActionLog([]);
    showToast('Scores reset', 'info');
  };

  const undo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setPlayers(history[nextIndex]);
      dispatchHistory({ type: 'set-index', index: nextIndex });
      showToast('Undone', 'info');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setPlayers(history[nextIndex]);
      dispatchHistory({ type: 'set-index', index: nextIndex });
      showToast('Redone', 'info');
    }
  };

  const visibleLog = actionLog.slice(0, historyIndex);
  const ranking = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  const handleKeyPress = (e, playerId) => {
    if (e.key === 'Enter') {
      addScore(playerId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎮</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  Target Score Game
                </h1>
                <p className="text-sm text-gray-500">
                  First to reach or exceed the target wins!
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onBack}
                className="h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
              >
                ← Back
              </button>
              {stage === 'play' && (
                <>
                  <button
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Undo"
                  >
                    ↶
                  </button>
                  <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="h-10 w-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Redo"
                  >
                    ↷
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="h-10 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                  >
                    Reset Game
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {stage === 'setup' ? (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Game Setup</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Score
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetScoreInput}
                  onChange={(e) => setTargetScoreInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Players
                </label>
                <select
                  value={playerCount}
                  onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  {[2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count} Players
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {playerNames.map((name, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Player {index + 1} Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setPlayerNames((prev) =>
                        prev.map((value, idx) => (idx === index ? e.target.value : value))
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    placeholder={`Player ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={startGame}
              className="mt-6 w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
            >
              Start Game
            </button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
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
                  {players.map((player) => {
                    const isWinner = player.score >= targetScore;
                    return (
                      <div
                        key={player.id}
                        className={`border-2 rounded-xl p-4 flex flex-col gap-3 transition-all ${
                          isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100'
                        }`}
                        style={{ borderLeftColor: player.color, borderLeftWidth: '4px' }}
                      >
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
                              onChange={(e) =>
                                setInputs((prev) => ({ ...prev, [player.id]: e.target.value }))
                              }
                              onKeyPress={(e) => handleKeyPress(e, player.id)}
                              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="Enter points"
                            />
                            <button
                              onClick={() => addScore(player.id)}
                              className="h-11 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        )}
                        
                        {gameOver && !isWinner && (
                          <div className="text-center py-2 text-gray-500 italic">
                            Game Over - {winners.map(w => w.name).join(', ')} {winners.length > 1 ? 'have' : 'has'} won!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {gameOver && (
                  <button
                    onClick={() => setStage('setup')}
                    className="mt-4 w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    New Game
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
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

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">History</h3>
                {visibleLog.length === 0 ? (
                  <p className="text-sm text-gray-500">No score changes yet.</p>
                ) : (
                  <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                    {visibleLog
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between border-b border-gray-100 pb-1">
                          <span>
                            {entry.name} {entry.delta >= 0 ? '+' : ''}
                            {entry.delta}
                          </span>
                          <span className="text-gray-500">Total {entry.score}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Reset Game?</h3>
            <p className="text-gray-600 mb-6">This will reset all scores to zero. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={resetScores}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TargetScoreGame;