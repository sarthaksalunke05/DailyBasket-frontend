import { Icons } from "./Icons";
import { CATEGORY_META } from "../constants";
import { useAuth } from "../contexts/AuthContext";

export function ProductDetailModal({ product, onClose, onAdd, inCart }) {
  const { user } = useAuth();
  if (!product) return null;
  const meta = CATEGORY_META[product.category] || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose}>{Icons.close}</button>
        
        <div className="qv-img-side">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="product-img-placeholder" style={{ fontSize: "2rem" }}>
              {meta.abbr || "IMG"}
            </div>
          )}
        </div>

        <div className="qv-info-side">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <div className="product-cat">{meta.label || product.category}</div>
            {product.brand && (
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--brand-primary)", letterSpacing: 0.5 }}>
                {product.brand}
              </div>
            )}
          </div>
          <h2 className="section-title" style={{ fontSize: "2rem", marginBottom: 8 }}>{product.name}</h2>
          <div className="product-price" style={{ fontSize: "1.5rem" }}>₹{product.price}</div>
          
          {/* Stock info */}
          {(() => {
            const isOOS = product.stock === 0;
            const isLow = product.stock > 0 && product.stock < 10;
            const color = isOOS ? "#dc2626" : isLow ? "#d97706" : "#16a34a";
            const label = isOOS ? "Out of Stock" : isLow ? `Only ${product.stock} units left` : `${product.stock} units in stock`;
            return (
              <div className="stock-badge" style={{ color, borderColor: color + "33", background: color + "12", fontSize: "0.8rem", padding: "5px 12px" }}>
                <span className="stock-dot" style={{ background: color }} />
                {label}
              </div>
            );
          })()}

          <p className="section-sub" style={{ margin: "1rem 0" }}>
            {product.description || "High-quality essential product curated by ShopG for your daily needs."}
          </p>

          {user?.role !== "admin" && (
            <button
              className={`add-btn-pill ${inCart ? "in-cart" : ""} ${product.stock === 0 ? "oos-btn" : ""}`}
              style={{ width: "100%", marginTop: "auto", padding: "14px 20px" }}
              onClick={() => !inCart && product.stock > 0 && onAdd(product)}
              disabled={inCart || product.stock === 0}
            >
              {product.stock === 0 ? "Out of Stock" : inCart ? "Already in Cart ✓" : `Add to cart • ₹${product.price}`}
            </button>
          )}
          
          <div style={{ display: "flex", gap: "12px", marginTop: "1rem" }}>
            <div className="hero-badge" style={{ margin: 0 }}>✦ Free Delivery</div>
            <div className="hero-badge" style={{ margin: 0 }}>✓ Quality Assured</div>
          </div>
        </div>
      </div>
    </div>
  );
}
