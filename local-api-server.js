import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local', debug: true });

const app = express();
const PORT = 3001;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory storage for quiz history
let quizHistory = [];

// Randomization helper functions
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleQuestionOptions(question) {
  const optionKeys = ['A', 'B', 'C', 'D'];
  const optionValues = optionKeys.map(key => question.options[key]);
  const correctAnswerValue = question.options[question.correctAnswer];
  
  // Shuffle the option values
  const shuffledValues = shuffleArray(optionValues);
  
  // Rebuild options object with shuffled values
  const newOptions = {};
  const newCorrectAnswer = optionKeys[shuffledValues.indexOf(correctAnswerValue)];
  
  optionKeys.forEach((key, index) => {
    newOptions[key] = shuffledValues[index];
  });
  
  return {
    ...question,
    options: newOptions,
    correctAnswer: newCorrectAnswer
  };
}

// Test OpenAI connection
async function testOpenAIConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 10
    });
    console.log('🤖 OpenAI: ✅ Connected');
    return true;
  } catch (error) {
    console.log('🤖 OpenAI: ❌ Connection failed:', error.message);
    return false;
  }
}

// Robust JSON parsing function
function parseQuizJSON(content) {
  try {
    // First, try direct parsing
    const quizData = JSON.parse(content);
    console.log('✅ JSON parsed successfully');
    return quizData;
  } catch (error) {
    console.log('🔧 Attempting to fix JSON formatting...');
    
    try {
      // Clean up common JSON issues
      let cleanedContent = content
        .replace(/```json\s*/g, '')  // Remove markdown code blocks
        .replace(/```\s*/g, '')      // Remove markdown code blocks
        .replace(/,\s*}/g, '}')      // Remove trailing commas in objects
        .replace(/,\s*]/g, ']')      // Remove trailing commas in arrays
        .replace(/([A-D]):/g, '"$1":') // Fix unquoted option keys
        .replace(/"\s*:/g, '":')     // Fix spaces before colons
        .replace(/\n/g, ' ')         // Remove line breaks
        .replace(/\s+/g, ' ')        // Normalize whitespace
        .trim();

      const quizData = JSON.parse(cleanedContent);
      console.log('✅ JSON formatting fixed and parsed successfully!');
      return quizData;
    } catch (secondError) {
      console.error('❌ JSON parsing failed:', secondError.message);
      console.error('❌ Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse quiz data from OpenAI response');
    }
  }
}

