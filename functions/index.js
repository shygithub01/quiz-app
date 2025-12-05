const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const cors = require("cors");
const OpenAI = require("openai");
const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const Busboy = require("busboy");
const fs = require("fs");

// Define secrets
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept text files, Word documents, and PDFs
    if (file.mimetype === 'text/plain' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .docx, .doc, and .pdf files are allowed'), false);
    }
  }
});

// CORS configuration
const corsHandler = cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://quizapp-42057.web.app",
    "https://quizist.ai",
    "https://www.quizist.ai"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
});

// Helper function to handle CORS preflight
const handleCors = (req, res) => {
  return new Promise((resolve) => {
    corsHandler(req, res, () => {
      resolve();
    });
  });
};

// Helper function to get MIME type from filename
const getMimeType = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'txt':
      return 'text/plain';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
};

// Enhanced function to extract text from uploaded file
const extractTextFromFile = async (file) => {
  try {
    console.log(`📄 Processing file: ${file.originalname}, Type: ${file.mimetype}, Size: ${file.size} bytes`);
    
    if (file.mimetype === 'text/plain') {
      const text = file.buffer.toString('utf8');
      console.log(`✅ Extracted ${text.length} characters from text file`);
      return text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      console.log(`✅ Extracted ${result.value.length} characters from DOCX file`);
      return result.value;
    } else if (file.mimetype === 'application/msword') {
      try {
        console.log('📄 Attempting DOC file parsing...');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        console.log(`✅ Extracted ${result.value.length} characters from DOC file`);
        return result.value;
      } catch (docError) {
        console.error('❌ DOC file parsing error:', docError);
        
        // Check if it's the common "body element" error
        if (docError.message.includes('Could not find the body element')) {
          throw new Error(`This DOC file appears to be corrupted or in an unsupported format. Please convert it to DOCX format using Microsoft Word or LibreOffice, or try uploading a different file.`);
        }
        
        throw new Error(`Unable to read this DOC file: ${docError.message}. Please convert it to DOCX format or upload a different file.`);
      }
    } else if (file.mimetype === 'application/pdf') {
      try {
        console.log('📄 Attempting PDF parsing...');
        const pdfData = await pdfParse(file.buffer);
        console.log(`✅ Extracted ${pdfData.text.length} characters from PDF file`);
        console.log(`📄 PDF text preview: "${pdfData.text.substring(0, 200)}..."`);
        return pdfData.text;
      } catch (pdfError) {
        console.error('❌ PDF parsing error:', pdfError);
        throw new Error(`Unable to read this PDF file. Please ensure it's not password-protected or corrupted. Error: ${pdfError.message}`);
      }
    } else {
      const supportedTypes = ['PDF (.pdf)', 'Word documents (.docx, .doc)', 'Text files (.txt)'];
      throw new Error(`Unsupported file type: ${file.originalname}. Please upload only: ${supportedTypes.join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Error processing file: ${error.message}`);
    throw new Error(`Error processing file: ${error.message}`);
  }
};

// Helper function to get OpenAI key
const getOpenAIKey = () => {
  return openaiApiKey.value();
};

let quizHistory = [];

// Main quiz generation endpoint that handles both document and topic requests
exports.generateQuiz = onRequest({ secrets: [openaiApiKey], region: 'us-central1' }, async (req, res) => {
  await handleCors(req, res);
  
  try {
    const openai = new OpenAI({ apiKey: getOpenAIKey() });
    
    // Check if it's a file upload (JSON with base64 file) or topic request
    if (req.body.file && req.body.fileName) {
      // Handle file upload (base64-encoded file)
      console.log('📄 Detected file upload request');
      console.log('📄 File name:', req.body.fileName);
      console.log('📄 File type:', req.body.fileType);
      console.log('📄 Base64 length:', req.body.file.length);
      
      try {
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(req.body.file, 'base64');
        console.log('✅ File buffer created:', fileBuffer.length, 'bytes');
        
        // Create a mock file object for extractTextFromFile
        const mockFile = {
          buffer: fileBuffer,
          originalname: req.body.fileName,
          mimetype: req.body.fileType || getMimeType(req.body.fileName),
          size: fileBuffer.length
        };
        
        // Extract text from the uploaded file
        const fileContent = await extractTextFromFile(mockFile);
        
        const numQuestions = parseInt(req.body.numQuestions) || 5;
        const difficulty = req.body.difficulty || 'medium';
        const quizType = req.body.quizType || 'multiple-choice';
        
        console.log("Processing file upload with settings:", { numQuestions, difficulty, quizType });
        console.log("Extracted text length:", fileContent.length);
        
        const prompt = `Create exactly ${numQuestions} ${difficulty} difficulty ${quizType} questions based on the following text. 

Text: "${fileContent.substring(0, 8000)}"

IMPORTANT: You must return ONLY a valid JSON array with this EXACT format, no additional text or markdown:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "explanation": "Brief explanation here"
  }
]

CRITICAL REQUIREMENTS:
1. Return ONLY the JSON array, no additional text
2. No markdown formatting
3. No code blocks
4. Valid JSON syntax
5. Exactly ${numQuestions} questions
6. Each question must have id, question, options (A-D), correctAnswer, and explanation`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.8,
          top_p: 0.9,
        });

        const content = response.choices[0].message.content.trim();
        console.log('🤖 OpenAI document response received');
        console.log('🤖 Raw OpenAI response:', content);
        
        let quizData;
        try {
          quizData = JSON.parse(content);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          console.error('Failed to parse content:', content);
          throw new Error('Failed to parse AI response');
        }
        
        if (!Array.isArray(quizData) || quizData.length === 0) {
          throw new Error('Invalid quiz format received from OpenAI');
        }

        // Ensure we have the correct number of questions
        if (quizData.length !== numQuestions) {
          console.warn(`Expected ${numQuestions} questions, got ${quizData.length}`);
          while (quizData.length < numQuestions) {
            quizData.push({
              id: quizData.length + 1,
              question: `Additional question ${quizData.length + 1} based on the uploaded document content`,
              options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
              correctAnswer: "A",
              explanation: "Explanation for the correct answer"
            });
          }
        }

        console.log(`✅ Successfully generated ${quizData.length} questions from document`);
        
        res.json({ 
          quiz: quizData,
          success: true,
          message: 'Quiz generated successfully from document!'
        });

      } catch (aiError) {
        console.error('❌ AI generation error:', aiError);
        res.status(500).json({ 
          error: 'Failed to generate quiz from document',
          success: false 
        });
      }
      
    } else {
      // Handle JSON request (topic-based quiz) - KEPT UNCHANGED
      const { topic, difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5 } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required for topic-based quiz generation' });
      }

      console.log(`🧠 Generating quiz from topic: ${topic}`);
      
      // Enhanced randomization for variety while maintaining accuracy
      const variations = [
        "Focus on practical applications and real-world scenarios",
        "Emphasize fundamental concepts and key facts", 
        "Include historical context and timeline",
        "Focus on achievements and contributions",
        "Emphasize lesser-known facts and details",
        "Include comparative questions with related topics",
        "Focus on impact and significance",
        "Emphasize specific events and milestones",
        "Include analytical and critical thinking questions",
        "Focus on common knowledge and trivia"
      ];
      
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      const timeSeed = Date.now() % 1000;
      
      console.log(`🎲 Topic variation: ${randomVariation}`);
      
      const prompt = `You are a precise quiz generator for educational competitions. Create exactly ${numQuestions} ${difficulty} difficulty ${quizType} questions about the topic: "${topic}".

CRITICAL INSTRUCTIONS:
1. The topic is: "${topic}" - interpret this LITERALLY and ACCURATELY
2. If "${topic}" sounds like a person's name (e.g., Gavaskar, Gavasker), it IS a person - create questions about that person
3. DO NOT confuse names with medical/scientific terms (e.g., "Gavaskar/Gavasker" = Indian cricket legend Sunil Gavaskar, NOT gastroenterology)
4. If the topic is ambiguous, choose the most famous/well-known interpretation
5. ${randomVariation}
6. Generate DIFFERENT questions each time - avoid repetition
7. All questions must be factually accurate and directly related to "${topic}"
8. Randomization seed: ${timeSeed}

Return ONLY a valid JSON array with this EXACT format:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "explanation": "Brief explanation here"
  }
]

CRITICAL: Return ONLY the JSON array, no additional text, no markdown formatting.`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: "You are a precise educational quiz generator. Always interpret topics correctly and never confuse similar-sounding words. Create accurate, factual questions with variety. Each generation should produce different questions on the same topic for practice purposes." 
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.8,  // Higher temperature for variety in questions
          top_p: 0.9,
        });

        const content = response.choices[0].message.content.trim();
        console.log('🤖 OpenAI topic response received');
        
        let quizData;
        try {
          quizData = JSON.parse(content);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          // Retry with simpler prompt
          const retryPrompt = `Create exactly ${numQuestions} multiple choice questions about "${topic}":
          Generate ${numQuestions} questions as JSON array.`;
          
          const retryCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: retryPrompt }],
            model: "gpt-4o-mini",
            temperature: 0.3,
          });
          
          try {
            quizData = JSON.parse(retryCompletion.choices[0].message.content);
          } catch (retryParseError) {
            console.error('Retry parsing also failed:', retryParseError);
            throw new Error('Failed to parse AI response');
          }
        }
        
        if (!Array.isArray(quizData) || quizData.length === 0) {
          throw new Error('Invalid quiz format received from OpenAI');
        }

        // Ensure we have the correct number of questions
        if (quizData.length !== numQuestions) {
          console.warn(`Expected ${numQuestions} questions, got ${quizData.length}`);
          while (quizData.length < numQuestions) {
            quizData.push({
              id: quizData.length + 1,
              question: `Additional question ${quizData.length + 1} about ${topic}`,
              options: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
              correctAnswer: "A",
              explanation: "Explanation for the correct answer"
            });
          }
        }

        console.log(`✅ Successfully generated ${quizData.length} questions from topic`);
        
        res.json({ 
          quiz: quizData,
          success: true,
          message: 'Quiz generated successfully from topic!'
        });

      } catch (aiError) {
        console.error('❌ AI generation error:', aiError);
        res.status(500).json({ 
          error: 'Failed to generate quiz from topic',
          success: false 
        });
      }
    }
  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({ error: "Failed to generate quiz." });
  }
});

