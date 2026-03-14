import { create } from 'zustand';
import gameData from '../data/gamedata.json';

const createPlayers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    chosenCharacter: null,
    isEliminated: false,
    wins: 0,
  }));

const pickNextTwo = (players) => {
  const alive = players.filter((p) => !p.isEliminated);
  if (alive.length < 2) return null;
  return { player1: alive[0], player2: alive[1] };
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1,
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
  selectedMap: null,
  matchWinner: null,
  tournamentWinner: null, // player with most wins at the end
  isTournamentOver: false,
  characters: gameData.characters,
  maps: gameData.maps,

  // --- actions ---
  setTournamentSize: (size) => {
    const clamped = Math.max(2, Math.min(11, size));
    set({
      tournamentSize: clamped,
      players: createPlayers(clamped),
      currentTurn: 1,
    });
  },

  assignCharacter: (playerId, characterId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return {};

      if (player.chosenCharacter === characterId) {
        const players = state.players.map((p) =>
          p.id === playerId ? { ...p, chosenCharacter: null } : p
        );
        return { players };
      }

      const takenBy = state.players.find(
        (p) => p.id !== playerId && p.chosenCharacter === characterId
      );
      if (takenBy) return {};

      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, chosenCharacter: characterId } : p
      );

      const nextUnchosen = players.find((p) => p.id > playerId && !p.chosenCharacter);
      const firstUnchosen = players.find((p) => !p.chosenCharacter);
      const nextTurn = nextUnchosen?.id || firstUnchosen?.id || state.currentTurn;

      return { players, currentTurn: nextTurn };
    }),

  confirmRoster: () =>
    set((state) => {
      const allLocked = state.players.every((p) => p.chosenCharacter !== null);
      if (!allLocked) return {};
      return { gamePhase: 'map_select' };
    }),

  selectMap: (mapId) =>
    set((state) => {
      const pair = pickNextTwo(state.players);
      if (!pair) return {};
      return {
        selectedMap: mapId,
        gamePhase: 'vs_screen',
        currentMatch: { ...pair, p1Damage: 0, p2Damage: 0, activeQuestion: null },
        matchWinner: null,
      };
    }),

  startBattle: () => set({ gamePhase: 'battle' }),

  awardDamage: (loserPlayerId) =>
    set((state) => {
      const m = state.currentMatch;
      const isP1 = m.player1?.id === loserPlayerId;

      const newP1Damage = isP1 ? Math.min(m.p1Damage + 100, 200) : m.p1Damage;
      const newP2Damage = !isP1 ? Math.min(m.p2Damage + 100, 200) : m.p2Damage;

      const newMatch = { ...m, p1Damage: newP1Damage, p2Damage: newP2Damage };

      // Check KO
      let winner = null;
      let loserId = null;
      if (newP1Damage >= 200) {
        winner = m.player2;
        loserId = m.player1.id;
      } else if (newP2Damage >= 200) {
        winner = m.player1;
        loserId = m.player2.id;
      }

      if (winner) {
        const players = state.players.map((p) => {
          if (p.id === loserId) return { ...p, isEliminated: true };
          if (p.id === winner.id) return { ...p, wins: p.wins + 1 };
          return p;
        });

        const alive = players.filter((p) => !p.isEliminated);
        const isTournamentOver = alive.length < 2;

        // Determine tournament winner by most wins
        let tournamentWinner = null;
        if (isTournamentOver) {
          const sorted = [...players].sort((a, b) => b.wins - a.wins);
          tournamentWinner = sorted[0];
        }

        return {
          currentMatch: newMatch,
          players,
          matchWinner: winner,
          gamePhase: 'victory',
          isTournamentOver,
          tournamentWinner,
        };
      }

      return { currentMatch: newMatch };
    }),

  nextMatch: () =>
    set((state) => {
      const alive = state.players.filter((p) => !p.isEliminated);
      if (alive.length < 2) return {};
      return {
        gamePhase: 'map_select',
        selectedMap: null,
        matchWinner: null,
        currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      };
    }),

  goBack: () =>
    set((state) => {
      if (state.gamePhase === 'map_select') return { gamePhase: 'roster_select' };
      if (state.gamePhase === 'roster_select') return { gamePhase: 'splash' };
      return {};
    }),

  resetGame: () =>
    set((state) => ({
      gamePhase: 'splash',
      players: createPlayers(state.tournamentSize),
      currentTurn: 1,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      selectedMap: null,
      matchWinner: null,
      tournamentWinner: null,
      isTournamentOver: false,
    })),
}));

export default useGameStore;
