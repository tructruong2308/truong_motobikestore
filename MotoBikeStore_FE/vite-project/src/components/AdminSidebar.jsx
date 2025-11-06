// src/components/AdminSidebar.jsx
import { NavLink } from "react-router-dom";
import { FiHome, FiBox, FiTag, FiShoppingCart, FiUsers, FiMail } from "react-icons/fi"; // 👈 thêm FiMail
import { LuTicketPercent } from "react-icons/lu"; // voucher %

const styles = `
.admin-sidebar{ height:100%; padding:16px; background:#0b0f1a; color:var(--text) }
.admin-sidebar .title{ font-size:16px; font-weight:800; margin-bottom:14px; letter-spacing:.6px; color:#93c5fd; text-transform:uppercase }
.admin-sidebar nav{ display:flex; flex-direction:column; gap:6px }
.admin-sidebar a{
  display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; text-decoration:none;
  color:#cbd5e1; border:1px solid transparent;
}
.admin-sidebar a:hover{ background:rgba(148,163,184,.08); border-color:var(--line) }
.admin-sidebar a.active{
  color:#93c5fd; background:rgba(59,130,246,.12); border-color:rgba(59,130,246,.25);
}
`;

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#93c5fd" : "#cbd5e1",
  background: isActive ? "rgba(59,130,246,.12)" : "transparent",
  border: `1px solid ${isActive ? "rgba(59,130,246,.25)" : "transparent"}`,
});

export default function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <style>{styles}</style>
      <div className="title">Admin</div>
      <nav>
        <NavLink to="/admin" end style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiHome /> Dashboard
        </NavLink>
        <NavLink to="/admin/products" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiBox /> Sản Phẩm
        </NavLink>
        <NavLink to="/admin/categories" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiTag /> Danh Mục
        </NavLink>
        <NavLink to="/admin/orders" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiShoppingCart /> Đơn Hàng
        </NavLink>
        <NavLink to="/admin/users" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiUsers /> Tài Khoản
        </NavLink>
        <NavLink to="/admin/coupons" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <LuTicketPercent /> Mã Giảm Giá
        </NavLink>
        <NavLink to="/admin/contacts" style={linkStyle} className={({isActive})=>isActive?"active":""}>
          <FiMail /> Liên Hệ
        </NavLink>
      </nav>
    </div>
  );
}
