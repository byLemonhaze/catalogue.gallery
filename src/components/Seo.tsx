import { useLayoutEffect } from 'react';
import { applyPageMeta, type PageMeta } from '../lib/seo';
export function Seo({ meta }: { meta: PageMeta }) {
    const html = applyPageMeta('<html><head></head></html>', meta);
    // Update only after React commits the route. Render-time registrations can
    // survive abandoned concurrent renders and retain a previous article's tags.
    useLayoutEffect(() => {
        const head = new DOMParser().parseFromString(html, 'text/html').head;
        for (const node of Array.from(head.children)) {
            const attribute = node.tagName === 'META' ? (node.hasAttribute('name') ? 'name' : 'property') : node.tagName === 'LINK' ? 'rel' : null;
            const selector = attribute ? `${node.localName}[${attribute}="${node.getAttribute(attribute)}"]` : node.localName;
            document.head.querySelectorAll(selector).forEach(existing => existing.remove());
            document.head.appendChild(document.importNode(node, true));
        }
    }, [html]);
    return null;
}
