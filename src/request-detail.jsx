// epr/v3-request-detail.jsx — Rich RequestDetail page modeled on eprdigital's
// TicketStepper + InfoTabsWidget + ExceptionsPanel + ChatDrawer + NotificationTemplates + ApplicantCard

const { useState: rdS, useMemo: rdM, useEffect: rdE, useRef: rdR } = React;

// ── Stepper config (matches lib/bpm-workflow + buildStagesFromApproval) ──────
const WF_STAGES = [
  { id: 'new',          label: 'חדשה',           status: 'חדש' },
  { id: 'triage',       label: 'מיון ראשוני',     status: 'בטיפול',         approver: 'נועה לביא',  role: 'מנתבת ראשית' },
  { id: 'department',   label: 'אישור מחלקה',     status: 'בדיקת מסמכים',   approver: 'רון שטרן',   role: 'ר״צ הנדסה' },
  { id: 'manager',      label: 'אישור מנהל',      status: 'ממתין לאישור',    approver: 'דנה כהן',    role: 'מנהלת תפעול' },
  { id: 'decision',     label: 'החלטה',           status: 'החלטה' },
];

// status color map
const STATUS_TONES = {
  'חדש':            { bg:'#E6F2FF', tx:'#1E5BB8', dot:'#2E6BE6' },
  'בטיפול':         { bg:'#E6F7F9', tx:'#0F5965', dot:'#2AA7B8' },
  'בדיקת מסמכים':   { bg:'#F3EBFF', tx:'#5A33A1', dot:'#8358D6' },
  'ממתין לאישור':   { bg:'#FFF4E0', tx:'#8A5F17', dot:'#F2B134' },
  'מחכה למסמכים':   { bg:'#FFE9D6', tx:'#A6531A', dot:'#E8843D' },
  'מאושר':          { bg:'#E5F5EC', tx:'#1F6D40', dot:'#3BB76E' },
  'נדחה':           { bg:'#FCE6E6', tx:'#9B2A2A', dot:'#D14444' },
  'מוקפא':          { bg:'#E8F0FF', tx:'#2E4F8F', dot:'#5577CC' },
  'הועבר':          { bg:'#F0EBFF', tx:'#5A33A1', dot:'#7B5BD6' },
  'פתוח':           { bg:'#E6F2FF', tx:'#1E5BB8', dot:'#2E6BE6' },
  'חיצוני':         { bg:'#F4F1EC', tx:'#6A5638', dot:'#8A7350' },
};
const tone = (s) => STATUS_TONES[s] || STATUS_TONES['בטיפול'];

// ── Activity classification (mirrors ActivityTimeline.classifyHistoryItem) ──
const ACT_DEFS = [
  { v:'all',               label:'הכל',           color:'#5A6B7C' },
  { v:'status_change',     label:'מעבר סטטוס',    color:'#5577CC' },
  { v:'internal_note',     label:'הערה פנימית',   color:'#F2B134' },
  { v:'assignment_change', label:'שינוי שיוך',    color:'#7B5BD6' },
  { v:'contact_message',   label:'יצירת קשר',     color:'#2AA7B8' },
  { v:'file_uploaded',     label:'קובץ',          color:'#E8843D' },
  { v:'action',            label:'פעולה',         color:'#8FA0B0' },
];

// ── Build a rich activity log for a row ─────────────────────────────────────
function buildActivity(row) {
  return [
    { id:1, type:'status_change',     when:'לפני 2 דק׳',  user:'מערכת',           text:'סטטוס עודכן', from:'בדיקת מסמכים', to:row.status },
    { id:2, type:'internal_note',     when:'לפני 8 דק׳',  user:'אריאל כהן',        text:'נשלח טכנאי שטח, אומדן הגעה 14:30. עדכנתי את הפונה.' },
    { id:3, type:'contact_message',   when:'לפני 35 דק׳', user:'מערכת',           text:'נשלחה הודעת SMS לפונה', details:`+972-${row.id}` },
    { id:4, type:'file_uploaded',     when:'לפני 1 ש׳',   user:row.clerk||'מערכת', text:'צורף קובץ: signature.png' },
    { id:5, type:'assignment_change', when:'לפני 1 ש׳',   user:'נועה לביא',        text:'שובצה ל-' + (row.clerk==='—'?'ממתין':row.clerk) },
    { id:6, type:'status_change',     when:'לפני 2 ש׳',   user:'נועה לביא',        text:'סטטוס עודכן', from:'חדש', to:'בטיפול' },
    { id:7, type:'action',            when:'לפני 2 ש׳',   user:'מערכת',           text:'הוקצתה למחלקת ' + row.dept },
    { id:8, type:'status_change',     when:row.created,    user:'מערכת',           text:'הפנייה נוצרה',  from:'—', to:'חדש' },
  ];
}

// ── Build approval history per request ──────────────────────────────────────
function buildApprovals(row) {
  const A = [
    { stage:'מיון ראשוני', approver:'נועה לביא', decision:'approved', when:'21.04 09:18', comment:'נראה תקין, מועבר למחלקה' },
    { stage:'אישור מחלקה',  approver:'רון שטרן',  decision:'approved', when:'21.04 11:42', comment:'עומד בקריטריונים' },
    { stage:'אישור מנהל',   approver:'דנה כהן',   decision:'pending',  when:null, comment:'' },
  ];
  if (row.status === 'מאושר') { A[2].decision = 'approved'; A[2].when = '22.04 14:10'; A[2].comment = 'אושר'; }
  if (row.status === 'נדחה')  { A[2].decision = 'rejected'; A[2].when = '22.04 14:10'; A[2].comment = 'לא עומד בקריטריונים'; }
  if (row.status === 'חדש')   return [{ ...A[0], decision:'pending', when:null, comment:'' }, A[1], A[2]];
  return A;
}

// determine current step idx by row.status
function currentStepIdx(row) {
  const s = row.status;
  if (s === 'חדש') return 0;
  if (s === 'בטיפול' || s === 'הועבר' || s === 'פתוח') return 1;
  if (s === 'בדיקת מסמכים' || s === 'מחכה למסמכים') return 2;
  if (s === 'ממתין לאישור') return 3;
  if (s === 'מאושר' || s === 'נדחה') return 4;
  return 1;
}

