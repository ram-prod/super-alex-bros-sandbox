import { create } from 'zustand';
import gameData from '../data/gamedata.json';

const createPlayers = () =>
  Array.from({ length: 11 }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    chosenCharacter: null,
    isEliminated: false,
  }));

const pickNextTwo = (players) => {
  const alive = players.filter((p) => !p.isEliminated);
  if (alive.length < 2) return null;
  return { player1: alive[0], player2: alive[1] };
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'roster_select',
  players: createPlayers(),
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
  selectedMap: null,
  characters: gameData.characters,
  maps: gameData.maps,

  // --- actions ---
  assignCharacter: (playerId, characterId) =>
    set((state) => {
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, chosenCharacter: characterId } : p
      );
      const allLocked = players.every((p) => p.chosenCharacter !== null);
      return { players, gamePhase: allLocked ? 'map_select' : state.gamePhase };
    }),

  selectMap: (mapId) =>
    set((state) => {
      const pair = pickNextTwo(state.players);
      if (!pair) return {};
      return {
        selectedMap: mapId,
        gamePhase: 'vs_screen',
        currentMatch: { ...pair, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      };
    }),

  startBattle: () => set({ gamePhase: 'battle' }),

  awardDamage: (loserPlayerId) =>
    set((state) => {
      const m = state.currentMatch;
      const isP1 = m.player1?.id === loserPlayerId;
      return {
        currentMatch: {
          ...m,
          p1Damage: isP1 ? m.p1Damage + 100 : m.p1Damage,
          p2Damage: !isP1 ? m.p2Damage + 100 : m.p2Damage,
        },
      };
    }),

  checkMatchWinner: () => {
    const { currentMatch, players } = get();
    const { p1Damage, p2Damage, player1, player2 } = currentMatch;

    if (p1Damage >= 200) {
      // player1 lost 2 rounds → eliminated
      set({
        players: players.map((p) => (p.id === player1.id ? { ...p, isEliminated: true } : p)),
        gamePhase: 'victory',
      });
      return player2;
    }
    if (p2Damage >= 200) {
      set({
        players: players.map((p) => (p.id === player2.id ? { ...p, isEliminated: true } : p)),
        gamePhase: 'victory',
      });
      return player1;
    }
    return null; // match not decided yet
  },

  nextMatch: () =>
    set((state) => {
      const alive = state.players.filter((p) => !p.isEliminated);
      if (alive.length < 2) {
        return { gamePhase: 'victory', currentMatch: { player1: alive[0], player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null } };
      }
      return {
        gamePhase: 'map_select',
        selectedMap: null,
        currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      };
    }),

  // debug helper
  resetGame: () =>
    set({
      gamePhase: 'roster_select',
      players: createPlayers(),
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      selectedMap: null,
    }),
}));

export default useGameStore;
