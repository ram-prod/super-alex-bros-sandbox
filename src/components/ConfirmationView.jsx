import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

export default function ConfirmationView() {
  const players = useGameStore((s) => s.players);
  const evaluateVipPhase = useGameStore((s) => s.evaluateVipPhase);
  const goBack = useGameStore((s) => s.goBack);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="relative z-10 text-center px-6 max-w-xl">
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 mb-4 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        >
          ARE YOU READY?
        </motion.h1>

        <motion.p className="text-gray-400 text-sm mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {players.length} fighters are about to enter the arena
        </motion.p>

        {/* Fighter lineup */}
        <motion.div className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/40">
              <span className="text-lg">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</span>
              <span className="text-xs font-bold text-white">{p.name}</span>
            </div>
          ))}
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <motion.button
            onClick={evaluateVipPhase}
            className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-wider
              bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-2 border-yellow-400/50"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(250,204,21,0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            ⚔️ LET&apos;S GO!
          </motion.button>

          <motion.button
            onClick={goBack}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider
              text-gray-400 border border-gray-700 hover:border-gray-500 hover:text-white transition-colors"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.95 }}
          >
            ← BACK TO ROSTER
          </motion.button>
        </div>
      </div>
    </div>
  );
}
