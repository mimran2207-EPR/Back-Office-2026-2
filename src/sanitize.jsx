function sanitizeText(input) {
  if (input == null) return '';
  const s = String(input);
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(s, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  return s.replace(/[<>&"']/g, ch => ({
    '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

function sanitizeHTML(input) {
  if (input == null) return '';
  const s = String(input);
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(s, {
      ALLOWED_TAGS: ['b','strong','i','em','br','code','span','p'],
      ALLOWED_ATTR: ['class'],
    });
  }
  return sanitizeText(s);
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore (previous|all|above)/i,
  /system prompt/i,
  /you are now/i,
  /forget (everything|all|previous)/i,
  /jailbreak/i,
  /\bDAN\b/,
  /<\s*\/?\s*(script|style|iframe|object|embed)\b/i,
];

function detectPromptInjection(text) {
  if (!text) return false;
  return PROMPT_INJECTION_PATTERNS.some(re => re.test(text));
}

function sanitizeAIPrompt(text) {
  const clean = sanitizeText(text).slice(0, 1000);
  if (detectPromptInjection(clean)) {
    return clean.replace(/[<>{}|\\]/g, ' ').slice(0, 200);
  }
  return clean;
}

function sanitizeAIResponse(text) {
  return sanitizeHTML(text).slice(0, 4000);
}

Object.assign(window, {
  eprSanitize: sanitizeText,
  eprSanitizeHTML: sanitizeHTML,
  eprSanitizeAIPrompt: sanitizeAIPrompt,
  eprSanitizeAIResponse: sanitizeAIResponse,
  eprDetectInjection: detectPromptInjection,
});
