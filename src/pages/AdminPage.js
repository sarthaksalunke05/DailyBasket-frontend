import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Toast, useToast, Spinner } from "../components/Toast";
import { Icons } from "../components/Icons";
import { CATEGORY_META } from "../constants";
import { API } from "../config";
import Papa from "papaparse";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

function ProductModal({ product, onClose, onSave, show }) {
  const [form, setForm] = useState(
    product || { name: "", price: "", category: "grocery", brand: "", image: "", description: "", stock: 0 }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("shopg_token")}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        set("image", data.url);
        show("Image uploaded successfully!", "success");
      } else {
        show(data.message || "Upload failed", "error");
      }
    } catch (err) {
      console.error("Upload failed", err);
      show("Network error during upload", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) return;
    setSaving(true);
    await onSave({ ...form, price: Number(form.price) });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{product ? "Edit Product" : "Add Product"}</div>

        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Parle-G" />
        </div>
        <div className="form-group">
          <label className="form-label">Price (₹)</label>
          <input className="form-input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Stock Quantity</label>
          <input className="form-input" type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Brand</label>
          <input className="form-input" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Nestlé" />
        </div>
        <div className="form-group">
          <label className="form-label">Product Image</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input className="form-input" value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="URL or upload..." style={{ flex: 1 }} />
            <button className="btn-outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "..." : Icons.plus}
            </button>
            <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description" />
        </div>

        {form.image && (
          <img src={form.image} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 16 }} onError={(e) => e.target.style.display = "none"} />
        )}

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderStatusModal({ order, onClose, onSave, token }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(order._id, status);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Update Order Status</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Order #{order._id.slice(-8).toUpperCase()}
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ setPage }) {
  const { user, token } = useAuth();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productModal, setProductModal] = useState(null); // null | "new" | product obj
  const [orderModal, setOrderModal] = useState(null);
  const [stockEditing, setStockEditing] = useState({}); // { [productId]: tempValue }
  const [stockSaving, setStockSaving] = useState({}); // { [productId]: true }
  const { toast, show, hide } = useToast();

  const authH = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    fetch(`${API}/products?limit=100`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.products); })
      .finally(() => setLoading(false));
  }, []);

  const fetchOrders = useCallback(() => {
    fetch(`${API}/orders`, { headers: authH })
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders(d.orders); });
  }, [authH]);

  useEffect(() => { fetchProducts(); fetchOrders(); }, [fetchProducts, fetchOrders]);

  const saveProduct = async (form) => {
    const isEdit = productModal && productModal._id;
    const url = isEdit ? `${API}/products/${productModal._id}` : `${API}/products`;
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authH, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) {
      show(isEdit ? "Product updated!" : "Product created!", "success");
      setProductModal(null);
      fetchProducts();
    } else {
      show(data.message || "Error saving product", "error");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const res = await fetch(`${API}/products/${id}`, { method: "DELETE", headers: authH });
    const data = await res.json();
    if (data.success) { show("Product deleted", "success"); fetchProducts(); }
    else show(data.message || "Error", "error");
  };

  // ── Inline stock update ──────────────────────────────────────────────────
  const startStockEdit = (product) => {
    setStockEditing(prev => ({ ...prev, [product._id]: product.stock }));
  };

  const cancelStockEdit = (id) => {
    setStockEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveStock = async (product) => {
    const newStock = Number(stockEditing[product._id]);
    if (isNaN(newStock) || newStock < 0) { show("Invalid stock value", "error"); return; }
    setStockSaving(prev => ({ ...prev, [product._id]: true }));
    try {
      const res = await fetch(`${API}/products/${product._id}`, {
        method: "PUT",
        headers: authH,
        body: JSON.stringify({ ...product, stock: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        show(`Stock updated to ${newStock}`, "success");
        cancelStockEdit(product._id);
        fetchProducts();
      } else show(data.message || "Error", "error");
    } catch { show("Network error", "error"); }
    finally { setStockSaving(prev => { const n = { ...prev }; delete n[product._id]; return n; }); }
  };

  const updateOrderStatus = async (orderId, status) => {
    const res = await fetch(`${API}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: authH,
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) { show("Status updated!", "success"); setOrderModal(null); fetchOrders(); }
    else show(data.message || "Error", "error");
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const products = results.data.map(p => ({
          ...p,
          price: Number(p.price),
          stock: Number(p.stock || 0),
          image: p.image || p.image_url || ""
        }));

        try {
          const res = await fetch(`${API}/products/bulk`, {
            method: "POST",
            headers: authH,
            body: JSON.stringify(products)
          });
          const data = await res.json();
          if (data.success) {
            show(`Imported ${data.products.length} products!`, "success");
            fetchProducts();
          } else {
            show(data.message, "error");
          }
        } catch (err) {
          show("Bulk upload failed", "error");
        }
      }
    });
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse([{
      name: "Product Name",
      price: 100,
      category: "grocery",
      brand: "Brand Name",
      description: "Description here",
      stock: 50,
      image: "https://example.com/img.jpg"
    }]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "shopg_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-wrap">
        <div className="state-center">
          <div className="state-icon">{Icons.admin}</div>
          <div className="state-title">Admin Access Only</div>
          <p className="state-sub">You don't have permission to view this page</p>
          <button className="btn-primary" onClick={() => setPage("home")}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hide} />}
      {productModal !== null && (
        <ProductModal
          product={productModal === "new" ? null : productModal}
          onClose={() => setProductModal(null)}
          onSave={saveProduct}
          show={show}
        />
      )}
      {orderModal && (
        <OrderStatusModal
          order={orderModal}
          onClose={() => setOrderModal(null)}
          onSave={updateOrderStatus}
          token={token}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Admin Panel</h1>
        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          Logged in as <strong>{user.username}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>
          Products ({products.length})
        </button>
        <button className={`admin-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
          Orders ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <>
          <div className="admin-actions-row">
            <div className="admin-actions-group">
              <button className="btn-outline" onClick={downloadTemplate}>
                {Icons.download} <span className="btn-label-desktop">Template</span>
              </button>
              <label className="btn-outline" style={{ cursor: "pointer" }}>
                {Icons.plus} <span className="btn-label-desktop">Bulk</span> Upload
                <input type="file" hidden accept=".csv" onChange={handleBulkUpload} />
              </label>
            </div>

            <button className="btn-primary" onClick={() => setProductModal("new")}>
              {Icons.plus} Add Product
            </button>
          </div>

          {loading ? <Spinner /> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td data-label="Image">
                        <div className="admin-img-thumb">
                          {p.image ? (
                            <img src={p.image} alt={p.name} onError={(e) => e.target.style.display = "none"} />
                          ) : (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-light)" }}>
                              {CATEGORY_META[p.category]?.abbr || "IMG"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Name" style={{ fontWeight: 500 }}>{p.name}</td>
                      <td data-label="Brand" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{p.brand || "-"}</td>
                      <td data-label="Category" style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        {CATEGORY_META[p.category]?.label || p.category}
                      </td>
                      <td data-label="Price" style={{ fontWeight: 600 }}>₹{p.price}</td>
                      <td data-label="Stock">
                        {stockEditing[p._id] !== undefined ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              className="qty-btn"
                              style={{ width: 26, height: 26, fontSize: "1rem" }}
                              onClick={() => setStockEditing(prev => ({ ...prev, [p._id]: Math.max(0, Number(prev[p._id]) - 1) }))}
                              disabled={stockSaving[p._id]}
                            >−</button>
                            <input
                              type="number"
                              value={stockEditing[p._id]}
                              min={0}
                              onChange={e => setStockEditing(prev => ({ ...prev, [p._id]: e.target.value }))}
                              style={{ width: 52, textAlign: "center", padding: "3px 6px", fontSize: "0.82rem", border: "1.5px solid var(--black)", borderRadius: 6, fontFamily: "Inter, sans-serif" }}
                              disabled={stockSaving[p._id]}
                            />
                            <button
                              className="qty-btn"
                              style={{ width: 26, height: 26, fontSize: "1rem" }}
                              onClick={() => setStockEditing(prev => ({ ...prev, [p._id]: Number(prev[p._id]) + 1 }))}
                              disabled={stockSaving[p._id]}
                            >+</button>
                            <button
                              className="icon-btn"
                              style={{ background: "var(--black)", color: "white", border: "none", width: 28, height: 28, fontSize: "0.7rem", fontWeight: 700 }}
                              onClick={() => saveStock(p)}
                              disabled={stockSaving[p._id]}
                              title="Save"
                            >{stockSaving[p._id] ? "…" : "✓"}</button>
                            <button
                              className="icon-btn"
                              style={{ fontSize: "0.7rem", color: "var(--text-muted)", width: 28, height: 28 }}
                              onClick={() => cancelStockEdit(p._id)}
                              title="Cancel"
                            >✕</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 40, fontSize: "0.72rem", fontWeight: 600,
                              background: p.stock > 0 ? (p.stock < 10 ? "#fef3c7" : "#dcfce7") : "#fee2e2",
                              color: p.stock > 0 ? (p.stock < 10 ? "#d97706" : "#16a34a") : "#dc2626",
                            }}>
                              {p.stock > 0 ? `${p.stock} Units` : "Out of Stock"}
                            </span>
                            <button
                              className="icon-btn"
                              style={{ width: 24, height: 24, fontSize: "0.65rem", flexShrink: 0 }}
                              onClick={() => startStockEdit(p)}
                              title="Edit stock"
                            >✎</button>
                          </div>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div className="icon-btn-row">
                          <button className="icon-btn" onClick={() => setProductModal(p)} title="Edit">
                            {Icons.edit}
                          </button>
                          <button className="icon-btn danger" onClick={() => deleteProduct(p._id)} title="Delete">
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td data-label="Order ID" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    #{o._id.slice(-8).toUpperCase()}
                  </td>
                  <td data-label="Customer">
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{o.customerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{o.contact}</div>
                  </td>
                  <td data-label="Items" style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 180 }}>
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td data-label="Total" style={{ fontWeight: 700 }}>₹{o.totalAmount}</td>
                  <td data-label="Status"><span className={`order-status status-${o.status}`}>{o.status}</span></td>
                  <td data-label="Date" style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td data-label="Actions">
                    <button className="icon-btn" onClick={() => setOrderModal(o)} title="Update Status">
                      {Icons.edit}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
