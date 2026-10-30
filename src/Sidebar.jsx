import { useEffect, useRef } from "react";
import { Leaf, LogOut, X } from "lucide-react";
import { PartnerLogos } from "./Programme.jsx";
export default function Sidebar({
  nav,
  page,
  onNavigate,
  collapsed,
  isMobile,
  open,
  onClose,
  user,
  role,
  onSignOut,
}) {
  const panel = useRef(null);
  useEffect(() => {
    if (!isMobile || !open) return;
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      [
        ...panel.current.querySelectorAll("button:not(:disabled), a[href]"),
      ].filter((node) => node.getClientRects().length);
    focusable()[0]?.focus();
    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const targets = focusable(),
        first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      before?.focus();
    };
  }, [isMobile, open, onClose]);
  return (
    <>
      {isMobile && open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={onClose}
          tabIndex={-1}
        />
      )}
      <aside
        ref={panel}
        id="programme-navigation"
        aria-label="Programme navigation"
        aria-hidden={isMobile && !open ? true : undefined}
        className={`sidebar ${collapsed && !isMobile ? "is-collapsed" : ""} ${open ? "is-open" : ""}`}
        inert={isMobile && !open ? true : undefined}
        role={isMobile && open ? "dialog" : undefined}
        aria-modal={isMobile && open ? true : undefined}
      >
        <div className="sidebar-brand-row">
          <div className="brand compact">
            <div className="brand-symbol">
              <Leaf size={25} />
            </div>
            <div className="brand-wordmark">
              <strong>
                Save80<span className="brand-dot">.</span>
              </strong>
              <span>STOVE TRACKER</span>
            </div>
          </div>
          <button
            className="sidebar-close icon-button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([id, Icon, name]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              aria-label={name}
              title={collapsed ? name : undefined}
              onClick={() => onNavigate(id)}
            >
              <Icon size={21} aria-hidden="true" />
              <span className="nav-label">{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-partners">
            <PartnerLogos compact />
          </div>
          <div className="profile">
            <div className="avatar">
              {(user.displayName || user.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="profile-details">
              <strong>{user.displayName || user.email?.split("@")[0]}</strong>
              <small>{role}</small>
            </div>
            <button aria-label="Sign out" title="Sign out" onClick={onSignOut}>
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
