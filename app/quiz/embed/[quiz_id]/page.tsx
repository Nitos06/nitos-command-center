export default async function QuizEmbedPage({ params, searchParams }: {
  params: Promise<{ quiz_id: string }>;
  searchParams: Promise<{ brand_id?: string }>;
}) {
  const { quiz_id } = await params;
  const { brand_id = "" } = await searchParams;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f8f7f4", minHeight: "100vh" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center" as const, padding: "40px 20px", color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
          <p style={{ fontSize: 14, margin: 0 }}>Quiz embed active</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Quiz ID: {quiz_id}</p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>This renders the quiz designed in your Canvas Editor. Full widget connects once quiz design is saved.</p>
        </div>
      </div>
    </div>
  );
}
