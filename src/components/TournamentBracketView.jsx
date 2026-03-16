import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const FIGHTER_COLORS = {
  ruggero: '#ff4444', koen: '#44aaff', matthew: '#44ff88', martin: '#ff8844', robin: '#aa44ff',
  frederik: '#ffdd44', vincent: '#ff44aa', devan: '#44ffdd', gereon: '#8888ff', noah: '#ff6666', alexander: '#ffd700',
};

function PlayerTag({ player, isWinner, isWildcard, isVip }) {
  if (!player) return <div className="h-10 rounded-lg bg-gray-800/40 border border-gray-700/30" />;
  const charId = player.chosenCharacter;
  const color = FIGHTER_COLORS[charId] || '#666';
  const emoji = FIGHTER_EMOJI[charId] || '❓';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
        isWinner
          ? 'border-green-400/60 bg-green-500/10'
          : player.isEliminated
          ? 'border-red-500/30 bg-red-500/5 opacity-50'
          : 'border-white/10 bg-white/5'
      }`}
      style={isWinner ? { boxShadow: `0 0 12px ${color}30` } : {}}
    >
      <span className="text-lg">{emoji}</span>
      <span className={`text-sm font-bold ${isWinner ? 'text-green-300' : player.isEliminated ? 'text-red-400 line-through' : 'text-white'}`}>
        {player.name}
      </span>
      {isVip && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold">VIP</span>}
      {isWildcard && <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">🃏</span>}
      {isWinner && <span className="ml-auto text-green-400 text-xs font-bold">W</span>}
    </div>
  );
}

function MatchCard({ match, players, selectedWildcards, vipPlayerId }) {
  const p1 = players.find((p) => p.id === match.p1Id);
  const p2 = players.find((p) => p.id === match.p2Id);

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/40 rounded-xl p-3 space-y-2">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono text-center mb-1">
        {match.label || match.round}
      </div>
      <PlayerTag
        player={p1}
        isWinner={match.completed && match.winnerId === p1?.id}
        isWildcard={selectedWildcards.includes(p1?.id)}
        isVip={p1?.id === vipPlayerId}
      />
      <div className="text-center text-gray-600 text-xs font-bold">VS</div>
      <PlayerTag
        player={p2}
        isWinner={match.completed && match.winnerId === p2?.id}
        isWildcard={selectedWildcards.includes(p2?.id)}
        isVip={p2?.id === vipPlayerId}
      />
      {match.completed && (
        <div className="text-center text-[10px] text-green-400/60 font-mono uppercase tracking-wider mt-1">✓ Complete</div>
      )}
      {!match.completed && (
        <div className="text-center">
          <motion.div
            className="inline-block text-[10px] text-yellow-400/80 font-mono uppercase tracking-wider"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ● Pending
          </motion.div>
        </div>
      )}
    </div>
  );
}

function VipCard({ player }) {
  if (!player) return null;
  const charId = player.chosenCharacter;
  const emoji = FIGHTER_EMOJI[charId] || '❓';

  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/30 rounded-xl p-4 text-center"
      style={{ boxShadow: '0 0 30px rgba(250,204,21,0.1)' }}
      animate={{ borderColor: ['rgba(250,204,21,0.2)', 'rgba(250,204,21,0.5)', 'rgba(250,204,21,0.2)'] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <motion.div
        className="text-5xl mb-2"
        animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {emoji}
      </motion.div>
      <div className="text-yellow-300 font-black text-lg">{player.name}</div>
      <div className="text-yellow-500/60 text-[10px] uppercase tracking-widest font-mono mt-1">
        👑 VIP — Awaiting Quarter-Finals
      </div>
    </motion.div>
  );
}

// =============================================
// WILDCARD ROULETTE
// =============================================
function WildcardRoulette({ candidates, players, onComplete }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'spinning' | 'reveal'
  const [displayIdx, setDisplayIdx] = useState(0);
  const [revealed, setRevealed] = useState([]);

  const candidatePlayers = candidates.map((id) => players.find((p) => p.id === id)).filter(Boolean);

  useEffect(() => {
    if (phase !== 'spinning') return;
    const interval = setInterval(() => {
      setDisplayIdx((i) => (i + 1) % candidatePlayers.length);
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      // Pick 2 random from candidates for visual reveal
      const shuffled = [...candidatePlayers].sort(() => Math.random() - 0.5);
      setRevealed([shuffled[0], shuffled[1]]);
      setPhase('reveal');
    }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase, candidatePlayers.length]);

  const currentDisplay = candidatePlayers[displayIdx];

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 text-center max-w-lg">
        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        >
          WILDCARD DRAW
        </motion.h1>

        <motion.p
          className="text-gray-400 text-sm sm:text-base mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          5 fighters have fallen. Only <span className="text-purple-300 font-bold">2</span> will be resurrected for the Quarter-Finals.
        </motion.p>

        {/* Roulette display */}
        {phase === 'spinning' && currentDisplay && (
          <motion.div className="mb-10">
            <motion.div
              key={displayIdx}
              className="text-7xl mb-3"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.05 }}
            >
              {FIGHTER_EMOJI[currentDisplay.chosenCharacter] || '❓'}
            </motion.div>
            <div className="text-2xl font-black text-white">{currentDisplay.name}</div>
          </motion.div>
        )}

        {/* Reveal */}
        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div
              className="mb-10 space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-purple-400 text-sm uppercase tracking-widest font-bold mb-4">
                🃏 The Wildcards Are...
              </div>
              <div className="flex justify-center gap-6">
                {revealed.map((p, i) => (
                  <motion.div
                    key={p.id}
                    className="bg-purple-500/10 border-2 border-purple-400/50 rounded-xl p-5 text-center min-w-[140px]"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.5 + i * 0.4 }}
                    style={{ boxShadow: '0 0 30px rgba(168,85,247,0.2)' }}
                  >
                    <div className="text-5xl mb-2">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</div>
                    <div className="text-white font-black text-lg">{p.name}</div>
                    <div className="text-purple-300 text-xs font-bold mt-1">RESURRECTED 🃏</div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                onClick={onComplete}
                className="mt-8 px-10 py-4 rounded-xl font-black text-lg uppercase tracking-wider
                  bg-gradient-to-r from-purple-600 to-pink-600 text-white
                  border-2 border-purple-400/50 hover:border-purple-300 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(168,85,247,0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                ⚔️ TO THE QUARTER-FINALS
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spin button */}
        {phase === 'intro' && (
          <motion.button
            onClick={() => setPhase('spinning')}
            className="px-12 py-5 rounded-xl font-black text-2xl uppercase tracking-wider
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              border-2 border-purple-400/50"
            animate={{
              boxShadow: [
                '0 0 20px rgba(168,85,247,0.2)',
                '0 0 60px rgba(168,85,247,0.5)',
                '0 0 20px rgba(168,85,247,0.2)',
              ],
              scale: [1, 1.03, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            🎰 SPIN ROULETTE
          </motion.button>
        )}

        {/* Loser lineup (intro) */}
        {phase === 'intro' && (
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {candidatePlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/30"
              >
                <span className="text-lg">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</span>
                <span className="text-sm text-gray-300 font-bold">{p.name}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================
// MAIN VIEW
// =============================================
export default function TournamentBracketView() {
  const {
    players, knockoutRounds, pendingMatches, bracketStage,
    vipPlayerId, wildcardCandidates, selectedWildcards,
    isTournamentOver, generateTournament, advanceTournament, executeWildcards,
  } = useGameStore();

  // Generate tournament on first mount if no rounds exist
  useEffect(() => {
    if (knockoutRounds.length === 0 && !isTournamentOver) {
      generateTournament();
    }
  }, []);

  // Auto-advance when all pending matches are done and stage isn't wildcards
  useEffect(() => {
    if (bracketStage === 'wildcards') return;
    if (pendingMatches.length === 0 && knockoutRounds.length > 0) {
      const lastRound = knockoutRounds[knockoutRounds.length - 1];
      const allDone = lastRound?.matches.every((m) => m.completed);
      if (allDone && !isTournamentOver) {
        advanceTournament();
      }
    }
  }, [pendingMatches.length, knockoutRounds, bracketStage, isTournamentOver]);

  const vipPlayer = players.find((p) => p.id === vipPlayerId);
  const nextMatch = pendingMatches[0];
  const nextP1 = nextMatch ? players.find((p) => p.id === nextMatch.p1Id) : null;
  const nextP2 = nextMatch ? players.find((p) => p.id === nextMatch.p2Id) : null;

  const ROUND_LABELS = { Prelims: '🥊 PRELIMS', QF: '⚔️ QUARTER-FINALS', SF: '🔥 SEMI-FINALS', Final: '👑 GRAND FINAL' };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* BG */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)' }} />

      {/* Header */}
      <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between">
        <BackButton />
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-wider">
            {ROUND_LABELS[bracketStage] || bracketStage.toUpperCase()}
          </h2>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">
            Bachelor&apos;s 8 Knockout
          </p>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Wildcard Roulette overlay */}
      {bracketStage === 'wildcards' && (
        <WildcardRoulette
          candidates={wildcardCandidates}
          players={players}
          onComplete={executeWildcards}
        />
      )}

      {/* Bracket columns */}
      {bracketStage !== 'wildcards' && (
        <div className="relative z-10 flex-1 overflow-x-auto px-4 sm:px-8 pb-32">
          <div className="flex gap-8 min-h-full items-start pt-4">
            {knockoutRounds.map((round, roundIdx) => (
              <div key={roundIdx} className="flex flex-col gap-4 min-w-[280px] max-w-[320px]">
                {/* Round header */}
                <div className="text-center mb-2">
                  <div className="text-sm font-black text-white uppercase tracking-wider">
                    {ROUND_LABELS[round.round] || round.round}
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono">
                    {round.matches.filter((m) => m.completed).length}/{round.matches.length} complete
                  </div>
                </div>

                {/* VIP card in Prelims column */}
                {round.round === 'Prelims' && vipPlayer && (
                  <VipCard player={vipPlayer} />
                )}

                {/* Match cards */}
                {round.matches.map((match, mIdx) => (
                  <MatchCard
                    key={mIdx}
                    match={match}
                    players={players}
                    selectedWildcards={selectedWildcards}
                    vipPlayerId={vipPlayerId}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {bracketStage !== 'wildcards' && nextMatch && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
        >
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-10 pb-6 px-6">
            <div className="max-w-lg mx-auto">
              {/* Next match preview */}
              <div className="text-center mb-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Next Match</div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{FIGHTER_EMOJI[nextP1?.chosenCharacter] || '❓'}</span>
                    <span className="text-sm font-bold text-white">{nextP1?.name}</span>
                  </div>
                  <span className="text-yellow-500 font-black text-xs">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{nextP2?.name}</span>
                    <span className="text-xl">{FIGHTER_EMOJI[nextP2?.chosenCharacter] || '❓'}</span>
                  </div>
                </div>
              </div>

              {/* Proceed button */}
              <motion.button
                onClick={() => useGameStore.setState({ gamePhase: 'map_select' })}
                className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider
                  bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                  border-2 border-yellow-400/50 hover:border-yellow-300 transition-colors"
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(250,204,21,0.2)',
                    '0 0 40px rgba(250,204,21,0.4)',
                    '0 0 15px rgba(250,204,21,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ⚔️ PROCEED TO ARENA
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
