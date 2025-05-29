import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { unlinkSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { MongoClient, ObjectId } from "mongodb";
import { google } from "googleapis";
import { promisify } from "util";
import { Readable } from "stream";
// Import ConvertAPI
import * as convertapi from 'convertapi';
// Also import as CommonJS style for direct usage
const convertapiJS = require('convertapi');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = "documind";

// MongoDB client singleton
let mongoClient: MongoClient | null = null;

// Connect to MongoDB
async function connectToDatabase() {
  if (mongoClient) {
    return { client: mongoClient, db: mongoClient.db(MONGODB_DB) };
  }

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  return { client: mongoClient, db: mongoClient.db(MONGODB_DB) };
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
          project_id: process.env.GCP_PROJECT_ID,
        };
      } else {
        const keyPath = process.env.SERVICE_KEY;
        if (existsSync(keyPath)) {
          const keyContent = readFileSync(keyPath, "utf8");
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
          project_id: process.env.GCP_PROJECT_ID,
        };
      } else {
        throw new Error(
          "Could not parse SERVICE_KEY and no fallback credentials available"
        );
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
async function uploadFileToDrive(filePath: string, fileName: string) {
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
      let lastError = null;
      
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
          
        } catch (attemptError) {
          lastError = attemptError;
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log(`Conversion attempt failed: ${attemptError.message}. Retrying...`);
            // Wait before retrying (exponential backoff)
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

export async function POST(request: NextRequest) {
  const stopwatch = new Stopwatch().start();
  let filePath = "";
  let outputPath = "";
  let driveFileId: string | null = null;
  let tempFilePath = ""; // For converted PDF

  try {
    // Process the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Enhanced file validation
    const fileType = file.type;
    const fileSize = file.size;
    console.log(`File name: ${file.name}`);
    console.log(`File type: ${fileType}`);
    console.log(`File size: ${fileSize} bytes`);

    if (fileSize === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    // Check file size limits (Document AI has limits)
    const maxSize = 20 * 1024 * 1024; // 20MB limit
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Supported MIME types for Google Cloud Document AI
    const supportedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/bmp",
      "image/tiff",
      "image/gif",
    ];

    // Create unique filename and determine paths
    const uniqueFilename = generateUniqueFilename(file.name);
    const uploadDir = path.join(process.cwd(), "uploads");
    const processedDir = path.join(process.cwd(), "processed");
    filePath = path.join(uploadDir, uniqueFilename);
    outputPath = path.join(
      processedDir,
      `${path.basename(
        uniqueFilename,
        path.extname(uniqueFilename)
      )}-output.json`
    );

    console.log(`File will be saved to: ${filePath}`);
    console.log(`Output will be saved to: ${outputPath}`);

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`Buffer created: ${buffer.length} bytes`);

    // Ensure the uploads and processed directories exist
    await mkdir(uploadDir, { recursive: true });
    await mkdir(processedDir, { recursive: true });

    // Write file to disk
    await writeFile(filePath, buffer);
    console.log(`File saved successfully (${buffer.length} bytes)`);

    // Verify file was written correctly
    const fileStats = await readFile(filePath);
    console.log(`File verification: ${fileStats.length} bytes on disk`);

    // Convert to PDF if not a supported type
    let processingFilePath = filePath;
    let processingMimeType = fileType;

    if (!supportedTypes.includes(fileType)) {
      console.log(
        `File type ${fileType} not supported by Document AI, converting to PDF...`
      );
      tempFilePath = path.join(
        uploadDir,
        `${path.basename(uniqueFilename, path.extname(uniqueFilename))}.pdf`
      );
      await convertToPdf(filePath, tempFilePath);
      processingFilePath = tempFilePath;
      processingMimeType = "application/pdf";
    }

    try {
      // Upload file to Google Drive 'parsed' folder
      console.log("Uploading file to Google Drive 'parsed' folder...");
      driveFileId = await uploadFileToDrive(processingFilePath, file.name);
      console.log(`File uploaded to Google Drive with ID: ${driveFileId}`);

      // Log environment variables for debugging
      console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID || "not set"}`);
      console.log(
        `GCP_PROCESSOR_ID: ${process.env.GCP_PROCESSOR_ID || "not set"}`
      );
      console.log(
        `GCP_LOCATION: ${process.env.GCP_LOCATION || "not set (using 'us')"}`
      );
      console.log(
        `SERVICE_EMAIL: ${process.env.SERVICE_EMAIL ? "set" : "not set"}`
      );
      console.log(
        `SERVICE_KEY: ${process.env.SERVICE_KEY ? "set" : "not set"}`
      );
      console.log(
        `MONGODB_URI: ${process.env.MONGODB_URI ? "set" : "not set"}`
      );

      // Process with Google Cloud Document AI
      console.log("Processing document with Google Cloud Document AI...");
      const document = await processDocumentWithGcp(
        processingFilePath,
        processingMimeType
      );

      // Extract content with improved extraction
      console.log("Extracting content...");
      const { text: textContent, metadata: extractionMetadata } =
        extractContent(document);

      // Stop the stopwatch
      stopwatch.stop();
      const processingTime = stopwatch.getFormattedTime();

      console.log(`Final extracted text length: ${textContent.length}`);
      if (textContent.length === 0) {
        console.warn(
          "WARNING: No text content was extracted from the document"
        );
      }

      // Create MongoDB document format with Google Drive reference
      const mongoDocument = {
        _id: new ObjectId(),
        title: path.basename(file.name, path.extname(file.name)),
        content: textContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: "",
        source: {
          type: "google_drive",
          fileId: driveFileId,
          fileName: file.name,
        },
      };

      // Create standard JSON output with metadata
      const docJson = {
        content: textContent,
        metadata: {
          filename: file.name,
          fileSize: fileSize,
          processed_at: new Date().toISOString(),
          processing_time: processingTime,
          processing_seconds: stopwatch.getElapsedTime() / 1000,
          processor: "Google Cloud Document AI Layout Parser",
          processor_id: process.env.GCP_PROCESSOR_ID,
          extraction_metadata: extractionMetadata,
          driveFileId: driveFileId,
          convertedToPdf: !!tempFilePath, // Indicate if conversion occurred
        },
        debug: {
          document_has_text: !!document?.text,
          document_text_length: document?.text?.length || 0,
          document_has_pages: !!document?.pages,
          document_pages_count: document?.pages?.length || 0,
        },
      };

      // Save processed result in standard format
      console.log(`Saving processed document to ${outputPath}...`);
      writeFileSync(outputPath, JSON.stringify(docJson, null, 2));

      // Save MongoDB formatted document
      const mongoOutputPath = path.join(
        processedDir,
        `${path.basename(
          uniqueFilename,
          path.extname(uniqueFilename)
        )}-mongo.json`
      );
      writeFileSync(mongoOutputPath, JSON.stringify(mongoDocument, null, 2));
      console.log(`Saved MongoDB format document to ${mongoOutputPath}`);

      // Save to MongoDB if configured
      if (process.env.MONGODB_URI) {
        try {
          console.log("Connecting to MongoDB...");
          const { db } = await connectToDatabase();
          console.log("Connected to MongoDB, inserting document...");
          const collection = db.collection("documents");
          const result = await collection.insertOne(mongoDocument);
          console.log(
            `Document saved to MongoDB with ID: ${result.insertedId}`
          );
        } catch (dbError) {
          console.error("Error saving to MongoDB:", dbError);
        }
      } else {
        console.log("MongoDB URI not set, skipping database save");
      }

      // Clean up files
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          console.log("Original file deleted from local storage");
        }
        if (tempFilePath && existsSync(tempFilePath)) {
          unlinkSync(tempFilePath);
          console.log("Converted PDF file deleted from local storage");
        }
      } catch (error) {
        console.warn("Could not delete files from local storage:", error);
      }

      // Return the processed data
      console.log(`Successfully processed document in ${processingTime}`);
      return NextResponse.json({
        success: true,
        filename: file.name,
        fileSize: file.size,
        contentLength: textContent.length,
        documentId: mongoDocument._id.toString(),
        driveFileId: driveFileId,
        processedData: mongoDocument,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          console.log("Cleaned up input file");
        }
        if (tempFilePath && existsSync(tempFilePath)) {
          unlinkSync(tempFilePath);
          console.log("Cleaned up converted PDF file");
        }
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
          console.log("Cleaned up output file");
        }
      } catch (cleanupError) {
        console.warn("Error during cleanup:", cleanupError);
      }
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to process file",
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in upload route:", error);
    try {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
      if (tempFilePath && existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
      if (outputPath && existsSync(outputPath)) {
        unlinkSync(outputPath);
      }
    } catch (cleanupError) {
      console.warn("Error during cleanup in outer catch block:", cleanupError);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process file",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "100mb",
  },
};
