const { useState: npS, useEffect: npE, useRef: npR } = React;

const NOTIFICATIONS = [
  { id:1, kind:'urgent', who:'מערכת', title:'3 פניות חורגות מ-SLA בפיקוח', when:new Date(Date.now()-5*60*1000).toISOString(), unread:true, action:'#requests' },
  { id:2, kind:'message', who:'אריאל כהן', title:'הוסיף הערה ל-REQ-24193', when:new Date(Date.now()-12*60*1000).toISOString(), unread:true, action:'#requests' },
  { id:3, kind:'assignment', who:'נועה לביא', title:'הוקצתה אליך פנייה חדשה: דליפת מים', when:new Date(Date.now()-32*60*1000).toISOString(), unread:true, action:'#requests' },
  { id:4, kind:'system', who:'מערכת', title:'דוח SLA יומי הופק והוא זמין', when:new Date(Date.now()-2*3600*1000).toISOString(), unread:false, action:'#saved-reports' },
  { id:5, kind:'message', who:'יעל בן דוד', title:'תגובה לפנייה REQ-24192', when:new Date(Date.now()-3*3600*1000).toISOString(), unread:false, action:'#requests' },
  { id:6, kind:'system', who:'מערכת', title:'גיבוי יומי הסתיים בהצלחה', when:new Date(Date.now()-5*3600*1000).toISOString(), unread:false, action:'#settings/audit' },
  { id:7, kind:'pending', who:'מערכת', title:'2 משתמשים חדשים ממתינים לאישור', when:new Date(Date.now()-8*3600*1000).toISOString(), unread:false, action:'#users' },
];

const TODAY_EVENTS = [
  { time:'08:30', title:'פגישת בוקר — מוקד', dur:30, where:'חדר ישיבות 2', color:'#2AA7B8' },
  { time:'10:00', title:'סקירת SLA שבועית', dur:45, where:'זום', color:'#7B5BD6' },
  { time:'11:30', title:'ביקור שטח — רחוב ההדרים', dur:90, where:'שטח · ההדרים 12', color:'#F2B134' },
  { time:'14:00', title:'אישור היתרים — ועדה', dur:60, where:'חדר ועדות', color:'#3BB76E' },
  { time:'15:30', title:'הדרכת עובדים חדשים', dur:45, where:'אולם הדרכות', color:'#2E6BE6' },
  { time:'17:00', title:'סיכום יום עם ראש מוקד', dur:30, where:'משרד', color:'#D14444' },
];

const PENDING_USERS = [
  { id:1, name:'דנה כץ', email:'dana.k@new.gov.il', role:'מנהל מחלקה', dept:'חינוך', requested:'לפני 2 שעות', avatar:'דכ' },
  { id:2, name:'יואב רוזן', email:'yoav.r@new.gov.il', role:'רכז שטח', dept:'תברואה', requested:'אתמול', avatar:'יר' },
  { id:3, name:'שרה גולן', email:'sara.g@new.gov.il', role:'מוקדן', dept:'מוקד 106', requested:'לפני 3 ימים', avatar:'שג' },
];

function rel(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'הרגע';
  if (min < 60) return `לפני ${min} ד׳`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `לפני ${hr} ש׳`;
  return new Date(iso).toLocaleDateString('he-IL');
}

function PopAnchor({ open, onClose, children, className='', anchorSel }) {
  const ref = npR(null);
  npE(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      if (anchorSel && e.target.closest(anchorSel)) return;
      onClose();
    };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open, onClose, anchorSel]);
  if (!open) return null;
  return <div ref={ref} className={`ep-pop ${className}`} role="dialog" aria-modal="false">{children}</div>;
}

