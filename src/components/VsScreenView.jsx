import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const FIGHTER_COLORS = {
  ruggero: '#ff4444', koen: '#44aaff', matthew: '#44ff88', martin: '#ff8844', robin: '#aa44ff',
  frederik: '#ffdd44', vincent: '#ff44aa', devan: '#44ffdd', gereon: '#8888ff', noah: '#ff6666', alexander: '#ffd700',
};

const FIGHTER_TITLES = {
  ruggero: 'The Inferno', koen: 'Lightning Strike', matthew: 'Tidal Force', martin: 'Blade Master',
  robin: 'The Sharpshooter', frederik: 'Iron Wall', vincent: 'Diamond Edge', devan: 'The Vortex',
  gereon: 'Dual Swords', noah: 'Thunder Lord', alexander: 'The Bachelor King',
};

const FIGHTER_STYLES = {
  ruggero: 'Aggressive', koen: 'Technical', matthew: 'Balanced', martin: 'Rush-Down',
  robin: 'Zoner', frederik: 'Defensive', vincent: 'Precision', devan: 'Tricky',
  gereon: 'All-Rounder', noah: 'Power', alexander: 'Royal',
};

// Generate a fake "power level" based on character + wins for dramatic effect
const getPowerLevel = (player) => {
  if (!player) return 0;
  const base = {
    ruggero: 8500, koen: 8200, matthew: 8800, martin: 9000, robin: 7900,
    frederik: 8600, vincent: 8100, devan: 7800, gereon: 8400, noah: 8700, alexander: 9999,
  };
  return (base[player.chosenCharacter] || 8000) + (player.wins || 0) * 500;
};

// Generate random stats (seeded by character name for consistency within a session)
const getRandomStats = (charId) => {
  // Simple hash from charId to get pseudo-random but consistent values
  const seed = (charId || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (offset) => {
    const x = Math.sin(seed + offset) * 10000;
    return Math.floor((x - Math.floor(x)) * 7) + 4; // Range 4-10
  };
  return {
    atk: rand(1),
    def: rand(2),
    spd: rand(3),
  };
};

// ---- Screen shake hook (from animation-patterns.md recipe) ----
const useScreenShake = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);

  const shake = useCallback((intensity = 8, duration = 400) => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) { setOffset({ x: 0, y: 0 }); return; }
      const decay = 1 - elapsed / duration;
      setOffset({
        x: (Math.random() - 0.5) * intensity * decay * 2,
        y: (Math.random() - 0.5) * intensity * decay * 2,
      });
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return { offset, shake };
};

// ---- Spark particles for VS impact ----
const SPARKS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
  distance: 60 + Math.random() * 140,
  size: 2 + Math.random() * 4,
  delay: Math.random() * 0.15,
  emoji: ['✨', '⚡', '💥', '🔥', '✨'][i % 5],
}));

// ---- Animated stat bar ----
function StatBar({ label, value, maxValue, color, delay }) {
  return (
    <motion.div
      className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold uppercase tracking-wider"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
    >
      <span className="text-gray-400 w-8 sm:w-10 text-right text-[10px] sm:text-xs shrink-0">{label}</span>
      <div className="flex-1 h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden min-w-[60px] sm:min-w-[80px]">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
          transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white/70 w-5 sm:w-6 text-left font-mono text-[10px] sm:text-xs shrink-0">{value}</span>
    </motion.div>
  );
}

