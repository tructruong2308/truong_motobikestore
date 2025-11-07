import { Link } from "react-router-dom";

const VND = new Intl.NumberFormat("vi-VN");
const PLACEHOLDER = "https://placehold.co/320x240?text=No+Image";

export default function ProductCard({ p, onAdd }) {
  const root = Number(p.price_root ?? p.price ?? p.unit_price ?? 0);
  const sale = Number(p.price_sale ?? 0);
  const price = sale > 0 && sale < root ? sale : root;
  const img =
    p.image || p.thumbnail_url || p.thumbnail || p.image_url || PLACEHOLDER;

  const add = () => {
    if (typeof onAdd === "function") return onAdd(p);
    window.dispatchEvent(new CustomEvent("add-to-cart", { detail: p }));
  };

  return (
    <div className="product-card">
      <Link to={`/products/${p.id}`} className="product-media" aria-label={p.name}>
        <img src={img} alt={p.name} onError={(e)=> (e.currentTarget.src = PLACEHOLDER)} />
      </Link>

      <div className="product-body">
        <Link to={`/products/${p.id}`} className="product-title">{p.name}</Link>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <div className="product-price">{VND.format(price)}₫</div>
          {sale > 0 && sale < root && (
            <div className="product-old">{VND.format(root)}₫</div>
          )}
        </div>
      </div>

      <div className="product-actions">
        <Link className="u-btn ghost" to={`/products/${p.id}`}>Xem</Link>
      </div>
    </div>
  );
}
