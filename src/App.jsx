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
  ClipboardList,
  Plus,
  LogOut,
  ArrowUpRight,
  LocateFixed,
  ShieldCheck,
  LoaderCircle,
  Users,
  RefreshCw,
  Leaf,
  TreePine,
  BookOpen,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  X,
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
  runTransaction,
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
import Sidebar from "./Sidebar.jsx";
import RecordsPanel from "./RecordsPanel.jsx";
import RecordFilters from "./RecordFilters.jsx";
import { readPreference, writePreference } from "./ui-preferences.mjs";
import { createVerificationSender } from "./verification.mjs";
import { PartnerLogos, ProgrammePage } from "./Programme.jsx";
import { auth, configured, db } from "./firebase.js";
import {
  filterRecords,
  normalizeRecord,
  recordsToCsv,
  productDocumentId,
} from "./domain.mjs";
const AssetMap = lazy(() => import("./AssetMap.jsx"));
const PAGE_SIZE = 250;
const blank = {
  name: "",
  address: "",
  phone: "",
  project: "",
  state: "",
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
        <Leaf size={25} strokeWidth={1.7} />
      </div>
      <div>
        <strong>
          Save80<span className="brand-dot">.</span>
        </strong>
        <span>STOVE TRACKER</span>
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
function AuthPage({ requestVerification }) {
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
          await requestVerification(result.user);
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
  if (mode === "about")
    return (
      <main className="programme-public">
        <ProgrammePage onBack={() => setMode("login")} />
      </main>
    );
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div className="story-content">
          <span className="eyebrow light">
            <Leaf size={13} /> FUEL-EFFICIENT COOKING. SHARED PROGRESS.
          </span>
          <h1>
            Less firewood.
            <br />
            <em>More possibility.</em>
          </h1>
          <p>
            Connecting Save80 stoves with the households and communities they
            serve. A clearer view of every delivery, wherever the programme
            grows.
          </p>
          <div className="story-tags">
            <span>
              <TreePine size={15} />
              Lower fuel demand
            </span>
            <span>
              <Users size={15} />
              Stronger communities
            </span>
          </div>
        </div>
        <figure className="stove-feature">
          <img
            src="/save80-stove.jpg"
            alt="Save80 stove with a cooking pot, fuelled by small sticks of wood"
          />
          <figcaption>
            <span>SAVE80 IN PRACTICE</span>
            <strong>
              Thoughtful design.
              <br />
              Everyday cooking.
            </strong>
            <small>
              Fuel-efficient stoves for households that cook with firewood.
            </small>
          </figcaption>
        </figure>
        <div className="auth-partners">
          <span className="partner-eyebrow">A SHARED COMMITMENT</span>
          <PartnerLogos />
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">SAVE80 STOVE TRACKER</span>
          <h2>
            {mode === "login"
              ? "Welcome back."
              : mode === "signup"
                ? "Create your account."
                : "Reset your password."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Sign in to your Save80 programme workspace."
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
          <button
            className="text-button learn-save80"
            onClick={() => setMode("about")}
          >
            <Leaf size={15} />
            About Save80 &amp; the programme
            <ArrowUpRight size={14} />
          </button>
          <div className="secure-note">
            <ShieldCheck size={17} /> Secure access for authorised programme
            teams
          </div>
        </div>
        <footer>
          Save80 · TBCN × atmosfair <span>© {new Date().getFullYear()}</span>
        </footer>
      </section>
    </main>
  );
}
function AccessPage({
  user,
  verified,
  verification,
  retryAt,
  requestVerification,
}) {
  const [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [clock, setClock] = useState(Date.now());
  const emailState = verification?.uid === user.uid ? verification : {};
  const remaining = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  useEffect(() => {
    if (verified || !retryAt || retryAt <= Date.now()) return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [verified, retryAt]);
  async function action(kind) {
    setBusy(true);
    setError("");
    try {
      if (kind === "send") {
        setClock(Date.now());
        await requestVerification(user);
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
            ? "An administrator needs to give your account access before you can view recipients or register stove deliveries."
            : `Verify ${user.email} by opening the link in your verification email. If it has not arrived, request one below and check your inbox and spam folder.`}
        </p>
        <Notice error>{error || emailState.error}</Notice>
        <Notice>{status || emailState.status}</Notice>
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
              disabled={busy || emailState.busy || remaining > 0}
              onClick={() => action("send")}
            >
              {emailState.busy
                ? "Requesting email…"
                : remaining > 0
                  ? `Resend in ${remaining}s`
                  : "Resend email"}
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
      const reference = doc(
        db,
        "records",
        await productDocumentId(record.project),
      );
      await runTransaction(db, async (transaction) => {
        if ((await transaction.get(reference)).exists())
          throw new Error(
            "This Product ID is already registered. Check Records before trying again.",
          );
        transaction.set(reference, {
          ...record,
          assetCount: 1,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
      });
      setForm({ ...blank });
      setStatus("Save80 stove registered successfully.");
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
      "Recipient / household name",
      "Enter the recipient’s full name",
      "text",
      true,
      120,
    ],
    ["project", "Product ID", "e.g. S80-00042", "text", true, 120],
    [
      "phone",
      "Phone number (optional)",
      "e.g. +234 800 000 0000",
      "tel",
      false,
      30,
    ],
    ["state", "State / region", "Enter state or region", "text", true, 80],
  ];
  return (
    <div className="form-panel">
      <div className="panel-heading">
        <div>
          <h1>Register stove</h1>
          <p className="muted">
            One Product ID per stove. Add the recipient and delivery location
            below.
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
          Household / delivery address
          <textarea
            name="address"
            value={form.address}
            onChange={update}
            required
            minLength={5}
            maxLength={500}
            placeholder="Community, district / LGA, state or region, and country"
            rows={3}
          />
        </label>
        <div className="coordinate-heading">
          <h3>Delivery location</h3>
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
              placeholder="e.g. 9.08"
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
              placeholder="e.g. 7.40"
              required
            />
          </label>
        </div>
        <div className="form-submit">
          <span>All required fields must be completed.</span>
          <button className="primary" disabled={busy || finding}>
            {busy ? "Saving…" : "Register stove"}
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
            <option value="editor">
              Editor — also register stove deliveries
            </option>
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
  const [page, setPage] = useState("map"),
    [records, setRecords] = useState([]),
    [cursor, setCursor] = useState(null),
    [more, setMore] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [sort, setSort] = useState("newest"),
    [selected, setSelected] = useState(null),
    [collapsed, setCollapsed] = useState(
      () => readPreference("sidebar-collapsed", "false") === "true",
    ),
    [mobileOpen, setMobileOpen] = useState(false),
    [isMobile, setIsMobile] = useState(
      () => window.matchMedia("(max-width: 850px)").matches,
    ),
    [theme, setTheme] = useState(() =>
      readPreference(
        "theme",
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      ) === "dark"
        ? "dark"
        : "light",
    );
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
    const query = window.matchMedia("(max-width: 850px)");
    const change = () => {
      setIsMobile(query.matches);
      setMobileOpen(false);
    };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    writePreference("theme", theme);
  }, [theme]);
  useEffect(() => writePreference("sidebar-collapsed", collapsed), [collapsed]);
  const filtered = useMemo(
    () => filterRecords(records, search, state, sort),
    [records, search, state, sort],
  );
  const select = useCallback((id) => setSelected(id), []);
  const closeNavigation = useCallback(() => setMobileOpen(false), []);
  const navigate = (id) => {
    setPage(id);
    setMobileOpen(false);
  };
  const active = filtered.find((r) => r.id === selected);
  const nav = [
    ["map", MapPinned, "Map"],
    ["records", ClipboardList, "Records"],
    ...(canWrite ? [["register", Plus, "Register stove"]] : []),
    ["programme", BookOpen, "About Save80"],
    ...(role === "admin" ? [["team", Users, "Team access"]] : []),
  ];
  const loadMore = () => load(cursor);
  function exportCsv() {
    const blob = new Blob([recordsToCsv(filtered)], {
        type: "text/csv;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `save80-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div
      className={`workspace redesigned-workspace ${collapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar
        {...{ nav, page, collapsed, isMobile, user, role }}
        open={mobileOpen}
        onClose={closeNavigation}
        onNavigate={navigate}
        onSignOut={() => signOut(auth)}
      />
      <div className="main-workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="navigation-toggle icon-button"
              aria-label={
                isMobile
                  ? "Open navigation"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
              aria-controls="programme-navigation"
              aria-expanded={isMobile ? mobileOpen : !collapsed}
              onClick={() =>
                isMobile ? setMobileOpen(true) : setCollapsed((v) => !v)
              }
            >
              {isMobile ? (
                <Menu size={22} />
              ) : collapsed ? (
                <PanelLeftOpen size={22} />
              ) : (
                <PanelLeftClose size={22} />
              )}
            </button>
            <span>{nav.find((n) => n[0] === page)?.[2]}</span>
          </div>
          <button
            className="theme-toggle secondary small"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() =>
              setTheme((value) => (value === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </header>
        <main className={`content ${page === "map" ? "map-content" : ""}`}>
          {page === "map" && (
            <section className="map-page" aria-label="Household map">
              <h1 className="sr-only">Map</h1>
              <Suspense
                fallback={
                  <div className="map-service-status">Loading map…</div>
                }
              >
                <AssetMap
                  records={filtered}
                  selected={selected}
                  onSelect={select}
                  theme={theme}
                />
              </Suspense>
              <div className="map-toolbar">
                <RecordFilters
                  {...{ records, search, setSearch, state, setState }}
                />
                <button
                  className="map-refresh icon-button"
                  disabled={loading}
                  title="Refresh records"
                  aria-label="Refresh records"
                  onClick={() => load()}
                >
                  <RefreshCw size={19} className={loading ? "spin" : ""} />
                </button>
              </div>
              {error && (
                <div className="map-notice notice error" role="alert">
                  {error}
                </div>
              )}
              {active && (
                <aside
                  className="map-selected-record"
                  aria-label="Selected household"
                >
                  <div>
                    <strong>{active.project}</strong>
                    <button
                      className="icon-button"
                      aria-label="Clear selection"
                      onClick={() => setSelected(null)}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <h2>{active.name}</h2>
                  <p>{active.address}</p>
                  <span>
                    {active.state} · {active.latitude}, {active.longitude}
                  </span>
                </aside>
              )}
              {(more || loading) && (
                <div className="map-loading-status" role="status">
                  {loading ? (
                    "Loading records…"
                  ) : (
                    <>
                      <span>{records.length} records loaded</span>
                      <button className="text-button" onClick={loadMore}>
                        Load older records
                      </button>
                    </>
                  )}
                </div>
              )}
            </section>
          )}
          {page === "records" && (
            <RecordsPanel
              {...{
                records,
                filtered,
                more,
                loading,
                error,
                load,
                loadMore,
                canWrite,
                exportCsv,
                search,
                setSearch,
                state,
                setState,
                sort,
                setSort,
              }}
              onRegister={() => navigate("register")}
              onMap={(id) => {
                setSearch("");
                setState("");
                select(id);
                navigate("map");
              }}
            />
          )}
          {page === "programme" && <ProgrammePage />}
          {page === "register" && canWrite && (
            <EnrolForm user={user} onSaved={() => load()} />
          )}
          {page === "team" && role === "admin" && <AccessManager user={user} />}
        </main>
      </div>
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState(undefined),
    [member, setMember] = useState(undefined),
    [error, setError] = useState(""),
    [verification, setVerification] = useState(null);
  const [verificationSender] = useState(() =>
    createVerificationSender({
      deliver: (account) =>
        sendEmailVerification(account, { url: window.location.origin + "/" }),
      storage: window.sessionStorage,
      onChange: setVerification,
    }),
  );
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
  if (!user) return <AuthPage requestVerification={verificationSender.send} />;
  if (
    !user.emailVerified ||
    !["admin", "editor", "viewer"].includes(member?.role)
  )
    return (
      <>
        <Notice error>{error}</Notice>
        <AccessPage
          user={user}
          verified={user.emailVerified}
          verification={verification}
          retryAt={
            verification?.uid === user.uid
              ? verification.retryAt
              : verificationSender.retryAt(user.uid)
          }
          requestVerification={verificationSender.send}
        />
      </>
    );
  return <Workspace key={user.uid} user={user} role={member.role} />;
}
