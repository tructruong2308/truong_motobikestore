// src/main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./index.css";
import "./styles/theme.css";

/* ==== Notifications (GLOBAL) ==== */
import { NotificationProvider } from "./notifications/NotificationProvider.jsx";
import RealtimeListener from "./realtime/RealtimeListener.jsx";
import Bell from "./notifications/Bell.jsx";

/* Customer pages */
import Home from "./pages/Customers/Home";
import Products from "./pages/Customers/Products";
import Cart from "./pages/Customers/Cart";
import ProductDetail from "./pages/Customers/ProductDetail";
import CategoryProducts from "./pages/Customers/CategoryProducts";
import Register from "./pages/Customers/Register";
import Login from "./pages/Customers/Login";
import Checkout from "./pages/Customers/Checkout";
import Profile from "./pages/Customers/Profile";
import Orders from "./pages/Customers/Orders";

/* Admin pages */
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import AdminProducts from "./pages/Admin/Product/Products";
import AdminCategories from "./pages/Admin/Category/Categories";
import AdminOrders from "./pages/Admin/Order/Orders";
import AdminUsers from "./pages/Admin/User/Users";
import ProductAdd from "./pages/Admin/Product/ProductAdd";
import ProductEdit from "./pages/Admin/Product/ProductEdit";
import AdminCoupons from "./pages/Admin/Coupon/Coupons";

/* NEW: header search with suggestions */
import HeaderSearch from "./components/HeaderSearch";

/* Helpers */
const getCustomer = () => {
  try { return JSON.parse(localStorage.getItem("customer_user") || "null"); }
  catch { return null; }
};
const getUserCartKey = (u) => (u?.id ? `cart_u_${u.id}` : "cart_guest");

