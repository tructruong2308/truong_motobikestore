// src/components/ui/Badge.jsx
export default function Badge({ color = "default", children, style, className = "" }) {
  const palette = {
    default: { bg: "rgba(255,255,255,.08)", fg: "#c9d4ff" },
    success: { bg: "rgba(24,178,107,.18)", fg: "#6fe0b1" },
    warning: { bg: "rgba(255,176,32,.18)", fg: "#ffd585" }, // alias 'warning'
    warn:    { bg: "rgba(255,176,32,.18)", fg: "#ffd585" }, // alias cũ
    danger:  { bg: "rgba(251,90,90,.18)",  fg: "#ff9b9b"  },
    info:    { bg: "rgba(91,140,255,.18)", fg: "#9fbbff"  },
    primary: { bg: "rgba(59,130,246,.18)", fg: "#a5c4ff"  },
    purple:  { bg: "rgba(168,85,247,.18)", fg: "#e3b7ff"  },
    success2:{ bg: "rgba(34,197,94,.18)",  fg: "#b2f5bf"  },
  };

  const cfg = palette[color] || palette.default;

  return (
    <span
      className={`u-badge ${className}`}
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 12,
        lineHeight: 1,
        background: cfg.bg,
        color: cfg.fg,
        border: "1px solid rgba(255,255,255,.12)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
