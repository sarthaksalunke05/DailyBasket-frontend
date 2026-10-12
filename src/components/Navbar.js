import { useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Icons } from "./Icons";
import { CATEGORY_META } from "../constants";

export default function Navbar({ page, setPage, onSearch, onCartClick }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const inputRef = useRef(null);

  const navItems = [
    { key: "home", label: "Home" },
    ...Object.entries(CATEGORY_META).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal.trim());
    setMobileSearchOpen(false);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
    if (!mobileSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const go = (p) => { setPage(p); setDrawerOpen(false); setMobileSearchOpen(false); };

  return (
    <>
      <nav className="nav">
        {/* Logo — hidden on mobile when searching */}
        <div className={`nav-logo ${mobileSearchOpen ? "mobile-hidden" : ""}`} onClick={() => go("home")}>
          DailyBasket<span></span>
        </div>

        {/* Search */}
        <form className={`nav-search ${mobileSearchOpen ? "mobile-open" : ""}`} onSubmit={handleSearch}>
          <span className="nav-search-icon">{Icons.search}</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            aria-label="Search products"
          />
          {mobileSearchOpen && (
            <button type="button" className="nav-search-close" onClick={() => setMobileSearchOpen(false)}>
              {Icons.close}
            </button>
          )}
        </form>

        {/* Desktop nav links */}
        <div className="nav-links">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              className={`nav-link ${page === key ? "active" : ""}`}
              onClick={() => go(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className={`nav-actions ${mobileSearchOpen ? "mobile-hidden" : ""}`}>
          <button className="nav-mobile-search-toggle" onClick={toggleMobileSearch} aria-label="Search">
            {Icons.search}
          </button>

          {user ? (
            <>
              {user.role === "admin" && (
                <button className={`nav-btn nav-btn-ghost ${page === "admin" ? "active" : ""}`} onClick={() => go("admin")}>
                  {Icons.admin}
                  <span style={{ display: "none" }}>Admin</span>
                </button>
              )}
              <button className="nav-btn nav-btn-ghost" onClick={() => go("orders")}>
                {Icons.orders}
              </button>
              <div className="nav-user-chip">
                {Icons.user}
                <span className="user-name-text">{user.username}</span>
                <button
                  style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  onClick={logout}
                  title="Logout"
                >
                  {Icons.logout}
                </button>
              </div>
            </>
          ) : (
            <button className="nav-btn nav-btn-ghost" onClick={() => go("login")}>
              {Icons.user}
              <span>Login</span>
            </button>
          )}

          {user?.role !== 'admin' && (
            <button className="nav-btn nav-btn-dark" onClick={onCartClick}>
              {Icons.cart}
              <span>Cart</span>
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
          >
            {drawerOpen ? Icons.close : Icons.menu}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="menu-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <div className="nav-logo">Shop<span>G</span></div>
              <button
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex" }}
                onClick={() => setDrawerOpen(false)}
              >
                {Icons.close}
              </button>
            </div>

            {navItems.map(({ key, label }) => (
              <button
                key={key}
                className={`drawer-link ${page === key ? "active" : ""}`}
                onClick={() => go(key)}
              >
                {label}
              </button>
            ))}

            <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

            {user ? (
              <>
                <button className="drawer-link" onClick={() => go("orders")}>My Orders</button>
                {user.role === "admin" && (
                  <button className="drawer-link" onClick={() => go("admin")}>Admin Panel</button>
                )}
                <button className="drawer-link" onClick={() => { logout(); setDrawerOpen(false); }}>
                  Logout
                </button>
              </>
            ) : (
              <button className="drawer-link" onClick={() => go("login")}>Login / Register</button>
            )}
          </div>
        </>
      )}
    </>
  );
}
