// src/app/api/learning/documents/route.ts
import { NextRequest, NextResponse } from "next/server"; // Use NextRequest and NextResponse
import { connectToDatabase } from "@/src/lib/mongodb"; // Modify based on your db connection function
import { ObjectId } from "mongodb";

// Define an interface for the request body
interface DocumentRequest {
  title: string;
  content: string;
}

export interface SingleReport {
  question: string;
  report: string;
}

interface DocumentObject {
  title: string;
  slug: string; // Unique slug for the document
  content: string;
  summary: string;
  access: "public" | "private";
  reports: SingleReport[];
  createdAt?: Date; // Optional timestamp field
  updatedAt?: Date; // Optional timestamp field
}

// POST method for creating a new document
export async function POST(req: NextRequest) {
  const { title, content }: DocumentRequest = await req.json();

  // Validate required fields
  if (!title || !content) {
    return NextResponse.json(
      { error: "Missing required fields: title and content" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    // Slugify title
    let slugifiedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let existingSlug = true;
    while (existingSlug) {
      // Find if slugifiedUsername already exists
      const docWithSlug = await documentsCollection.findOne({
        slug: slugifiedTitle
      });

      if (!docWithSlug) {
        existingSlug = false; // Slug is unique, exit loop
      } else {
        // Cut off the last part of the slug if it exists
        slugifiedTitle = slugifiedTitle.replace(/-\d+$/, "");

        // If slug exists, append a number to make it unique
        const randomSuffix = Math.floor(Math.random() * 1000);
        slugifiedTitle = `${slugifiedTitle}-${randomSuffix}`;
      }
    }

    // Create new document object
    const newDocument: DocumentObject = {
      title,
      slug: slugifiedTitle,
      content,
      summary: "",
      access: "private", // Default access type
      reports: [], // Initialize with an empty array
      createdAt: new Date(), // Optional: add a timestamp
      updatedAt: new Date() // Optional: add a timestamp
    };

    // Insert the new document into the database
    const result = await documentsCollection.insertOne(newDocument);

    // Respond with success
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...newDocument
      } as DocumentObject,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET All / by Id if query params exist
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id && !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    if (id) {
      // Fetch document by ID
      const document = await documentsCollection.findOne({
        _id: new ObjectId(id)
      });
      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(document, { status: 200 });
    } else {
      // Fetch all documents
      const documents = await documentsCollection.find({}).toArray();
      return NextResponse.json(documents, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE method for deleting a document by ID
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 400 }
    );
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    // Delete the document by ID
    const result = await documentsCollection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH for rename title
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required field: id" },
      { status: 400 }
    );
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  const { title }: Partial<DocumentRequest> = await req.json();

  if (!title) {
    return NextResponse.json(
      { error: "Missing required field: title" },
      { status: 400 }
    );
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    // Reject if title is the same as current
    const existingDocument = await documentsCollection.findOne({
      _id: new ObjectId(id)
    });
    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    if (existingDocument.title === title) {
      return NextResponse.json(
        { error: "Title is the same as current" },
        { status: 400 }
      );
    }

    // Generate the slug
    let slugifiedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let existingSlug = true;
    while (existingSlug) {
      // Find if slugifiedTitle already exists
      const docWithSlug = await documentsCollection.findOne({
        slug: slugifiedTitle
      });
      if (!docWithSlug) {
        existingSlug = false; // Slug is unique, exit loop
      } else {
        // Cut off the last part of the slug if it exists
        slugifiedTitle = slugifiedTitle.replace(/-\d+$/, "");
        // If slug exists, append a number to make it unique
        const randomSuffix = Math.floor(Math.random() * 1000);
        slugifiedTitle = `${slugifiedTitle}-${randomSuffix}`;
      }
    }

    // Update the document title
    const result = await documentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to rename the document." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Document updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
