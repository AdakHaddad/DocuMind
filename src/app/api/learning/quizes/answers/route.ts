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

// GET method for getting an existing answer session by quizesId
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quizesId = searchParams.get("quizesId");

  if (!quizesId) {
    return NextResponse.json(
      { error: "Missing required field: quizesId" },
      { status: 400 }
    );
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(quizesId)) {
    return NextResponse.json(
      { error: "Invalid answers ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const answersCollection = db.collection("answers");

    // Check if answers already exist for the given quizesId
    const existingAnswers = await answersCollection.findOne({
      quizesId: quizesId
    });

    if (!existingAnswers) {
      return NextResponse.json(
        { error: "Answers not found for the given quizesId" },
        { status: 404 }
      );
    }

    return NextResponse.json(existingAnswers, { status: 200 });
  } catch (error) {
    console.error("Error fetching answers:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH method for updating an existing answer session with a new attempt
export async function PATCH(req: NextRequest) {
  const { quizesId } = await req.json();
  if (!quizesId) {
    return NextResponse.json(
      { error: "Missing required field: quizesId" },
      { status: 400 }
    );
  }
  // Validate ObjectId format
  if (!ObjectId.isValid(quizesId)) {
    return NextResponse.json(
      { error: "Invalid answers ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const answersCollection = db.collection("answers");

    // Check if answers already exist for the given quizesId
    const existingAnswers = await answersCollection.findOne({
      quizesId: quizesId
    });

    // Create a new answers document
    const newAttempt = {
      correct: null,
      incorrect: null,
      accuracy: null,
      timeSpent: null,
      timeStart: new Date(),
      timeEnd: null // Will be updated when the user finishes the quiz
    };

    if (!existingAnswers) {
      const newAnswers = {
        quizesId: quizesId,
        attempts: [newAttempt],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert the new answers document
      const result = await answersCollection.insertOne(newAnswers);
      if (!result) {
        return NextResponse.json(
          { error: "Failed to create new answers session" },
          { status: 500 }
        );
      }
      // Return the new answers ID
      return NextResponse.json({ newAnswers }, { status: 201 });
    }

    // Check if previous attempts not yet done by checking the timeEnd
    const lastAttempt = existingAnswers.attempts?.slice(-1)[0];
    if (lastAttempt && !lastAttempt.timeEnd) {
      return NextResponse.json(
        { error: "Previous attempt is still in progress" },
        { status: 400 }
      );
    }

    // Get previous attempts to check if there are any
    const previousAttempts = existingAnswers.attempts || [];

    // Update the existing answers document with a new attempt
    const updatedAnswers = {
      ...existingAnswers,
      attempts: [...previousAttempts, newAttempt],
      updatedAt: new Date()
    };

    // Insert the new answers document
    const result = await answersCollection.updateOne(
      { quizesId: quizesId },
      { $set: updatedAnswers }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to update answers session" },
        { status: 500 }
      );
    }

    // Return the new answers ID
    return NextResponse.json({ updatedAnswers }, { status: 201 });
  } catch (error) {
    console.error("Error fetching answers:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST method for submitting quiz answers
export async function POST(req: NextRequest) {
  const timeEnd = new Date();
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

    // Update the answers document with the results
    const answersCollection = db.collection("answers");

    // Find the existing answers document by quizesId
    const existingAnswers = await answersCollection.findOne({
      quizesId: quizesId
    });
    if (!existingAnswers) {
      return NextResponse.json(
        { error: "Answers not provided for the given quizesId" },
        { status: 404 }
      );
    }

    // Get latest attempt
    const latestAttempt = existingAnswers.attempts?.slice(-1)[0];
    if (!latestAttempt) {
      return NextResponse.json(
        { error: "No previous attempt found" },
        { status: 404 }
      );
    }

    // if latest attempt is already completed by the existence of timeEnd, then reject
    if (latestAttempt.timeEnd) {
      return NextResponse.json(
        { error: "Previous attempt is already completed" },
        { status: 400 }
      );
    }

    const timeStart = new Date(latestAttempt.timeStart);
    // count timeSpent from timeEnd to timeStart
    const timeSpent = (timeEnd.getTime() - timeStart.getTime()) / 1000; // Time spent in seconds

    // Review the answers by providing the question, the user's answer, the correct answer, the explanation, and the boolean correct/not for both multiple and essay
    let results: Result[] = [];
    if (quizType === "multiple") {
      results = quizes.quizes.map((quiz: Quiz, index: number) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer === quiz.answer;
        return {
          question: quiz.question,
          userAnswer,
          correctAnswer: quiz.answer,
          isCorrect
        } as Result;
      });

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
    } else if (quizType === "essay") {
      // For essay type, we will ask DeepSeek to evaluate the essay answers but still return correct / incorrect
      results = quizes.quizes.map((quiz: Quiz, index: number) => {
        const userAnswer = answers[index];
        return {
          question: quiz.question,
          userAnswer,
          correctAnswer: quiz.answer, // Assuming the answer is the expected content for essay
          isCorrect: false, // Will be determined by DeepSeek
          explanation: ""
        } as Result;
      });
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
    } else {
      return NextResponse.json(
        { error: "Invalid quiz type. Must be 'multiple' or 'essay'" },
        { status: 400 }
      );
    }

    // Count correct and incorrect answers
    const correctCount = results.filter((result) => result.isCorrect).length;
    const incorrectCount = results.length - correctCount;
    // Calculate accuracy
    const accuracy = (correctCount / results.length) * 100;
    const updatedAttempt = {
      correct: correctCount,
      incorrect: incorrectCount,
      accuracy: accuracy.toFixed(2),
      timeSpent: timeSpent.toFixed(2),
      timeStart: timeStart,
      timeEnd: timeEnd
    };

    // Previous attempts
    const previousAttempts = existingAnswers.attempts.slice(0, -1) || [];

    await answersCollection.updateOne(
      { quizesId: quizesId },
      {
        $set: {
          attempts: [...previousAttempts, updatedAttempt],
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      {
        results,
        statistics: updatedAttempt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing quiz answers:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