function NotificationsPanel() {
  const [open, setOpen] = npS(false);
  const [items, setItems] = npS(NOTIFICATIONS);
  npE(() => {
    const h = () => setOpen(o => !o);
    window.addEventListener('open-notifications', h);
    return () => window.removeEventListener('open-notifications', h);
  }, []);
  const unread = items.filter(x => x.unread).length;
  const markAll = () => { setItems(items.map(i => ({ ...i, unread:false }))); window.eprToast && window.eprToast('כל ההתראות סומנו כנקראו', 'success'); };
  const onClick = (it) => {
    setItems(items.map(i => i.id === it.id ? { ...i, unread:false } : i));
    setOpen(false);
    if (it.action) location.hash = it.action;
  };
  const KIND_ICON = { urgent:'⚡', message:'💬', assignment:'👤', system:'🔔', pending:'⏳' };
  const KIND_COLOR = { urgent:'#D14444', message:'#2E6BE6', assignment:'#7B5BD6', system:'#2AA7B8', pending:'#F2B134' };
  return (
    <PopAnchor open={open} onClose={()=>setOpen(false)} className="ep-pop-notifications" anchorSel="[data-pop='notifications']">
      <header className="ep-pop-head">
        <div>
          <h3>התראות</h3>
          {unread>0 && <span className="ep-pop-badge">{unread} חדשות</span>}
        </div>
        <button className="ep-pop-action" onClick={markAll} data-toast="off">סמן כולן כנקראו</button>
      </header>
      <div className="ep-pop-body">
        {items.length===0 ? (
          <div className="ep-pop-empty">אין התראות חדשות</div>
        ) : (
          <ul className="ep-pop-list">
            {items.map(it => (
              <li key={it.id}>
                <button className={`ep-pop-item ${it.unread?'unread':''}`} onClick={()=>onClick(it)} data-toast="off">
                  <span className="ep-pop-item-ic" style={{background:KIND_COLOR[it.kind]+'22',color:KIND_COLOR[it.kind]}} aria-hidden="true">{KIND_ICON[it.kind]||'•'}</span>
                  <span className="ep-pop-item-body">
                    <span className="ep-pop-item-title">{it.title}</span>
                    <span className="ep-pop-item-sub">{it.who} · {rel(it.when)}</span>
                  </span>
                  {it.unread && <span className="ep-pop-dot" aria-label="לא נקראה"/>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="ep-pop-foot">
        <button className="ep-pop-link" onClick={()=>{ setOpen(false); location.hash='#requests'; }} data-toast="off">הצג הכל ‹</button>
      </footer>
    </PopAnchor>
  );
}

function CalendarPanel() {
  const [open, setOpen] = npS(false);
  npE(() => {
    const h = () => setOpen(o => !o);
    window.addEventListener('open-calendar', h);
    return () => window.removeEventListener('open-calendar', h);
  }, []);
  const today = new Date();
  const dateStr = today.toLocaleDateString('he-IL', { weekday:'long', day:'numeric', month:'long' });
  return (
    <PopAnchor open={open} onClose={()=>setOpen(false)} className="ep-pop-calendar" anchorSel="[data-pop='calendar']">
      <header className="ep-pop-head">
        <div>
          <h3>היומן שלי</h3>
          <span className="ep-pop-sub">{dateStr}</span>
        </div>
        <button className="ep-pop-action" onClick={()=>{ setOpen(false); window.eprToast && window.eprToast('פתיחת יומן מלא', 'info'); }} data-toast="off">+ פגישה</button>
      </header>
      <div className="ep-pop-body">
        <ul className="ep-cal-list">
          {TODAY_EVENTS.map((ev,i)=>(
            <li key={i} className="ep-cal-event">
              <span className="ep-cal-time">
                <b>{ev.time}</b>
                <span>{ev.dur}׳</span>
              </span>
              <span className="ep-cal-bar" style={{background:ev.color}} aria-hidden="true"/>
              <span className="ep-cal-body">
                <span className="ep-cal-title">{ev.title}</span>
                <span className="ep-cal-where">{ev.where}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <footer className="ep-pop-foot">
        <button className="ep-pop-link" onClick={()=>{ setOpen(false); location.hash='#settings/business-calendar'; }} data-toast="off">הגדרות יומן עסקי ‹</button>
      </footer>
    </PopAnchor>
  );
}

function PendingApprovalsPanel() {
  const [open, setOpen] = npS(false);
  const [pending, setPending] = npS(PENDING_USERS);
  npE(() => {
    const h = () => setOpen(o => !o);
    window.addEventListener('open-pending-approvals', h);
    return () => window.removeEventListener('open-pending-approvals', h);
  }, []);
  const approve = (id) => {
    const u = pending.find(x=>x.id===id);
    setPending(pending.filter(x=>x.id!==id));
    window.eprToast && window.eprToast(`${u.name} אושר/ה — נשלחה הזמנה במייל`, 'success');
  };
  const reject = (id) => {
    const u = pending.find(x=>x.id===id);
    setPending(pending.filter(x=>x.id!==id));
    window.eprToast && window.eprToast(`בקשת ${u.name} נדחתה`, 'danger');
  };
  return (
    <PopAnchor open={open} onClose={()=>setOpen(false)} className="ep-pop-pending" anchorSel="[data-pop='pending']">
      <header className="ep-pop-head">
        <div>
          <h3>ממתינים לאישור</h3>
          <span className="ep-pop-sub">{pending.length} בקשות הצטרפות חדשות</span>
        </div>
      </header>
      <div className="ep-pop-body">
        {pending.length===0 ? (
          <div className="ep-pop-empty">אין בקשות ממתינות</div>
        ) : (
          <ul className="ep-pop-list">
            {pending.map(u => (
              <li key={u.id} className="ep-pending-item">
                <div className="ep-avatar" style={{width:34,height:34,fontSize:12}} aria-hidden="true">{u.avatar}</div>
                <div className="ep-pending-body">
                  <div className="ep-pending-name">{u.name}</div>
                  <div className="ep-pending-meta">{u.role} · {u.dept} · {u.requested}</div>
                  <div className="ep-pending-email" dir="ltr">{u.email}</div>
                </div>
                <div className="ep-pending-actions">
                  <button className="ep-btn ep-btn-primary ep-btn-sm" onClick={()=>approve(u.id)} data-toast="off">אשר</button>
                  <button className="ep-btn ep-btn-ghost ep-btn-sm" onClick={()=>reject(u.id)} data-toast="off">דחה</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="ep-pop-foot">
        <button className="ep-pop-link" onClick={()=>{ setOpen(false); location.hash='#users'; }} data-toast="off">לניהול משתמשים ‹</button>
      </footer>
    </PopAnchor>
  );
}

function TopbarPopovers() {
  return (<>
    <NotificationsPanel/>
    <CalendarPanel/>
    <PendingApprovalsPanel/>
  </>);
}

window.TopbarPopovers = TopbarPopovers;
