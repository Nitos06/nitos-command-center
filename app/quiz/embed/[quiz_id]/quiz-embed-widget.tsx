"use client";

import { useState } from "react";

interface QuizOption {
  id: string;
  option_text: string;
  image_url?: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  quiz_options: QuizOption[];
}

interface Props {
  quiz: { id: string; title: string; description: string; brand_id: string };
  questions: QuizQuestion[];
  brandId: string;
}

type Screen = "intro" | "questions" | "gate" | "loading" | "results";

export default function QuizEmbedWidget({ quiz, questions, brandId }: Props) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState("");
  const [textInput, setTextInput] = useState("");

  const currentQuestion = questions[questionIndex];
  const progress = questions.length > 0 ? ((questionIndex + 1) / questions.length) * 100 : 0;

  // ── helpers ──────────────────────────────────────────────────────────────

  function handleSingleChoice(questionId: string, optionId: string) {
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    advanceQuestion(updated);
  }

  function toggleMultiChoice(questionId: string, optionId: string) {
    const current: string[] = answers[questionId] ?? [];
    const updated = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setAnswers({ ...answers, [questionId]: updated });
  }

  function advanceQuestion(currentAnswers?: Record<string, any>) {
    const ans = currentAnswers ?? answers;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setTextInput("");
    } else {
      // All questions answered — go to gate (or skip to gate if no questions)
      setAnswers(ans);
      setScreen("gate");
    }
  }

  function handleTextNext() {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: textInput });
    }
    advanceQuestion({ ...answers, [currentQuestion?.id ?? ""]: textInput });
  }

  function handleBack() {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      setTextInput("");
    } else {
      setScreen("intro");
    }
  }

  async function handleSubmit() {
    setError("");
    setScreen("loading");
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quiz.id,
          brand_id: brandId || quiz.brand_id,
          email,
          name: name || null,
          phone: phone || null,
          answers_json: answers,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setRecommendation(data.recommendation);
        setScreen("results");
      } else {
        setError("Something went wrong. Please try again.");
        setScreen("gate");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setScreen("gate");
    }
  }

  function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    handleSubmit();
  }

  function resetQuiz() {
    setScreen("intro");
    setQuestionIndex(0);
    setAnswers({});
    setEmail("");
    setName("");
    setPhone("");
    setRecommendation(null);
    setError("");
    setTextInput("");
  }

  // ── styles ────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 20,
    padding: "36px 32px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
    maxWidth: 520,
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  };

  const indigo = "#6366f1";

  const btnPrimary: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "14px 24px",
    background: indigo,
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  };

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "system-ui, -apple-system, sans-serif",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  };

  // ── screens ───────────────────────────────────────────────────────────────

  if (screen === "intro") {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✨</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
            {quiz.title}
          </h1>
          {quiz.description && (
            <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 32px", lineHeight: 1.6 }}>
              {quiz.description}
            </p>
          )}
          <button
            style={btnPrimary}
            onClick={() => {
              if (questions.length === 0) {
                setScreen("gate");
              } else {
                setScreen("questions");
              }
            }}
          >
            Start Quiz →
          </button>
        </div>
      </div>
    );
  }

  if (screen === "questions" && currentQuestion) {
    const isMulti = currentQuestion.question_type === "multi_choice";
    const isText = currentQuestion.question_type === "text";
    const selectedMulti: string[] = answers[currentQuestion.id] ?? [];

    return (
      <div style={cardStyle}>
        {/* Progress bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "#e5e7eb",
          borderRadius: "20px 20px 0 0",
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: indigo,
            borderRadius: "20px 20px 0 0",
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Question counter */}
        <div style={{ textAlign: "right", fontSize: 12, color: "#9ca3af", marginBottom: 20, marginTop: 4 }}>
          {questionIndex + 1} / {questions.length}
        </div>

        {/* Question text */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 24px", lineHeight: 1.4 }}>
          {currentQuestion.question_text}
        </h2>

        {/* Options */}
        {isText ? (
          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your answer here…"
              style={{
                ...inputStyle,
                minHeight: 100,
                resize: "vertical",
                marginBottom: 20,
              }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {currentQuestion.quiz_options.map((opt) => {
              const isSelected = isMulti
                ? selectedMulti.includes(opt.id)
                : answers[currentQuestion.id] === opt.id;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (isMulti) {
                      toggleMultiChoice(currentQuestion.id, opt.id);
                    } else {
                      handleSingleChoice(currentQuestion.id, opt.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    border: `2px solid ${isSelected ? indigo : "#e5e7eb"}`,
                    borderRadius: 12,
                    background: isSelected ? "#eef2ff" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {opt.image_url && (
                    <img
                      src={opt.image_url}
                      alt={opt.option_text}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  {isMulti && (
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${isSelected ? indigo : "#d1d5db"}`,
                      background: isSelected ? indigo : "white",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {isSelected && (
                        <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>
                      )}
                    </div>
                  )}
                  <span style={{ fontSize: 15, color: "#111827", fontWeight: isSelected ? 600 : 400 }}>
                    {opt.option_text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleBack}
            style={{
              padding: "12px 20px",
              border: "1.5px solid #e5e7eb",
              borderRadius: 10,
              background: "white",
              color: "#6b7280",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            ← Back
          </button>

          {(isMulti || isText) && (
            <button
              onClick={isText ? handleTextNext : () => advanceQuestion()}
              disabled={isText && !textInput.trim()}
              style={{
                ...btnPrimary,
                width: "auto",
                flex: 1,
                opacity: isText && !textInput.trim() ? 0.5 : 1,
                cursor: isText && !textInput.trim() ? "not-allowed" : "pointer",
              }}
            >
              {questionIndex < questions.length - 1 ? "Next →" : "See Results →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === "gate") {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            Your results are ready!
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Enter your email to unlock your personalized recommendation
          </p>
        </div>

        <form onSubmit={handleGateSubmit}>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="+1 555 000 0000 — Get results by SMS too"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ ...inputStyle, marginBottom: 20 }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
              {error}
            </p>
          )}

          <button type="submit" style={btnPrimary}>
            See My Results →
          </button>
        </form>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: "60px 32px" }}>
        <div style={{
          width: 48,
          height: 48,
          border: `4px solid #e5e7eb`,
          borderTop: `4px solid ${indigo}`,
          borderRadius: "50%",
          margin: "0 auto 20px",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>
          Finding your perfect match…
        </p>
      </div>
    );
  }

  if (screen === "results" && recommendation) {
    const hasProducts = recommendation.products && recommendation.products.length > 0;

    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
            Your personalized recommendation
          </h2>
          {recommendation.headline && (
            <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
              {recommendation.headline}
            </p>
          )}
        </div>

        {hasProducts ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {recommendation.products.map((product: any) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  gap: 14,
                  border: "1.5px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", marginBottom: 4 }}>
                    {product.name}
                  </div>
                  {product.description && (
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6, lineHeight: 1.4 }}>
                      {product.description}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {product.price && (
                      <span style={{ fontWeight: 700, color: indigo, fontSize: 15 }}>
                        {product.price}
                      </span>
                    )}
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 14px",
                        background: indigo,
                        color: "white",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Shop Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: "#f9fafb",
            borderRadius: 14,
            padding: 20,
            textAlign: "center",
            marginBottom: 20,
            color: "#6b7280",
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            Your expert recommendation is being prepared — check your email at{" "}
            <strong style={{ color: "#374151" }}>{email}</strong>
          </div>
        )}

        {email && (
          <p style={{
            textAlign: "center",
            fontSize: 13,
            color: "#9ca3af",
            margin: "0 0 20px",
          }}>
            We emailed your results to <strong>{email}</strong>
          </p>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            onClick={resetQuiz}
            style={{
              background: "none",
              border: "none",
              color: indigo,
              fontSize: 14,
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Take the quiz again
          </button>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't normally render)
  return null;
}
