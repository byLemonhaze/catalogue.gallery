/* eslint-disable no-console */
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const path = require('node:path')
const { getCliClient } = require('sanity/cli')

const CONTACT_ID_PREFIX = 'ct_'

function generateContactId() {
  return `${CONTACT_ID_PREFIX}${crypto.randomUUID().replace(/-/g, '')}`
}

function sqlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function runD1Insert({ dbName, contactId, ciphertext, remote }) {
  const command = `INSERT OR IGNORE INTO submission_contacts (id, email_ciphertext) VALUES (${sqlQuote(contactId)}, ${sqlQuote(ciphertext)})`
  const args = ['wrangler', 'd1', 'execute', dbName, '--command', command]
  if (remote) args.push('--remote')

  const repoRoot = path.resolve(__dirname, '..', '..')
  execFileSync('npx', args, {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
}

async function main() {
  const dbName = (process.env.CONTACTS_DB_NAME || 'catalogue-private-contacts').trim()
  const remote = process.env.D1_REMOTE !== 'false'
  const unsetLegacyEmail = process.env.UNSET_LEGACY_EMAIL !== 'false'

  if (!dbName) {
    throw new Error('CONTACTS_DB_NAME is missing')
  }

  const client = getCliClient({ apiVersion: '2024-01-01' })
  const docs = await client.fetch(
    '*[_type in ["artist","gallery","collector"] && defined(email) && !defined(contactId)]{_id,_type,name,email}',
  )

  if (!Array.isArray(docs) || docs.length === 0) {
    console.log('No legacy documents need migration.')
    return
  }

  console.log(`Found ${docs.length} legacy documents without contactId.`)

  let moved = 0
  let skipped = 0
  const migrated = []

  for (const doc of docs) {
    const encryptedEmail = String(doc.email || '').trim()
    if (!encryptedEmail) {
      skipped += 1
      continue
    }
    if (!encryptedEmail.startsWith('enc:v1:')) {
      console.warn(`Skipping ${doc._id} (${doc.name || doc._type}): email is not in enc:v1 format.`)
      skipped += 1
      continue
    }

    const contactId = generateContactId()
    runD1Insert({
      dbName,
      contactId,
      ciphertext: encryptedEmail,
      remote,
    })

    const patch = client.patch(doc._id).set({ contactId })
    if (unsetLegacyEmail) {
      patch.unset(['email'])
    }
    await patch.commit({ autoGenerateArrayKeys: false })

    migrated.push({
      _id: doc._id,
      _type: doc._type,
      name: doc.name || '',
      contactId,
    })
    moved += 1
    console.log(`Migrated ${doc._id} -> ${contactId}`)
  }

  console.log(`Done. moved=${moved}, skipped=${skipped}, total=${docs.length}`)
  console.log(JSON.stringify({ moved, skipped, total: docs.length, migrated }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
