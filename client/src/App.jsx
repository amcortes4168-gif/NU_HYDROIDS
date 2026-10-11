import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("nh_user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("nh_token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [tournaments, setTournaments] = useState([]);
  const [selected, setSelected] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [message, setMessage] = useState("");
  const [eventForm, setEventForm] = useState({ title: "", category: "Hackathon", eventDate: "", description: "" });
  const [submitForm, setSubmitForm] = useState({ teamName: "", projectTitle: "", description: "", repositoryUrl: "", demoUrl: "" });
  const [scoreForm, setScoreForm] = useState({ innovation: 8, functionality: 8, design: 8, technical: 8 });

  const chosen = useMemo(() => tournaments.find(t => t._id === selected), [tournaments, selected]);

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }

  async function loadTournaments() {
    try {
      const data = await request("/tournaments");
      setTournaments(data);
      if (!selected && data.length) setSelected(data[0]._id);
    } catch (error) { setMessage(error.message); }
  }

  async function loadCompetitionData(id = selected) {
    if (!id) return;
    try {
      const [subs, board] = await Promise.all([
        request(`/tournaments/${id}/submissions`),
        request(`/leaderboard/${id}`)
      ]);
      setSubmissions(subs);
      setLeaderboard(board);
    } catch (error) { setMessage(error.message); }
  }

  useEffect(() => { loadTournaments(); }, []);
  useEffect(() => { if (selected) loadCompetitionData(selected); }, [selected]);

  async function handleAuth(e) {
    e.preventDefault(); setMessage("");
    try {
      const data = await request(`/auth/${authMode}`, { method: "POST", body: JSON.stringify(authForm) });
      localStorage.setItem("nh_token", data.token);
      localStorage.setItem("nh_user", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setMessage(`Welcome, ${data.user.name}!`);
    } catch (error) { setMessage(error.message); }
  }

  function logout() {
    localStorage.removeItem("nh_token"); localStorage.removeItem("nh_user");
    setToken(""); setUser(null); setMessage("You have logged out.");
  }

  async function createTournament(e) {
    e.preventDefault(); setMessage("");
    try {
      const data = await request("/tournaments", { method: "POST", body: JSON.stringify(eventForm) });
      setEventForm({ title: "", category: "Hackathon", eventDate: "", description: "" });
      await loadTournaments(); setSelected(data._id); setMessage("Tournament created.");
    } catch (error) { setMessage(error.message); }
  }

  async function submitProject(e) {
    e.preventDefault(); setMessage("");
    try {
      await request("/submissions", { method: "POST", body: JSON.stringify({ ...submitForm, tournament: selected }) });
      setSubmitForm({ teamName: "", projectTitle: "", description: "", repositoryUrl: "", demoUrl: "" });
      await loadCompetitionData(selected); setMessage("Project submitted successfully.");
    } catch (error) { setMessage(error.message); }
  }

  async function scoreProject(id) {
    setMessage("");
    try {
      await request(`/submissions/${id}/score`, { method: "POST", body: JSON.stringify({ judgeName: user?.name || "Judge", ...scoreForm }) });
      await loadCompetitionData(selected); setMessage("Score saved.");
    } catch (error) { setMessage(error.message); }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home"><span className="brand-mark">NH</span><span>NU <b>HYDROIDS</b><small>COMPETITION PLATFORM</small></span></a>
        <div className="top-actions">{user ? <><span className="welcome">Hi, {user.name}</span><button className="btn btn-ghost" onClick={logout}>Log out</button></> : <a className="top-link" href="#account">Sign in</a>}</div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot"></span> BUILD • COMPETE • INNOVATE</div>
            <h1>Big ideas.<br /><span>Better teams.</span><br />Real competition.</h1>
            <p>One place to organize tournaments, submit projects, evaluate ideas, and discover the next winning team.</p>
            <a className="btn btn-primary" href="#tournaments">Explore tournaments <span>↗</span></a>
          </div>
          <div className="hero-visual" aria-label="Competition dashboard illustration">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
            <div className="hero-card card-main"><span className="mini-label">LIVE COMPETITION</span><div className="hero-symbol">⌘</div><h3>Ideas into impact.</h3><p>Make something that matters.</p><div className="progress"><i></i></div><div className="progress-meta"><span>TEAM PROGRESS</span><b>78%</b></div></div>
            <div className="float-card float-top"><span className="float-icon">✦</span><div><b>Skills matched</b><small>Find your perfect team</small></div></div>
            <div className="float-card float-bottom"><span className="trophy">♜</span><div><b>Leaderboard</b><small>Every point counts</small></div></div>
          </div>
        </section>

        <section className="stats">
          <div><b>{tournaments.length.toString().padStart(2, "0")}</b><span>TOURNAMENTS</span></div>
          <div><b>{submissions.length.toString().padStart(2, "0")}</b><span>PROJECTS IN SELECTED EVENT</span></div>
          <div><b>{leaderboard.length.toString().padStart(2, "0")}</b><span>RANKED TEAMS</span></div>
          <div><b>MER<span className="accent">N</span></b><span>POWERED PLATFORM</span></div>
        </section>

        {message && <div className="notice" role="status"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}

        {!user && <section className="section account-section" id="account">
          <div className="section-heading"><div><div className="eyebrow">GET STARTED</div><h2>Your next challenge starts here.</h2></div><p>Create an account to organize events, submit projects, and score entries.</p></div>
          <form className="panel auth-panel" onSubmit={handleAuth}>
            <div className="tabs"><button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Log in</button><button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Create account</button></div>
            {authMode === "register" && <label>Full name<input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="e.g. Alex Santos" /></label>}
            <label>Email address<input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></label>
            <label>Password<input type="password" minLength="6" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 6 characters" /></label>
            <button className="btn btn-primary full" type="submit">{authMode === "login" ? "Log in to platform" : "Create my account"} ↗</button>
          </form>
        </section>}

        <section className="section" id="tournaments">
          <div className="section-heading"><div><div className="eyebrow">THE COMPETITION HUB</div><h2>Find your next challenge.</h2></div><p>Browse events or create a tournament for your community.</p></div>
          <div className="tournament-layout">
            <div className="tournament-list">
              {tournaments.length === 0 && <div className="empty-state"><span>◇</span><h3>No tournaments yet</h3><p>Log in and create the first event for your community.</p></div>}
              {tournaments.map((t, i) => <button key={t._id} className={`event-card ${selected === t._id ? "selected" : ""}`} onClick={() => setSelected(t._id)}>
                <div className="event-number">0{i + 1}</div><div className="event-info"><span className="tag">{t.category || "Competition"}</span><h3>{t.title}</h3><p>{t.description || "A new opportunity to build, compete, and innovate."}</p><div className="event-meta">{t.eventDate || "Date to be announced"} <span>↗</span></div></div>
              </button>)}
            </div>
            <aside className="panel create-panel">
              <div className="panel-kicker">ORGANIZER SPACE</div><h3>Create a tournament</h3><p>Set up an event for teams to join and compete.</p>
              <form onSubmit={createTournament}>
                <label>Tournament name<input required value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. NU Buildathon 2026" /></label>
                <label>Competition type<select value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })}><option>Hackathon</option><option>Esports</option><option>Build Challenge</option><option>Innovation Contest</option><option>Other</option></select></label>
                <label>Event date<input type="date" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} /></label>
                <label>Description<textarea rows="3" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="What will participants build?" /></label>
                <button className="btn btn-dark full" disabled={!user}> {user ? "＋ Create tournament" : "Log in to create"} </button>
              </form>
            </aside>
          </div>
        </section>

        {chosen && <section className="section competition-section">
          <div className="section-heading"><div><div className="eyebrow">SELECTED EVENT</div><h2>{chosen.title}</h2></div><p>Submit a project, review entries, and track the scores.</p></div>
          <div className="work-grid">
            <div className="panel">
              <div className="panel-kicker">PROJECT ENTRY</div><h3>Submit your team's project</h3>
              <form onSubmit={submitProject}>
                <label>Team name<input required value={submitForm.teamName} onChange={e => setSubmitForm({ ...submitForm, teamName: e.target.value })} placeholder="Team name" /></label>
                <label>Project title<input required value={submitForm.projectTitle} onChange={e => setSubmitForm({ ...submitForm, projectTitle: e.target.value })} placeholder="Project title" /></label>
                <label>Project description<textarea rows="3" value={submitForm.description} onChange={e => setSubmitForm({ ...submitForm, description: e.target.value })} placeholder="What does your project do?" /></label>
                <label>Repository URL<input type="url" value={submitForm.repositoryUrl} onChange={e => setSubmitForm({ ...submitForm, repositoryUrl: e.target.value })} placeholder="https://github.com/..." /></label>
                <label>Demo URL<input type="url" value={submitForm.demoUrl} onChange={e => setSubmitForm({ ...submitForm, demoUrl: e.target.value })} placeholder="https://..." /></label>
                <button className="btn btn-primary full" disabled={!user}>Submit project ↗</button>
              </form>
            </div>
            <div className="panel entries-panel">
              <div className="panel-kicker">SUBMISSIONS</div><h3>Projects on the board <span className="count">{submissions.length}</span></h3>
              {submissions.length === 0 && <p className="muted">No projects submitted for this tournament yet.</p>}
              {submissions.map(s => <article className="submission" key={s._id}>
                <div className="submission-top"><div><span className="tag">{s.teamName}</span><h4>{s.projectTitle}</h4></div><span className="score-pill">{s.scores?.length ? `${s.scores.length} score(s)` : "Not scored"}</span></div>
                <p>{s.description || "No description provided."}</p>
                <div className="repo-links">{s.repositoryUrl && <a href={s.repositoryUrl} target="_blank" rel="noreferrer">Repository ↗</a>}{s.demoUrl && <a href={s.demoUrl} target="_blank" rel="noreferrer">Live demo ↗</a>}</div>
                <div className="score-controls"><span>Judge score (0–10 each)</span><div className="score-inputs">{Object.keys(scoreForm).map(k => <label key={k}>{k}<input type="number" min="0" max="10" value={scoreForm[k]} onChange={e => setScoreForm({ ...scoreForm, [k]: e.target.value })} /></label>)}</div><button className="btn btn-dark small" disabled={!user} onClick={() => scoreProject(s._id)}>Save score</button></div>
              </article>)}
            </div>
          </div>
        </section>}

        {chosen && <section className="section leaderboard-section">
          <div className="section-heading"><div><div className="eyebrow">THE RESULTS</div><h2>Leaderboard<span className="accent">.</span></h2></div><p>Rankings are calculated from the average total of all judges' scores.</p></div>
          <div className="panel leaderboard">
            <div className="leader-row leader-head"><span>RANK</span><span>TEAM / PROJECT</span><span>JUDGES</span><span>TOTAL / 40</span></div>
            {leaderboard.length === 0 && <p className="muted empty-board">Scores will appear here after judges evaluate projects.</p>}
            {leaderboard.map((r, i) => <div className="leader-row" key={r.id}><span className={`rank rank-${i + 1}`}>{String(i + 1).padStart(2, "0")}</span><span><b>{r.teamName}</b><small>{r.projectTitle}</small></span><span>{r.judgeCount}</span><strong>{r.totalScore.toFixed(2)}</strong></div>)}
          </div>
        </section>}
      </main>
      <footer><a className="brand" href="#home"><span className="brand-mark">NH</span><span>NU <b>HYDROIDS</b><small>COMPETITION PLATFORM</small></span></a><span>Build together. Compete fairly. Make an impact.</span><span>© 2026 NU HYDROIDS</span></footer>
    </div>
  );
}
