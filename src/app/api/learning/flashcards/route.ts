// src/app/api/learning/flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { deepseekAsk, Messages } from "@/src/app/api/deepseekLogic";
import { SingleReport } from "../documents/route";

// Flashcard interface
interface Flashcard {
  question: string;
  answer: string;
}

// Interface for the request body
interface FlashcardRequest {
  documentId: string; // Document ID to create flashcards from
  count: number; // Number of flashcards to generate
}

// POST method for creating flashcards from a document
export async function POST(req: NextRequest) {
  const { documentId, count }: FlashcardRequest = await req.json();

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

    // Make the message and command for flashcard generation
    const messages: Messages = [
      {
        role: "user",
        content: `Please generate ${count} flashcards from the following document content:\n\n${documentContent}\n\nEach flashcard should be an object with 'question' and 'answer' fields, e.g., { question: 'What is X?', answer: 'X is ...' }. Return the flashcards in JSON format only, without any additional text. Generate exactly ${count} flashcards; if that's not possible, return as many as you can using the most important information from the document. Please respond in English.`
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

    // Call deepseekAsk to get the flashcards
    const response = await deepseekAsk(messages);

    if (!response || !response.content) {
      return NextResponse.json(
        { error: "Deepseek response is invalid or missing content" },
        { status: 500 }
      );
    }

    const flashcards: Flashcard[] = JSON.parse(
      response.content.replace(/```json|```/g, "").trim()
    );

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards generated" },
        { status: 500 }
      );
    }

    // Add flashcards object into the collection as a single object
    const flashcardsCollection = db.collection("flashcards");
    const flashcardObject = {
      documentId: objectId,
      flashcards: flashcards,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the flashcards into the database
    const result = await flashcardsCollection.insertOne(flashcardObject);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to create flashcards" },
        { status: 500 }
      );
    }

    // Remove the previous flashcards if they exist (remove all with the same documentId but different _id)
    await flashcardsCollection.deleteMany({
      documentId: objectId,
      _id: { $ne: result.insertedId }
    });

    // Respond with the generated flashcards
    return NextResponse.json(flashcards, { status: 200 });
  } catch (error) {
    console.error("Error creating flashcards:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
