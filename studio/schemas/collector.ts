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
            name: 'email',
            title: 'Email (Optional)',
            type: 'string',
            description: 'Contact email for submission updates (not publicly displayed)',
            validation: (Rule: any) => Rule.email(),
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
        {
            name: 'template',
            title: 'Template',
            type: 'string',
            options: {
                list: [
                    { title: 'External Link (Iframe)', value: 'external' },
                ],
                layout: 'radio',
            },
            initialValue: 'external',
        },
        {
            name: 'desktopExitPosition',
            title: 'Exit Button Position (Desktop)',
            type: 'string',
            options: {
                list: [
                    { title: 'Top Right', value: 'top-right' },
                    { title: 'Top Left', value: 'top-left' },
                    { title: 'Top Center', value: 'top-center' },
                    { title: 'Bottom Right', value: 'bottom-right' },
                    { title: 'Bottom Left', value: 'bottom-left' },
                ],
                layout: 'radio',
            },
            initialValue: 'top-right',
        },
        {
            name: 'mobileExitPosition',
            title: 'Exit Button Position (Mobile)',
            type: 'string',
            options: {
                list: [
                    { title: 'Bottom Center', value: 'bottom-center' },
                    { title: 'Top Right', value: 'top-right' },
                    { title: 'Top Left', value: 'top-left' },
                    { title: 'Top Center', value: 'top-center' },
                ],
                layout: 'radio',
            },
            initialValue: 'bottom-center',
        },
    ],
}
