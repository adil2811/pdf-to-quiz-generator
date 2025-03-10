import { useState, useRef, useEffect } from "react";

/**
 * FlashcardComponent
 * 
 * This component renders a flashcard interface for users to study and review questions.
 * It allows users to flip through flashcards, view hints, and track their progress.
 */
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Settings, Lightbulb } from "lucide-react";
import { Flashcard } from "../../lib/schemas";

type Mode = "learn" | "flashCard" | "match" | "normalQuiz";

/**
 * Props for the FlashcardComponent, including questions, a function to clear the PDF, and a mode switcher.
 */
type FlashcardProps = {
  questions: Flashcard[];
  clearPDF: () => void;
  newMode: (mode: Mode) => void;
};
/**
 * MatchCardComponent is a React component for displaying a matching quiz game.
 * @param questions - Array of questions and answers fetched from the API.
 * @param clearPDF - Function to clear the PDF data.
 * @param newMode - Function to change the quiz mode.
 * @returns A JSX element representing the matching quiz game.
 */
const FlashcardComponent: React.FC<FlashcardProps> = ({ questions, clearPDF, newMode }) => {
  // Manages the open/close state of the dropdown menu
  const [isOpen, setIsOpen] = useState(false);

  // Tracks the index of the current flashcard being displayed
  const [currentIndex, setCurrentIndex] = useState(0);

  // Manages the flip state of the current flashcard
  const [isFlipped, setIsFlipped] = useState(false);

  // Manages the expansion state of the hint for the current flashcard
  const [expandHint, setExpandHint] = useState(false);

  // Indicates whether the flashcard session is complete
  const [isComplete, setIsComplete] = useState(false);

  // Tracks the time spent on the flashcard session
  const [timer, setTimer] = useState(0);

  // Stores the interval ID for the timer
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Reference to detect clicks outside the dropdown menu to close it
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const totalCards = questions.length;

  /**
   * Effect hook to start a timer when the component mounts and clear it when unmounting.
   */
  useEffect(() => {
    if (totalCards > 0) {
      const id = setInterval(() => setTimer((prev) => prev + 1), 1000);
      setIntervalId(id);
    }
    return () => clearInterval(intervalId!);
  }, [totalCards]);

  /**
   * Advances to the next flashcard, or marks the session as complete if at the end.
   */
  const handleNext = (): void => {
    if (currentIndex < totalCards - 1) {
      setExpandHint(false);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
      clearInterval(intervalId!);
    }
  };

  /**
   * Moves to the previous flashcard if not at the beginning.
   */
  const handlePrev = (): void => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  /**
   * Effect hook to close the dropdown menu when clicking outside of it.
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

  // Array of available modes for the quiz, used in the dropdown menu
  const btnData: Mode[] = ["learn", "flashCard", "match", "normalQuiz"];

  return (
    <>
      {isComplete ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
          <div className="p-8 bg-gray-900 rounded-lg shadow-lg text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">🎉 Quiz Completed! 🎉</h2>
            <p className="text-lg">Total Flashcards: {totalCards}</p>
            <p className="text-lg">Time Taken: {timer} seconds</p>
            <Button
              className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition-all"
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setExpandHint(false);
                setIsComplete(false);
                setTimer(0);
                const id = setInterval(() => setTimer((prev) => prev + 1), 1000);
                setIntervalId(id);
              }}
            >
              🔄 Restart
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex w-full items-center justify-between mb-4">
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
                    {btnData.map((item: Mode) => (
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
            <div className="grid grid-cols-1">
              <span className="text-sm text-center text-gray-400">{`${currentIndex + 1} / ${totalCards}`}</span>
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
          <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white p-4">
            {totalCards > 0 ? (
              <div className="relative w-full max-w-3xl h-96 perspective-[1000px]" onClick={() => setIsFlipped(!isFlipped)}>
                <div className={`flip-container ${isFlipped ? "flipped" : ""}`}>
                  <div className="card-front relative">
                    {questions[currentIndex].hint && (
                      <button
                        className="absolute top-3 left-3 flex items-center gap-2 text-gray-400 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); setExpandHint(prev => !prev); }}
                      >
                        <Lightbulb className="h-5 w-5" />
                        <span className="text-sm">{expandHint ? questions[currentIndex].hint : 'Hint'}</span>
                      </button>
                    )}
                    <p className="text-lg text-center">{questions[currentIndex].front}</p>
                  </div>
                  <div className="card-back">
                    <p className="text-lg text-center">{questions[currentIndex].back}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No flashcards available</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <Button variant="outline" size="icon" disabled={currentIndex === 0} onClick={handlePrev}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" disabled={currentIndex === totalCards - 1} onClick={handleNext}>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FlashcardComponent;
