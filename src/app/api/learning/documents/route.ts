// src/app/api/learning/documents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { GetSession } from "../../auth/session/route";
import { User } from "../../auth/[...nextauth]/route";
import { writeFile, mkdir, readFile } from "fs/promises";
import { unlinkSync, existsSync, readFileSync } from "fs";
import path from "path";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { google } from "googleapis";
import { Readable } from "stream";

// Import ConvertAPI with CommonJS style for direct usage
const convertapiJS = require('convertapi');

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
  owner: string; // Owner's slug
  content: string;
  summary: string;
  access: "public" | "private";
  reports: SingleReport[];
  driveFileUrl?: string; // Google Drive file URL
  createdAt?: Date; // Optional timestamp field
  updatedAt?: Date; // Optional timestamp field
}

// Helper class for timing operations
class Stopwatch {
  private startTime: number | null = null;
  private endTime: number | null = null;

  start(): Stopwatch {
    this.startTime = Date.now();
    return this;
  }

  stop(): Stopwatch {
    this.endTime = Date.now();
    return this;
  }

  getElapsedTime(): number {
    if (this.startTime === null) return 0;
    if (this.endTime === null) return Date.now() - this.startTime;
    return this.endTime - this.startTime;
  }

  getFormattedTime(): string {
    const elapsed = this.getElapsedTime() / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds.toFixed(2)}s`;
  }
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
    ".txt": "text/plain",
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
      } else if (process.env.SERVICE_KEY.includes("-----BEGIN PRIVATE KEY-----")) {
        credentials = {
          client_email: process.env.SERVICE_EMAIL,
          private_key: process.env.SERVICE_KEY.replace(/\\n/g, "\n"),
          project_id: process.env.GCP_PROJECT_ID,
        };
      } else {
        const keyPath = process.env.SERVICE_KEY;
        if (existsSync(keyPath)) {
          const keyContent = await readFile(keyPath, "utf8");
          credentials = JSON.parse(keyContent);
          console.log("Loaded credentials from file");
        } else {
          throw new Error("SERVICE_KEY is not a valid JSON, key format, or file path");
        }
      }
    } catch (parseError) {
      console.error("Error parsing SERVICE_KEY:", parseError);
      if (process.env.SERVICE_EMAIL && process.env.SERVICE_PRIVATE_KEY) {
        console.log("Using SERVICE_EMAIL and SERVICE_PRIVATE_KEY as fallback");
        credentials = {
          client_email: process.env.SERVICE_EMAIL,
          private_key: process.env.SERVICE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          project_id: process.env.GCP_PROJECT_ID,
        };
      } else {
        throw new Error("Could not parse SERVICE_KEY and no fallback credentials available");
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"],
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
async function uploadFileToDrive(filePath: string, fileName: string): Promise<string> {
  try {
    console.log("Starting Google Drive upload...");
    const drive = await getGoogleDriveClient();
    const folderId = await getOrCreateParsedFolder(drive);
    const fileStream = Readable.from(await readFile(filePath));
    const mimeType = getMimeType(path.extname(filePath));

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    console.log(`Uploading file to Google Drive folder (parsed)...`);
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fileStream,
      },
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
async function getOrCreateParsedFolder(drive: any) {
  try {
    const folderName = "parsed";
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: folderQuery,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(
        `Found existing "parsed" folder with ID: ${response.data.files[0].id}`
      );
      return response.data.files[0].id;
    }

    console.log('Creating "parsed" folder in Google Drive...');
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    console.log(`Created "parsed" folder with ID: ${folder.data.id}`);
    return folder.data.id;
  } catch (error) {
    console.error("Error getting/creating Google Drive folder:", error);
    throw new Error(
      'Failed to get or create the "parsed" folder in Google Drive'
    );
  }
}

// Convert files to PDF using ConvertAPI with improved error handling
async function convertToPdf(inputPath: string, outputPath: string) {
  try {
    console.log(`Converting ${inputPath} to PDF...`);
    
    // Get the file extension without the dot
    const fileExtension = path.extname(inputPath).substring(1).toLowerCase();
    console.log(`File extension: ${fileExtension}`);
    
    // Skip conversion for already supported types
    if (fileExtension === 'pdf') {
      console.log("Input is already PDF, copying file...");
      await writeFile(outputPath, await readFile(inputPath));
      console.log("File copied successfully");
      return true;
    }
    
    // Use CommonJS style implementation
    try {
      console.log("Attempting conversion with CommonJS style ConvertAPI...");
      const convertApiSecret = process.env.CONVERT_SECRET || 'secret_qt9utZx8jxAHOJqF';
      const convertapiClient = convertapiJS(convertApiSecret);
      
      // Add retry logic for better reliability
      let retryCount = 0;
      const maxRetries = 2;
      let lastError: Error | null = null;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`Retry attempt ${retryCount} of ${maxRetries}...`);
          }
          
          // Customize parameters based on file type
          const conversionParams: any = {
            File: inputPath,
            StoreFile: true,
            Timeout: 300 // Increased timeout for large files
          };
          
          // Special handling for presentations
          if (fileExtension === 'pptx' || fileExtension === 'ppt') {
            console.log("Using optimized parameters for PowerPoint files");
            conversionParams.PdfResolution = 300; // Higher resolution
          }
          
          // Perform the conversion
          const result = await convertapiClient.convert('pdf', conversionParams, fileExtension);
          
          // Save the result file
          await result.saveFiles(path.dirname(outputPath));
          
          // Rename the file if needed to match the expected output path
          const resultFiles = await result.files();
          if (resultFiles && resultFiles.length > 0) {
            const convertedFilePath = path.join(path.dirname(outputPath), resultFiles[0].FileName);
            if (convertedFilePath !== outputPath && existsSync(convertedFilePath)) {
              await writeFile(outputPath, await readFile(convertedFilePath));
              if (existsSync(convertedFilePath)) {
                unlinkSync(convertedFilePath); // Clean up the original converted file
              }
            }
          }
          
          console.log("ConvertAPI conversion successful");
          
          // Verify the output file exists and has content
          if (existsSync(outputPath)) {
            const fileStats = await readFile(outputPath);
            if (fileStats.length > 0) {
              console.log(`Conversion verification: ${fileStats.length} bytes on disk`);
              return true;
            }
          }
          
          // If we reach here, conversion technically succeeded but file is invalid
          throw new Error("Conversion resulted in an invalid file");
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log(`Conversion attempt failed: ${lastError.message}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            console.error(`All ${maxRetries} retry attempts failed`);
          }
        }
      }
      
      // If we reach here, all attempts failed
      throw lastError;
    } 
    catch (conversionError) {
      console.error("ConvertAPI conversion failed:", conversionError);
      
      // For files we know Document AI can handle directly, we can try to use them directly
      const directlySupportedTypes = [
        'jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'tif'
      ];
      
      if (directlySupportedTypes.includes(fileExtension)) {
        console.log(`File type ${fileExtension} is directly supported by Document AI. Using original file.`);
        await writeFile(outputPath, await readFile(inputPath));
        return true;
      }
      
      console.log("Creating a conversion failure marker");
      // Return false to indicate conversion failed but don't throw an error
      return false;
    }
  } catch (error) {
    console.error("Error during conversion to PDF:", error);
    return false;
  }
}

