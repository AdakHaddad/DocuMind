// src/app/api/learning/quizes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { deepseekAsk, Messages } from "@/src/app/api/deepseekLogic";
import { SingleReport } from "../documents/route";

export interface Quiz {
  question: string;
  option: string[]; // Multiple choice options
  answer: string; // Correct answer
}

// Interface for the request body
interface QuizesRequest {
  documentId: string; // Document ID to create quizes from
  count: number; // Number of quizes to generate
  regeneratePrompt?: string; // Optional prompt for regeneration
}

// POST method for creating quizes from a document
export async function POST(req: NextRequest) {
  const { documentId, count, regeneratePrompt }: QuizesRequest =
    await req.json();

  // Validate required fields
  if (!documentId || !count) {
    return NextResponse.json(
      {
        error:
          "Missing required field: " +
          (!documentId ? "documentId" : "") +
          (!count ? "count" : "")
      },
      { status: 400 }
    );
  }

  if (typeof count !== "number" || count <= 0) {
    return NextResponse.json(
      { error: "Count must be a positive number" },
      { status: 400 }
    );
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(documentId)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    // Fetch the document by ID
    const objectId = new ObjectId(documentId);
    const document = await documentsCollection.findOne({ _id: objectId });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get the content of the document
    const documentContent = document.content || "";
    if (!documentContent) {
      return NextResponse.json(
        { error: "Document content is empty" },
        { status: 400 }
      );
    }

    // Get the reports of the document
    const reports: SingleReport[] = document.reports || [];

    // Make the message and command for quiz generation
    const messages: Messages = [
      {
        role: "user",
        content: `
    Task: Generate ${count} quizzes from the following document content:\n\n${documentContent}

    Each quiz should be an object with a 'question' and five 'answer' options. For example:
    {
      question: 'What is X?',
      options: ['A something', 'B spectacular', 'C riously', 'D finitive', 'E maxing'],
      answer: 'A something'
    }

    Please return the quizzes in JSON format only. If you cannot generate ${count} quizzes, return as many as you can. Focus on the most important information from the document to ensure accurate and efficient responses.
    `
      }
    ];

    // Add reports to messages if they exist
    if (reports.length > 0) {
      messages.push({
        role: "user",
        content: `Consider the following reports you should evaluate:\n\n${reports
          .map((report) => `- ${report.question}: ${report.report}`)
          .join("\n")}`
      });
    }

    // If regeneratePrompt is provided, add it to the messages and add previous quizes as context
    if (regeneratePrompt) {
      messages.push({
        role: "user",
        content: `Regenerate the quizes with the following prompt:\n\n${regeneratePrompt}`
      });

      // Add previous quizes as context
      const quizesCollection = db.collection("quizes");
      const previousQuizes = await quizesCollection.findOne({
        documentId: objectId
      });

      if (previousQuizes && previousQuizes.quizes) {
        messages.push({
          role: "user",
          content: `Previous quizes for context:\n\n${JSON.stringify(
            previousQuizes.quizes
          )}`
        });
      }
    }

    // Call deepseekAsk to get the quizes
    const response = await deepseekAsk(messages);

    if (!response || !response.content) {
      return NextResponse.json(
        { error: "Deepseek response is invalid or missing content" },
        { status: 500 }
      );
    }

    const quizes: Quiz[] = JSON.parse(
      response.content.replace(/```json|```/g, "").trim()
    );

    if (!Array.isArray(quizes) || quizes.length === 0) {
      return NextResponse.json(
        { error: "No quizes generated" },
        { status: 500 }
      );
    }

    // Add quizes object into the collection as a single object
    const quizesCollection = db.collection("quizes");
    const quizObject = {
      documentId: objectId,
      quizes: quizes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the quizes into the database
    const result = await quizesCollection.insertOne(quizObject);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to create quizes" },
        { status: 500 }
      );
    }

    // Remove the previous quizes if they exist (remove all with the same documentId but different _id)
    await quizesCollection.deleteMany({
      documentId: objectId,
      _id: { $ne: result.insertedId }
    });

    // Respond with the generated quizes
    return NextResponse.json(quizes, { status: 200 });
  } catch (error) {
    console.error("Error creating quizes:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET quizes by document ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("docsId");

  // Validate required fields
  if (!documentId) {
    return NextResponse.json(
      { error: "Missing required field: documentId" },
      { status: 400 }
    );
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(documentId)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const quizesCollection = db.collection("quizes");

    // Fetch the quizes by document ID
    const objectId = new ObjectId(documentId);
    const quizes = await quizesCollection.findOne({ documentId: objectId });

    if (!quizes) {
      return NextResponse.json({ error: "Quizes not found" }, { status: 404 });
    }

    // Respond with the found quizes
    return NextResponse.json(quizes, { status: 200 });
  } catch (error) {
    console.error("Error fetching quizes:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