// Generate quiz from document with full randomization
async function generateQuizFromDocument(text, difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5) {
  console.log('🧠 Generating quiz from document...');
  
  // Add randomization for document-based quizzes
  const documentFocus = [
    "key concepts and main ideas",
    "specific details and examples", 
    "cause and effect relationships",
    "comparisons and contrasts",
    "practical applications mentioned",
    "underlying principles and theories",
    "important facts and figures",
    "chronological events and sequences"
  ];
  
  const randomFocus = documentFocus[Math.floor(Math.random() * documentFocus.length)];
  const timeSeed = Date.now() % 1000;
  
  console.log(`🎲 Document focus: ${randomFocus}`);
  
  const prompt = `Create exactly ${numQuestions} ${difficulty} difficulty ${quizType} questions based on the following text. 

Focus particularly on: ${randomFocus}
Randomization Seed: ${timeSeed}

Text: "${text}"

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
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
      top_p: 0.9,
    });

    const content = response.choices[0].message.content.trim();
    console.log('🤖 OpenAI document response received');
    
    let quizData = parseQuizJSON(content);
    
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error('Invalid quiz format received from OpenAI');
    }

    // Apply post-generation randomization
    console.log('🎲 Applying post-generation randomization...');
    
    // Shuffle answer options and questions
    quizData = quizData.map(question => shuffleQuestionOptions(question));
    quizData = shuffleArray(quizData);
    quizData = quizData.map((question, index) => ({
      ...question,
      id: index + 1
    }));

    console.log(`✅ Successfully generated ${quizData.length} randomized questions from document`);
    return quizData;

  } catch (error) {
    console.error('❌ OpenAI document API error:', error);
    throw error;
  }
}

// Generate quiz from topic with full randomization
async function generateQuizFromTopic(topic, difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5) {
  console.log(`🧠 Generating quiz from topic: ${topic}`);
  
  // Enhanced randomization strategies
  const variations = [
    "Focus on practical applications and real-world scenarios",
    "Emphasize fundamental concepts and principles", 
    "Include recent developments and current trends",
    "Focus on problem-solving and analytical thinking",
    "Emphasize cause-and-effect relationships",
    "Include comparative analysis between different approaches",
    "Focus on historical context and timeline",
    "Emphasize key figures and their contributions",
    "Include interconnections with other related topics",
    "Focus on common misconceptions and clarifications"
  ];
  
  const questionStyles = [
    "analytical and thought-provoking",
    "factual and knowledge-based", 
    "application-focused and practical",
    "conceptual and theoretical",
    "comparative and contrastive"
  ];
  
  const randomVariation = variations[Math.floor(Math.random() * variations.length)];
  const randomStyle = questionStyles[Math.floor(Math.random() * questionStyles.length)];
  
  // Add timestamp-based seed for extra randomness
  const timeSeed = Date.now() % 1000;
  
  console.log(`🎲 Random variation: ${randomVariation}`);
  console.log(`🎨 Question style: ${randomStyle}`);

  const prompt = `Create exactly ${numQuestions} ${difficulty} difficulty ${quizType} questions about: ${topic}

Primary Focus: ${randomVariation}
Question Style: Make questions ${randomStyle}
Randomization Seed: ${timeSeed}

IMPORTANT: Generate unique, varied questions that avoid repetitive patterns. Each question should test different aspects of the topic.

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
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.9, // Increased for more randomness
      top_p: 0.95,      // Add top_p for additional randomness
    });

    const content = response.choices[0].message.content.trim();
    console.log('🤖 OpenAI topic response received');
    
    let quizData = parseQuizJSON(content);
    
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error('Invalid quiz format received from OpenAI');
    }

    // Apply post-generation randomization
    console.log('🎲 Applying post-generation randomization...');
    
    // 1. Shuffle answer options for each question
    quizData = quizData.map(question => shuffleQuestionOptions(question));
    
    // 2. Shuffle the order of questions
    quizData = shuffleArray(quizData);
    
    // 3. Reassign sequential IDs after shuffling
    quizData = quizData.map((question, index) => ({
      ...question,
      id: index + 1
    }));

    console.log(`✅ Successfully generated ${quizData.length} randomized questions from topic`);
    return quizData;

  } catch (error) {
    console.error('❌ OpenAI topic API error:', error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Helper function to find existing quiz - UPDATED WITH FORCE NEW LOGIC
function findExistingQuiz(fileName, content, topic, settings, forceNew = false) {
  // FIXED: If forceNew is true, always return null to create new quiz
  if (forceNew) {
    console.log('🆕 Force new quiz requested - skipping existing quiz check');
    return null;
  }
  
  return quizHistory.find(quiz => {
    // For documents: match by filename and content preview
    if (fileName && quiz.fileName === fileName) {
      const existingContentPreview = quiz.originalContent?.substring(0, 200) || '';
      const newContentPreview = content?.substring(0, 200) || '';
      return existingContentPreview === newContentPreview;
    }
    
    // For topics: match by topic AND all settings (difficulty, quizType, numQuestions)
    if (topic && quiz.topic === topic && quiz.type === 'topic' && settings) {
      return (
        quiz.settings.difficulty === settings.difficulty &&
        quiz.settings.quizType === settings.quizType &&
        quiz.settings.numQuestions === settings.numQuestions
      );
    }
    
    return false;
  });
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'Quiz API Server'
  });
});

