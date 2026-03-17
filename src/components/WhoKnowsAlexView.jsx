import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

// ============================================
// WHO KNOWS ALEXANDER BEST? — Trivia Round
// ============================================
// A standalone group trivia phase where all players
// compete to prove who knows the bachelor best.
// Features multiple-choice answers with a countdown
// timer that gets visually urgent in the last 5 seconds.

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

// Internal phase machine:
// intro → question_show → timer_running → time_up / revealed → scoring → (next question or results)
const PHASE = {
  INTRO: 'intro',
  QUESTION_SHOW: 'question_show',
  TIMER_RUNNING: 'timer_running',
  TIME_UP: 'time_up',
  REVEALED: 'revealed',
  SCORING: 'scoring',
  RESULTS: 'results',
};

export default function WhoKnowsAlexView() {
  const {
    whoKnowsAlexQuestions,
    whoKnowsAlexState,
    players,
    whoKnowsAlexReveal,
    whoKnowsAlexAwardPoints,
    whoKnowsAlexNextQuestion,
    exitWhoKnowsAlex,
    playSFX,
  } = useGameStore();

  const { currentQuestionIndex, scores, revealedAnswer, roundComplete, questionOrder } = whoKnowsAlexState;

  const [phase, setPhase] = useState(PHASE.INTRO);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const timerRef = useRef(null);
  const tickSfxRef = useRef(null);

  // Get current question from the shuffled order
  const currentQuestionId = questionOrder[currentQuestionIndex];
  const currentQuestion = whoKnowsAlexQuestions.find((q) => q.id === currentQuestionId);
  const totalQuestions = questionOrder.length;

  // ---------- INTRO SEQUENCE ----------
  useEffect(() => {
    if (phase !== PHASE.INTRO) return;
    const timer = setTimeout(() => {
      setPhase(PHASE.QUESTION_SHOW);
    }, 3000);
    return () => clearTimeout(timer);
  }, [phase]);

  // ---------- QUESTION SHOW → auto-start timer ----------
  useEffect(() => {
    if (phase !== PHASE.QUESTION_SHOW) return;
    const timer = setTimeout(() => {
      setTimeLeft(currentQuestion?.timeLimit || 20);
      setPhase(PHASE.TIMER_RUNNING);
    }, 1500);
    return () => clearTimeout(timer);
  }, [phase, currentQuestion]);

  // ---------- COUNTDOWN TIMER ----------
  useEffect(() => {
    if (phase !== PHASE.TIMER_RUNNING) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase(PHASE.TIME_UP);
          playSFX('smash', 0.6);
          return 0;
        }
        // Tick sound in last 5 seconds
        if (prev <= 6) {
          playSFX('click', 0.3);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, playSFX]);

  // ---------- TIME_UP → auto-reveal ----------
  useEffect(() => {
    if (phase !== PHASE.TIME_UP) return;
    const timer = setTimeout(() => {
      whoKnowsAlexReveal();
      setPhase(PHASE.REVEALED);
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase, whoKnowsAlexReveal]);

  // ---------- ROUND COMPLETE → results ----------
  useEffect(() => {
    if (roundComplete && phase === PHASE.SCORING) {
      setPhase(PHASE.RESULTS);
    }
  }, [roundComplete, phase]);

  // Quiz master manually reveals answer early
  const handleRevealEarly = useCallback(() => {
    clearInterval(timerRef.current);
    whoKnowsAlexReveal();
    setPhase(PHASE.REVEALED);
    playSFX('click_epic', 0.8);
  }, [whoKnowsAlexReveal, playSFX]);

  // Quiz master toggles a player who got it right
  const togglePlayer = useCallback((playerId) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }, []);

  // Quiz master confirms scoring and moves to next
  const handleConfirmScoring = useCallback(() => {
    if (selectedPlayers.length > 0) {
      whoKnowsAlexAwardPoints(selectedPlayers);
      playSFX('first_blood', 0.5);
    }
    setSelectedPlayers([]);
    setPhase(PHASE.SCORING);

    // Short delay then advance
    setTimeout(() => {
      whoKnowsAlexNextQuestion();
      const state = useGameStore.getState();
      if (!state.whoKnowsAlexState.roundComplete) {
        setPhase(PHASE.QUESTION_SHOW);
      }
    }, 800);
  }, [selectedPlayers, whoKnowsAlexAwardPoints, whoKnowsAlexNextQuestion, playSFX]);

  // Skip to next without scoring
  const handleSkip = useCallback(() => {
    clearInterval(timerRef.current);
    setSelectedPlayers([]);
    whoKnowsAlexNextQuestion();
    const state = useGameStore.getState();
    if (!state.whoKnowsAlexState.roundComplete) {
      setPhase(PHASE.QUESTION_SHOW);
    } else {
      setPhase(PHASE.RESULTS);
    }
  }, [whoKnowsAlexNextQuestion]);

  // ---------- RESULTS: sorted leaderboard ----------
  const sortedPlayers = [...players]
    .map((p) => ({ ...p, score: scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const isUrgent = phase === PHASE.TIMER_RUNNING && timeLeft <= 5;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/40 to-gray-950">
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isUrgent
            ? [
                'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)',
                'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.3) 0%, transparent 70%)',
                'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, transparent 70%)',
              ]
            : 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.1) 0%, transparent 70%)',
        }}
        transition={isUrgent ? { repeat: Infinity, duration: 0.8 } : {}}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
        }}
      />

      {/* ============ INTRO BANNER ============ */}
      <AnimatePresence>
        {phase === PHASE.INTRO && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                👑
              </motion.div>
              <motion.h1
                className="text-5xl sm:text-7xl md:text-8xl font-black text-white uppercase tracking-wider"
                style={{ WebkitTextStroke: '3px rgba(168,85,247,0.6)' }}
                initial={{ scale: 5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 8, stiffness: 150 }}
              >
                WHO KNOWS
              </motion.h1>
              <motion.h1
                className="text-5xl sm:text-7xl md:text-8xl font-black text-yellow-400 uppercase tracking-wider mt-2"
                style={{ WebkitTextStroke: '3px rgba(0,0,0,0.7)' }}
                initial={{ scale: 5, opacity: 0, rotate: 10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 8, stiffness: 150, delay: 0.3 }}
              >
                ALEXANDER
              </motion.h1>
              <motion.h2
                className="text-3xl sm:text-4xl font-black text-purple-300 uppercase tracking-widest mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                BEST?
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ MAIN CONTENT (Questions) ============ */}
      <AnimatePresence mode="wait">
        {phase !== PHASE.INTRO && phase !== PHASE.RESULTS && currentQuestion && (
          <motion.div
            key={`q-${currentQuestionId}`}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4 }}
          >
            {/* Progress bar */}
            <div className="w-full max-w-2xl mb-6">
              <div className="flex items-center justify-between text-xs text-purple-300/60 font-mono uppercase tracking-widest mb-2">
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>👑 Who Knows Alex?</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Timer */}
            {(phase === PHASE.TIMER_RUNNING || phase === PHASE.TIME_UP) && (
              <motion.div
                className="mb-6"
                animate={
                  isUrgent
                    ? {
                        scale: [1, 1.2, 1],
                        color: ['#FF4444', '#FF0000', '#FF4444'],
                      }
                    : {}
                }
                transition={
                  isUrgent
                    ? { repeat: Infinity, duration: 0.6 }
                    : {}
                }
              >
                <div
                  className={`text-6xl sm:text-7xl font-mono font-black tabular-nums ${
                    isUrgent ? 'text-red-500' : timeLeft <= 10 ? 'text-orange-400' : 'text-white'
                  }`}
                  style={{ WebkitTextStroke: '2px rgba(0,0,0,0.7)' }}
                >
                  {phase === PHASE.TIME_UP ? (
                    <motion.span
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-red-500"
                    >
                      TIME!
                    </motion.span>
                  ) : (
                    timeLeft
                  )}
                </div>
                {/* Timer bar */}
                {phase === PHASE.TIMER_RUNNING && currentQuestion && (
                  <div className="w-48 h-2 bg-gray-800 rounded-full mt-2 mx-auto overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-purple-500'}`}
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{
                        duration: timeLeft,
                        ease: 'linear',
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Question card */}
            <div className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 text-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="text-purple-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
                👑 BACHELOR TRIVIA
              </div>
              <motion.h3
                className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-snug"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentQuestion.question}
              </motion.h3>
            </div>

            {/* Multiple choice options */}
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentQuestion.options.map((option, i) => {
                const isCorrect = i === currentQuestion.correctIndex;
                const isRevealed = phase === PHASE.REVEALED || phase === PHASE.SCORING;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div
                      className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 ${
                        isRevealed && isCorrect
                          ? 'border-green-400 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                          : isRevealed && !isCorrect
                          ? 'border-gray-700 bg-gray-900/40 opacity-50'
                          : 'border-gray-600/50 bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex-shrink-0 w-10 h-10 rounded-lg font-black text-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${OPTION_COLORS[i]}30`,
                            color: OPTION_COLORS[i],
                            border: `2px solid ${OPTION_COLORS[i]}60`,
                          }}
                        >
                          {OPTION_LABELS[i]}
                        </span>
                        <span className="text-white font-bold text-base sm:text-lg text-left">
                          {option}
                        </span>
                        {isRevealed && isCorrect && (
                          <motion.span
                            className="ml-auto text-2xl"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                          >
                            ✅
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ============ QUIZ MASTER CONTROLS ============ */}
            <div className="w-full max-w-2xl">
              <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-mono">
                Quiz Master Controls
              </div>

              {/* Before reveal: Reveal Answer button */}
              {phase === PHASE.TIMER_RUNNING && (
                <div className="flex justify-center">
                  <motion.button
                    onClick={handleRevealEarly}
                    className="group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className="px-8 py-3 border-2 border-purple-500/60 bg-purple-600/30 rounded-sm hover:bg-purple-500/40 hover:border-purple-400 transition-all duration-200"
                      style={{ transform: 'skewX(-10deg)' }}
                    >
                      <div style={{ transform: 'skewX(10deg)' }} className="text-sm font-bold text-purple-200 uppercase tracking-wider">
                        👁️ Reveal Answer
                      </div>
                    </div>
                  </motion.button>
                </div>
              )}

              {/* After reveal: Player scoring + Next */}
              {(phase === PHASE.REVEALED || phase === PHASE.SCORING) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-400 text-center">
                    Tap players who got it right, then confirm:
                  </p>

                  {/* Player selection grid */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {players.map((player) => {
                      const isSelected = selectedPlayers.includes(player.id);
                      return (
                        <motion.button
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          className="group"
                        >
                          <div
                            className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all duration-200 ${
                              isSelected
                                ? 'border-green-400 bg-green-500/30 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                                : 'border-gray-600 bg-gray-800/60 text-gray-400 hover:border-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {isSelected ? '✅ ' : ''}{player.name}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Confirm + Skip buttons */}
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      onClick={handleConfirmScoring}
                      className="group"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="py-3 px-8 border-2 border-green-500/60 bg-green-600/30 rounded-sm hover:bg-green-500/40 transition-all duration-200"
                        style={{ transform: 'skewX(-5deg)' }}
                      >
                        <div style={{ transform: 'skewX(5deg)' }} className="font-bold text-green-300 uppercase tracking-wider text-sm">
                          {selectedPlayers.length > 0
                            ? `✅ Award ${selectedPlayers.length} Player${selectedPlayers.length > 1 ? 's' : ''}`
                            : '➡️ Next Question'}
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={handleSkip}
                      className="group"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="py-3 px-6 border-2 border-gray-600 bg-gray-800/60 rounded-sm hover:border-gray-400 transition-all duration-200"
                        style={{ transform: 'skewX(-5deg)' }}
                      >
                        <div style={{ transform: 'skewX(5deg)' }} className="font-bold text-gray-400 uppercase tracking-wider text-sm">
                          ⏭️ Skip
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ RESULTS SCREEN ============ */}
      <AnimatePresence>
        {phase === PHASE.RESULTS && (
          <motion.div
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              className="text-4xl sm:text-6xl font-black text-white uppercase tracking-wider mb-2"
              style={{ WebkitTextStroke: '2px rgba(168,85,247,0.6)' }}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 150 }}
            >
              RESULTS
            </motion.h2>
            <p className="text-purple-300/60 text-sm uppercase tracking-widest mb-8">
              Who Knows Alexander Best?
            </p>

            {/* Leaderboard */}
            <div className="w-full max-w-md space-y-2 mb-10">
              {sortedPlayers.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                    i === 0
                      ? 'border-yellow-400/60 bg-yellow-500/10 shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                      : i === 1
                      ? 'border-gray-300/40 bg-gray-400/5'
                      : i === 2
                      ? 'border-orange-400/40 bg-orange-500/5'
                      : 'border-gray-700 bg-gray-900/40'
                  }`}
                >
                  <span className="text-2xl w-8 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <span className="flex-1 font-bold text-white text-lg">{player.name}</span>
                  <motion.span
                    className="text-xl font-black text-purple-300 tabular-nums"
                    key={player.score}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    {player.score} pts
                  </motion.span>
                </motion.div>
              ))}
            </div>

            {/* Back to tournament button */}
            <motion.button
              onClick={exitWhoKnowsAlex}
              className="group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sortedPlayers.length * 0.1 + 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-sound="epic"
            >
              <div
                className="py-4 px-10 border-2 border-purple-500/60 bg-purple-600/30 rounded-sm hover:bg-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-200"
                style={{ transform: 'skewX(-5deg)' }}
              >
                <div style={{ transform: 'skewX(5deg)' }} className="text-lg font-bold text-purple-200 uppercase tracking-wider">
                  🏟️ Back to Tournament
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ URGENCY SCREEN BORDER (last 5 seconds) ============ */}
      <AnimatePresence>
        {isUrgent && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-40 border-4 border-red-500/60 rounded-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0.4, 1],
              borderColor: ['rgba(239,68,68,0.4)', 'rgba(239,68,68,0.9)', 'rgba(239,68,68,0.4)'],
            }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
