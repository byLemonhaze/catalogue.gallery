import { decryptEmail, isEncryptedEmail } from './_emailCipher';
import {
    hasContactStatusNotification,
    hasContactStore,
    markContactNotified,
    recordContactStatusNotification,
    readContactCiphertext,
    type ContactStoreBindings,
} from './_contactStore';

type ReviewPayload = {
    result?: ReviewPayload;
    _id?: string;
    _type?: string;
    status?: string;
    contactId?: string;
    email?: string;
    name?: string;
    slug?: string | { current?: string };
    websiteUrl?: string;
    approvalMessage?: string;
    rejectionReasonCode?: string;
    rejectionReason?: string;
};

type EnvVars = ContactStoreBindings & Record<string, unknown>;
type WorkerContext = { request: Request; env: EnvVars };
type NotificationStatus = 'published' | 'declined';

type NormalizedReviewPayload = {
    _type?: string;
    status?: string;
    contactId: string;
    emailField: string;
    name: string;
    slug: string;
    websiteUrl: string;
    approvalMessage: string;
    rejectionReasonCode: string;
    rejectionReason: string;
};

type NotificationConfig = {
    resendApiKey: string;
    baseUrl: string;
    fromAddress: string;
    replyTo: string;
};

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
};

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

function readEnvString(env: EnvVars, key: string) {
    const value = env[key];
    return typeof value === 'string' ? value : '';
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
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8f8f98;">CATALOGUE © 2026</p>
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

function authorizeWebhookRequest(request: Request, env: EnvVars) {
    const requiredSecret = readEnvString(env, 'WEBHOOK_SHARED_SECRET').trim();
    if (!requiredSecret) {
        return jsonResponse({ error: 'Server configuration error: WEBHOOK_SHARED_SECRET is missing.' }, 500);
    }

    const providedSecret = getProvidedSecret(request);
    if (!providedSecret || providedSecret !== requiredSecret) {
        return jsonResponse({ error: 'Unauthorized webhook request' }, 401);
    }

    return null;
}

function normalizeReviewPayload(rawPayload: ReviewPayload): NormalizedReviewPayload {
    const payload = (rawPayload?.result && typeof rawPayload.result === 'object')
        ? rawPayload.result
        : rawPayload;

    return {
        _type: payload._type,
        status: payload.status,
        contactId: payload.contactId?.trim() || '',
        emailField: payload.email?.trim() || '',
        name: payload.name?.trim() || '',
        slug: resolveSlug(payload.slug),
        websiteUrl: payload.websiteUrl?.trim() || '',
        approvalMessage: payload.approvalMessage?.trim() || '',
        rejectionReasonCode: payload.rejectionReasonCode?.trim() || '',
        rejectionReason: payload.rejectionReason?.trim() || '',
    };
}

async function resolveNotificationEmail(
    payload: NormalizedReviewPayload,
    env: EnvVars,
    emailEncryptionKey: string
) {
    let email = '';

    if (payload.contactId) {
        const storedCiphertext = await readContactCiphertext(env, payload.contactId);
        if (storedCiphertext) {
            if (!emailEncryptionKey) {
                return {
                    response: jsonResponse({ error: 'EMAIL_ENCRYPTION_KEY is missing for private contact lookup.' }, 500),
                };
            }
            email = await decryptEmail(storedCiphertext, emailEncryptionKey);
        }
    }

    if (!email && payload.emailField) {
        if (isEncryptedEmail(payload.emailField)) {
            if (!emailEncryptionKey) {
                return {
                    response: jsonResponse({ error: 'EMAIL_ENCRYPTION_KEY is missing for encrypted email payloads.' }, 500),
                };
            }
            email = await decryptEmail(payload.emailField, emailEncryptionKey);
        } else {
            email = payload.emailField.toLowerCase();
        }
    }

    if (email) {
        return { email };
    }

    if (payload.contactId && hasContactStore(env)) {
        return {
            response: jsonResponse({ error: `No contact record found for contactId "${payload.contactId}".` }, 400),
        };
    }
    if (payload.contactId && !hasContactStore(env)) {
        return {
            response: jsonResponse({ error: 'CONTACTS_DB binding is missing but payload requires private contact lookup.' }, 500),
        };
    }

    return {
        response: jsonResponse({ error: 'Missing email in payload. Email is required to send notifications.' }, 400),
    };
}

function isNotificationStatus(status: string | undefined): status is NotificationStatus {
    return status === 'published' || status === 'declined';
}

async function ensureNotificationIsNew(
    env: EnvVars,
    contactId: string,
    notificationStatus: NotificationStatus
) {
    try {
        const alreadySent = await hasContactStatusNotification(env, contactId, notificationStatus);
        if (alreadySent) {
            return jsonResponse({
                success: true,
                skipped: true,
                reason: `Notification already sent for status "${notificationStatus}"`,
            });
        }
    } catch (dedupeErr) {
        return jsonResponse({ error: `Notification dedupe check failed: ${getErrorMessage(dedupeErr)}` }, 500);
    }

    return null;
}

function readNotificationConfig(env: EnvVars): NotificationConfig {
    const resendApiKey = readEnvString(env, 'RESEND_API_KEY').trim();
    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    return {
        resendApiKey,
        baseUrl: (readEnvString(env, 'PUBLIC_BASE_URL') || 'https://catalogue.gallery').replace(/\/+$/, ''),
        fromAddress: readEnvString(env, 'RESEND_FROM_EMAIL') || 'CATALOGUE <apply@catalogue.gallery>',
        replyTo: readEnvString(env, 'RESEND_REPLY_TO').trim(),
    };
}

function buildProfileUrl(payload: NormalizedReviewPayload, baseUrl: string) {
    const profilePath = payload.slug
        ? (payload._type === 'gallery'
            ? `/gallery/${encodeURIComponent(payload.slug)}`
            : `/artist/${encodeURIComponent(payload.slug)}`)
        : '';

    return profilePath ? `${baseUrl}${profilePath}` : baseUrl;
}

function buildDeclineGuidanceHtml(reasonCode: string) {
    const guidance = reasonCode ? REJECTION_GUIDANCE[reasonCode] : undefined;
    if (!guidance) {
        return '';
    }

    return `
        <p style="margin:0 0 8px 0;"><strong>Primary review reason:</strong></p>
        <p style="margin:0 0 8px 0;">${escapeHtml(guidance.label)}</p>
        <ul style="margin:0 0 12px 20px;padding:0;">
            ${guidance.fixes.map((fix) => `<li style="margin:0 0 4px 0;">${escapeHtml(fix)}</li>`).join('')}
        </ul>
    `;
}

function buildNotificationMessage(payload: NormalizedReviewPayload, config: NotificationConfig) {
    const safeWebsiteUrl = sanitizeHttpUrl(payload.websiteUrl);
    const profileUrl = buildProfileUrl(payload, config.baseUrl);

    if (payload.status === 'published') {
        return {
            subject: 'You are live on CATALOGUE',
            html: emailShell({
                baseUrl: config.baseUrl,
                title: 'Application approved',
                intro: `Hi ${payload.name || 'there'}, your profile is now live on CATALOGUE.`,
                bodyHtml: `
                    <p style="margin:0 0 12px 0;">Great news. Your application has been approved and published.</p>
                    ${payload.approvalMessage ? `<p style="margin:0 0 12px 0;"><strong>Note from the team:</strong><br/>${escapeHtml(payload.approvalMessage)}</p>` : ''}
                    ${safeWebsiteUrl ? `<p style="margin:0;">Original site submitted: <a href="${safeWebsiteUrl}" style="color:#aeb4ff;">${escapeHtml(safeWebsiteUrl)}</a></p>` : ''}
                `,
                buttonLabel: 'View your CATALOGUE profile',
                buttonUrl: profileUrl,
            }),
        };
    }

    const reviewerNoteHtml = payload.rejectionReason
        ? `<p style="margin:0 0 12px 0;"><strong>Additional reviewer note:</strong><br/>${escapeHtml(payload.rejectionReason)}</p>`
        : '';

    return {
        subject: 'Update on your CATALOGUE submission',
        html: emailShell({
            baseUrl: config.baseUrl,
            title: 'Application needs updates',
            intro: `Hi ${payload.name || 'there'}, thank you for applying to CATALOGUE.`,
            bodyHtml: `
                <p style="margin:0 0 12px 0;">We reviewed your submission and need a few changes before approval.</p>
                ${buildDeclineGuidanceHtml(payload.rejectionReasonCode)}
                ${reviewerNoteHtml}
            `,
            buttonLabel: 'Update and re-apply',
            buttonUrl: `${config.baseUrl}/submit`,
        }),
    };
}

async function sendNotificationEmail(params: {
    email: string;
    subject: string;
    html: string;
    config: NotificationConfig;
}) {
    const { email, subject, html, config } = params;
    const resendPayload: Record<string, unknown> = {
        from: config.fromAddress,
        to: [email],
        subject,
        html,
    };

    if (config.replyTo) {
        resendPayload.reply_to = config.replyTo;
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
    });

    const rawResendBody = await resendResponse.text();
    if (!resendResponse.ok) {
        throw new Error(`Resend API error (${resendResponse.status}): ${rawResendBody}`);
    }

    if (!rawResendBody) {
        return {};
    }

    try {
        return JSON.parse(rawResendBody) as Record<string, unknown>;
    } catch {
        return { raw: rawResendBody };
    }
}

