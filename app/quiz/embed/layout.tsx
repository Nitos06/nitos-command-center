export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#f8f7f4" }}>
        {children}
      </body>
    </html>
  );
}
