import { Order, OrderStatus } from '@/types/database';
import { formatBDT, getStatusBadgeInfo, buildWhatsAppUrl } from '@/lib/utils';

/**
 * Builds the WhatsApp direct follow-up URL for the staff/owner to message the customer
 */
export function buildOwnerCustomerWhatsAppLink(order: Order): string {
  const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const phoneWithCountry = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  const message = `আসসালামু আলাইকুম ${order.customer_name},
ড্রিম হোম ডেকোর থেকে আপনার অর্ডারটি (#${order.order_number}) পেয়েছি। 
মোট প্রদেয়: ${formatBDT(order.total_amount)} (${order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'বিকাশ/নগদ'})
আপনার ডেলিভারি ঠিকানা: ${order.customer_address}

অর্ডারটি কনফার্ম করতে অনুগ্রহ করে মেসেজের রিপ্লাই দিন বা আমাদের কল করুন। ধন্যবাদ!`;

  return buildWhatsAppUrl(phoneWithCountry, message);
}

/**
 * Send instant alert to the store owner via Telegram Bot
 */
async function sendTelegramAlert(text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Telegram notification delivery error:', err);
    return false;
  }
}

/**
 * Send email alert to store owner via Resend (Free Tier)
 */
async function sendResendEmailAlert(subject: string, htmlContent: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipientEmail =
    process.env.OWNER_NOTIFICATION_EMAIL ||
    process.env.ADMIN_OWNER_EMAIL ||
    'owner@dreamhomedecor.com';

  if (!apiKey) {
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Dream Home Decor <orders@dreamhomedecor.com>',
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Resend notification delivery error:', err);
    return false;
  }
}

/**
 * Notify the factory owner and manager about a newly placed order
 */
export async function notifyOwnerNewOrder(
  order: Order,
  items: Array<{ product_title: string; quantity: number; unit_price: number; selected_color?: string | null }>
): Promise<{ telegram: boolean; email: boolean }> {
  const itemsText = items
    .map(
      (item) =>
        `• <b>${item.product_title}</b> ${item.selected_color ? `(${item.selected_color})` : ''} — ${item.quantity}টি × ${formatBDT(item.unit_price)}`
    )
    .join('\n');

  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://dream-home-decor.vercel.app';
  const adminOrderUrl = `${siteUrl}/admin/orders`;

  // 1. Telegram Message (HTML formatting)
  const telegramMessage = `
🔔 <b>নতুন ফার্নিচার অর্ডার এসেছে!</b>
━━━━━━━━━━━━━━━━━━━━
<b>অর্ডার নং:</b> <code>#${order.order_number}</code>
<b>গ্রাহকের নাম:</b> ${order.customer_name}
<b>ফোন:</b> <code>${order.customer_phone}</code>
<b>এলাকা:</b> ${order.delivery_zone === 'inside' ? 'ঢাকার ভেতরে (৳১২০)' : 'ঢাকার বাইরে (৳২০০)'}
<b>ঠিকানা:</b> ${order.customer_address}

<b>পণ্যের বিবরণ:</b>
${itemsText}

━━━━━━━━━━━━━━━━━━━━
<b>সর্বমোট বিল:</b> <b>${formatBDT(order.total_amount)}</b>
<b>পেমেন্ট মেথড:</b> ${order.payment_method.toUpperCase()}${order.transaction_id ? ` (Trx: ${order.transaction_id})` : ''}
${order.order_notes ? `<b>নোট:</b> <i>${order.order_notes}</i>\n` : ''}
<a href="${adminOrderUrl}">👉 অ্যাডমিন প্যানেলে অর্ডার দেখুন</a>
`.trim();

  // 2. Email HTML Message
  const emailHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #faf8f5;">
  <div style="background-color: #5C3615; color: #ffffff; padding: 16px 20px; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0; font-size: 20px;">নতুন ফার্নিচার অর্ডার #${order.order_number}</h2>
  </div>

  <div style="padding: 20px 0;">
    <p><strong>গ্রাহকের নাম:</strong> ${order.customer_name}</p>
    <p><strong>মোবাইল নাম্বার:</strong> <a href="tel:${order.customer_phone}">${order.customer_phone}</a></p>
    <p><strong>ডেলিভারি ঠিকানা:</strong> ${order.customer_address} (${order.delivery_zone === 'inside' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})</p>

    <h3 style="border-bottom: 2px solid #5C3615; padding-bottom: 6px; margin-top: 24px;">অর্ডার আইটেম:</h3>
    <ul style="padding-left: 20px;">
      ${items
        .map(
          (it) =>
            `<li style="margin-bottom: 8px;"><strong>${it.product_title}</strong> ${it.selected_color ? `(${it.selected_color})` : ''} — ${it.quantity}টি × ${formatBDT(it.unit_price)}</li>`
        )
        .join('')}
    </ul>

    <div style="background-color: #f5efe6; padding: 12px 16px; border-radius: 8px; margin-top: 16px;">
      <p style="margin: 4px 0;"><strong>সাবটোটাল:</strong> ${formatBDT(order.subtotal)}</p>
      <p style="margin: 4px 0;"><strong>ডেলিভারি চার্জ:</strong> ${formatBDT(order.delivery_charge)}</p>
      <p style="margin: 4px 0; font-size: 18px; color: #8B5A2B;"><strong>সর্বমোট প্রদেয়:</strong> ${formatBDT(order.total_amount)}</p>
      <p style="margin: 4px 0;"><strong>পেমেন্ট:</strong> ${order.payment_method.toUpperCase()}</p>
    </div>
  </div>

  <div style="text-align: center; padding-top: 10px;">
    <a href="${adminOrderUrl}" style="background-color: #8B5A2B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">অ্যাডমিন প্যানেল ওপেন করুন</a>
  </div>
</div>
`.trim();

  // Run alert dispatches in parallel, non-blocking
  const [telegramSent, emailSent] = await Promise.all([
    sendTelegramAlert(telegramMessage),
    sendResendEmailAlert(`[Dream Home Decor] নতুন অর্ডার #${order.order_number}`, emailHtml),
  ]);

  return { telegram: telegramSent, email: emailSent };
}

/**
 * Alert owner on critical status changes (e.g. cancellation, returns)
 */
export async function notifyStatusChangeAlert(
  orderNumber: string,
  customerName: string,
  newStatus: OrderStatus,
  note?: string
) {
  const statusInfo = getStatusBadgeInfo(newStatus);
  const text = `
⚠️ <b>অর্ডার স্ট্যাটাস আপডেট: #${orderNumber}</b>
━━━━━━━━━━━━━━━━━━━━
<b>গ্রাহক:</b> ${customerName}
<b>নতুন অবস্থা:</b> ${statusInfo.labelBn} (${statusInfo.label})
${note ? `<b>মন্তব্য:</b> ${note}` : ''}
`.trim();

  return await sendTelegramAlert(text);
}
