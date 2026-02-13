import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmation } from './src/services/email/templates/OrderConfirmation';

// Mock Data
const mockOrder = {
  id: 'test-order-123',
  customerName: 'Test User',
  total: 49.99,
  address: '123 Anime St',
  city: 'Tokyo',
  zipCode: '100-0001',
  items: [
    {
      productId: 'prod_1',
      quantity: 1,
      price: 49.99,
      product: {
        name: 'Test Product (Naruto Figure)',
        imageUrl: 'https://via.placeholder.com/150',
      }
    }
  ]
};

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is missing in environment variables.');
    return;
  }

  console.log('📧 Testing email sending with Resend...');
  const resend = new Resend(apiKey);
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  
  // Send to the verified email (assuming dev environment) or a safe test email
  // Since we don't know the user's verified email, we'll ask them to check the logs.
  // We will try to send to "delivered@resend.dev" which is a magic address that always succeeds (but doesn't deliver to a real inbox),
  // OR we rely on the user having set everything up.
  // Better: Send to the API key owner's email if possible, or just log the attempt.
  // Detailed: Resend "onboarding" only sends to the email address you signed up with.
  
  const recipient = 'delivered@resend.dev'; // Only checks if API works, won't land in inbox.
  // Actually, let's ask the user to edit this file or passed as arg?
  // Let's just try to send to a placeholder and let the user see the result.
  
  try {
    const html = await render(OrderConfirmation({ order: mockOrder }));
    
    // We can't easily know the user's email, so we'll just log what we WOULD do
    console.log(`Target Recipient: (You should use your verified Resend email)`);
    
    const { data, error } = await resend.emails.send({
      from: 'Magnostadt Test <' + senderEmail + '>',
      to: [process.env.TEST_EMAIL || 'delivered@resend.dev'], // User can set TEST_EMAIL
      subject: 'Test Order Confirmation',
      html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
    } else {
      console.log('✅ Email sent successfully!', data);
    }
  } catch (e) {
    console.error('❌ Exception:', e);
  }
}

testEmail();
