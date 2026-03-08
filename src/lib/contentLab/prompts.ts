/**
 * Voice prompts and topic bank for the content generation pipeline.
 * Written for Grok-4 with live web + X search.
 */

const CATALOGUE_CONTEXT = `
## About CATALOGUE
catalogue.gallery is an independent artist directory covering digital art across Ethereum, Bitcoin Ordinals, generative art, AI-collaborative art, and on-chain creative practices. It is intentionally chain-agnostic. Each profile should lead to the artist's own website or primary presentation layer.

## Key figures you may need to write about
- **Lemonhaze** (Frédérick St-Louis): Paint Engine (generative HTML inscribed on Bitcoin), BEST BEFORE (collab with Ordinally — inscriptions with on-chain expiry), Portrait 2490 (90 AI portraits inscribed sub-300k), Cypherville. $500K+ sales, Sotheby's Contemporary Discoveries 2025.
- **Ordinally** (@veryordinally): Bitcoin Ordinals developer-artist, built the on-chain expiry architecture for BEST BEFORE with Lemonhaze.

These two are less searchable than major artists — use the above as primary context for them.
`;

export const WILDCARD_TOPICS = [
    {
        subject: 'BEST BEFORE by Lemonhaze',
        angle: 'BEST BEFORE is a collaboration between Lemonhaze and Ordinally — inscriptions with a built-in lifespan where each work has a phase, a palette, and a block-countdown expiry encoded on-chain. Ordinally built the on-chain architecture; Lemonhaze built the visual system. The paradox: inscribed permanently on Bitcoin, designed to die. Explore what it means for a digital artwork to expire on the most permanent ledger humanity has built.',
    },
    {
        subject: 'Paint Engine v1.07 by Lemonhaze',
        angle: 'A generative paint engine that lives entirely in a single self-contained HTML file inscribed on Bitcoin. No server, no dependencies — runs in any browser as long as Bitcoin runs. Explore the tool-as-artwork tradition and what it means to sell a system rather than an object.',
    },
    {
        subject: 'Portrait 2490 by Lemonhaze',
        angle: '90 AI-assisted portraits of humans and robots in the year 2490, inscribed on Bitcoin in March 2023. Explore the time capsule logic of early inscription culture and the way early AI aesthetics are now permanently fixed on-chain.',
    },
    {
        subject: 'Cypherville: The Dual Story',
        angle: 'Two collections, one world — Cypherville and DeVille as companion inscriptions with a shared narrative architecture. Explore the collection-as-story model and how a dual-faction structure changes the relationship between works and collectors.',
    },
    {
        subject: 'XCOPY and the aesthetics of dread',
        angle: 'XCOPY’s work — glitch, loop, mortality, dark humor — helped define crypto art’s visual language. Analyze the consistency of the loops, skulls, and corrupted signals, and why the work still feels dangerous years after the mania.',
    },
    {
        subject: 'Claire Silver: taste as the new skill',
        angle: 'Claire Silver argues that in an era of AI-assisted creation, the scarce skill is judgment rather than production. Explore how that claim maps onto art history and how her visual language avoids generic AI output.',
    },
    {
        subject: 'William Mapan and the code that paints',
        angle: 'Mapan’s generative work often reads as landscape even when it is built from geometry. Explore how flow fields, color systems, and painterly code produce that effect.',
    },
    {
        subject: 'Tyler Hobbs and the Fidenza moment',
        angle: 'Explore the Art Blocks generative art moment through Fidenza: why Hobbs and flow fields became a collector obsession, and what the project meant culturally.',
    },
    {
        subject: 'Pak and the mechanics of scarcity',
        angle: 'Pak uses token mechanics as artistic medium. Explore whether works like Merge hold up as conceptual art, financial performance, or both.',
    },
    {
        subject: 'The Rare Pepe lineage and what Bitcoin art really is',
        angle: 'Rare Pepes on Counterparty predate Ethereum NFTs and are central to the origin story of crypto art. Explore how that lineage shapes Ordinals culture differently from Ethereum culture.',
    },
    {
        subject: 'On-chain permanence: what actually lasts',
        angle: 'Explore permanence honestly: inscriptions cannot be deleted, but infrastructure can still fail. Compare blockchain preservation to physical preservation and ask what actually lasts.',
    },
    {
        subject: 'Robness and the case for trash',
        angle: 'Robness’s trash art position rejects polish and prestige. Trace that lineage through post-internet art, early net art, and anti-prestige aesthetics in crypto art.',
    },
    {
        subject: 'What the 2021 NFT mania actually did',
        angle: 'Give an honest accounting of what the NFT bubble changed: artist economics, market structure, legitimacy, exploitation, and the infrastructure that remains.',
    },
];

