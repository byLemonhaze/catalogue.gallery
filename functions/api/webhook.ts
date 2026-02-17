type ReviewPayload = {
    result?: ReviewPayload;
    _id?: string;
    _type?: string;
    status?: string;
    email?: string;
    name?: string;
    slug?: string | { current?: string };
    websiteUrl?: string;
    approvalMessage?: string;
    rejectionReasonCode?: string;
    rejectionReason?: string;
};

type EnvVars = Record<string, string | undefined>;
type WorkerContext = { request: Request; env: EnvVars };

const jsonHeaders = { 'Content-Type': 'application/json' };

const REJECTION_GUIDANCE: Record<string, { label: string; fixes: string[] }> = {
    personal_website_required: {
        label: 'Personal website required',
        fixes: [
            'Submit a dedicated personal website on your own domain.',
            'Do not use Linktree, social profile links, or marketplace-only pages.',
        ],
    },
    iframe_incompatible: {
        label: 'Website currently blocks iframe embedding',
        fixes: [
            'Your server is currently sending security headers that block embeds (X-Frame-Options or CSP frame-ancestors).',
            'Update your headers to allow embedding from https://catalogue.gallery (for example via CSP frame-ancestors).',
            'If you are unsure how to change this, contact your hosting provider and ask them to allow iframe embedding from https://catalogue.gallery.',
            'If your host cannot support iframe embedding, submit another URL/domain that allows it.',
        ],
    },
    identity_incomplete: {
        label: 'Website context is incomplete',
        fixes: [
            'Add core context such as bio, highlights, and relevant links.',
            'Ensure the site clearly reflects your artistic identity and body of work.',
        ],
    },
    portfolio_not_ready: {
        label: 'Portfolio presentation not ready yet',
        fixes: [
            'Improve curation and clarity of the work shown on your site.',
            'Re-apply once the presentation is stronger and more complete.',
        ],
    },
    other: {
        label: 'Other review issue',
        fixes: [
            'Use the custom reviewer note to understand what to improve before reapplying.',
        ],
    },
};

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

function escapeHtml(input: string | undefined) {
    if (!input) return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveSlug(slug: ReviewPayload['slug']) {
    if (typeof slug === 'string') return slug.trim();
    if (slug && typeof slug === 'object' && typeof slug.current === 'string') return slug.current.trim();
    return '';
}

function sanitizeHttpUrl(url: string | undefined) {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        return parsed.toString();
    } catch {
        return '';
    }
}

function emailShell(params: {
    baseUrl: string;
    title: string;
    intro: string;
    bodyHtml: string;
    buttonLabel: string;
    buttonUrl: string;
}) {
    const { baseUrl, title, intro, bodyHtml, buttonLabel, buttonUrl } = params;
    const safeTitle = escapeHtml(title);
    const safeIntro = escapeHtml(intro);
    const safeButtonLabel = escapeHtml(buttonLabel);

    return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#050505;font-family:Inter,Arial,sans-serif;color:#f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#0f0f10;border:1px solid #1f1f22;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px 8px 28px;" align="left">
                <img src="${baseUrl}/logo.png" alt="CATALOGUE" width="42" height="42" style="display:block;border-radius:10px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#ffffff;letter-spacing:0.2px;">${safeTitle}</h1>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:#d3d3d8;">${safeIntro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 22px 28px;font-size:14px;line-height:1.7;color:#e7e7ec;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px 28px;">
                <a href="${buttonUrl}" style="display:inline-block;padding:11px 18px;border-radius:10px;background:#ffffff;color:#050505;text-decoration:none;font-weight:600;font-size:13px;letter-spacing:0.2px;">
                  ${safeButtonLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8f8f98;">CATALOGUE © 2026 by Lemonhaze</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
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
        const slug = resolveSlug(payload.slug);
        const websiteUrl = payload.websiteUrl?.trim();
        const approvalMessage = payload.approvalMessage?.trim();
        const rejectionReasonCode = payload.rejectionReasonCode?.trim();
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

        const baseUrl = (env.PUBLIC_BASE_URL || 'https://catalogue.gallery').replace(/\/+$/, '');
        const fromAddress = env.RESEND_FROM_EMAIL || 'CATALOGUE <apply@catalogue.gallery>';
        const replyTo = env.RESEND_REPLY_TO?.trim();
        const safeName = escapeHtml(name || 'there');

        const profilePath = slug
            ? (payload._type === 'gallery' ? `/gallery/${encodeURIComponent(slug)}` : `/artist/${encodeURIComponent(slug)}`)
            : '';
        const profileUrl = profilePath ? `${baseUrl}${profilePath}` : baseUrl;
        const safeWebsiteUrl = sanitizeHttpUrl(websiteUrl);

        const subject = status === 'published'
            ? 'You are live on CATALOGUE'
            : 'Update on your CATALOGUE submission';

        const html = status === 'published'
            ? emailShell({
                baseUrl,
                title: 'Application approved',
                intro: `Hi ${name || 'there'}, your profile is now live on CATALOGUE.`,
                bodyHtml: `
                    <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
                    <p style="margin:0 0 12px 0;">Great news. Your application has been approved and published.</p>
                    ${approvalMessage ? `<p style="margin:0 0 12px 0;"><strong>Note from the team:</strong><br/>${escapeHtml(approvalMessage)}</p>` : ''}
                    ${safeWebsiteUrl ? `<p style="margin:0;">Original site submitted: <a href="${safeWebsiteUrl}" style="color:#aeb4ff;">${escapeHtml(safeWebsiteUrl)}</a></p>` : ''}
                `,
                buttonLabel: 'View your CATALOGUE profile',
                buttonUrl: profileUrl,
            })
            : (() => {
                const guidance = rejectionReasonCode ? REJECTION_GUIDANCE[rejectionReasonCode] : undefined;
                const guidanceHtml = guidance
                    ? `
                        <p style="margin:0 0 8px 0;"><strong>Primary review reason:</strong> ${escapeHtml(guidance.label)}</p>
                        <ul style="margin:0 0 12px 20px;padding:0;">
                            ${guidance.fixes.map((fix) => `<li style="margin:0 0 4px 0;">${escapeHtml(fix)}</li>`).join('')}
                        </ul>
                    `
                    : '';

                const reviewerNoteHtml = rejectionReason
                    ? `<p style="margin:0 0 12px 0;"><strong>Additional reviewer note:</strong><br/>${escapeHtml(rejectionReason)}</p>`
                    : '';

                return emailShell({
                    baseUrl,
                    title: 'Application needs updates',
                    intro: `Hi ${name || 'there'}, we reviewed your submission and need a few changes before approval.`,
                    bodyHtml: `
                        <p style="margin:0 0 12px 0;">Hi ${safeName},</p>
                        <p style="margin:0 0 12px 0;">Thank you for applying to CATALOGUE. We are not moving forward yet, but you are welcome to improve your submission and re-apply.</p>
                        ${guidanceHtml}
                        ${reviewerNoteHtml}
                        <p style="margin:0;">Once updated, you can submit again and we will review promptly.</p>
                    `,
                    buttonLabel: 'Update and re-apply',
                    buttonUrl: `${baseUrl}/submit`,
                });
            })();

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
