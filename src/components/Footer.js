import { CATEGORY_META } from "../constants";

export default function Footer({ setPage }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand-name">DailyBasket<span></span></div>
            <p className="footer-tagline">
              Fresh groceries, spices &amp; daily<br />essentials — delivered fast.
            </p>
          </div>

          <div className="footer-links">
            <h4>Shop</h4>
            <div className="footer-link-list">
              {Object.entries(CATEGORY_META).map(([key, { label }]) => (
                <button key={key} className="footer-btn" onClick={() => setPage(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="footer-links">
            <h4>Account</h4>
            <div className="footer-link-list">
              <button className="footer-btn" onClick={() => setPage("login")}>Login</button>
              <button className="footer-btn" onClick={() => setPage("login")}>Register</button>
              <button className="footer-btn" onClick={() => setPage("orders")}>My Orders</button>
              <button className="footer-btn" onClick={() => setPage("admin-login")}>Admin Access</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} DailyBasket. All rights reserved.</p>
          <p className="footer-copy" style={{ opacity: 0.6 }}>Made with care for everyday essentials.</p>
        </div>
      </div>
    </footer>
  );
}
