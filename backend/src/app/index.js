const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// Create necessary directories
const uploadsDir = path.join(__dirname, '../../uploads');
const processedDir = path.join(__dirname, '../../processed');
const publicDir = path.join(__dirname, '../../public');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(publicDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Routes
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // Generate output path
    const baseName = path.parse(req.file.filename).name;
    const outputPath = path.join(processedDir, `${baseName}_processed.json`);

    // Process the document using Python script with langchain-docling
    const pythonProcess = spawn('python', [
      'src/app/api/upload/process_document.py',
      req.file.path,
      outputPath
    ]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('Failed to delete uploaded file:', err);
      });

      try {
        // Try to parse the last line of stdout as JSON
        const lastLine = stdoutData.trim().split('\n').pop();
        const result = JSON.parse(lastLine);

        if (result.success) {
          res.json(result);
        } else {
          console.error('Python process error:', result.error);
          res.status(500).json({
            success: false,
            error: 'Document processing failed',
            details: result.error,
            traceback: result.traceback || result.metadata?.traceback,
            code: code
          });
        }
      } catch (parseError) {
        console.error('Failed to parse Python output:', parseError);
        console.error('stdout:', stdoutData);
        console.error('stderr:', stderrData);
        
        res.status(500).json({
          success: false,
          error: 'Failed to parse processing result',
          details: parseError.message,
          stdout: stdoutData,
          stderr: stderrData,
          code: code
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to start document processing',
        details: err.message
      });
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Document Processing API with LangChain-Docling'
  });
});

// Get processed documents list
app.get('/api/processed', (req, res) => {
  try {
    const files = fs.readdirSync(processedDir)
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        filename: file,
        path: path.join(processedDir, file),
        created: fs.statSync(path.join(processedDir, file)).ctime
      }))
      .sort((a, b) => b.created - a.created);

    res.json({
      success: true,
      files: files
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list processed files',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 50MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Document Processing Server running on port ${port}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`📁 Processed directory: ${processedDir}`);
  console.log(`🔬 Using LangChain-Docling for document processing`);
}); 