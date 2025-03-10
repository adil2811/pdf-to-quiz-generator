import { z } from "zod";

export const flashcardSchema = z.object({
  front: z.string().describe("The question, term, or prompt on the front of the flashcard."),
  back: z.string().describe("The answer or explanation on the back of the flashcard."),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

export const flashcardsSchema = z.array(flashcardSchema).min(4).describe("A set of flashcards.");