// Generate quiz from uploaded document
app.post('/api/generate-quiz', upload.single('file'), async (req, res) => {
  try {
    console.log('📄 Document quiz request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', success: false });
    }

    const { difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5, forceNew = false } = req.body;
    const file = req.file;
    
    console.log(`📋 Quiz settings: ${difficulty} difficulty, ${quizType}, ${numQuestions} questions, forceNew: ${forceNew}`);

    let text = '';
    
    // Process different file types
    if (file.mimetype === 'text/plain') {
      text = fs.readFileSync(file.path, 'utf8');
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Unsupported file type. Please upload .txt or .docx files.', success: false });
    }

    if (!text.trim()) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'The uploaded document appears to be empty.', success: false });
    }

    console.log(`📄 Document processed: ${text.length} characters`);

    // Check for existing quiz with same document
    const existingQuiz = findExistingQuiz(file.originalname, text, null, null, forceNew === 'true');
    
    if (existingQuiz) {
      console.log('🔄 Found existing quiz for this document, updating...');
      existingQuiz.quiz = await generateQuizFromDocument(text, difficulty, quizType, numQuestions);
      existingQuiz.settings = { difficulty, quizType, numQuestions };
      existingQuiz.lastUpdated = new Date().toISOString();
      
      fs.unlinkSync(file.path);
      return res.json({
        quiz: existingQuiz.quiz,
        quizId: existingQuiz.id,
        success: true,
        message: 'Quiz updated with new randomized questions!'
      });
    }

    // Generate new quiz
    const quiz = await generateQuizFromDocument(text, difficulty, quizType, numQuestions);
    
    // Store in history
    const quizId = Date.now().toString();
    const quizEntry = {
      id: quizId,
      fileName: file.originalname,
      originalContent: text.substring(0, 1000),
      quiz,
      settings: { difficulty, quizType, numQuestions },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'document'
    };
    
    quizHistory.unshift(quizEntry);
    
    // Keep only last 100 quizzes
    if (quizHistory.length > 100) {
      quizHistory = quizHistory.slice(0, 100);
    }

    console.log(`✅ Quiz generated and stored with ID: ${quizId}`);
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    res.json({ 
      quiz,
      quizId,
      success: true,
      message: 'Quiz generated successfully with full randomization!'
    });

  } catch (error) {
    console.error('❌ Error generating document quiz:', error);
    
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to generate quiz', 
      details: error.message,
      success: false
    });
  }
});

// Generate quiz from topic - FIXED: Proper same quiz detection
app.post('/api/generate-quiz-from-topic', async (req, res) => {
  try {
    console.log('🧠 Topic quiz request received');
    console.log('📥 Request body:', req.body);
    
    const { topic, difficulty = 'medium', quizType = 'multiple-choice', numQuestions = 5, forceNew = false } = req.body;
    
    console.log('🎯 Topic details:', { topic, difficulty, quizType, numQuestions, forceNew });

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic is required', success: false });
    }

    const settings = { difficulty, quizType, numQuestions: parseInt(numQuestions) };
    
    // Check for existing quiz with same topic AND settings
    const existingQuiz = findExistingQuiz(null, null, topic.trim(), settings, forceNew);
    
    if (existingQuiz) {
      console.log('🔄 Found existing quiz for same topic+settings, updating...');
      existingQuiz.quiz = await generateQuizFromTopic(topic.trim(), difficulty, quizType, parseInt(numQuestions));
      existingQuiz.settings = settings;
      existingQuiz.lastUpdated = new Date().toISOString();
      
      return res.json({
        quiz: existingQuiz.quiz,
        quizId: existingQuiz.id,
        success: true,
        message: 'Quiz updated with new randomized questions!'
      });
    }

    // Generate new quiz for unique topic+settings combination
    const quiz = await generateQuizFromTopic(topic.trim(), difficulty, quizType, parseInt(numQuestions));
    
    // Store as new entry
    const quizId = Date.now().toString();
    const quizEntry = {
      id: quizId,
      topic: topic.trim(),
      quiz,
      settings,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'topic'
    };
    
    quizHistory.unshift(quizEntry);
    
    // Keep only last 100 quizzes
    if (quizHistory.length > 100) {
      quizHistory = quizHistory.slice(0, 100);
    }

    console.log(`✅ NEW topic quiz saved with ID: ${quizId}`);
    console.log(`📊 Total quizzes in history: ${quizHistory.length}`);
    
    res.json({ 
      quiz,
      quizId,
      success: true,
      message: 'New quiz generated and saved to history!'
    });

  } catch (error) {
    console.error('❌ Error generating topic quiz:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz', 
      details: error.message,
      success: false
    });
  }
});

