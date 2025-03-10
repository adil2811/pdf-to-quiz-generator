import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Clock } from "lucide-react";
import { MatchCard } from "@/lib/schemas";

// Shuffle function
/**
 * Shuffles an array randomly.
 * @param array - The array to shuffle.
 * @returns A new array with elements shuffled.
 */
const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type MatchCardProps = {
  questions: MatchCard[]; // Data from API
  clearPDF: () => void;
  newMode: (mode: Mode) => void; // Accept a mode parameter
};

type Mode = "learn" | "flashCard" | "normalQuiz";


/**
 * MatchCardComponent is a React component for displaying a matching quiz game.
 * @param fetchedQuestions - Array of questions and answers fetched from the API.
 * @param clearPDF - Function to clear the PDF data.
 * @param newMode - Function to change the quiz mode.
 * @returns A JSX element representing the matching quiz game.
 */
const MatchCardComponent: React.FC<MatchCardProps> = ({ questions: fetchedQuestions, clearPDF , newMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<{ text: string; type: string }[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);


    /**
     * useEffect hook to initialize the game state and start the timer.
     * Shuffles questions and answers, resets the timer, and starts the interval.
     */
    useEffect(() => {
        if (fetchedQuestions.length === 0) return;
      
        // Shuffle questions and answers separately
        const shuffledQuestions = shuffleArray(fetchedQuestions.map(card => card.question));
        const shuffledAnswers = shuffleArray(fetchedQuestions.map(card => card.answer));
      
        setQuestions(shuffledQuestions);
        setAnswers(shuffledAnswers);
      
        // Reset timer
        setTimer(0);
        setIsGameComplete(false);
      
        // Start timer
        const id = setInterval(() => setTimer(prev => prev + 1), 1000);
        setIntervalId(id);
      
        return () => clearInterval(id);
      }, [fetchedQuestions]);
      
      // Stop timer when game is complete
      /**
       * useEffect hook to stop the timer when the game is complete.
       */
      useEffect(() => {
        if (isGameComplete && intervalId) {
          clearInterval(intervalId);
          setIntervalId(null);
        }
      }, [isGameComplete, intervalId]);

  // Handle card selection
  /**
   * Handles the selection of a card and checks for matches.
   * @param text - The text of the selected card.
   * @param type - The type of the card, either "question" or "answer".
   */
  const handleSelect = (text: string, type: "question" | "answer") => {
    if (matchedPairs.includes(text) || selectedCards.some(card => card.text === text)) return;

    const newSelection = [...selectedCards, { text, type }];
    setSelectedCards(newSelection);

    // Check for a match
    if (newSelection.length === 2) {
      const [first, second] = newSelection;

      // Find the original pair from API data
      const matchFound = fetchedQuestions.some(card =>
        (card.question === first.text && card.answer === second.text) ||
        (card.question === second.text && card.answer === first.text)
      );

      if (matchFound) {
        setMatchedPairs([...matchedPairs, first.text, second.text]);

        // Check if game is completed
        if (matchedPairs.length + 2 === fetchedQuestions.length * 2) {
          setIsGameComplete(true);
        }
      }
      setTimeout(() => setSelectedCards([]), 800);
    }
  };

    /**
     * useEffect hook to handle clicks outside the dropdown menu.
     */
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /**
     * Array of button data representing different quiz modes.
     */
    const btnData :Mode[] = ["learn" , "flashCard" , "normalQuiz"]


  return (
    <>
      <div className="flex w-full items-center justify-between mb-4">
            {/* Dropdown Menu */}
            <div ref={dropdownRef} className="relative mt-2 ml-2 inline-block text-left">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
              >
                Flashcards ⌄
              </button>
    
              {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <ul className="py-2">
                    {btnData.map((item:Mode) => (
                      <li key={item}>
                        <button className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100" onClick={() => newMode(item)}>
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
    
            {/* Flashcard Progress */}
            <div className="grid grid-cols-1">
            <div className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5" />
          <span className="text-lg">{timer}s</span>
        </div>
              <span className="text-lg text-center font-semibold mt-1">Finance Quiz 1</span>
            </div>
    
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={clearPDF}>
                ✖️
              </Button>
            </div>
          </div>
      {/* Header */}
      <div className="flex w-full items-center justify-between mb-4">
        <div className="grid grid-cols-1">
          <span className="text-lg text-center font-semibold mt-1">Finance Matching Quiz</span>
        </div>

        {/* Timer */}
       

        {/* Settings Button */}
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-gray-900 min-h-screen">
        {questions.map((text) => (
          <div
            key={text}
            onClick={() => handleSelect(text, "question")}
            className={`p-4 text-white text-center rounded-lg shadow-md cursor-pointer transition-all
              ${matchedPairs.includes(text) ? "opacity-50" : "bg-gray-700 hover:bg-gray-600"}
              ${selectedCards.some(card => card.text === text) ? "border-2 border-yellow-400" : ""}`}
          >
            {text}
          </div>
        ))}

        {answers.map((text) => (
          <div
            key={text}
            onClick={() => handleSelect(text, "answer")}
            className={`p-4 text-white text-center rounded-lg shadow-md cursor-pointer transition-all
              ${matchedPairs.includes(text) ? "opacity-50" : "bg-blue-700 hover:bg-blue-600"}
              ${selectedCards.some(card => card.text === text) ? "border-2 border-yellow-400" : ""}`}
          >
            {text}
          </div>
        ))}
      </div>

      {/* Win Message */}
      {isGameComplete && (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
    <div className="p-8 bg-gray-900 text-white rounded-lg shadow-lg text-center animate-fade-in">
      <h2 className="text-3xl font-bold mb-4 text-yellow-400">🎉 You Did It! 🎉</h2>
      <p className="text-lg">You finished the game in <strong>{timer} seconds</strong>!</p>
      <p className="text-sm text-gray-300 mt-2">Try again and beat your time!</p>
      
      <Button
        className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-all"
        onClick={() => {
          setQuestions(shuffleArray(fetchedQuestions.map(card => card.question)));
          setAnswers(shuffleArray(fetchedQuestions.map(card => card.answer)));
          setMatchedPairs([]);
          setTimer(0);
          setIsGameComplete(false);

          // Restart timer
          const id = setInterval(() => setTimer(prev => prev + 1), 1000);
          setIntervalId(id);
        }}
      >
        🔄 Play Again
      </Button>
    </div>
  </div>
)}
    </>
  );
};

export default MatchCardComponent;
