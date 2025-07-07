import type { NextApiRequest, NextApiResponse } from "next";
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

export const config = {
  api: { bodyParser: false },
};

function parseTxtOrRtf(buffer: Buffer) {
  return buffer.toString("utf-8");
}

function parseFileExt(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() || "";
}

async function extractText(file: UploadedFile) {
  const ext = parseFileExt(file.originalFilename || "");
  const buffer = fs.readFileSync(file.filepath);

  if (ext === "pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (ext === "txt" || ext === "rtf") {
    return parseTxtOrRtf(buffer);
  }
  if (["jpg", "jpeg", "png"].includes(ext)) {
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  }
  throw new Error("Unsupported file type: " + ext);
}

interface FormidableResult {
  fields: any;
  files: any;
}

function parseForm(req: NextApiRequest): Promise<FormidableResult> {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function generateQuiz(text: string, numQuestions: number) {
  const apiKey = process.env.OPENAI_API_KEY!;
  const prompt = `
Generate ${numQuestions} multiple-choice questions (A-D) with correct answers and explanations from the following content.
Format:
Q1: Question text
A. Option A
B. Option B
C. Option C
D. Option D
Answer: C
--- (repeat for all questions)
Content:
${text}
  `;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  try {
    const { fields, files } = await parseForm(req);
    const fileObj = Array.isArray(files.file) ? files.file[0] : files.file;
    const file = fileObj as UploadedFile;
    // Always generate 20 questions:
    const extractedText = await extractText(file);
    const fullQuizText = await generateQuiz(extractedText, 20);
    res.status(200).json({ quiz: fullQuizText });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

