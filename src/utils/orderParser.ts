export interface ParsedAmAccount {
  id: string;
  gmail: string;
  inboxurl: string;
  raw?: any;
}

/**
 * Clean and extract pure email address (no extra prefixes/suffixes)
 */
function cleanEmail(text: string): string {
  if (!text) return '';
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (match) return match[0];
  return text.replace(/^(email|gmail|mail|user):\s*/i, '').trim();
}

/**
 * Clean and extract pure URL (no extra prefixes/suffixes)
 */
function cleanUrl(text: string): string {
  if (!text) return '';
  const match = text.match(/https?:\/\/[^\s"'<>|]+/);
  if (match) return match[0];
  return text.replace(/^(inbox|url|link):\s*/i, '').trim();
}

/**
 * Parses any response from AM API into a clean list of accounts with only pure Gmail and pure inboxurl
 */
export function parseAmAccounts(result: any): ParsedAmAccount[] {
  if (!result) return [];

  let items: any[] = [];

  if (Array.isArray(result)) {
    items = result;
  } else if (Array.isArray(result?.results)) {
    items = result.results;
  } else if (Array.isArray(result?.data)) {
    items = result.data;
  } else if (Array.isArray(result?.result)) {
    items = result.result;
  } else if (Array.isArray(result?.accounts)) {
    items = result.accounts;
  } else if (typeof result === 'object') {
    // Check if it's nested
    if (result.results && Array.isArray(result.results)) {
      items = result.results;
    } else if (result.data && Array.isArray(result.data)) {
      items = result.data;
    } else if (result.data && typeof result.data === 'object') {
      return parseAmAccounts(result.data);
    } else if (result.result && typeof result.result === 'object') {
      return parseAmAccounts(result.result);
    } else {
      const directGmail = result.email || result.gmail || result.mail || result.username || result.user;
      const directInbox = result.inboxUrl || result.inboxurl || result.inbox_url || result.url || result.link || result.inbox;
      if (directGmail || directInbox) {
        items = [result];
      } else {
        items = [result];
      }
    }
  } else if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      return parseAmAccounts(parsed);
    } catch {
      const lines = result.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      items = lines;
    }
  }

  const accounts: ParsedAmAccount[] = [];

  items.forEach((item, index) => {
    if (!item) return;

    if (typeof item === 'object') {
      const rawEmail = item.email || item.gmail || item.mail || item.username || item.user || '';
      const rawInbox = item.inboxUrl || item.inboxurl || item.inbox_url || item.url || item.link || item.inbox || '';

      let gmail = cleanEmail(String(rawEmail));
      let inboxurl = cleanUrl(String(rawInbox));

      // If either was not in explicit keys, look through values
      if (!gmail || !inboxurl) {
        const values = Object.values(item).map(v => typeof v === 'object' ? JSON.stringify(v) : String(v));
        if (!gmail) {
          const foundEmailStr = values.find(v => v.includes('@')) || '';
          gmail = cleanEmail(foundEmailStr);
        }
        if (!inboxurl) {
          const foundUrlStr = values.find(v => v.startsWith('http://') || v.startsWith('https://')) || '';
          inboxurl = cleanUrl(foundUrlStr);
        }
      }

      accounts.push({
        id: `am-${index}-${gmail || index}`,
        gmail: gmail,
        inboxurl: inboxurl,
        raw: item
      });
    } else if (typeof item === 'string') {
      const gmail = cleanEmail(item);
      const inboxurl = cleanUrl(item);

      accounts.push({
        id: `am-${index}`,
        gmail,
        inboxurl,
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

  if (typeof result === 'object') {
    if (result.resultUrl) return result.resultUrl;
    if (result.url) return result.url;
    if (result.imageUrl) return result.imageUrl;
    if (result.downloadUrl) return result.downloadUrl;
    if (result.image) return result.image;
    if (result.photo) return result.photo;

    if (result.data) {
      const nested = extractHdImageUrl(result.data);
      if (nested) return nested;
    }
    if (result.result) {
      const nested = extractHdImageUrl(result.result);
      if (nested) return nested;
    }

    const values = Object.values(result);
    for (const val of values) {
      if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'))) {
        return val;
      }
    }
  }

  return null;
}
