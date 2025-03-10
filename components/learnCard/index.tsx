import React, { useEffect, useRef, useState } from "react";

/**
 * LearnCard Component
 * 
 * This component provides an interactive quiz interface for users to learn and test their knowledge.
 * It supports multiple modes and tracks user progress through a series of questions.
 */
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Settings, Lightbulb } from "lucide-react";


/**
 * Represents a single quiz question with multiple choice options.
 */
type Question = {
  question: string;
  options: string[];
  answer: "A" | "B" | "C" | "D"; // Answer is a letter
};

/**
 * Props for the LearnCard component, including questions, a function to clear the PDF, an optional title, and a mode switcher.
 */
type LearnProps = {
  questions: Question[];
  clearPDF: () => void;
  title?: string;
  newMode: (mode: Mode) => void; // Accept a mode parameter
};
type Mode = "learn" | "flashCard" | "match" | "normalQuiz";

/**
 * MatchCardComponent is a React component for displaying a matching quiz game.
 * @param questions - Array of questions and answers fetched from the API.
 * @param clearPDF - Function to clear the PDF data.
 * @param newMode - Function to change the quiz mode.
 * @returns A JSX element representing the matching quiz game.
 */
const LearnCard: React.FC<LearnProps> = ({ questions, clearPDF, title = "Quiz", newMode }) => {
  // Manages the open/close state of the dropdown menu
  const [isOpen, setIsOpen] = useState(false);

  // Tracks the index of the current question being displayed
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Tracks the index of the selected answer for the current question
  const [selected, setSelected] = useState<number | null>(null);

  // Tracks the user's progress through the quiz questions
  const [progress, setProgress] = useState(0);

  // Reference to detect clicks outside the dropdown menu to close it
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const totalQuestions = questions.length;

  if (totalQuestions === 0) {
    return <p className="text-white">No questions available.</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Map "A", "B", "C", "D" to 0, 1, 2, 3
  const answerToIndex: Record<Question["answer"], number> = { A: 0, B: 1, C: 2, D: 3 };
  const correctAnswerIndex = answerToIndex[currentQuestion.answer];

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

  /**
   * Handles the selection of an answer by the user.
   * Updates the progress if the correct answer is selected on the first attempt.
   * 
   * @param index - The index of the selected answer.
   */
  const handleSelect = (index: number): void => {
    if (selected === null) {
      // Increase progress only if correct answer is chosen first time
      if (index === correctAnswerIndex) {
        setProgress((prev) => Math.min(prev + 1, totalQuestions));
      }
    }
    setSelected(index);
  };

  /**
   * Moves to the next question in the quiz, resetting the selected answer.
   */
  const handleNext = (): void => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelected(null);
    }
  };


  
  // Array of available modes for the quiz, used in the dropdown menu
  const btnData: Mode[] = ["learn", "flashCard", "match", "normalQuiz"];

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
    <div className="bg-[#0D1B2A] min-h-screen flex flex-col items-center justify-center p-6 text-white">
      {/* Progress Bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <div className="text-sm">{progress}</div>
        <div className="w-full mx-2 bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress / totalQuestions) * 100}%` }}
          ></div>
        </div>
        <div className="text-sm">{totalQuestions}</div>
      </div>

      {/* Question Card */}
      <div className="bg-[#1B263B] p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-gray-300">{currentQuestion.question}</p>

        {/* Answer Choices - Grid on large screens, stacked on small screens */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left p-4 rounded-lg border transition ${
                selected !== null
                  ? index === correctAnswerIndex
                    ? "bg-green-600 border-green-400" // Correct answer styling
                    : selected === index
                    ? "bg-red-600 border-red-400" // Incorrect selected answer styling
                    : "border-gray-600"
                  : "border-gray-600 hover:bg-gray-700"
              }`}
              onClick={() => handleSelect(index)}
              disabled={selected !== null} // Disable buttons after selection
            >
              {index + 1}. {option}
            </button>
          ))}
        </div>

        {/* "Next Question" Button */}
{/* Show "Next Question" if not last question, otherwise show "Reset Quiz" */}
{selected !== null && (
  currentQuestionIndex < totalQuestions - 1 ? (
    <button
      className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-semibold rounded transition"
      onClick={handleNext}
    >
      Next Question
    </button>
  ) : (
    <button
      className="mt-6 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded transition"
      onClick={() => {
        setCurrentQuestionIndex(0);
        setSelected(null);
        setProgress(0);
      }}
    >
      🔄 Reset Quiz
    </button>
  )
)}



        {/* "Don't Know" Button */}
        <button className="mt-4 text-gray-400 hover:text-white transition">Don&rsquo;t know?</button>
      </div>
    </div>
    </>
  );
};

export default LearnCard;
