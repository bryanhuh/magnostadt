import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmation } from './templates/OrderConfirmation';
import { ShippingUpdate } from './templates/ShippingUpdate';
import { Delivered } from './templates/Delivered';
import { Cancelled } from './templates/Cancelled';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export const sendOrderConfirmation = async (order: any, email: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is missing. Email not sent.');
    return;
  }

  try {
    const html = await render(OrderConfirmation({ order }));

    const { data, error } = await resend.emails.send({
      from: 'Magnostadt <' + SENDER_EMAIL + '>',
      to: [email],
      subject: `Order Confirmation #${order.id}`,
      html,
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
    } else {
      console.log('Order confirmation email sent:', data);
    }
  } catch (e) {
    console.error('Failed to send order confirmation:', e);
  }
};

export const sendShippingUpdate = async (order: any, email: string) => {
  if (!process.env.RESEND_API_KEY) {
    return;
  }

  try {
    const html = await render(ShippingUpdate({ order }));

    const { data, error } = await resend.emails.send({
      from: 'Magnostadt <' + SENDER_EMAIL + '>',
      to: [email],
      subject: `Your Order #${order.id} has Shipped!`,
      html,
    });

    if (error) {
      console.error('Error sending shipping update email:', error);
    }
  } catch (e) {
    console.error('Failed to send shipping update:', e);
  }
};

export const sendDeliveredUpdate = async (order: any, email: string) => {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const html = await render(Delivered({ order }));
    await resend.emails.send({
      from: 'Magnostadt <' + SENDER_EMAIL + '>',
      to: [email],
      subject: `Order #${order.id} Delivered!`,
      html,
    });
  } catch (e) {
    console.error('Failed to send delivered update:', e);
  }
};

export const sendCancelledUpdate = async (order: any, email: string) => {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const html = await render(Cancelled({ order }));
    await resend.emails.send({
      from: 'Magnostadt <' + SENDER_EMAIL + '>',
      to: [email],
      subject: `Order #${order.id} Cancelled`,
      html,
    });
  } catch (e) {
    console.error('Failed to send cancelled update:', e);
  }
};
