// Importing required schemas for different quiz/game modes
import { 
  questionSchema, questionsSchema, 
  matchCardSchema, matchCardsSchema,
  flashcardSchema, flashcardsSchema
} from "@/lib/schemas";

// Importing AI model and streaming utilities
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

/*
  This API route is dynamic, making it scalable and maintainable.
  The same logic is used for different quiz/game modes, reducing redundancy.
*/

// Setting maximum allowed request duration
export const maxDuration = 60;

// Defining the different modes available for quiz/game generation
type Mode = "learn" | "flashCard" | "match" | "normalQuiz";

// Configuration for each mode, mapping to system prompts, user prompts, and response schemas
const modeConfig: Record<
  Mode, 
  { systemPrompt: string; userPrompt: string; schema: any; schemaArray: any }
> = {
  learn: {
    systemPrompt: 
      "You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length.",
    userPrompt: "Create a multiple choice test based on this document.",
    schema: questionSchema,
    schemaArray: questionsSchema,
  },
  flashCard: {
    systemPrompt: 
      "You are a teacher. Your job is to take a document and create exactly 4 flashcards based on its content, each with a question on the front, a clear and concise answer on the back, and a hint. Keep the questions concise and the answers clear.",    
    userPrompt: "Extract key facts and create flashcards from this document.",
    schema: flashcardSchema,
    schemaArray: flashcardsSchema,
  },
  match: {
    systemPrompt: 
      "You are an AI that extracts question-answer pairs for a matching game. Given a document, extract only 4 unique questions and their correct answers. Ensure the questions and answers are concise and logically paired.",
    userPrompt: "Generate a matching pairs game based on this document.",
    schema: matchCardSchema,
    schemaArray: matchCardsSchema,
  },
  normalQuiz: {
    systemPrompt: 
      "You are a teacher. Your job is to take a document, and create a multiple choice test (with 4 questions) based on the content of the document. Each option should be roughly equal in length.",
    userPrompt: "Create a multiple choice test based on this document.",
    schema: questionSchema,
    schemaArray: questionsSchema,
  },
};

// Handling HTTP POST requests
export async function POST(req: Request) {
  // Extracting request body (files and mode)
  const { files, mode } = await req.json();
  console.log('mode::: ', mode);

  // Checking if files are provided
  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: "No files provided" }), { status: 400 });
  }

  const firstFile = files[0].data;

  // Validating the selected mode
  if (!(mode in modeConfig)) {
    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400 });
  }

  // Extracting corresponding mode settings
  const { systemPrompt, userPrompt, schema, schemaArray } = modeConfig[mode as Mode];

  // Logging extracted settings (useful for debugging)
  console.log('schemaArray::: ', schemaArray);
  console.log('userPrompt::: ', userPrompt);
  console.log('systemPrompt::: ', systemPrompt);

  // Sending request to AI model and streaming response
  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userPrompt,
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf", // Ensuring correct file format is specified
          },
        ],
      },
    ],
    schema: schema, // Defining expected schema for individual response objects
    output: "array", // Expecting an array of responses
    onFinish: ({ object }) => {
      console.log('object::: ', object);

      // Validating response data against schema
      const res = schemaArray.safeParse(object);
      if (!res.success) {
        throw new Error(res.error.errors.map((e: { message: any; }) => e.message).join("\n"));
      }
    },
  });

  // Returning the AI-generated response as a text stream
  return result.toTextStreamResponse();
}