exports.generateQuizFromTopic = onRequest({ secrets: [openaiApiKey], region: 'us-central1' }, async (req, res) => {
  await handleCors(req, res);
  try {
    const openai = new OpenAI({ apiKey: getOpenAIKey() });
    const { topic, difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5 } = req.body;
    
    const prompt = `Generate a ${numQuestions}-question ${difficulty} difficulty ${quizType} quiz on the topic: ${topic}. 
    Format the response as a JSON array with the following structure:
    [
      {
        "id": 1,
        "question": "Question text here",
        "options": {
          "A": "Option A",
          "B": "Option B", 
          "C": "Option C",
          "D": "Option D"
        },
        "correctAnswer": "A",
        "explanation": "Explanation for the correct answer"
      }
    ]`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    // Parse the response as JSON
    let quizData;
    try {
      quizData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // If parsing fails, create a simple quiz structure
      quizData = [
        {
          id: 1,
          question: `Sample question about ${topic}`,
          options: {
            A: "Option A",
            B: "Option B", 
            C: "Option C",
            D: "Option D"
          },
          correctAnswer: "A",
          explanation: "Sample explanation"
        }
      ];
    }

    const quizId = uuidv4();
    const quiz = {
      id: quizId,
      topic,
      questions: quizData,
      createdAt: new Date(),
    };

    quizHistory.push(quiz);
    res.status(200).json({ quizId, quiz });
  } catch (error) {
    console.error("Error in generateQuizFromTopic:", error);
    res.status(500).json({ error: "Failed to generate quiz from topic." });
  }
});

