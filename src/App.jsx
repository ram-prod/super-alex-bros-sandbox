import useGameStore from './store/useGameStore';

function App() {
  const {
    gamePhase, players, currentMatch, selectedMap, characters, maps,
    assignCharacter, selectMap, startBattle, awardDamage, checkMatchWinner, nextMatch, resetGame,
  } = useGameStore();

  const winner = currentMatch.player1 && !currentMatch.player2 && gamePhase === 'victory'
    ? currentMatch.player1 : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">⚡ Super Alex Bros</h1>
      <p className="text-lg mb-6">
        Phase: <span className="text-cyan-400 font-bold">{gamePhase}</span>
        {selectedMap && <> | Map: <span className="text-green-400">{selectedMap}</span></>}
      </p>

      {/* DEBUG: Players */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {players.map((p) => (
          <div key={p.id} className={`rounded-lg p-3 border ${p.isEliminated ? 'border-red-800 bg-red-950 opacity-50' : 'border-gray-700 bg-gray-900'}`}>
            <div className="font-bold">{p.name}</div>
            <div className="text-sm text-gray-400">
              Char: {p.chosenCharacter || '—'}
              {p.isEliminated && <span className="text-red-400 ml-2">💀 OUT</span>}
            </div>
            {gamePhase === 'roster_select' && !p.chosenCharacter && (
              <select
                className="mt-2 w-full bg-gray-800 text-white rounded p-1 text-sm"
                defaultValue=""
                onChange={(e) => assignCharacter(p.id, e.target.value)}
              >
                <option value="" disabled>Pick...</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* DEBUG: Map Select */}
      {gamePhase === 'map_select' && (
        <div className="mb-6">
          <h2 className="text-xl mb-2 text-yellow-300">Select Map</h2>
          <div className="flex gap-3">
            {maps.map((m) => (
              <button key={m.id} onClick={() => selectMap(m.id)}
                className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded font-bold">
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DEBUG: VS Screen */}
      {gamePhase === 'vs_screen' && currentMatch.player1 && (
        <div className="mb-6 text-center">
          <h2 className="text-3xl text-red-400 font-bold mb-4">
            {currentMatch.player1.name} ⚔️ {currentMatch.player2.name}
          </h2>
          <button onClick={startBattle}
            className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-xl font-bold">
            START BATTLE
          </button>
        </div>
      )}

      {/* DEBUG: Battle */}
      {gamePhase === 'battle' && currentMatch.player1 && (
        <div className="mb-6">
          <h2 className="text-xl mb-3 text-yellow-300">Battle!</h2>
          <div className="flex gap-8 justify-center text-center">
            {[['player1', 'p1Damage'], ['player2', 'p2Damage']].map(([pk, dk]) => (
              <div key={pk} className="bg-gray-900 rounded-lg p-4 w-48">
                <div className="font-bold text-lg">{currentMatch[pk].name}</div>
                <div className="text-3xl my-2">{currentMatch[dk]}%</div>
                <button
                  onClick={() => { awardDamage(currentMatch[pk].id); }}
                  className="bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded text-sm mt-1"
                >
                  +100% dmg
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => { const w = checkMatchWinner(); if (w) console.log('Winner:', w.name); }}
            className="mt-4 bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded font-bold block mx-auto">
            Check Winner
          </button>
        </div>
      )}

      {/* DEBUG: Victory */}
      {gamePhase === 'victory' && (
        <div className="text-center mb-6">
          {winner ? (
            <h2 className="text-4xl text-yellow-400 font-bold">🏆 {winner.name} WINS THE TOURNAMENT!</h2>
          ) : (
            <h2 className="text-3xl text-green-400 font-bold">🎉 Round over!</h2>
          )}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={nextMatch}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold">Next Match</button>
            <button onClick={resetGame}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">Reset Game</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
