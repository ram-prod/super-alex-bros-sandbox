import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

export default function VictoryView() {
  const { matchWinner, players, selectedMap, nextMatch, resetGame, characters } = useGameStore();
  const [animStep, setAnimStep] = useState(0);

  const alive = players.filter((p) => !p.isEliminated);
  const isTournamentChampion = alive.length <= 1;
  const winnerCharName = characters.find((c) => c.id === matchWinner?.chosenCharacter)?.name || '???';

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStep(1), 2000);
    const t2 = setTimeout(() => setAnimStep(2), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Map background — blurred */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url('/assets/maps/${selectedMap || 'tuscany'}.jpg')`,
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute inset-0 bg-black/75" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      <div className="relative z-10 text-center px-6 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {/* Step 0: GAME! / VICTORY! slam */}
          {animStep === 0 && (
            <motion.div
              key="step0"
              initial={{ scale: 4, opacity: 0 }}
              animate={{ scale: [4, 1, 1.05], opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                scale: { times: [0, 0.15, 1], duration: 2 },
                opacity: { duration: 0.15 },
              }}
            >
              <h1
                className="text-8xl sm:text-9xl font-black text-white"
                style={{
                  WebkitTextStroke: '3px rgba(0,0,0,0.6)',
                  textShadow: '0 0 60px rgba(250,204,21,0.5), 0 0 120px rgba(250,204,21,0.3), 0 8px 0 rgba(0,0,0,0.5)',
                }}
              >
                {isTournamentChampion ? 'VICTORY!' : 'GAME!'}
              </h1>
            </motion.div>
          )}

          {/* Step 1: Winner announcement */}
          {animStep === 1 && (
            <motion.div
              key="step1"
              initial={{ x: '-100vw' }}
              animate={{ x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            >
              <h2
                className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight"
                style={{
                  WebkitTextStroke: '2px rgba(0,0,0,0.5)',
                  textShadow: '0 4px 0 rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-yellow-400">{matchWinner?.name}</span>
                <br />
                <span className="text-white">
                  {isTournamentChampion ? 'TOURNAMENT CHAMPION!' : 'WINS THE ROUND!'}
                </span>
              </h2>
            </motion.div>
          )}

          {/* Step 2: Character reveal + buttons */}
          {animStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Character image */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              >
                <div className="relative">
                  <img
                    src={`/assets/characters/${matchWinner?.chosenCharacter}.jpg`}
                    alt={winnerCharName}
                    className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl object-cover border-4 border-yellow-400
                      shadow-[0_0_40px_rgba(250,204,21,0.4)]"
                  />
                  <motion.div
                    className="absolute -top-3 -right-3 text-4xl"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isTournamentChampion ? '👑' : '🏆'}
                  </motion.div>
                </div>
              </motion.div>

              {/* Winner emoji + name */}
              <div className="text-6xl mb-2">{FIGHTER_EMOJI[matchWinner?.chosenCharacter] || '⭐'}</div>
              <h2
                className="text-4xl sm:text-5xl font-black text-yellow-400 mb-1"
                style={{ textShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
              >
                {matchWinner?.name}
              </h2>
              <p className="text-lg text-gray-400 font-bold uppercase tracking-widest mb-8">
                {winnerCharName}
              </p>

              {isTournamentChampion && (
                <motion.p
                  className="text-2xl sm:text-3xl font-black text-white mb-8"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ textShadow: '0 0 20px rgba(250,204,21,0.3)' }}
                >
                  🏆 TOURNAMENT CHAMPION 🏆
                </motion.p>
              )}

              {/* Buttons */}
              <motion.div
                className="flex gap-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {!isTournamentChampion && (
                  <motion.button
                    onClick={nextMatch}
                    className="px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide
                      bg-gradient-to-r from-blue-600 to-blue-500 text-white
                      border-2 border-blue-400/50 hover:border-blue-300
                      shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]
                      transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next Match →
                  </motion.button>
                )}
                <motion.button
                  onClick={resetGame}
                  className="px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide
                    bg-gray-800 text-gray-300 border-2 border-gray-600/50
                    hover:border-gray-400 hover:text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isTournamentChampion ? 'New Tournament' : 'Reset'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