// Improved function to process document with Google Cloud Document AI
async function processDocumentWithGcp(filePath: string, mimeType: string) {
  try {
    console.log("Starting Document AI processing...");
    console.log(`File path: ${filePath}`);
    console.log(`MIME type: ${mimeType}`);

    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || "us";
    const processorId = process.env.GCP_PROCESSOR_ID;

    console.log(`Project ID: ${projectId}`);
    console.log(`Location: ${location}`);
    console.log(`Processor ID: ${processorId}`);

    if (!projectId || !processorId) {
      throw new Error(`Missing required GCP environment variables: 
        Project ID: ${projectId ? "Set" : "Missing"}, 
        Processor ID: ${processorId ? "Set" : "Missing"}`);
    }

    let clientOptions: any = {
      apiEndpoint: `${location}-documentai.googleapis.com`,
    };

    if (process.env.NODE_ENV !== "production") {
      const credentials = {
        client_email: process.env.SERVICE_EMAIL,
        private_key: process.env.SERVICE_KEY?.replace(/\\n/g, "\n"),
        project_id: projectId,
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
        mimeType,
      },
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

    return result.document;
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
function extractContent(document: any): { text: string; metadata: any } {
  console.log("Extracting content from document...");
  if (!document) {
    console.log("No document provided to extractContent");
    return { text: "", metadata: {} };
  }

  const text = document.text || "";
  console.log(`Extracted text length: ${text.length}`);

  const metadata = {
    pages: document.pages?.length || 0,
    entities: document.entities?.length || 0,
    textStyles: document.textStyles?.length || 0,
  };

  if (!text && document.pages && document.pages.length > 0) {
    console.log("No direct text found, attempting to extract from pages...");
    let pageText = "";
    document.pages.forEach((page: any, pageIndex: number) => {
      console.log(`Processing page ${pageIndex + 1}`);
      if (page.paragraphs) {
        page.paragraphs.forEach((paragraph: any) => {
          if (paragraph.layout && paragraph.layout.textAnchor) {
            const textSegments = paragraph.layout.textAnchor.textSegments || [];
            textSegments.forEach((segment: any) => {
              if (
                segment.startIndex !== undefined &&
                segment.endIndex !== undefined
              ) {
                const segmentText = document.text?.substring(
                  parseInt(segment.startIndex),
                  parseInt(segment.endIndex)
                );
                if (segmentText) {
                  pageText += segmentText + "\n";
                }
              }
            });
          }
        });
      }
      if (page.tokens && !pageText) {
        console.log(
          `Attempting to extract from ${page.tokens.length} tokens on page ${
            pageIndex + 1
          }`
        );
        page.tokens.forEach((token: any) => {
          if (
            token.layout &&
            token.layout.textAnchor &&
            token.layout.textAnchor.textSegments
          ) {
            token.layout.textAnchor.textSegments.forEach((segment: any) => {
              if (
                segment.startIndex !== undefined &&
                segment.endIndex !== undefined
              ) {
                const tokenText = document.text?.substring(
                  parseInt(segment.startIndex),
                  parseInt(segment.endIndex)
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
  return { text, metadata };
}

// POST method for creating a new document
export async function POST(req: NextRequest) {
    const contentType = req.headers.get("content-type");
    if (!contentType) {
      return NextResponse.json({
        error: "Missing content type",
        details: "Content-Type header is required"
      }, { status: 400 });
    }

    // Handle file upload case
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({
        error: "No file provided",
        details: "Please ensure you're sending a file in the form data with the key 'file'"
      }, { status: 400 });
    }

    // File validation
    const fileSize = file.size;
    if (fileSize === 0) {
      return NextResponse.json({
        error: "File is empty",
        details: "The uploaded file has no content"
      }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024; // 20MB limit
    if (fileSize > maxSize) {
      return NextResponse.json({
        error: "File too large",
        details: `Maximum size is ${maxSize / 1024 / 1024}MB, got ${fileSize / 1024 / 1024}MB`
      }, { status: 400 });
    }

    // Get user session
    const userSession = await GetSession(req);
    if (!userSession) {
      return NextResponse.json({
        error: "Unauthorized",
        details: "You must be logged in to upload documents"
      }, { status: 401 });
    }

    const user = userSession as User;
    if (!user.slug) {
      return NextResponse.json({
        error: "User slug is required",
        details: "Your user account is missing required profile information"
      }, { status: 400 });
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
      // Convert to PDF if needed
      const supportedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/bmp",
        "image/tiff",
        "image/gif",
      ];

      let processingFilePath = filePath;
      let processingMimeType = file.type;

      if (!supportedTypes.includes(file.type)) {
        const tempFilePath = path.join(
          uploadDir,
          `${path.basename(uniqueFilename, path.extname(uniqueFilename))}.pdf`
        );
        const converted = await convertToPdf(filePath, tempFilePath);
        if (!converted) {
          throw new Error("Failed to convert file to PDF");
        }
        processingFilePath = tempFilePath;
        processingMimeType = "application/pdf";
      }

      // Process with Document AI
      const document = await processDocumentWithGcp(
        processingFilePath,
        processingMimeType
      );

      // Extract content
      const { text: extractedText, metadata } = extractContent(document);
      if (!extractedText) {
        throw new Error("Failed to extract text from document");
      }

      // Upload to Google Drive and get file URL
      const driveFileId = await uploadFileToDrive(processingFilePath, file.name);
      const driveFileUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;

      // Create document in database
      const db = await connectToDatabase();
      const documentsCollection = db.collection("documents");

      const title = formData.get("title") as string || file.name;
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

      const newDocument = {
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
        if (processingFilePath !== filePath) {
          unlinkSync(processingFilePath);
        }
      } catch (cleanupError) {
        console.warn("Could not delete temporary files:", cleanupError);
        throw new Error("Failed to delete temporary files");
      }

      return NextResponse.json(newDocument, { status: 201 });

    } catch (error) {
      console.error("Error processing file:", error);
      return NextResponse.json({
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      }, { status: 500 });
    }
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

    const userSession = await GetSession(req);
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

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "100mb",
  },
};
