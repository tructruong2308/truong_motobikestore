// src/main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "./styles/theme.css";

/* ==== Notifications (GLOBAL) ==== */
import { NotificationProvider } from "./notifications/NotificationProvider.jsx";
import RealtimeListener from "./realtime/RealtimeListener.jsx";
import Bell from "./notifications/Bell.jsx";
import FloatingChat from "@/components/FloatingChat";

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
import About from "./pages/Customers/About";
import Contact from "./pages/Customers/Contact";
import Blog from "./pages/Customers/Blog";
import BlogDetail from "./pages/Customers/BlogDetail";

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
import AdminContacts from "./pages/Admin/Contact/Contacts";
import AdminPosts from "./pages/Admin/Posts/Posts";

/* NEW: header search with suggestions */
import HeaderSearch from "./components/HeaderSearch";

/* Helpers */
const getCustomer = () => {
  try {
    return JSON.parse(localStorage.getItem("customer_user") || "null");
  } catch {
    return null;
  }
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
    localStorage.removeItem("user"); // legacy
    localStorage.setItem("cart", JSON.stringify([]));
    window.dispatchEvent(new Event("cart:refresh"));
    window.location.href = "/login";
  }
};

function Layout({ children }) {
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

  // ==== Light theme styles (giữ nguyên cấu trúc JSX) ====
  const shell = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#ffffff",
    color: "#0f172a",
  };
  const container = {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 16px",
  };
  const header = {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "rgba(255,255,255,.92)",
    backdropFilter: "blur(6px)",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(15,23,42,.06)",
  };
  const headerRow = {
    ...container,
    height: 66,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };
  const brand = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#059669",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 20,
  };
  const nav = { display: "flex", gap: 4, alignItems: "center" };
  const navLink = (active) => ({
    padding: "8px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: active ? "#047857" : "#334155",
    fontWeight: active ? 700 : 600,
    background: active ? "#eafff3" : "transparent",
    transition: "0.2s",
  });

  // Dropdown style
  const dropdown = {
    position: "absolute",
    right: 0,
    marginTop: 10,
    width: 220,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    boxShadow: "0 14px 30px rgba(15,23,42,.10)",
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
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: isOnline ? "#22c55e" : "#94a3b8",
    border: "2px solid #ffffff",
    boxShadow: isOnline ? "0 0 6px rgba(34,197,94,.65)" : "none",
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
            top: -8,
            left: 6,
            background: "#ef4444",
            color: "#fff",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            padding: "2px 6px",
            boxShadow: "0 2px 8px rgba(239,68,68,.25)",
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

          <nav style={nav} className="nav-primary">
            <LinkItem to="/" label="Trang chủ" exact />
            <LinkItem to="/products" label="Sản phẩm" />
            <LinkItem to="/cart" label="Giỏ hàng" />
            <LinkItem to="/gioi-thieu" label="Giới thiệu" />
            <LinkItem to="/lien-he" label="Liên hệ" />
            <LinkItem to="/blog" label="Tin tức" />
          </nav>

          {/* Ô tìm kiếm có gợi ý */}
          <HeaderSearch />

          {/* 🔔 Chuông thông báo toàn site (unread badge) */}
          <div style={{ marginLeft: 8 }}>
            <Bell />
          </div>

          {/* AVATAR + RING + DROPDOWN */}
          <div style={{ position: "relative" }}>
            {/* Vòng gradient xoay (nhỏ gọn) */}
            <div
              style={{
                position: "absolute",
                inset: -5,
                borderRadius: "50%",
                padding: 3,
                background: isOnline
                  ? "conic-gradient(from 0deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #10b981, #f59e0b)"
                  : "conic-gradient(from 0deg, #cbd5e1, #94a3b8, #64748b, #94a3b8, #cbd5e1)",
                animation: isOnline ? "igRingSpin 8s linear infinite" : "none",
                WebkitMask:
                  "radial-gradient(circle 34px at center, transparent 84%, black 85%)",
                mask:
                  "radial-gradient(circle 34px at center, transparent 84%, black 85%)",
                filter: isOnline ? "drop-shadow(0 0 6px rgba(99,102,241,.25))" : "none",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Nút avatar (56px) */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Tài khoản"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(0,0,0,0.06)",
                cursor: "pointer",
                background: "#ffffff",
                position: "relative",
                zIndex: 1,
                boxShadow: "0 2px 10px rgba(2,6,23,.08)",
                transition: "transform .2s ease, box-shadow .2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(2,6,23,.12)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(2,6,23,.08)";
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
                    background: "#f8fafc",
                    color: "#059669",
                    fontWeight: 900,
                    fontSize: 22,
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
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: 13,
                        color: "#64748b",
                      }}
                    >
                      👋 Xin chào, <b style={{ color: "#059669" }}>{user.name}</b>
                    </div>
                    <a
                      href="/profile"
                      style={{
                        display: "block",
                        padding: "10px 14px",
                        color: "#0f172a",
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
                        padding: "10px 14px",
                        color: "#0f172a",
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
                        padding: "10px 14px",
                        color: "#ef4444",
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
                        padding: "10px 14px",
                        color: "#0f172a",
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
                        padding: "10px 14px",
                        color: "#0f172a",
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

      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "12px 0",
          textAlign: "center",
          background: "#fff",
          color: "#475569",
        }}
      >
        <div style={container}>© {new Date().getFullYear()} MotoBikeStore</div>
      </footer>
      <FloatingChat />
    </div>
  );
}

/* Guards */
function CustomerProtected({ children }) {
  const has =
    !!localStorage.getItem("customer_token") ||
    !!localStorage.getItem("customer_user");
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
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("cart") || "[]")
  );

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
          <Route
            path="/products"
            element={<Layout><Products addToCart={addToCart} /></Layout>}
          />
          <Route
            path="/category/:id"
            element={<Layout><CategoryProducts addToCart={addToCart} /></Layout>}
          />
          <Route
            path="/products/:id"
            element={<Layout><ProductDetail addToCart={addToCart} /></Layout>}
          />
          <Route
            path="/checkout"
            element={<Layout><Checkout cart={cart} setCart={setCart} /></Layout>}
          />
          <Route
            path="/cart"
            element={<Layout><Cart cart={cart} setCart={setCart} /></Layout>}
          />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route
            path="/profile"
            element={
              <Layout>
                <CustomerProtected>
                  <Profile />
                </CustomerProtected>
              </Layout>
            }
          />
          <Route
            path="/orders"
            element={
              <Layout>
                <CustomerProtected>
                  <Orders />
                </CustomerProtected>
              </Layout>
            }
          />
          <Route path="/gioi-thieu" element={<Layout><About /></Layout>} />
          <Route path="/lien-he" element={<Layout><Contact /></Layout>} />
          <Route path="/blog" element={<Layout><Blog /></Layout>} />
          <Route path="/blog/:slug" element={<Layout><BlogDetail /></Layout>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtected>
                <AdminLayout />
              </AdminProtected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductAdd />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="posts" element={<AdminPosts />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={<Layout><div>Không tìm thấy trang</div></Layout>}
          />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
