import { useState, useEffect, useCallback } from "react";
import { useCart } from "../contexts/CartContext";
import { Toast, useToast } from "../components/Toast";
import { Spinner } from "../components/Toast";
import { Icons } from "../components/Icons";
import { CATEGORY_META } from "../constants";
import { API } from "../config";
import { ProductCard } from "../components/ProductCard";

export default function ProductsPage({ category, searchQuery, setPage, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addItem, cart } = useCart();
  const { toast, show, hide } = useToast();
  const meta = CATEGORY_META[category] || {};
  const cartNames = cart.map((i) => i.item_name);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    let url = `${API}/products?page=${currentPage}&limit=12`;
    if (category) url += `&category=${category}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProducts(d.products);
          setTotalPages(d.pages || 1);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [category, currentPage, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [category, searchQuery]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = (product) => {
    addItem(product._id, product.name, product.price, product.category);
    show(`${product.name} added to cart!`, "success");
  };

  return (
    <div className="products-section">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide} />}

      <div className="products-header">
        <div>
          <h2 className="section-title">
            {searchQuery ? `Results for "${searchQuery}"` : (meta.label || "All Products")}
          </h2>
          {!loading && (
            <p className="section-sub" style={{ marginBottom: 0 }}>
              {products.length} product{products.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="state-center">
          <div className="state-icon">{Icons.search}</div>
          <div className="state-title">No products found</div>
          <p className="state-sub">Try a different category or search term</p>
          <button className="btn-primary" onClick={() => setPage("home")}>Back to Home</button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onAdd={handleAdd}
                inCart={cartNames.includes(p.name)}
                onClick={onProductClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {Icons.arrowLeft} Prev
              </button>
              <span className="page-info">Page {currentPage} of {totalPages}</span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next {Icons.arrowRight}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
