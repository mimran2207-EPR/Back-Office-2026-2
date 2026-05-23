const { useState: vfS, useEffect: vfE, useCallback: vfC, useMemo: vfM } = React;

const EprRules = {
  required: (v) => (v == null || String(v).trim() === '') ? 'שדה חובה' : null,
  phoneIL: (v) => {
    if (!v) return null;
    const clean = String(v).replace(/[\s\-()]/g, '');
    return /^(0|\+972)[2-9]\d{7,8}$/.test(clean) ? null : 'מספר טלפון לא תקין';
  },
  email: (v) => {
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? null : 'כתובת דוא״ל לא תקינה';
  },
  url: (v) => {
    if (!v) return null;
    try { new URL(String(v)); return null; }
    catch (_) { return 'כתובת URL לא תקינה'; }
  },
  idIL: (v) => {
    if (!v) return null;
    const s = String(v).padStart(9, '0');
    if (!/^\d{9}$/.test(s)) return 'מספר תעודת זהות לא תקין';
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let d = parseInt(s[i], 10) * ((i % 2) + 1);
      if (d > 9) d -= 9;
      sum += d;
    }
    return sum % 10 === 0 ? null : 'מספר תעודת זהות לא תקין';
  },
  duration: (v) => {
    if (!v) return null;
    return /^\d+\s*(שעות|דקות|ימים|hours?|minutes?|days?)?$/.test(String(v).trim()) ? null : 'משך זמן לא תקין';
  },
  timeHHMM: (v) => {
    if (!v) return null;
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(v)) ? null : 'שעה לא תקינה (HH:MM)';
  },
  min: (n) => (v) => (v == null || String(v).length < n) ? `מינימום ${n} תווים` : null,
  max: (n) => (v) => (v != null && String(v).length > n) ? `מקסימום ${n} תווים` : null,
  number: (v) => {
    if (v === '' || v == null) return null;
    return !isNaN(Number(v)) ? null : 'יש להזין מספר';
  },
  positive: (v) => {
    if (v === '' || v == null) return null;
    return Number(v) > 0 ? null : 'חייב להיות מספר חיובי';
  },
};

function useEprForm(initialValues, schema = {}) {
  const [values, setValues] = vfS(initialValues || {});
  const [touched, setTouched] = vfS({});
  const [submitting, setSubmitting] = vfS(false);

  const initialRef = vfM(() => JSON.stringify(initialValues || {}), []);
  const isDirty = vfM(() => JSON.stringify(values) !== initialRef, [values, initialRef]);

  const errors = vfM(() => {
    const out = {};
    Object.keys(schema).forEach(key => {
      const rules = schema[key];
      const rulesArr = Array.isArray(rules) ? rules : [rules];
      for (const rule of rulesArr) {
        const fn = typeof rule === 'function' ? rule : EprRules[rule];
        if (!fn) continue;
        const err = fn(values[key], values);
        if (err) { out[key] = err; break; }
      }
    });
    return out;
  }, [values, schema]);

  const isValid = Object.keys(errors).length === 0;

  const setField = vfC((key, value) => {
    setValues(v => ({ ...v, [key]: value }));
    setTouched(t => ({ ...t, [key]: true }));
  }, []);

  const handleBlur = vfC((key) => () => {
    setTouched(t => ({ ...t, [key]: true }));
  }, []);

  const fieldProps = vfC((key) => ({
    value: values[key] ?? '',
    onChange: (e) => setField(key, e?.target ? e.target.value : e),
    onBlur: handleBlur(key),
    'aria-invalid': touched[key] && errors[key] ? 'true' : undefined,
    'aria-describedby': touched[key] && errors[key] ? `err-${key}` : undefined,
  }), [values, errors, touched, setField, handleBlur]);

  const getError = vfC((key) => touched[key] ? errors[key] : null, [errors, touched]);

  const reset = vfC(() => {
    setValues(initialValues || {});
    setTouched({});
  }, [initialValues]);

  const submit = vfC(async (handler) => {
    const allTouched = {};
    Object.keys(schema).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    if (!isValid) return false;
    setSubmitting(true);
    try {
      await handler(values);
      return true;
    } finally {
      setSubmitting(false);
    }
  }, [schema, isValid, values]);

  return {
    values, errors, touched, isDirty, isValid, submitting,
    setField, setValues, reset, submit, fieldProps, getError,
  };
}

function FieldError({ name, error, id }) {
  if (!error) return null;
  return (
    <div id={id || `err-${name}`} className="ep-field-err" role="alert">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
      {error}
    </div>
  );
}

function DirtyBadge({ dirty }) {
  if (!dirty) return null;
  return (
    <span className="ep-dirty-badge" role="status" aria-label="יש שינויים שלא נשמרו">
      <span className="ep-dirty-dot" aria-hidden="true"/>
      שינויים לא שמורים
    </span>
  );
}

function useUnsavedChangesWarning(dirty) {
  vfE(() => {
    if (!dirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}

Object.assign(window, { EprRules, useEprForm, FieldError, DirtyBadge, useUnsavedChangesWarning });
