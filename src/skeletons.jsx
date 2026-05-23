function SkelLine({ w = '100%', h = 12 }) {
  return <span className="ep-skel" style={{ width: w, height: h, display: 'inline-block' }} aria-hidden="true"/>;
}

function KpiSkeleton({ count = 4 }) {
  return (
    <div className="ep-kpis" aria-busy="true" aria-label="טוען מדדים">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ep-kpi ep-skel-card">
          <SkelLine w="40%" h={10}/>
          <SkelLine w="60%" h={28}/>
          <SkelLine w="80%" h={28}/>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ lines = 5, h = 14 }) {
  return (
    <section className="ep-card ep-skel-card" aria-busy="true" aria-label="טוען...">
      <SkelLine w="35%" h={16}/>
      {Array.from({ length: lines }).map((_, i) => (
        <SkelLine key={i} w={`${80 - i * 7}%`} h={h}/>
      ))}
    </section>
  );
}

function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <section className="ep-card ep-skel-card" aria-busy="true" aria-label="טוען טבלה">
      <div className="ep-skel-row" aria-hidden="true">
        {Array.from({ length: cols }).map((_, c) => <SkelLine key={c} w={`${100/cols - 2}%`} h={10}/>)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="ep-skel-row" aria-hidden="true">
          {Array.from({ length: cols }).map((_, c) => (
            <SkelLine key={c} w={`${100/cols - 2}%`} h={14}/>
          ))}
        </div>
      ))}
    </section>
  );
}

function PageSkeleton() {
  return (
    <div className="ep-page-skel" aria-busy="true" aria-label="טוען עמוד">
      <div className="ep-ph">
        <div>
          <SkelLine w={220} h={28}/>
          <div style={{ marginTop: 8 }}><SkelLine w={320} h={12}/></div>
        </div>
      </div>
      <KpiSkeleton/>
      <CardSkeleton/>
    </div>
  );
}

function EmptyState({ icon, title, hint, action }) {
  const I = window.EprIcon || {};
  const Ic = icon && I[icon] ? I[icon] : (I.search || (() => null));
  return (
    <div className="ep-empty-state" role="status">
      <div className="ep-empty-icon"><Ic width={28} height={28}/></div>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  );
}

Object.assign(window, { SkelLine, KpiSkeleton, CardSkeleton, TableSkeleton, PageSkeleton, EmptyState });
