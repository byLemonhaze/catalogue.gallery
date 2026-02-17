type ReviewPayload = {
    result?: ReviewPayload;
    _id?: string;
    _type?: string;
    status?: string;
    email?: string;
    name?: string;
    rejectionReason?: string;
};

type EnvVars = Record<string, string | undefined>;
type WorkerContext = { request: Request; env: EnvVars };

const jsonHeaders = { 'Content-Type': 'application/json' };

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: jsonHeaders,
    });
}

function getProvidedSecret(request: Request) {
    const authorization = request.headers.get('authorization');
    const bearerSecret = authorization?.replace(/^Bearer\s+/i, '').trim();

    return (
        request.headers.get('x-webhook-secret')?.trim() ||
        request.headers.get('x-sanity-webhook-secret')?.trim() ||
        bearerSecret ||
        ''
    );
}

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Internal Server Error';
}

export const onRequestPost = async (context: WorkerContext) => {
    const { request, env } = context;

    try {
        const requiredSecret = env.WEBHOOK_SHARED_SECRET;
        if (requiredSecret) {
            const providedSecret = getProvidedSecret(request);
            if (providedSecret !== requiredSecret) {
                return jsonResponse({ error: 'Unauthorized webhook request' }, 401);
            }
        }

        const rawPayload: ReviewPayload = await request.json();
        const payload = (rawPayload?.result && typeof rawPayload.result === 'object')
            ? rawPayload.result
            : rawPayload;

        const status = payload.status;
        const email = payload.email?.trim();
        const name = payload.name?.trim();
        const rejectionReason = payload.rejectionReason?.trim();

        if (!email) {
            return jsonResponse({ message: 'No email provided in payload' });
        }

        if (status !== 'published' && status !== 'declined') {
            return jsonResponse({ message: `No action for status: ${status || 'unknown'}` });
        }

        if (!env.RESEND_API_KEY) {
            return jsonResponse({ error: 'RESEND_API_KEY is not configured' }, 500);
        }

        const fromAddress = env.RESEND_FROM_EMAIL || 'CATALOGUE <apply@catalogue.gallery>';
        const replyTo = env.RESEND_REPLY_TO?.trim();

        const subject = status === 'published'
            ? 'Welcome to CATALOGUE! Your application has been approved'
            : 'Status update regarding your CATALOGUE application';

        const html = status === 'published'
            ? `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Approved</h1>
                    <p>Hi ${name || 'there'},</p>
                    <p>We are excited to let you know that your application to <strong>CATALOGUE</strong> has been approved.</p>
                    <p>Your profile is now live on the platform at <a href="https://catalogue.gallery">catalogue.gallery</a>.</p>
                    <p>Welcome to the community.</p>
                    <br />
                    <p>Best regards,<br />The CATALOGUE Team</p>
                </div>
            `
            : `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Status</h1>
                    <p>Hi ${name || 'there'},</p>
                    <p>Thank you for applying to CATALOGUE. After review, we are not moving forward at this time.</p>
                    ${rejectionReason ? `<p><strong>Reason provided:</strong> ${rejectionReason}</p>` : ''}
                    <p>We appreciate the time you took to apply and wish you the best with your projects.</p>
                    <br />
                    <p>Best regards,<br />The CATALOGUE Team</p>
                </div>
            `;

        const resendPayload: Record<string, unknown> = {
            from: fromAddress,
            to: [email],
            subject,
            html,
        };

        if (replyTo) {
            resendPayload.reply_to = replyTo;
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendPayload),
        });

        const rawResendBody = await resendResponse.text();
        if (!resendResponse.ok) {
            throw new Error(`Resend API error (${resendResponse.status}): ${rawResendBody}`);
        }

        let resendBody: Record<string, unknown> = {};
        if (rawResendBody) {
            try {
                resendBody = JSON.parse(rawResendBody);
            } catch {
                resendBody = { raw: rawResendBody };
            }
        }

        return jsonResponse({ success: true, provider: resendBody });
    } catch (err: unknown) {
        console.error('Webhook Error:', err);
        return jsonResponse({ error: getErrorMessage(err) }, 500);
    }
};
