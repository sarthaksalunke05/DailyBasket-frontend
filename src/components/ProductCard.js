import { useState } from "react";
import { CATEGORY_META } from "../constants";
import { useAuth } from "../contexts/AuthContext";

export function ProductCard({ product, onAdd, inCart, onClick }) {
  const meta = CATEGORY_META[product.category] || {};
  const [imgErr, setImgErr] = useState(false);
  const { user } = useAuth();
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  const stockColor = isOutOfStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a";
  const stockLabel = isOutOfStock ? "Out of Stock" : isLowStock ? `Only ${product.stock} left` : `${product.stock} in stock`;

  return (
    <div
      className={`product-card${isOutOfStock ? " out-of-stock" : ""}`}
      onClick={() => !isOutOfStock && onClick && onClick(product)}
    >
      {/* Greyed overlay for OOS */}
      {isOutOfStock && <div className="oos-overlay" />}

      <div className="product-img-wrap">
        {product.image && !imgErr ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgErr(true)}
          />
        ) : (
          <span className="product-img-placeholder">{meta.abbr || "IMG"}</span>
        )}
      </div>

      <div className="product-info">
        <div className="product-cat">{meta.label || product.category}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-price">₹{product.price}</div>

        {/* Stock badge */}
        <div className="stock-badge" style={{ color: stockColor, borderColor: stockColor + "33", background: stockColor + "12" }}>
          <span className="stock-dot" style={{ background: stockColor }} />
          {stockLabel}
        </div>

        {user?.role !== "admin" && (
          <button
            className={`add-btn ${inCart ? "in-cart" : ""} ${isOutOfStock ? "oos-btn" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!inCart && !isOutOfStock) onAdd(product);
            }}
            disabled={inCart || isOutOfStock}
            title={isOutOfStock ? "This product is currently out of stock" : ""}
          >
            {isOutOfStock ? "Out of Stock" : inCart ? "In Cart ✓" : "Add to cart"}
          </button>
        )}
      </div>
    </div>
  );
}
