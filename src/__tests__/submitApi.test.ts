// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/submit';
import { checkEmbedding } from '../../functions/api/_embedCheck';
vi.mock('../../functions/api/_embedCheck', () => ({ checkEmbedding: vi.fn() }));
vi.mock('../../functions/api/_emailCipher', () => ({ encryptEmail: vi.fn().mockResolvedValue('encrypted') }));
vi.mock('../../functions/api/_contactStore', () => ({ createContact: vi.fn().mockResolvedValue('contact-id') }));

function validForm() {
    const form = new FormData();
    Object.entries({ name: 'Artist', subtitle: 'Digital Artist', websiteUrl: 'https://artist.com', email: 'artist@example.com', type: 'artist' }).forEach(([key, value]) => form.set(key, value));
    form.set('thumbnail', new File(['image'], 'portrait.png', { type: 'image/png' }));
    return form;
}
const submit = (form: FormData) => onRequestPost({ request: new Request('https://catalogue.gallery/api/submit', { method: 'POST', body: form }), env: { SANITY_WRITE_TOKEN: 'test', EMAIL_ENCRYPTION_KEY: 'test' } });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('submission API validation', () => {
    it.each(['name', 'subtitle', 'websiteUrl', 'email', 'thumbnail'])('rejects missing %s before any work', async field => {
        const form = validForm(); form.delete(field);
        expect((await submit(form)).status).toBe(400);
        expect(checkEmbedding).not.toHaveBeenCalled();
    });
    it.each(['name', 'subtitle', 'websiteUrl', 'email'])('rejects whitespace-only %s', async field => {
        const form = validForm(); form.set(field, '  ');
        expect((await submit(form)).status).toBe(400);
    });
    it.each([
        ['thumbnail', 'not-a-file'], ['name', new File(['x'], 'name.txt')], ['email', 'bad'],
        ['websiteUrl', 'javascript:alert(1)'], ['type', 'collector'], ['subtitle', 'a'.repeat(36)],
        ['thumbnail', new File([], 'empty.png', { type: 'image/png' })],
        ['thumbnail', new File(['text'], 'fake.txt', { type: 'text/plain' })],
        ['thumbnail', new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })],
    ] as const)('rejects invalid %s payload', async (field, value) => {
        const form = validForm(); form.set(field, value);
        expect((await submit(form)).status).toBe(400);
    });
    it.each([['blocked', 422], ['unknown', 503]] as const)('enforces %s compatibility on the server', async (status, code) => {
        vi.mocked(checkEmbedding).mockResolvedValue({ status, message: 'Check failed' });
        const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
        expect((await submit(validForm())).status).toBe(code);
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it.each(['artist', 'gallery'])('creates complete pending %s applications', async type => {
        vi.mocked(checkEmbedding).mockResolvedValue({ status: 'compatible', message: 'OK' });
        const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ result: null }))
            .mockResolvedValueOnce(Response.json({ document: { _id: 'image-id' } }))
            .mockResolvedValueOnce(Response.json({}));
        vi.stubGlobal('fetch', fetchMock);
        const form = validForm(); form.set('type', type);
        expect((await submit(form)).status).toBe(200);
        const doc = JSON.parse(fetchMock.mock.calls[2][1].body).mutations[0].create;
        expect(doc).toMatchObject({ _type: type, status: 'pending', contactId: 'contact-id', thumbnail: { asset: { _ref: 'image-id' } } });
        expect(doc).not.toHaveProperty('email');
    });
    it('never creates a listing when the image upload returns no asset', async () => {
        vi.mocked(checkEmbedding).mockResolvedValue({ status: 'compatible', message: 'OK' });
        const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ result: null })).mockResolvedValueOnce(Response.json({}));
        vi.stubGlobal('fetch', fetchMock);
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect((await submit(validForm())).status).toBe(500);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        log.mockRestore();
    });
});
