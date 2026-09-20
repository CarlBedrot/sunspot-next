import Explore from "@/components/Explore";
export default function Home() {
  if (process.env.SUNSPOT_RECIPIENT_ONLY === "1")
    return (
      <main className="hang-page">
        <section className="hang-card hang-empty">
          <div className="hang-art">👋</div>
          <h1>SunSpot.</h1>
          <p>Good company. One link away.</p>
          <p className="hang-muted">
            Open the invitation your friend sent you to join their hangout.
          </p>
        </section>
      </main>
    );
  return <Explore />;
}
