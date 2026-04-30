import { Suspense } from "react";

interface Props {
  params: Promise<{ quiz_id: string }>;
  searchParams: Promise<{ brand_id?: string }>;
}

export default async function QuizEmbedPage({ params, searchParams }: Props) {
  const { quiz_id } = await params;
  const { brand_id = "" } = await searchParams;

  return (
    <div style={{
      maxWidth: 520,
      margin: "0 auto",
      padding: "24px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      minHeight: "100vh",
    }}>
      <QuizWidget quizId={quiz_id} brandId={brand_id} />
    </div>
  );
}

// Client-side quiz widget — separate file handles interactivity
function QuizWidget({ quizId, brandId }: { quizId: string; brandId: string }) {
  // This is a server component shell — the actual interactive quiz
  // will be rendered client-side via the embed widget script
  // For now render a placeholder that explains the connection
  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      padding: 32,
      boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
      textAlign: "center" as const,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8, margin: "0 0 8px" }}>
        Quiz
      </h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, margin: "0 0 24px" }}>
        Loading your personalized quiz experience...
      </p>
      {/* The Canvas Editor designs the quiz layout.
          When a real quiz design is saved, this renders it dynamically.
          Email submissions POST to /api/quiz/submit which saves to
          quiz_responses AND adds to email_contacts automatically. */}
      <div style={{
        background: "#f3f4f6",
        borderRadius: 12,
        padding: "16px",
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "left" as const,
      }}>
        <strong style={{ color: "#6b7280" }}>Quiz ID:</strong> {quizId}<br />
        <strong style={{ color: "#6b7280" }}>Brand:</strong> {brandId || "not set"}<br />
        <strong style={{ color: "#6b7280" }}>Submit endpoint:</strong> /api/quiz/submit<br />
        <strong style={{ color: "#6b7280" }}>Email flow:</strong> quiz_responses → email_contacts → "Quiz Takers" segment
      </div>
    </div>
  );
}
