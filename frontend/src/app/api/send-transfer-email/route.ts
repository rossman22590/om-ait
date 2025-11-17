// app/api/send-transfer-email/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, transferEmail } = body;
    if (!amount || !transferEmail) {
      return NextResponse.json({ error: 'Missing amount or sender email' }, { status: 400 });
    }
    const RESEND_API_KEY = process.env.RESEND_API;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Missing Resend API key' }, { status: 500 });
    }
    const actualValue = Math.floor(Number(amount) * 0.7);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Machine Code <transfer@myapps.ai>',
        to: ['rcohen@mytsi.org'],
        subject: 'Machine Code Credit Transfer Request',
        html: `<p><b>Transfer Request</b></p><p><b>Sender:</b> ${transferEmail}</p><p><b>Amount Requested:</b> ${amount} credits</p><p><b>Actual Credit Value:</b> ${actualValue} credits (70% of requested)</p><p><b>Amount to Deduct from Machine:</b> ${amount} credits</p><p>Transfers are processed at 70% value. If you have questions, reply to this email.</p>`
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || 'Failed to send email' }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
