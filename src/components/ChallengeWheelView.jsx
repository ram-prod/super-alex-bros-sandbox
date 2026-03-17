import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

// ============================================
// CHALLENGE WHEEL — Drinking Challenge Spinner
// A game-show-style wheel that quiz masters spin
// between tournament matches to pick challenge categories
// ============================================

const WHEEL_SEGMENTS = [
  { id: 'waterfall', label: 'WATERFALL', emoji: '🌊', color: '#3B82F6', description: 'Everyone drinks in sequence — last one standing!' },
  { id: 'truth_or_drink', label: 'TRUTH OR\nDRINK', emoji: '🤫', color: '#8B5CF6', description: 'Answer honestly or take a sip. No bluffing allowed!' },
  { id: 'categories', label: 'CATEGORIES', emoji: '🧠', color: '#10B981', description: 'Name items in a category — first to hesitate drinks!' },
  { id: 'bachelor_hot_seat', label: 'BACHELOR\nHOT SEAT', emoji: '👑', color: '#F59E0B', description: 'Alexander answers — everyone else bets on the answer!' },
  { id: 'never_have_i', label: 'NEVER\nHAVE I', emoji: '🙈', color: '#EF4444', description: 'Classic Never Have I Ever — drink if you have!' },
  { id: 'duel', label: 'DRINK\nDUEL', emoji: '⚔️', color: '#F97316', description: 'Two players face off — loser of the challenge drinks!' },
  { id: 'group_chug', label: 'GROUP\nCHUG', emoji: '🍻', color: '#EC4899', description: 'Everyone drinks together — last to finish picks the next victim!' },
  { id: 'dare', label: 'DARE OR\nDOUBLE', emoji: '🎲', color: '#14B8A6', description: 'Complete the dare or drink double!' },
  { id: 'storytime', label: 'STORY\nTIME', emoji: '📖', color: '#A855F7', description: 'Tell an embarrassing story about someone. They drink!' },
  { id: 'kings_rule', label: "KING'S\nRULE", emoji: '🏰', color: '#DC2626', description: 'The spinner makes a rule — everyone must obey until next spin!' },
];

const SEGMENT_COUNT = WHEEL_SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// Deterministic "random" spin with weighted distribution
function getSpinAngle() {
  // 3-5 full rotations + random landing
  const fullRotations = 3 + Math.floor(Math.random() * 3);
  const extraAngle = Math.random() * 360;
  return fullRotations * 360 + extraAngle;
}

