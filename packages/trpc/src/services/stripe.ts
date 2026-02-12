import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
});

export const createCheckoutSession = async ({
  items,
  orderId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  items: {
    name: string;
    description?: string;
    images?: string[];
    amount: number; // in cents
    quantity: number;
    currency?: string;
  }[];
  orderId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  const lineItems = items.map((item) => ({
    price_data: {
      currency: item.currency || 'usd',
      product_data: {
        name: item.name,
        description: item.description,
        images: item.images,
      },
      unit_amount: Math.round(item.amount), // Ensure integer
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      orderId,
    },
  });

  return session;
};
