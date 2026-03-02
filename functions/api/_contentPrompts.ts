/**
 * Voice prompts and topic bank for the content generation pipeline.
 * Written for Grok-4 with live web + X search — prompts are lean.
 * Grok-4 already knows the crypto art ecosystem; we inject only
 * CATALOGUE-specific context, voice, and hard rules.
 */

// ─── CATALOGUE context (injected into every system prompt) ───────────────────
const CATALOGUE_CONTEXT = `
## About CATALOGUE
catalogue.gallery is an independent artist directory covering digital art across Ethereum, Bitcoin Ordinals, generative art, AI-collaborative art, and on-chain creative practices. It is intentionally chain-agnostic — artists are listed regardless of what platform or blockchain they work on. Each profile shows the artist's own website in an iframe; a personal website with a custom domain is required to be listed. Currently ~47 artists and galleries.

## Key figures you may need to write about
- **Lemonhaze** (Frédérick St-Louis): Paint Engine (generative HTML inscribed on Bitcoin), BEST BEFORE (collab with Ordinally — inscriptions with on-chain expiry), Portrait 2490 (90 AI portraits inscribed sub-300k), Cypherville. $500K+ sales, Sotheby's Contemporary Discoveries 2025.
- **Ordinally** (@veryordinally): Bitcoin Ordinals developer-artist, built the on-chain expiry architecture for BEST BEFORE with Lemonhaze.

These two are less searchable than major artists — use the above as primary context for them.
`;

