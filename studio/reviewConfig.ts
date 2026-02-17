import type { DocumentActionComponent, DocumentActionProps } from 'sanity'
import { useDocumentOperation } from 'sanity'

const REVIEWABLE_TYPES = new Set(['artist', 'gallery'])

export const REJECTION_REASON_OPTIONS = [
    { title: 'Personal website required (not social/link hub)', value: 'personal_website_required' },
    { title: 'Website blocks iframe embedding', value: 'iframe_incompatible' },
    { title: 'Site missing artist identity/context', value: 'identity_incomplete' },
    { title: 'Portfolio presentation not ready yet', value: 'portfolio_not_ready' },
    { title: 'Other (add custom note)', value: 'other' },
]

function getDocStatus(props: DocumentActionProps): string | undefined {
    const source = props.draft || props.published
    return source?.status as string | undefined
}

function getStringField(props: DocumentActionProps, fieldName: string): string {
    const source = props.draft || props.published
    const value = source?.[fieldName]
    return typeof value === 'string' ? value.trim() : ''
}

const ApproveAndNotifyAction: DocumentActionComponent = (props) => {
    if (!REVIEWABLE_TYPES.has(props.type)) return null

    const status = getDocStatus(props)
    if (status === 'published') return null

    const publishedId = props.id.replace(/^drafts\./, '')
    const { patch, publish } = useDocumentOperation(publishedId, props.type)

    const patchDisabled = patch.disabled
    const publishDisabled = publish.disabled
    const isDisabled = Boolean(patchDisabled || publishDisabled)
    const disabledReason = patchDisabled || publishDisabled

    return {
        label: 'Approve & Notify',
        tone: 'positive',
        title: isDisabled
            ? `Cannot approve yet (${disabledReason})`
            : 'Sets status to published, publishes the document, and triggers the approval email webhook.',
        disabled: isDisabled,
        onHandle: () => {
            patch.execute([
                { set: { status: 'published' } },
                { unset: ['rejectionReasonCode', 'rejectionReason'] },
            ])
            publish.execute()
            props.onComplete()
        },
    }
}

const DeclineAndNotifyAction: DocumentActionComponent = (props) => {
    if (!REVIEWABLE_TYPES.has(props.type)) return null

    const status = getDocStatus(props)
    if (status === 'declined') return null

    const reasonCode = getStringField(props, 'rejectionReasonCode')
    const customReason = getStringField(props, 'rejectionReason')
    const requiresCustomReason = reasonCode === 'other'
    const missingReasonCode = !reasonCode
    const missingCustomReason = requiresCustomReason && !customReason

    const publishedId = props.id.replace(/^drafts\./, '')
    const { patch, publish } = useDocumentOperation(publishedId, props.type)

    const patchDisabled = patch.disabled
    const publishDisabled = publish.disabled
    const operationBlocked = Boolean(patchDisabled || publishDisabled)

    let title = 'Sets status to declined, publishes the document, and triggers the rejection email webhook.'
    if (missingReasonCode) {
        title = 'Select a rejection reason first.'
    } else if (missingCustomReason) {
        title = 'Add a custom rejection note when reason is "Other".'
    } else if (operationBlocked) {
        title = `Cannot decline yet (${patchDisabled || publishDisabled})`
    }

    const isDisabled = missingReasonCode || missingCustomReason || operationBlocked

    return {
        label: 'Decline & Notify',
        tone: 'caution',
        title,
        disabled: isDisabled,
        onHandle: () => {
            patch.execute([{ set: { status: 'declined' } }])
            publish.execute()
            props.onComplete()
        },
    }
}

export function resolveReviewActions(prev: DocumentActionComponent[], schemaType: string) {
    if (!REVIEWABLE_TYPES.has(schemaType)) return prev

    return [ApproveAndNotifyAction, DeclineAndNotifyAction, ...prev]
}
