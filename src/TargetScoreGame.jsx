import { useMemo, useReducer, useState } from 'react';
import { createId } from './utils/id';
import { historyReducer, initialHistoryState } from './utils/history';

function TargetScoreGame({ onBack, showToast }) {
  const [stage, setStage] = useState('setup');
  const [targetScoreInput, setTargetScoreInput] = useState('150');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [players, setPlayers] = useState([]);
  const [inputs, setInputs] = useState({});
  const [mode, setMode] = useState('score');
  const [calcInput, setCalcInput] = useState('');
  const [calcSelectedId, setCalcSelectedId] = useState('');
  const [calcError, setCalcError] = useState('');
  const [{ entries: history, index: historyIndex }, dispatchHistory] = useReducer(
    historyReducer,
    initialHistoryState
  );
  const [actionLog, setActionLog] = useState([]);

  const targetScore = Number(targetScoreInput);

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
    const createdPlayers = normalizedNames.map((name) => ({
      id: createId(),
      name,
      score: 0,
    }));
    setPlayers(createdPlayers);
    setInputs({});
    setMode('score');
    setCalcInput('');
    setCalcError('');
    setCalcSelectedId(createdPlayers[0]?.id || '');
    dispatchHistory({ type: 'reset', people: createdPlayers });
    setActionLog([]);
    setStage('play');
  };

  const recordAction = (logEntry) => {
    setActionLog((prev) => {
      const base = prev.slice(0, historyIndex);
      return logEntry ? [...base, logEntry] : base;
    });
  };

  const applyPlayerDelta = (playerId, delta, source = 'manual') => {
    if (!Number.isFinite(delta)) {
      showToast('Enter a valid number', 'error');
      return;
    }
    const targetPlayer = players.find((player) => player.id === playerId);
    if (!targetPlayer) {
      showToast('Select a player', 'error');
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
      source,
    });
  };

  const addScore = (playerId) => {
    const rawValue = inputs[playerId];
    if (rawValue === undefined || rawValue === '') {
      showToast('Enter a value first', 'error');
      return;
    }
    const delta = Number(rawValue);
    if (!Number.isFinite(delta)) {
      showToast('Enter a valid number', 'error');
      return;
    }
    applyPlayerDelta(playerId, delta, 'manual');
    setInputs((prev) => ({ ...prev, [playerId]: '' }));
  };

  const resetScores = () => {
    if (players.length === 0) return;
    const resetPlayers = players.map((player) => ({ ...player, score: 0 }));
    setPlayers(resetPlayers);
    setInputs({});
    setCalcInput('');
    setCalcError('');
    dispatchHistory({ type: 'reset', people: resetPlayers });
    setActionLog([]);
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
  const ranking = useMemo(() => [...players].sort((a, b) => a.score - b.score), [players]);

  const sanitizeExpression = (expression) => expression.replace(/[^0-9+\-*/().]/g, '');

  const evaluateExpression = (expression) => {
    const cleaned = sanitizeExpression(expression);
    if (!cleaned) {
      return { error: 'Enter a calculation' };
    }
    try {
      const result = Function(`"use strict"; return (${cleaned})`)();
      if (!Number.isFinite(result)) {
        return { error: 'Invalid calculation' };
      }
      const rounded = Math.round(result * 100000) / 100000;
      return { result: rounded };
    } catch (error) {
      return { error: 'Invalid calculation' };
    }
  };

  const appendCalc = (value) => {
    setCalcError('');
    setCalcInput((prev) => `${prev}${value}`);
  };

  const clearCalc = () => {
    setCalcInput('');
    setCalcError('');
  };

  const deleteCalc = () => {
    setCalcInput((prev) => prev.slice(0, -1));
  };

  const calculateResult = () => {
    const { result, error } = evaluateExpression(calcInput);
    if (error) {
      setCalcError(error);
      return null;
    }
    setCalcInput(String(result));
    setCalcError('');
    return result;
  };

  const applyCalculatorResult = () => {
    const { result, error } = evaluateExpression(calcInput);
    if (error) {
      setCalcError(error);
      return;
    }
    applyPlayerDelta(calcSelectedId, result, 'calculator');
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
                  Reach the target and you lose the match.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onBack}
                className="h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
              >
                Back to Scoreboard
              </button>
              {stage === 'play' && (
                <>
                  <button
                    onClick={() => setMode(mode === 'score' ? 'calculator' : 'score')}
                    className="h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                  >
                    {mode === 'score' ? 'Calculator Mode' : 'Score Mode'}
                  </button>
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
                    onClick={resetScores}
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
                <label htmlFor="target-score" className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Score
                </label>
                <input
                  id="target-score"
                  type="number"
                  min="1"
                  value={targetScoreInput}
                  onChange={(e) => setTargetScoreInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="150"
                />
              </div>
              <div>
                <label htmlFor="player-count" className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Players
                </label>
                <select
                  id="player-count"
                  value={playerCount}
                  onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  {[2, 3, 4].map((count) => (
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
                {mode === 'score' ? (
                  <div className="space-y-3">
                    {players.map((player) => {
                      const isLoser = Number.isFinite(targetScore) && player.score >= targetScore;
                      return (
                        <div
                          key={player.id}
                          className="border-2 border-gray-100 rounded-xl p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-gray-900">{player.name}</div>
                              <div className="text-sm text-gray-500">Total: {player.score}</div>
                            </div>
                            {isLoser && (
                              <div className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-semibold text-xs">
                                LOST
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="number"
                              value={inputs[player.id] ?? ''}
                              onChange={(e) =>
                                setInputs((prev) => ({ ...prev, [player.id]: e.target.value }))
                              }
                              className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                              placeholder="Enter points"
                            />
                            <button
                              onClick={() => addScore(player.id)}
                              className="h-11 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-900 text-white rounded-xl p-4 text-right text-2xl font-bold min-h-[64px]">
                      {calcInput || '0'}
                    </div>
                    {calcError && (
                      <div className="text-sm text-red-500 font-semibold">{calcError}</div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Assign Result To
                      </label>
                      <select
                        value={calcSelectedId}
                        onChange={(e) => setCalcSelectedId(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      >
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['7', '8', '9', '/'].map((value) => (
                        <button
                          key={value}
                          onClick={() => appendCalc(value)}
                          className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700"
                        >
                          {value}
                        </button>
                      ))}
                      {['4', '5', '6', '*'].map((value) => (
                        <button
                          key={value}
                          onClick={() => appendCalc(value)}
                          className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700"
                        >
                          {value}
                        </button>
                      ))}
                      {['1', '2', '3', '-'].map((value) => (
                        <button
                          key={value}
                          onClick={() => appendCalc(value)}
                          className="h-12 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-700"
                        >
                          {value}
                        </button>
                      ))}
                      {['0', '.', '=', '+'].map((value) => (
                        <button
                          key={value}
                          onClick={() => (value === '=' ? calculateResult() : appendCalc(value))}
                          className={`h-12 rounded-lg font-bold ${
                            value === '='
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={clearCalc}
                        className="h-11 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold text-gray-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={deleteCalc}
                        className="h-11 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold text-gray-700"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={applyCalculatorResult}
                      className="h-12 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg"
                    >
                      Add Result To Player
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Ranking (Low to High)</h3>
                <div className="space-y-2">
                  {ranking.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700">
                        {index + 1}. {player.name}
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
                  <div className="space-y-2 text-sm">
                    {visibleLog
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between">
                          <span className="text-gray-700">
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
    </div>
  );
}

export default TargetScoreGame;
