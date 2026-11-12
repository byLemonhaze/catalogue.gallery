import { useLayoutEffect } from 'react';
import { managedMetaNames, applyPageMeta, type PageMeta } from '../lib/seo';
export function Seo({ meta }: { meta: PageMeta }) {
    const html = applyPageMeta('<html><head></head></html>', meta);
    // Update only after React commits the route. Render-time registrations can
    // survive abandoned concurrent renders and retain a previous article's tags.
    useLayoutEffect(() => {
        const head = new DOMParser().parseFromString(html, 'text/html').head;
        // Remove optional tags too (e.g. known image dimensions on home, unknown on an article).
        document.head.querySelectorAll('meta').forEach(node => {
            if (managedMetaNames.has(node.getAttribute('name') || node.getAttribute('property') || '')) node.remove();
        });
        for (const node of Array.from(head.children)) {
            const attribute = node.tagName === 'SCRIPT' ? 'id' : node.tagName === 'META' ? (node.hasAttribute('name') ? 'name' : 'property') : node.tagName === 'LINK' ? 'rel' : null;
            const selector = attribute ? `${node.localName}[${attribute}="${node.getAttribute(attribute)}"]` : node.localName;
            document.head.querySelectorAll(selector).forEach(existing => existing.remove());
            document.head.appendChild(document.importNode(node, true));
        }
    }, [html]);
    return null;
}