exports.getQuizHistory = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    res.status(200).json(quizHistory);
  });
});

exports.getQuizById = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    const { id } = req.query;
    const quiz = quizHistory.find(q => q.id === id);
    if (quiz) {
      res.status(200).json(quiz);
    } else {
      res.status(404).json({ error: "Quiz not found." });
    }
  });
});

exports.saveQuizHistory = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    const quiz = req.body;
    quizHistory.push(quiz);
    res.status(200).json({ message: "Quiz saved." });
  });
});

exports.updateQuizCompletion = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    const { id } = req.body;
    const quiz = quizHistory.find(q => q.id === id);
    if (quiz) {
      quiz.completed = true;
      res.status(200).json({ message: "Quiz marked as completed." });
    } else {
      res.status(404).json({ error: "Quiz not found." });
    }
  });
});

exports.deleteQuiz = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    const { id } = req.body;
    const index = quizHistory.findIndex(q => q.id === id);
    if (index !== -1) {
      quizHistory.splice(index, 1);
      res.status(200).json({ message: "Quiz deleted." });
    } else {
      res.status(404).json({ error: "Quiz not found." });
    }
  });
});

exports.testCors = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    res.status(200).json({ 
      message: "CORS test successful",
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  });
});

exports.healthCheck = onRequest({ region: 'us-central1' }, (req, res) => {
  handleCors(req, res, (req, res) => {
    res.status(200).json({ status: "OK" });
  });
});

