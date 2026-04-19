
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { CognitivePuzzle } from '../types';
import { Brain, ArrowRight, RefreshCw, Trophy, Grid, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CognitiveGames: React.FC = () => {
  const [gameType, setGameType] = useState<'puzzles' | 'memory' | 'jigsaw'>('puzzles');
  const [puzzle, setPuzzle] = useState<CognitivePuzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Memory Game State
  const [cards, setCards] = useState<{ id: number, img: string, flipped: boolean, matched: boolean }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  // Jigsaw State
  const [pieces, setPieces] = useState<{ id: number, currentPos: number, correctPos: number }[]>([]);

  const fetchNewPuzzle = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    try {
      const newPuzzle = await geminiService.generatePuzzle();
      setPuzzle(newPuzzle);
      geminiService.speak(`${newPuzzle.instruction}.`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameType === 'puzzles') fetchNewPuzzle();
    if (gameType === 'memory') initMemoryGame();
    if (gameType === 'jigsaw') initJigsawGame();
  }, [gameType]);

  const initMemoryGame = () => {
    const images = [
      '🍎', '🍌', '🍇', '🍓', '🍒', '🍍'
    ];
    const deck = [...images, ...images]
      .sort(() => Math.random() - 0.5)
      .map((img, idx) => ({ id: idx, img, flipped: false, matched: false }));
    setCards(deck);
    setFlippedCards([]);
    geminiService.speak("Let's match some pairs! Find two of the same fruit.");
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].flipped || cards[id].matched) return;

    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].img === cards[second].img) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setFlippedCards([]);
        setScore(s => s + 1);
        geminiService.speak("A match! Well done.");
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const initJigsawGame = () => {
    const size = 4; // 2x2 for simplicity
    const initialPieces = Array.from({ length: size }, (_, i) => ({
      id: i,
      currentPos: i,
      correctPos: i
    })).sort(() => Math.random() - 0.5);
    
    // Ensure it's actually shuffled
    setPieces(initialPieces.map((p, idx) => ({ ...p, currentPos: idx })));
    geminiService.speak("Can you put the pieces in the right order?");
  };

  const swapPieces = (idx1: number, idx2: number) => {
    const newPieces = [...pieces];
    const temp = newPieces[idx1];
    newPieces[idx1] = newPieces[idx2];
    newPieces[idx2] = temp;
    setPieces(newPieces);

    const isCorrect = newPieces.every((p, idx) => p.correctPos === idx);
    if (isCorrect) {
      setScore(s => s + 5);
      geminiService.speak("Perfect! You've solved the puzzle.");
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === puzzle?.correctIndex) {
      setScore(s => s + 1);
      geminiService.speak("That is absolutely correct!");
    } else {
      geminiService.speak(`Good effort!`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Game Selector */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'puzzles', label: 'Logic Puzzles', icon: <Brain /> },
          { id: 'memory', label: 'Memory Match', icon: <Grid /> },
          { id: 'jigsaw', label: 'Jigsaw', icon: <Layers /> },
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setGameType(type.id as any)}
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 whitespace-nowrap transition-all border-4 ${
              gameType === type.id ? 'bg-[#008B8B] text-white border-slate-900 shadow-[0_4px_0_#065f46]' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-slate-900 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {gameType === 'puzzles' && (
            <motion.div 
              key="puzzles"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              {!puzzle || loading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="animate-spin text-[#008B8B] mb-4" size={48} />
                  <p className="text-2xl font-black">Thinking of a puzzle...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-slate-500 uppercase tracking-wider">{puzzle.instruction}</h3>
                  <div className="bg-slate-50 p-10 rounded-[35px] border-4 border-slate-200 shadow-inner">
                    <span className="text-6xl font-black text-[#008B8B]">{puzzle.puzzleData}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                    {puzzle.options?.map((option, idx) => (
                      <button
                        key={idx}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswer(idx)}
                        className={`tactile-btn p-6 rounded-[24px] text-2xl font-black border-4 ${
                          selectedAnswer === null ? 'bg-white border-slate-900' :
                          idx === puzzle.correctIndex ? 'bg-green-500 text-white border-slate-900' :
                          selectedAnswer === idx ? 'bg-red-500 text-white border-slate-900' : 'bg-slate-50 opacity-40'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {selectedAnswer !== null && (
                    <button onClick={fetchNewPuzzle} className="tactile-btn bg-[#008B8B] text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 mx-auto">
                      Next Puzzle <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {gameType === 'memory' && (
            <motion.div 
              key="memory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-md mx-auto">
                {cards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className={`aspect-square rounded-2xl border-4 transition-all duration-500 flex items-center justify-center text-4xl ${
                      card.flipped || card.matched ? 'bg-white border-[#008B8B] rotate-0' : 'bg-[#008B8B] border-slate-900 rotate-180'
                    }`}
                  >
                    {(card.flipped || card.matched) ? card.img : '?'}
                  </button>
                ))}
              </div>
              <button onClick={initMemoryGame} className="mt-8 tactile-btn bg-white px-6 py-3 rounded-xl font-black border-2 border-slate-200">
                Reset Game
              </button>
            </motion.div>
          )}

          {gameType === 'jigsaw' && (
            <motion.div 
              key="jigsaw"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <p className="text-xl font-bold text-slate-500 mb-6">Tap two pieces to swap them</p>
              <div className="grid grid-cols-2 gap-2 max-w-[300px] mx-auto bg-slate-100 p-2 rounded-2xl border-4 border-slate-900">
                {pieces.map((piece, idx) => (
                  <motion.div
                    key={piece.id}
                    layout
                    onClick={() => {
                      const selectedIdx = pieces.findIndex(p => (p as any).selected);
                      if (selectedIdx === -1) {
                        const newPieces = [...pieces];
                        (newPieces[idx] as any).selected = true;
                        setPieces(newPieces);
                      } else {
                        const newPieces = [...pieces];
                        (newPieces[selectedIdx] as any).selected = false;
                        setPieces(newPieces);
                        swapPieces(selectedIdx, idx);
                      }
                    }}
                    className={`aspect-square rounded-lg border-4 flex items-center justify-center text-4xl cursor-pointer transition-all ${
                      (piece as any).selected ? 'border-yellow-400 scale-105 z-10' : 
                      piece.correctPos === idx ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {piece.correctPos === 0 ? '🧩' : piece.correctPos === 1 ? '🖼️' : piece.correctPos === 2 ? '🎨' : '🌈'}
                  </motion.div>
                ))}
              </div>
              <button onClick={initJigsawGame} className="mt-8 tactile-btn bg-white px-6 py-3 rounded-xl font-black border-2 border-slate-200">
                Shuffle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Score Board */}
      <div className="flex items-center justify-center">
        <div className="bg-[#FEF9EF] p-6 rounded-[35px] border-4 border-slate-900 flex items-center shadow-lg">
          <div className="w-16 h-16 bg-[#008B8B] rounded-2xl flex items-center justify-center mr-6 border-2 border-slate-900">
            <Trophy className="text-white" size={32} />
          </div>
          <div className="text-left">
            <span className="text-3xl font-black leading-none block">{score}</span>
            <span className="text-lg font-bold uppercase opacity-60">Brain Points</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveGames;
