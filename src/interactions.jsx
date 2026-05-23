// epr/v3-interactions.jsx — global toast + universal button feedback + new-request modal.
// Mounts under <ToastHost/> in app.jsx. Exposes window.eprToast(text, kind?).

const { useState: tsS, useEffect: tsE, useRef: tsR } = React;

/* ───────────────────────── Toast host ───────────────────────── */
function ToastHost() {
  const [items, setItems] = tsS([]);
  tsE(()=>{
    let id = 0;
    window.eprToast = (text, kind='info') => {
      const k = ++id;
      setItems(s => [...s, { id:k, text, kind }]);
      setTimeout(()=> setItems(s => s.filter(t=>t.id!==k)), 3200);
    };
    return () => { delete window.eprToast; };
  },[]);
  return (
    <div className="ep-toasts" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className={`ep-toast ${t.kind}`} role="status">
          <span className="ep-toast-dot"/>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Universal button feedback handler ─────────────── *
 * Captures clicks on buttons / nav-links that don't already navigate
 * or have a local onClick that shows feedback. Reads the button text
 * and shows a context-aware toast.
 * ───────────────────────────────────────────────────────────────── */
function ButtonFeedback() {
  tsE(()=>{
    function getText(el){
      const txt = (el.textContent||'').replace(/\s+/g,' ').trim();
      // strip arrows / chevrons / decorative chars
      return txt.replace(/^[‹›←→•+\-]+\s*/,'').replace(/\s*[‹›←→•]+$/,'').trim();
    }
    function inferKind(text){
      if(/מחק|הסר|בטל|ביטול|דחה/.test(text)) return 'danger';
      if(/שמור|אשר|שלח|ש[ל]ח|נשלח|העבר|הצמד|הקפא/.test(text)) return 'success';
      return 'info';
    }
    function inferMessage(text, el){
      if(!text) {
        // icon-only button — try aria-label or title
        text = el.getAttribute('aria-label') || el.getAttribute('title') || 'פעולה';
      }
      // Common patterns
      if(/^שמור/.test(text))   return 'השינויים נשמרו';
      if(/^אשר$/.test(text))   return 'אושר בהצלחה';
      if(/^דחה$/.test(text))   return 'הבקשה נדחתה';
      if(/^מחק|הסר/.test(text))return 'הפריט נמחק';
      if(/^ערוך$/.test(text))  return 'נפתח עורך הפריט';
      if(/^העבר/.test(text))   return 'הועבר לתור הבא';
      if(/^הוסף|^[+]/.test(text))return 'נוסף בהצלחה';
      if(/^שלח/.test(text))    return 'נשלח לפונה';
      if(/^הפעל/.test(text))   return 'הופעל';
      if(/^הורד/.test(text))   return 'ההורדה החלה';
      if(/^העתק/.test(text))   return 'הועתק ללוח';
      if(/^ייצוא|ייצא/.test(text)) return 'הייצוא הוכן';
      if(/^חיבור|הגדרות$/.test(text)) return text + ' נפתח';
      if(/^צוותים$/.test(text))   return 'רשימת הצוותים';
      if(/^קונפיגורציה/.test(text)) return 'נפתח חלון קונפיגורציה';
      if(/^הוראות/.test(text))    return 'נפתחות ההוראות המפורטות';
      if(/^שיוך|^שיחה|פרופיל/.test(text)) return text;
      return text;
    }
    function shouldHandle(el){
      // skip submit buttons, things with explicit data-toast="off"
      if(el.getAttribute('data-toast')==='off') return false;
      if(el.disabled) return false;
      // skip if already had a navigation effect (we run after onClick)
      // — we'll always fire; only skip toast for nav classes.
      const cls = el.className || '';
      // sidebar nav, top tabs, sub-tabs handle their own routing → no toast
      if(/ep-nav-link|ep-tabs|ep-pill|ep-side-tabs|ep-stat|ep-kpi|ep-dot/.test(cls)) return false;
      return true;
    }
    function onClick(e){
      const btn = e.target.closest('button.ep-btn, button.ep-icon-btn, button.rd-btn, button.rd-tab, button.rd-attach-tab');
      if(!btn) return;
      if(!shouldHandle(btn)) return;
      const txt  = getText(btn);
      const msg  = inferMessage(txt, btn);
      const kind = inferKind(txt);
      // Defer so any local onClick that navigates still wins visually
      setTimeout(()=> window.eprToast && window.eprToast(msg, kind), 0);
    }
    document.addEventListener('click', onClick, true);
    return ()=> document.removeEventListener('click', onClick, true);
  },[]);
  return null;
}

/* ───────────────────────── New request modal ───────────────────────── */
function NewRequestModal() {
  const [open, setOpen] = tsS(false);
  const [step, setStep] = tsS(1);
  const [form, setForm] = tsS({ resident:'', phone:'', dept:'תשתיות', cat:'', priority:'רגיל', desc:'' });
  const [chan, setChan] = tsS('phone');
  const I = window.EprIcon;
  tsE(()=>{
    const h = ()=> { setOpen(true); setStep(1); };
    window.addEventListener('open-new-request', h);
    return ()=> window.removeEventListener('open-new-request', h);
  },[]);
  if(!open) return null;
  const close = ()=> setOpen(false);
  const next  = ()=> setStep(s=>Math.min(3, s+1));
  const prev  = ()=> setStep(s=>Math.max(1, s-1));
  const submit = ()=>{
    setOpen(false);
    setForm({ resident:'', phone:'', dept:'תשתיות', cat:'', priority:'רגיל', desc:'' });
    setStep(1);
    window.eprToast && window.eprToast('פנייה חדשה נוצרה — שובץ מספר REQ-9145', 'success');
  };
  const set = (k,v)=> setForm(f=>({...f, [k]:v}));
  const canStep1 = form.resident.trim().length>1 && form.phone.trim().length>=9;
  const canStep2 = form.cat.trim().length>0 && form.desc.trim().length>3;
  return (
    <div className="ep-modal-overlay" onMouseDown={close}>
      <div className="ep-modal" onMouseDown={e=>e.stopPropagation()} role="dialog">
        <header className="ep-modal-head">
          <div>
            <div className="ep-card-eb">פנייה חדשה</div>
            <h3>{step===1?'פרטי פונה':step===2?'תוכן הפנייה':'סקירה ושליחה'}</h3>
          </div>
          <button className="ep-icon-btn" onClick={close} data-toast="off" aria-label="סגור">
            <I.close/>
          </button>
        </header>

        <div className="ep-modal-stepper">
          {[1,2,3].map(n=>(
            <div key={n} className={`ep-modal-step ${step>=n?'on':''} ${step===n?'now':''}`}>
              <span className="ep-modal-step-n">{n}</span>
              <span>{n===1?'פונה':n===2?'תוכן':'סקירה'}</span>
            </div>
          ))}
        </div>

        <div className="ep-modal-body">
          {step===1 && (<>
            <div className="ep-detail-grid">
              <div className="ep-field"><label>שם מלא ‹</label><input value={form.resident} onChange={e=>set('resident',e.target.value)} placeholder="שם פרטי + שם משפחה"/></div>
              <div className="ep-field"><label>טלפון ‹</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="050-1234567"/></div>
              <div className="ep-field"><label>ת״ז</label><input placeholder="9 ספרות"/></div>
              <div className="ep-field"><label>אימייל</label><input type="email" placeholder="name@example.com"/></div>
              <div className="ep-field full"><label>כתובת המקרה</label><input placeholder="רחוב, מספר, שכונה"/></div>
            </div>
            <div className="ep-pill-row">
              <span className="ep-muted" style={{fontSize:12}}>ערוץ פנייה:</span>
              {[['phone','טלפון'],['mail','דוא״ל'],['walkin','התייצבות'],['app','אפליקציה'],['form','אתר']].map(([v,t])=>(
                <button key={v} className={`ep-pill ${chan===v?'on':''}`} onClick={()=>setChan(v)} data-toast="off">{t}</button>
              ))}
            </div>
          </>)}

          {step===2 && (<>
            <div className="ep-detail-grid">
              <div className="ep-field"><label>מחלקה ‹</label>
                <select value={form.dept} onChange={e=>set('dept',e.target.value)}>
                  {['תשתיות','גינון','איכות סביבה','הנדסה','תברואה','רישוי עסקים','גביה','שירות לתושב'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="ep-field"><label>קטגוריה ‹</label>
                <input value={form.cat} onChange={e=>set('cat',e.target.value)} placeholder="למשל: בור בכביש"/>
              </div>
              <div className="ep-field full"><label>תיאור ‹</label>
                <textarea rows={4} value={form.desc} onChange={e=>set('desc',e.target.value)} placeholder="תאר את הפנייה כפי שהבנת מהפונה…"/>
              </div>
            </div>
            <div className="ep-pill-row">
              <span className="ep-muted" style={{fontSize:12}}>עדיפות:</span>
              {['רגיל','גבוה','דחוף'].map(p=>(
                <button key={p} className={`ep-pill ${form.priority===p?'on':''}`} onClick={()=>set('priority',p)} data-toast="off">{p}</button>
              ))}
            </div>
            <div className="ep-attach-drop">
              <I.paperclip width={18} height={18}/>
              <span>גרור קבצים לכאן או <a href="#" onClick={e=>e.preventDefault()}>בחר מהמחשב</a></span>
            </div>
          </>)}

          {step===3 && (<>
            <div className="ep-modal-summary">
              <div className="ep-modal-summary-card">
                <h4>פונה</h4>
                <dl className="ep-kv-grid">
                  <dt>שם</dt><dd>{form.resident||<em className="ep-muted">לא הוזן</em>}</dd>
                  <dt>טלפון</dt><dd className="ep-mono">{form.phone||'—'}</dd>
                  <dt>ערוץ</dt><dd>{({phone:'טלפון',mail:'דוא״ל',walkin:'התייצבות',app:'אפליקציה',form:'אתר'})[chan]}</dd>
                </dl>
              </div>
              <div className="ep-modal-summary-card">
                <h4>פנייה</h4>
                <dl className="ep-kv-grid">
                  <dt>מחלקה</dt><dd>{form.dept}</dd>
                  <dt>קטגוריה</dt><dd>{form.cat||'—'}</dd>
                  <dt>עדיפות</dt><dd><span className={`ep-pri-dot ${form.priority==='דחוף'?'high':form.priority==='גבוה'?'mid':'low'}`}/>{form.priority}</dd>
                  <dt>תיאור</dt><dd className="ep-truncate-3">{form.desc||'—'}</dd>
                </dl>
              </div>
            </div>
            <div className="ep-callout">
              <I.alert width={16} height={16}/>
              <div>
                <b>שיוך אוטומטי:</b> בלחיצה על "צור פנייה" תשובץ למחלקת {form.dept} ותקבל מזהה REQ. הפונה יקבל SMS עם המזהה ואופציה למעקב.
              </div>
            </div>
          </>)}
        </div>

        <footer className="ep-modal-foot">
          <button className="ep-btn ep-btn-ghost" onClick={close} data-toast="off">ביטול</button>
          <div style={{display:'flex',gap:8}}>
            {step>1 && <button className="ep-btn ep-btn-ghost" onClick={prev} data-toast="off">‹ הקודם</button>}
            {step<3 && <button className="ep-btn ep-btn-primary" disabled={(step===1&&!canStep1)||(step===2&&!canStep2)} onClick={next} data-toast="off">הבא ‹</button>}
            {step===3 && <button className="ep-btn ep-btn-primary" onClick={submit} data-toast="off">צור פנייה ←</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────── FormBuilder modal ─────────────────── */
function FormBuilderModal() {
  const [open, setOpen] = tsS(false);
  const [step, setStep] = tsS(1);
  const [form, setForm] = tsS({ name:'', category:'תשתיות', sla:24, active:true, public:true });
  const [fields, setFields] = tsS([
    { id:1, label:'כתובת המקרה', type:'text', required:true },
    { id:2, label:'תיאור', type:'textarea', required:true },
    { id:3, label:'תמונה', type:'file', required:false },
  ]);
  const [api, setApi] = tsS({ enabled:false, method:'POST', url:'https://api.example.com/forms/submit', auth:'bearer', token:'', secret:'' });
  const [testStatus, setTestStatus] = tsS(null);
  const I = window.EprIcon;
  tsE(()=>{
    const h = ()=>{ setOpen(true); setStep(1); };
    window.addEventListener('open-form-builder', h);
    return ()=> window.removeEventListener('open-form-builder', h);
  },[]);
  if(!open) return null;
  const close = ()=> setOpen(false);
  const addField = (type)=> setFields(f=>[...f, { id:Date.now(), label:'שדה חדש', type, required:false }]);
  const removeField = (id)=> setFields(f=>f.filter(x=>x.id!==id));
  const updateField = (id, k, v)=> setFields(f=>f.map(x=>x.id===id?{...x,[k]:v}:x));
  const submit = ()=>{
    setOpen(false);
    const apiMsg = api.enabled ? ` · מקושר ל-API` : '';
    window.eprToast && window.eprToast(`טופס "${form.name||'ללא שם'}" נוצר עם ${fields.length} שדות${apiMsg}`, 'success');
    setStep(1); setForm({ name:'', category:'תשתיות', sla:24, active:true, public:true });
    setFields([{ id:1, label:'כתובת המקרה', type:'text', required:true },{ id:2, label:'תיאור', type:'textarea', required:true },{ id:3, label:'תמונה', type:'file', required:false }]);
    setApi({ enabled:false, method:'POST', url:'https://api.example.com/forms/submit', auth:'bearer', token:'', secret:'' });
    setTestStatus(null);
  };
  const typeNames = { text:'טקסט', textarea:'טקסט ארוך', number:'מספר', date:'תאריך', select:'בחירה', file:'קובץ', checkbox:'תיבת סימון' };
  const typeIcons = { text:'doc', textarea:'note', number:'pay', date:'calendar', select:'chevD', file:'paperclip', checkbox:'check' };
  return (
    <div className="ep-modal-overlay" onMouseDown={close}>
      <div className="ep-modal" onMouseDown={e=>e.stopPropagation()}>
        <header className="ep-modal-head">
          <div><div className="ep-card-eb">טופס חדש</div><h3>{step===1?'פרטי טופס':step===2?'בניית שדות':'סקירה ופרסום'}</h3></div>
          <button className="ep-icon-btn" onClick={close} data-toast="off"><I.close/></button>
        </header>
        <div className="ep-modal-stepper">
          {[1,2,3,4].map(n=>(<div key={n} className={`ep-modal-step ${step>=n?'on':''} ${step===n?'now':''}`}>
            <span className="ep-modal-step-n">{n}</span><span>{n===1?'פרטים':n===2?'שדות':n===3?'API':'סקירה'}</span>
          </div>))}
        </div>
        <div className="ep-modal-body">
          {step===1 && (<>
            <div className="ep-detail-grid">
              <div className="ep-field full"><label>שם הטופס ‹</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="לדוגמה: דיווח על בור בכביש"/></div>
              <div className="ep-field"><label>מחלקה</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {['תשתיות','גינון','איכות סביבה','הנדסה','תברואה','חינוך','כללי'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="ep-field"><label>SLA (שעות)</label><input type="number" value={form.sla} onChange={e=>setForm({...form,sla:+e.target.value})}/></div>
              <div className="ep-field full">
                <label>תיאור הטופס (לתושב)</label>
                <textarea rows={2} placeholder="טקסט הסבר שיוצג בראש הטופס…"/>
              </div>
            </div>
            <div className="ep-pill-row">
              <label className="ep-pill" style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>
                <span>טופס פעיל</span>
              </label>
              <label className="ep-pill" style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={form.public} onChange={e=>setForm({...form,public:e.target.checked})}/>
                <span>זמין לציבור</span>
              </label>
            </div>
          </>)}
          {step===2 && (<>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {fields.map((f,i)=>(
                <div key={f.id} style={{display:'flex',gap:8,alignItems:'center',padding:'8px 10px',border:'1px solid var(--border)',borderRadius:8,background:'#fafbfc'}}>
                  <span style={{fontSize:11,color:'var(--muted)',fontWeight:700,width:18}}>{i+1}</span>
                  <input value={f.label} onChange={e=>updateField(f.id,'label',e.target.value)} style={{flex:1,padding:'6px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12.5}}/>
                  <select value={f.type} onChange={e=>updateField(f.id,'type',e.target.value)} style={{padding:'6px 8px',border:'1px solid var(--border)',borderRadius:6,fontSize:12,background:'#fff'}}>
                    {Object.entries(typeNames).map(([v,n])=><option key={v} value={v}>{n}</option>)}
                  </select>
                  <label style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,color:'var(--muted)'}}>
                    <input type="checkbox" checked={f.required} onChange={e=>updateField(f.id,'required',e.target.checked)}/>חובה
                  </label>
                  <button className="ep-icon-btn" style={{width:26,height:26}} data-toast="off" onClick={()=>removeField(f.id)} aria-label="הסר"><I.close width={12} height={12}/></button>
                </div>
              ))}
            </div>
            <div className="ep-pill-row" style={{marginTop:4}}>
              <span className="ep-muted" style={{fontSize:12}}>הוסף שדה:</span>
              {Object.entries(typeNames).map(([v,n])=>(
                <button key={v} className="ep-pill" onClick={()=>addField(v)} data-toast="off">+ {n}</button>
              ))}
            </div>
          </>)}
          {step===3 && (<>
            <div className="row" style={{justifyContent:'space-between',background:'#fafbfc',padding:'12px 14px',border:'1px solid var(--border)',borderRadius:8}}>
              <div>
                <b style={{fontSize:14}}>חיבור ל-API חיצוני</b>
                <div className="ep-muted" style={{fontSize:12,marginTop:2}}>שלח את הנתונים אוטומטית למערכת צד שלישית בשליחת הטופס</div>
              </div>
              <label className="ep-pill" style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={api.enabled} onChange={e=>setApi({...api,enabled:e.target.checked})}/>
                <span>{api.enabled?'מופעל':'כבוי'}</span>
              </label>
            </div>
            {api.enabled && (<>
              <div className="ep-detail-grid">
                <div className="ep-field"><label>שיטת HTTP</label>
                  <select value={api.method} onChange={e=>setApi({...api,method:e.target.value})}>
                    <option>POST</option><option>PUT</option><option>PATCH</option>
                  </select>
                </div>
                <div className="ep-field"><label>פורמט</label>
                  <select defaultValue="json"><option value="json">JSON</option><option value="form">form-data</option><option value="xml">XML</option></select>
                </div>
                <div className="ep-field full"><label>Endpoint URL ‹</label>
                  <input value={api.url} onChange={e=>setApi({...api,url:e.target.value})} dir="ltr" placeholder="https://your-system.com/api/intake"/>
                </div>
                <div className="ep-field"><label>אימות</label>
                  <select value={api.auth} onChange={e=>setApi({...api,auth:e.target.value})}>
                    <option value="none">ללא</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apikey">API Key (Header)</option>
                    <option value="oauth">OAuth 2.0</option>
                  </select>
                </div>
                <div className="ep-field"><label>{api.auth==='basic'?'שם משתמש':api.auth==='oauth'?'Client ID':'Token / Key'}</label>
                  <input value={api.token} onChange={e=>setApi({...api,token:e.target.value})} dir="ltr" placeholder="הזן זיהוי..." type="password"/>
                </div>
                {(api.auth==='basic'||api.auth==='oauth') && (
                  <div className="ep-field"><label>{api.auth==='basic'?'סיסמה':'Client Secret'}</label>
                    <input value={api.secret} onChange={e=>setApi({...api,secret:e.target.value})} dir="ltr" type="password"/>
                  </div>
                )}
                <div className="ep-field full"><label>Headers נוספים (JSON)</label>
                  <textarea rows={2} dir="ltr" defaultValue='{"X-Org-Id":"epr-municipality"}' style={{fontFamily:'ui-monospace,monospace',fontSize:12}}/>
                </div>
              </div>
              <div>
                <div className="ep-card-eb" style={{marginBottom:8}}>מיפוי שדות (Field Mapping)</div>
                <div style={{display:'flex',flexDirection:'column',gap:6,border:'1px solid var(--border)',borderRadius:8,padding:8,background:'#fafbfc'}}>
                  {fields.map(f=>(
                    <div key={f.id} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,alignItems:'center'}}>
                      <div style={{fontSize:12.5,padding:'6px 10px',background:'#fff',border:'1px solid var(--border)',borderRadius:6}}>{f.label}</div>
                      <span className="ep-muted" style={{fontSize:14}}>→</span>
                      <input dir="ltr" defaultValue={'field_'+f.id} style={{padding:'6px 10px',border:'1px solid var(--border)',borderRadius:6,fontSize:12.5,fontFamily:'ui-monospace,monospace'}}/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="row" style={{justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                <button className="ep-btn ep-btn-ghost ep-btn-sm" data-toast="off" onClick={()=>{
                  setTestStatus('testing');
                  setTimeout(()=>{ const ok = !!api.url && api.url.startsWith('http'); setTestStatus(ok?'ok':'fail'); window.eprToast && window.eprToast(ok?'בדיקת החיבור הצליחה (HTTP 200 · 142ms)':'הבדיקה נכשלה — URL חסר או לא תקין', ok?'success':'danger'); }, 700);
                }}>
                  {testStatus==='testing'? <I.clock width={12} height={12}/> : <I.check width={12} height={12}/>}
                  {testStatus==='testing'?'בודק…':testStatus==='ok'?'חיבור תקין':testStatus==='fail'?'נסה שוב':'בדיקת חיבור'}
                </button>
                <label className="row" style={{gap:6,fontSize:12.5}}>
                  <input type="checkbox" defaultChecked/>נסה שוב במקרה של כשל (עד 3 נסיונות)
                </label>
              </div>
            </>)}
            {!api.enabled && (
              <div className="ep-callout">
                <I.alert width={16} height={16}/>
                <div>הטופס יישמר במערכת בלבד. הפעל את החיבור ל-API כדי לשלוח נתונים למערכות חיצוניות — SAP, Salesforce, מערכת גבייה או webhook מותאם אישית.</div>
              </div>
            )}
          </>)}
          {step===4 && (<>
            <div className="ep-modal-summary">
              <div className="ep-modal-summary-card">
                <h4>פרטי טופס</h4>
                <dl className="ep-kv-grid">
                  <dt>שם</dt><dd>{form.name||<em className="ep-muted">לא הוזן</em>}</dd>
                  <dt>מחלקה</dt><dd>{form.category}</dd>
                  <dt>SLA</dt><dd>{form.sla} שעות</dd>
                  <dt>סטטוס</dt><dd>{form.active?'פעיל':'טיוטה'}</dd>
                  <dt>ציבורי</dt><dd>{form.public?'כן':'פנימי בלבד'}</dd>
                </dl>
              </div>
              <div className="ep-modal-summary-card">
                <h4>שדות ({fields.length})</h4>
                <ul style={{margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:6,fontSize:12.5}}>
                  {fields.map(f=>(<li key={f.id} style={{display:'flex',justifyContent:'space-between'}}>
                    <span>{f.label}</span>
                    <span className="ep-muted">{typeNames[f.type]}{f.required?' · חובה':''}</span>
                  </li>))}
                </ul>
              </div>
              <div className="ep-modal-summary-card" style={{gridColumn:'1 / -1'}}>
                <h4>חיבור ל-API</h4>
                <dl className="ep-kv-grid">
                  <dt>מצב</dt><dd>{api.enabled?<span style={{color:'#0F7D52'}}>● מופעל</span>:<span className="ep-muted">● כבוי</span>}</dd>
                  {api.enabled && <><dt>Method</dt><dd className="ep-mono">{api.method}</dd></>}
                  {api.enabled && <><dt>Endpoint</dt><dd className="ep-mono ep-truncate-3" style={{direction:'ltr',textAlign:'start',fontSize:11}}>{api.url}</dd></>}
                  {api.enabled && <><dt>אימות</dt><dd>{({none:'ללא',bearer:'Bearer',basic:'Basic',apikey:'API Key',oauth:'OAuth 2.0'})[api.auth]}</dd></>}
                  {api.enabled && testStatus==='ok' && <><dt>בדיקה</dt><dd style={{color:'#0F7D52'}}>✓ תקינה (HTTP 200)</dd></>}
                </dl>
              </div>
            </div>
            <div className="ep-callout">
              <I.alert width={16} height={16}/>
              <div>הטופס יתווסף לרשימת הטפסים הפעילים{api.enabled?' והשליחות יישלחו גם ל-':' '}{api.enabled?api.url.split('/').slice(0,3).join('/')+'…':' ויהיה זמין לפנייה דרך הערוצים הציבוריים.'}</div>
            </div>
          </>)}
        </div>
        <footer className="ep-modal-foot">
          <button className="ep-btn ep-btn-ghost" onClick={close} data-toast="off">ביטול</button>
          <div style={{display:'flex',gap:8}}>
            {step>1 && <button className="ep-btn ep-btn-ghost" onClick={()=>setStep(step-1)} data-toast="off">‹ הקודם</button>}
            {step<4 && <button className="ep-btn ep-btn-primary" disabled={step===1&&!form.name.trim()} onClick={()=>setStep(step+1)} data-toast="off">הבא ‹</button>}
            {step===4 && <button className="ep-btn ep-btn-primary" onClick={submit} data-toast="off">צור טופס ←</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────── ReportBuilder modal ─────────────────── */
function ReportBuilderModal() {
  const [open, setOpen] = tsS(false);
  const [step, setStep] = tsS(1);
  const [r, setR] = tsS({ name:'', source:'requests', dims:['dept','status'], measures:['count'], chart:'bars', schedule:'none' });
  const I = window.EprIcon;
  tsE(()=>{
    const h = ()=>{ setOpen(true); setStep(1); };
    window.addEventListener('open-report-builder', h);
    return ()=> window.removeEventListener('open-report-builder', h);
  },[]);
  if(!open) return null;
  const close = ()=> setOpen(false);
  const toggle = (k,v)=> setR(s=>({...s,[k]:s[k].includes(v)?s[k].filter(x=>x!==v):[...s[k],v]}));
  const submit = ()=>{ setOpen(false); window.eprToast && window.eprToast(`דוח "${r.name||'ללא שם'}" נשמר`, 'success'); setStep(1); setR({ name:'', source:'requests', dims:['dept','status'], measures:['count'], chart:'bars', schedule:'none' }); };
  const sources = [['requests','פניות'],['residents','תושבים'],['team','צוות'],['sla','SLA'],['bulk','דיוורים']];
  const dims = [['dept','מחלקה'],['status','סטטוס'],['priority','עדיפות'],['channel','ערוץ'],['clerk','אחראי'],['month','חודש'],['week','שבוע']];
  const measures = [['count','כמות'],['avg_time','זמן ממוצע'],['sla_pct','אחוז SLA'],['open','פתוחות'],['closed','סגורות']];
  const charts = [['bars','עמודות','chart'],['donut','דונאט','filter'],['line','קו','up'],['table','טבלה','doc']];
  return (
    <div className="ep-modal-overlay" onMouseDown={close}>
      <div className="ep-modal" onMouseDown={e=>e.stopPropagation()}>
        <header className="ep-modal-head">
          <div><div className="ep-card-eb">דוח חדש</div><h3>{step===1?'פרטי דוח':step===2?'בניית הדוח':'תצוגה ותזמון'}</h3></div>
          <button className="ep-icon-btn" onClick={close} data-toast="off"><I.close/></button>
        </header>
        <div className="ep-modal-stepper">
          {[1,2,3].map(n=>(<div key={n} className={`ep-modal-step ${step>=n?'on':''} ${step===n?'now':''}`}>
            <span className="ep-modal-step-n">{n}</span><span>{n===1?'פרטים':n===2?'נתונים':'תצוגה'}</span>
          </div>))}
        </div>
        <div className="ep-modal-body">
          {step===1 && (<>
            <div className="ep-detail-grid">
              <div className="ep-field full"><label>שם הדוח ‹</label><input value={r.name} onChange={e=>setR({...r,name:e.target.value})} placeholder="לדוגמה: SLA שבועי לפי מחלקה"/></div>
              <div className="ep-field full"><label>תיאור</label><textarea rows={2} placeholder="מטרת הדוח, קהל יעד…"/></div>
            </div>
            <div>
              <div className="ep-card-eb" style={{marginBottom:8}}>מקור נתונים</div>
              <div className="ep-pill-row">
                {sources.map(([v,t])=>(<button key={v} className={`ep-pill ${r.source===v?'on':''}`} onClick={()=>setR({...r,source:v})} data-toast="off">{t}</button>))}
              </div>
            </div>
          </>)}
          {step===2 && (<>
            <div>
              <div className="ep-card-eb" style={{marginBottom:8}}>חתוך לפי (Dimensions)</div>
              <div className="ep-pill-row">
                {dims.map(([v,t])=>(<button key={v} className={`ep-pill ${r.dims.includes(v)?'on':''}`} onClick={()=>toggle('dims',v)} data-toast="off">{t}</button>))}
              </div>
            </div>
            <div>
              <div className="ep-card-eb" style={{marginBottom:8}}>מדדים (Measures)</div>
              <div className="ep-pill-row">
                {measures.map(([v,t])=>(<button key={v} className={`ep-pill ${r.measures.includes(v)?'on':''}`} onClick={()=>toggle('measures',v)} data-toast="off">{t}</button>))}
              </div>
            </div>
            <div className="ep-callout">
              <I.alert width={16} height={16}/>
              <div><b>תצוגה מקדימה:</b> {r.measures.length||0} מדדים × {r.dims.length||0} ממדים מתוך {sources.find(s=>s[0]===r.source)?.[1]}</div>
            </div>
          </>)}
          {step===3 && (<>
            <div>
              <div className="ep-card-eb" style={{marginBottom:8}}>סוג תצוגה</div>
              <div className="ep-pill-row">
                {charts.map(([v,t])=>(<button key={v} className={`ep-pill ${r.chart===v?'on':''}`} onClick={()=>setR({...r,chart:v})} data-toast="off">{t}</button>))}
              </div>
            </div>
            <div>
              <div className="ep-card-eb" style={{marginBottom:8}}>תזמון</div>
              <div className="ep-pill-row">
                {[['none','ידני'],['daily','יומי 08:00'],['weekly','שבועי ראשון'],['monthly','חודשי 1.'],['alert','התראה בזמן אמת']].map(([v,t])=>(
                  <button key={v} className={`ep-pill ${r.schedule===v?'on':''}`} onClick={()=>setR({...r,schedule:v})} data-toast="off">{t}</button>
                ))}
              </div>
            </div>
            <div className="ep-modal-summary-card">
              <h4>סיכום</h4>
              <dl className="ep-kv-grid">
                <dt>שם</dt><dd>{r.name||<em className="ep-muted">לא הוזן</em>}</dd>
                <dt>מקור</dt><dd>{sources.find(s=>s[0]===r.source)?.[1]}</dd>
                <dt>ממדים</dt><dd>{r.dims.map(d=>dims.find(x=>x[0]===d)?.[1]).join(', ')||'—'}</dd>
                <dt>מדדים</dt><dd>{r.measures.map(m=>measures.find(x=>x[0]===m)?.[1]).join(', ')||'—'}</dd>
                <dt>תצוגה</dt><dd>{charts.find(c=>c[0]===r.chart)?.[1]}</dd>
                <dt>תזמון</dt><dd>{r.schedule==='none'?'הפעלה ידנית':r.schedule}</dd>
              </dl>
            </div>
          </>)}
        </div>
        <footer className="ep-modal-foot">
          <button className="ep-btn ep-btn-ghost" onClick={close} data-toast="off">ביטול</button>
          <div style={{display:'flex',gap:8}}>
            {step>1 && <button className="ep-btn ep-btn-ghost" onClick={()=>setStep(step-1)} data-toast="off">‹ הקודם</button>}
            {step<3 && <button className="ep-btn ep-btn-primary" disabled={step===1&&!r.name.trim()} onClick={()=>setStep(step+1)} data-toast="off">הבא ‹</button>}
            {step===3 && <button className="ep-btn ep-btn-primary" onClick={submit} data-toast="off">שמור דוח ←</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────── Generic Entity Create modal ─────────────────── *
 * Reused across settings: department, team, category, routing-rule,
 * notification-template, integration, user, channel, holiday, etc.
 * ───────────────────────────────────────────────────────────────────── */
const ENTITY_SCHEMAS = {
  department: {
    title:'מחלקה חדשה', toast:'מחלקה נוצרה',
    fields:[
      { k:'name', label:'שם המחלקה', type:'text', required:true, placeholder:'לדוגמה: רישוי עסקים' },
      { k:'manager', label:'מנהל מחלקה', type:'text', placeholder:'שם מלא' },
      { k:'phone', label:'טלפון מחלקתי', type:'text', dir:'ltr', placeholder:'03-1234567' },
      { k:'email', label:'אימייל', type:'text', dir:'ltr', placeholder:'dept@city.gov.il' },
      { k:'color', label:'צבע מזהה', type:'color' },
      { k:'sla', label:'SLA ברירת מחדל (שעות)', type:'number', defaultValue:48 },
    ],
  },
  team: {
    title:'צוות חדש', toast:'הצוות נוצר',
    fields:[
      { k:'name', label:'שם הצוות', type:'text', required:true },
      { k:'dept', label:'מחלקה', type:'select', options:['תשתיות','גינון','איכות סביבה','הנדסה','תברואה','חינוך','כללי'] },
      { k:'lead', label:'ראש צוות', type:'text' },
      { k:'members', label:'מספר חברים', type:'number', defaultValue:5 },
    ],
  },
  category: {
    title:'קטגוריה חדשה', toast:'קטגוריה נוספה',
    fields:[
      { k:'name', label:'שם הקטגוריה', type:'text', required:true, placeholder:'לדוגמה: רכוש עירוני' },
      { k:'parent', label:'קטגוריית אב', type:'select', options:['ללא (קטגוריה ראשית)','תשתיות וכבישים','סביבה וניקיון','הנדסה ובנייה','גינון ואקולוגיה','חינוך'] },
      { k:'icon', label:'אייקון', type:'select', options:['🏗️ תשתיות','🌳 גינון','📋 כללי','🏛 הנדסה','♻️ סביבה'] },
      { k:'color', label:'צבע', type:'color' },
    ],
  },
  rule: {
    title:'חוק ניתוב חדש', toast:'החוק הופעל',
    fields:[
      { k:'name', label:'שם החוק', type:'text', required:true, placeholder:'לדוגמה: ניתוב פניות VIP' },
      { k:'condField', label:'תנאי על שדה', type:'select', options:['קטגוריה','עדיפות','ערוץ','אזור גיאוגרפי','מילות מפתח','VIP'] },
      { k:'condOp', label:'אופרטור', type:'select', options:['שווה ל','מכיל','מתחיל ב','גדול מ','קטן מ'] },
      { k:'condValue', label:'ערך', type:'text', placeholder:'הזן ערך…' },
      { k:'action', label:'פעולה', type:'select', options:['שיוך למחלקה','שינוי עדיפות','הוספת תגית','התראה למנהל','אסקלציה'] },
      { k:'target', label:'יעד', type:'text', placeholder:'מחלקה / משתמש / תגית' },
    ],
  },
  template: {
    title:'תבנית הודעה חדשה', toast:'התבנית נשמרה',
    fields:[
      { k:'name', label:'שם התבנית', type:'text', required:true },
      { k:'channel', label:'ערוץ', type:'select', options:['SMS','Email','Push','WhatsApp'] },
      { k:'subject', label:'נושא (לאימייל)', type:'text', placeholder:'לדוגמה: עדכון פנייה {ref}' },
      { k:'body', label:'תוכן ההודעה', type:'textarea', required:true, placeholder:'שלום {name}, פנייה {ref} עודכנה ל{status}.\n\nניתן לעקוב אחר הטיפול דרך פורטל התושב.', rows:5 },
      { k:'vars', label:'משתנים פעילים', type:'help', text:'{name} · {ref} · {status} · {clerk} · {date} · {amount}' },
    ],
  },
  integration: {
    title:'אינטגרציה חדשה', toast:'התחיל תהליך החיבור',
    fields:[
      { k:'system', label:'מערכת', type:'select', options:['Salesforce','SAP S/4 HANA','Oracle','Twilio','Microsoft Graph','Slack','Webhook גנרי'] },
      { k:'name', label:'שם הציון במערכת', type:'text', required:true },
      { k:'url', label:'Endpoint URL', type:'text', dir:'ltr', placeholder:'https://api.example.com' },
      { k:'auth', label:'אימות', type:'select', options:['Bearer Token','Basic','OAuth 2.0','API Key'] },
      { k:'token', label:'Token / Secret', type:'password', dir:'ltr' },
    ],
  },
  user: {
    title:'משתמש חדש', toast:'הזמנה נשלחה למשתמש',
    fields:[
      { k:'name', label:'שם מלא', type:'text', required:true },
      { k:'email', label:'אימייל', type:'text', required:true, dir:'ltr', placeholder:'name@city.gov.il' },
      { k:'phone', label:'טלפון', type:'text', dir:'ltr', placeholder:'050-1234567' },
      { k:'role', label:'תפקיד', type:'select', options:['מנהל מערכת','מנהל מחלקה','ראש צוות','רכז','מוקדן','צופה'] },
      { k:'dept', label:'מחלקה', type:'select', options:['תשתיות','גינון','איכות סביבה','הנדסה','תברואה','חינוך','כללי'] },
      { k:'invite', label:'שלח הזמנה במייל', type:'checkbox', defaultValue:true },
    ],
  },
  holiday: {
    title:'יום חג / חופשה', toast:'נוסף ליומן',
    fields:[
      { k:'name', label:'שם החג', type:'text', required:true, placeholder:'לדוגמה: יום הזיכרון' },
      { k:'from', label:'מתאריך', type:'date' },
      { k:'to', label:'עד תאריך', type:'date' },
      { k:'recurring', label:'חוזר כל שנה', type:'checkbox', defaultValue:true },
      { k:'sla_pause', label:'השהה SLA בתקופה זו', type:'checkbox', defaultValue:true },
    ],
  },
};

function EntityCreateModal() {
  const [config, setConfig] = tsS(null); // {kind, schema} or null
  const [data, setData] = tsS({});
  const I = window.EprIcon;
  tsE(()=>{
    const h = (e)=>{
      const kind = e.detail?.kind;
      const schema = ENTITY_SCHEMAS[kind];
      if(!schema) return;
      const init = {};
      schema.fields.forEach(f=>{
        if(f.defaultValue!==undefined) init[f.k] = f.defaultValue;
        else if(f.type==='select' && f.options) init[f.k] = f.options[0];
        else if(f.type==='color') init[f.k] = '#0F968C';
        else init[f.k] = '';
      });
      setData(init);
      setConfig({ kind, schema });
    };
    window.addEventListener('open-create-entity', h);
    return ()=> window.removeEventListener('open-create-entity', h);
  },[]);
  if(!config) return null;
  const close = ()=> setConfig(null);
  const set = (k,v)=> setData(d=>({...d,[k]:v}));
  const requiredOK = config.schema.fields.filter(f=>f.required).every(f => (data[f.k]||'').toString().trim().length>0);
  const submit = ()=>{
    const name = data.name || data.system || Object.values(data).find(x=>x);
    close();
    window.eprToast && window.eprToast(`${config.schema.toast}: "${name||'פריט חדש'}"`, 'success');
  };
  const palette = ['#0F968C','#3D7BC8','#7A6BD8','#D4793A','#5B945C','#E15454','#F2B134','#5DC4A8'];

  return (
    <div className="ep-modal-overlay" onMouseDown={close}>
      <div className="ep-modal" style={{maxWidth:520}} onMouseDown={e=>e.stopPropagation()}>
        <header className="ep-modal-head">
          <div><div className="ep-card-eb">יצירה חדשה</div><h3>{config.schema.title}</h3></div>
          <button className="ep-icon-btn" onClick={close} data-toast="off"><I.close/></button>
        </header>
        <div className="ep-modal-body">
          <div className="ep-detail-grid">
            {config.schema.fields.map(f=>{
              const full = f.type==='textarea' || f.type==='help';
              const cls = `ep-field${full?' full':''}`;
              if(f.type==='help'){
                return (<div key={f.k} className={cls}>
                  <label>{f.label}</label>
                  <div className="ep-mono ep-muted" style={{fontSize:11,padding:'6px 10px',background:'#fafbfc',border:'1px dashed var(--border)',borderRadius:6,direction:'ltr',textAlign:'start'}}>{f.text}</div>
                </div>);
              }
              if(f.type==='checkbox'){
                return (<label key={f.k} className={cls} style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <input type="checkbox" checked={!!data[f.k]} onChange={e=>set(f.k,e.target.checked)}/>
                  <span style={{fontSize:13}}>{f.label}</span>
                </label>);
              }
              if(f.type==='select'){
                return (<div key={f.k} className={cls}>
                  <label>{f.label}</label>
                  <select value={data[f.k]||''} onChange={e=>set(f.k,e.target.value)}>
                    {f.options.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>);
              }
              if(f.type==='color'){
                return (<div key={f.k} className={cls}>
                  <label>{f.label}</label>
                  <div className="row" style={{gap:6,flexWrap:'wrap'}}>
                    {palette.map(c=>(
                      <button key={c} type="button" data-toast="off" aria-label={c}
                        onClick={()=>set(f.k,c)}
                        style={{width:24,height:24,borderRadius:6,background:c,border:(data[f.k]===c?'2.5px solid var(--text)':'1px solid var(--border)'),cursor:'pointer'}}/>
                    ))}
                  </div>
                </div>);
              }
              if(f.type==='textarea'){
                return (<div key={f.k} className={cls}>
                  <label>{f.label}{f.required?' ‹':''}</label>
                  <textarea rows={f.rows||3} value={data[f.k]||''} onChange={e=>set(f.k,e.target.value)} placeholder={f.placeholder} dir={f.dir||'auto'}/>
                </div>);
              }
              return (<div key={f.k} className={cls}>
                <label>{f.label}{f.required?' ‹':''}</label>
                <input type={f.type==='password'?'password':f.type==='date'?'date':f.type==='number'?'number':'text'}
                  value={data[f.k]||''} onChange={e=>set(f.k,e.target.value)}
                  placeholder={f.placeholder} dir={f.dir||'auto'}/>
              </div>);
            })}
          </div>
        </div>
        <footer className="ep-modal-foot">
          <button className="ep-btn ep-btn-ghost" onClick={close} data-toast="off">ביטול</button>
          <button className="ep-btn ep-btn-primary" disabled={!requiredOK} onClick={submit} data-toast="off">צור ←</button>
        </footer>
      </div>
    </div>
  );
}

/* Mount everything together */
function EprInteractions() {
  return (<>
    <ToastHost/>
    <ButtonFeedback/>
    <NewRequestModal/>
    <FormBuilderModal/>
    <ReportBuilderModal/>
    <EntityCreateModal/>
    <AISearch/>
  </>);
}

window.EprInteractions = EprInteractions;