/* Helpers: logout khách */
const customerLogout = async () => {
  const token = localStorage.getItem("customer_token");
  try {
    if (token) {
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    const u = getCustomer();
    const key = getUserCartKey(u);
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
    localStorage.setItem(key, JSON.stringify(currentCart || []));
  } finally {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    localStorage.removeItem("token"); // legacy
    localStorage.removeItem("user");  // legacy
    localStorage.setItem("cart", JSON.stringify([]));
    window.dispatchEvent(new Event("cart:refresh"));
    window.location.href = "/login";
  }
};

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("customer_user") || "null")
  );
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Sync user (login / update avatar / logout)
  useEffect(() => {
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("customer_user") || "null"));
      } catch {}
    };
    window.addEventListener("storage", syncUser);
    window.addEventListener("user:refresh", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("user:refresh", syncUser);
    };
  }, []);

  // Online/offline
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Badge giỏ hàng
  useEffect(() => {
    const updateBadge = () => {
      try {
        const list = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = list.reduce((s, i) => s + (Number(i.qty) || 1), 0);
        const el = document.getElementById("cart-badge");
        if (!el) return;
        el.textContent = count > 0 ? String(count) : "";
        el.style.display = count > 0 ? "inline-block" : "none";
      } catch {}
    };
    updateBadge();
    window.addEventListener("storage", updateBadge);
    window.addEventListener("cart:refresh", updateBadge);
    return () => {
      window.removeEventListener("storage", updateBadge);
      window.removeEventListener("cart:refresh", updateBadge);
    };
  }, []);

  const doLogout = async () => {
    await customerLogout();
    setUser(null);
  };

  // ==== Styles (giữ nguyên) ====
  const shell = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0b1320",
    color: "#cbd5e1",
  };
  const container = { width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 16px" };
  const header = {
    position: "sticky",
    top: 0,
    zIndex: 40,
    borderBottom: "1px solid #0f172a",
    background: "rgba(11,19,32,.95)",
    backdropFilter: "blur(6px)",
  };
  const headerRow = {
    ...container,
    height: 78,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };
  const brand = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#34d399",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 21,
  };
  const nav = { display: "flex", gap: 8, alignItems: "center" };
  const navLink = (active) => ({
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    color: active ? "#34d399" : "#e2e8f0",
    fontWeight: active ? 700 : 500,
    background: active ? "rgba(16,185,129,.15)" : "transparent",
    transition: "0.25s",
  });

  // Dropdown style
  const dropdown = {
    position: "absolute",
    right: 0,
    marginTop: 10,
    width: 220,
    background: "#0f172a",
    border: "1px solid #0b1220",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    padding: "6px 0",
    zIndex: 1000,
  };

  // Keyframes cho vòng gradient xoay
  const ringKeyframes = `
@keyframes igRingSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
  if (!document.getElementById("ig-ring-style")) {
    const style = document.createElement("style");
    style.id = "ig-ring-style";
    style.innerHTML = ringKeyframes;
    document.head.appendChild(style);
  }

  // Avatar URL
  const getAvatarSrc = (u) => {
    if (!u) return null;
    if (u.avatar_url) return u.avatar_url;
    if (typeof u.avatar === "string" && u.avatar.length) {
      if (u.avatar.startsWith("http")) return u.avatar;
      return `http://127.0.0.1:8000/storage/${u.avatar}`;
    }
    return null;
  };
  const avatarSrc = getAvatarSrc(user);

  const statusDot = {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: isOnline ? "#22c55e" : "#64748b",
    border: "2px solid #0b1320",
    boxShadow: isOnline ? "0 0 10px rgba(34,197,94,.85)" : "none",
  };

  const LinkItem = ({ to, label, exact }) => (
    <NavLink to={to} end={!!exact} style={({ isActive }) => navLink(isActive)}>
      {label}
      {to === "/cart" && (
        <span
          id="cart-badge"
          style={{
            display: "none",
            position: "relative",
            top: -10,
            left: 8,
            background: "#059669",
            color: "#fff",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 6px",
          }}
        />
      )}
    </NavLink>
  );

  return (
    <div style={shell}>
      <header style={header}>
        <div style={headerRow}>
          <a href="/" style={brand}>
            🏍️ <span>MotoBikeStore</span>
          </a>

          <nav style={nav}>
            <LinkItem to="/" label="Trang chủ" exact />
            <LinkItem to="/products" label="Sản phẩm" />
            <LinkItem to="/cart" label="Giỏ hàng" />
          </nav>

          {/* Ô tìm kiếm có gợi ý */}
          <HeaderSearch />

          {/* 🔔 Chuông thông báo toàn site (unread badge) */}
          <div style={{ marginLeft: 8 }}>
            <Bell />
          </div>

          {/* AVATAR + RING + DROPDOWN */}
          <div style={{ position: "relative" }}>
            {/* Vòng gradient xoay */}
            <div
              style={{
                position: "absolute",
                inset: -7,
                borderRadius: "50%",
                padding: 4,
                background: isOnline
                  ? "conic-gradient(from 0deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #10b981, #f59e0b)"
                  : "conic-gradient(from 0deg, #94a3b8, #64748b, #475569, #334155, #475569, #94a3b8)",
                animation: isOnline ? "igRingSpin 6s linear infinite" : "none",
                WebkitMask:
                  "radial-gradient(circle 48px at center, transparent 86%, black 87%)",
                mask: "radial-gradient(circle 48px at center, transparent 86%, black 87%)",
                filter: isOnline ? "drop-shadow(0 0 8px rgba(99,102,241,.35))" : "none",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Nút avatar */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Tài khoản"
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                background: "rgba(15,23,42,.35)",
                position: "relative",
                zIndex: 1,
                boxShadow: isOnline
                  ? "0 0 20px rgba(52,211,153,.28)"
                  : "0 0 10px rgba(100,116,139,.16)",
                transition: "transform .25s ease, box-shadow .25s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = isOnline
                  ? "0 0 26px rgba(52,211,153,.45)"
                  : "0 0 14px rgba(100,116,139,.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = isOnline
                  ? "0 0 20px rgba(52,211,153,.28)"
                  : "0 0 10px rgba(100,116,139,.16)";
              }}
            >
              {avatarSrc ? (
                <img
                  key={avatarSrc}
                  src={avatarSrc}
                  alt="avatar"
                  onError={(ev) => {
                    ev.currentTarget.onerror = null;
                    ev.currentTarget.src = "https://i.pravatar.cc/120?u=fallback";
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                    display: "block",
                    clipPath: "circle(50%)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,.6), rgba(2,6,23,.6))",
                    color: "#34d399",
                    fontWeight: 900,
                    fontSize: 28,
                  }}
                >
                  {(user?.name || "?").trim().charAt(0).toUpperCase()}
                </div>
              )}
              <span style={statusDot} />
            </button>

            {/* Dropdown */}
            {open && (
              <div style={dropdown}>
                {user ? (
                  <>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderBottom: "1px solid #0b1220",
                        fontSize: 13,
                      }}
                    >
                      👋 Xin chào, <b style={{ color: "#34d399" }}>{user.name}</b>
                    </div>
                    <a
                      href="/profile"
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "#cbd5e1",
                        textDecoration: "none",
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Hồ sơ của tôi
                    </a>
                    <a
                      href="/orders"
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "#cbd5e1",
                        textDecoration: "none",
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Đơn hàng của tôi
                    </a>
                    <button
                      onClick={doLogout}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        color: "#f87171",
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                      }}
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to="/register"
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "#cbd5e1",
                        textDecoration: "none",
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Đăng ký
                    </NavLink>
                    <NavLink
                      to="/login"
                      style={{
                        display: "block",
                        padding: "8px 12px",
                        color: "#cbd5e1",
                        textDecoration: "none",
                      }}
                      onClick={() => setOpen(false)}
                    >
                      Đăng nhập
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <div style={{ ...container, padding: "24px 16px" }}>{children}</div>
      </main>

      <footer style={{ borderTop: "1px solid #0f172a", padding: "12px 0", textAlign: "center" }}>
        <div style={container}>© {new Date().getFullYear()} MotoBikeStore</div>
      </footer>
    </div>
  );
}

