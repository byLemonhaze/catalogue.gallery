export default {
    name: 'post',
    title: 'Post',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 140,
            },
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'type',
            title: 'Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Article', value: 'Article' },
                    { title: 'Blog', value: 'Blog' },
                    { title: 'Interview', value: 'Interview' },
                ],
                layout: 'radio',
            },
            initialValue: 'Article',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'author',
            title: 'Author',
            type: 'string',
            initialValue: 'CATALOGUE',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'featuredArtist',
            title: 'Featured Artist',
            type: 'reference',
            description: 'Used as the default social/thumbnail image source for this post.',
            to: [
                { type: 'artist' },
                { type: 'gallery' },
                { type: 'collector' },
            ],
        },
        {
            name: 'displayDate',
            title: 'Display Date',
            type: 'string',
            description: 'Shown exactly as written in the article header (example: "February 16, 2026").',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'publishedAt',
            title: 'Published At',
            type: 'datetime',
            description: 'Optional sort/reference datetime.',
        },
        {
            name: 'sortOrder',
            title: 'Sort Order',
            type: 'number',
            description: 'Lower values appear first in list order.',
        },
        {
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3,
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'thumbnail',
            title: 'Thumbnail',
            type: 'image',
            options: {
                hotspot: true,
            },
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'thumbnailPath',
            title: 'Legacy Thumbnail Path',
            type: 'string',
            description: 'Optional fallback path from the legacy local article system.',
        },
        {
            name: 'content',
            title: 'Content (Markdown)',
            type: 'text',
            rows: 24,
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'migratedFromId',
            title: 'Migrated From ID',
            type: 'string',
            readOnly: true,
            hidden: ({ value }: any) => !value,
        },
    ],
    preview: {
        select: {
            title: 'title',
            subtitle: 'type',
            media: 'thumbnail',
        },
    },
}
