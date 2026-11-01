import Link from "next/link";
export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h1>
            A stronger you.
            <br />
            <em>A smarter way.</em>
          </h1>
          <p className="hero-copy">
            Find your trainer. Make time for movement. See how far you’ve come.
            Your entire fitness routine, finally in sync.
          </p>
          <div className="actions">
            <Link href="/register" className="button">
              Build your routine <span>↗</span>
            </Link>
            <Link href="/trainers" className="text-link">
              Explore trainers →
            </Link>
          </div>
          <div className="hero-proof">
            <span className="circle-label">01</span>
            <p>
              Less scheduling friction.
              <br />
              <strong>More room to grow.</strong>
            </p>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Abstract graphic representing movement and progress"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <span className="art-label">
            MOVE WITH
            <br />
            INTENTION.
          </span>
          <div className="art-card">
            <span className="live-dot" /> YOUR ROUTINE, CONNECTED
            <p>Book. Move. Reflect.</p>
            <div className="mini-bars">
              {[32, 48, 39, 65, 56, 81, 96].map((h, i) => (
                <i key={i} style={{ height: h }} />
              ))}
            </div>
            <small>
              Illustration of progress · your dashboard uses saved workouts
            </small>
          </div>
          <span className="vertical-text">STRENGTH / BALANCE / ENDURANCE</span>
        </div>
      </section>
      <section className="features">
        <div className="section-heading">
          <p className="eyebrow">MADE FOR YOUR MOMENTUM</p>
          <h2>Your goals. One connected space.</h2>
        </div>
        <div className="feature-grid">
          {[
            [
              "01",
              "A spot that’s yours",
              "Reserve a trainer’s available time with database-enforced protection against double-booking.",
              "/trainers",
            ],
            [
              "02",
              "Every rep tells a story",
              "Log strength, cardio and mobility in the way you actually train. Review your real history.",
              "/workouts",
            ],
            [
              "03",
              "Find your direction",
              "Describe your goals in your own words to discover relevant exercises and available trainers.",
              "/recommendations",
            ],
          ].map(([n, title, copy, url]) => (
            <Link href={url} className="feature" key={n}>
              <span>{n} ↗</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="cta">
        <div>
          <p className="eyebrow">FOR MEMBERS AND TRAINERS</p>
          <h2>
            Good routines start
            <br />
            with a clear plan.
          </h2>
        </div>
        <Link href="/register" className="button dark">
          Find your starting point ↗
        </Link>
      </section>
    </main>
  );
}
