export default function Stars({ value=0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:2, color:'#f8d26b' }}>
      {Array.from({length:full}).map((_,i)=><span key={'f'+i}>★</span>)}
      {half ? <span>☆</span> : null}
      {Array.from({length:empty}).map((_,i)=><span key={'e'+i} style={{opacity:.3}}>★</span>)}
      <span style={{ marginLeft:6, fontSize:12, opacity:.8 }}>{(+value || 0).toFixed(1)}</span>
    </div>
  );
}
