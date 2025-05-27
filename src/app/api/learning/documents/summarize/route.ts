// src/app/api/learning/documents/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { deepseekAsk } from "@/src/app/api/deepseekLogic";

// PATCH given document id, update the document with a summary from deepseek
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("id");

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

    // Make the message and command
    const messages = [
      {
        role: "user",
        content: `Please summarize the following document content:\n\n${documentContent}\n\nUnderstand your limitations and respond quickly by using your resources efficiently. Do not repeat the content of the document; just provide a summary. Please respond in English.`
      }
    ];

    // Call deepseekAsk to get the summary
    const summary = await deepseekAsk(messages);

    // Update the document with the summary
    await documentsCollection.updateOne(
      { _id: objectId },
      { $set: { summary: summary.content, updatedAt: new Date() } }
    );

    return NextResponse.json(
      { message: "Document summarized successfully", summary: summary.content },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error summarizing document:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
