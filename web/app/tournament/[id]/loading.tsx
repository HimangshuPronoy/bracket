export default function Loading() {
  return (
    <main className="container fade-in" style={{ paddingTop: 40, textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto', marginBottom: 16 }} />
      <p className="text-secondary text-sm">Loading tournament...</p>
    </main>
  );
}
