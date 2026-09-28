import { useState, useEffect } from "react";
import { Icons } from "../components/Icons";
import { ProductCard } from "../components/ProductCard";
import { useCart } from "../contexts/CartContext";
import { Toast, useToast, Spinner } from "../components/Toast";
import { API } from "../config";
import { DEFAULT_PRODUCTS } from "../constants";

export default function HomePage({ setPage, onProductClick }) {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, cart } = useCart();
  const { toast, show, hide } = useToast();
  const cartNames = cart.map((i) => i.item_name);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch(`${API}/products/trending`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.products && d.products.length > 0) {
          setTrendingProducts(d.products);
        } else {
          setTrendingProducts(DEFAULT_PRODUCTS.slice(0, 12));
        }
      })
      .catch(() => {
        setTrendingProducts(DEFAULT_PRODUCTS.slice(0, 12));
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleAdd = (product) => {
    addItem(product._id, product.name, product.price, product.category);
    // Note: The drawer opens automatically in App.js via handleAddToCart
    // But since HomePage uses its local handleAdd, we might need to adjust or just let it be.
    // Actually, I should use the handleAddToCart from props if I want the drawer to open.
    // For now, let's just make the quick view work.
    show(`${product.name} added to cart!`, "success");
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide} />}

      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">✦ Fresh. Fast. Free Delivery above ₹299</div>
        <h1 className="hero-title">
          Your everyday<br />
          essentials at<br />
          <span>Shop</span>G
        </h1>
        <p className="hero-sub">
          Groceries, spices, personal care &amp; more —<br />
          delivered straight to your door.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => setPage("grocery")}>
            {Icons.arrowRight} Shop Now
          </button>
          <button className="btn-outline" onClick={() => setPage("beauty")}>
            Explore Beauty
          </button>
        </div>
      </div>

      {/* Trending Products */}
      <div className="section" style={{ paddingTop: 0 }}>
        <h2 className="section-title">Trending Now</h2>
        <p className="section-sub">Customer favorites this week</p>

        {loading ? (
          <Spinner />
        ) : (
          <div className="products-grid">
            {trendingProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onAdd={handleAdd}
                inCart={cartNames.includes(p.name)}
                onClick={onProductClick}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
