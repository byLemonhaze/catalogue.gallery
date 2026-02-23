const CONTACT_ID_PREFIX = 'ct_'

type D1Row = Record<string, unknown>

type D1PreparedStatement = {
    bind: (...values: unknown[]) => {
        first: <T extends D1Row = D1Row>() => Promise<T | null>
        run: () => Promise<unknown>
    }
}

export type D1DatabaseLike = {
    prepare: (query: string) => D1PreparedStatement
}

export type ContactStoreBindings = {
    CONTACTS_DB?: D1DatabaseLike
}

function getContactsDb(env: ContactStoreBindings): D1DatabaseLike | null {
    const candidate = env.CONTACTS_DB
    if (candidate && typeof candidate.prepare === 'function') {
        return candidate
    }
    return null
}

export function hasContactStore(env: ContactStoreBindings) {
    return getContactsDb(env) !== null
}

function generateContactId() {
    return `${CONTACT_ID_PREFIX}${crypto.randomUUID().replace(/-/g, '')}`
}

export async function createContact(env: ContactStoreBindings, encryptedEmail: string) {
    const db = getContactsDb(env)
    if (!db) return null

    const contactId = generateContactId()
    await db
        .prepare(
            `INSERT INTO submission_contacts (
                id,
                email_ciphertext
            ) VALUES (?1, ?2)`,
        )
        .bind(contactId, encryptedEmail)
        .run()

    return contactId
}

export async function readContactCiphertext(env: ContactStoreBindings, contactId: string) {
    const db = getContactsDb(env)
    if (!db) return null

    const row = await db
        .prepare(
            `SELECT email_ciphertext
             FROM submission_contacts
             WHERE id = ?1
             LIMIT 1`,
        )
        .bind(contactId)
        .first<{ email_ciphertext?: string }>()

    const value = row?.email_ciphertext
    return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function markContactNotified(env: ContactStoreBindings, contactId: string) {
    const db = getContactsDb(env)
    if (!db) return

    await db
        .prepare(
            `UPDATE submission_contacts
             SET notification_count = notification_count + 1,
                 last_notified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE id = ?1`,
        )
        .bind(contactId)
        .run()
}