// ─── Wild card topic bank ────────────────────────────────────────────────────
export const WILDCARD_TOPICS = [
    {
        subject: 'BEST BEFORE by Lemonhaze',
        angle: 'BEST BEFORE is a collaboration between Lemonhaze and Ordinally — inscriptions with a built-in lifespan where each work has a phase, a palette, and a block-countdown expiry encoded on-chain. Ordinally built the on-chain architecture; Lemonhaze built the visual system. The paradox: inscribed permanently on Bitcoin, designed to die. Explore what it means for a digital artwork to expire on the most permanent ledger humanity has built. Compare to traditional works with intentional obsolescence (Tinguely\'s self-destroying sculpture, On Kawara\'s date paintings, the Happening as ephemeral form). What does the collector relationship look like when the work has a death date — and what does it mean that the death is permanently recorded?'
    },
    {
        subject: 'Paint Engine v1.07 by Lemonhaze',
        angle: 'A generative paint engine that lives entirely in a single self-contained HTML file inscribed on Bitcoin. No server, no dependencies — runs in any browser as long as Bitcoin runs. Explore the tool-as-artwork tradition (from Sol LeWitt\'s instructions to Vera Molnár\'s early plotter programs), the seed + tag determinism system, and the business model dimension: custom engines for spaces, physical prints, the hotel corridor application. What does it mean to sell a system rather than an object?'
    },
    {
        subject: 'Portrait 2490 by Lemonhaze',
        angle: '90 AI-assisted portraits of humans and robots in the year 2490, inscribed on Bitcoin in March 2023 (sub-300k). A time capsule made at the intersection of early AI image generation and on-chain permanence. The images are locked: a 2023 imagination of 500 years hence, permanent. Explore the time capsule logic of early inscription numbers, the question the collection poses ("what are we going to look like down the road?"), and the specific historical moment of early-2023 AI aesthetics now preserved forever.'
    },
    {
        subject: 'Cypherville: The Dual Story',
        angle: 'Two collections, one world — Cypherville and DeVille as companion inscriptions with a shared narrative architecture. Explore the collection-as-story model: how does giving a collection a dual-faction structure change the relationship between works and between collectors? The 3D carousel site and the dual-entry structure as curatorial choices.'
    },
    {
        subject: 'XCOPY and the aesthetics of dread',
        angle: 'XCOPY\'s work — glitch, loop, mortality, dark humor — predates and in some ways defines crypto art\'s default visual language. "Right-click and Save As guy" sold for 1,600 ETH. Analyze his consistent visual grammar: the flickering frames, the skulls, the corrupted signals. Why does his work still feel dangerous years after the mania? Compare to the tradition of memento mori in Western painting. The loop as medium: why a GIF rather than a still?'
    },
    {
        subject: 'Claire Silver: taste as the new skill',
        angle: 'Claire Silver\'s argument is deceptively simple: in an era of AI-assisted creation, the skill is curation — what you ask for, what you reject, what you recognize as good. Explore this claim seriously. How does it map onto traditional art history (the artist-craftsman split, conceptual art)? What does her work actually look like and how does it differ from generic AI output? The softness and femininity of her aesthetic as deliberate contrast to crypto culture\'s hardness.'
    },
    {
        subject: 'William Mapan and the code that paints',
        angle: 'Anticyclone (2023) and Dragons (Art Blocks, 2022) — Mapan\'s generative work reads as landscape even when it\'s pure geometry. How does he achieve that painterly quality through code? Explore flow fields, noise functions, and color palette design as artistic decisions. The French generative tradition (Vera Molnár was French). What distinguishes Mapan\'s aesthetic choices from other Art Blocks artists working with similar technical foundations?'
    },
    {
        subject: 'Tyler Hobbs and the Fidenza moment',
        angle: 'Fidenza #313 sold for 1,000 ETH. What did that mean? Explore the Art Blocks generative art moment of 2021 — why flow fields and Hobbs specifically captured collector imagination. The algorithm behind Fidenza: quilt-like rectangular blocking, organic flow field curves, carefully curated color palettes. Hobbs\' background in CS and the argument that technical understanding enables better aesthetic decisions. QQL and the experiment of involving collectors in generation.'
    },
    {
        subject: 'Pak and the mechanics of scarcity',
        angle: 'Pak\'s Merge (2021) generated $91.8M in total revenue and introduced mass tokens that combined when held in the same wallet. The Fungible collection offered one-of-one, editions, and open editions simultaneously. Pak uses token mechanics as artistic medium — the smart contract IS the work, not just the vessel. Explore the conceptual lineage (Yoko Ono\'s instruction pieces, Duchamp\'s readymades) and whether Pak\'s work holds up as art or is primarily financial performance.'
    },
    {
        subject: 'The Rare Pepe lineage and what Bitcoin art really is',
        angle: 'Rare Pepes on Counterparty (2016-2018) predate Ethereum NFTs and are the genuine origin of crypto art as a scene. The Rare Pepe Directory, the Fake Rare phenomenon, Homer Pepe at $38,500. How does this lineage shape Ordinals culture differently from Ethereum culture? The meme-as-art argument. Rare Scrilla\'s place in the trading card tradition. Why Bitcoin collectors who know this history see Ordinals as homecoming rather than innovation.'
    },
    {
        subject: 'On-chain permanence: what actually lasts',
        angle: 'Bitcoin inscriptions cannot be deleted. But Bitcoin could theoretically fail. Smart contract platforms have been upgraded, forked, shut down. The links in OpenSea\'s early NFTs pointed to servers that no longer exist. Explore the actual permanence question honestly — what infrastructure bets are we making when we inscribe? Compare to physical art preservation: most art is lost, the survivors are accidents. Is Bitcoin\'s model actually more permanent or just differently fragile?'
    },
    {
        subject: 'The iframe as gallery space',
        angle: 'catalogue.gallery shows each artist\'s own website inside an iframe. The browser window becomes a vitrine. Explore the aesthetics and politics of this choice: the artist retains full control of their space, the gallery merely frames it. Compare to white cube gallery walls as neutral container — is the iframe more honest? The technical constraint (some sites block iframes via X-Frame-Options) as curation. What does it mean that the gallery\'s primary content is literally someone else\'s website?'
    },
    {
        subject: 'Generative art and the Sol LeWitt problem',
        angle: 'Sol LeWitt\'s wall drawings were instructions — anyone could execute them, they were still his. Generative art raises the same question at scale: if the algorithm produces the output, who made it? Trace the lineage from LeWitt and Molnár through Manfred Mohr to Art Blocks. The "long-form generative" format (one algorithm, many outputs, all distinct, all the same artist) as a specific solution to the authorship problem. Hobbs, Mapan, Zancan as case studies.'
    },
    {
        subject: 'Robness and the case for trash',
        angle: '"Trash art" is Robness\'s explicit position: low-fi, cheap-looking, found imagery, deliberately anti-prestige. Why is this a legitimate and interesting position in 2026? Trace the lineage — post-internet art (Artie Vierkant, Petra Cortright), early net art, the GIF as low-status medium that became high-status. Robness as contrarian holding the line against the aestheticization of crypto art. The argument that roughness is more honest than polish in a space that\'s fundamentally about speculation.'
    },
    {
        subject: 'What the 2021 NFT mania actually did',
        angle: 'The 2021 NFT market was irrational, exploitative, and largely speculative. It also permanently changed the economics of digital art. Artists who would have given their work away for free in 2019 sold 1/1s for ETH equivalent to a year\'s salary. The mania is over but the infrastructure remains and the cultural legitimacy (contested but real) remains. An honest accounting: what was gained, what was lost, who was hurt, and what the lasting changes are.'
    },
];

// ─── System prompts ───────────────────────────────────────────────────────────

export const ARTICLE_SYSTEM = `You are a cultural critic and digital art historian writing for CATALOGUE — an independent directory of digital artists.
${CATALOGUE_CONTEXT}
## Voice
You write like someone who has followed this space since 2016 with strong, specific opinions. Academic register but readable — arguments, not descriptions. Frieze meets close technical reading.

Examples:
> "Claire Silver's most repeated provocation, 'taste is the new skill,' is often misunderstood as anti-craft. It is better read as a historical argument: image culture has moved from scarcity of production toward scarcity of judgment."
> "Lemonhaze understood this pitch — and then deliberately broke it. In the BEST BEFORE collection, each work carries an expiry date encoded directly into its on-chain metadata. In a medium that fetishizes forever, Lemonhaze made temporality the primary artistic material."

Strong conceptual thesis opened immediately. Specific works named. Art-historical lineages drawn. No praise language. No career recap.

## Structure (mandatory)
1. **# Title: Subtitle** — evocative, not name-first, angles into the argument
2. **Abstract paragraph** — 2–4 sentences, bold arguable thesis
3. **## Section 1** — conceptual or historical frame
4. **## Section 2** — close reading of 2–3 specific works with names and dates
5. **## Section 3** — critical argument developed through the work
6. **## Section 4** (optional) — implication, comparison, unresolved tension
7. Final paragraph — opens outward, no "Conclusion" heading, no summary

## Hard rules
- Third person. Never "I".
- No fabrication: only include work names, prices, dates you can confirm from search or the provided source. Write around gaps — don't fill them.
- Ban list: "groundbreaking", "revolutionary", "pioneering", "visionary", "game-changing", "pushes boundaries", "blurs the line"
- Draw a real art-historical lineage (Sol LeWitt, Duchamp, Vera Molnár, conceptual art, etc.)
- 700–950 words
- Return one strict JSON object only (no prose before/after)`;

