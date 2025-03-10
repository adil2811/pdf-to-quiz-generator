"use client";

// This file is the main page component for the PDF Quiz Generator application.

import { JSX, useEffect, useState } from "react"; // Importing necessary hooks and types from React
import { experimental_useObject } from "ai/react"; // Importing experimental hook for object state management
import { questionsSchema,flashcardsSchema, matchCardsSchema } from "@/lib/schemas"; // Importing schemas for different quiz modes
import { z } from "zod"; // Importing Zod for schema validation
import { toast } from "sonner"; // Importing toast for notifications
import { FileUp, Plus, Loader2 } from "lucide-react"; // Importing icons from lucide-react
import { Button } from "@/components/ui/button"; // Importing Button component
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";//process Ui
import Quiz from "@/components/quiz";
import { Link } from "@/components/ui/link";
import NextLink from "next/link";
import { generateQuizTitle } from "./actions";//generateQuizTitle for title generation
import { AnimatePresence, motion } from "framer-motion";
import { VercelIcon, GitIcon } from "@/components/icons";
import FlashcardComponent from "@/components/flashCard";
import MatchCardComponent from "@/components/matchCard";
import LearnCard from "@/components/learnCard";

//all time of modes 
type Mode = "learn" | "flashCard" | "match" | "normalQuiz";


//intializing schema zccording to modes
const modeSchemas: Record<Mode, z.ZodType<any>> = {
  learn: questionsSchema, 
  flashCard: flashcardsSchema, 
  match: matchCardsSchema, 
  normalQuiz: questionsSchema, 
};

type QuizMode = {
  icon: JSX.Element;
  label: Mode;
};


/**
 * Main component for the PDF Quiz Generator page.
 * Manages state and behavior for file uploads, mode changes, and quiz generation.
 */
export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);//picked file
  const [questions, setQuestions] = useState<
  z.infer<typeof questionsSchema> | z.infer<typeof flashcardsSchema>
>([]);//response will be store in question
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState<string>();//Ai generetared title will be store here
  const [activeMode, setActiveMode] = useState<Mode>("normalQuiz");//which mode is active will show here
  const [tempEncodedFile,setTempEncodedFile] = useState<any>()//store the upload file encoded v-- here
  console.log('tempEncodedFile::: ', tempEncodedFile);

//making request to llm using useObject
/**
   * Handles the selection of an answer by the user.
   * Updates the progress if the correct answer is selected on the first attempt.
   * 
   * @param sumbit - action button takes file --- &&----mode
   * @param object -The current value for the generated object. Updated as the API streams JSON chunks.
    @param  schema --- sending scheema dynamiclly based on which mode is selected
    @returns question ---- all list of questions according to the mode
   */
  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: modeSchemas[activeMode], // Dynamically select schema
    initialValue: undefined,
    onError: (error) => {
      console.log('error::: ', error);
      toast.error("Failed to generate quiz. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      console.log('object::: ', object);
      if(object === undefined){

        toast.error("Failed to generate quiz. Please try again.");
      }

      setQuestions(object ?? []);
    },
  });


// quiz mode shows all the mods
    const modes :QuizMode[] = [
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 4.5v15m12-15v15M3 9h18m-18 6h18"
            />
          </svg>
        ),
        label: "flashCard",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75v10.5m6-10.5v10.5m-12-10.5v10.5M3 9h18M3 15h18"
            />
          </svg>
        ),
        label: "learn",
      },
    
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v18m9-9H3"
            />
          </svg>
        ),
        label: "normalQuiz",
      },
      {
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 8.25h13.5m-13.5 4.5h13.5m-13.5 4.5h13.5"
            />
          </svg>
        ),
        label: "match",
      },
    ];
  
  
//handleFileChange function takes the file
  /**
   * Handles file input changes, validates files, and updates state with valid PDFs.
   * Checks for Safari's lack of drag-and-drop support.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //no drag and drop facility in the safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // show error if user try drag and drop
    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker.",
      );
      return;
    }
    // select file 
    const selectedFiles = Array.from(e.target.files || []);
    // validate file
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    );
// valide if length is good
    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.");
    }
    // set the files
    setFiles(validFiles);
    toast.success("sucessfully submit file")
  };
//enoding file while updating
  /**
   * Encodes a file as a Base64 string for transmission.
   * Uses FileReader to read and encode the file.
   */
  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
