"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
type User = { id: string; name: string; role: "MEMBER" | "TRAINER" };
type Trainer = {
  id: string;
  name: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  location: string;
};
type Slot = {
  id: string;
  trainer_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  occupied: boolean;
};
type Booking = {
  id: string;
  member_name: string;
  trainer_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
};
type Workout = {
  _id: string;
  performedAt: string;
  workoutType: string;
  notes: string;
  exercises: {
    name: string;
    sets: {
      reps?: number;
      weight?: number;
      duration?: number;
      distance?: number;
    }[];
  }[];
};
type Analytics = {
  sessions: { date: string; sessions: number }[];
  volume: {
    exercise: string;
    volume: number;
    duration: number;
    distance: number;
  }[];
};
type Recommendations = {
  exercises: {
    id: string;
    name: string;
    description: string;
    similarity: number;
  }[];
  trainers: { id: string; name: string; bio: string; similarity: number }[];
};
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch("/api/" + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
const when = (s: string) => new Date(s).toLocaleString();
const emptyWorkout = () =>
  JSON.stringify(
    {
      performedAt: new Date().toISOString(),
      workoutType: "STRENGTH",
      notes: "",
      exercises: [{ name: "Goblet squat", sets: [{ reps: 10, weight: 12 }] }],
    },
    null,
    2,
  );
const labels: Record<string, string> = {
  dashboard: "Your training, in focus.",
  trainers: "Find your kind of trainer.",
  bookings: "Make time for progress.",
  appointments: "Your upcoming clients.",
  availability: "Create space to train.",
  workouts: "Every session counts.",
  analytics: "See your momentum.",
  recommendations: "A direction that fits you.",
  login: "Welcome back.",
  register: "Start your next chapter.",
};
export default function Portal({
  view,
  trainerId,
}: {
  view: string;
  trainerId?: string;
}) {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]),
    [slots, setSlots] = useState<Slot[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]),
    [workouts, setWorkouts] = useState<Workout[]>([]),
    [analytics, setAnalytics] = useState<Analytics>({
      sessions: [],
      volume: [],
    }),
    [recommendations, setRecommendations] = useState<Recommendations | null>(
      null,
    );
  const [query, setQuery] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [type, setType] = useState(""),
    [editor, setEditor] = useState(emptyWorkout),
    [editId, setEditId] = useState("");
  const filters = useCallback(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", new Date(from + "T00:00:00Z").toISOString());
    if (to) p.set("to", new Date(to + "T23:59:59.999Z").toISOString());
    if (type) p.set("type", type);
    return p.toString();
  }, [from, to, type]);
  const load = useCallback(
    async (u: User) => {
      if (view === "trainers") {
        setTrainers(
          await api(
            "trainers" +
              (trainerId ? "/" + trainerId : "") +
              "?q=" +
              encodeURIComponent(query),
          ),
        );
        if (trainerId)
          setSlots(await api("availability?trainerId=" + trainerId));
      }
      if (["bookings", "appointments", "dashboard"].includes(view))
        setBookings(await api("bookings"));
      if (view === "availability")
        setSlots(await api("availability?trainerId=" + u.id));
      if (view === "workouts") setWorkouts(await api("workouts?" + filters()));
      if (view === "analytics")
        setAnalytics(await api("analytics?" + filters()));
    },
    [view, trainerId, query, filters],
  );
  useEffect(() => {
    let active = true;
    api<{ user: User | null }>("me")
      .then(async (data) => {
        if (!active) return;
        setUser(data.user);
        if (data.user) await load(data.user);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [load]);
  async function run(
    action: () => Promise<void>,
    message = "Saved successfully.",
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (user) await load(user);
  }
  function auth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void run(async () => {
      await api("auth/" + view, "POST", Object.fromEntries(form));
      router.push("/dashboard");
      router.refresh();
    }, "Signed in.");
  }
  const links =
    user?.role === "TRAINER"
      ? [
          ["dashboard", "Overview"],
          ["availability", "Availability"],
          ["appointments", "Appointments"],
        ]
      : [
          ["dashboard", "Overview"],
          ["trainers", "Find a trainer"],
          ["bookings", "My bookings"],
          ["workouts", "Workout journal"],
          ["analytics", "Progress"],
          ["recommendations", "Goal matching"],
        ];
  if (view === "login" || view === "register")
    return (
      <main className="auth-wrap">
        <div className="auth-intro">
          <p className="eyebrow">WELCOME TO PULSEFIT</p>
          <h1>{labels[view]}</h1>
          <p>A little consistency can change everything.</p>
        </div>
        <form className="panel auth-form" onSubmit={auth}>
          <h2>
            {view === "login" ? "Sign in to your space" : "Create your account"}
          </h2>
          {view === "register" && (
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password <small>12–72 characters</small>
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={72}
              autoComplete={
                view === "login" ? "current-password" : "new-password"
              }
              required
            />
          </label>
          {view === "register" && (
            <label>
              I’m joining as
              <select name="role">
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
              </select>
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button disabled={busy}>
            {busy
              ? "Please wait…"
              : view === "login"
                ? "Sign in ↗"
                : "Create account ↗"}
          </button>
          <p>
            {view === "login" ? "New here?" : "Already a member?"}{" "}
            <Link href={view === "login" ? "/register" : "/login"}>
              {view === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </form>
      </main>
    );
  if (!ready)
    return (
      <main className="page">
        <p role="status">Loading your space…</p>
      </main>
    );
  if (!user)
    return (
      <main className="page">
        <p className="eyebrow">YOUR PULSEFIT SPACE</p>
        <h1>Let’s get you signed in.</h1>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <p>Sign in to see trainers, bookings and your workout journal.</p>
        <Link className="button" href="/login">
          Sign in ↗
        </Link>
      </main>
    );
  return (
    <div className="workspace">
      <aside>
        <p className="eyebrow">{user.role} SPACE</p>
        <div className="user-badge">
          <span>{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>Your personal training hub</small>
          </div>
        </div>
        <nav>
          {links.map(([key, title]) => (
            <Link
              className={view === key ? "selected" : ""}
              href={"/" + key}
              key={key}
            >
              {title}
              <span>↗</span>
            </Link>
          ))}
        </nav>
        <button
          className="secondary"
          onClick={() =>
            void run(async () => {
              await api("auth/logout", "POST");
              router.push("/");
              router.refresh();
            })
          }
        >
          Sign out
        </button>
      </aside>
      <main className="portal">
        <div className="portal-heading">
          <p className="eyebrow">PULSEFIT / {view.toUpperCase()}</p>
          <h1>{labels[view]}</h1>
          <p>Small steps. Stronger habits. Your next move is here.</p>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="success" role="status">
            {notice}
          </p>
        )}
        {view === "dashboard" && (
          <>
            <div className="stat-grid">
              <div className="stat">
                <span>Confirmed sessions</span>
                <strong>
                  {bookings.filter((b) => b.status === "CONFIRMED").length}
                </strong>
                <small>In your booking history</small>
              </div>
              <div className="stat accent">
                <span>Your next move</span>
                <h3>
                  {user.role === "MEMBER"
                    ? "Make a little time for you."
                    : "Your expertise. Their progress."}
                </h3>
                <Link
                  href={user.role === "MEMBER" ? "/trainers" : "/availability"}
                >
                  {user.role === "MEMBER"
                    ? "Find your trainer"
                    : "Manage your schedule"}{" "}
                  ↗
                </Link>
              </div>
            </div>
            <div className="panel">
              <h2>
                {user.role === "MEMBER"
                  ? "Your next sessions"
                  : "Your next appointments"}
              </h2>
              {bookings
                .filter(
                  (b) =>
                    b.status === "CONFIRMED" && Date.parse(b.starts_at) > now,
                )
                .slice(0, 5)
                .map((b) => (
                  <div className="list-row" key={b.id}>
                    <strong>
                      {user.role === "MEMBER" ? b.trainer_name : b.member_name}
                    </strong>
                    <span>{when(b.starts_at)}</span>
                  </div>
                ))}
              {!bookings.some(
                (b) =>
                  b.status === "CONFIRMED" && Date.parse(b.starts_at) > now,
              ) && (
                <p className="empty">
                  Your schedule is clear. Plan your next session when you’re
                  ready.
                </p>
              )}
            </div>
            {user.role === "TRAINER" && (
              <form
                className="panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(async () => {
                    await api("profile", "PUT", {
                      bio: f.get("bio"),
                      specialties: String(f.get("specialties"))
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                      experienceYears: Number(f.get("experienceYears")),
                    });
                  }, "Profile and semantic embedding updated.");
                }}
              >
                <h2>Introduce your expertise</h2>
                <label>
                  Bio
                  <textarea name="bio" maxLength={2000} required />
                </label>
                <label>
                  Specialties, separated by commas
                  <input name="specialties" required />
                </label>
                <label>
                  Years of experience
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    max="80"
                    required
                  />
                </label>
                <button disabled={busy}>Save profile</button>
              </form>
            )}
          </>
        )}
        {view === "trainers" && (
          <>
            {!trainerId && (
              <form
                className="search-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(refresh, "Search updated.");
                }}
              >
                <label className="grow">
                  Search by name or specialty
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Strength, mobility, endurance…"
                  />
                </label>
                <button disabled={busy}>Search</button>
              </form>
            )}
            <div className="cards">
              {trainers.map((t) => (
                <article className="panel trainer-card" key={t.id}>
                  <div className="avatar">
                    {t.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <p className="eyebrow">
                    {t.specialties.join(" / ") || "PERSONAL TRAINER"}
                  </p>
                  <h2>{t.name}</h2>
                  <p>{t.bio || "This trainer has not added a bio yet."}</p>
                  <small>
                    {t.experience_years} years experience · {t.location}
                  </small>
                  {!trainerId && (
                    <Link className="text-link" href={"/trainers/" + t.id}>
                      View profile & available times ↗
                    </Link>
                  )}
                </article>
              ))}
            </div>
            {!trainers.length && (
              <p className="empty">No trainers match this search.</p>
            )}
            {trainerId && (
              <div className="panel">
                <h2>Choose your next session</h2>
                <p>
                  Times are displayed in your local timezone. One member per
                  slot.
                </p>
                {slots
                  .filter((s) => s.status === "OPEN")
                  .map((s) => (
                    <div className="list-row" key={s.id}>
                      <div>
                        <strong>{when(s.starts_at)}</strong>
                        <small>Until {when(s.ends_at)}</small>
                      </div>
                      <button
                        disabled={busy || s.occupied || user.role !== "MEMBER"}
                        onClick={() =>
                          void run(async () => {
                            await api("bookings", "POST", { slotId: s.id });
                            await refresh();
                          }, "Your session is booked. Find it in My bookings.")
                        }
                      >
                        {s.occupied ? "Reserved" : "Book session ↗"}
                      </button>
                    </div>
                  ))}
                {!slots.some((s) => s.status === "OPEN") && (
                  <p className="empty">No open times yet. Check back soon.</p>
                )}
              </div>
            )}
          </>
        )}
        {["bookings", "appointments"].includes(view) && (
          <div className="panel table-panel">
            <h2>
              {view === "bookings"
                ? "Your booking history"
                : "Client appointments"}
            </h2>
            {bookings.length ? (
              <table>
                <thead>
                  <tr>
                    <th>{user.role === "MEMBER" ? "Trainer" : "Member"}</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {user.role === "MEMBER"
                          ? b.trainer_name
                          : b.member_name}
                      </td>
                      <td>{when(b.starts_at)}</td>
                      <td>
                        <span
                          className={
                            "tag " +
                            (b.status === "CONFIRMED" ? "positive" : "")
                          }
                        >
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {user.role === "MEMBER" &&
                          b.status === "CONFIRMED" &&
                          Date.parse(b.starts_at) > now && (
                            <button
                              className="secondary"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await api("bookings/" + b.id, "DELETE");
                                  await refresh();
                                }, "Booking cancelled; the time is available again.")
                              }
                            >
                              Cancel
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty">No bookings yet.</p>
            )}
          </div>
        )}
        {view === "availability" && (
          <>
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(async () => {
                  await api("availability", "POST", {
                    startsAt: new Date(String(f.get("start"))).toISOString(),
                    endsAt: new Date(String(f.get("end"))).toISOString(),
                  });
                  await refresh();
                }, "Availability created.");
              }}
            >
              <h2>Open a training slot</h2>
              <p>
                Choose a future time within 90 days. Sessions may last up to
                four hours.
              </p>
              <div className="form-grid">
                <label>
                  Starts at (local time)
                  <input name="start" type="datetime-local" required />
                </label>
                <label>
                  Ends at (local time)
                  <input name="end" type="datetime-local" required />
                </label>
              </div>
              <button disabled={busy}>Add availability ↗</button>
            </form>
            <div className="panel">
              <h2>Your schedule</h2>
              {slots.map((s) => (
                <div className="list-row" key={s.id}>
                  <div>
                    <strong>{when(s.starts_at)}</strong>
                    <small>
                      {when(s.ends_at)} · {s.status}{" "}
                      {s.occupied ? "· Reserved" : ""}
                    </small>
                  </div>
                  {s.status === "OPEN" && (
                    <button
                      className="secondary"
                      disabled={busy || s.occupied}
                      onClick={() =>
                        void run(async () => {
                          await api("availability/" + s.id, "DELETE");
                          await refresh();
                        }, "Slot closed.")
                      }
                    >
                      Close slot
                    </button>
                  )}
                </div>
              ))}
              {!slots.length && (
                <p className="empty">Add your first available time above.</p>
              )}
            </div>
          </>
        )}
        {["workouts", "analytics"].includes(view) && (
          <form
            className="filter-row"
            onSubmit={(e) => {
              e.preventDefault();
              void run(refresh, "Filters applied.");
            }}
          >
            <label>
              From (UTC)
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              To (UTC)
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            {view === "workouts" && (
              <label>
                Type
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">All types</option>
                  {["STRENGTH", "CARDIO", "MIXED", "MOBILITY"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            )}
            <button disabled={busy}>Apply</button>
          </form>
        )}
        {view === "workouts" && (
          <>
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const data = JSON.parse(editor);
                  await api(
                    "workouts" + (editId ? "/" + editId : ""),
                    editId ? "PUT" : "POST",
                    data,
                  );
                  setEditId("");
                  setEditor(emptyWorkout());
                  await refresh();
                }, "Workout saved to your journal.");
              }}
            >
              <h2>{editId ? "Edit your workout" : "Log your workout"}</h2>
              <p>
                Flexible workout editor. Strength uses reps and weight (kg).
                Cardio uses duration (seconds) and distance (metres). Dates use
                ISO format.
              </p>
              <label>
                Workout details (JSON)
                <textarea
                  className="code-editor"
                  spellCheck={false}
                  value={editor}
                  onChange={(e) => setEditor(e.target.value)}
                  rows={17}
                />
              </label>
              <div className="actions">
                <button disabled={busy}>
                  {editId ? "Update workout" : "Save workout"} ↗
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditId("");
                    setEditor(
                      JSON.stringify(
                        {
                          performedAt: new Date().toISOString(),
                          workoutType: "CARDIO",
                          notes: "",
                          exercises: [
                            {
                              name: "Cycling",
                              sets: [{ duration: 1200, distance: 5000 }],
                            },
                          ],
                        },
                        null,
                        2,
                      ),
                    );
                  }}
                >
                  Use cardio example
                </button>
              </div>
            </form>
            <div className="panel">
              <h2>Your workout history</h2>
              {workouts.map((w) => (
                <article className="workout-row" key={w._id}>
                  <div>
                    <span className="tag">{w.workoutType}</span>
                    <h3>{when(w.performedAt)}</h3>
                    <p>
                      {w.exercises
                        .map((e) => e.name + " · " + e.sets.length + " sets")
                        .join(" / ")}
                    </p>
                    <small>{w.notes}</small>
                  </div>
                  <div className="actions">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => {
                        setEditId(w._id);
                        setEditor(
                          JSON.stringify(
                            {
                              performedAt: w.performedAt,
                              workoutType: w.workoutType,
                              notes: w.notes || "",
                              exercises: w.exercises,
                            },
                            null,
                            2,
                          ),
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await api("workouts/" + w._id, "DELETE");
                          await refresh();
                        }, "Workout deleted.")
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!workouts.length && (
                <p className="empty">
                  No workouts in this range. Your first session starts a story.
                </p>
              )}
            </div>
          </>
        )}
        {view === "analytics" && (
          <>
            <div className="stat-grid">
              <div className="stat">
                <span>Sessions in selected range</span>
                <strong>
                  {analytics.sessions.reduce((a, b) => a + b.sessions, 0)}
                </strong>
              </div>
              <div className="stat">
                <span>Resistance volume (kg × reps)</span>
                <strong>
                  {analytics.volume
                    .reduce((a, b) => a + b.volume, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>
            <div className="panel">
              <h2>Consistency over time</h2>
              <p>
                Session counts by UTC day, calculated from your saved workouts.
              </p>
              <div className="chart">
                {analytics.sessions.map((s) => (
                  <div className="chart-column" key={s.date}>
                    <strong>{s.sessions}</strong>
                    <div
                      style={{
                        height: Math.max(
                          8,
                          (140 * s.sessions) /
                            Math.max(
                              ...analytics.sessions.map((x) => x.sessions),
                              1,
                            ),
                        ),
                      }}
                    />
                    <small>{s.date}</small>
                  </div>
                ))}
              </div>
              {!analytics.sessions.length && (
                <p className="empty">Log a workout to see your progress.</p>
              )}
            </div>
            <div className="panel table-panel">
              <h2>Movement breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Volume (kg × reps)</th>
                    <th>Time (s)</th>
                    <th>Distance (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.volume.map((v) => (
                    <tr key={v.exercise}>
                      <td>{v.exercise}</td>
                      <td>{v.volume}</td>
                      <td>{v.duration}</td>
                      <td>{v.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                Missing resistance values contribute zero volume. Cardio time
                and distance remain separate measures.
              </p>
            </div>
          </>
        )}
        {view === "recommendations" && (
          <>
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(async () => {
                  setRecommendations(
                    await api("recommendations", "POST", {
                      goals: f.get("goals"),
                      ...(f.get("category")
                        ? { category: f.get("category") }
                        : {}),
                    }),
                  );
                }, "Your goals have been saved and matches ranked.");
              }}
            >
              <h2>What are you working towards?</h2>
              <label>
                Your fitness goals
                <textarea
                  name="goals"
                  minLength={5}
                  maxLength={2000}
                  placeholder="I want to feel less stiff after long days at my desk…"
                  required
                />
              </label>
              <label>
                Exercise focus
                <select name="category">
                  <option value="">Any movement</option>
                  <option>STRENGTH</option>
                  <option>CARDIO</option>
                  <option>MOBILITY</option>
                </select>
              </label>
              <button disabled={busy}>
                {busy ? "Finding your matches…" : "Find my direction ↗"}
              </button>
              <p className="hint">
                Your first search may take longer while the local language model
                loads. Match scores indicate text similarity.
              </p>
            </form>
            {recommendations && (
              <>
                <h2>Exercises for your direction</h2>
                <div className="cards">
                  {recommendations.exercises.map((e) => (
                    <article key={e.id} className="panel">
                      <span className="tag positive">
                        {(e.similarity * 100).toFixed(1)}% similarity
                      </span>
                      <h3>{e.name}</h3>
                      <p>{e.description}</p>
                    </article>
                  ))}
                </div>
                <h2>Available trainers</h2>
                <div className="cards">
                  {recommendations.trainers.map((t) => (
                    <article key={t.id} className="panel">
                      <span className="tag positive">
                        {(t.similarity * 100).toFixed(1)}% similarity
                      </span>
                      <h3>{t.name}</h3>
                      <p>{t.bio}</p>
                      <Link href={"/trainers/" + t.id}>
                        See available times ↗
                      </Link>
                    </article>
                  ))}
                </div>
                {!recommendations.trainers.length && (
                  <p className="empty">
                    No indexed trainers with open, unreserved future slots.
                    Trainers need a bio and available time.
                  </p>
                )}
                {!recommendations.exercises.length && (
                  <p className="empty">
                    Exercise embeddings are not seeded yet. Run the documented
                    embedding setup.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
