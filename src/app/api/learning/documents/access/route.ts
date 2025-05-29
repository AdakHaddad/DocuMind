// src/app/api/learning/documents/access/route.ts
import { NextRequest, NextResponse } from "next/server"; // Use NextRequest and NextResponse
import { connectToDatabase } from "@/src/lib/mongodb"; // Modify based on your db connection function
import { ObjectId } from "mongodb";

// Interface for the request body
interface AccessRequest {
  access: "public" | "private"; // Access type
}

// PATCH method for updating document access
export async function PATCH(req: NextRequest) {
  const { access }: AccessRequest = await req.json();
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");

  // Validate required fields
  if (!documentId || !access) {
    return NextResponse.json(
      { error: "Missing required fields: documentId or access" },
      { status: 400 }
    );
  }

  if (!["public", "private"].includes(access)) {
    return NextResponse.json(
      { error: "Access must be 'public' or 'private'" },
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

    // Update the document's access type
    const objectId = new ObjectId(documentId);
    const result = await documentsCollection.updateOne(
      { _id: objectId },
      { $set: { access } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Document not found or access already set" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Access updated successfully" });
  } catch (error) {
    console.error("Error updating document access:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
