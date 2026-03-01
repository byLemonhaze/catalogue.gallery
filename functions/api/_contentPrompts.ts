/**
 * Voice prompts and topic bank for the content generation pipeline.
 * Three distinct voices — Article, Blog, Wildcard.
 */

// ─── Wild card topic bank ────────────────────────────────────────────────────
// These rotate randomly. Mix of ecosystem, collection spotlights, and broader ideas.
export const WILDCARD_TOPICS = [
    // Collection spotlights
    { subject: 'BEST BEFORE by Lemonhaze', angle: 'An exploration of BEST BEFORE — Bitcoin-inscribed artworks with a built-in expiry mechanic. What does it mean for a digital work to die on-chain?' },
    { subject: 'Anticyclone by William Mapan', angle: 'Anticyclone as a landmark in generative art — the aesthetics of code that became landscape, and Mapan\'s visual language of systems.' },
    { subject: 'Portrait 2490 by Lemonhaze', angle: 'A collection made in 2023 imagining 2490 — AI-assisted portraits locked permanently on Bitcoin. The time capsule logic of inscription.' },
    { subject: 'Cypherville: The Dual Story', angle: 'Two factions, one world. The narrative structure of Cypherville and DeVille as a model for collection-as-story on Bitcoin.' },
    { subject: 'XCOPY and the aesthetics of dread', angle: 'XCOPY\'s visual world — glitch, mortality, loop — and why his work still feels dangerous even to collectors who have held it for years.' },
    { subject: 'Claire Silver and AI collaboration', angle: 'Claire Silver\'s approach to AI as co-author, not tool. What authorship means when the system has creative agency.' },
    // Broader ecosystem
    { subject: 'The iframe as exhibition space', angle: 'catalogue.gallery loads artist websites in iframes. What does it mean to treat the browser window as a gallery? The aesthetics of containment.' },
    { subject: 'On-chain permanence vs curatorial decay', angle: 'Bitcoin inscriptions cannot be deleted. Traditional galleries deaccession. What does permanence change about how we think about art collections?' },
    { subject: 'Generative tools as artist instruments', angle: 'Paint engines, palette generators, code sketches — when a tool becomes the work. The lineage from Sol LeWitt to Fidenza.' },
    { subject: 'What collector trust looks like in 2026', angle: 'Provenance on-chain, wallets as identity, decentralized galleries. How has the relationship between artists and collectors changed since 2021?' },
    { subject: 'The custom domain as artistic statement', angle: 'catalogue.gallery requires a personal website. Why does having your own domain matter in an era of platform dependency?' },
    { subject: 'Ordinals vs Ethereum: aesthetic differences', angle: 'The cultural and aesthetic differences between the Ordinals ecosystem and Ethereum-native NFT culture. Different values produce different work.' },
    { subject: 'Physical prints of digital-native work', angle: 'When does a Bitcoin inscription become a wall object? The logic of archival prints, signed editions, and the bridge between on-chain and physical.' },
    { subject: 'Rare Scrilla and the trading card tradition', angle: 'The Bitcoin trading card lineage — from Rare Pepes to modern card collections. Scrilla\'s place in that history.' },
    { subject: 'The 1/1 vs generative collection debate', angle: 'One-of-ones carry a different weight than 10,000-piece collections. Is scarcity constructed or felt? A look at both sides.' },
];

// ─── System prompts (voices) ─────────────────────────────────────────────────

export const ARTICLE_SYSTEM = `You are a cultural critic and digital art historian writing for CATALOGUE — an independent artist directory focused on Bitcoin Ordinals, generative art, and digital-native work.

Your voice: analytical, grounded in art history, but accessible. You reference real movements, specific works, and cultural context without being academic to the point of alienation. Think Frieze essay meets online criticism — intelligent, specific, no filler.

Write in third person. No first-person "I". No marketing language. No hype. No "groundbreaking", "revolutionary", or "game-changing".

Structure: lead with a specific observation or image, develop through 3-4 sections, close with a question or open observation rather than a conclusive summary. Use ## for section headings. Aim for 900-1200 words.`;

export const BLOG_SYSTEM = `You are writing a short editorial post for CATALOGUE — an independent directory of digital artists with a focus on Bitcoin Ordinals and generative work.

Your voice: sharp, direct, opinionated, first-person ("I think", "what strikes me"). Fast read. One strong idea per post. Think of it as the kind of thing you'd post as a long tweet but give it room to breathe. Conversational but not casual.

No hedging. No preamble. Start with the point. Close without summarizing — just end when you're done.

Avoid: marketing language, hype, "this is important because", padding. 280-400 words maximum.`;

export const WILDCARD_SYSTEM = `You are writing a freeform editorial piece for CATALOGUE — an independent directory of digital artists with a focus on Bitcoin Ordinals, generative art, and the broader digital art ecosystem.

Your voice: curious, specific, ranging. This piece can be a collection spotlight, a provocation, a short essay, a list, a market observation, or a cultural note. No fixed format — let the subject determine the form.

Be specific about works, artists, dates, and prices when relevant. Avoid vague ecosystem boosterism. Aim for something a collector or artist would actually find interesting to read. 400-600 words.`;

// ─── User prompt builders ────────────────────────────────────────────────────

export function buildArticlePrompt(artistName: string, artistSubtitle: string): string {
    return `Write a CATALOGUE article about the digital artist ${artistName} — ${artistSubtitle}.

Focus on their practice, aesthetic, and significance within the broader landscape of digital and Bitcoin-native art. Be specific about what makes their work distinctive. Do not write a biography — write a critical engagement with the work and its context.

Return a JSON object with this exact shape:
{
  "title": "...",
  "excerpt": "...(1-2 sentences, no spoilers)",
  "content": "...(full article in markdown)",
  "tags": ["...", "..."]
}`;
}

export function buildBlogPrompt(artistName: string, artistSubtitle: string): string {
    return `Write a short CATALOGUE blog post. Pick one specific thing about ${artistName} — ${artistSubtitle} — that you find genuinely interesting, surprising, or worth saying out loud. Could be about the work, the approach, a specific piece, or something they represent in the space.

Return a JSON object with this exact shape:
{
  "title": "...",
  "excerpt": "...(1 sentence hook)",
  "content": "...(full post in markdown)",
  "tags": ["...", "..."]
}`;
}

export function buildWildcardPrompt(topic: { subject: string; angle: string }): string {
    return `Write a CATALOGUE wildcard piece on the following subject:

Subject: ${topic.subject}
Angle: ${topic.angle}

Let the subject determine the form — essay, list, provocation, spotlight, observation. Be specific, avoid vague praise.

Return a JSON object with this exact shape:
{
  "title": "...",
  "excerpt": "...(1-2 sentences)",
  "content": "...(full piece in markdown)",
  "tags": ["...", "..."]
}`;
}
