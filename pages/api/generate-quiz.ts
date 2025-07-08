// pages/api/generate-quiz.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from '@clerk/nextjs/server';
import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

interface UploadedFile {
  originalFilename?: string;
  filepath: string;
  mimetype?: string;
  size?: number;
  newFilename?: string;
  [key: string]: any;
}

interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

interface ApiResponse {
  quiz?: string;
  metadata?: {
    userId: string;
    fileType: string;
    fileName: string;
    processingTime: number;
    timestamp: string;
  };
}

export const config = {
  api: { 
    bodyParser: false,
    responseLimit: '10mb'
  },
};

// Enhanced file type validation
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'rtf', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: UploadedFile): void {
  if (!file.originalFilename) {
    throw new Error("File name is required");
  }
  
  const ext = parseFileExt(file.originalFilename);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  
  if (file.size && file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`);
  }
}

function parseTxtOrRtf(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

function parseFileExt(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || "";
}

async function extractText(file: UploadedFile): Promise<string> {
  validateFile(file);
  
  const ext = parseFileExt(file.originalFilename || "");
  const buffer = fs.readFileSync(file.filepath);

  try {
    switch (ext) {
      case "pdf":
        const pdfData = await pdfParse(buffer);
        if (!pdfData.text.trim()) {
          throw new Error("PDF appears to be empty or contains only images");
        }
        return pdfData.text;
        
      case "docx":
        const docxResult = await mammoth.extractRawText({ buffer });
        if (!docxResult.value.trim()) {
          throw new Error("DOCX file appears to be empty");
        }
        return docxResult.value;
        
      case "txt":
      case "rtf":
        const textContent = parseTxtOrRtf(buffer);
        if (!textContent.trim()) {
          throw new Error("Text file appears to be empty");
        }
        return textContent;
        
      case "jpg":
      case "jpeg":
      case "png":
        const worker = await createWorker("eng");
        try {
          const { data: { text } } = await worker.recognize(buffer);
          if (!text.trim()) {
            throw new Error("Could not extract text from image. Please ensure image contains readable text.");
          }
          return text;
        } finally {
          await worker.terminate();
        }
        
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to extract text from ${ext.toUpperCase()}: ${error.message}`);
  }
}

interface FormidableResult {
  fields: any;
  files: any;
}

function parseForm(req: NextApiRequest): Promise<FormidableResult> {
  return new Promise((resolve, reject) => {
    const form = formidable({ 
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      multiples: false
    });
    
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) {
        reject(new Error(`File upload failed: ${err.message}`));
      } else {
        resolve({ fields, files });
      }
    });
  });
}

async function generateQuiz(text: string, numQuestions: number, userId: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // Validate text content
  if (!text.trim()) {
    throw new Error("No text content found to generate quiz from");
  }
  
  if (text.length < 100) {
    throw new Error("Content too short to generate meaningful quiz questions (minimum 100 characters)");
  }

  const prompt = `
You are an expert quiz generator. Create exactly ${numQuestions} high-quality multiple-choice questions from the provided content.

Requirements:
- Each question should have 4 options (A, B, C, D)
- Questions should test understanding, not just memorization
- Provide the correct answer and a brief explanation
- Cover different aspects of the content
- Make distractors plausible but clearly incorrect

Format each question as:
Q[number]: [Question text]
A. [Option A]
B. [Option B]  
C. [Option C]
D. [Option D]
Answer: [Correct letter]
Explanation: [Brief explanation why this answer is correct]

---

Content to analyze:
${text.slice(0, 8000)} ${text.length > 8000 ? '...' : ''}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        temperature: 0.3,
        max_tokens: 3000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const quiz = data.choices[0]?.message?.content?.trim();
    
    if (!quiz) {
      throw new Error("OpenAI returned empty response");
    }
    
    return quiz;
  } catch (error: any) {
    if (error.message.includes('quota')) {
      throw new Error("OpenAI quota exceeded. Please try again later.");
    }
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse | ApiError>
) {
  const startTime = Date.now();
  
  // Method validation
  if (req.method !== "POST") {
    return res.status(405).json({ 
      error: "Method not allowed", 
      code: "METHOD_NOT_ALLOWED" 
    });
  }

  try {
    // 🔒 ROBUST AUTHENTICATION
    const { userId, sessionId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required. Please sign in.", 
        code: "UNAUTHORIZED" 
      });
    }
    
    console.log(`✅ Request authenticated - User: ${userId}, Session: ${sessionId}`);

    // Parse form data
    const { fields, files } = await parseForm(req);
    
    if (!files.file) {
      return res.status(400).json({ 
        error: "No file uploaded", 
        code: "MISSING_FILE" 
      });
    }
    
    const fileObj = Array.isArray(files.file) ? files.file[0] : files.file;
    const file = fileObj as UploadedFile;
    
    console.log(`📁 Processing file: ${file.originalFilename} (${file.size} bytes)`);
    
    // Extract text content
    const extractedText = await extractText(file);
    console.log(`📄 Extracted ${extractedText.length} characters from file`);
    
    // Generate quiz
    const fullQuizText = await generateQuiz(extractedText, 20, userId);
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Quiz generated in ${processingTime}ms`);
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
    
    // Return response with metadata
    res.status(200).json({ 
      quiz: fullQuizText,
      metadata: {
        userId,
        fileType: parseFileExt(file.originalFilename || ""),
        fileName: file.originalFilename || "unknown",
        processingTime,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ API Error (${processingTime}ms):`, error.message);
    
    // Return appropriate error codes
    if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ 
        error: error.message, 
        code: "UNAUTHORIZED" 
      });
    }
    
    if (error.message.includes('File') || error.message.includes('upload')) {
      return res.status(400).json({ 
        error: error.message, 
        code: "FILE_ERROR" 
      });
    }
    
    if (error.message.includes('OpenAI') || error.message.includes('quota')) {
      return res.status(503).json({ 
        error: error.message, 
        code: "AI_SERVICE_ERROR" 
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: "Internal server error. Please try again.", 
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

