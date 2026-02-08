export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const subtitle = formData.get('subtitle') as string;
        const websiteUrl = formData.get('websiteUrl') as string;
        const email = formData.get('email') as string | null;
        const type = (formData.get('type') as string) || 'artist';
        const thumbnail = formData.get('thumbnail'); // This is a File object

        if (!env.SANITY_WRITE_TOKEN) {
            return new Response(JSON.stringify({ error: 'Server configuration error: Write token not found.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const projectId = env.VITE_SANITY_PROJECT_ID || 'ebj9kqfo';
        const dataset = env.VITE_SANITY_DATASET || 'production';
        const apiVersion = 'v2024-01-01';
        const baseUrl = `https://${projectId}.api.sanity.io/${apiVersion}`;

        let imageAssetId = null;

        // 1. Upload Image to Sanity if it exists
        if (thumbnail && (thumbnail as any) instanceof File && (thumbnail as any).size > 0) {
            const uploadResponse = await fetch(`${baseUrl}/assets/images/${dataset}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.SANITY_WRITE_TOKEN}`,
                    'Content-Type': (thumbnail as any).type
                },
                body: thumbnail
            });

            if (!uploadResponse.ok) {
                const errorData: any = await uploadResponse.json();
                throw new Error(`Image upload failed: ${errorData.error?.message || uploadResponse.statusText}`);
            }

            const asset: any = await uploadResponse.json();
            imageAssetId = asset.document?._id || asset._id;
        }

        // 2. Check for Duplicate URL
        const normalizedUrl = websiteUrl.replace(/\/+$/, "");
        const query = encodeURIComponent(`*[( _type == "artist" || _type == "gallery" ) && (websiteUrl == $url || websiteUrl == $url + "/")][0]`);
        const checkUrl = `${baseUrl}/data/query/${dataset}?query=${query}&$url="${encodeURIComponent(normalizedUrl)}"`;

        const checkResponse = await fetch(checkUrl, {
            headers: {
                'Authorization': `Bearer ${env.SANITY_WRITE_TOKEN}`
            }
        });

        if (checkResponse.ok) {
            const checkData: any = await checkResponse.json();
            if (checkData.result) {
                return new Response(JSON.stringify({ error: 'This URL is already registered.' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 3. Create the Document in Sanity
        const doc = {
            _type: type,
            name,
            subtitle,
            websiteUrl: normalizedUrl, // Save normalized version
            email: email || undefined, // Only include if provided
            template: 'external',

            status: 'pending',
            thumbnail: imageAssetId ? {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: imageAssetId
                }
            } : undefined
        };

        const mutateResponse = await fetch(`${baseUrl}/data/mutate/${dataset}?returnIds=true`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.SANITY_WRITE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mutations: [
                    { create: doc }
                ]
            })
        });

        if (!mutateResponse.ok) {
            const errorData: any = await mutateResponse.json();
            throw new Error(`Document creation failed: ${errorData.error?.message || mutateResponse.statusText}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('API Submit Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
