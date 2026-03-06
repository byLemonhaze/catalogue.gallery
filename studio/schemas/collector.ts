import { buildCataloguePresentationFields } from './catalogueEntrySchema'

export default {
    name: 'collector',
    title: 'Collector',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
            description: 'Short snippet',
        },
        {
            name: 'description',
            title: 'Description',
            type: 'text',
            description: 'Full bio or description',
        },
        {
            name: 'websiteUrl',
            title: 'Website URL',
            type: 'url',
            validation: (Rule: any) => Rule.required().custom(async (value: string, context: any) => {
                if (!value) return true
                const { document, getClient } = context
                const client = getClient({ apiVersion: '2024-01-01' })
                const id = document._id.replace(/^drafts\./, '')
                const params = {
                    url: value,
                    id,
                    type: document._type
                }
                const query = `!defined(*[_type == $type && !(_id in [$id, "drafts." + $id]) && websiteUrl == $url][0]._id)`
                const result = await client.fetch(query, params)
                return result ? true : 'This URL is already registered.'
            }),
        },
        {
            name: 'contactId',
            title: 'Private Contact ID',
            type: 'string',
            description: 'Reference to private contact storage (Cloudflare D1).',
            hidden: true,
            readOnly: true,
        },
        {
            name: 'email',
            title: 'Legacy Encrypted Contact Email',
            type: 'string',
            description: 'Legacy fallback only. New records should use contactId.',
            hidden: true,
            readOnly: true,
        },
        {
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Pending (In Review)', value: 'pending' },
                    { title: 'Published', value: 'published' },
                ],
                layout: 'radio',
            },
            initialValue: 'pending',
        },
        {
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
        ...buildCataloguePresentationFields(),
    ],
}