// Generate competition quiz with multi-subject distribution
exports.generateCompetitionQuiz = onRequest({ secrets: [openaiApiKey], region: 'us-central1' }, async (req, res) => {
  await handleCors(req, res);
  
  try {
    const openai = new OpenAI({ apiKey: getOpenAIKey() });
    const { subjects, difficulty = 'medium', gradeLevels = ['9', '10', '11', '12'] } = req.body;
    
    if (!subjects) {
      return res.status(400).json({ error: 'Subject distribution is required' });
    }

    console.log('🎓 Generating competition quiz with distribution:', subjects);
    
    const subjectPrompts = [];
    
    // English questions
    if (subjects.english > 0) {
      subjectPrompts.push({
        subject: 'English',
        count: subjects.english,
        topics: `English Language Arts for grades ${gradeLevels.join(', ')}: grammar, literature analysis, reading comprehension, vocabulary, writing techniques`
      });
    }
    
    // Mathematics questions
    if (subjects.mathematics > 0) {
      subjectPrompts.push({
        subject: 'Mathematics',
        count: subjects.mathematics,
        topics: 'Algebra II, Geometry, and Math Analysis/Pre-Calculus: equations, functions, trigonometry, geometric proofs, calculus concepts'
      });
    }
    
    // Science questions
    if (subjects.science > 0) {
      subjectPrompts.push({
        subject: 'Science',
        count: subjects.science,
        topics: 'Biology, Chemistry, and Physics: cell biology, chemical reactions, atomic structure, forces and motion, energy'
      });
    }
    
    // Social Studies questions
    if (subjects.socialStudies > 0) {
      subjectPrompts.push({
        subject: 'Social Studies',
        count: subjects.socialStudies,
        topics: 'Virginia & U.S. History, Virginia & U.S. Government, World History & Geography II: historical events, government structure, geography, civics'
      });
    }
    
    // Health & Wellness questions
    if (subjects.healthWellness > 0) {
      subjectPrompts.push({
        subject: 'Health & Wellness',
        count: subjects.healthWellness,
        topics: 'Health and Wellness for grades 9-10: nutrition, physical fitness, mental health, personal safety'
      });
    }

    const totalQuestions = Object.values(subjects).reduce((a, b) => a + b, 0);
    
    const prompt = `You are creating a scholarship competition quiz for high school students (grades ${gradeLevels.join('-')}).

Generate EXACTLY ${totalQuestions} ${difficulty} difficulty multiple-choice questions with this EXACT distribution:

${subjectPrompts.map(sp => `- ${sp.count} questions on ${sp.subject}: ${sp.topics}`).join('\n')}

CRITICAL REQUIREMENTS:
1. Questions must be appropriate for grades ${gradeLevels.join('-')}
2. Mix difficulty within ${difficulty} level (some easier, some harder)
3. Questions should test knowledge, not trick students
4. All questions must be factually accurate
5. Distribute questions evenly across the topics within each subject
6. Number questions sequentially from 1 to ${totalQuestions}

Return ONLY a valid JSON array with this EXACT format:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "A": "Option A text",
      "B": "Option B text", 
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "explanation": "Brief explanation of why this is correct"
  }
]

CRITICAL: Return ONLY the JSON array, no additional text, no markdown formatting, no code blocks.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an expert educational quiz generator for high school scholarship competitions. Create accurate, fair, and well-distributed questions across multiple subjects." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content.trim();
      console.log('🤖 OpenAI competition quiz response received');
      
      let quizData;
      try {
        // Remove markdown code blocks if present
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        quizData = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Failed to parse content:', content);
        throw new Error('Failed to parse AI response');
      }
      
      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error('Invalid quiz format received from OpenAI');
      }

      // Validate we have the correct number of questions
      if (quizData.length !== totalQuestions) {
        console.warn(`Expected ${totalQuestions} questions, got ${quizData.length}`);
      }

      console.log(`✅ Successfully generated ${quizData.length} competition questions`);
      
      res.json({ 
        quiz: quizData,
        success: true,
        message: 'Competition quiz generated successfully!',
        distribution: subjects
      });

    } catch (aiError) {
      console.error('❌ AI generation error:', aiError);
      res.status(500).json({ 
        error: 'Failed to generate competition quiz',
        success: false 
      });
    }
  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({ error: "Failed to generate competition quiz." });
  }
});

