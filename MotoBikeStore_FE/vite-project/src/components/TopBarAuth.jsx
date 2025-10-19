import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/** TopBarAuth (dùng cho site khách) — hỗ trợ light/dark qua prop `dark` */
export default function TopBarAuth({ logoSrc, cartCount=0, fixed=true, routes, dark=false }){
  const navigate = useNavigate();
  const [user,setUser]=useState(null);

  useEffect(()=>{
    const read=()=>{ try{setUser(JSON.parse(localStorage.getItem("customer_user")||"null"));}catch{setUser(null)} };
    read();
    const onStorage=e=>{ if(["customer_user","customer_token"].includes(e.key)) read(); };
    window.addEventListener("storage",onStorage);
    return ()=>window.removeEventListener("storage",onStorage);
  },[]);

  const wrapStyle = dark
    ? { position:fixed?"sticky":"static", top:0, zIndex:40, backdropFilter:"blur(8px)", borderBottom:"1px solid rgba(255,255,255,.06)", background:"rgba(12,18,38,.7)" }
    : { position:fixed?"sticky":"static", top:0, zIndex:40, background:"rgba(255,255,255,.8)", backdropFilter:"blur(6px)", borderBottom:"1px solid rgba(15,23,42,.06)", boxShadow:"0 4px 12px rgba(0,0,0,.04)" };

  const textColor = dark ? "#e5e7eb" : "#0f172a";

  return (
    <div style={wrapStyle}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",maxWidth:1200,margin:"0 auto", color:textColor}}>
        <Link to={routes.home}><img src={logoSrc} alt="logo" style={{height:36}}/></Link>
        <div style={{flex:1}}/>
        <Link to={routes.cart} className="u-btn outline" style={{position:"relative", color:textColor}}>
          Giỏ hàng
          {cartCount>0 && <span className="u-badge" style={{position:"absolute",top:-8,right:-10}}>{cartCount}</span>}
        </Link>

        {!user ? (
          <>
            <Link to={routes.login} className="u-btn" style={{color:textColor}}>Đăng nhập</Link>
            <Link to={routes.register} className="u-btn outline" style={{color:textColor}}>Đăng ký</Link>
          </>
        ) : (
          <div className="u-card u-border" style={{
            padding:6,borderRadius:999,display:"flex",alignItems:"center",gap:8,
            background: dark ? "rgba(2,6,23,.55)" : "#fff",
            border: dark ? "1px solid rgba(148,163,184,.25)" : "1px solid rgba(15,23,42,.08)",
            color: textColor
          }}>
            <div className="u-chip" style={{fontWeight:700}}>{user.name||"User"}</div>
            <button className="u-btn ghost" onClick={()=>{
              localStorage.removeItem("customer_token");
              localStorage.removeItem("customer_user");
              navigate("/login");
            }}>Đăng xuất</button>
          </div>
        )}
      </div>
    </div>
  );
}