// ---- Fighter Card with cinematic split-screen entrance ----
function FighterCard({ player, side, phase, color, isFinal }) {
  const charId = player?.chosenCharacter;
  const [imgError, setImgError] = useState(false);
  const isLeft = side === 'left';
  const title = FIGHTER_TITLES[charId] || 'Unknown';
  const style = FIGHTER_STYLES[charId] || 'Balanced';
  const power = getPowerLevel(player);
  const isVip = charId === 'alexander';

  // Random stats (ATK, DEF, SPD)
  const stats = useMemo(() => getRandomStats(charId), [charId]);

  const showCard = phase >= 1;
  const showStats = phase >= 3;

  return (
    <AnimatePresence>
      {showCard && (
        <motion.div
          className={`text-center flex-1 flex flex-col items-center ${isLeft ? 'items-start pl-4 sm:pl-8' : 'items-end pr-4 sm:pr-8'}`}
          initial={{ x: isLeft ? '-100vw' : '100vw', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 14, delay: isLeft ? 0 : 0.15 }}
        >
          {/* Character image / emoji with glow ring */}
          <motion.div
            className="relative mb-3"
            animate={phase >= 2 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ boxShadow: `0 0 0px ${color}` }}
              animate={{ boxShadow: [`0 0 20px ${color}60`, `0 0 50px ${color}90`, `0 0 20px ${color}60`] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {!imgError ? (
              <motion.img
                src={`/assets/characters/${charId}.jpg`}
                alt={player?.name}
                onError={() => setImgError(true)}
                className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl object-cover border-3"
                style={{ borderColor: color, boxShadow: `0 0 40px ${color}40` }}
                initial={{ filter: 'brightness(0)' }}
                animate={{ filter: 'brightness(1)' }}
                transition={{ duration: 0.4, delay: isLeft ? 0.3 : 0.45 }}
              />
            ) : (
              <motion.div
                className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl border-3 flex items-center justify-center text-5xl sm:text-6xl md:text-7xl"
                style={{ borderColor: color, backgroundColor: `${color}20`, boxShadow: `0 0 40px ${color}40` }}
                initial={{ filter: 'brightness(0)' }}
                animate={{ filter: 'brightness(1)' }}
                transition={{ duration: 0.4, delay: isLeft ? 0.3 : 0.45 }}
              >
                {FIGHTER_EMOJI[charId] || '❓'}
              </motion.div>
            )}
            {/* VIP crown badge */}
            {isVip && (
              <motion.div
                className="absolute -top-3 -right-3 text-2xl"
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👑
              </motion.div>
            )}
          </motion.div>

          {/* Fighter emoji + name */}
          <motion.div
            className="text-3xl sm:text-4xl mb-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: isLeft ? 0.5 : 0.65 }}
          >
            {FIGHTER_EMOJI[charId] || '❓'}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isLeft ? 0.6 : 0.75 }}
          >
            <div
              className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-0.5"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.5)' }}
            >
              {player?.name}
            </div>
            <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]" style={{ color }}>
              {title}
            </div>
          </motion.div>

          {/* Record */}
          <motion.div
            className="flex items-center gap-2 mt-1 text-xs font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isLeft ? 0.7 : 0.85 }}
          >
            <span className="text-green-400">{player?.wins || 0}W</span>
            <span className="text-gray-600">-</span>
            <span className="text-red-400">{player?.losses || 0}L</span>
            <span className="text-gray-600 mx-1">|</span>
            <span className="text-gray-400">{style}</span>
          </motion.div>

          {/* Stats panel with random ATK/DEF/SPD */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                className={`mt-3 w-full max-w-[180px] sm:max-w-[200px] space-y-1 sm:space-y-1.5 ${isLeft ? 'pr-2' : 'pl-2'}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <StatBar label="ATK" value={stats.atk} maxValue={10} color="#ef4444" delay={isLeft ? 0.1 : 0.2} />
                <StatBar label="DEF" value={stats.def} maxValue={10} color="#3b82f6" delay={isLeft ? 0.2 : 0.3} />
                <StatBar label="SPD" value={stats.spd} maxValue={10} color="#22c55e" delay={isLeft ? 0.3 : 0.4} />
                {/* Power level */}
                <motion.div
                  className="text-center mt-2 font-mono font-black text-base sm:text-lg"
                  style={{ color }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: isLeft ? 0.5 : 0.6, type: 'spring', stiffness: 300, damping: 12 }}
                >
                  PWR {power.toLocaleString()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function VsScreenView() {
  const { currentMatch, startBattle, characters, playSFX } = useGameStore();
  const { player1, player2 } = currentMatch;
  const isFinal = currentMatch.isFinal;
  const { offset, shake } = useScreenShake();

  // Multi-phase cinematic entrance sequence (~3 seconds total):
  // 0 = blackout, 1 = split-screen reveal + fighters slide in, 2 = VS slam + camera shake + sparks, 3 = stats reveal, 4 = button appears
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [];
    // Phase 1: split-screen panels slide open, fighters enter from opposite sides
    timers.push(setTimeout(() => setPhase(1), 400));
    // Phase 2: VS text slams in with camera shake + spark explosion
    timers.push(setTimeout(() => {
      setPhase(2);
      shake(14, 600);
      playSFX('smash', 0.7);
    }, 1200));
    // Phase 3: stats bars animate in
    timers.push(setTimeout(() => setPhase(3), 2000));
    // Phase 4: COMMENCE BATTLE button appears
    timers.push(setTimeout(() => setPhase(4), 2800));
    return () => timers.forEach(clearTimeout);
  }, [shake, playSFX]);

  const color1 = FIGHTER_COLORS[player1?.chosenCharacter] || '#ff4444';
  const color2 = FIGHTER_COLORS[player2?.chosenCharacter] || '#4488ff';

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden flex flex-col"
      animate={{ x: offset.x, y: offset.y }}
      transition={{ duration: 0 }}
    >
      {/* Split-screen background reveal — panels slide in from opposite sides */}
      <div className="absolute inset-0 flex">
        <motion.div
          className="w-1/2"
          style={{ background: `linear-gradient(135deg, ${color1}30 0%, ${color1}10 40%, #000 100%)` }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        />
        <motion.div
          className="w-1/2"
          style={{ background: `linear-gradient(225deg, ${color2}30 0%, ${color2}10 40%, #000 100%)` }}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        />
      </div>

      {/* Animated diagonal energy slash at the center split */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/2 w-1 h-full"
          style={{ transform: 'translateX(-50%) skewX(-5deg)' }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={phase >= 2 ? {
            scaleY: 1,
            opacity: [0, 1, 0.8],
            background: [
              'linear-gradient(to bottom, transparent, #facc15, transparent)',
              'linear-gradient(to bottom, transparent, #ffffff, transparent)',
              'linear-gradient(to bottom, transparent, #facc15, transparent)',
            ],
            width: ['2px', '8px', '3px'],
          } : {}}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Secondary glow lines flanking the center */}
        {phase >= 2 && (
          <>
            <motion.div
              className="absolute top-0 h-full opacity-30"
              style={{ left: 'calc(50% - 12px)', width: '1px', transform: 'skewX(-5deg)', background: 'linear-gradient(to bottom, transparent, #facc15, transparent)' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            />
            <motion.div
              className="absolute top-0 h-full opacity-30"
              style={{ left: 'calc(50% + 12px)', width: '1px', transform: 'skewX(-5deg)', background: 'linear-gradient(to bottom, transparent, #facc15, transparent)' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            />
          </>
        )}
      </div>

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Speed lines during entrance */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-white/40"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: '-10%',
                  width: `${30 + Math.random() * 40}%`,
                  height: '1px',
                  transformOrigin: 'left center',
                }}
                initial={{ scaleX: 0, x: 0 }}
                animate={{ scaleX: [0, 1, 0], x: ['0%', '120%'] }}
                transition={{ duration: 0.8 + Math.random() * 0.6, delay: Math.random() * 0.5, repeat: 2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* White flash on VS impact */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            className="absolute inset-0 z-30 bg-white pointer-events-none"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* GRAND FINAL banner */}
        <AnimatePresence>
          {isFinal && phase >= 1 && (
            <motion.div
              className="mb-4"
              initial={{ y: -80, opacity: 0, scale: 1.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 10, delay: 0.3 }}
            >
              <motion.h2
                className="text-4xl sm:text-5xl md:text-6xl font-black italic text-center uppercase tracking-wide"
                style={{
                  background: 'linear-gradient(180deg, #ffd700, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.5))',
                }}
                animate={{
                  filter: [
                    'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))',
                    'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 50px rgba(255,215,0,0.6))',
                    'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚔️ GRAND FINAL ⚔️
              </motion.h2>
              <motion.p
                className="text-center text-sm text-yellow-400/70 uppercase tracking-[0.4em] font-bold mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                The Bachelor Villa
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fighters + VS */}
        <div className="w-full max-w-5xl flex items-center justify-between mb-4">
          {/* Player 1 — slides in from left */}
          <FighterCard player={player1} side="left" phase={phase} color={color1} isFinal={isFinal} />

          {/* VS emblem — slams into center */}
          <div className="mx-2 sm:mx-4 flex-shrink-0 relative">
            <AnimatePresence>
              {phase >= 2 && (
                <>
                  {/* Spark particle explosion emanating from center on VS impact */}
                  {SPARKS.map((spark) => (
                    <motion.div
                      key={spark.id}
                      className="absolute text-xs pointer-events-none"
                      style={{ left: '50%', top: '50%' }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos(spark.angle) * spark.distance,
                        y: Math.sin(spark.angle) * spark.distance,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{ duration: 0.7, delay: spark.delay, ease: 'easeOut' }}
                    >
                      {spark.emoji}
                    </motion.div>
                  ))}

                  {/* Impact ring — expands outward from VS */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: 20,
                      height: 20,
                      marginLeft: -10,
                      marginTop: -10,
                      border: '3px solid rgba(250, 204, 21, 0.8)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 12, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  {/* Second impact ring with delay */}
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: 20,
                      height: 20,
                      marginLeft: -10,
                      marginTop: -10,
                      border: '2px solid rgba(255, 255, 255, 0.5)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 8, opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  />

                  {/* VS text — slams in from large scale with rotation */}
                  <motion.div
                    initial={{ scale: 6, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 10 }}
                  >
                    <motion.div
                      className="text-7xl sm:text-8xl md:text-9xl font-black"
                      animate={{
                        textShadow: [
                          '0 0 20px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.2), 0 2px 4px rgba(0,0,0,0.8)',
                          '0 0 60px rgba(250,204,21,0.9), 0 0 120px rgba(250,204,21,0.5), 0 2px 4px rgba(0,0,0,0.8)',
                          '0 0 20px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.2), 0 2px 4px rgba(0,0,0,0.8)',
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        color: 'transparent',
                        background: isFinal
                          ? 'linear-gradient(180deg, #ffd700, #ff6b00, #ff0000)'
                          : 'linear-gradient(180deg, #facc15, #f97316, #ef4444)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))',
                      }}
                    >
                      VS
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Player 2 — slides in from right */}
          <FighterCard player={player2} side="right" phase={phase} color={color2} isFinal={isFinal} />
        </div>

        {/* Match info bar */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              className="flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-500 uppercase tracking-widest font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 15 }}
            >
              <span style={{ color: color1 }}>{player1?.name}</span>
              <span className="text-gray-700">vs</span>
              <span style={{ color: color2 }}>{player2?.name}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMMENCE BATTLE button */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.button
              onClick={startBattle}
              data-sound="special"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
              className="mt-2"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <motion.div
                  className={`flex items-center justify-center px-10 sm:px-14 py-4 sm:py-5 border-2 backdrop-blur-md transition-colors duration-300 ${
                    isFinal
                      ? 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-400/80 text-yellow-300'
                      : 'bg-red-600/20 border-red-500/80 text-red-400 hover:bg-red-600/30 hover:border-red-400'
                  }`}
                  animate={{
                    skewX: -10,
                    boxShadow: isFinal
                      ? ['0 0 20px rgba(250,204,21,0.3)', '0 0 60px rgba(250,204,21,0.7)', '0 0 20px rgba(250,204,21,0.3)']
                      : ['0 0 20px rgba(239,68,68,0.2)', '0 0 50px rgba(239,68,68,0.5)', '0 0 20px rgba(239,68,68,0.2)'],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    className="text-3xl sm:text-4xl font-black uppercase tracking-wider"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8), 1px 1px 0 rgba(0,0,0,0.5)' }}
                    animate={{ skewX: 10 }}
                  >
                    ⚔️ COMMENCE BATTLE ⚔️
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom energy bar that fills during entrance */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 z-20"
        style={{
          background: isFinal
            ? 'linear-gradient(90deg, #ffd700, #ff6b00, #ff0000, #ff6b00, #ffd700)'
            : `linear-gradient(90deg, ${color1}, #facc15, ${color2})`,
        }}
        initial={{ width: '0%' }}
        animate={{ width: phase >= 4 ? '100%' : `${phase * 25}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
