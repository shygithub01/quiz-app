"use client";
import { useState } from "react";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

interface Question {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: string;
  explanation?: string;
}

interface UserAnswer {
  questionId: number;
  selectedAnswer: string;
}

export default function App() {
  const { isSignedIn, user, isLoaded } = useUser();
  
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Quiz states
  const [fullQuizData, setFullQuizData] = useState<Question[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Parse quiz text into structured data
  const parseQuizText = (quizText: string): Question[] => {
    const questions: Question[] = [];
    const questionBlocks = quizText.split(/Q\d+:/);
    
    questionBlocks.forEach((block, index) => {
      if (index === 0 || !block.trim()) return;
      
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 6) return;
      
      const questionText = lines[0].trim();
      const options = { A: '', B: '', C: '', D: '' };
      let correctAnswer = '';
      let explanation = '';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('A.')) options.A = trimmedLine.substring(2).trim();
        else if (trimmedLine.startsWith('B.')) options.B = trimmedLine.substring(2).trim();
        else if (trimmedLine.startsWith('C.')) options.C = trimmedLine.substring(2).trim();
        else if (trimmedLine.startsWith('D.')) options.D = trimmedLine.substring(2).trim();
        else if (trimmedLine.startsWith('Answer:')) correctAnswer = trimmedLine.substring(7).trim();
        else if (trimmedLine.startsWith('Explanation:')) explanation = trimmedLine.substring(12).trim();
      });
      
      if (questionText && options.A && options.B && options.C && options.D && correctAnswer) {
        questions.push({
          id: index,
          question: questionText,
          options,
          correctAnswer,
          explanation
        });
      }
    });
    
    return questions;
  };

  // File upload and quiz generation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // ADD FILE SIZE CHECK HERE:
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File too large! Please choose a smaller file (max 5MB). Mobile photos are often very large - try compressing the image first.");
        e.target.value = ''; // Clear the input
        return;
      }
      setFile(selectedFile);
      setError("");
      resetQuiz();
    }
  };

  // Complete reset function for "Upload new document"
  const resetAll = () => {
    setFile(null);
    setFullQuizData([]);
    setCurrentQuiz([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
    setError("");
    setLoading(false);
    setUploadProgress(0);
    setNumQuestions(5);
    
    setTimeout(() => {
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }, 100);
  };

  // Reset quiz for retake (keep file and data)
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);
    resetQuiz();

    // ADD THIS FOR BETTER MOBILE FEEDBACK:
    if (file.size > 1024 * 1024) { // If file is larger than 1MB
      setError("Processing large file... This may take a moment, especially for high-resolution mobile photos. Please wait...");
      // Clear this "error" after a moment since it's really just info
      setTimeout(() => setError(""), 2000);
    }
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const parsedQuestions = parseQuizText(data.quiz);
      
      if (parsedQuestions.length === 0) {
        throw new Error("No valid questions could be parsed from the generated quiz");
      }
      
      setFullQuizData(parsedQuestions);
      startQuiz(parsedQuestions);
      
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Quiz functionality
  const startQuiz = (questions: Question[]) => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, numQuestions);
    setCurrentQuiz(selectedQuestions);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
  };

  const retakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
  };

  const selectAnswer = (answer: string) => {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const newAnswers = userAnswers.filter(a => a.questionId !== currentQuestion.id);
    newAnswers.push({ questionId: currentQuestion.id, selectedAnswer: answer });
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Results calculation
  const calculateScore = () => {
    let correct = 0;
    currentQuiz.forEach(question => {
      const userAnswer = userAnswers.find(a => a.questionId === question.id);
      if (userAnswer && userAnswer.selectedAnswer === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const currentQuestion = currentQuiz[currentQuestionIndex];
  const currentUserAnswer = currentQuestion ? userAnswers.find(a => a.questionId === currentQuestion.id) : null;

  return (
    <div className="container">
      {/* CONSISTENT HEADER FOR ALL SCREENS */}
      <header className="header">
        <div className="header-left">
          <h1>🧠 AI Quiz Generator</h1>
          <span className="tagline">Transform your documents into interactive quizzes</span>
        </div>
        {isSignedIn && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
            <SignOutButton redirectUrl="/">
              <button className="signout-btn">🚪 Sign Out</button>
            </SignOutButton>
          </div>
        )}
      </header>

      <main className="main-content">
        {/* LOADING STATE */}
        {!isLoaded && (
          <div className="center-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        )}

        {/* AUTH GATE - MATCHES MAIN APP DESIGN */}
        {isLoaded && !isSignedIn && (
          <div className="center-content">
            <div className="auth-card">
              <h2>Welcome to AI Quiz Generator</h2>
              <p>Create interactive quizzes from your documents using AI</p>
              
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">📄</span>
                  <span>Upload PDF, DOCX, TXT, or Images</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🤖</span>
                  <span>AI-powered question generation</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Interactive quiz experience</span>
                </div>
              </div>
              
              <SignInButton mode="modal">
                <button className="signin-btn">
                  🚀 Get Started - Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        )}

        {/* MAIN APP CONTENT */}
        {isLoaded && isSignedIn && (
          <>
            {/* Upload Section */}
            {!currentQuiz.length && !showResults && (
              <div className="center-content">
                <div className="upload-card">
                  <h2>📄 Upload Your Document</h2>
                  <p>Upload a document and we'll generate quiz questions from its content</p>
                  
                  <form onSubmit={handleSubmit} className="upload-form">
                    <div className="file-input-container">
                      <label htmlFor="file-upload" className="file-label">
                        {file ? (
                          <>
                            <span className="file-icon">📎</span>
                            <span className="file-details">
                              <strong>{file.name}</strong>
                              <small>({(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="upload-icon">📁</span>
                            <span>Choose a File</span>
                          </>
                        )}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                        className="file-input"
                        disabled={loading}
                      />
                    </div>

                    <div className="questions-selector">
                      <label htmlFor="numQuestions">Number of Questions:</label>
                      <select
                        id="numQuestions"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        disabled={loading}
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={7}>7 Questions</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>

                    {error && (
                      <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {error}
                      </div>
                    )}

                    {loading && (
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="progress-text">
                          {uploadProgress < 100 ? "Uploading..." : "Generating quiz..."}
                        </p>
                      </div>
                    )}

                    <button type="submit" disabled={!file || loading} className="start-btn">
                      {loading ? (
                        <>
                          <span className="spinner-small"></span>
                          Generating Quiz...
                        </>
                      ) : (
                        "Start Quiz"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Quiz Section */}
            {currentQuiz.length > 0 && !showResults && currentQuestion && (
              <div className="center-content">
                <div className="quiz-card">
                  <div className="quiz-header">
                    <h2>Question {currentQuestionIndex + 1} of {currentQuiz.length}</h2>
                    <div className="progress-indicator">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="question-container">
                    <h3 className="question-text">{currentQuestion.question}</h3>
                    
                    <div className="options-container">
                      {Object.entries(currentQuestion.options).map(([key, value]) => (
                        <button
                          key={key}
                          className={`option-btn ${currentUserAnswer?.selectedAnswer === key ? 'selected' : ''}`}
                          onClick={() => selectAnswer(key)}
                        >
                          <span className="option-letter">{key}.</span>
                          <span className="option-text">{value}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="navigation-container">
                      <button 
                        onClick={prevQuestion} 
                        disabled={currentQuestionIndex === 0}
                        className="nav-btn prev-btn"
                      >
                        ← Previous
                      </button>
                      
                      <button 
                        onClick={nextQuestion} 
                        disabled={!currentUserAnswer}
                        className="nav-btn next-btn"
                      >
                        {currentQuestionIndex === currentQuiz.length - 1 ? 'Finish Quiz' : 'Next →'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {showResults && (
              <div className="center-content">
                <div className="results-card">
                  <h2>Quiz Results</h2>
                  <div className="score-display">
                    <span className="score-text">You scored</span>
                    <span className="score-number">{calculateScore()}/{currentQuiz.length}</span>
                  </div>
                  
                  <div className="answers-review">
                    {currentQuiz.map((question, index) => {
                      const userAnswer = userAnswers.find(a => a.questionId === question.id);
                      const isCorrect = userAnswer?.selectedAnswer === question.correctAnswer;
                      
                      return (
                        <div key={question.id} className="answer-item">
                          <h4>Q{index + 1}: {question.question}</h4>
                          
                          <div className="options-review">
                            {Object.entries(question.options).map(([key, value]) => {
                              const isUserAnswer = userAnswer?.selectedAnswer === key;
                              const isCorrectAnswer = question.correctAnswer === key;
                              
                              return (
                                <div 
                                  key={key} 
                                  className={`option-review ${
                                    isCorrectAnswer ? 'correct' : 
                                    isUserAnswer && !isCorrect ? 'incorrect' : ''
                                  }`}
                                >
                                  <span className="option-letter">{key}.</span>
                                  <span className="option-text">{value}</span>
                                  {isCorrectAnswer && <span className="check-mark">✓</span>}
                                  {isUserAnswer && !isCorrect && <span className="x-mark">✗</span>}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="answer-feedback">
                            <div className="user-answer">
                              Your answer: {userAnswer?.selectedAnswer || 'Not answered'}
                            </div>
                            <div className="correct-answer">
                              Correct answer: {question.correctAnswer}
                            </div>
                            {question.explanation && (
                              <div className="explanation">
                                <strong>Explanation:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="action-buttons">
                    <button onClick={retakeQuiz} className="retake-btn">
                      Retake this quiz (same questions)
                    </button>
                    <button onClick={() => startQuiz(fullQuizData)} className="new-quiz-btn">
                      Start new quiz (different random questions)
                    </button>
                    <button onClick={resetAll} className="upload-new-btn">
                      📄 Upload new document
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style jsx>{`
        /* 🔥 NUCLEAR FIX FOR INVISIBLE TEXT */
.option-btn {
  display: flex !important;
  align-items: center !important;
  padding: 15px 20px !important;
  border: 2px solid #ddd !important;
  border-radius: 12px !important;
  background: #ffffff !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  text-align: left !important;
}

.option-btn .option-letter {
  font-weight: bold !important;
  margin-right: 15px !important;
  min-width: 20px !important;
  color: #000000 !important;
  background: transparent !important;
}

.option-btn .option-text {
  flex: 1 !important;
  color: #000000 !important;
  background: transparent !important;
  font-size: 16px !important;
}

.option-btn:hover .option-letter,
.option-btn:hover .option-text {
  color: #333333 !important;
}

.option-btn.selected {
  border-color: #667eea !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.option-btn.selected .option-letter,
.option-btn.selected .option-text {
  color: #ffffff !important;
}

        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
        }
        
        .header-left h1 {
          margin: 0;
          font-size: 2rem;
          color: white;
        }
        
        .tagline {
          font-size: 0.9rem;
          opacity: 0.9;
          margin-left: 10px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .user-name {
          font-weight: 600;
        }
        
        .signout-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 10px 20px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .signout-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .center-content {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }
        
        .loading-text {
          color: white;
          font-size: 1.1rem;
          margin-top: 20px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .auth-card, .upload-card, .quiz-card, .results-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          color: #333;
          width: 100%;
          max-width: 600px;
        }
        
        .auth-card {
          text-align: center;
        }
        
        .auth-card h2 {
          color: #333;
          margin-bottom: 15px;
          font-size: 2rem;
        }
        
        .auth-card p {
          color: #666;
          margin-bottom: 30px;
          font-size: 1.1rem;
        }
        
        .features {
          margin: 30px 0;
          text-align: left;
        }
        
        .feature {
          display: flex;
          align-items: center;
          padding: 15px 0;
          color: #555;
          border-bottom: 1px solid #eee;
        }
        
        .feature:last-child {
          border-bottom: none;
        }
        
        .feature-icon {
          font-size: 1.5rem;
          margin-right: 15px;
          width: 30px;
        }
        
        .signin-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          width: 100%;
          margin-top: 20px;
        }
        
        .signin-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .upload-card h2, .quiz-card h2, .results-card h2 {
          text-align: center;
          color: #333;
          margin-bottom: 10px;
        }
        
        .upload-card p {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
        }
        
        .file-input-container {
          margin-bottom: 20px;
        }
        
        .file-label {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          border: 3px dashed #ddd;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #fafafa;
        }
        
        .file-label:hover {
          border-color: #667eea;
          background: #f0f0ff;
        }
        
        .file-input {
          display: none;
        }
        
        .upload-icon, .file-icon {
          font-size: 2rem;
          margin-right: 15px;
        }
        
        .file-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .questions-selector {
          margin-bottom: 20px;
          text-align: center;
        }
        
        .questions-selector label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: #333;
        }
        
        .questions-selector select {
          padding: 10px 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          background: white;
          cursor: pointer;
        }
        
        .error-message {
          background: #fee;
          color: #c33;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .progress-container {
          margin-bottom: 20px;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          text-align: center;
          color: #666;
          font-size: 0.9rem;
        }
        
        .start-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .start-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .start-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .quiz-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .quiz-header h2 {
          color: #333;
          margin-bottom: 15px;
        }
        
        .progress-indicator {
          margin-bottom: 20px;
        }
        
        .question-container {
          text-align: center;
        }
        
        .question-text {
          color: #333;
          font-size: 1.3rem;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        
        .options-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .option-btn {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border: 2px solid #ddd;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }
        
        .option-btn:hover {
          border-color: #667eea;
          background: #f0f0ff;
        }
        
        .option-btn.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .option-letter {
          font-weight: bold;
          margin-right: 15px;
          min-width: 20px;
        }
        
        .option-text {
          flex: 1;
        }
        
        .navigation-container {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        
        .nav-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .prev-btn {
          background: #f5f5f5;
          color: #666;
        }
        
        .prev-btn:hover:not(:disabled) {
          background: #e5e5e5;
        }
        
        .next-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .next-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .results-card h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }
        
        .score-display {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          color: white;
        }
        
        .score-text {
          display: block;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }
        
        .score-number {
          font-size: 3rem;
          font-weight: bold;
        }
        
        .answers-review {
          margin-bottom: 40px;
        }
        
        .answer-item {
          margin-bottom: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        
        .answer-item h4 {
          color: #333;
          margin-bottom: 15px;
        }
        
        .options-review {
          margin-bottom: 15px;
        }
        
        .option-review {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 5px;
          border-radius: 6px;
        }
        
        .option-review.correct {
          background: #d4edda;
          color: #155724;
        }
        
        .option-review.incorrect {
          background: #f8d7da;
          color: #721c24;
        }
        
        .check-mark {
          color: #28a745;
          font-weight: bold;
          margin-left: auto;
        }
        
        .x-mark {
          color: #dc3545;
          font-weight: bold;
          margin-left: auto;
        }
        
        .answer-feedback {
          font-size: 0.9rem;
          color: #666;
        }
        
        .user-answer {
          margin-bottom: 5px;
        }
        
        .correct-answer {
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .explanation {
          background: #e9ecef;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .retake-btn, .new-quiz-btn, .upload-new-btn {
          padding: 15px 30px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .retake-btn {
          background: #28a745;
          color: white;
        }
        
        .retake-btn:hover {
          background: #218838;
          transform: translateY(-2px);
        }
        
        .new-quiz-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .new-quiz-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .upload-new-btn {
          background: #f8f9fa;
          color: #666;
          border: 2px solid #dee2e6;
        }
        
        .upload-new-btn:hover {
          background: #e9ecef;
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
          
          .main-content {
            padding: 20px 10px;
          }
          
          .auth-card, .upload-card, .quiz-card, .results-card {
            padding: 20px;
          }
          
          .navigation-container {
            flex-direction: column;
          }
          
          .action-buttons {
            flex-direction: column;
          }
         .option-btn * {
            color: #333 !important;
          }

         .option-btn.selected * {
            color: white !important;
          }



/* 📱 COMPREHENSIVE MOBILE RESPONSIVENESS */
@media (max-width: 768px) {
  .container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
    text-align: center;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
  }
  
  .tagline {
    font-size: 0.8rem;
    margin-left: 0;
    margin-top: 5px;
  }
  
  .user-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .main-content {
    padding: 20px 15px;
  }
  
  .auth-card, .upload-card, .quiz-card, .results-card {
    padding: 25px 20px;
    margin: 0 10px;
    border-radius: 15px;
  }
  
  .auth-card h2 {
    font-size: 1.5rem;
  }
  
  .features {
    margin: 20px 0;
  }
  
  .feature {
    padding: 10px 0;
    font-size: 0.9rem;
  }
  
  .feature-icon {
    font-size: 1.2rem;
    margin-right: 12px;
  }
  
  .signin-btn, .start-btn {
    padding: 12px 25px;
    font-size: 15px;
  }
  
  .file-label {
    min-height: 100px;
    flex-direction: column;
    text-align: center;
  }
  
  .upload-icon, .file-icon {
    font-size: 1.5rem;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .question-text {
    font-size: 1.1rem;
    margin-bottom: 20px;
  }
  
  .option-btn {
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .option-letter {
    margin-right: 12px;
    min-width: 18px;
  }
  
  .navigation-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav-btn {
    padding: 12px 20px;
    width: 100%;
  }
  
  .score-display {
    padding: 20px;
  }
  
  .score-number {
    font-size: 2.5rem;
  }
  
  .answer-item {
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .answer-item h4 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .action-buttons {
    gap: 12px;
  }
  
  .retake-btn, .new-quiz-btn, .upload-new-btn {
    padding: 12px 25px;
    font-size: 15px;
  }
}

/* 📱 SMALL MOBILE (iPhone SE, etc.) */
@media (max-width: 480px) {
  .header {
    padding: 10px 15px;
  }
  
  .header-left h1 {
    font-size: 1.3rem;
  }
  
  .main-content {
    padding: 15px 10px;
  }
  
  .auth-card, .upload-card, .quiz-card, .results-card {
    padding: 20px 15px;
    margin: 0 5px;
  }
  
  .question-text {
    font-size: 1rem;
  }
  
  .option-btn {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .score-number {
    font-size: 2rem;
  }
}

/* 🖥️ LARGE SCREENS */
@media (min-width: 1200px) {
  .main-content {
    max-width: 900px;
  }
  
  .auth-card, .upload-card, .quiz-card, .results-card {
    max-width: 700px;
  }
}


/* 👆 TOUCH-FRIENDLY ELEMENTS */
.option-btn, .nav-btn, .signin-btn, .start-btn {
  min-height: 44px; /* iOS recommended touch target */
  touch-action: manipulation; /* Prevents zoom on tap */
}

.file-label {
  min-height: 120px; /* Larger touch area for file upload */
}

/* Improve button spacing on mobile */
@media (max-width: 768px) {
  .options-container {
    gap: 12px;
  }
  
  .action-buttons {
    gap: 15px;
  }
}









        }
      `}</style>
    </div>
  );
}