export const ARTICLE_SYSTEM = `You are a cultural critic and digital art historian writing for CATALOGUE.
${CATALOGUE_CONTEXT}
## Voice
Write with strong, specific arguments. Academic register but readable. Open with the thesis, not background.

## Structure (mandatory)
1. # Title: Subtitle
2. Abstract paragraph with an arguable thesis
3. 3 to 4 section headers
4. Closing paragraph without a "Conclusion" heading

## Hard rules
- Third person. Never "I".
- No fabrication. If a work, date, or sale cannot be confirmed, write around the gap.
- Avoid promotional language.
- 700–950 words
- Return one strict JSON object only`;

export const BLOG_SYSTEM = `You are writing short editorial posts for CATALOGUE.
${CATALOGUE_CONTEXT}
## Voice
Direct, opinionated, and specific. The first sentence must make the point.

## Rules
- First person.
- No throat-clearing.
- No fabrication.
- 250–380 words
- Return one strict JSON object only`;

export const WILDCARD_SYSTEM = `You are writing editorial pieces for CATALOGUE.
${CATALOGUE_CONTEXT}
## Voice
Specific, analytical, and curious. The form should fit the subject.

## Rules
- Dense and factual.
- No vague boosterism.
- 450–700 words
- Return one strict JSON object only`;

export function buildArticlePrompt(artistName: string, artistSubtitle: string, contentBio?: string | null): string {
    const bioBlock = contentBio
        ? `\n\n## From Artist's Own Website (verified — use these facts directly)\n${contentBio}\n`
        : '';

    return `Search for the digital artist ${artistName} — their website, recent releases, recent sales, and relevant discussion.

Artist context: ${artistSubtitle}
${bioBlock}
CHAIN RULE: Confirm from search what platform or chain ${artistName} actually works on. Do not default to Bitcoin Ordinals.

Write a CATALOGUE article grounded in what you find. Use 2 to 3 specific confirmed works. If you cannot confirm a work name or detail, describe the practice instead — never invent.

Return JSON only:
{"title":"...","excerpt":"...","content":"...","tags":["..."]}`;
}

export function buildBlogPrompt(artistName: string, artistSubtitle: string, contentBio?: string | null): string {
    const bioBlock = contentBio
        ? `\n\nFrom their website:\n${contentBio}\n`
        : '';

    return `Search for ${artistName} on the web and X. Find a recent post, release, statement, or concrete moment you can confirm.

Artist context: ${artistSubtitle}
${bioBlock}
CHAIN RULE: Confirm what ${artistName} actually works on from search. Do not default to Bitcoin Ordinals.

Write a short first-person editorial post. Open with the point immediately.

Return JSON only:
{"title":"...","excerpt":"...","content":"...","tags":["..."]}`;
}

export function buildWildcardPrompt(topic: { subject: string; angle: string }): string {
    return `Search for recent discussion or context around the following, then write the piece.

Subject: ${topic.subject}
Angle: ${topic.angle}

Use search to add current specificity. Dense, factual, and non-promotional.

Return JSON only:
{"title":"...","excerpt":"...","content":"...","tags":["..."]}`;
}
