const { getCliClient } = require('sanity/cli')

const PREFIX = 'enc:v1:'
const IV_LENGTH = 12

function toBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function importKey(keyInput) {
  const trimmed = (keyInput || '').trim()
  if (!trimmed) {
    throw new Error('EMAIL_ENCRYPTION_KEY is missing')
  }
  const keyBytes = fromBase64(trimmed)
  if (keyBytes.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY must decode to 32 bytes (base64)')
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt'])
}

async function encryptEmail(email, keyInput) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return ''
  const key = await importKey(keyInput)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const plaintext = new TextEncoder().encode(normalizedEmail)
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext))
  return `${PREFIX}${toBase64(iv)}:${toBase64(encrypted)}`
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

async function run() {
  const keyInput = process.env.EMAIL_ENCRYPTION_KEY
  const client = getCliClient({ apiVersion: '2024-01-01' })

  const docs = await client.fetch(
    '*[_type in ["artist","gallery","collector"] && defined(email)]{_id,_type,name,email}',
  )

  let converted = 0
  let skipped = 0

  for (const doc of docs) {
    const raw = String(doc.email || '').trim()
    if (!raw) {
      skipped += 1
      continue
    }

    if (isEncrypted(raw)) {
      skipped += 1
      continue
    }

    const encrypted = await encryptEmail(raw, keyInput)
    await client.patch(doc._id).set({ email: encrypted }).commit({ autoGenerateArrayKeys: false })
    converted += 1
    console.log(`encrypted ${doc._type}/${doc._id} (${doc.name || 'unnamed'})`)
  }

  console.log(`done: converted=${converted}, skipped=${skipped}, total=${docs.length}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