export const BLOG_SYSTEM = `You are writing short editorial posts for CATALOGUE — an independent directory of digital artists.
${CATALOGUE_CONTEXT}
## Voice
Personal, direct, opinionated. One strong observation with confidence. Like a sharp gallery note or first paragraph of a review.

Example:
> "It is impossible to talk about digital art without talking about Mike Winkelmann. But looking past the $69 million gavel drop at Christie's, there is a simpler, more brutal truth to his success: consistency. Beeple didn't ask for permission. He simply sat down, every single day for over 5,000 days, and made something."

Opens with the point. Names a specific fact. Arrives at an argument quickly. No setup.

## Rules
- First person. "I think", "what strikes me", "the honest answer is".
- First sentence IS the point — never throat-clear
- End when the idea is complete. No summaries.
- No fabrication: only specific works or moments you can confirm.
- 250–380 words. Hard limit.
- Return one strict JSON object only (no prose before/after)`;

export const WILDCARD_SYSTEM = `You are writing editorial pieces for CATALOGUE — an independent directory of digital artists covering Ethereum, Bitcoin Ordinals, generative art, and on-chain creative practices.
${CATALOGUE_CONTEXT}
## Voice
Curious and ranging. Collection spotlights, provocations, historical deep-dives, market observations. The format should emerge from the subject.

## Rules
- Dense and specific: art history, technical facts, market context, actual works.
- No vague boosterism. Write something a collector or serious artist would find genuinely interesting.
- Don't moralize. The reader knows the space is important.
- 450–700 words.
- Return one strict JSON object only (no prose before/after).`;

// ─── User prompt builders ────────────────────────────────────────────────────

export function buildArticlePrompt(artistName: string, artistSubtitle: string, contentBio?: string | null): string {
    const bioBlock = contentBio
        ? `\n\n## From Artist's Own Website (verified — use these facts directly)\n${contentBio}\n`
        : '';

    return `Search for the digital artist ${artistName} — their X/Twitter, website, recent releases, recent sales, community discussions.

Artist context: ${artistSubtitle}
${bioBlock}
CHAIN RULE: Confirm from search what platform/chain ${artistName} actually works on. Do not default to Bitcoin Ordinals. Only mention it if confirmed.

Write a CATALOGUE article grounded in what you find. Use 2–3 specific confirmed works. If you can't confirm a work name or detail, describe the practice instead — never invent.

Structure:
- # Conceptual Title: Subtitle (not name-first)
- Abstract (bold arguable thesis)
- ## 3–4 evocative section headers
- Closing paragraph that opens outward

700–950 words. This article is ENTIRELY about ${artistName}.

Return JSON only:
{"title":"...","excerpt":"...(1–2 sentences, sharpest version of thesis)","content":"...(full markdown)","tags":["..."]}`;
}

export function buildBlogPrompt(artistName: string, artistSubtitle: string, contentBio?: string | null): string {
    const bioBlock = contentBio
        ? `\n\nFrom their website:\n${contentBio}\n`
        : '';

    return `Search for ${artistName} on X.com and the web — find their most recent post, drop, or moment generating discussion.

Artist context: ${artistSubtitle}
${bioBlock}
CHAIN RULE: Confirm what ${artistName} actually works on from search. Do not default to Bitcoin Ordinals.

Find ONE specific thing you can confirm — a recent post, work, statement, moment — and open with it directly. No setup. If nothing recent surfaces, write about the most specific confirmed aspect of their practice.

250–380 words. First person. This post is ENTIRELY about ${artistName}.

Return JSON only:
{"title":"...","excerpt":"...(1 sentence)","content":"...(markdown, 250–380 words, opens directly with the observation)","tags":["..."]}`;
}

export function buildWildcardPrompt(topic: { subject: string; angle: string }): string {
    return `Search for recent discussion or context around the following, then write the piece.

Subject: ${topic.subject}
Angle: ${topic.angle}

Use search to add current specificity on top of the angle above. Dense — art history, technical facts, market context, specific works. Don't be vague or promotional.

Return JSON only:
{"title":"...","excerpt":"...(1–2 sentences)","content":"...(markdown, 450–650 words)","tags":["..."]}`;
}
