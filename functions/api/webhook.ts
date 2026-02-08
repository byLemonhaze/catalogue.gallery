export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const payload: any = await request.json();

        // Extract relevant data from Sanity payload
        // Note: Sanity webhook must be configured to send the necessary fields:
        // _type, status, email, name, rejectionReason
        const { _type, status, email, name, rejectionReason } = payload;

        if (!email) {
            console.log('No email found in payload, skipping notification');
            return new Response(JSON.stringify({ message: 'No email provided' }), { status: 200 });
        }

        if (!env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY not configured');
            return new Response(JSON.stringify({ error: 'Mail service not configured' }), { status: 500 });
        }

        let subject = '';
        let html = '';

        if (status === 'published') {
            subject = 'Welcome to CATALOGUE! Your application has been approved';
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Approved</h1>
                    <p>Hi ${name || 'there'},</p>
                    <p>We are excited to let you know that your application to <strong>CATALOGUE</strong> has been approved!</p>
                    <p>Your profile is now live on the platform. You can view it at <a href="https://catalogue.gallery">catalogue.gallery</a>.</p>
                    <p>Welcome to the community.</p>
                    <br />
                    <p>Best regards,<br />The CATALOGUE Team</p>
                </div>
            `;
        } else if (status === 'declined') {
            subject = 'Status update regarding your CATALOGUE application';
            html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    <h1 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Status</h1>
                    <p>Hi ${name || 'there'},</p>
                    <p>Thank you for your interest in joining CATALOGUE. After reviewing your application, we have decided not to move forward at this time.</p>
                    ${rejectionReason ? `<p><strong>Reason provided:</strong> ${rejectionReason}</p>` : ''}
                    <p>We appreciate the time you took to apply and wish you the best with your projects.</p>
                    <br />
                    <p>Best regards,<br />The CATALOGUE Team</p>
                </div>
            `;
        } else {
            return new Response(JSON.stringify({ message: 'No action for status: ' + status }), { status: 200 });
        }

        // Send email via Resend REST API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'CATALOGUE <apply@catalogue.gallery>',
                to: [email],
                subject: subject,
                html: html
            })
        });

        if (!resendResponse.ok) {
            const error = await resendResponse.json();
            throw new Error(`Resend API error: ${JSON.stringify(error)}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Webhook Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
