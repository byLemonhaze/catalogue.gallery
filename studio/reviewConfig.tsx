import { useState, type FormEvent } from 'react'
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
    if (status === 'declined' || status === 'published') return null

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
    // Available from pending (primary) and declined (re-notify). Not from published.
    if (status === 'published') return null

    const publishedId = props.id.replace(/^drafts\./, '')
    const { patch, publish } = useDocumentOperation(publishedId, props.type)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [reasonCode, setReasonCode] = useState('')
    const [customReason, setCustomReason] = useState('')

    const patchDisabled = patch.disabled
    const publishDisabled = publish.disabled
    const operationBlocked = Boolean(patchDisabled || publishDisabled)
    const disabledReason = patchDisabled || publishDisabled

    const requiresCustomReason = reasonCode === 'other'
    const canSubmit =
        Boolean(reasonCode) &&
        (!requiresCustomReason || Boolean(customReason.trim())) &&
        !operationBlocked

    const closeDialog = () => {
        setDialogOpen(false)
    }

    const submitDecline = () => {
        if (!canSubmit) return

        const trimmedNote = customReason.trim()
        const patches: Array<Record<string, unknown>> = [
            {
                set: {
                    status: 'declined',
                    rejectionReasonCode: reasonCode,
                    ...(trimmedNote ? { rejectionReason: trimmedNote } : {}),
                },
            },
        ]
        if (!trimmedNote) {
            patches.push({ unset: ['rejectionReason'] })
        }

        patch.execute(patches)
        publish.execute()
        closeDialog()
        props.onComplete()
    }

    return {
        label: 'Decline & Notify',
        tone: 'caution',
        title: operationBlocked
            ? `Cannot decline yet (${disabledReason})`
            : 'Sets status to declined, selects a rejection reason, publishes, and triggers the rejection email webhook.',
        disabled: operationBlocked,
        onHandle: () => {
            setReasonCode(getStringField(props, 'rejectionReasonCode'))
            setCustomReason(getStringField(props, 'rejectionReason'))
            setDialogOpen(true)
        },
        dialog: dialogOpen
            ? {
                  type: 'dialog' as const,
                  header: 'Decline & Notify',
                  onClose: closeDialog,
                  content: (
                      <form
                          onSubmit={(event: FormEvent) => {
                              event.preventDefault()
                              submitDecline()
                          }}
                          style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}
                      >
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>
                              Choose a rejection reason, then confirm. Publishing triggers the existing
                              decline-email webhook. Applicant email stays in D1 (contactId only in
                              Studio).
                          </p>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                              Rejection reason
                              <select
                                  value={reasonCode}
                                  onChange={(event) => setReasonCode(event.currentTarget.value)}
                                  required
                                  style={{ padding: 8, fontSize: 13 }}
                              >
                                  <option value="">Select a reason…</option>
                                  {REJECTION_REASON_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                          {option.title}
                                      </option>
                                  ))}
                              </select>
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                              Additional note{requiresCustomReason ? ' (required)' : ' (optional)'}
                              <textarea
                                  value={customReason}
                                  onChange={(event) => setCustomReason(event.currentTarget.value)}
                                  rows={4}
                                  required={requiresCustomReason}
                                  placeholder={
                                      requiresCustomReason
                                          ? 'Explain the decline for the applicant…'
                                          : 'Optional note included in the decline email…'
                                  }
                                  style={{ padding: 8, fontSize: 13, resize: 'vertical' }}
                              />
                          </label>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button type="button" onClick={closeDialog}>
                                  Cancel
                              </button>
                              <button type="submit" disabled={!canSubmit}>
                                  Decline & Notify
                              </button>
                          </div>
                      </form>
                  ),
              }
            : null,
    }
}

export function resolveReviewActions(prev: DocumentActionComponent[], schemaType: string) {
    if (!REVIEWABLE_TYPES.has(schemaType)) return prev

    return [ApproveAndNotifyAction, DeclineAndNotifyAction, ...prev]
}
