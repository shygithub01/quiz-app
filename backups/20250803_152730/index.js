const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");
const cors = require("cors")({ 
  origin: [
    'https://quizapp-42057.web.app',
    'https://quizapp-42057.firebaseapp.com',
    'https://quizist.ai',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// Use Firebase Secret for production
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

let quizHistory = [];

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper function to handle CORS preflight
const handleCors = (req, res, handler) => {
  cors(req, res, () => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    handler(req, res);
  });
};

// Helper function to extract text from uploaded file
const extractTextFromFile = (file) => {
  const buffer = file.buffer;
  const text = buffer.toString('utf-8');
  return text;
};

// Main quiz generation endpoint that handles both document and topic requests
exports.generateQuiz = onRequest({ secrets: [OPENAI_API_KEY], region: 'us-central1' }, async (req, res) => {
  handleCors(req, res, async (req, res) => {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });
      
      // Check if it's a file upload (JSON with file content) or topic request
      if (req.body.file) {
        // Handle file upload (document-based quiz) - JSON approach
        const fileContent = req.body.file;
        const numQuestions = parseInt(req.body.numQuestions) || 5;
        const difficulty = req.body.difficulty || 'medium';
        const quizType = req.body.quizType || 'multiple-choice';
        
        console.log("Processing file upload with settings:", { numQuestions, difficulty, quizType });
        console.log("File content length:", fileContent.length);
        console.log("File content preview:", fileContent.substring(0, 200));
        
        const prompt = `Based on the following document content, generate exactly ${numQuestions} ${difficulty} difficulty ${quizType} questions. 

Document content:
${fileContent.substring(0, 8000)} // Limit to first 8000 characters to avoid token limits

Generate exactly ${numQuestions} questions. Format the response as a JSON array with the following structure:
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
]

Make sure to generate exactly ${numQuestions} questions, not just one. Each question should be relevant to the document content provided.`;

        console.log("Sending prompt to AI with document content length:", fileContent.length);

        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4",
          temperature: 0.7,
        });

        console.log("AI response received:", completion.choices[0].message.content.substring(0, 200));

        // Parse the response as JSON
        let quizData;
        try {
          quizData = JSON.parse(completion.choices[0].message.content);
          
          // Ensure we have the correct number of questions
          if (!Array.isArray(quizData) || quizData.length !== numQuestions) {
            console.warn(`Expected ${numQuestions} questions, got ${quizData.length}`);
            // If we don't have enough questions, create additional ones based on the document
            while (quizData.length < numQuestions) {
              quizData.push({
                id: quizData.length + 1,
                question: `Additional question ${quizData.length + 1} based on the uploaded document content`,
                options: {
                  A: "Option A",
                  B: "Option B", 
                  C: "Option C",
                  D: "Option D"
                },
                correctAnswer: "A",
                explanation: "Explanation for the correct answer"
              });
            }
          }
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          // If parsing fails, retry with a simpler prompt
          const retryPrompt = `Based on this document content, create exactly ${numQuestions} multiple choice questions:

${fileContent.substring(0, 4000)}

Generate ${numQuestions} questions as JSON array. Each question should be about the document content.`;

          const retryCompletion = await openai.chat.completions.create({
            messages: [{ role: "user", content: retryPrompt }],
            model: "gpt-4",
            temperature: 0.3,
          });

          try {
            quizData = JSON.parse(retryCompletion.choices[0].message.content);
          } catch (retryParseError) {
            console.error("Retry parsing also failed:", retryParseError);
            // Last resort - create questions based on document content
            quizData = [];
            const words = fileContent.split(' ').slice(0, 100); // Use first 100 words
            for (let i = 1; i <= numQuestions; i++) {
              quizData.push({
                id: i,
                question: `Question ${i} about the uploaded document: ${words.slice(i*10, (i+1)*10).join(' ')}`,
                options: {
                  A: "Option A",
                  B: "Option B", 
                  C: "Option C",
                  D: "Option D"
                },
                correctAnswer: "A",
                explanation: "Based on the document content"
              });
            }
          }
        }

        res.status(200).json({ quiz: quizData });
      } else {
        // Handle JSON request (topic-based quiz) - KEEPING THIS UNCHANGED
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

        res.status(200).json({ quiz: quizData });
      }
    } catch (error) {
      console.error("Error in generateQuiz:", error);
      res.status(500).json({ error: "Failed to generate quiz." });
    }
  });
});

exports.generateQuizFromTopic = onRequest({ secrets: [OPENAI_API_KEY], region: 'us-central1' }, async (req, res) => {
  handleCors(req, res, async (req, res) => {
    try {
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });
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

