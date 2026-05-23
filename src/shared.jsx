// epr/v2-shared.jsx — shared shell components
const { useState: vS, useEffect: vE, useMemo: vM } = React;

function Sparkline({ data, tone='teal', h=36, w=120 }) {
  const min=Math.min(...data), max=Math.max(...data), r=max-min||1, step=w/(data.length-1);
  const pts=data.map((v,i)=>[i*step, h-((v-min)/r)*(h-6)-3]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const stroke={teal:'#2AA7B8',green:'#3BB76E',amber:'#F2B134',red:'#E24B4B'}[tone];
  const fill={teal:'rgba(42,167,184,.12)',green:'rgba(59,183,110,.12)',amber:'rgba(242,177,52,.12)',red:'rgba(226,75,75,.12)'}[tone];
  return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="ep-spark"><path d={`${d} L${w},${h} L0,${h} Z`} fill={fill}/><path d={d} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/><circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={stroke}/></svg>;
}

// ── Sidebar v2: nested groups matching the actual eprdigital routes ──
const NAV_GROUPS = [
  { id:'dashboard', icon:'home', label:'תמונת מצב' },
  {
    id:'requests', icon:'inbox', label:'ניהול פניות', badge:284,
    children:[
      { id:'requests',         label:'כל הפניות' },
      { id:'saved-reports',    label:'דוחות שמורים', icon:'chart' },
      { id:'my-reports',       label:'הדוחות שלי',   icon:'chart' },
    ],
  },
  { id:'team',      icon:'chart',  label:'ביצועי צוות' },
  { id:'bulk',      icon:'msg',    label:'הודעות מרוכזות' },
  { id:'residents', icon:'users',  label:'תושבים', badge:1284 },
  { id:'users',     icon:'shield', label:'ניהול משתמשים', adminOnly:true },
  {
    id:'settings', icon:'gear', label:'הגדרות', adminOnly:true,
    children:[
      { id:'settings/general',           label:'כללי',              icon:'gear' },
      { id:'settings/business-calendar', label:'יומן עסקי',          icon:'calendar' },
      { id:'settings/organization',      label:'מבנה ארגוני',       icon:'building' },
      { id:'settings/topics',            label:'נושאי פנייה',       icon:'inbox' },
      { id:'settings/sla',               label:'זמני SLA',          icon:'clock' },
      { id:'settings/forms',             label:'טפסי פנייה',        icon:'doc' },
      { id:'settings/channels',          label:'ערוצי כניסה',        icon:'phone' },
      { id:'settings/auto-routing',      label:'ניתוב אוטומטי',     icon:'send' },
      { id:'settings/templates',         label:'תבניות הודעה',      icon:'mail' },
      { id:'settings/integrations',      label:'אינטגרציות',         icon:'shield' },
      { id:'settings/security',          label:'אבטחה והרשאות',     icon:'shield' },
      { id:'settings/notifications',     label:'התראות',            icon:'bell' },
      { id:'settings/branding',          label:'מיתוג ופורטל',       icon:'building' },
      { id:'settings/audit',             label:'יומן ביקורת',        icon:'doc' },
    ],
  },
  { id:'install',   icon:'download', label:'התקנת אפליקציה' },
];

function Sidebar({ page, setPage }) {
  const I = window.EprIcon;
  const [collapsed, setCollapsed] = vS(()=> {
    try { return localStorage.getItem('epr-sb-collapsed') === '1'; } catch(_) { return false; }
  });
  vE(()=>{
    try { localStorage.setItem('epr-sb-collapsed', collapsed?'1':'0'); } catch(_) {}
    document.documentElement.classList.toggle('ep-sb-collapsed', collapsed);
  }, [collapsed]);
  const [open,setOpen] = vS(()=>{
    const initial = {};
    NAV_GROUPS.forEach(g=>{
      if(g.children?.some(c=>page===c.id)) initial[g.id]=true;
    });
    return initial;
  });
  const isActive = (id) => page===id || (id==='requests' && page==='request-detail');
  return (
    <aside className={`ep-sb ${collapsed?'collapsed':''}`}>
      <div className="ep-brand">
        <div className="ep-logo">E</div>
        <div className="ep-brand-txt">
          <div className="ep-brand-name">EPR Digital</div>
          <div className="ep-brand-sub">בק אופיס · רעננה</div>
        </div>
        <button
          className="ep-sb-toggle"
          onClick={()=>setCollapsed(c=>!c)}
          data-toast="off"
          title={collapsed?'פתח סרגל':'כווץ סרגל'}
          aria-label={collapsed?'פתח סרגל':'כווץ סרגל'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}/>
          </svg>
        </button>
      </div>
      <div className="ep-sb-sect">ניווט</div>
      <nav className="ep-nav">
        {NAV_GROUPS.map(g=>{
          const hasChildren = !!g.children?.length;
          const groupActive = isActive(g.id) || g.children?.some(c=>page===c.id);
          const isOpen = open[g.id] ?? groupActive;
          return (
            <div key={g.id}>
              {hasChildren ? (
                <a href="#" className={groupActive?'active':''} title={collapsed?g.label:undefined}
                   onClick={e=>{e.preventDefault();
                     if(collapsed){ setCollapsed(false); setOpen({...open,[g.id]:true}); }
                     else setOpen({...open,[g.id]:!isOpen});
                   }}>
                  <span className="ep-nav-ic">{I[g.icon]?React.createElement(I[g.icon]):null}</span>
                  <span className="ep-nav-lbl">{g.label}</span>
                  {g.badge!=null && <span className="ep-nav-badge">{g.badge.toLocaleString('he-IL')}</span>}
                  <span className={`ep-nav-chev ${isOpen?'open':''}`} aria-hidden="true"><I.chevD width={12} height={12}/></span>
                </a>
              ) : (
                <a href="#" className={isActive(g.id)?'active':''} title={collapsed?g.label:undefined}
                   onClick={e=>{e.preventDefault();setPage(g.id)}}>
                  <span className="ep-nav-ic">{I[g.icon]?React.createElement(I[g.icon]):null}</span>
                  <span className="ep-nav-lbl">{g.label}</span>
                  {g.badge!=null && <span className="ep-nav-badge">{g.badge.toLocaleString('he-IL')}</span>}
                </a>
              )}
              {hasChildren && isOpen && !collapsed && (
                <div className="ep-nav-children">
                  {g.children.map(c=>(
                    <a key={c.id} href="#" className={`child ${page===c.id?'active':''}`} onClick={e=>{e.preventDefault();setPage(c.id)}}>
                      {c.icon && I[c.icon] && <span className="ep-nav-ic">{React.createElement(I[c.icon])}</span>}
                      {c.icon && !I[c.icon] && <span className="ep-nav-bullet"/>}
                      {!c.icon && <span className="ep-nav-bullet"/>}
                      <span className="ep-nav-lbl">{c.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="ep-sb-bot">
        <div className="ep-sb-user">
          <div className="ep-avatar">מע</div>
          <div className="ep-sb-user-txt">
            <div className="ep-sb-user-name">מיכל עמרן</div>
            <div className="ep-sb-user-role">מנהלת בק אופיס</div>
          </div>
          <button className="ep-icon-btn" title="התנתקות" style={{width:30,height:30}}><I.logout width={16} height={16}/></button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ crumbs, onSearch, goPage, theme, setTheme }) {
  const I = window.EprIcon;
  const isDark = theme === 'dark';
  return (
    <header className="ep-top" role="banner">
      <button
        className="ep-mobile-menu-btn"
        aria-label="פתח תפריט ניווט"
        onClick={()=>document.querySelector('.ep-sb')?.classList.toggle('mobile-open')}
        data-toast="off"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <nav className="ep-crumbs" aria-label="ניווט מפה">
        <a href="#dashboard" className="ep-crumb-link" onClick={e=>{e.preventDefault();goPage&&goPage('dashboard')}}>בק אופיס</a>
        {crumbs.map((c,i)=>{
          const isLast = i===crumbs.length-1;
          let target = null;
          if(!isLast){
            if(c==='הגדרות') target = 'settings/general';
            else if(c==='ניהול פניות') target = 'requests';
          }
          return (
            <React.Fragment key={i}>
              <I.chevL width={12} height={12} aria-hidden="true"/>
              {isLast
                ? <b aria-current="page">{c}</b>
                : <a href="#" className="ep-crumb-link" onClick={e=>{e.preventDefault();target&&goPage&&goPage(target)}}>{c}</a>}
            </React.Fragment>
          );
        })}
      </nav>
      <button className="ep-search" style={{marginInlineStart:20}} data-toast="off"
        onClick={()=>window.dispatchEvent(new Event('open-ai-search'))}
        title="חיפוש חכם עם AI · ⌘K">
        <I.search width={16} height={16}/>
        <span>חפש תושב, פנייה או רחוב · או שאל את ה-AI…</span>
        <span className="ep-ai-pill">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm7 11l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9.9-2.7z"/>
          </svg>
          AI
        </span>
        <kbd className="ep-kbd">⌘K</kbd>
      </button>
      <div className="ep-top-right">
        {setTheme && (
          <button className="ep-theme-toggle" data-toast="off"
            onClick={()=>setTheme(isDark?'light':'dark')}
            title={isDark?'מצב בהיר':'מצב כהה'}
            aria-label={isDark?'עבור למצב בהיר':'עבור למצב כהה'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {isDark
                ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>
                : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              }
            </svg>
          </button>
        )}
        <button className="ep-icon-btn" data-pop="pending" title="ממתינים לאישור" aria-label="ממתינים לאישור" onClick={()=>window.dispatchEvent(new Event('open-pending-approvals'))}><I.shield/><span className="ep-dot" style={{background:'var(--amber)'}} aria-hidden="true"/></button>
        <button className="ep-icon-btn" data-pop="calendar" title="יומן" aria-label="יומן" onClick={()=>window.dispatchEvent(new Event('open-calendar'))}><I.calendar/></button>
        <button className="ep-icon-btn" data-pop="notifications" title="התראות" aria-label="התראות" onClick={()=>window.dispatchEvent(new Event('open-notifications'))}><I.bell/><span className="ep-dot" aria-hidden="true"/></button>
      </div>
    </header>
  );
}

function PageHeader({ title, subtitle, actions, icon }) {
  const I = window.EprIcon;
  return (
    <div className="ep-ph">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        {icon && I[icon] && <div className="ep-ph-icon">{React.createElement(I[icon])}</div>}
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      </div>
      {actions && <div className="ep-ph-actions">{actions}</div>}
    </div>
  );
}

Object.assign(window, { Sparkline, Sidebar, TopBar, PageHeader });
