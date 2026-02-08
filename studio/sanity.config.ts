import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

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
                                    .filter('status == "pending"')
                            ),
                        S.listItem()
                            .title('Published')
                            .child(
                                S.documentList()
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
})