// FIXED: Get quiz history with score data
app.get('/api/quiz-history', (req, res) => {
  try {
    const history = quizHistory.map(quiz => ({
      id: quiz.id,
      title: quiz.fileName || quiz.topic,
      type: quiz.type || 'document',
      settings: quiz.settings || {
        difficulty: 'medium',
        quizType: 'multiple-choice', 
        numQuestions: quiz.numQuestions || 5
      },
      createdAt: quiz.createdAt,
      lastUpdated: quiz.lastUpdated,
      questionCount: quiz.quiz?.length || quiz.questions?.length || 0,
      // ADD SCORE DATA:
      score: quiz.score || null,
      completedAt: quiz.completedAt || null,
      hasBeenTaken: !!(quiz.score !== undefined && quiz.completedAt)
    }));
    
    console.log('🔍 DEBUG - Raw quizHistory:', JSON.stringify(quizHistory, null, 2));
    console.log('🔍 DEBUG - Mapped history:', JSON.stringify(history, null, 2));
    
    res.json(history);
  } catch (error) {
    console.error('❌ Error fetching quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// Get specific quiz by ID
app.get('/api/quiz-history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quiz = quizHistory.find(q => q.id === id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('❌ Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Save quiz to history
app.post('/api/quiz-history', (req, res) => {
  try {
    const quizData = req.body;
    const quizId = Date.now().toString();
    
    const quizEntry = {
      id: quizId,
      ...quizData,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    quizHistory.unshift(quizEntry);
    
    // Keep only last 100 quizzes
    if (quizHistory.length > 100) {
      quizHistory = quizHistory.slice(0, 100);
    }
    
    res.json({ success: true, id: quizId });
  } catch (error) {
    console.error('❌ Error saving quiz history:', error);
    res.status(500).json({ error: 'Failed to save quiz history' });
  }
});

// UPDATE quiz with completion data (PUT endpoint)
app.put('/api/quiz-history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { answers, score, completedAt } = req.body;
    
    console.log(`📝 Updating quiz ${id} with completion data`);
    
    const quizIndex = quizHistory.findIndex(q => q.id === id);
    
    if (quizIndex === -1) {
      console.log(`❌ Quiz ${id} not found`);
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Update the existing quiz with completion data
    quizHistory[quizIndex] = {
      ...quizHistory[quizIndex],
      answers,
      score,
      completedAt,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`✅ Quiz ${id} updated with completion data (score: ${score})`);
    console.log(`📊 Total quizzes in history: ${quizHistory.length}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete quiz from history
app.delete('/api/quiz-history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = quizHistory.findIndex(q => q.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    quizHistory.splice(index, 1);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log('\n🚀 LOCAL API SERVER STARTED');
  console.log(`📍 Server: http://localhost:${PORT}`);
  
  await testOpenAIConnection();
  
  console.log('📄 Supported: .txt, .docx files + Topics');
  console.log('✅ Features: Document + Topic quiz generation + FULL RANDOMIZATION');
  console.log('🔄 Frontend: http://localhost:5173');
  console.log('💾 Note: Quiz history stored in memory');
  console.log('🎲 Randomization: Questions shuffled, options shuffled, topics varied!');
  console.log('🔧 History Logic: Same topic+settings=REPLACE, Different=SAVE separately');
  console.log('🆕 NEW: PUT /api/quiz-history/:id for updating quiz completion data');
  console.log('🏆 SCORE TRACKING: Quiz history now includes scores and completion status');
  console.log('🆕 FIXED: forceNew parameter to create brand new quizzes');
  console.log('');
});
