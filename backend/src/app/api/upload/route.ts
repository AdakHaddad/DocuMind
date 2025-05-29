import { NextRequest, NextResponse } from "../../../../../frontend/node_modules/next/server";
import { writeFile, mkdir } from "fs/promises";
import { unlinkSync, existsSync } from "fs";
import path from "path";
import { spawn } from "child_process";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and PowerPoint files are allowed." },
        { status: 400 }
      );
    }

    // Create directories
    const uploadDir = path.join(process.cwd(), "uploads");
    const processedDir = path.join(process.cwd(), "processed");
    
    if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
    }
    if (!existsSync(processedDir)) {
      await mkdir(processedDir, { recursive: true });
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const originalFilename = file.name;
    const fileExtension = path.extname(originalFilename);
    const baseFilename = path.basename(originalFilename, fileExtension);
    
    const uploadPath = path.join(uploadDir, `${baseFilename}-${timestamp}-${uniqueId}${fileExtension}`);
    const outputPath = path.join(processedDir, `${baseFilename}-${timestamp}-${uniqueId}-output.json`);

    // Save uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(uploadPath, buffer);

    // Process document
    return new Promise((resolve) => {
      const pythonProcess = spawn("python", [
        "src/app/api/upload/process_document.py",
        uploadPath,
        outputPath
      ]);

      let outputData = "";
      let errorData = "";

      pythonProcess.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        // Clean up uploaded file
        try {
          unlinkSync(uploadPath);
        } catch (error) {
          console.error("Error cleaning up uploaded file:", error);
        }

        if (code !== 0 || !outputData.trim()) {
          resolve(NextResponse.json(
            { 
              success: false,
              error: errorData || "Processing failed",
              metadata: {
                filename: originalFilename,
                processed_at: new Date().toISOString(),
                status: "error"
              }
            },
            { status: 500 }
          ));
          return;
        }

        try {
          const result = JSON.parse(outputData.trim());
          if (!result.success) {
            resolve(NextResponse.json(
              { 
                success: false,
                error: result.error || "Processing failed",
                metadata: {
                  filename: originalFilename,
                  processed_at: new Date().toISOString(),
                  status: "error",
                  ...result.metadata
                }
              },
              { status: 500 }
            ));
            return;
          }

          resolve(NextResponse.json({
            success: true,
            data: {
              ...result.data,
              metadata: {
                ...result.data.metadata,
                original_filename: originalFilename,
                file_size: file.size,
                file_type: file.type
              }
            }
          }));
        } catch (error) {
          console.error("Error parsing Python output:", error, "Output was:", outputData);
          resolve(NextResponse.json(
            { 
              success: false,
              error: "Failed to parse processing result",
              metadata: {
                filename: originalFilename,
                processed_at: new Date().toISOString(),
                status: "error"
              }
            },
            { status: 500 }
          ));
        }
      });
    });

  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        status: "error",
        metadata: {
          processed_at: new Date().toISOString(),
          status: "error"
        }
      },
      { status: 500 }
    );
  }
}

// Increase the max size limit for uploads if needed
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "100mb",
  },
};
