const { useState: aS, useEffect: aE } = React;

function parseHash() {
  const h = (location.hash || '#dashboard').slice(1);
  const [page, ...rest] = h.split('/');
  if (page === 'settings' && rest[0]) return { page: `settings/${rest[0]}`, base: 'settings' };
  if (page === 'request' && rest[0]) return { page: 'request-detail', reqId: rest[0], base: 'requests' };
  return { page: page || 'dashboard', base: page };
}

function EprApp() {
  const [loggedIn, setLoggedIn] = aS(() => {
    try { return localStorage.getItem('epr-logged-in') !== '0'; } catch (_) { return true; }
  });
  const [route, setRoute] = aS(parseHash());
  const [drawer, setDrawer] = aS(null);
  const [detailRow, setDetailRow] = aS(null);
  const [theme, setTheme] = window.useTheme ? window.useTheme() : [null, null];

  aE(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  aE(() => {
    try { localStorage.setItem('epr-logged-in', loggedIn ? '1' : '0'); } catch (_) {}
  }, [loggedIn]);

  const goPage = (id) => { location.hash = '#' + id; };
  const openRequest = (row) => setDrawer(row);
  const openRequestFull = (row) => { setDetailRow(row); location.hash = '#request/' + row.id; };

  if (!loggedIn || route.page === 'login') return <LoginPage onLogin={()=>{ setLoggedIn(true); goPage('dashboard'); }}/>;
  if (route.page === 'reset-password') return <ResetPasswordPage goPage={goPage}/>;
  if (route.page === 'pending') return <PendingPage goPage={goPage}/>;

  const { page } = route;

  const titleMap = {
    'dashboard':'תמונת מצב','requests':'ניהול פניות','request-detail':'פרטי פנייה',
    'residents':'תושבים','team':'ביצועי צוות','bulk':'הודעות מרוכזות',
    'users':'ניהול משתמשים','saved-reports':'דוחות שמורים','my-reports':'הדוחות שלי',
    'install':'התקנת אפליקציה','404':'דף לא נמצא',
  };
  let crumbs = [titleMap[page] || titleMap[route.base] || 'דף'];
  if (page.startsWith('settings/')) crumbs = ['הגדרות', settingLabel(page)];
  if (page === 'request-detail') crumbs = ['ניהול פניות', detailRow?.title || 'פנייה'];

  const onSignOut = () => { setLoggedIn(false); goPage('login'); };

  return (
    <div className="ep-app">
      <Sidebar page={page} setPage={goPage} onSignOut={onSignOut}/>
      <main className="ep-main">
        <TopBar crumbs={crumbs} goPage={goPage} theme={theme} setTheme={setTheme}/>
        <div className="ep-content">
          {page==='dashboard'    && <DashboardPage openRequest={openRequest} goPage={goPage}/>}
          {page==='requests'     && <RequestsPage openRequest={(r)=>openRequestFull(r)} goPage={goPage}/>}
          {page==='request-detail' && <RequestDetailPageV3 row={detailRow} goPage={goPage} goBack={()=>goPage('requests')}/>}
          {page==='residents'    && <ResidentsPage/>}
          {page==='team'         && <TeamPage/>}
          {page==='bulk'         && <BulkPage/>}
          {page==='users'        && <UsersPage/>}
          {page==='saved-reports'&& <SavedReportsPage/>}
          {page==='my-reports'   && <MyReportsPage/>}
          {page==='install'      && <InstallPage/>}
          {page.startsWith('settings/') && <AdminSettingsPage initialTab={page.slice(9)}/>}
          {page==='settings'     && <AdminSettingsPage/>}
          {!validRoute(page)     && <NotFoundPage goPage={goPage}/>}
        </div>
      </main>
      <RequestDrawer row={drawer} onClose={()=>setDrawer(null)} onOpenFull={()=>{ openRequestFull(drawer); setDrawer(null); }}/>
      <EprInteractions/>
      {window.TopbarPopovers && <window.TopbarPopovers/>}
    </div>
  );
}

const VALID = ['dashboard','requests','request-detail','residents','team','bulk','users','saved-reports','my-reports','install','settings','login','reset-password','pending'];
function validRoute(p) { return VALID.includes(p) || p.startsWith('settings/'); }
function settingLabel(p) {
  const map = {'general':'כללי','business-calendar':'יומן עסקי','organization':'מבנה ארגוני','topics':'נושאי פנייה','sla':'זמני SLA','forms':'טפסי פנייה','channels':'ערוצי כניסה','auto-routing':'ניתוב אוטומטי','templates':'תבניות הודעה','integrations':'אינטגרציות','security':'אבטחה והרשאות','notifications':'התראות','branding':'מיתוג ופורטל','audit':'יומן ביקורת'};
  return map[p.slice(9)] || 'הגדרות';
}

const Boundary = window.EprErrorBoundary || (({children}) => children);
ReactDOM.createRoot(document.getElementById('root')).render(
  <Boundary><EprApp/></Boundary>
);
