import { REJECTION_REASON_OPTIONS } from '../reviewConfig'

export default {
    name: 'artist',
    title: 'Artist',
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
            description: 'Short snippet, e.g. "Generative Art & AI"',
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
                    { title: 'Declined', value: 'declined' },
                ],
                layout: 'radio',
            },
            initialValue: 'pending',
        },
        {
            name: 'approvalMessage',
            title: 'Approval Note (Optional)',
            type: 'text',
            description: 'Optional personal note sent in the approval email.',
            hidden: ({ document }: any) => document?.status !== 'published',
        },
        {
            name: 'rejectionReasonCode',
            title: 'Rejection Reason',
            type: 'string',
            description: 'Choose the main reason shown in the rejection email.',
            options: {
                list: REJECTION_REASON_OPTIONS,
                layout: 'dropdown',
            },
            hidden: ({ document }: any) => document?.status !== 'declined',
            validation: (Rule: any) => Rule.custom((value: string | undefined, context: any) => {
                if (context.document?.status !== 'declined') return true
                return value ? true : 'Select a rejection reason before sending decline email.'
            }),
        },
        {
            name: 'rejectionReason',
            title: 'Rejection Details (Optional)',
            type: 'text',
            description: 'Optional extra note for the applicant. Required if reason is "Other".',
            hidden: ({ document }: any) => document?.status !== 'declined',
            validation: (Rule: any) => Rule.custom((value: string | undefined, context: any) => {
                if (context.document?.status !== 'declined') return true
                if (context.document?.rejectionReasonCode === 'other') {
                    return value?.trim() ? true : 'Add details when reason is "Other".'
                }
                return true
            }),
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
            name: 'contentBio',
            title: 'Research Bio (Content Lab)',
            type: 'text',
            rows: 8,
            description: 'Auto-generated from artist website. Used by Content Lab as primary source for article/blog generation. Can be manually curated.',
        },
        {
            name: 'contentBioUpdatedAt',
            title: 'Research Bio Last Updated',
            type: 'datetime',
            readOnly: true,
            hidden: true,
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
