export function processArticleContent(content: string, entities: any[]): string {
    // Sort entities by name length descending to ensure we match "Counterfeit Cards" before "Counterfeit"
    const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

    let processedContent = content;

    sortedEntities.forEach(entity => {
        const name = entity.name;
        const id = entity.id;
        const type = entity.type || 'artist';
        const linkPath = type === 'collection' ? `/collection/${id}` : `/artist/${id}`;

        // Regex explanation:
        // (?<!\[)           - Not preceded by '[' (not already inside a link label)
        // \b                - Word boundary
        // ${name}           - The entity name
        // \b                - Word boundary
        // (?!\]\s*\()       - Not followed by '](...)' (not already a link)
        // Note: JS doesn't support complex negative lookbehind/lookahead in all environments, 
        // but for basic word boundaries and simple lookaheads it should work in modern browsers.
        // We'll use a simpler approach to avoid breaking existing markdown links.

        // Escape name for regex
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Find occurrences that are NOT already part of a markdown link
        // This is a basic heuristic: find name followed by word boundary, 
        // and ensure it's not followed by ']' part of a link.
        const regex = new RegExp(`\\b${escapedName}\\b(?![^\\[]*\\])`, 'g');

        processedContent = processedContent.replace(regex, (match) => {
            return `[${match}](${linkPath})`;
        });
    });

    return processedContent;
}