// ── Approval decision dot ────────────────────────────────────────────────────
const DECISION = {
  approved: { lbl:'אושר',   tx:'#1F6D40', bg:'#E5F5EC', dot:'#3BB76E' },
  rejected: { lbl:'נדחה',   tx:'#9B2A2A', bg:'#FCE6E6', dot:'#D14444' },
  returned: { lbl:'הוחזר',  tx:'#A6531A', bg:'#FFE9D6', dot:'#E8843D' },
  pending:  { lbl:'ממתין',  tx:'#5A6B7C', bg:'#F0F2F4', dot:'#9AA8B6' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Stepper visual
// ─────────────────────────────────────────────────────────────────────────────
function StepperVisual({ row, isFrozen }) {
  const idx = currentStepIdx(row);
  const isRejected = row.status === 'נדחה';
  return (
    <div className="rd-stepper">
      {WF_STAGES.map((st, i) => {
        const done = i < idx;
        const active = i === idx && !isRejected;
        const failed = isRejected && i === WF_STAGES.length - 1;
        return (
          <React.Fragment key={st.id}>
            <div className={`rd-step ${done?'done':''} ${active?'active':''} ${failed?'failed':''}`}>
              <div className="rd-step-num">
                {done ? <window.EprIcon.check width={14} height={14}/> :
                 failed ? '×' :
                 (i+1)}
                {active && <span className="rd-step-pulse"/>}
              </div>
              <div className="rd-step-label">
                <div className="rd-step-title">{st.label}</div>
                {st.approver && <div className="rd-step-approver">{st.approver}<span className="rd-step-role"> · {st.role}</span></div>}
                {!st.approver && i === 0 && <div className="rd-step-approver">נוצרה {row.created}</div>}
                {!st.approver && i === WF_STAGES.length - 1 && (
                  <div className="rd-step-approver">{isRejected?'נדחתה':row.status==='מאושר'?'אושרה':'ממתין להחלטה'}</div>
                )}
              </div>
            </div>
            {i < WF_STAGES.length - 1 && <div className={`rd-step-bar ${done?'done':''}`}/>}
          </React.Fragment>
        );
      })}
      {isFrozen && (
        <div className="rd-frozen-badge">
          <window.EprIcon.clock width={12} height={12}/> פנייה מוקפאת
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stepper actions row
// ─────────────────────────────────────────────────────────────────────────────
function StepperActions({ row, canAct, onApprove, onReject, onReturn, onCancel, onStart, isFrozen }) {
  const I = window.EprIcon;
  const idx = currentStepIdx(row);
  const isFinal = row.status==='מאושר' || row.status==='נדחה';
  const isNew = row.status==='חדש';
  const activeApprover = WF_STAGES[idx]?.approver;

  if (isFinal) {
    return (
      <div className="rd-actions-row">
        <div className="rd-actions-state">
          {row.status==='מאושר'
            ? <><span className="rd-state-dot ok"/>הפנייה אושרה — נסגרה ב-22.04 14:10</>
            : <><span className="rd-state-dot bad"/>הפנייה נדחתה — נסגרה ב-22.04 14:10</>}
        </div>
        <button className="ep-btn ep-btn-ghost ep-btn-sm"><I.send width={12} height={12}/>פתח מחדש</button>
      </div>
    );
  }

  return (
    <div className="rd-actions-row">
      <div className="rd-actions-state">
        {!canAct && activeApprover ? (
          <><span className="rd-state-dot warn"/>שלב זה מוקצה ל<b style={{margin:'0 4px'}}>{activeApprover}</b> — אין הרשאה לבצע פעולות</>
        ) : isFrozen ? (
          <><span className="rd-state-dot warn"/>הפנייה מוקפאת — שחרר כדי להמשיך</>
        ) : (
          <><span className="rd-state-dot ok"/>אתה מוקצה לשלב <b style={{margin:'0 4px'}}>{WF_STAGES[idx]?.label}</b></>
        )}
      </div>
      <div className="row" style={{gap:8}}>
        {isNew && (
          <button className="ep-btn ep-btn-primary ep-btn-sm" disabled={!canAct} onClick={onStart}>
            <I.send width={12} height={12}/>התחל טיפול
          </button>
        )}
        {!isNew && (
          <>
            <button className="ep-btn ep-btn-ghost ep-btn-sm" disabled={!canAct||isFrozen} onClick={onReturn}>
              ← החזר שלב
            </button>
            <button className="ep-btn rd-btn-reject ep-btn-sm" disabled={!canAct||isFrozen} onClick={onReject}>
              <I.close width={12} height={12}/>דחה
            </button>
            <button className="ep-btn ep-btn-primary ep-btn-sm" disabled={!canAct||isFrozen} onClick={onApprove}>
              <I.check width={12} height={12}/>אשר את השלב
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve / Reject / Return / Cancel dialogs (consolidated)
// ─────────────────────────────────────────────────────────────────────────────
function ActionDialog({ open, onClose, kind, onConfirm }) {
  if (!open) return null;
  const I = window.EprIcon;
  const cfg = {
    approve: { title:'אישור שלב',  desc:'הפנייה תקודם לשלב הבא בתהליך האישור.', btn:'אשר ושלח', tone:'primary', icon:<I.check width={14} height={14}/>, requireNote:false, placeholder:'הערה (אופציונלי)…' },
    reject:  { title:'דחיית פנייה', desc:'הפנייה תיסגר ותסומן כנדחית. פעולה זו תיוודע לפונה.', btn:'דחה פנייה', tone:'reject', icon:<I.close width={14} height={14}/>, requireNote:true,  placeholder:'נימוק לדחייה (חובה)…' },
    return:  { title:'החזרת שלב',  desc:'הפנייה תוחזר לשלב הקודם לתיקונים.', btn:'החזר שלב', tone:'amber', icon:<I.send width={14} height={14}/>, requireNote:true, placeholder:'מה צריך לתקן? (חובה)…' },
    cancel:  { title:'ביטול פנייה', desc:'הפנייה תבוטל ולא ניתן יהיה להחזירה.', btn:'בטל פנייה', tone:'reject', icon:<I.close width={14} height={14}/>, requireNote:true, placeholder:'סיבת ביטול (חובה)…' },
  }[kind] || { title:'', desc:'', btn:'אישור', icon:null, requireNote:false, placeholder:'' };

  const [note, setNote] = rdS('');
  rdE(()=>{ if(open) setNote(''); }, [open]);
  const disabled = cfg.requireNote && !note.trim();

  return (
    <div className="rd-modal-bg" onClick={onClose}>
      <div className="rd-modal" onClick={e=>e.stopPropagation()} dir="rtl">
        <div className="rd-modal-head">
          <h3>{cfg.title}</h3>
          <button className="ep-icon-btn" style={{width:28,height:28}} onClick={onClose}><I.close width={14} height={14}/></button>
        </div>
        <p className="ep-muted" style={{margin:'6px 0 12px',fontSize:13}}>{cfg.desc}</p>
        <label style={{display:'block',fontSize:12,color:'var(--muted)',marginBottom:6}}>{cfg.placeholder.replace('…','')}</label>
        <textarea className="rd-textarea" rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder={cfg.placeholder}/>
        <div className="row" style={{justifyContent:'flex-end',marginTop:14,gap:8}}>
          <button className="ep-btn ep-btn-ghost" onClick={onClose}>ביטול</button>
          <button
            className={`ep-btn ${cfg.tone==='primary'?'ep-btn-primary':cfg.tone==='reject'?'rd-btn-reject':'rd-btn-amber'}`}
            disabled={disabled}
            onClick={()=>{ onConfirm(note); onClose(); }}
          >{cfg.icon}{cfg.btn}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────────────────────
function RDTopBar({ row, goPage, goBack, chatOpen, onToggleChat, noteCount, canAct, isAdmin, onAdminOverride, activeApprover, onAssign }) {
  const I = window.EprIcon;
  const t = tone(row.status);
  const sla = row.sla;
  const slaTone = sla<30?'low':sla<60?'mid':'';

  return (
    <div className="rd-topbar">
      <div className="row" style={{gap:14}}>
        <button className="ep-icon-btn" onClick={goBack} aria-label="חזור">
          <I.chevR width={14} height={14}/>
        </button>
        <div className="rd-bcrumb">
          <button className="rd-bcrumb-link" onClick={()=>goPage('requests')}>פניות</button>
          <span className="rd-bcrumb-sep">‹</span>
          <span>{row.dept}</span>
        </div>
        <h1 className="rd-title">{row.title}</h1>
        <span className="ep-mono rd-num">#{row.id.replace('REQ-','')}</span>
        <button className="ep-icon-btn" style={{width:24,height:24}} title="העתק מספר"><I.copy width={11} height={11}/></button>
        <div className="rd-applicant-chip">
          <I.user width={12} height={12}/>{row.resident}
        </div>
        <span className="rd-status-pill" style={{background:t.bg,color:t.tx}}>
          <span className="rd-status-dot" style={{background:t.dot}}/>{row.status}
        </span>
        <div className={`rd-sla-chip ${slaTone}`}>
          <I.clock width={11} height={11}/>{row.slaText}
        </div>
      </div>
      <div className="row" style={{gap:8}}>
        {!canAct && activeApprover && (
          <div className="rd-perm-warn">
            <I.alert width={12} height={12}/>
            <span>שלב זה מוקצה ל<b>{activeApprover}</b></span>
            {isAdmin && <button className="rd-perm-override" onClick={onAdminOverride}>דרוס כמנהל</button>}
          </div>
        )}
        <button className="ep-btn ep-btn-ghost ep-btn-sm" onClick={onAssign}>
          <I.users width={12} height={12}/>העבר למטפל
        </button>
        <button className={`ep-btn ${chatOpen?'ep-btn-primary':'ep-btn-ghost'} ep-btn-sm`} onClick={onToggleChat}>
          <I.msg width={12} height={12}/>צ׳אט פנימי
          {noteCount>0 && <span className="rd-pill-count">{noteCount}</span>}
        </button>
        <button className="ep-btn ep-btn-ghost ep-btn-sm" onClick={()=>window.print()}>
          <I.download width={12} height={12}/>הדפסה
        </button>
        <button className="ep-icon-btn" aria-label="עוד פעולות"><I.more width={14} height={14}/></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right column — Applicant card + Property card
// ─────────────────────────────────────────────────────────────────────────────
function ApplicantPanel({ row }) {
  const I = window.EprIcon;
  const initials = row.resident.split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('');
  const phone = '052-698-1025';
  const email = (row.resident.replace(/\s+/g,'.').toLowerCase() || 'resident') + '@gmail.com';

  return (
    <div className="rd-card">
      <div className="rd-card-stripe" style={{background:'linear-gradient(to left, var(--accent), color-mix(in srgb, var(--accent) 40%, transparent))'}}/>
      <div className="rd-card-body">
        <div className="rd-card-head-row"><I.user width={14} height={14}/><span className="rd-card-eb">פרטי פונה</span></div>

        <div className="row" style={{gap:12,marginBottom:12}}>
          <div className="ep-avatar" style={{width:48,height:48,fontSize:16,boxShadow:'0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)'}}>{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14}}>{row.resident}</div>
            <div className="ep-muted" style={{fontSize:11,direction:'ltr',textAlign:'start',marginTop:2}}>{phone}</div>
          </div>
        </div>

        <div className="rd-applicant-actions">
          <button className="rd-app-act mail" title="שלח מייל"><I.mail width={14} height={14}/></button>
          <button className="rd-app-act wa"   title="וואטסאפ"><I.whatsapp width={14} height={14}/></button>
          <button className="rd-app-act tel"  title="התקשר"><I.phone width={14} height={14}/></button>
          <button className="rd-app-act copy" title="העתק"><I.copy width={14} height={14}/></button>
        </div>

        <div className="rd-kv-list">
          {[
            ['ת.ז.', '038456712'],
            ['טלפון', phone, 'ltr'],
            ['דוא״ל', email, 'ltr'],
            ['כתובת', 'ההדרים 12, רעננה'],
            ['שכונה', 'נווה זמר'],
          ].map(([k,v,dir])=>(
            <div key={k} className="rd-kv-row">
              <span className="rd-kv-k">{k}</span>
              <span className="rd-kv-v" dir={dir||'auto'}>{v}</span>
            </div>
          ))}
        </div>

        <div className="rd-toggle-list">
          {[['SMS',true],['Email',true],['WhatsApp',false]].map(([lbl,on])=>(
            <div key={lbl} className="rd-toggle-row">
              <span className="rd-kv-k">התראות {lbl}</span>
              <span className={`rd-switch ${on?'on':''}`}><span className="rd-switch-knob"/></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PropertyPanel({ row }) {
  const I = window.EprIcon;
  return (
    <div className="rd-card">
      <div className="rd-card-stripe" style={{background:'linear-gradient(to left, #F2B134, color-mix(in srgb, #F2B134 40%, transparent))'}}/>
      <div className="rd-card-body">
        <div className="rd-card-head-row"><I.map width={14} height={14}/><span className="rd-card-eb">מיקום</span></div>
        <div className="rd-map-stub" aria-hidden="true">
          <svg viewBox="0 0 200 100" width="100%" height="100%">
            <rect width="200" height="100" fill="#EAF1F4"/>
            <path d="M0 60 Q 50 40 100 55 T 200 50 L 200 100 L 0 100 Z" fill="#D6E5EA"/>
            <path d="M30 0 L 30 100 M 70 0 L 70 100 M 130 0 L 130 100 M 170 0 L 170 100" stroke="#C0D2D8" strokeWidth="1.5" strokeDasharray="2,3"/>
            <path d="M0 35 L 200 35 M 0 75 L 200 75" stroke="#C0D2D8" strokeWidth="1.5" strokeDasharray="2,3"/>
            <circle cx="100" cy="50" r="14" fill="#fff" opacity=".4"/>
            <circle cx="100" cy="50" r="8" fill="var(--accent)"/>
            <circle cx="100" cy="50" r="3" fill="#fff"/>
          </svg>
        </div>
        <div className="rd-kv-list" style={{marginTop:10}}>
          <div className="rd-kv-row"><span className="rd-kv-k">כתובת</span><span className="rd-kv-v">ההדרים 12</span></div>
          <div className="rd-kv-row"><span className="rd-kv-k">עיר</span><span className="rd-kv-v">רעננה</span></div>
          <div className="rd-kv-row"><span className="rd-kv-k">שכונה</span><span className="rd-kv-v">נווה זמר</span></div>
          <div className="rd-kv-row"><span className="rd-kv-k">גוש/חלקה</span><span className="rd-kv-v" dir="ltr">7654 / 213</span></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Accordion section (mirrors InfoTabsWidget AccordionSection)
// ─────────────────────────────────────────────────────────────────────────────
function Accordion({ icon: Ic, title, badge, defaultOpen, accent='var(--accent)', children }) {
  const [open, setOpen] = rdS(!!defaultOpen);
  return (
    <div className="rd-card rd-acc">
      <div className="rd-card-stripe" style={{background:`linear-gradient(to left, ${accent}, color-mix(in srgb, ${accent} 40%, transparent))`}}/>
      <button className="rd-acc-trigger" onClick={()=>setOpen(!open)}>
        <div className="row" style={{gap:8}}>
          <Ic width={15} height={15} style={{color:'var(--muted)'}}/>
          <span className="rd-acc-title">{title}</span>
          {badge!=null && <span className="rd-acc-badge">{badge}</span>}
        </div>
        <window.EprIcon.chevR width={14} height={14} style={{transform:open?'rotate(90deg)':'rotate(-90deg)',transition:'transform .2s',color:'var(--muted)'}}/>
      </button>
      {open && <div className="rd-acc-body">{children}</div>}
    </div>
  );
}

// ── Request info card (form fields, editable-looking) ───────────────────────
function RequestInfoCard({ row }) {
  const I = window.EprIcon;
  return (
    <div className="rd-form-grid">
      <div className="rd-fld"><label>נושא הפנייה</label><input value={row.title} readOnly/></div>
      <div className="rd-fld"><label>קטגוריה</label><input value={row.dept} readOnly/></div>
      <div className="rd-fld"><label>תת-קטגוריה</label><input value="פינוי גזם" readOnly/></div>
      <div className="rd-fld"><label>ערוץ קליטה</label><input value={row.channel} readOnly/></div>
      <div className="rd-fld"><label>עדיפות</label>
        <div className="rd-pri-select">
          {['רגיל','בינוני','דחוף'].map(p=>(
            <button key={p} className={`rd-pri-opt ${row.priority===p?'on':''} ${p}`}>
              <span className={`ep-pri-dot ${p}`}/>{p}
            </button>
          ))}
        </div>
      </div>
      <div className="rd-fld"><label>אחראי</label>
        <div className="rd-assignee">
          <div className="ep-avatar" style={{width:24,height:24,fontSize:10}}>{(row.clerk||'??').split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
          <span>{row.clerk||'—'}</span>
          <I.chevR width={11} height={11} style={{transform:'rotate(-90deg)',color:'var(--muted)',marginInlineStart:'auto'}}/>
        </div>
      </div>
      <div className="rd-fld"><label>תאריך יעד (SLA)</label><input value="25.04.26 14:00" readOnly/></div>
      <div className="rd-fld" style={{gridColumn:'1 / -1'}}>
        <label>תיאור הפנייה</label>
        <textarea readOnly rows={3} value={`פנייה מ-${row.channel} בנושא ${row.title.split(' — ')[0]}. הפונה מבקש טיפול דחוף בנושא ומציין שזה החריג השלישי החודש. צורפו תמונות ומסמכים לאימות.`}/>
      </div>
      <div className="rd-fld" style={{gridColumn:'1 / -1'}}>
        <label>תגיות</label>
        <div className="row" style={{flexWrap:'wrap',gap:6}}>
          {['חוזר','דורש בדיקת שטח','עדיפות גבוהה','עירוני','התקשרות בוצעה'].map(t=>(
            <span key={t} className="rd-tag-chip">{t} <I.close width={9} height={9}/></span>
          ))}
          <button className="rd-tag-add"><I.plus width={10} height={10}/>הוסף תגית</button>
        </div>
      </div>
    </div>
  );
}

// ── Email thread (light) ────────────────────────────────────────────────────
function EmailThread({ row }) {
  const I = window.EprIcon;
  const items = [
    { dir:'in',  who:row.resident, when:'21.04 09:14', subj:'בקשה לפינוי גזם דחוף', body:'שלום, פיניתי גינה ביום שישי ויש כעת ערימת גזם גדולה. אנא פינוי דחוף.' },
    { dir:'out', who:'מערכת',     when:'21.04 09:15', subj:'אישור קליטה אוטומטי', body:'הפנייה התקבלה ומספרה ' + row.id + '. נציג יחזור אליך בתוך 24 שעות.' },
    { dir:'out', who:row.clerk||'נציג',   when:'21.04 11:42', subj:'עדכון: צוות בדרך', body:'שלום, צוות הפינוי בדרך אליך, אומדן הגעה היום בין 14:00–16:00.' },
  ];
  return (
    <div className="rd-thread">
      {items.map((m,i)=>{
        const DirIc = m.dir==='in' ? I.mail : I.send;
        return (
        <div key={i} className={`rd-msg ${m.dir}`}>
          <div className="rd-msg-head">
            <span className={`rd-msg-dir ${m.dir}`}><DirIc width={10} height={10}/>{m.dir==='in'?'נכנס':'יוצא'}</span>
            <b>{m.who}</b>
            <span className="ep-muted" style={{fontSize:11,marginInlineStart:'auto'}}>{m.when}</span>
          </div>
          <div className="rd-msg-subj">{m.subj}</div>
          <div className="rd-msg-body">{m.body}</div>
        </div>
        );
      })}
      <button className="rd-thread-reply">
        <I.send width={12} height={12}/>השב לפונה
      </button>
    </div>
  );
}

// ── Files grid ──────────────────────────────────────────────────────────────
function FilesGrid({ files }) {
  const I = window.EprIcon;
  return (
    <div className="rd-files-grid">
      {files.map((f,i)=>(
        <div key={i} className="rd-file">
          <div className="rd-file-thumb">
            {f.kind==='image' ? (
              <svg viewBox="0 0 80 60" width="100%" height="100%"><rect width="80" height="60" fill="#E6F2FF"/><circle cx="22" cy="22" r="6" fill="#F2B134"/><path d="M0 50 L 25 30 L 45 45 L 60 25 L 80 40 L 80 60 L 0 60 Z" fill="#9AC4D2"/></svg>
            ) : (
              <I.doc width={28} height={28} style={{color:'var(--muted)'}}/>
            )}
          </div>
          <div className="rd-file-info">
            <div className="rd-file-name">{f.name}</div>
            <div className="ep-muted" style={{fontSize:10}}>{f.size} · {f.uploader} · {f.when}</div>
          </div>
          <div className="rd-file-actions">
            <button className="ep-icon-btn" style={{width:24,height:24}}><I.eye width={11} height={11}/></button>
            <button className="ep-icon-btn" style={{width:24,height:24}}><I.download width={11} height={11}/></button>
          </div>
        </div>
      ))}
      <button className="rd-file-upload">
        <I.plus width={14} height={14}/>גרור קבצים או לחץ להעלאה
      </button>
    </div>
  );
}

// ── Document checklist ──────────────────────────────────────────────────────
function DocChecklist() {
  const I = window.EprIcon;
  const items = [
    { name:'תעודת זהות',           required:true,  status:'received' },
    { name:'אישור תשלום ארנונה',    required:true,  status:'received' },
    { name:'תצהיר חתום',            required:true,  status:'pending' },
    { name:'תכנית הנדסית',          required:false, status:'received' },
    { name:'אישור שכנים',           required:false, status:'missing' },
  ];
  const STATUS = {
    received: { lbl:'התקבל', tx:'#1F6D40', bg:'#E5F5EC', ic:I.check },
    pending:  { lbl:'ממתין', tx:'#8A5F17', bg:'#FFF4E0', ic:I.clock },
    missing:  { lbl:'חסר',   tx:'#9B2A2A', bg:'#FCE6E6', ic:I.close },
  };
  return (
    <div className="rd-checklist">
      {items.map(it=>{
        const s = STATUS[it.status];
        return (
          <div key={it.name} className="rd-check-row">
            <div className="row" style={{gap:8}}>
              <s.ic width={12} height={12} style={{color:s.tx}}/>
              <span style={{fontWeight:500,fontSize:13}}>{it.name}</span>
              {it.required && <span className="rd-req">חובה</span>}
            </div>
            <span className="rd-check-pill" style={{background:s.bg,color:s.tx}}>{s.lbl}</span>
          </div>
        );
      })}
      <button className="rd-thread-reply" style={{justifyContent:'center',marginTop:6}}>
        <I.send width={12} height={12}/>בקש מסמך מהפונה
      </button>
    </div>
  );
}

// ── Approval history ────────────────────────────────────────────────────────
function ApprovalHistory({ row }) {
  const list = buildApprovals(row);
  return (
    <div className="rd-approvals">
      {list.map((a,i)=>{
        const d = DECISION[a.decision];
        return (
          <div key={i} className="rd-approval-row">
            <span className="rd-app-dot" style={{background:d.dot}}/>
            <div style={{flex:1,minWidth:0}}>
              <div className="row" style={{gap:8,alignItems:'baseline'}}>
                <b style={{fontSize:13}}>{a.stage}</b>
                <span className="rd-app-pill" style={{background:d.bg,color:d.tx}}>{d.lbl}</span>
                {a.comment && <span className="ep-muted" style={{fontSize:11}}>· {a.comment}</span>}
              </div>
              <div className="ep-muted" style={{fontSize:11,marginTop:2}}>
                {a.approver} · {a.when || 'ממתין'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity timeline w/ filters ────────────────────────────────────────────
function ActivityFeed({ row }) {
  const all = rdM(()=>buildActivity(row),[row.id]);
  const [filter, setFilter] = rdS('all');
  const counts = rdM(()=>{ const c={}; all.forEach(i=>{ c[i.type]=(c[i.type]||0)+1; }); return c; }, [all]);
  const filtered = filter==='all' ? all : all.filter(i=>i.type===filter);

  return (
    <div className="rd-activity">
      <div className="rd-act-filters">
        {ACT_DEFS.map(d=>{
          const n = d.v==='all' ? all.length : (counts[d.v]||0);
          if (d.v!=='all' && n===0) return null;
          const active = filter===d.v;
          return (
            <button key={d.v} className={`rd-chip ${active?'on':''}`} onClick={()=>setFilter(d.v)}>
              <span className="rd-chip-dot" style={{background:d.color}}/>{d.label}
              <span className="rd-chip-count">{n}</span>
            </button>
          );
        })}
      </div>
      <div className="rd-act-list">
        {filtered.map(it=>{
          const def = ACT_DEFS.find(d=>d.v===it.type) || ACT_DEFS[0];
          return (
            <div key={it.id} className="rd-act-item">
              <span className="rd-act-dot" style={{background:def.color}}/>
              <div className="rd-act-body">
                <div className="rd-act-line">
                  <span>{it.text}</span>
                  {it.from && it.to && (
                    <span className="rd-act-transition">
                      <span className="rd-act-from">{it.from}</span>
                      <window.EprIcon.chevR width={9} height={9} style={{color:'var(--muted)'}}/>
                      <span className="rd-act-to">{it.to}</span>
                    </span>
                  )}
                </div>
                <div className="ep-muted" style={{fontSize:11}}>{it.user} · {it.when}</div>
                {it.details && <div className="ep-muted" style={{fontSize:11,marginTop:2}}>{it.details}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exceptions panel (right-side, sticky)
// ─────────────────────────────────────────────────────────────────────────────
function ExceptionsPanel({ row, isFrozen, onFreeze, onConsult, onWaitDocs, onSnooze, onMerge, canAct }) {
  const I = window.EprIcon;
  if (['חדש','מאושר','נדחה'].includes(row.status)) return null;
  return (
    <div className="rd-exc">
      <div className="rd-exc-stripe"/>
      <div className="rd-exc-body">
        <div className="rd-exc-head"><I.alert width={13} height={13}/><span>פעולות חריגות</span></div>
        <p className="rd-exc-desc">פעולות אלו משנות את סטטוס הפנייה ומשהות את ה-SLA, אך <b>אינן מקדמות</b> את שלב האישור.</p>
        <div className="rd-exc-list">
          <button className="rd-exc-btn freeze" disabled={!canAct} onClick={onFreeze}>
            <I.snowflake width={14} height={14}/>{isFrozen?'שחרר מהקפאה':'הקפא פנייה'}
          </button>
          <button className="rd-exc-btn consult" disabled={!canAct} onClick={onConsult}>
            <I.userPlus width={14} height={14}/>העבר לגורם בכיר
          </button>
          <button className="rd-exc-btn wait" disabled={!canAct} onClick={onWaitDocs}>
            <I.clock width={14} height={14}/>המתן להשלמת מסמכים
          </button>
          <button className="rd-exc-btn snooze" disabled={!canAct} onClick={onSnooze}>
            <I.calendar width={14} height={14}/>השהיה עד תאריך
          </button>
          <button className="rd-exc-btn merge" disabled={!canAct} onClick={onMerge}>
            <I.merge width={14} height={14}/>מיזוג עם פנייה
          </button>
        </div>
        {!canAct && <p className="rd-exc-no-perm">אין לך הרשאה לבצע פעולות בשלב זה</p>}
      </div>
    </div>
  );
}

// ── Notification templates (sidebar) ────────────────────────────────────────
function NotificationTemplates({ row }) {
  const I = window.EprIcon;
  const tpls = [
    { id:1, name:'אישור קליטה',  channel:'SMS',      desc:'הפנייה התקבלה',     used:true },
    { id:2, name:'בקשת מסמכים',   channel:'Email',    desc:'נדרש להשלים מסמכים', used:false },
    { id:3, name:'עדכון התקדמות', channel:'WhatsApp', desc:'התקדמות בטיפול',     used:false },
    { id:4, name:'הודעת סיום',    channel:'SMS+Email',desc:'הפנייה הושלמה',      used:false },
  ];
  return (
    <div className="rd-card">
      <div className="rd-card-stripe" style={{background:'linear-gradient(to left, #2AA7B8, color-mix(in srgb, #2AA7B8 40%, transparent))'}}/>
      <div className="rd-card-body">
        <div className="rd-card-head-row"><I.send width={13} height={13}/><span className="rd-card-eb">תבניות התראה</span></div>
        <div className="rd-tpl-list">
          {tpls.map(t=>(
            <button key={t.id} className={`rd-tpl ${t.used?'used':''}`}>
              <div style={{flex:1,minWidth:0,textAlign:'start'}}>
                <div style={{fontSize:12,fontWeight:600}}>{t.name}</div>
                <div className="ep-muted" style={{fontSize:10}}>{t.desc}</div>
              </div>
              <span className="rd-tpl-channel">{t.channel}</span>
              <I.send width={11} height={11} style={{color:'var(--accent)'}}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat drawer (slides from RIGHT in RTL = end side)
// ─────────────────────────────────────────────────────────────────────────────
function ChatDrawer({ open, onClose, notes, onAdd }) {
  const I = window.EprIcon;
  const [msg, setMsg] = rdS('');
  const ref = rdR(null);
  rdE(()=>{ if(open && ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [open, notes.length]);

  const send = () => {
    if (!msg.trim()) return;
    onAdd(msg.trim());
    setMsg('');
  };

  return (
    <>
      {open && <div className="rd-chat-bg" onClick={onClose}/>}
      <aside className={`rd-chat ${open?'open':''}`} dir="rtl">
        <div className="rd-chat-head">
          <div>
            <div className="row" style={{gap:8}}>
              <div className="rd-chat-ic"><I.msg width={14} height={14}/></div>
              <h3 style={{margin:0,fontSize:14,fontWeight:700}}>צ׳אט פנימי</h3>
            </div>
            <div className="rd-chat-locked">
              <I.lock width={10} height={10}/>הודעות פנימיות — לא נראות לפונה
            </div>
          </div>
          <button className="ep-icon-btn" style={{width:30,height:30}} onClick={onClose}><I.close width={13} height={13}/></button>
        </div>
        <div className="rd-chat-body" ref={ref}>
          {notes.length===0 ? (
            <div className="rd-chat-empty">
              <div className="rd-chat-empty-ic"><I.msg width={22} height={22}/></div>
              <p>היה הראשון לכתוב הודעה...</p>
            </div>
          ) : notes.map((n,i)=>(
            <div key={i} className={`rd-chat-msg ${n.me?'me':''}`}>
              <div className="ep-avatar" style={{width:28,height:28,fontSize:10,flexShrink:0}}>{n.av}</div>
              <div className="rd-chat-bub">
                <div className="rd-chat-name">{n.who}</div>
                <p style={{margin:0,fontSize:13,lineHeight:1.5}}>{n.text}</p>
                <div className="rd-chat-time">{n.when}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="rd-chat-input">
          <textarea
            rows={1}
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } }}
            placeholder="כתוב הודעה פנימית..."
          />
          <button className="rd-chat-send" disabled={!msg.trim()} onClick={send}>
            <I.send width={14} height={14}/>
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function RequestDetailPageV3({ row, goPage, goBack }) {
  if (!row) return <div className="ep-card"><p>לא נבחרה פנייה. <a href="#" onClick={e=>{e.preventDefault();goBack();}}>חזרה</a></p></div>;

  const [chatOpen, setChatOpen] = rdS(false);
  const [notes, setNotes] = rdS([
    { who:'אריאל כהן', av:'אכ', when:'10:42', text:'נשלח טכנאי שטח, אומדן הגעה 14:30. עדכנתי את הפונה.', me:false },
    { who:'נועה לביא', av:'נל', when:'10:35', text:'הועברה למחלקה הרלוונטית, סומן בעדיפות גבוהה.', me:false },
    { who:'מיכל עמרן', av:'מע', when:'10:48', text:'מאשרת. נראה תקין.', me:true },
  ]);
  const [adminOverride, setAdminOverride] = rdS(false);
  const [isFrozen, setIsFrozen] = rdS(row.status==='מוקפא');
  const [dialog, setDialog] = rdS(null); // 'approve'|'reject'|'return'|'cancel'|null
  const [toast, setToast] = rdS('');
  rdE(()=>{ if(toast){ const t=setTimeout(()=>setToast(''),2200); return ()=>clearTimeout(t); } },[toast]);

  // permission simulation: priority "דחוף" → admin only; else current user OK
  const isAssignedApprover = !(row.priority === 'דחוף' && currentStepIdx(row) >= 2);
  const isAdmin = true;
  const canAct = isAssignedApprover || (isAdmin && adminOverride);
  const idx = currentStepIdx(row);
  const activeApprover = WF_STAGES[idx]?.approver;

  const addNote = (text) => {
    setNotes(n => [...n, { who:'מיכל עמרן', av:'מע', when:new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}), text, me:true }]);
  };

  const onConfirmAction = (kind) => (note) => {
    const labels = { approve:'השלב אושר בהצלחה', reject:'הפנייה נדחתה ונסגרה', return:'הפנייה הוחזרה לשלב הקודם', cancel:'הפנייה בוטלה' };
    setToast(labels[kind] || 'בוצע');
  };

  // Files mock
  const files = [
    { name:'IMG_2391.jpg',  size:'2.4 MB', kind:'image', uploader:row.resident, when:'21.04 09:14' },
    { name:'report.pdf',    size:'118 KB', kind:'pdf',   uploader:row.clerk||'נציג', when:'21.04 11:42' },
    { name:'signature.png', size:'94 KB',  kind:'image', uploader:row.resident, when:'21.04 12:08' },
  ];

  return (
    <div className="rd-page" dir="rtl">
      <RDTopBar
        row={row} goPage={goPage} goBack={goBack}
        chatOpen={chatOpen} onToggleChat={()=>setChatOpen(o=>!o)} noteCount={notes.length}
        canAct={canAct} isAdmin={isAdmin} onAdminOverride={()=>setAdminOverride(true)}
        activeApprover={!isAssignedApprover ? activeApprover : null}
        onAssign={()=>setToast('פתח דיאלוג העברה למטפל')}
      />

      <div className={`rd-content ${chatOpen?'chat-open':''}`}>
        {/* Sticky Stepper */}
        <div className="rd-stepper-wrap">
          <StepperVisual row={row} isFrozen={isFrozen}/>
          <StepperActions
            row={row} canAct={canAct} isFrozen={isFrozen}
            onApprove={()=>setDialog('approve')}
            onReject={()=>setDialog('reject')}
            onReturn={()=>setDialog('return')}
            onCancel={()=>setDialog('cancel')}
            onStart={()=>setToast('הפנייה הועברה לטיפול')}
          />
        </div>

        {/* Body grid */}
        <div className="rd-body-grid">
          {/* Right column: applicant + property */}
          <div className="rd-col-right">
            <ApplicantPanel row={row}/>
            <PropertyPanel row={row}/>
          </div>

          {/* Center column: accordions */}
          <div className="rd-col-center">
            <Accordion icon={window.EprIcon.settings} title="פרטי פנייה" defaultOpen accent="#3BB76E">
              <RequestInfoCard row={row}/>
            </Accordion>
            <Accordion icon={window.EprIcon.mail} title="יצירת קשר" badge="3" accent="#2E6BE6">
              <EmailThread row={row}/>
            </Accordion>
            <Accordion icon={window.EprIcon.paperclip} title="קבצים" badge={files.length} defaultOpen accent="#7B5BD6">
              <FilesGrid files={files}/>
            </Accordion>
            <Accordion icon={window.EprIcon.shield} title="רשימת מסמכים נדרשים" badge="3/5" accent="#E8843D">
              <DocChecklist/>
            </Accordion>
            <Accordion icon={window.EprIcon.shieldCheck} title="היסטוריית אישורים" badge={buildApprovals(row).length} accent="#2AA7B8">
              <ApprovalHistory row={row}/>
            </Accordion>
            <Accordion icon={window.EprIcon.history} title="לוג פעילויות" accent="#F2B134">
              <ActivityFeed row={row}/>
            </Accordion>
          </div>

          {/* Left column: exceptions + notification templates */}
          <div className="rd-col-left">
            <ExceptionsPanel
              row={row} isFrozen={isFrozen} canAct={canAct}
              onFreeze={()=>{ setIsFrozen(f=>!f); setToast(isFrozen?'הקפאה שוחררה':'הפנייה הוקפאה'); }}
              onConsult={()=>setToast('פתח דיאלוג התייעצות')}
              onWaitDocs={()=>setToast('הפנייה ממתינה למסמכים')}
              onSnooze={()=>setToast('פתח בורר תאריך השהיה')}
              onMerge={()=>setToast('פתח דיאלוג מיזוג')}
            />
            <NotificationTemplates row={row}/>
          </div>
        </div>
      </div>

      <ChatDrawer open={chatOpen} onClose={()=>setChatOpen(false)} notes={notes} onAdd={addNote}/>

      <ActionDialog open={dialog==='approve'} onClose={()=>setDialog(null)} kind="approve" onConfirm={onConfirmAction('approve')}/>
      <ActionDialog open={dialog==='reject'}  onClose={()=>setDialog(null)} kind="reject"  onConfirm={onConfirmAction('reject')}/>
      <ActionDialog open={dialog==='return'}  onClose={()=>setDialog(null)} kind="return"  onConfirm={onConfirmAction('return')}/>

      {toast && <div className="rd-toast">{toast}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Request modal — global, opened via window event "open-new-request"
// ─────────────────────────────────────────────────────────────────────────────
function NewRequestModal() {
  const I = window.EprIcon;
  const d = window.eprData;
  const [open, setOpen] = rdS(false);
  const [step, setStep] = rdS(1);
  const [form, setForm] = rdS({ resident:'', phone:'', dept:'', subject:'', desc:'', priority:'רגיל', channel:'מוקד 106', sla:'25.04.26' });
  const [toast, setToast] = rdS('');

  rdE(()=>{
    const onOpen = () => { setOpen(true); setStep(1); setForm({ resident:'', phone:'', dept:'', subject:'', desc:'', priority:'רגיל', channel:'מוקד 106', sla:'25.04.26' }); };
    window.addEventListener('open-new-request', onOpen);
    return () => window.removeEventListener('open-new-request', onOpen);
  }, []);
  rdE(()=>{ if(toast){ const t=setTimeout(()=>setToast(''),2200); return ()=>clearTimeout(t); } },[toast]);

  if (!open) return toast ? <div className="rd-toast">{toast}</div> : null;

  const close = () => setOpen(false);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const canStep1 = form.resident.trim() && form.phone.trim();
  const canStep2 = form.dept && form.subject.trim();
  const submit = () => {
    setOpen(false);
    setToast(`נוצרה פנייה חדשה: ${form.subject} (${form.dept})`);
  };

  return (
    <>
      <div className="rd-modal-bg" onClick={close}>
        <div className="rd-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()} dir="rtl">
          <div className="rd-modal-head">
            <h3><I.plus width={16} height={16} style={{verticalAlign:'-3px',marginInlineEnd:6}}/>פנייה חדשה</h3>
            <button className="ep-icon-btn" style={{width:28,height:28}} onClick={close}><I.close width={14} height={14}/></button>
          </div>

          {/* Stepper */}
          <div className="rd-nr-steps">
            {['פרטי פונה','פרטי פנייה','סיכום ושליחה'].map((lbl,i)=>(
              <React.Fragment key={i}>
                <div className={`rd-nr-step ${step>i?'done':''} ${step===i+1?'active':''}`}>
                  <div className="rd-nr-num">{step>i+1 ? <I.check width={11} height={11}/> : i+1}</div>
                  <span>{lbl}</span>
                </div>
                {i<2 && <div className={`rd-nr-bar ${step>i+1?'done':''}`}/>}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 — applicant */}
          {step===1 && (
            <div className="rd-form-grid" style={{marginTop:14}}>
              <div className="rd-fld" style={{gridColumn:'1 / -1'}}>
                <label>שם הפונה *</label>
                <input value={form.resident} onChange={e=>set('resident',e.target.value)} placeholder="שם מלא" autoFocus/>
              </div>
              <div className="rd-fld">
                <label>טלפון *</label>
                <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="050-1234567" dir="ltr"/>
              </div>
              <div className="rd-fld">
                <label>ערוץ קליטה</label>
                <select className="rd-fld-select" value={form.channel} onChange={e=>set('channel',e.target.value)}>
                  <option>מוקד 106</option><option>אפליקציה</option><option>אתר</option><option>טלפון</option><option>WhatsApp</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2 — request */}
          {step===2 && (
            <div className="rd-form-grid" style={{marginTop:14}}>
              <div className="rd-fld">
                <label>מחלקה *</label>
                <select className="rd-fld-select" value={form.dept} onChange={e=>set('dept',e.target.value)}>
                  <option value="">בחר מחלקה…</option>
                  {d.departments.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}
                </select>
              </div>
              <div className="rd-fld">
                <label>עדיפות</label>
                <div className="rd-pri-select">
                  {['רגיל','בינוני','דחוף'].map(p=>(
                    <button key={p} type="button" className={`rd-pri-opt ${form.priority===p?'on':''} ${p}`} onClick={()=>set('priority',p)}>
                      <span className={`ep-pri-dot ${p}`}/>{p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rd-fld" style={{gridColumn:'1 / -1'}}>
                <label>נושא *</label>
                <input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="לדוגמה: פינוי גזם — ההדרים 12"/>
              </div>
              <div className="rd-fld" style={{gridColumn:'1 / -1'}}>
                <label>תיאור</label>
                <textarea rows={3} value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="תיאור מפורט של הפנייה…"/>
              </div>
            </div>
          )}

          {/* Step 3 — summary */}
          {step===3 && (
            <div className="rd-nr-summary">
              <div className="rd-kv-list" style={{borderTop:0,paddingTop:0}}>
                <div className="rd-kv-row"><span className="rd-kv-k">פונה</span><span className="rd-kv-v">{form.resident}</span></div>
                <div className="rd-kv-row"><span className="rd-kv-k">טלפון</span><span className="rd-kv-v" dir="ltr">{form.phone}</span></div>
                <div className="rd-kv-row"><span className="rd-kv-k">ערוץ</span><span className="rd-kv-v">{form.channel}</span></div>
                <div className="rd-kv-row"><span className="rd-kv-k">מחלקה</span><span className="rd-kv-v">{form.dept}</span></div>
                <div className="rd-kv-row"><span className="rd-kv-k">עדיפות</span><span className="rd-kv-v"><span className={`ep-pri-dot ${form.priority}`} style={{display:'inline-block',marginInlineEnd:5}}/>{form.priority}</span></div>
                <div className="rd-kv-row"><span className="rd-kv-k">נושא</span><span className="rd-kv-v">{form.subject}</span></div>
                {form.desc && <div className="rd-kv-row"><span className="rd-kv-k">תיאור</span><span className="rd-kv-v" style={{textAlign:'start',whiteSpace:'pre-wrap'}}>{form.desc}</span></div>}
              </div>
              <div className="rd-nr-confirm-note">
                <I.check width={12} height={12}/>הפנייה תיווצר ותוקצה אוטומטית למחלקת <b>{form.dept}</b>. הפונה יקבל הודעת קליטה ב-SMS.
              </div>
            </div>
          )}

          <div className="row" style={{justifyContent:'space-between',marginTop:18,gap:8}}>
            <button className="ep-btn ep-btn-ghost" onClick={close}>ביטול</button>
            <div className="row" style={{gap:8}}>
              {step>1 && <button className="ep-btn ep-btn-ghost" onClick={()=>setStep(s=>s-1)}>חזור ›</button>}
              {step<3 && (
                <button className="ep-btn ep-btn-primary" disabled={(step===1&&!canStep1)||(step===2&&!canStep2)} onClick={()=>setStep(s=>s+1)}>
                  המשך ‹
                </button>
              )}
              {step===3 && (
                <button className="ep-btn ep-btn-primary" onClick={submit}>
                  <I.send width={12} height={12}/>צור פנייה
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="rd-toast">{toast}</div>}
    </>
  );
}

Object.assign(window, { RequestDetailPageV3, NewRequestModal });