// ============================================
// SVG WHEEL COMPONENT
// ============================================
function WheelCanvas({ rotation, isSpinning }) {
  const size = 420;
  const center = size / 2;
  const radius = size / 2 - 8;
  const innerRadius = 40;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={isSpinning ? {
          boxShadow: [
            '0 0 30px rgba(250,204,21,0.3), 0 0 60px rgba(250,204,21,0.1)',
            '0 0 50px rgba(250,204,21,0.5), 0 0 100px rgba(250,204,21,0.2)',
            '0 0 30px rgba(250,204,21,0.3), 0 0 60px rgba(250,204,21,0.1)',
          ],
        } : {
          boxShadow: '0 0 20px rgba(250,204,21,0.2), 0 0 40px rgba(250,204,21,0.1)',
        }}
        transition={isSpinning ? { duration: 1, repeat: Infinity } : {}}
      />

      {/* Peg lights around the rim */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2 - Math.PI / 2;
          const x = center + (radius + 2) * Math.cos(angle);
          const y = center + (radius + 2) * Math.sin(angle);
          return (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: x - 5,
                top: y - 5,
                background: 'radial-gradient(circle, #FDE68A 30%, #F59E0B 100%)',
              }}
              animate={isSpinning ? {
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              } : {
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: isSpinning ? 0.4 : 2,
                repeat: Infinity,
                delay: i * (isSpinning ? 0.05 : 0.1),
              }}
            />
          );
        })}
      </div>

      {/* Main wheel SVG */}
      <motion.div
        style={{ rotate: rotation }}
        transition={{ type: 'tween', ease: [0.2, 0.8, 0.3, 1], duration: isSpinning ? 4 : 0 }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {/* Shadow filter */}
            <filter id="segShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Segments */}
          {WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);

            const ix1 = center + innerRadius * Math.cos(startAngle);
            const iy1 = center + innerRadius * Math.sin(startAngle);
            const ix2 = center + innerRadius * Math.cos(endAngle);
            const iy2 = center + innerRadius * Math.sin(endAngle);

            // Text position (between inner and outer, centered on segment)
            const textRadius = (radius + innerRadius) / 2 + 15;
            const textX = center + textRadius * Math.cos(midAngle);
            const textY = center + textRadius * Math.sin(midAngle);
            const textRotation = (i + 0.5) * SEGMENT_ANGLE;

            // Emoji position (closer to rim)
            const emojiRadius = radius - 35;
            const emojiX = center + emojiRadius * Math.cos(midAngle);
            const emojiY = center + emojiRadius * Math.sin(midAngle);

            const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
            const path = [
              `M ${ix1} ${iy1}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${ix2} ${iy2}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
              'Z',
            ].join(' ');

            return (
              <g key={seg.id}>
                {/* Segment fill */}
                <path d={path} fill={seg.color} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                {/* Lighter stripe at top of segment for depth */}
                <path d={path} fill="url(#none)" opacity="0" />

                {/* Emoji */}
                <text
                  x={emojiX}
                  y={emojiY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="22"
                  transform={`rotate(${textRotation}, ${emojiX}, ${emojiY})`}
                >
                  {seg.emoji}
                </text>

                {/* Label text */}
                {seg.label.split('\n').map((line, li) => (
                  <text
                    key={li}
                    x={textX}
                    y={textY + (li - (seg.label.split('\n').length - 1) / 2) * 13}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="900"
                    fill="white"
                    transform={`rotate(${textRotation}, ${textX}, ${textY + (li - (seg.label.split('\n').length - 1) / 2) * 13})`}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                    paintOrder="stroke"
                    stroke="rgba(0,0,0,0.6)"
                    strokeWidth="3"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={center} cy={center} r={innerRadius} fill="#1F2937" stroke="#F59E0B" strokeWidth="3" />
          <circle cx={center} cy={center} r={innerRadius - 6} fill="url(#centerGrad)" />
          <defs>
            <radialGradient id="centerGrad">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>
          </defs>
          <text x={center} y={center - 4} textAnchor="middle" dominantBaseline="central" fontSize="20">
            🍺
          </text>
          <text
            x={center} y={center + 14} textAnchor="middle" dominantBaseline="central"
            fontSize="7" fontWeight="900" fill="#F59E0B" letterSpacing="1.5"
          >
            SPIN
          </text>

          {/* Outer ring */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="3" />
        </svg>
      </motion.div>

      {/* Pointer / ticker at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
        <motion.div
          animate={isSpinning ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={isSpinning ? { duration: 0.3, repeat: Infinity } : {}}
        >
          <svg width="36" height="44" viewBox="0 0 36 44">
            <polygon
              points="18,40 4,4 32,4"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="2"
            />
            <polygon
              points="18,34 9,8 27,8"
              fill="#FBBF24"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// RESULT CARD — shows after wheel stops
// ============================================
function ResultCard({ segment, onSpin, onBack }) {
  return (
    <motion.div
      className="text-center max-w-md mx-auto"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.div
        className="rounded-2xl border-2 p-6 backdrop-blur-md"
        style={{
          borderColor: segment.color + '80',
          backgroundColor: segment.color + '15',
          boxShadow: `0 0 40px ${segment.color}30, 0 0 80px ${segment.color}10`,
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12 }}
      >
        <motion.div
          className="text-6xl mb-3"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
        >
          {segment.emoji}
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase"
          style={{ WebkitTextStroke: '1.5px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {segment.label.replace('\n', ' ')}
        </motion.h2>

        <motion.p
          className="text-lg text-gray-200 leading-relaxed mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {segment.description}
        </motion.p>

        <motion.div
          className="flex gap-3 justify-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            onClick={onSpin}
            className="group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="px-8 py-3 border-2 border-yellow-400/50 bg-yellow-500/10 rounded-sm group-hover:bg-yellow-500/20 group-hover:border-yellow-400 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all duration-200"
              style={{ transform: 'skewX(-10deg)' }}
            >
              <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-base text-yellow-300">
                🎰 SPIN AGAIN
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={onBack}
            className="group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="px-8 py-3 border-2 border-orange-500/50 bg-orange-500/10 rounded-sm group-hover:bg-orange-500/20 group-hover:border-orange-400 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-200"
              style={{ transform: 'skewX(-10deg)' }}
            >
              <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-base text-orange-300">
                ⚔️ BACK TO BRACKET
              </div>
            </div>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MAIN VIEW
// ============================================
export default function ChallengeWheelView() {
  const [phase, setPhase] = useState('ready'); // ready | spinning | result
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const cumulativeRotation = useRef(0);

  const handleSpin = useCallback(() => {
    if (phase === 'spinning') return;

    useGameStore.getState().playSFX('click_epic', 1.0);

    const spinAngle = getSpinAngle();
    const newRotation = cumulativeRotation.current + spinAngle;
    cumulativeRotation.current = newRotation;

    setRotation(newRotation);
    setPhase('spinning');
    setResult(null);

    // Determine which segment the pointer lands on
    // Pointer is at top (0 degrees). After rotation, the segment under the pointer
    // is determined by the final angle mod 360.
    setTimeout(() => {
      const normalizedAngle = (360 - (newRotation % 360)) % 360;
      const segmentIndex = Math.floor(normalizedAngle / SEGMENT_ANGLE) % SEGMENT_COUNT;
      const landed = WHEEL_SEGMENTS[segmentIndex];

      setResult(landed);
      setPhase('result');

      useGameStore.getState().playSFX('smash', 0.8);
    }, 4200); // Matches the CSS transition duration + settle time
  }, [phase]);

  const handleBack = useCallback(() => {
    useGameStore.getState().playSFX('click', 1.0);
    useGameStore.setState({ gamePhase: 'tournament_overview' });
  }, []);

  const handleReset = useCallback(() => {
    setPhase('ready');
    setResult(null);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-yellow-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -80, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 w-full max-w-2xl">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-wider -skew-x-3"
            style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          >
            🍺 CHALLENGE WHEEL
          </motion.h1>
          <motion.p
            className="text-gray-400 text-sm uppercase tracking-[0.3em] mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Spin to decide the drinking challenge
          </motion.p>
        </motion.div>

        {/* Wheel */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.2 }}
        >
          <WheelCanvas rotation={rotation} isSpinning={phase === 'spinning'} />
        </motion.div>

        {/* Spin button — visible when ready */}
        <AnimatePresence mode="wait">
          {phase === 'ready' && (
            <motion.div
              key="spin-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex gap-4"
            >
              <motion.button
                onClick={handleSpin}
                className="group"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="px-12 py-5 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-sm group-hover:border-yellow-400 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-2xl text-yellow-300">
                    🎰 SPIN THE WHEEL
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleBack}
                className="group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="px-6 py-5 border-2 border-gray-600/50 bg-gray-800/30 rounded-sm group-hover:border-gray-400 group-hover:shadow-[0_0_20px_rgba(156,163,175,0.2)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-gray-400">
                    ← BACK
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Spinning state — ticker sound simulation text */}
          {phase === 'spinning' && (
            <motion.div
              key="spinning-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.p
                className="text-2xl font-black text-yellow-400 uppercase tracking-widest"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                SPINNING...
              </motion.p>
            </motion.div>
          )}

          {/* Result */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultCard
                segment={result}
                onSpin={() => {
                  handleReset();
                  // Small delay so the ready state renders before spinning
                  setTimeout(handleSpin, 100);
                }}
                onBack={handleBack}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back button (always available, top-left) */}
      <motion.button
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 group flex items-center gap-2"
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.93 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-600/60 bg-gray-900/80 backdrop-blur-sm text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:border-gray-400/60 group-hover:text-gray-200 group-hover:bg-gray-700/20 group-hover:shadow-[0_0_20px_rgba(156,163,175,0.15)] transition-all duration-200"
          style={{ transform: 'skewX(-10deg)' }}
        >
          <span style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-2">
            <span className="text-lg">←</span>
            <span>Tournament</span>
          </span>
        </div>
      </motion.button>
    </div>
  );
}
