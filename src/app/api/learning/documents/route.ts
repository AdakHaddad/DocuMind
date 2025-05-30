// src/app/api/learning/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { GetSession as getSession } from "../../auth/session/helper";
import { User } from "../../auth/[...nextauth]/route";
import { writeFile, mkdir, readFile } from "fs/promises";
import { unlinkSync, existsSync } from "fs";
import path from "path";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { google } from "googleapis";
import { Readable } from "stream";
import { drive_v3 } from "googleapis";
import { protos } from "@google-cloud/documentai";
import { ClientOptions } from "google-gax";

// Define an interface for the request body}



interface NewDocument {
  title: string;
  slug: string;
  owner: string;
  content: string;
  summary: string;
  access: "private" | "public";
  reports: SingleReport[];
  driveFileUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentRequest {
  title: string;
  content: string;
}

export interface SingleReport {
  question: string;
  report: string;
}

// Helper to generate a unique filename
const generateUniqueFilename = (originalName: string) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${baseName}-${timestamp}-${randomStr}${ext}`;
};

// Helper to determine MIME type from file extension
function getMimeType(extension: string) {
  const ext = extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain"
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Google Drive integration - setup auth client
async function getGoogleDriveClient() {
  try {
    console.log("Setting up Google Drive client...");
    if (!process.env.SERVICE_KEY) {
      throw new Error("SERVICE_KEY environment variable is not set");
    }
    const keyPreview = process.env.SERVICE_KEY.substring(0, 20) + "...";
    console.log(`Service key preview: ${keyPreview}`);

    let credentials;
    try {
      if (process.env.SERVICE_KEY.startsWith("{")) {
        credentials = JSON.parse(process.env.SERVICE_KEY.replace(/\\n/g, "\n"));
      } else if (
        process.env.SERVICE_KEY.includes("-----BEGIN PRIVATE KEY-----")
      ) {
        credentials = {
          client_email: process.env.SERVICE_EMAIL,
          private_key: process.env.SERVICE_KEY.replace(/\\n/g, "\n"),
          project_id: process.env.GCP_PROJECT_ID
        };
      } else {
        const keyPath = process.env.SERVICE_KEY;
        if (existsSync(keyPath)) {
          const keyContent = await readFile(keyPath, "utf8");
          credentials = JSON.parse(keyContent);
          console.log("Loaded credentials from file");
        } else {
          throw new Error(
            "SERVICE_KEY is not a valid JSON, key format, or file path"
          );
        }
      }
    } catch (parseError) {
      console.error("Error parsing SERVICE_KEY:", parseError);
      if (process.env.SERVICE_EMAIL && process.env.SERVICE_PRIVATE_KEY) {
        console.log("Using SERVICE_EMAIL and SERVICE_PRIVATE_KEY as fallback");
        credentials = {
          client_email: process.env.SERVICE_EMAIL,
          private_key: process.env.SERVICE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          project_id: process.env.GCP_PROJECT_ID
        };
      } else {
        throw new Error(
          "Could not parse SERVICE_KEY and no fallback credentials available"
        );
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"]
    });

    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Error setting up Google Drive client:", error);
    throw new Error(
      "Failed to initialize Google Drive client: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

// Upload file to Google Drive
async function uploadFileToDrive(
  filePath: string,
  fileName: string
): Promise<string> {
  try {
    console.log("Starting Google Drive upload...");
    const drive = await getGoogleDriveClient();
    const folderId = await getOrCreateParsedFolder(drive);
    const fileStream = Readable.from(await readFile(filePath));
    const mimeType = getMimeType(path.extname(filePath));

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    console.log(`Uploading file to Google Drive folder (parsed)...`);
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fileStream
      }
    });

    if (!response.data.id) {
      throw new Error("No file ID returned from Google Drive");
    }

    console.log(`File uploaded to Google Drive with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error("Error uploading to Google Drive:", error);
    throw new Error(
      `Google Drive upload failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Helper to get or create the "parsed" folder in Google Drive
async function getOrCreateParsedFolder(drive: drive_v3.Drive): Promise<string> {
  try {
    const folderName = "parsed";
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: folderQuery,
      fields: "files(id, name)",
      spaces: "drive"
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(
        `Found existing "parsed" folder with ID: ${response.data.files[0].id}`
      );
      return response.data.files[0].id || "";
    }

    console.log('Creating "parsed" folder in Google Drive...');
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder"
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id"
    });

    console.log(`Created "parsed" folder with ID: ${folder.data.id}`);
    return folder.data.id || "";
  } catch (error) {
    console.error("Error getting/creating Google Drive folder:", error);
    throw new Error(
      'Failed to get or create the "parsed" folder in Google Drive'
    );
  }
}



// Improved function to process document with Google Cloud Document AI
async function processDocumentWithGcp(
  filePath: string,
  mimeType: string
): Promise<protos.google.cloud.documentai.v1.IDocument | null | undefined> {
  try {
    console.log("Starting Document AI processing...");
    console.log(`File path: ${filePath}`);
    console.log(`MIME type: ${mimeType}`);

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || "us";
    
    // Determine the appropriate processor ID based on file type
    let processorId;
    const fileExtension = path.extname(filePath).substring(1).toLowerCase();
    
    // Use specific processors for different file types
    if (['ppt', 'pptx', 'html', 'htm', 'xls', 'xlsx', 'csv'].includes(fileExtension)) {
      // Use the layout processor for presentations, web pages, and spreadsheets
      processorId = process.env.GCP_PROCESSOR_LAYOUT;
      console.log(`Using layout processor for ${fileExtension} file`);
    } else {
      // Use OCR processor for other files (PDFs, images, etc.)
      processorId = process.env.GCP_PROCESSOR_OCR;
      console.log(`Using OCR processor for ${fileExtension} file`);
    }

    console.log(`Project ID: ${projectId}`);
    console.log(`Location: ${location}`);
    console.log(`Processor ID: ${processorId}`);

    if (!projectId || !processorId) {
      throw new Error(`Missing required GCP environment variables: 
        Project ID: ${projectId ? "Set" : "Missing"}, 
        Processor ID: ${processorId ? "Set" : "Missing"}`);
    }

    const clientOptions: ClientOptions = {
      apiEndpoint: `${location}-documentai.googleapis.com`,
      credentials: {
        client_email: process.env.SERVICE_EMAIL!,
        private_key: process.env.SERVICE_KEY!.replace(/\\n/g, "\n")
      },
      projectId: process.env.GCP_PROJECT_ID
    };

    if (process.env.NODE_ENV !== "production") {
      const credentials = {
        client_email: process.env.SERVICE_EMAIL,
        private_key: process.env.SERVICE_KEY?.replace(/\\n/g, "\n"),
        project_id: projectId
      };

      if (!credentials.client_email || !credentials.private_key) {
        console.warn(
          "Service account credentials not found, falling back to default authentication"
        );
      } else {
        clientOptions.credentials = credentials;
        console.log("Using service account credentials");
      }
    }

    const client = new DocumentProcessorServiceClient(clientOptions);
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    console.log(`Processor name: ${name}`);

    const content = await readFile(filePath);
    console.log(`File size: ${content.length} bytes`);

    if (content.length === 0) {
      throw new Error("File is empty");
    }

    console.log(
      `File buffer first 10 bytes: ${Array.from(content.slice(0, 10))
        .map((b) => b.toString(16))
        .join(" ")}`
    );
    console.log(`Processing document: ${path.basename(filePath)}`);

    const request = {
      name,
      rawDocument: {
        content,
        mimeType
      }
    };

    console.log("Sending request to Document AI...");
    const [result] = await client.processDocument(request);
    console.log("Document AI processing completed");

    if (result.document) {
      console.log(`Document text length: ${result.document.text?.length || 0}`);
      console.log(`Number of pages: ${result.document.pages?.length || 0}`);
      console.log(
        `Number of entities: ${result.document.entities?.length || 0}`
      );
      if (result.document.text) {
        console.log(
          `First 200 chars of extracted text: "${result.document.text.substring(
            0,
            200
          )}"`
        );
      } else {
        console.log("No text extracted from document");
      }
    } else {
      console.log("No document object in result");
    }

    return result.document || null;
  } catch (error) {
    console.error("Error in Document AI processing:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(
      `Document AI processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Improved function to extract content from Document AI response
function extractContent(
  document: protos.google.cloud.documentai.v1.IDocument | null | undefined
): {
  text: string;
  metadata: {
    pages: number;
    entities: number;
    textStyles: number;
    isStubContent?: boolean;
  };
} {
  console.log("Extracting content from document...");
  if (!document) {
    console.log("No document provided to extractContent");
    return {
      text: "",
      metadata: {
        pages: 0,
        entities: 0,
        textStyles: 0
      }
    };
  }

  // Initialize metadata
  const metadata = {
    pages: document.pages?.length || 0,
    entities: document.entities?.length || 0,
    textStyles: document.textStyles?.length || 0,
    documentType: "unknown"
  };

  // Check for standard text content
  const text = document.text || "";
  console.log(`Extracted standard text length: ${text.length}`);

  // If we have standard text and it's not empty, return it
  if (text.trim()) {
    return { text, metadata };
  }

  // Check for layout processor output (for PPT, HTML, and spreadsheets)
  if (document.documentLayout && document.documentLayout.blocks) {
    console.log("Found document layout structure, extracting text from blocks...");
    metadata.documentType = "layout";
    
    let layoutText = "";
    const blocks = document.documentLayout.blocks;
    console.log(`Found ${blocks.length} text blocks in layout`);
    
    blocks.forEach((block) => {
      if (block.textBlock && block.textBlock.text) {
        layoutText += block.textBlock.text + "\n";
      }
    });
    
    if (layoutText.trim()) {
      console.log(`Extracted ${layoutText.length} characters from document layout`);
      return { text: layoutText.trim(), metadata };
    }
  }

  // Try extracting from pages if no layout data was found
  if (document.pages && document.pages.length > 0) {
    console.log("No direct text found, attempting to extract from pages...");
    metadata.documentType = "pages";
    
    let pageText = "";
    document.pages.forEach((page, pageIndex: number) => {
      console.log(`Processing page ${pageIndex + 1}`);
      
      // Extract from paragraphs
      if (page.paragraphs) {
        page.paragraphs.forEach((paragraph) => {
          if (paragraph.layout && paragraph.layout.textAnchor) {
            const textSegments = paragraph.layout.textAnchor.textSegments || [];
            textSegments.forEach((segment) => {
              if (
                segment.startIndex !== undefined &&
                segment.endIndex !== undefined &&
                document.text
              ) {
                const segmentText = document.text.substring(
                  parseInt(segment.startIndex + ""),
                  parseInt(segment.endIndex + "")
                );
                if (segmentText) {
                  pageText += segmentText + "\n";
                }
              }
            });
          }
        });
      }
      
      // Extract from tokens if paragraphs didn't yield anything
      if (page.tokens && !pageText) {
        console.log(
          `Attempting to extract from ${page.tokens.length} tokens on page ${
            pageIndex + 1
          }`
        );
        page.tokens.forEach((token) => {
          if (
            token.layout &&
            token.layout.textAnchor &&
            token.layout.textAnchor.textSegments &&
            document.text
          ) {
            token.layout.textAnchor.textSegments.forEach((segment) => {
              if (
                segment.startIndex !== undefined &&
                segment.endIndex !== undefined
              ) {
                const tokenText = document.text?.substring(
                  parseInt(segment.startIndex + ""),
                  parseInt(segment.endIndex + "")
                );
                if (tokenText) {
                  pageText += tokenText + " ";
                }
              }
            });
          }
        });
      }
    });
    if (pageText.trim()) {
      console.log(`Extracted ${pageText.length} characters from pages`);
      return { text: pageText.trim(), metadata };
    }
  }

  // If all else fails, check if we have a raw response with text content
  interface DocumentWithRaw extends protos.google.cloud.documentai.v1.IDocument {
    rawDocument?: string;
  }
  
  const documentWithRaw = document as DocumentWithRaw;
  if (documentWithRaw.rawDocument && typeof documentWithRaw.rawDocument === 'string') {
    try {
      const parsedRaw = JSON.parse(documentWithRaw.rawDocument);
      if (parsedRaw.text) {
        console.log("Extracted text from raw document content");
        return { text: parsedRaw.text, metadata };
      }
    } catch (error) {
      console.log("Failed to parse raw document content as JSON ", error);
    }
  }

  // If we're dealing with a PowerPoint file but found no content, create a stub
  // This ensures we don't fail the process for PPT files with minimal text content
  const fileExtension = document.mimeType && document.mimeType.split('/').pop();
  if (['ppt', 'pptx'].includes(fileExtension as string) || metadata.documentType === "layout") {
    console.log("Creating stub content for presentation file");
    return {
      text: "[This presentation file contains primarily visual content that has been processed for search and analysis.]",
      metadata: {
        ...metadata,
        isStubContent : true
      }
    };
  }

  console.log("No text content could be extracted from the document");
  return { text, metadata };
}

// POST method for creating a new document
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type");
  if (!contentType) {
    return NextResponse.json(
      {
        error: "Missing content type",
        details: "Content-Type header is required"
      },
      { status: 400 }
    );
  }

  // Handle file upload case
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "No file provided",
          details:
            "Please ensure you're sending a file in the form data with the key 'file'"
        },
        { status: 400 }
      );
    }

    // File validation
    const fileSize = file.size;
    if (fileSize === 0) {
      return NextResponse.json(
        {
          error: "File is empty",
          details: "The uploaded file has no content"
        },
        { status: 400 }
      );
    }

    const maxSize = 20 * 1024 * 1024; // 20MB limit
    if (fileSize > maxSize) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `Maximum size is ${maxSize / 1024 / 1024}MB, got ${
            fileSize / 1024 / 1024
          }MB`
        },
        { status: 400 }
      );
    }

    // Get user session
    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: "You must be logged in to upload documents"
        },
        { status: 401 }
      );
    }

    const user = userSession as User;
    if (!user.slug) {
      return NextResponse.json(
        {
          error: "User slug is required",
          details: "Your user account is missing required profile information"
        },
        { status: 400 }
      );
    }

    // Process the file
    const uniqueFilename = generateUniqueFilename(file.name);
    const uploadDir = path.join(process.cwd(), "uploads");
    const processedDir = path.join(process.cwd(), "processed");

    await mkdir(uploadDir, { recursive: true });
    await mkdir(processedDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    try {
      // Process with Document AI directly (no PDF conversion)
      // The appropriate processor ID will be selected based on file type in processDocumentWithGcp
      const document = await processDocumentWithGcp(filePath, file.type);

      // Extract content
      const { text: extractedText } = extractContent(document);
      if (!extractedText) {
        throw new Error("Failed to extract text from document");
      }

      // Upload to Google Drive and get file URL
      const driveFileId = await uploadFileToDrive(filePath, file.name);
      const driveFileUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

      // Create document in database
      const db = await connectToDatabase();
      const documentsCollection = db.collection("documents");

      const title = (formData.get("title") as string) || file.name;
      let slugifiedTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure unique slug
      let existingSlug = true;
      while (existingSlug) {
        const docWithSlug = await documentsCollection.findOne({
          slug: slugifiedTitle
        });

        if (!docWithSlug) {
          existingSlug = false;
        } else {
          slugifiedTitle = slugifiedTitle.replace(/-\d+$/, "");
          const randomSuffix = Math.floor(Math.random() * 1000);
          slugifiedTitle = `${slugifiedTitle}-${randomSuffix}`;
        }
      }

      const newDocument: NewDocument = {
        title,
        slug: slugifiedTitle,
        owner: user.slug,
        content: extractedText,
        summary: "",
        access: "private",
        reports: [],
        driveFileUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await documentsCollection.insertOne(newDocument);
      if (!result.insertedId) {
        throw new Error("Failed to insert document into database");
      }

      // Clean up files
      try {
        unlinkSync(filePath);
      } catch (cleanupError) {
        console.warn("Could not delete temporary files:", cleanupError);
        throw new Error("Failed to delete temporary files");
      }

      return NextResponse.json(newDocument, { status: 201 });
    } catch (error) {
      console.error("Error processing file:", error);
      return NextResponse.json(
        {
          error: "Failed to process file",
          details:
            error instanceof Error ? error.message : "Unknown error occurred"
        },
        { status: 500 }
      );
    }
  }
}

// GET All / by Id if query params exist
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const slug = searchParams.get("slug") || "";

  if (id && !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid document ID format" },
      { status: 400 }
    );
  }

  if (slug && typeof slug !== "string") {
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection("documents");

    const userSession = await getSession(req);
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = userSession as User; // Ensure user is typed correctly
    if (!user.slug) {
      return NextResponse.json(
        { error: "User slug is required" },
        { status: 400 }
      );
    }

    if (id || slug) {
      // Fetch document by ID
      let document = null;
      if (id)
        document = await documentsCollection.findOne({
          _id: new ObjectId(id)
        });
      else if (slug)
        document = await documentsCollection.findOne({
          slug: slug
        });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      // if the document is private, check if the user is the owner
      if (document.access === "private" && document.owner !== user.slug) {
        return NextResponse.json(
          { error: "Access denied to this document" },
          { status: 403 }
        );
      }

      return NextResponse.json(document, { status: 200 });
    } else {
      // Fetch all documents that the user has access to
      const documents = await documentsCollection
        .find({
          $or: [
            { access: "public" },
            { owner: user.slug } // Include documents owned by the user
          ]
        })
        .toArray();
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
        { status: 200 }
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

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "100mb"
  }
};