/* Guards */
function CustomerProtected({ children }) {
  const has = !!localStorage.getItem("customer_token") || !!localStorage.getItem("customer_user");
  return has ? children : <Navigate to="/login" replace />;
}
function AdminProtected({ children }) {
  return localStorage.getItem("admin_token") ? (
    children
  ) : (
    <Navigate to="/admin/login" replace />
  );
}

/* App */
function App() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("cart") || "[]"));

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:refresh"));
    try {
      const u = getCustomer();
      if (u?.id) {
        localStorage.setItem(getUserCartKey(u), JSON.stringify(cart || []));
      }
    } catch {}
  }, [cart]);

  const addToCart = (product) => {
    const token = localStorage.getItem("customer_token");
    const user = localStorage.getItem("customer_user");
    const isLoggedIn = !!token || !!user;

    if (!isLoggedIn) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      localStorage.setItem(
        "post_login_redirect",
        window.location.pathname + window.location.search
      );
      window.location.href = "/login";
      return;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: product.price || product.unit_price || 0,
      thumbnail_url: product.thumbnail_url || product.image || "",
    };
    setCart((prev) => {
      const i = prev.findIndex((x) => String(x.id) === String(item.id));
      if (i >= 0) {
        const c = [...prev];
        c[i].qty = (c[i].qty || 1) + 1;
        return c;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    alert("🎉 Sản phẩm đã được thêm vào giỏ hàng!");
  };

  return (
    <NotificationProvider>
      {/* Kết nối Reverb & nghe sự kiện toàn site */}
      <RealtimeListener />

      <BrowserRouter>
        <Routes>
          {/* Khách */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/products" element={<Layout><Products addToCart={addToCart} /></Layout>} />
          <Route path="/category/:id" element={<Layout><CategoryProducts addToCart={addToCart} /></Layout>} />
          <Route path="/products/:id" element={<Layout><ProductDetail addToCart={addToCart} /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout cart={cart} setCart={setCart} /></Layout>} />
          <Route path="/cart" element={<Layout><Cart cart={cart} setCart={setCart} /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/profile" element={<Layout><CustomerProtected><Profile /></CustomerProtected></Layout>} />
          <Route path="/orders" element={<Layout><CustomerProtected><Orders /></CustomerProtected></Layout>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtected><AdminLayout /></AdminProtected>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductAdd />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Layout><div>Không tìm thấy trang</div></Layout>} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
