// src/app/api/learning/flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { deepseekAsk, Messages } from "@/src/app/api/deepseekLogic";
import { SingleReport } from "../documents/route";
import { getSession } from "@/src/app/api/auth/session/route";
import { User } from "@/src/app/api/auth/[...nextauth]/route";

// Flashcard interface
interface Flashcard {
  question: string;
  answer: string;
}

// Interface for the request body
interface FlashcardRequest {
  documentId: string; // Document ID to create flashcards from
  count: number; // Number of flashcards to generate
  regeneratePrompt?: string;
}

// Define interfaces for type safety
interface FlashcardSet {
  _id?: ObjectId;
  documentId: string;
  flashcards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
}

// POST method for creating flashcards from a document
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = userSession as User;
    if (!user.slug) {
      return NextResponse.json(
        { error: "User profile incomplete" },
        { status: 400 }
      );
    }

    const { documentId, count, regeneratePrompt }: FlashcardRequest =
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

    // Verify document exists and user has access
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");
    const document = await documentsCollection.findOne({
      _id: new ObjectId(documentId)
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.owner !== user.slug && document.access !== "public") {
      return NextResponse.json(
        { error: "Access denied to this document" },
        { status: 403 }
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

    // If regeneratePrompt is provided, add it to the messages and add previous flashcards as context
    if (regeneratePrompt) {
      messages.push({
        role: "user",
        content: `Regenerate flashcards with the following prompt:\n\n${regeneratePrompt}`
      });

      // Fetch previous flashcards to provide context
      const flashcardsCollection = db.collection("flashcards");
      const previousFlashcards = await flashcardsCollection.findOne({
        documentId: new ObjectId(documentId)
      });

      if (previousFlashcards && previousFlashcards.flashcards) {
        messages.push({
          role: "user",
          content: `Here are the previous flashcards for context:\n\n${JSON.stringify(
            previousFlashcards.flashcards
          )}`
        });
      }
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

    const flashcardsCollection = db.collection("flashcards");

    // Check if flashcards already exist for this document
    const existingFlashcards = await flashcardsCollection.findOne({
      documentId
    });

    if (existingFlashcards) {
      // Update existing flashcards
      await flashcardsCollection.updateOne(
        { documentId },
        {
          $set: {
            flashcards,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: "Flashcards updated successfully",
        _id: existingFlashcards._id,
        documentId,
        flashcards,
        updatedAt: new Date()
      });
    } else {
      // Create new flashcard set
      const newFlashcardSet: FlashcardSet = {
        documentId,
        flashcards,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await flashcardsCollection.insertOne(newFlashcardSet);

      return NextResponse.json(
        {
          message: "Flashcards created successfully",
          _id: result.insertedId,
          ...newFlashcardSet
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating/updating flashcards:", error);
    return NextResponse.json(
      {
        error: "Failed to create/update flashcards",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve flashcards for a document
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docsId");

    if (!docId) {
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(docId)) {
      return NextResponse.json(
        { error: "Invalid document ID format" },
        { status: 400 }
      );
    }

    // Get user session
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const flashcardsCollection = db.collection("flashcards");

    // Find flashcards for the document
    const flashcardSet = await flashcardsCollection.findOne({
      documentId: docId
    });

    if (!flashcardSet) {
      return NextResponse.json(
        { error: "No flashcards found for this document" },
        { status: 404 }
      );
    }

    return NextResponse.json(flashcardSet);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update flashcards
export async function PUT(req: NextRequest) {
  try {
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const flashcardId = searchParams.get("id");

    if (!flashcardId || !ObjectId.isValid(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard set ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { flashcards } = body;

    if (!flashcards || !Array.isArray(flashcards)) {
      return NextResponse.json(
        { error: "Invalid flashcards data" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const flashcardsCollection = db.collection("flashcards");

    const result = await flashcardsCollection.updateOne(
      { _id: new ObjectId(flashcardId) },
      {
        $set: {
          flashcards,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Flashcard set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Flashcards updated successfully",
      _id: flashcardId,
      flashcards,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to update flashcards" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove flashcards
export async function DELETE(req: NextRequest) {
  try {
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const flashcardId = searchParams.get("id");

    if (!flashcardId || !ObjectId.isValid(flashcardId)) {
      return NextResponse.json(
        { error: "Invalid flashcard set ID" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const flashcardsCollection = db.collection("flashcards");

    const result = await flashcardsCollection.deleteOne({
      _id: new ObjectId(flashcardId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Flashcard set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Flashcards deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting flashcards:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcards" },
      { status: 500 }
    );
  }
}
