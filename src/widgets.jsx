// epr/widgets.jsx — 6 chart widgets with type-switcher (bars / donut / top 5)
const { useState: wS } = React;

// ── Chart primitives ──────────────────────────────────────────
function VBarChart({ data, max, format = v => v, minHeight = 4 }) {
  const m = max || Math.max(...data.map(d => d.v), 1);
  return (
    <div className="wg-bars">
      <div className="wg-bars-grid" aria-hidden="true"><span/><span/><span/><span/></div>
      <div className="wg-bars-row">
        {data.map((d, i) => {
          const pct = Math.max(minHeight, (d.v / m) * 92);
          return (
            <div key={i} className="wg-bar-col" title={`${d.label}: ${d.v}`}>
              <div className="wg-bar-val">{format(d.v)}</div>
              <div className="wg-bar" style={{ height: `${pct}%`, background: d.color || 'var(--accent)' }}/>
              <div className="wg-bar-lbl">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ segments, centerValue, centerLabel }) {
  const R = 54, C = 2 * Math.PI * R;
  const total = segments.reduce((s, x) => s + x.v, 0);
  let offset = 0;
  return (
    <div className="wg-donut-wrap">
      <svg viewBox="0 0 140 140" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="#EFF2F5" strokeWidth="18"/>
        {segments.map((s, i) => {
          const dash = (s.v / total) * C;
          const el = (
            <circle key={i} cx="70" cy="70" r={R} fill="none"
              stroke={s.color} strokeWidth="18"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"/>
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="wg-donut-center">
        <b>{centerValue}</b>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

function DonutLegend({ segments, total }) {
  return (
    <div className="wg-donut-legend">
      {segments.map((s, i) => (
        <div key={i} className="wg-legend-item">
          <span className="wg-legend-dot" style={{ background: s.color }}/>
          <span>{s.label}</span>
          <b>{s.v}</b>
        </div>
      ))}
    </div>
  );
}

function Top5List({ data }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <ol className="wg-top5">
      {data.slice(0, 5).map((d, i) => (
        <li key={i}>
          <span className="wg-top5-rank" data-rank={i + 1}>{i + 1}</span>
          <div className="wg-top5-body">
            <div className="wg-top5-row"><span className="wg-top5-lbl">{d.label}</span><b>{d.v}</b></div>
            <div className="wg-top5-track"><div className="wg-top5-fill" style={{ width: `${(d.v / max) * 100}%`, background: d.color || 'var(--accent)' }}/></div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Chart widget shell with type switcher ────────────────────
function ChartWidget({ title, subtitle, data, primary = 'bars', availableTypes = ['bars', 'donut', 'top5'], centerValue, centerLabel, format, donutCenter, onOpen }) {
  const [type, setType] = wS(primary);
  const I = window.EprIcon;

  const renderChart = () => {
    if (type === 'donut') {
      const total = data.reduce((s, x) => s + x.v, 0);
      return (
        <div className="wg-donut-body">
          <DonutChart segments={data} centerValue={donutCenter?.value ?? total} centerLabel={donutCenter?.label ?? 'סה״כ'}/>
          <DonutLegend segments={data} total={total}/>
        </div>
      );
    }
    if (type === 'top5') return <Top5List data={[...data].sort((a,b)=>b.v-a.v)}/>;
    return <VBarChart data={data} format={format}/>;
  };

  const typeLabels = { bars: 'עמודות', donut: 'דונאט', top5: 'Top 5' };
  const typeIcons = {
    bars: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="6" width="4" height="15"/><rect x="17" y="9" width="4" height="12"/></svg>,
    donut: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>,
    top5: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="18" x2="12" y2="18"/></svg>,
  };

  return (
    <section className="wg">
      <header className="wg-head">
        <div className="wg-head-txt">
          <h4 className="wg-title">{title}</h4>
          {subtitle && <p className="wg-sub">{subtitle}</p>}
        </div>
        <div className="row" style={{gap:4}}>
          {onOpen && <button className="wg-edit" onClick={onOpen} aria-label="פתח" title="פתח תצוגה מלאה">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M9 7h8v8"/></svg>
          </button>}
          <button className="wg-edit" aria-label="ערוך ווידג׳ט" title="ערוך ווידג׳ט">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
      </header>
      <div className="wg-body">{renderChart()}</div>
      <footer className="wg-foot">
        {availableTypes.map(t => (
          <button key={t} className={`wg-tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
            {typeIcons[t]}<span>{typeLabels[t]}</span>
          </button>
        ))}
      </footer>
    </section>
  );
}

// ── Widgets grid — 6 widgets, 3×2 ─────────────────────────────
function WidgetsGrid({ goPage }) {
  // Palette matching EPR teal system + accent colors
  const C = {
    teal: '#2AA7B8',
    teal2: '#4AB7C4',
    amber: '#E6A23C',
    red: '#E24B4B',
    green: '#3BB76E',
    purple: '#8B5BC6',
    blue: '#4A8BC4',
    slate: '#6B8294',
  };

  const byDept = [
    { label:'רווחה', v:42, color:C.teal },
    { label:'הנדסה', v:38, color:C.blue },
    { label:'חינוך', v:31, color:C.amber },
    { label:'גבייה', v:24, color:C.purple },
    { label:'תברואה', v:18, color:C.green },
    { label:'ביטחון', v:11, color:C.red },
  ];

  const urgentTop = [
    { label:'דליפת מים ברח׳ הרצל 22', v:98, color:C.red },
    { label:'מפגע בטיחותי בגן רקפת', v:94, color:C.red },
    { label:'עיכוב גבייה — חוב מצטבר', v:89, color:C.amber },
    { label:'תלונה על רעש מתמשך', v:82, color:C.amber },
    { label:'בקשה לסיוע מיידי', v:76, color:C.amber },
  ];

  const health = [
    { label:'בזמן', v:184, color:C.green },
    { label:'בסיכון', v:42, color:C.amber },
    { label:'חריגה', v:23, color:C.red },
  ];
  const healthTotal = 249;

  const topClerks = [
    { label:'שרה כהן', v:47, color:C.teal },
    { label:'יוסי לוי', v:41, color:C.teal2 },
    { label:'מיכל דהן', v:36, color:C.teal },
    { label:'אורן גולן', v:29, color:C.teal2 },
    { label:'נועה ברק', v:22, color:C.teal },
  ];

  const topics = [
    { label:'תחזוקה', v:58, color:C.blue },
    { label:'גבייה', v:44, color:C.purple },
    { label:'תשתיות', v:36, color:C.teal },
    { label:'רישוי', v:28, color:C.amber },
    { label:'תלונות', v:19, color:C.red },
  ];

  const ageBuckets = [
    { label:'0–24 שעות', v:62, color:C.green },
    { label:'1–3 ימים', v:48, color:C.teal },
    { label:'4–7 ימים', v:31, color:C.amber },
    { label:'מעל שבוע', v:14, color:C.red },
  ];

  return (
    <div className="wg-grid">
      <ChartWidget title="פניות פתוחות לפי מחלקה" subtitle="חלוקת הפניות הפתוחות" data={byDept} onOpen={()=>goPage&&goPage('requests')}/>
      <ChartWidget title="בריאות ארגונית" subtitle="בזמן / בסיכון / חריגה"
        data={health} primary="donut"
        donutCenter={{ value: healthTotal, label: 'סה״כ' }}
        onOpen={()=>goPage&&goPage('requests')}/>
      <ChartWidget title="הפניות הדחופות ביותר" subtitle="Top 5 לפי עדיפות וזמן המתנה"
        data={urgentTop} primary="top5" onOpen={()=>goPage&&goPage('requests')}/>
      <ChartWidget title="גורמים מטפלים מובילים" subtitle="פניות שנסגרו · 30 ימים"
        data={topClerks} onOpen={()=>goPage&&goPage('team')}/>
      <ChartWidget title="גיל הפנייה" subtitle="התפלגות זמן פתיחה"
        data={ageBuckets} onOpen={()=>goPage&&goPage('requests')}/>
      <ChartWidget title="נושאים מובילים" subtitle="5 הקטגוריות הגדולות"
        data={topics} onOpen={()=>goPage&&goPage('settings/topics')}/>
    </div>
  );
}

Object.assign(window, { ChartWidget, WidgetsGrid });
