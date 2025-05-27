// src/app/api/learning/report/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { SingleReport } from "@/src/app/api/learning/documents/route";

// Interface for the request body
interface ReportRequest {
  documentId: string; // Document ID to generate report from
  question: string; // Question to generate the report
  reportDetails: string; // Additional details for the report
}

// PATCH method to append a report to a document
export async function PATCH(req: NextRequest) {
  const { documentId, question, reportDetails }: ReportRequest =
    await req.json();

  // Validate required fields
  if (!documentId || !question || !reportDetails) {
    return NextResponse.json(
      {
        error:
          "Missing required field: " +
          (!documentId ? "documentId" : "") +
          (!question ? "question" : "") +
          (!reportDetails ? "reportDetails" : "")
      },
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

    // Create a new report object
    const newReport: SingleReport = {
      question,
      report: reportDetails
    };

    // Append the new report to the existing reports array
    const updatedReports = [...(document.reports || []), newReport];

    // Update the document with the new report
    await documentsCollection.updateOne(
      { _id: objectId },
      { $set: { reports: updatedReports } }
    );

    // Respond with success and the updated document
    return NextResponse.json(
      {
        id: document._id.toString(),
        title: document.title,
        content: document.content,
        summary: document.summary,
        reports: updatedReports
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error appending report:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
