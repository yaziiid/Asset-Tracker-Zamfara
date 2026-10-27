import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MapPinned,
  LayoutDashboard,
  ClipboardList,
  Plus,
  Search,
  LogOut,
  Download,
  ArrowUpRight,
  LocateFixed,
  ShieldCheck,
  LoaderCircle,
  MapPin,
  Users,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
} from "firebase/firestore";
import { auth, configured, db } from "./firebase.js";
import { filterRecords, normalizeRecord, recordsToCsv } from "./domain.mjs";
const AssetMap = lazy(() => import("./AssetMap.jsx"));
const PAGE_SIZE = 250;
const blank = {
  name: "",
  address: "",
  phone: "",
  project: "",
  state: "Zamfara",
  latitude: "",
  longitude: "",
  assetCount: 1,
};
function message(error) {
  const messages = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/email-already-in-use":
      "This email already has an account. Sign in or reset your password.",
    "auth/weak-password":
      "Choose a stronger password with at least 8 characters.",
    "auth/too-many-requests":
      "Too many attempts. Please wait before trying again.",
    "auth/network-request-failed":
      "Cannot connect. Check your internet connection and try again.",
    "auth/operation-not-allowed":
      "Email/password sign-in must be enabled in Firebase Authentication.",
    "permission-denied":
      "Access denied. Ask your administrator to check your membership.",
    unavailable: "The database is temporarily unavailable. Please retry.",
  };
  return (
    messages[error.code] ||
    error.message ||
    "Something went wrong. Please try again."
  );
}
function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <div className="brand-symbol">
        <MapPinned size={25} strokeWidth={1.7} />
      </div>
      <div>
        <strong>ZAMFARA</strong>
        <span>ASSET TRACKER</span>
      </div>
    </div>
  );
}
function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
function AuthPage() {
  const [mode, setMode] = useState("login"),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    const f = new FormData(event.currentTarget),
      email = String(f.get("email")).trim();
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setStatus(
          "If an account exists for this email, a password reset link has been sent.",
        );
      } else {
        await setPersistence(
          auth,
          f.get("remember")
            ? browserLocalPersistence
            : browserSessionPersistence,
        );
        if (mode === "signup") {
          const result = await createUserWithEmailAndPassword(
            auth,
            email,
            String(f.get("password")),
          );
          await updateProfile(result.user, {
            displayName: String(f.get("name")).trim(),
          });
          await sendEmailVerification(result.user);
        } else
          await signInWithEmailAndPassword(
            auth,
            email,
            String(f.get("password")),
          );
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="story-content">
          <span className="eyebrow light">INFRASTRUCTURE INTELLIGENCE</span>
          <h1>
            A clearer view.
            <br />A stronger
            <br />
            <em>Zamfara.</em>
          </h1>
          <p>
            One place to register, locate and monitor the projects and assets
            that move our state forward.
          </p>
          <div className="story-rule" />
          <div className="story-caption">
            <MapPin size={17} /> Zamfara State, Nigeria{" "}
            <span>12.16° N · 6.66° E</span>
          </div>
        </div>
        <div className="auth-partners">
          <img src="/coat-of-arms.png" alt="Nigeria coat of arms" />
          <span>
            National Infrastructure
            <br />
            Monitoring System
          </span>
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">ZAMFARA ASSET TRACKER</span>
          <h2>
            {mode === "login"
              ? "Welcome back."
              : mode === "signup"
                ? "Create your account."
                : "Reset your password."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in to your infrastructure workspace."
              : mode === "signup"
                ? "Verify your email, then request access from an administrator."
                : "We’ll send a secure reset link to your email."}
          </p>
          <Notice error>{error}</Notice>
          <Notice>{status}</Notice>
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Your full name"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </label>
            {mode !== "reset" && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  placeholder="Enter your password"
                />
              </label>
            )}
            {mode === "login" && (
              <div className="form-options">
                <label className="check">
                  <input name="remember" type="checkbox" />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setMode("reset");
                    setError("");
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
                  <ArrowUpRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login"
              ? "New to the portal? "
              : "Already have an account? "}
            <button
              className="text-button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setStatus("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <div className="secure-note">
            <ShieldCheck size={17} /> Secure access for authorised project teams
          </div>
        </div>
        <footer>
          National Infrastructure Monitoring System{" "}
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </section>
    </main>
  );
}
function AccessPage({ user, verified }) {
  const [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(kind) {
    setBusy(true);
    setError("");
    try {
      if (kind === "send") {
        await sendEmailVerification(user);
        setStatus("Verification email sent. Check your inbox and spam folder.");
      } else {
        await user.reload();
        await user.getIdToken(true);
        window.location.reload();
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="access-page">
      <Brand />
      <div className="access-card">
        <ShieldCheck size={40} />
        <h1>
          {verified ? "Your workspace is almost ready." : "Verify your email."}
        </h1>
        <p>
          {verified
            ? "An administrator needs to give your account access before you can view or register assets."
            : `Open the verification link sent to ${user.email}, then check your status below.`}
        </p>
        <Notice error>{error}</Notice>
        <Notice>{status}</Notice>
        {verified && (
          <label>
            Your account ID<code className="uid">{user.uid}</code>
            <small>Share this ID with your administrator.</small>
          </label>
        )}
        <div className="button-row">
          <button
            className="primary"
            disabled={busy}
            onClick={() => action("check")}
          >
            {verified ? "Check access" : "I’ve verified my email"}
          </button>
          {!verified && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() => action("send")}
            >
              Resend email
            </button>
          )}
          <button className="text-button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
function EnrolForm({ user, onSaved }) {
  const [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [finding, setFinding] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  function update(event) {
    const { name, value } = event.target;
    setForm((old) => ({
      ...old,
      [name]: value,
      ...(name === "address" ? { latitude: "", longitude: "" } : {}),
    }));
    setStatus("");
  }
  async function geocode() {
    setFinding(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: form.address }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "Could not find coordinates. Enter them manually.",
        );
      setForm((old) => ({
        ...old,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
      setStatus("Coordinates found. Confirm the location before saving.");
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "Automatic geocoding is unavailable here. Enter coordinates manually."
          : message(e),
      );
    } finally {
      setFinding(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const record = normalizeRecord(form);
      await addDoc(collection(db, "records"), {
        ...record,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setForm({ ...blank });
      setStatus("Asset registered successfully.");
      await onSaved();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    [
      "name",
      "Client / organisation name",
      "e.g. Gusau Municipal Council",
      "text",
      true,
      120,
    ],
    [
      "project",
      "Project / asset reference",
      "e.g. Borehole rehabilitation – 001",
      "text",
      true,
      120,
    ],
    [
      "phone",
      "Phone number (optional)",
      "e.g. +234 800 000 0000",
      "tel",
      false,
      30,
    ],
    ["state", "State", "Zamfara", "text", true, 80],
    ["assetCount", "Number of assets", "1", "number", true],
  ];
  return (
    <div className="form-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EXPAND THE REGISTER</span>
          <h2>Register an asset</h2>
          <p className="muted">
            Add a project and its location to the monitoring system.
          </p>
        </div>
        <div className="round-icon">
          <Plus />
        </div>
      </div>
      <Notice error>{error}</Notice>
      <Notice>{status}</Notice>
      <form onSubmit={submit}>
        <div className="field-grid">
          {fields.map(
            ([name, label, placeholder, type, required, maxLength]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  value={form[name]}
                  onChange={update}
                  type={type}
                  required={required}
                  maxLength={maxLength}
                  min={name === "assetCount" ? 0 : undefined}
                  max={name === "assetCount" ? 1000000 : undefined}
                  placeholder={placeholder}
                />
              </label>
            ),
          )}
        </div>
        <label>
          Full project address
          <textarea
            name="address"
            value={form.address}
            onChange={update}
            required
            minLength={5}
            maxLength={500}
            placeholder="Street / community, LGA, state and country"
            rows={3}
          />
        </label>
        <div className="coordinate-heading">
          <h3>Project location</h3>
          <button
            type="button"
            className="secondary small"
            disabled={finding || busy || form.address.trim().length < 5}
            onClick={geocode}
          >
            <LocateFixed size={15} />
            {finding ? "Finding…" : "Find coordinates"}
          </button>
        </div>
        <p className="muted small-text">
          Enter verified coordinates or find them from the address. Check the
          location before saving.
        </p>
        <div className="field-grid">
          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitude}
              onChange={update}
              placeholder="12.16"
              required
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitude}
              onChange={update}
              placeholder="6.66"
              required
            />
          </label>
        </div>
        <div className="form-submit">
          <span>All required fields must be completed.</span>
          <button className="primary" disabled={busy || finding}>
            {busy ? "Saving…" : "Register asset"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
function AccessManager({ user }) {
  const [uid, setUid] = useState(""),
    [role, setRole] = useState("viewer"),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    setBusy(true);
    try {
      if (uid.trim() === user.uid)
        throw new Error(
          "Use the Firebase console for changes to your own administrator account.",
        );
      await setDoc(doc(db, "members", uid.trim()), { role });
      setStatus("Workspace access updated.");
      setUid("");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-panel">
      <span className="eyebrow">WORKSPACE ADMINISTRATION</span>
      <h2>Team access</h2>
      <p className="muted">
        Ask the team member to create an account, verify their email and share
        the account ID shown on their access screen.
      </p>
      <Notice error>{error}</Notice>
      <Notice>{status}</Notice>
      <form onSubmit={submit}>
        <label>
          Firebase account ID
          <input
            required
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            pattern="[^/\s]{1,128}"
            maxLength={128}
            placeholder="Paste the team member’s account ID"
          />
        </label>
        <label>
          Access level
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="viewer">Viewer — view and export records</option>
            <option value="editor">Editor — also register assets</option>
            <option value="admin">
              Administrator — also manage team access
            </option>
          </select>
        </label>
        <button className="primary" disabled={busy}>
          Save access
          <ShieldCheck size={17} />
        </button>
      </form>
    </div>
  );
}
function Workspace({ user, role }) {
  const [page, setPage] = useState("overview"),
    [records, setRecords] = useState([]),
    [cursor, setCursor] = useState(null),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [sort, setSort] = useState("newest"),
    [selected, setSelected] = useState(null),
    [tablePage, setTablePage] = useState(0);
  const canWrite = ["editor", "admin"].includes(role);
  const load = useCallback(async (after = null) => {
    setLoading(true);
    setError("");
    try {
      const constraints = [
        orderBy("createdAt", "desc"),
        orderBy("__name__", "desc"),
      ];
      if (after) constraints.push(startAfter(after));
      const result = await getDocs(
        query(collection(db, "records"), ...constraints, limit(PAGE_SIZE)),
      );
      const rows = result.docs.map((d) => ({ ...d.data(), id: d.id }));
      setRecords((old) =>
        after
          ? [...old, ...rows.filter((r) => !old.some((o) => o.id === r.id))]
          : rows,
      );
      setCursor(result.docs.at(-1) || null);
      setMore(result.size === PAGE_SIZE);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
    return () => setRecords([]);
  }, [load]);
  useEffect(() => {
    setTablePage(0);
  }, [search, state, sort]);
  const filtered = useMemo(
    () => filterRecords(records, search, state, sort),
    [records, search, state, sort],
  );
  const select = useCallback((id) => setSelected(id), []);
  const active = records.find((r) => r.id === selected);
  const nav = [
    ["overview", LayoutDashboard, "Overview"],
    ["records", ClipboardList, "Asset register"],
    ...(canWrite ? [["register", Plus, "Register asset"]] : []),
    ...(role === "admin" ? [["team", Users, "Team access"]] : []),
  ];
  function exportCsv() {
    const blob = new Blob([recordsToCsv(filtered)], {
        type: "text/csv;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `zamfara-assets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand compact />
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map(([id, Icon, name]) => (
            <button
              className={page === id ? "active" : ""}
              key={id}
              onClick={() => setPage(id)}
            >
              <Icon size={19} />
              {name}
              {id === "register" && <span className="nav-plus">+</span>}
            </button>
          ))}
          <button className="mobile-signout" onClick={() => signOut(auth)}>
            <LogOut size={18} />
            Sign out
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="state-card">
            <img src="/coat-of-arms.png" alt="Nigeria coat of arms" />
            <span>
              National Infrastructure
              <br />
              Monitoring System
            </span>
          </div>
          <div className="profile">
            <div className="avatar">
              {(user.displayName || user.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div>
              <strong>{user.displayName || user.email?.split("@")[0]}</strong>
              <small>{role}</small>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={() => signOut(auth)}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-workspace">
        <header className="topbar">
          <span>
            Monitoring portal{" "}
            <span className="breadcrumb">
              / {nav.find((n) => n[0] === page)?.[2]}
            </span>
          </span>
          <span className="state-badge">
            <span /> Zamfara State
          </span>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                NATIONAL INFRASTRUCTURE MONITORING SYSTEM
              </span>
              <h1>
                {page === "overview"
                  ? "Infrastructure, in focus."
                  : page === "records"
                    ? "The asset register."
                    : page === "team"
                      ? "A connected team."
                      : "Every asset counts."}
              </h1>
              <p className="muted">
                {page === "overview"
                  ? "Track projects. Connect locations. See the bigger picture."
                  : page === "records"
                    ? "Browse, search and export your registered infrastructure."
                    : page === "team"
                      ? "Manage who can use your infrastructure workspace."
                      : "Build a reliable picture of infrastructure across the state."}
              </p>
            </div>
            {canWrite && !["register", "team"].includes(page) && (
              <button className="primary" onClick={() => setPage("register")}>
                <Plus size={18} />
                Register asset
              </button>
            )}
          </div>
          {["overview", "records"].includes(page) && (
            <>
              <div className="stats">
                <article>
                  <div className="stat-label">
                    REGISTERED RECORDS
                    <Package size={18} />
                  </div>
                  <strong>
                    {records.length.toLocaleString()}
                    {more ? "+" : ""}
                  </strong>
                  <span>
                    {more
                      ? "Loaded records · more available"
                      : "Records in the register"}
                  </span>
                </article>
                <article>
                  <div className="stat-label">
                    ASSETS MONITORED
                    <ClipboardList size={18} />
                  </div>
                  <strong>
                    {records
                      .reduce((sum, r) => sum + (r.assetCount || 0), 0)
                      .toLocaleString()}
                  </strong>
                  <span>Across loaded project records</span>
                </article>
                <article>
                  <div className="stat-label">
                    LOCATIONS MAPPED
                    <MapPin size={18} />
                  </div>
                  <strong>
                    {records
                      .filter(
                        (r) =>
                          Number.isFinite(r.latitude) &&
                          Number.isFinite(r.longitude),
                      )
                      .length.toLocaleString()}
                  </strong>
                  <span>Projects with coordinates</span>
                </article>
              </div>
              <Notice error>{error}</Notice>
              <div className="data-panel">
                <div className="data-heading">
                  <div>
                    <h2>
                      {page === "overview"
                        ? "Project locations"
                        : "Registered assets"}
                      <span className="count">{filtered.length}</span>
                    </h2>
                    <p className="muted small-text">
                      {more
                        ? "Search and totals cover loaded records. Load more to include older entries."
                        : "Your infrastructure register, connected to place."}
                    </p>
                  </div>
                  <div className="button-row">
                    <button
                      className="secondary small"
                      onClick={() => load()}
                      disabled={loading}
                    >
                      <RefreshCw size={15} />
                      Refresh
                    </button>
                    <button
                      className="secondary small"
                      disabled={!filtered.length}
                      onClick={exportCsv}
                    >
                      <Download size={15} />
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="filters">
                  <div className="search-input">
                    <Search size={17} />
                    <input
                      aria-label="Search assets"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search project, client or address…"
                    />
                  </div>
                  <select
                    aria-label="Filter by state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">All states</option>
                    {[...new Set(records.map((r) => r.state))]
                      .sort()
                      .map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </select>
                  <select
                    aria-label="Sort assets"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest first</option>
                    <option value="name">Client A–Z</option>
                    <option value="project">Project A–Z</option>
                  </select>
                </div>
                {loading && !records.length ? (
                  <div className="empty">
                    <LoaderCircle className="spin" />
                    Loading records…
                  </div>
                ) : page === "overview" ? (
                  <>
                    <div className="map-wrap">
                      <Suspense
                        fallback={<div className="empty">Loading map…</div>}
                      >
                        <AssetMap
                          records={filtered}
                          selected={selected}
                          onSelect={select}
                        />
                      </Suspense>
                      {!filtered.length && (
                        <div className="map-empty">
                          <MapPinned size={25} />
                          <strong>
                            {records.length
                              ? "No matching assets"
                              : error
                                ? "Records could not be loaded"
                                : "Your map starts here"}
                          </strong>
                          <span>
                            {records.length
                              ? "Try a different search or state."
                              : error
                                ? "Use Refresh to try again."
                                : "Register your first asset to put it on the map."}
                          </span>
                        </div>
                      )}
                      <div className="map-key">
                        <span />
                        Registered project <span className="gold" />
                        Selected project
                      </div>
                    </div>
                    {active && (
                      <div className="selected-record">
                        <MapPin size={18} />
                        <strong>{active.project}</strong>
                        <span>
                          {active.name} · {active.address}
                        </span>
                        <button
                          className="text-button"
                          onClick={() => setSelected(null)}
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Project / reference</th>
                            <th>Client</th>
                            <th>Location</th>
                            <th>Assets</th>
                            <th>Registered</th>
                            <th>
                              <span className="sr-only">Action</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered
                            .slice(tablePage * 25, tablePage * 25 + 25)
                            .map((r) => (
                              <tr key={r.id}>
                                <td>
                                  <strong>{r.project}</strong>
                                  <small>{r.phone || "—"}</small>
                                </td>
                                <td>{r.name}</td>
                                <td>
                                  {r.address}
                                  <small>
                                    {r.state} · {r.latitude}, {r.longitude}
                                  </small>
                                </td>
                                <td>{r.assetCount}</td>
                                <td>{r.date}</td>
                                <td>
                                  <button
                                    className="icon-button"
                                    title={`Show ${r.project} on map`}
                                    aria-label={`Show ${r.project} on map`}
                                    onClick={() => {
                                      setSearch("");
                                      setState("");
                                      select(r.id);
                                      setPage("overview");
                                    }}
                                  >
                                    <ArrowUpRight size={17} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {!filtered.length && (
                      <div className="empty">
                        <ClipboardList size={28} />
                        <strong>
                          {error
                            ? "Records could not be loaded"
                            : "No records to display"}
                        </strong>
                        <span>
                          {error
                            ? "Use Refresh to try again."
                            : "Register an asset or adjust your search."}
                        </span>
                      </div>
                    )}
                    <div className="pagination">
                      <span>
                        {filtered.length ? tablePage * 25 + 1 : 0}–
                        {Math.min((tablePage + 1) * 25, filtered.length)} of{" "}
                        {filtered.length} loaded records
                      </span>
                      <div className="button-row">
                        <button
                          className="secondary small"
                          disabled={tablePage === 0}
                          onClick={() => setTablePage((p) => p - 1)}
                        >
                          Previous
                        </button>
                        <button
                          className="secondary small"
                          disabled={(tablePage + 1) * 25 >= filtered.length}
                          onClick={() => setTablePage((p) => p + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {more && (
                  <div className="load-more">
                    <button
                      className="secondary"
                      disabled={loading}
                      onClick={() => load(cursor)}
                    >
                      {loading ? "Loading…" : "Load older records"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {page === "register" && canWrite && (
            <EnrolForm user={user} onSaved={() => load()} />
          )}{" "}
          {page === "team" && role === "admin" && <AccessManager user={user} />}
          <footer className="workspace-footer">
            <span>ZAMFARA ASSET TRACKER</span>
            <span>Building a clearer picture of our infrastructure.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState(undefined),
    [member, setMember] = useState(undefined),
    [error, setError] = useState("");
  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(auth, (next) => {
      setMember(undefined);
      setError("");
      setUser(next);
    });
  }, []);
  useEffect(() => {
    if (!user?.emailVerified) return;
    return onSnapshot(
      doc(db, "members", user.uid),
      (snap) => setMember(snap.exists() ? snap.data() : null),
      (e) => {
        setError(message(e));
        setMember(null);
      },
    );
  }, [user]);
  if (!configured)
    return (
      <main className="access-page">
        <Brand />
        <div className="access-card">
          <h1>Connect your Firebase project.</h1>
          <p>
            Firebase configuration is missing. Set the four VITE_FIREBASE
            environment variables listed in the deployment guide and rebuild the
            site.
          </p>
        </div>
      </main>
    );
  if (user === undefined || (user?.emailVerified && member === undefined))
    return (
      <main className="loading-page">
        <Brand />
        <LoaderCircle className="spin" />
        <p>Opening your workspace…</p>
      </main>
    );
  if (!user) return <AuthPage />;
  if (
    !user.emailVerified ||
    !["admin", "editor", "viewer"].includes(member?.role)
  )
    return (
      <>
        <Notice error>{error}</Notice>
        <AccessPage user={user} verified={user.emailVerified} />
      </>
    );
  return <Workspace key={user.uid} user={user} role={member.role} />;
}
