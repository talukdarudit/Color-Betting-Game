import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Clock, Coins, Book, History, Home, ArrowLeft } from 'lucide-react';

const ColorBettingGame = () => {
  const [currentPage, setCurrentPage] = useState('game'); // 'game', 'howToPlay', 'history'
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [userCoins, setUserCoins] = useState(10);
  const [onlineUsers] = useState(Math.floor(Math.random() * 500) + 200);
  const [gamePhase, setGamePhase] = useState('betting'); // 'betting' or 'results'
  const [currentBets, setCurrentBets] = useState({ red: 0, blue: 0, green: 0 });
  const [userBet, setUserBet] = useState({ color: null, amount: 0 });
  const [betAmount, setBetAmount] = useState(0.1);
  const [lastWinner, setLastWinner] = useState(null);
  const [historyTab, setHistoryTab] = useState('game'); // 'game' or 'my'
  
  // Game statistics
  const [gameStats, setGameStats] = useState({
    red: { wins: 0, totalBets: 0, totalCoins: 0 },
    blue: { wins: 0, totalBets: 0, totalCoins: 0 },
    green: { wins: 0, totalBets: 0, totalCoins: 0 },
    totalRounds: 0
  });

  // Game history
  const [gameHistory, setGameHistory] = useState([]);
  const [userHistory, setUserHistory] = useState([]);

  const colors = [
    { name: 'red', bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'Red' },
    { name: 'blue', bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'Blue' },
    { name: 'green', bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'Green' }
  ];

  // Calculate win percentages
  const getWinPercentage = (color) => {
    if (gameStats.totalRounds === 0) return 0;
    return ((gameStats[color].wins / gameStats.totalRounds) * 100).toFixed(1);
  };

  // Generate random winner with slight bias towards colors with fewer bets
  const generateWinner = useCallback(() => {
    const weights = {
      red: Math.max(1, 100 - currentBets.red * 0.1),
      blue: Math.max(1, 100 - currentBets.blue * 0.1),
      green: Math.max(1, 100 - currentBets.green * 0.1)
    };
    
    const totalWeight = weights.red + weights.blue + weights.green;
    const random = Math.random() * totalWeight;
    
    if (random < weights.red) return 'red';
    if (random < weights.red + weights.blue) return 'blue';
    return 'green';
  }, [currentBets]);

  // Handle bet placement
  const placeBet = (color) => {
    if (gamePhase !== 'betting' || userBet.color || userCoins < betAmount) return;
    
    setUserBet({ color, amount: betAmount });
    setUserCoins(prev => Math.round((prev - betAmount) * 100) / 100);
    setCurrentBets(prev => ({
      ...prev,
      [color]: Math.round((prev[color] + betAmount) * 100) / 100
    }));
  };

  // Timer effect - simplified to avoid multiple calls
  useEffect(() => {
    if (gamePhase !== 'betting' || currentPage !== 'game') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, currentPage]);

  // Separate effect to handle round end when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && gamePhase === 'betting' && currentPage === 'game') {
      const winner = generateWinner();
      setLastWinner(winner);
      setGamePhase('results');
      
      // Add to game history
      const roundData = {
        round: currentRound,
        winner,
        totalStake: Math.round((currentBets.red + currentBets.blue + currentBets.green) * 100) / 100,
        bets: { ...currentBets }
      };
      setGameHistory(prev => [...prev, roundData]);

      // Add to user history if user participated
      if (userBet.color) {
        const won = userBet.color === winner;
        const winnings = won ? Math.round(userBet.amount * 2.5 * 100) / 100 : 0;
        const netResult = won ? Math.round((winnings - userBet.amount) * 100) / 100 : Math.round((-userBet.amount) * 100) / 100;
        
        setUserHistory(prev => [...prev, {
          round: currentRound,
          betColor: userBet.color,
          betAmount: userBet.amount,
          winner,
          won,
          winnings,
          netResult
        }]);
      }
      
      // Update statistics
      setGameStats(prev => {
        const newTotalRounds = prev.totalRounds + 1;
        return {
          red: {
            ...prev.red,
            wins: winner === 'red' ? prev.red.wins + 1 : prev.red.wins,
            totalBets: prev.red.totalBets + (currentBets.red > 0 ? 1 : 0),
            totalCoins: Math.round((prev.red.totalCoins + currentBets.red) * 100) / 100
          },
          blue: {
            ...prev.blue,
            wins: winner === 'blue' ? prev.blue.wins + 1 : prev.blue.wins,
            totalBets: prev.blue.totalBets + (currentBets.blue > 0 ? 1 : 0),
            totalCoins: Math.round((prev.blue.totalCoins + currentBets.blue) * 100) / 100
          },
          green: {
            ...prev.green,
            wins: winner === 'green' ? prev.green.wins + 1 : prev.green.wins,
            totalBets: prev.green.totalBets + (currentBets.green > 0 ? 1 : 0),
            totalCoins: Math.round((prev.green.totalCoins + currentBets.green) * 100) / 100
          },
          totalRounds: newTotalRounds
        };
      });

      // Award winnings
      if (userBet.color === winner) {
        const multiplier = 2.5;
        const winnings = Math.round(userBet.amount * multiplier * 100) / 100;
        setUserCoins(prev => Math.round((prev + winnings) * 100) / 100);
      }

      // Start new round after 5 seconds
      setTimeout(() => {
        setGamePhase('betting');
        setCurrentRound(prev => prev + 1);
        setTimeLeft(120);
        setCurrentBets({ red: 0, blue: 0, green: 0 });
        setUserBet({ color: null, amount: 0 });
        setLastWinner(null);
      }, 5000);
    }
  }, [timeLeft, gamePhase, currentPage, currentRound, currentBets, userBet, generateWinner]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation Component
  const Navigation = () => (
    <div className="flex justify-center mb-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex gap-2">
        <button
          onClick={() => setCurrentPage('game')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentPage === 'game' 
              ? 'bg-yellow-500 text-black font-bold' 
              : 'hover:bg-white/20'
          }`}
        >
          <Home className="w-4 h-4" />
          Game
        </button>
        <button
          onClick={() => setCurrentPage('howToPlay')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentPage === 'howToPlay' 
              ? 'bg-yellow-500 text-black font-bold' 
              : 'hover:bg-white/20'
          }`}
        >
          <Book className="w-4 h-4" />
          How to Play
        </button>
        <button
          onClick={() => setCurrentPage('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            currentPage === 'history' 
              ? 'bg-yellow-500 text-black font-bold' 
              : 'hover:bg-white/20'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>
    </div>
  );

  // How to Play Page
  const HowToPlayPage = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">How to Play Color Betting Arena</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-3 text-blue-400">🎮 Game Overview</h3>
            <p className="text-gray-300 leading-relaxed">
              Color Betting Arena is a thrilling prediction game where you bet on which color will be randomly selected as the winner. 
              Choose between Red, Blue, or Green, place your stake, and wait for the results. Each round lasts exactly 2 minutes.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-green-400">📋 How to Play</h3>
            <div className="space-y-2 text-gray-300">
              <p><strong>Step 1:</strong> Select your stake amount (0.1, 0.2, 0.5, 1, 2, or 5 coins)</p>
              <p><strong>Step 2:</strong> Choose your color (Red, Blue, or Green)</p>
              <p><strong>Step 3:</strong> Wait for the 2-minute countdown to end</p>
              <p><strong>Step 4:</strong> See if your color wins and collect your rewards!</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-purple-400">💰 Stakes vs Rewards</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-300 mb-2"><strong>Win Multiplier:</strong> 2.5x your stake</p>
              <p className="text-gray-300 mb-2"><strong>Example:</strong> Bet 1 coin → Win 2.5 coins (1.5 profit)</p>
              <p className="text-gray-300"><strong>Loss:</strong> You lose your entire stake amount</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-red-400">🎯 Winning Chances</h3>
            <p className="text-gray-300 leading-relaxed">
              Each color has a theoretical 33.33% chance of winning, but the algorithm slightly favors colors with fewer total bets 
              to maintain game balance. The win percentages are displayed in real-time to help you make informed decisions.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-orange-400">⚠️ Important Notes</h3>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <ul className="space-y-2 text-gray-300">
                <li>• You can only place ONE bet per round</li>
                <li>• Once a bet is placed, it cannot be changed or cancelled</li>
                <li>• Make sure you have enough coins before placing a bet</li>
                <li>• The game continues automatically - each round is exactly 2 minutes</li>
                <li>• Results are final and determined by a random algorithm</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-yellow-400">💡 Tips for Success</h3>
            <div className="space-y-2 text-gray-300">
              <p>• Start with smaller stakes to learn the game patterns</p>
              <p>• Watch the win percentages and betting patterns</p>
              <p>• Manage your coins wisely - don't bet everything at once</p>
              <p>• Remember: this is a game of chance, not skill</p>
              <p>• Play responsibly and within your limits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // History Page
  const HistoryPage = () => (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">Game History</h2>
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex gap-2">
          <button
            onClick={() => setHistoryTab('game')}
            className={`px-6 py-2 rounded-lg transition-all ${
              historyTab === 'game' 
                ? 'bg-yellow-500 text-black font-bold' 
                : 'hover:bg-white/20'
            }`}
          >
            Game History
          </button>
          <button
            onClick={() => setHistoryTab('my')}
            className={`px-6 py-2 rounded-lg transition-all ${
              historyTab === 'my' 
                ? 'bg-yellow-500 text-black font-bold' 
                : 'hover:bg-white/20'
            }`}
          >
            My History
          </button>
        </div>
      </div>

      {/* Game History Tab */}
      {historyTab === 'game' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">All Game Results</h3>
          {gameHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No games played yet. Start playing to see history!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {gameHistory.slice().reverse().map((game, index) => (
                <div key={game.round} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold">Round {game.round}</div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      game.winner === 'red' ? 'bg-red-500' :
                      game.winner === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {game.winner.toUpperCase()} WON
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">Total Stakes: {game.totalStake.toFixed(1)} coins</div>
                    <div className="text-xs text-gray-400">
                      Red: {game.bets.red.toFixed(1)} | Blue: {game.bets.blue.toFixed(1)} | Green: {game.bets.green.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My History Tab */}
      {historyTab === 'my' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Your Betting History</h3>
          {userHistory.length === 0 ? (
            <p className="text-gray-400 text-center py-8">You haven't placed any bets yet. Start playing to see your history!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userHistory.slice().reverse().map((bet, index) => (
                <div key={bet.round} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold">Round {bet.round}</div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        bet.betColor === 'red' ? 'bg-red-500' :
                        bet.betColor === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        BET ON {bet.betColor.toUpperCase()}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${bet.won ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.won ? 'WON' : 'LOST'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-300">
                      Bet: {bet.betAmount} coins | Winner: {bet.winner.toUpperCase()}
                    </div>
                    <div className={`font-bold ${bet.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.netResult >= 0 ? '+' : ''}{bet.netResult.toFixed(1)} coins
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Main Game Page
  const GamePage = () => (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold">{onlineUsers}</div>
          <div className="text-sm text-gray-300">Online Users</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold">#{currentRound}</div>
          <div className="text-sm text-gray-300">Current Round</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
          <div className="text-sm text-gray-300">Time Left</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <Coins className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold">{userCoins}</div>
          <div className="text-sm text-gray-300">Your Coins</div>
        </div>
      </div>

      {/* Game Status */}
      {gamePhase === 'results' && lastWinner && (
        <div className="text-center mb-8">
          <div className={`inline-block px-8 py-4 rounded-lg text-2xl font-bold ${
            lastWinner === 'red' ? 'bg-red-500' :
            lastWinner === 'blue' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            🎉 {lastWinner.toUpperCase()} WINS! 🎉
          </div>
          {userBet.color === lastWinner && (
            <div className="mt-4 text-green-400 text-xl font-bold">
              You won {Math.round(userBet.amount * 2.5 * 100) / 100} coins! 💰
            </div>
          )}
        </div>
      )}

      {/* Betting Amount Selector */}
      {gamePhase === 'betting' && !userBet.color && (
        <div className="text-center mb-8">
          <div className="text-lg mb-4">Select your stake amount:</div>
          <div className="flex justify-center gap-2 flex-wrap">
            {[0.1, 0.2, 0.5, 1, 2, 5].map(amount => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={userCoins < amount}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  betAmount === amount 
                    ? 'bg-yellow-500 text-black' 
                    : userCoins >= amount
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {amount} coins
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Betting Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {colors.map((color) => (
          <div key={color.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold mb-2">{color.text}</h3>
              <div className="text-lg">Win Rate: {getWinPercentage(color.name)}%</div>
              <div className="text-sm text-gray-300">
                Total Bets: {currentBets[color.name]} coins
              </div>
            </div>
            
            <button
              onClick={() => placeBet(color.name)}
              disabled={gamePhase !== 'betting' || userBet.color || userCoins < betAmount}
              className={`w-full h-32 rounded-lg text-2xl font-bold transition-all transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                userBet.color === color.name 
                  ? `${color.bg} ring-4 ring-yellow-400` 
                  : `${color.bg} ${color.hover}`
              }`}
            >
              {userBet.color === color.name ? (
                <div>
                  <div>BET PLACED</div>
                  <div className="text-lg">{userBet.amount} coins</div>
                </div>
              ) : gamePhase === 'betting' ? (
                <div>
                  <div>BET {betAmount} COINS</div>
                  <div className="text-lg">ON {color.text.toUpperCase()}</div>
                </div>
              ) : (
                'ROUND ENDED'
              )}
            </button>
            
            {/* Win History */}
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-300">
                Wins: {gameStats[color.name].wins} / {gameStats.totalRounds}
              </div>
              <div className="text-xs text-gray-400">
                Total Coins: {gameStats[color.name].totalCoins}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Color Betting Arena
          </h1>
          <p className="text-gray-300">Choose your color, place your bet, and win big!</p>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Page Content */}
        {currentPage === 'game' && <GamePage />}
        {currentPage === 'howToPlay' && <HowToPlayPage />}
        {currentPage === 'history' && <HistoryPage />}
      </div>
    </div>
  );
};

export default ColorBettingGame;
