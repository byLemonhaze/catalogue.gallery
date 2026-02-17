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
                            .title('In Review (New)')
                            .child(
                                S.documentList()
                                    .title('In Review')
                                    .filter('_type in ["artist", "gallery"] && status == "pending"')
                            ),
                        S.listItem()
                            .title('Declined (Feedback Sent)')
                            .child(
                                S.documentList()
                                    .title('Declined')
                                    .filter('_type in ["artist", "gallery"] && status == "declined"')
                            ),
                        S.listItem()
                            .title('Published')
                            .child(
                                S.documentList()
                                    .title('Published')
                                    .filter('_type in ["artist", "gallery", "collector"] && status == "published"')
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
