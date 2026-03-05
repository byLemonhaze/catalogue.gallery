type ArticleEntity = {
    name: string
    id: string
    type?: string
}

const LINK_SENTINEL_PREFIX = '__CATALOGUE_LINK_';
const LINK_SENTINEL_REGEX = /__CATALOGUE_LINK_(\d+)__/g;

export function processArticleContent(content: string, entities: ArticleEntity[]): string {
    // Sort entities by name length descending so "Counterfeit Cards" is linked before "Counterfeit"
    const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length);

    // Protect existing markdown links by swapping them out for null-byte placeholders.
    // This prevents the entity regex from matching names that appear inside URLs or
    // link labels that were added in a previous pass.
    const existingLinks: string[] = [];
    let processedContent = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
        const index = existingLinks.length;
        existingLinks.push(match);
        return `${LINK_SENTINEL_PREFIX}${index}__`;
    });

    sortedEntities.forEach(entity => {
        const name = entity.name;
        const id = entity.id;
        const type = entity.type || 'artist';
        const linkPath = type === 'gallery'
            ? `/gallery/${id}`
            : (type === 'collection' ? `/collection/${id}` : `/artist/${id}`);

        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');

        processedContent = processedContent.replace(regex, (match) => `[${match}](${linkPath})`);

        // Re-protect any links just created before processing the next (shorter) entity
        processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
            const index = existingLinks.length;
            existingLinks.push(match);
            return `${LINK_SENTINEL_PREFIX}${index}__`;
        });
    });

    // Restore all placeholders
    return processedContent.replace(LINK_SENTINEL_REGEX, (_, index) => existingLinks[Number(index)]);
}
