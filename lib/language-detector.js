/**
 * Robust Offline Indic Language Detection
 * Handles native scripts (Devanagari, Tamil, Telugu, etc.) 
 * and Romanized Code-Mixing (Hinglish, Tanglish) using stop-word intersection.
 */

// Common high-frequency Hinglish stop words (removed 'me' and 'se' which overlap with English/typos)
const HINGLISH_WORDS = new Set([
  'hai', 'bhi', 'nahi', 'kya', 'aur', 'toh', 'bahut', 'acha', 'kar',
  'mein', 'ko', 'ki', 'ye', 'wo', 'ka', 'ke', 'kyu', 'kyun', 'kuch', 
  'sab', 'ab', 'jab', 'tab', 'hi', 'bhai', 'yaar', 'dikkat', 'bekar', 
  'jaldi', 'hota', 'hoti', 'hua', 'hui', 'wala', 'wali', 'karte', 'karo', 'mujhe', 'mera', 'apna'
]);

// Common high-frequency Tanglish stop words (removed 'da', 'di', 'pa', 'po', 'yen' which overlap with slang/typos)
const TANGLISH_WORDS = new Set([
  'illa', 'irukku', 'romba', 'eppadi', 'nalla', 'vandhu',
  'poda', 'kooda', 'mattum', 'thappu', 'sari', 'seri', 'ethukku', 'inga', 'vanga'
]);

// Basic English stop words (to contrast pure English vs code-mixing)
const ENGLISH_WORDS = new Set([
  'the', 'is', 'was', 'very', 'this', 'that', 'with', 'and', 'but', 'or',
  'not', 'for', 'you', 'it', 'to', 'in', 'on', 'at', 'of', 'a', 'an',
  'good', 'bad', 'worst', 'best', 'great', 'poor', 'nice', 'me'
]);

/**
 * Normalizes text and counts word hits against a specific dictionary Set.
 */
function countMatches(text, wordSet) {
  // Strip punctuation and split by whitespace
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  let count = 0;
  for (const word of words) {
    if (wordSet.has(word)) {
      count++;
    }
  }
  return count;
}

/**
 * Detects the language of a string using Unicode ranges and custom dictionaries.
 * Returns the Prism internal bucket label (e.g. 'Hinglish', 'Hindi (Devanagari)').
 */
export function detectIndicLanguage(text) {
  if (!text || typeof text !== 'string') return "Unknown";
  
  // 1. Check Native Scripts via Unicode Ranges
  // Devanagari: U+0900 – U+097F
  if (/[\u0900-\u097F]/.test(text)) return "Hindi (Devanagari)";
  
  // Bengali: U+0980 – U+09FF
  if (/[\u0980-\u09FF]/.test(text)) return "Bengali";
  
  // Tamil: U+0B80 – U+0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  
  // Telugu: U+0C00 – U+0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
  
  // Kannada: U+0C80 – U+0CFF
  if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";

  // Malayalam: U+0D00 – U+0D7F
  if (/[\u0D00-\u0D7F]/.test(text)) return "Malayalam";

  // Gujarati: U+0A80 – U+0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) return "Gujarati";

  // 2. Romanized Script (Latin) - Distinguish English vs Hinglish vs Tanglish
  const hinglishCount = countMatches(text, HINGLISH_WORDS);
  const tanglishCount = countMatches(text, TANGLISH_WORDS);
  const englishCount = countMatches(text, ENGLISH_WORDS);

  // If we have distinct code-mixing signatures
  if (hinglishCount >= 1 && hinglishCount > tanglishCount) {
    return "Hinglish";
  }
  
  if (tanglishCount >= 1 && tanglishCount > hinglishCount) {
    return "Tanglish";
  }
  
  // If it predominantly has English words or is purely English text
  if (englishCount > 0) {
    return "English";
  }
  
  // Fallback heuristics based on short generic patterns
  // "acha", "bhai" etc might be missed if strictly tokenized but present
  if (text.toLowerCase().includes("hai") || text.toLowerCase().includes("bhai")) {
    return "Hinglish";
  }

  // If no clear signals, default to English for Romanized text
  // as it's the most common baseline.
  return "English";
}
