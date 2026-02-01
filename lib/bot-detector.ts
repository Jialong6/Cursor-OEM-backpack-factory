/**
 * Bot Detection Module
 *
 * Detects web crawlers and bots based on User-Agent string patterns.
 * Used by middleware to bypass locale detection/redirect for bots.
 */

/**
 * Common bot/crawler User-Agent patterns
 *
 * Includes:
 * - Major search engine bots (Google, Bing, Baidu, Yandex)
 * - Social media crawlers (Facebook, Twitter, LinkedIn)
 * - Generic bot patterns (bot, crawler, spider, scraper)
 */
export const BOT_PATTERNS: RegExp[] = [
  // Search engine bots
  /googlebot/i,
  /bingbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i, // Yahoo

  // Social media crawlers
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterestbot/i,
  /slackbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /discordbot/i,

  // SEO and monitoring tools
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,

  // Generic bot patterns
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /headless/i,
  /puppet/i,
  /phantom/i,
  /selenium/i,
];

/**
 * Detects if a User-Agent string belongs to a bot/crawler
 *
 * @param userAgent - The User-Agent string to check
 * @returns true if the User-Agent matches any known bot pattern
 *
 * @example
 * detectBot('Googlebot/2.1') // returns true
 * detectBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64)') // returns false
 */
export function detectBot(userAgent: string): boolean {
  if (!userAgent || typeof userAgent !== 'string') {
    return false;
  }

  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}
