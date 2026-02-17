import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'
import { resolveReviewActions } from './reviewConfig'

export default defineConfig({
    name: 'default',
    title: 'CATALOGUE Studio',

    projectId: 'ebj9kqfo',
    dataset: 'production',

    plugins: [
        deskTool({
            structure: (S) =>
                S.list()
                    .title('Content')
                    .items([
                        S.listItem()
                            .id('pending-review')
                            .title('In Review (New)')
                            .child(
                                S.documentList()
                                    .id('pending-review-list')
                                    .title('In Review')
                                    .filter('status == "pending"')
                            ),
                        S.listItem()
                            .id('declined-feedback-sent')
                            .title('Declined (Feedback Sent)')
                            .child(
                                S.documentList()
                                    .id('declined-feedback-list')
                                    .title('Declined')
                                    .filter('status == "declined"')
                            ),
                        S.listItem()
                            .id('published-review')
                            .title('Published')
                            .child(
                                S.documentList()
                                    .id('published-review-list')
                                    .title('Published')
                                    .filter('status == "published"')
                            ),
                        S.divider(),
                        ...S.documentTypeListItems()
                    ])
        }),
        visionTool()
    ],

    schema: {
        types: schemaTypes,
    },

    document: {
        actions: (prev, context) => resolveReviewActions(prev, context.schemaType),
    },
})
