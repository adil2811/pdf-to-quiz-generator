import { z } from "zod";

export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths.",
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on.",
    ),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(4);


// This schema is used for flash schema



export const flashcardSchema = z.object({
  front: z.string().describe("The question, term, or prompt on the front of the flashcard."),
  back: z.string().describe("The answer or explanation on the back of the flashcard."),
  hint: z.string().optional().describe("A hint to help answer the flashcard."),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const flashcardsSchema = z.array(flashcardSchema).length(4).describe("A set of flashcards.");
// match Card


export const matchCardSchema = z.object({
  question: z.string().describe("A question or prompt that needs to be matched."),
  answer: z.string().describe("The corresponding correct answer to the question."),
});

export type MatchCard = z.infer<typeof matchCardSchema>;

export const matchCardsSchema = z
  .array(matchCardSchema)
  .length(4)
  .describe("A set of match cards with questions and their correct answers.");