async function markNotificationSent(
    env: EnvVars,
    contactId: string,
    notificationStatus: NotificationStatus
) {
    try {
        await recordContactStatusNotification(env, contactId, notificationStatus);
        await markContactNotified(env, contactId);
    } catch (markErr) {
        console.warn('Failed to update contact notification metadata:', markErr);
    }
}

export const onRequestPost = async (context: WorkerContext) => {
    const { request, env } = context;

    try {
        const authError = authorizeWebhookRequest(request, env);
        if (authError) {
            return authError;
        }

        const rawPayload: ReviewPayload = await request.json();
        const payload = normalizeReviewPayload(rawPayload);
        const emailEncryptionKey = readEnvString(env, 'EMAIL_ENCRYPTION_KEY').trim();

        const emailResult = await resolveNotificationEmail(payload, env, emailEncryptionKey);
        if ('response' in emailResult) {
            return emailResult.response;
        }
        const email = emailResult.email;

        if (!isNotificationStatus(payload.status)) {
            return jsonResponse({ message: `No action for status: ${payload.status || 'unknown'}` });
        }
        const notificationStatus = payload.status;

        if (payload.contactId) {
            const dedupeResponse = await ensureNotificationIsNew(env, payload.contactId, notificationStatus);
            if (dedupeResponse) {
                return dedupeResponse;
            }
        }

        const config = readNotificationConfig(env);
        const message = buildNotificationMessage(payload, config);
        const resendBody = await sendNotificationEmail({
            email,
            subject: message.subject,
            html: message.html,
            config,
        });

        if (payload.contactId) {
            await markNotificationSent(env, payload.contactId, notificationStatus);
        }

        return jsonResponse({ success: true, provider: resendBody });
    } catch (err: unknown) {
        console.error('Webhook Error:', err);
        return jsonResponse({ error: getErrorMessage(err) }, 500);
    }
};
