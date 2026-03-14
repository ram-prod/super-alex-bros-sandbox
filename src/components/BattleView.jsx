import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

function DamageText({ damage }) {
  const color =
    damage >= 200 ? 'text-red-500' :
    damage >= 100 ? 'text-orange-400' :
    'text-white';

  return (
    <motion.span
      key={damage}
      className={`text-6xl sm:text-7xl md:text-8xl font-black ${color} transition-colors duration-300`}
      style={{
        WebkitTextStroke: '3px rgba(0,0,0,0.8)',
        textShadow: damage >= 100
          ? '0 0 30px rgba(239,68,68,0.5), 0 4px 0 rgba(0,0,0,0.6)'
          : '0 4px 0 rgba(0,0,0,0.6)',
      }}
      initial={{ scale: 1.5, y: -10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      {damage}%
    </motion.span>
  );
}

function PlayerHUD({ player, damage, side, characters }) {
  const charName = characters.find((c) => c.id === player?.chosenCharacter)?.name || '???';
  const emoji = FIGHTER_EMOJI[player?.chosenCharacter] || '❓';
  const isLeft = side === 'left';

  return (
    <div className={`flex-1 flex flex-col items-center ${isLeft ? 'sm:items-start' : 'sm:items-end'}`}>
      <div className={`flex items-center gap-3 mb-2 ${!isLeft && 'flex-row-reverse'}`}>
        <span className="text-3xl sm:text-4xl">{emoji}</span>
        <div className={!isLeft ? 'text-right' : ''}>
          <div className="text-lg sm:text-xl font-black text-white">{player?.name}</div>
          <div className={`text-xs font-bold uppercase tracking-widest ${isLeft ? 'text-red-400' : 'text-blue-400'}`}>
            {charName}
          </div>
        </div>
      </div>
      <DamageText damage={damage} />
    </div>
  );
}

export default function BattleView() {
  const { currentMatch, selectedMap, awardDamage, characters } = useGameStore();
  const { player1, player2, p1Damage, p2Damage } = currentMatch;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Map background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/assets/maps/${selectedMap}.jpg')` }}
      />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
        }}
      />

      {/* HUD - Top */}
      <div className="relative z-10 px-4 sm:px-8 pt-6">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <PlayerHUD player={player1} damage={p1Damage} side="left" characters={characters} />

          {/* Center divider */}
          <div className="flex flex-col items-center pt-4 flex-shrink-0">
            <motion.div
              className="text-2xl sm:text-3xl font-black text-yellow-400/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚡
            </motion.div>
            <div className="w-px h-8 bg-gradient-to-b from-yellow-400/50 to-transparent mt-1" />
          </div>

          <PlayerHUD player={player2} damage={p2Damage} side="right" characters={characters} />
        </div>
      </div>

      {/* Center stage — battle content area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-lg bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
        >
          <motion.h2
            className="text-3xl sm:text-4xl font-black mb-4"
            animate={{
              color: ['#facc15', '#f97316', '#ef4444', '#f97316', '#facc15'],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            BATTLE ON!
          </motion.h2>
          <div className="text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 mb-1">🎮 Question / Minigame Area</p>
            <p className="text-xs">Content will appear here during rounds</p>
          </div>
        </motion.div>
      </div>

      {/* Admin controls — bottom */}
      <div className="relative z-10 px-4 sm:px-8 pb-6 pt-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-mono">
            Admin Controls
          </div>
          <div className="flex gap-3 justify-center">
            <motion.button
              onClick={() => awardDamage(player1.id)}
              className="flex-1 max-w-[280px] py-4 px-4 rounded-xl text-base sm:text-lg font-black uppercase tracking-wide
                bg-gradient-to-r from-red-700 to-red-600 text-white
                border-2 border-red-500/50 hover:border-red-400
                shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]
                transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              +100% → {player1?.name}
            </motion.button>

            <motion.button
              onClick={() => awardDamage(player2.id)}
              className="flex-1 max-w-[280px] py-4 px-4 rounded-xl text-base sm:text-lg font-black uppercase tracking-wide
                bg-gradient-to-r from-blue-700 to-blue-600 text-white
                border-2 border-blue-500/50 hover:border-blue-400
                shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]
                transition-all duration-200"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              +100% → {player2?.name}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
