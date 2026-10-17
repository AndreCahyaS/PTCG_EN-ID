export interface SavedTemplate {
  id: string;
  name: string;
  content: string;
  savedAt: number;
}

interface TemplateMetadata {
  id: string;
  name: string;
  savedAt: number;
}

const COOKIE_PREFIX = 'ptcg_tpl_';
const COOKIE_META_KEY = 'ptcg_templates_meta';
const COOKIE_LAST_ACTIVE = 'ptcg_last_deck_template';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Standard cookie getter
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length));
      } catch {
        return c.substring(nameEQ.length);
      }
    }
  }
  return null;
}

/**
 * Standard cookie setter
 */
export function setCookie(name: string, value: string, days = COOKIE_EXPIRY_DAYS): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const encodedValue = encodeURIComponent(value);
    
    // Cookie standard max size is ~4096 bytes
    if (encodedValue.length > 3900) {
      console.warn(`Cookie ${name} size is near limit (${encodedValue.length} bytes).`);
    }

    document.cookie = `${encodeURIComponent(name)}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    return true;
  } catch (err) {
    console.error(`Failed to set cookie ${name}:`, err);
    return false;
  }
}

/**
 * Standard cookie deleter
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

/**
 * Helper to mirror in localStorage for redundancy
 */
function setLocalStorageSafe(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore quota or disabled localStorage
  }
}

function getLocalStorageSafe(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore
  }
  return null;
}

function removeLocalStorageSafe(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

/**
 * Get all user saved templates from cookies (with localStorage fallback)
 */
export function getSavedTemplatesFromCookie(): SavedTemplate[] {
  try {
    // Read metadata cookie first
    let rawMeta = getCookie(COOKIE_META_KEY);
    if (!rawMeta) {
      rawMeta = getLocalStorageSafe(COOKIE_META_KEY);
    }

    if (!rawMeta) return [];

    const metaList: TemplateMetadata[] = JSON.parse(rawMeta);
    if (!Array.isArray(metaList)) return [];

    const results: SavedTemplate[] = [];
    for (const meta of metaList) {
      const cookieKey = `${COOKIE_PREFIX}${meta.id}`;
      let content = getCookie(cookieKey);
      if (!content) {
        content = getLocalStorageSafe(cookieKey);
      }
      if (content !== null && content !== undefined) {
        results.push({
          id: meta.id,
          name: meta.name,
          content,
          savedAt: meta.savedAt,
        });
      }
    }

    return results;
  } catch (err) {
    console.warn('Failed to parse saved templates from cookie:', err);
    return [];
  }
}

/**
 * Save a new or existing template to cookies
 */
export function saveTemplateToCookie(name: string, content: string, existingId?: string): SavedTemplate {
  const currentTemplates = getSavedTemplatesFromCookie();
  const id = existingId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const savedAt = Date.now();

  const newTemplate: SavedTemplate = {
    id,
    name: name.trim() || `Template ${new Date(savedAt).toLocaleDateString()}`,
    content: content.trim(),
    savedAt,
  };

  // Save the template content in its dedicated cookie
  const cookieKey = `${COOKIE_PREFIX}${id}`;
  setCookie(cookieKey, newTemplate.content);
  setLocalStorageSafe(cookieKey, newTemplate.content);

  // Update metadata list
  const existingIndex = currentTemplates.findIndex(t => t.id === id);
  let updatedList: SavedTemplate[];
  if (existingIndex >= 0) {
    updatedList = [...currentTemplates];
    updatedList[existingIndex] = newTemplate;
  } else {
    updatedList = [newTemplate, ...currentTemplates];
  }

  const metaList: TemplateMetadata[] = updatedList.map(t => ({
    id: t.id,
    name: t.name,
    savedAt: t.savedAt,
  }));

  const metaString = JSON.stringify(metaList);
  setCookie(COOKIE_META_KEY, metaString);
  setLocalStorageSafe(COOKIE_META_KEY, metaString);

  // Also update last active
  setLastPastedTemplateToCookie(newTemplate.content);

  return newTemplate;
}

/**
 * Delete a template from cookies
 */
export function deleteSavedTemplateFromCookie(id: string): void {
  const cookieKey = `${COOKIE_PREFIX}${id}`;
  deleteCookie(cookieKey);
  removeLocalStorageSafe(cookieKey);

  const currentTemplates = getSavedTemplatesFromCookie();
  const updatedList = currentTemplates.filter(t => t.id !== id);

  const metaList: TemplateMetadata[] = updatedList.map(t => ({
    id: t.id,
    name: t.name,
    savedAt: t.savedAt,
  }));

  const metaString = JSON.stringify(metaList);
  setCookie(COOKIE_META_KEY, metaString);
  setLocalStorageSafe(COOKIE_META_KEY, metaString);
}

/**
 * Save the most recent pasted/active template into cookies
 */
export function setLastPastedTemplateToCookie(content: string): void {
  if (!content || !content.trim()) return;
  setCookie(COOKIE_LAST_ACTIVE, content.trim());
  setLocalStorageSafe(COOKIE_LAST_ACTIVE, content.trim());
}

/**
 * Get the most recent pasted/active template from cookies
 */
export function getLastPastedTemplateFromCookie(): string | null {
  const cookieVal = getCookie(COOKIE_LAST_ACTIVE);
  if (cookieVal && cookieVal.trim()) return cookieVal;
  return getLocalStorageSafe(COOKIE_LAST_ACTIVE);
}

/**
 * Clear all template cookies
 */
export function clearAllTemplateCookies(): void {
  const currentTemplates = getSavedTemplatesFromCookie();
  for (const tpl of currentTemplates) {
    deleteCookie(`${COOKIE_PREFIX}${tpl.id}`);
    removeLocalStorageSafe(`${COOKIE_PREFIX}${tpl.id}`);
  }
  deleteCookie(COOKIE_META_KEY);
  deleteCookie(COOKIE_LAST_ACTIVE);
  removeLocalStorageSafe(COOKIE_META_KEY);
  removeLocalStorageSafe(COOKIE_LAST_ACTIVE);
}
