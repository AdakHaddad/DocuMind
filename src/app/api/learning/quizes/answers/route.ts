// src/app/api/learning/quizes/answers/route.ts

import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Quiz } from "@/src/app/api/learning/quizes/route";
import { deepseekAsk } from "@/src/app/api/deepseekLogic";

// Quiz interface
type QuizType = "multiple" | "essay";

interface AnswerRequest {
  quizesId: string;
  quizType: QuizType;
  answers: string[];
}

interface Result {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export async function POST(req: NextRequest) {
  const { quizesId, quizType, answers }: AnswerRequest = await req.json();

  // Validate required fields
  if (!quizesId || !quizType || !answers) {
    return NextResponse.json(
      {
        error:
          "Missing required field: " +
          (!quizesId ? "quizesId" : "") +
          (!quizType ? "quizType" : "") +
          (!answers ? "answers" : "")
      },
      { status: 400 }
    );
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(quizesId)) {
    return NextResponse.json(
      { error: "Invalid quizes ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const quizesCollection = db.collection("quizes");

    // Fetch the quizes by ID
    const objectId = new ObjectId(quizesId);
    const quizes = await quizesCollection.findOne({ _id: objectId });

    if (!quizes) {
      return NextResponse.json({ error: "Quizes not found" }, { status: 404 });
    }

    if (quizType !== "multiple" && quizType !== "essay") {
      return NextResponse.json(
        { error: "Invalid quiz type. Must be 'multiple' or 'essay'" },
        { status: 400 }
      );
    }

    if (answers.length !== quizes.quizes.length) {
      return NextResponse.json(
        { error: "Answers length does not match quizes length" },
        { status: 400 }
      );
    }

    // Review the answers by providing the question, the user's answer, the correct answer, the explanation, and the boolean correct/not for both multiple and essay

    if (quizType === "multiple") {
      const results: Result[] = quizes.quizes.map(
        (quiz: Quiz, index: number) => {
          const userAnswer = answers[index];
          const isCorrect = userAnswer === quiz.answer;
          return {
            question: quiz.question,
            userAnswer,
            correctAnswer: quiz.answer,
            isCorrect
          } as Result;
        }
      );

      // Create a single message for DeepSeek with all questions and answers
      const content = results
        .map(
          (result) => `
    Question: ${result.question}
    Your answer: ${result.userAnswer}
    Correct answer: ${result.correctAnswer}
  `
        )
        .join("\n\n");

      const message = {
        role: "user",
        content: `
      Please provide explanations for the following questions and answers:\n\n${content.trim()}\n\n
      Return the explanations line by line, corresponding to each question and answer.
      e.g.
      [explanation text for question 1]
      [explanation text for question 2]
      [explanation text for question 3]
      ...
      Just return the explanations in given order, do not include any additional text. Make it short but comprehensive. Max three sentences per explanation.
      `
      };

      // Ask DeepSeek for explanations
      const explanation = await deepseekAsk([message]);

      // Assign explanations to results
      if (explanation && explanation.content) {
        const explanationLines = explanation.content.split("\n"); // Assuming explanations are returned line by line
        explanationLines.forEach((explanationText: string, index: number) => {
          if (results[index]) {
            results[index].explanation = explanationText.trim();
          }
        });
      } else {
        results.forEach((result) => {
          result.explanation = "No explanation provided.";
        });
      }

      return NextResponse.json(results, { status: 200 });
    } else if (quizType === "essay") {
      // For essay type, we will ask DeepSeek to evaluate the essay answers but still return correct / incorrect
      const results: Result[] = quizes.quizes.map(
        (quiz: Quiz, index: number) => {
          const userAnswer = answers[index];
          return {
            question: quiz.question,
            userAnswer,
            correctAnswer: quiz.answer, // Assuming the answer is the expected content for essay
            isCorrect: false, // Will be determined by DeepSeek
            explanation: ""
          } as Result;
        }
      );
      // Create a single message for DeepSeek with all questions and answers
      const content = results
        .map(
          (result) => `
    Question: ${result.question}
    Your answer: ${result.userAnswer}
    Correct answer: ${result.correctAnswer}
  `
        )
        .join("\n\n");
      const message = {
        role: "user",
        content: `
      Please evaluate the following essay answers:\n\n${content.trim()}\n\n
      Provide a short evaluation for each answer, indicating if it is correct or not, and provide a brief explanation.
      Return the evaluations line by line, corresponding to each question and answer.
      e.g.
      Correct. (evaluation text for question 1)
      Incorrect. (evaluation text for question 2)
      Correct. (evaluation text for question 3)
      ...
      Just return the evaluations in given order, do not include any additional text. Make it short but comprehensive. Max three sentences per evaluation.
      `
      };
      // Ask DeepSeek for evaluations
      const evaluation = await deepseekAsk([message]);

      // Assign evaluations to results
      if (evaluation && evaluation.content) {
        const evaluationLines = evaluation.content.split("\n"); // Assuming evaluations are returned line by line
        evaluationLines.forEach((evaluationText: string, index: number) => {
          if (results[index]) {
            results[index].isCorrect = !evaluationText.startsWith("Incorrect");
            results[index].explanation = evaluationText.trim();
          }
        });
      } else {
        results.forEach((result) => {
          result.isCorrect = false;
          result.explanation = "No evaluation provided.";
        });
      }
      return NextResponse.json(results, { status: 200 });
    }
  } catch (error) {
    console.error("Error processing quiz answers:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
