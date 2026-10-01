export interface ParsedAmAccount {
  id: string;
  gmail: string;
  inboxurl: string;
  raw?: any;
}

/**
 * Parses any response from AM API into a clean list of accounts with gmail and inboxurl
 */
export function parseAmAccounts(result: any): ParsedAmAccount[] {
  if (!result) return [];

  // If already array of objects
  let items: any[] = [];

  if (Array.isArray(result)) {
    items = result;
  } else if (Array.isArray(result?.data)) {
    items = result.data;
  } else if (Array.isArray(result?.result)) {
    items = result.result;
  } else if (Array.isArray(result?.accounts)) {
    items = result.accounts;
  } else if (typeof result === 'object') {
    // If it's a single object with gmail/inboxurl directly
    const directGmail = result.gmail || result.email || result.mail || result.username || result.user;
    const directInbox = result.inboxurl || result.inboxUrl || result.inbox_url || result.url || result.link || result.inbox;

    if (directGmail || directInbox) {
      items = [result];
    } else if (result.data && typeof result.data === 'object') {
      return parseAmAccounts(result.data);
    } else if (result.result && typeof result.result === 'object') {
      return parseAmAccounts(result.result);
    } else {
      // Look through all values
      items = [result];
    }
  } else if (typeof result === 'string') {
    // Check if it's JSON string
    try {
      const parsed = JSON.parse(result);
      return parseAmAccounts(parsed);
    } catch {
      // Split by newlines
      const lines = result.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      items = lines;
    }
  }

  const accounts: ParsedAmAccount[] = [];

  items.forEach((item, index) => {
    if (!item) return;

    if (typeof item === 'object') {
      // Common field variations
      const gmail = item.gmail || item.email || item.mail || item.username || item.user || '';
      const inboxurl = item.inboxurl || item.inboxUrl || item.inbox_url || item.url || item.link || item.inbox || '';

      if (gmail || inboxurl) {
        accounts.push({
          id: `am-${index}-${gmail || index}`,
          gmail: String(gmail).trim(),
          inboxurl: String(inboxurl).trim(),
          raw: item
        });
      } else {
        // Search object values for email and url patterns
        const values = Object.values(item).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v));
        const foundEmail = values.find(v => v.includes('@')) || '';
        const foundUrl = values.find(v => v.startsWith('http://') || v.startsWith('https://')) || '';

        accounts.push({
          id: `am-${index}`,
          gmail: foundEmail || values[0] || 'Akun Alight Motion',
          inboxurl: foundUrl,
          raw: item
        });
      }
    } else if (typeof item === 'string') {
      // String format like: "email@gmail.com|https://..." or "email@gmail.com https://..."
      const parts = item.split(/[|\s,;]+/);
      const foundEmail = parts.find(p => p.includes('@')) || parts[0] || '';
      const foundUrl = parts.find(p => p.startsWith('http://') || p.startsWith('https://')) || parts[1] || '';

      accounts.push({
        id: `am-${index}`,
        gmail: foundEmail.trim(),
        inboxurl: foundUrl.trim(),
        raw: item
      });
    }
  });

  return accounts;
}

/**
 * Extracts a displayable image URL from HD Foto result (handles resultUrl, url, base64, dataUrl, etc.)
 */
export function extractHdImageUrl(result: any): string | null {
  if (!result) return null;

  // Direct string URL or dataUrl
  if (typeof result === 'string') {
    if (result.startsWith('http://') || result.startsWith('https://') || result.startsWith('data:image/')) {
      return result;
    }
    try {
      const parsed = JSON.parse(result);
      return extractHdImageUrl(parsed);
    } catch {
      return null;
    }
  }

  // Object checks
  if (typeof result === 'object') {
    if (result.resultUrl) return result.resultUrl;
    if (result.url) return result.url;
    if (result.imageUrl) return result.imageUrl;
    if (result.downloadUrl) return result.downloadUrl;
    if (result.image) return result.image;
    if (result.photo) return result.photo;

    // Check nested in result.data or result.result
    if (result.data) {
      const nested = extractHdImageUrl(result.data);
      if (nested) return nested;
    }
    if (result.result) {
      const nested = extractHdImageUrl(result.result);
      if (nested) return nested;
    }

    // Check if any value is a valid image URL or data URI
    const values = Object.values(result);
    for (const val of values) {
      if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'))) {
        return val;
      }
    }
  }

  return null;
}
