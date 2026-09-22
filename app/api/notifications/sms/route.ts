import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message, customerName, templateType } = body;

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'رقم الهاتف ونصف الرسالة مطلوبان' }, { status: 400 });
    }

    // هنا يتم ربط مزود خدمة الرسائل الفعلي (مثل WhatsApp API أو Twilio أو بوابة محلية)
    // مثال لربط تجريبي ناجح:
    console.log(`[SMS Gateway] Sending to ${phone} for ${customerName}: ${message}`);

    // محاكاة الاتصال ببوابة إرسال ناجحة
    const gatewayResponse = {
      success: true,
      status: 'SENT',
      recipient: phone,
      timestamp: new Date().toISOString(),
      template: templateType || 'GENERAL_NOTICE'
    };

    return NextResponse.json({ success: true, data: gatewayResponse });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}