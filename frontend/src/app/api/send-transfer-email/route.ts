import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, userEmail, message, accountId } = await request.json();

    // Validate input
    if (!amount || !userEmail || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💳 Credit Transfer Request</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">New Transfer to Machine Code</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">Transfer Details</h2>
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
            <p style="margin: 8px 0;"><strong>💰 Amount:</strong> $${amount} credits</p>
            <p style="margin: 8px 0;"><strong>📧 From User:</strong> ${userEmail}</p>
            <p style="margin: 8px 0;"><strong>🆔 Account ID:</strong> ${accountId}</p>
            <p style="margin: 8px 0;"><strong>🕐 Timestamp:</strong> ${new Date().toLocaleString()}</p>
            ${message ? `<p style="margin: 8px 0;"><strong>💬 Message:</strong> ${message}</p>` : ''}
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
          <p style="margin: 0; color: #1565c0; font-size: 14px;">
            <strong>📋 Action Required:</strong> Please process this credit transfer request for the user.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated notification from Machine Credit Transfer System
          </p>
        </div>
      </div>
    `;

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_8dJxToNX_9X1iydrRay4jJxjrYQ6SXXW9',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Machine Credits <credits@myapps.ai>',
        to: ['rcohen@mytsi.org'],
        subject: `💳 Credit Transfer: $${amount} from ${userEmail}`,
        html: emailHtml
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Transfer request sent successfully',
        emailId: result.id 
      });
    } else {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending transfer email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
