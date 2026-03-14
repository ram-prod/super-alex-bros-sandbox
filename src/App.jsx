import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/useGameStore';
import SplashView from './components/SplashView';
import RosterView from './components/RosterView';
import MapSelectView from './components/MapSelectView';
import VsScreenView from './components/VsScreenView';
import BattleView from './components/BattleView';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function App() {
  const { gamePhase, players, matchWinner, nextMatch, resetGame } = useGameStore();

  const renderPhase = () => {
    switch (gamePhase) {
      case 'splash':
        return <SplashView />;
      case 'roster_select':
        return <RosterView />;
      case 'map_select':
        return <MapSelectView />;
      case 'vs_screen':
        return <VsScreenView />;
      case 'battle':
        return <BattleView />;
      case 'victory':
        return (
          <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
            {matchWinner && players.filter((p) => !p.isEliminated).length <= 1 ? (
              <h2 className="text-5xl text-yellow-400 font-black mb-6 text-center">
                🏆 {matchWinner.name} WINS THE TOURNAMENT!
              </h2>
            ) : matchWinner ? (
              <h2 className="text-4xl text-green-400 font-black mb-6 text-center">
                🎉 {matchWinner.name} wins the round!
              </h2>
            ) : (
              <h2 className="text-4xl text-green-400 font-black mb-6 text-center">🎉 Round over!</h2>
            )}
            <div className="flex gap-4">
              <button onClick={nextMatch}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold text-lg">
                Next Match
              </button>
              <button onClick={resetGame}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-bold text-lg">
                Reset
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gamePhase}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {renderPhase()}
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
