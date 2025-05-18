import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { unlinkSync, existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

// Convert exec to Promise-based
const execPromise = promisify(exec);

// Helper to generate a unique filename
const generateUniqueFilename = (originalName: string) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${baseName}-${timestamp}-${randomStr}${ext}`;
};

export async function POST(request: NextRequest) {
  try {
    // Process the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileType = file.type;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        {
          error:
            "File type not supported. Please upload PDF or PowerPoint files.",
        },
        { status: 400 }
      );
    }

    // Create unique filename and determine paths
    const uniqueFilename = generateUniqueFilename(file.name);
    const uploadDir = path.join(process.cwd(), "uploads");
    const processedDir = path.join(process.cwd(), "processed");
    const filePath = path.join(uploadDir, uniqueFilename);
    const outputPath = path.join(
      processedDir,
      `${path.basename(
        uniqueFilename,
        path.extname(uniqueFilename)
      )}-output.json`
    );

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure the uploads and processed directories exist
    await mkdir(uploadDir, { recursive: true });
    await mkdir(processedDir, { recursive: true });
    // Write file to disk
    await writeFile(filePath, buffer);

    // Call Python script with Docling to process the file
    const pythonScriptPath = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "upload",
      "process_document.py"
    );

    try {
      // Execute the Python script
      const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec(
          `python "${pythonScriptPath}" "${filePath}" "${outputPath}"`,
          (error, stdout, stderr) => {
            if (error) {
              console.error("Python script error:", {
                code: error.code,
                message: error.message,
                stdout,
                stderr
              });
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          }
        );
      });

      // Log warnings but don't treat them as errors
      if (stderr) {
        console.warn("Python script warnings:", stderr);
        // Only throw if it's not a PyTorch warning about pin_memory
        if (!stderr.includes("pin_memory") && !stderr.includes("UserWarning")) {
          throw new Error(`Python processing error: ${stderr}`);
        }
      }

      // Check if output file exists
      if (!existsSync(outputPath)) {
        throw new Error("Processing failed: Output file was not created");
      }

      // Read the generated output from the Python script
      let processedData;
      try {
        const outputContent = readFileSync(outputPath, "utf8");
        processedData = JSON.parse(outputContent);
      } catch (error) {
        console.error("Error reading/parsing output file:", error);
        throw new Error("Failed to read or parse processed output");
      }

      if (!processedData || !processedData.content) {
        throw new Error("Invalid processing result: missing content");
      }

      // Store the processed data in the processed directory
      const processedFilePath = path.join(processedDir, `${path.basename(uniqueFilename, path.extname(uniqueFilename))}-processed.json`);
      writeFileSync(processedFilePath, JSON.stringify(processedData, null, 2));

      // Clean up the original uploaded file
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.warn("Could not delete original file:", error);
      }

      // Return the processed data
      return NextResponse.json({
        success: true,
        filename: file.name,
        fileSize: file.size,
        processedData,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      // Clean up any temporary files
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
      } catch (cleanupError) {
        console.warn("Error during cleanup:", cleanupError);
      }
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : "Failed to process file",
          details: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
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
