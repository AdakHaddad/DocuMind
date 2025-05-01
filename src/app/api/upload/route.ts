import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
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
    const filePath = path.join(uploadDir, uniqueFilename);
    const outputPath = path.join(
      uploadDir,
      `${path.basename(
        uniqueFilename,
        path.extname(uniqueFilename)
      )}-output.json`
    );

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Write file to disk (you might want to use a cloud storage in production)
    await writeFile(filePath, buffer);

    // Call Python script with Megaparse to process the file
    // Adjust the path to your Python script as needed
    const pythonScriptPath = path.join(
      process.cwd(),
      "python",
      "process_document.py"
    );

     const { stdout, stderr } = await execPromise(
      `python "${pythonScriptPath}" "${filePath}" "${outputPath}"`
    );

    if (stderr) {
      console.error("Python script error:", stderr);
      return NextResponse.json(
        { error: "Error processing document" },
        { status: 500 }
      );
    }

    // Read the generated output from the Python script
    const fs = require("fs");
    const processedData = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    // Return the processed data
    return NextResponse.json({
      success: true,
      filename: file.name,
      fileSize: file.size,
      processedData,
    });
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
