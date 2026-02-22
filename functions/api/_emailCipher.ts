const VERSION_PREFIX = 'enc:v1:'
const IV_LENGTH = 12

function toBase64(bytes: Uint8Array) {
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

function fromBase64(value: string) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

function resolveKey(keyInput: string | undefined) {
    const key = (keyInput || '').trim()
    if (!key) {
        throw new Error('EMAIL_ENCRYPTION_KEY is missing')
    }

    const keyBytes = fromBase64(key)
    if (keyBytes.length !== 32) {
        throw new Error('EMAIL_ENCRYPTION_KEY must decode to 32 bytes (base64-encoded)')
    }

    return keyBytes
}

async function importAesKey(keyInput: string | undefined, usage: 'encrypt' | 'decrypt') {
    const keyBytes = resolveKey(keyInput)
    return crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        [usage],
    )
}

export function isEncryptedEmail(value: string | undefined) {
    return typeof value === 'string' && value.startsWith(VERSION_PREFIX)
}

export async function encryptEmail(email: string, keyInput: string | undefined) {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
        throw new Error('Cannot encrypt empty email')
    }

    const key = await importAesKey(keyInput, 'encrypt')
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const plaintext = new TextEncoder().encode(normalizedEmail)
    const encrypted = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
    )

    return `${VERSION_PREFIX}${toBase64(iv)}:${toBase64(encrypted)}`
}

export async function decryptEmail(ciphertext: string, keyInput: string | undefined) {
    if (!isEncryptedEmail(ciphertext)) {
        throw new Error('Unsupported encrypted email format')
    }

    const payload = ciphertext.slice(VERSION_PREFIX.length)
    const [ivPart, dataPart] = payload.split(':')
    if (!ivPart || !dataPart) {
        throw new Error('Invalid encrypted email payload')
    }

    const iv = fromBase64(ivPart)
    if (iv.length !== IV_LENGTH) {
        throw new Error('Invalid encrypted email iv')
    }

    const data = fromBase64(dataPart)
    const key = await importAesKey(keyInput, 'decrypt')
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)

    return new TextDecoder().decode(decrypted).trim().toLowerCase()
}
