const STATUS = {
  NEW: { id: 'new', label: 'חדש', tone: 'blue' },
  OPEN: { id: 'open', label: 'פתוח', tone: 'teal' },
  IN_PROGRESS: { id: 'in_progress', label: 'בטיפול', tone: 'amber' },
  WAITING_DOCS: { id: 'waiting_docs', label: 'מחכה למסמכים', tone: 'amber' },
  APPROVED: { id: 'approved', label: 'מאושר', tone: 'green' },
  REJECTED: { id: 'rejected', label: 'נדחה', tone: 'red' },
  TRANSFERRED: { id: 'transferred', label: 'הועבר', tone: 'blue' },
  EXTERNAL: { id: 'external', label: 'חיצוני', tone: 'slate' },
  CLOSED: { id: 'closed', label: 'סגור', tone: 'slate' },
};
const STATUS_BY_LABEL = Object.fromEntries(Object.values(STATUS).map(s => [s.label, s]));

const PRIORITY = {
  URGENT: { id: 'urgent', label: 'דחוף', tone: 'red' },
  HIGH:   { id: 'high',   label: 'גבוה', tone: 'amber' },
  NORMAL: { id: 'normal', label: 'רגיל', tone: 'slate' },
  LOW:    { id: 'low',    label: 'נמוך', tone: 'slate' },
};
const PRIORITY_BY_LABEL = Object.fromEntries(Object.values(PRIORITY).map(p => [p.label, p]));

const CHANNELS = {
  PHONE: { id: 'phone', label: 'טלפון' },
  CALL_CENTER: { id: 'call_center', label: 'מוקד 106' },
  APP: { id: 'app', label: 'אפליקציה' },
  WEB: { id: 'web', label: 'אתר' },
  EMAIL: { id: 'email', label: 'דוא״ל' },
  WALKIN: { id: 'walkin', label: 'התייצבות' },
  WHATSAPP: { id: 'whatsapp', label: 'WhatsApp' },
  SMS: { id: 'sms', label: 'SMS' },
};

const NOTIFICATION_KINDS = {
  SMS: 'SMS', EMAIL: 'Email', PUSH: 'Push', WHATSAPP: 'WhatsApp',
};

const AUTH_KINDS = {
  NONE: 'none', BEARER: 'bearer', BASIC: 'basic', API_KEY: 'apikey', OAUTH: 'oauth',
};

const Z = {
  base: 1, dropdown: 30, sticky: 50, drawer: 60, scrim: 70,
  modal: 80, toast: 100, palette: 120, tooltip: 140,
};

Object.assign(window, {
  EPR_STATUS: STATUS, EPR_STATUS_BY_LABEL: STATUS_BY_LABEL,
  EPR_PRIORITY: PRIORITY, EPR_PRIORITY_BY_LABEL: PRIORITY_BY_LABEL,
  EPR_CHANNELS: CHANNELS, EPR_NOTIFY: NOTIFICATION_KINDS,
  EPR_AUTH: AUTH_KINDS, EPR_Z: Z,
});
