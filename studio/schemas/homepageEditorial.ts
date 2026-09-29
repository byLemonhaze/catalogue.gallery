import { defineType, defineField } from 'sanity';
export default defineType({
    name: 'homepageEditorial', title: 'Homepage editorial selection', type: 'document',
    fields: [
        defineField({ name: 'title', title: 'Internal name', type: 'string', initialValue: 'Homepage selection' }),
        defineField({ name: 'lead', title: 'Lead story', type: 'reference', to: [{ type: 'post' }], description: 'Leave empty to lead with the newest story. Dates are never changed.' }),
        defineField({ name: 'selected', title: 'Worth returning to', type: 'array', of: [{ type: 'reference', to: [{ type: 'post' }] }], validation: rule => rule.max(4).unique(), description: 'Up to four stories in display order. Missing slots use the curated defaults, then older available stories. The lead is excluded automatically.' }),
    ],
    preview: { select: { title: 'title' } },
});
