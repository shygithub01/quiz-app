import React, { useState, useRef } from "react";
import { FaFileAlt } from "react-icons/fa";

const FILE_TYPES = [
  ".pdf",
  ".docx",
  ".txt",
  ".rtf",
  ".jpg",
  ".jpeg",
  ".png"
];

const FILE_TYPES_LABEL = "PDF, Word documents (.docx), Plain text (.txt), RTF, and Images (.png, .jpg, .jpeg)";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string; // correct answer letter
  userAnswer?: string;
};

function parseAIQuizText(quiz: string): QuizQuestion[] {
  // Parse OpenAI's response
  // Parses a quiz like:
  // Q1: What is the ...?
  // A. ...
  // B. ...
  // C. ...
  // D. ...
  // Answer: B
  const lines = quiz.split("\n").map(line => line.trim()).filter(Boolean);
  const questions: QuizQuestion[] = [];

  let idx = 0;
  while (idx < lines.length) {
    if (lines[idx].startsWith("Q")) {
      const question = lines[idx].replace(/^Q[0-9]+:\s*/, "");
      const options = [];
      for (let o = 1; o <= 4; o++) {
        if (lines[idx + o] && /^[A-D]\./.test(lines[idx + o])) {
          options.push(lines[idx + o].substring(2).trim());
        }
      }
      let answer = "";
      if (lines[idx + 5] && /^Answer:/i.test(lines[idx + 5])) {
        answer = lines[idx + 5].replace(/^Answer:/i, "").trim()[0];
      }
      questions.push({
        question,
        options,
        answer
      });
      idx += 6;
    } else {
      idx++;
    }
  }

  return questions;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [status, setStatus] = useState<"welcome"|"loading"|"quiz"|"results">("welcome");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // For results
  const [score, setScore] = useState(0);

  // Handlers

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const handleStartQuiz = async () => {
    if (!file) return;

    setStatus("loading");
    // Upload file to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("numQuestions", numQuestions.toString());

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      // Parse quiz
      const parsedQuestions: QuizQuestion[] = parseAIQuizText(data.quiz);
      // Add userAnswer placeholders
      parsedQuestions.forEach(q => (q.userAnswer = ""));
      setQuizQuestions(parsedQuestions);
      setActiveQuestion(0);
      setStatus("quiz");
    } catch (e:any) {
      alert(e.message || "Could not create quiz!");
      setStatus("welcome");
    }
  };

  const handleSelectOption = (optionIdx: number) => {
    // Mark the user's answer and move to next Q or results
    setQuizQuestions(prev => {
      const updated = [...prev];
      updated[activeQuestion].userAnswer = "ABCD"[optionIdx];
      return updated;
    });
    if (activeQuestion < quizQuestions.length - 1) {
      setTimeout(() => setActiveQuestion((a) => a + 1), 300);
    } else {
      // Compute score!
      const sc = quizQuestions.reduce(
        (sum, q, i) =>
          sum + ((q.userAnswer || "") === q.answer ? 1 : 0),
        0
      );
      setScore(sc);
      setStatus("results");
    }
  };

  const handleRetake = () => {
    setFile(null);
    setFileName("");
    setNumQuestions(5);
    setStatus("welcome");
    setQuizQuestions([]);
    setActiveQuestion(0);
    setScore(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Renderers

  // --- Welcome Screen ---
  if (status === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fc", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 42 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: 0 }}>
            <span style={{ background: "linear-gradient(90deg, #668cf8, #00b8d4)", WebkitBackgroundClip: "text", color: "transparent" }}>AI Quiz Generator</span>
          </div>
          <div style={{ marginTop: 6, color: "#6a7ba2", fontSize: 17 }}>
            Transform your documents into interactive quizzes
          </div>
        </div>
        <div style={{
          background: "#fff", maxWidth: 420, padding: 34, borderRadius: 16, boxShadow: "0 3px 40px rgba(0,0,0,0.10)",
          width: "100%",
          border: "1px solid #ececec"
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: 17, fontSize: 22 }}>Upload Your Document</h3>
          <div style={{ marginBottom: 18, fontSize: 15, color: "#556"}}>
            Upload a document and we&apos;ll generate quiz questions from its content
          </div>

          <label htmlFor="file" style={{ width: "100%", cursor: "pointer", display: "block", marginBottom: 3 }}>
            <div style={{
              background: "#f4f6fd",
              border: "1.5px dashed #a4b0cf",
              borderRadius: 9,
              padding: 20,
              textAlign: "center"
            }}>
              <FaFileAlt size={38} color="#7b8ad8" />
              <div style={{ marginTop: 7, color: "#415283" }}>{fileName ? <b>{fileName}</b> : "Choose a File"}</div>
            </div>
            <input
              id="file"
              name="file"
              ref={fileInputRef}
              type="file"
              accept={FILE_TYPES.join(",")}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>

          <div style={{ margin: " 10px 0 10px 0" }}>
            <label style={{ display: "block", marginBottom: 4, fontSize: 15 }}>
              Number of questions
            </label>
            <select value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1.5px solid #c7d3ec", fontSize: 16 }}>
              {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} Questions</option>)}
            </select>
          </div>

          <div style={{
            fontSize: 14,
            color: "#1c388c",
            background: "#eef2fa",
            borderRadius: 6,
            padding: "8px 12px",
            margin: "13px 0 18px 0",
            display: "flex",
            alignItems: "center"
          }}>
            <span style={{
              fontSize: 18, display: "inline-block", marginRight: 7, color: "#1c61e6", position: "relative", top: 2
            }}>🛈</span>
            Supported file types:
            <span style={{ fontWeight: 500, marginLeft: 3 }}>{FILE_TYPES_LABEL}</span>
          </div>
          <button
            onClick={handleStartQuiz}
            disabled={!file}
            style={{
              background: !file ? "#a9bce2" : "linear-gradient(90deg, #668cf8, #00b8d4)",
              color: "#fff", fontSize: 18, fontWeight: 600, padding: "12px 0",
              border: "none", borderRadius: 10,
              width: "100%",
              boxShadow: "0 4px 10px 0 rgba(100,140,223,0.05, 0.15)",
              cursor: !file ? "not-allowed" : "pointer",
              marginTop: 17
            }}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // --- Loading State ---
  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", background: "#f7f8fc"
      }}>
        <div style={{
          background: "#fff", padding: 38, borderRadius: 18, boxShadow: "0 3px 35px rgba(0,0,0,.10)"
        }}>
          <span style={{
            display: "block", fontSize: 25, fontWeight: 700, color: "#4175fa"
          }}>Generating Quiz…</span>
          <div style={{ marginTop: 18, color: "#465", fontSize: 18 }}>This may take a moment.</div>
        </div>
      </div>
    );
  }

  // --- Quiz Screen ---
  if (status === "quiz" && quizQuestions.length > 0) {
    const q = quizQuestions[activeQuestion];
    return (
      <div style={{
        minHeight: "100vh", background: "#f7f8fc", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center"
      }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 22px rgba(0,0,0,0.07)", padding: "38px 30px", minWidth: 360, maxWidth: 500, width: "100%" }}>
          <div style={{ color: "#6a7ba2", fontWeight: 500, fontSize: 16, marginBottom: 7 }}>
            Question {activeQuestion + 1} of {quizQuestions.length}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: "11px 0 19px 0" }}>{q.question}</div>
          <div>
            {q.options.map((op, opIdx) =>
              <button key={opIdx}
                onClick={() => handleSelectOption(opIdx)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 12px",
                  background: "#f5f8ff",
                  border: "1.5px solid #a7bdea",
                  borderRadius: 7,
                  margin: "11px 0",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 17,
                  fontWeight: 500
                }}>
                <span style={{ marginRight: 12, fontWeight: 600 }}>{String.fromCharCode(65 + opIdx)}.</span>
                {op}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Results Screen ---
  if (status === "results") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fc", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: "#fff", borderRadius: 17, padding: "34px 32px", boxShadow: "0 2px 24px rgba(0,0,0,0.08)", minWidth: 400, maxWidth: 560 }}>
          <div style={{ fontSize: 27, fontWeight: 700, color: "#4175fa", marginBottom: 10 }}>Quiz Results</div>
          <div style={{ color: "#656", fontSize: 18, fontWeight: 600, marginBottom: 25 }}>
            You scored <span style={{
              color: "#13b87e", fontWeight: 800, fontSize: 22
            }}>{score} / {quizQuestions.length}</span>
          </div>
          <div>
            {quizQuestions.map((q, i) => {
              const correctIdx = "ABCD".indexOf(q.answer);
              const userIdx = "ABCD".indexOf(q.userAnswer || "_");
              const isCorrect = userIdx === correctIdx;
              return (
                <div key={i} style={{
                  marginBottom: 18,
                  padding: "13px 14px",
                  borderRadius: 9,
                  background: "#eef2fa"
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Q{i + 1}: {q.question}
                  </div>
                  <div>
                    {q.options.map((op, opIdx) => {
                      const correct = opIdx === correctIdx;
                      const chosen = opIdx === userIdx;
                      return (
                        <div key={opIdx}
                          style={{
                            display: "flex", alignItems: "center",
                            margin: "1px 0 3px 0",
                          }}>
                          <span style={{ fontWeight: 600, marginRight: 10 }}>
                            {String.fromCharCode(65 + opIdx)}.
                          </span>
                          <span style={{
                            color: correct ? "#0bb167" : chosen && !correct ? "#c12823" : "#374c70",
                            textDecoration: correct ? "underline" : chosen && !correct ? "line-through" : "none",
                            fontWeight: chosen ? 800 : 500,
                            fontSize: 16
                          }}>{op}</span>
                          {correct && (
                            <span style={{ marginLeft: 7, color: "#12b47b", fontSize: 19 }}>✔️</span>
                          )}
                          {chosen && !correct && (
                            <span style={{ marginLeft: 7, color: "#e34a41", fontSize: 19 }}>❌</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 13, color: "#456", marginTop: 2 }}>
                    Your answer: {q.userAnswer ? (q.userAnswer + ". " + (q.options["ABCD".indexOf(q.userAnswer)] || "")) : <span style={{ color: "#7b92b4" }}>None</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "#228b48", marginTop: 2 }}>
                    Correct answer: {q.answer ? (q.answer + ". " + (q.options["ABCD".indexOf(q.answer)] || "")) : ""}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={handleRetake}
            style={{
              marginTop: 19,
              background: "linear-gradient(90deg, #7faac8, #36c458)",
              color: "#fff", fontSize: 17, fontWeight: 600, border: "none", padding: "12px 0", borderRadius: 9, width: "100%", cursor: "pointer"
            }}>
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

