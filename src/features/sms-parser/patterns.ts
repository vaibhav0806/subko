// SMS patterns for detecting UPI mandates
// These patterns are designed to match common Indian bank SMS formats

export const MANDATE_PATTERNS = {
  // Mandate creation patterns
  created: [
    // "UPI Mandate for Rs.299.00 created for NETFLIX"
    /(?:upi\s*)?mandate\s*(?:for\s*)?(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*(?:created|registered|set\s*up)\s*(?:for|to)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s+via|\s+from|\.|\s*$)/i,

    // "AutoPay registered for Rs.199/month to SPOTIFY"
    /autopay\s*(?:registered|created|set\s*up)\s*(?:for\s*)?(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*(?:\/\w+)?\s*(?:to|for)\s+([A-Za-z0-9\s]+)/i,

    // "Standing instruction created for HDFC ERGO Rs.5000"
    /standing\s*instruction\s*(?:created|registered)\s*(?:for)?\s*([A-Za-z0-9\s]+?)\s*(?:rs\.?\s*)?([0-9,]+)/i,

    // "Recurring payment of Rs.499 set up for AMAZON PRIME"
    /recurring\s*payment\s*(?:of\s*)?(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*(?:set\s*up|created)\s*(?:for|to)\s+([A-Za-z0-9\s]+)/i,
  ],

  // Mandate debit patterns
  debited: [
    // "Rs.299.00 debited from A/C XX1234 for NETFLIX UPI AutoPay"
    /(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*debited\s*(?:from\s*)?(?:a\/c\s*)?(?:xx)?(\d+)?\s*(?:for|towards)\s+([A-Za-z0-9\s]+?)\s*(?:upi\s*)?(?:autopay|mandate|recurring)/i,

    // "UPI Autopay of Rs.499 successful for AMAZON PRIME"
    /(?:upi\s*)?autopay\s*(?:of\s*)?(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*(?:successful|completed|processed)\s*(?:for|to)\s+([A-Za-z0-9\s]+)/i,

    // "Auto debit of Rs.199 for SPOTIFY processed"
    /auto\s*debit\s*(?:of\s*)?(?:rs\.?\s*)?([0-9,]+(?:\.[0-9]{2})?)\s*(?:for|to)\s+([A-Za-z0-9\s]+?)\s*(?:processed|successful|completed)/i,
  ],

  // Mandate revocation patterns
  revoked: [
    // "UPI Mandate for NETFLIX has been revoked"
    /(?:upi\s*)?mandate\s*(?:for)?\s*([A-Za-z0-9\s]+?)\s*(?:has\s*been\s*)?(?:revoked|cancelled|stopped)/i,

    // "AutoPay cancelled for SPOTIFY"
    /autopay\s*(?:cancelled|revoked|stopped)\s*(?:for|to)\s+([A-Za-z0-9\s]+)/i,

    // "Standing instruction for HDFC cancelled"
    /standing\s*instruction\s*(?:for)?\s*([A-Za-z0-9\s]+?)\s*(?:cancelled|revoked)/i,
  ],
};

// Known UPI sender IDs
export const UPI_SENDERS = [
  'HDFCBK', 'ICICIB', 'SBIINB', 'AXISBK', 'KOTAKB', 'PNBSMS',
  'BOIIND', 'IABORB', 'UNIONB', 'ABORIN', 'CANBNK', 'CENTBK',
  'PHONPE', 'GPAYTM', 'PYTM', 'AMAZONP', 'BHIM', 'UPIPAY',
  'PAYTMB', 'AIRTEL', 'JIOPAY', 'MOBIKWK', 'FREECHARGE',
];

// Keywords that indicate UPI mandate SMS
export const MANDATE_KEYWORDS = [
  'mandate', 'autopay', 'auto-pay', 'recurring', 'standing instruction',
  'si ', ' si', 'upi auto', 'auto debit', 'subscription',
];

// Common merchant name mappings for cleaner display
export const MERCHANT_MAPPINGS: Record<string, string> = {
  'NETFLIX': 'Netflix',
  'NETFLIXINC': 'Netflix',
  'SPOTIFY': 'Spotify',
  'SPOTIFYINDIA': 'Spotify',
  'AMAZONPRIME': 'Amazon Prime',
  'AMAZON PRIME': 'Amazon Prime',
  'PRIMEVIDEO': 'Amazon Prime',
  'HOTSTAR': 'Disney+ Hotstar',
  'DISNEYHOTSTAR': 'Disney+ Hotstar',
  'YOUTUBEPREMUIM': 'YouTube Premium',
  'YOUTUBE PREMIUM': 'YouTube Premium',
  'GOOGLESTORAGE': 'Google One',
  'GOOGLEONE': 'Google One',
  'ICLOUD': 'iCloud',
  'APPLEMUSIC': 'Apple Music',
  'JIOSAAVN': 'JioSaavn',
  'GAANA': 'Gaana',
  'WYNK': 'Wynk Music',
  'ZEEPLEX': 'Zee5',
  'ZEE5': 'Zee5',
  'SONYLIV': 'SonyLIV',
  'MXPLAYER': 'MX Player',
  'VOOT': 'Voot',
  'ALTBALAJI': 'ALTBalaji',
  'CULTFIT': 'Cult.fit',
  'CUREFIT': 'Cult.fit',
};