//handleSubmitWithFiles file to the 
  /**
   * Submits selected files for quiz generation, encodes them, and updates the title.
   * Encodes files before submission and handles API response.
   */
  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // enoded bedore giving it to ll,
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );
    // temperory store the ecodedFiles so that we can it while chaning mode in the child component
    setTempEncodedFile(encodedFiles)

    // sumbit to the llm
    if (["learn", "match", "normalQuiz", "flashCard"].includes(activeMode)) {
      submit({ files: encodedFiles,
        mode:activeMode

       });
    }
    // generate the title for the quiz
    const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
    console.log('generatedTitle::: ', generatedTitle);
    setTitle(generatedTitle);
  };

  /**
   * Clears the current files and questions from the state.
   */
  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
  };

  const progress = partialQuestions ? (partialQuestions.length / 4) * 100 : 0;
  
  // handleModeChange functionm
  /**
   * Changes the active quiz mode.
   * Updates state if the mode is different from the current one.
   */
  const handleModeChange = (mode: Mode) => {
    if (activeMode !== mode) {
      setActiveMode(mode);
    }
  };
  /**
   * Changes the quiz mode and re-submits files if necessary.
   * Handles conditions for re-submission.
   */
  const ChangeMode = (mode: Mode) => {
    console.log('Selected Mode:', mode);
    setQuestions([])
    setFiles([])
    if (!tempEncodedFile || tempEncodedFile.length === 0) {
      toast.error("No files found. Please upload a PDF first.");
      return;
    }
  
    // Set the new mode first
    setActiveMode(mode);
  };
  
  /**
   * Handles side effects related to mode changes.
   * Submits data when activeMode changes.
   */
  useEffect(() => {
    if (!activeMode || !tempEncodedFile || tempEncodedFile.length === 0) return;
  
    console.log('activeMode updated:', activeMode);
    console.log('Schema for new mode:', modeSchemas[activeMode]);
  
    // Clear questions before submitting to avoid conflicts
    setQuestions([]);
  
    submit({
      files: tempEncodedFile,
      mode: activeMode,
    });
  }, [activeMode]); // Dependency on activeMode

  
  /*
    --- if statement sees if the length of quenstions recived from llm is 4
    ---- && shows component based on whihc activemode is selected
  */

  if (questions.length === 4 && activeMode === 'normalQuiz') {
    return (
      <Quiz title={title ?? "Quiz"}
      questions={questions as z.infer<typeof questionsSchema>}
       clearPDF={clearPDF} />
    );
  }
  if (questions.length === 4 && activeMode === 'flashCard') {
    return (
      <FlashcardComponent 
      questions={questions as z.infer<typeof flashcardsSchema>}
      clearPDF={clearPDF}
      newMode={ChangeMode} />
    );
  }
  if (questions.length === 4 && activeMode === 'match') {
    return (
      <MatchCardComponent 
      questions={questions as z.infer<typeof matchCardsSchema>}
      clearPDF={clearPDF}
      newMode={ChangeMode} />
    );
  }
  if (questions.length === 4 && activeMode === 'learn') {
    return (
      <LearnCard title={title ?? "Quiz"}
      questions={questions as z.infer<typeof questionsSchema>}
       clearPDF={clearPDF}
       newMode={ChangeMode} />
      );
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(PDFs only)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
   
      <Card className="w-full max-w-md h-full border-0 sm:border sm:h-fit mt-12">
      <CardHeader className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
          Selecte a category          
        </div>
      
      </CardHeader>
      {/* all modes user can choose */}
      <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-xl">
      {modes.map(({ icon, label }) => (
        <Button
          key={label}
          variant="outline"
          className={`flex justify-between w-full px-4 py-3 ${activeMode === label ? 'bg-blue-800 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}  text-white `}
          onClick={() => handleModeChange(label)}

        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </div>
       
        </Button>
      ))}
    </div>
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              PDF Quiz Generator
            </CardTitle>
            <CardDescription className="text-base">
              Upload a PDF to generate an interactive quiz based on its content
              using the <Link href="https://sdk.vercel.ai">AI SDK</Link> and{" "}
              <Link href="https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai">
                Google&apos;s Gemini Pro
              </Link>
              .
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Drop your PDF here or click to browse.</span>
                )}
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Quiz...</span>
                </span>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {partialQuestions
                    ? `Generating question ${partialQuestions.length + 1} of 4`
                    : "Analyzing PDF content"}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    
    </div>
  );
}
