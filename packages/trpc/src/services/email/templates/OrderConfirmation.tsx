import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
  Column,
  Row,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationProps {
  order: {
    id: string;
    customerName: string;
    items: {
      productId: string;
      quantity: number;
      price: string | number; // Decimal comes as string from Prisma often
      product: {
        name: string;
        imageUrl?: string | null;
      };
    }[];
    total: string | number;
    address: string;
    city: string;
    zipCode: string;
  };
}

export const OrderConfirmation = ({
  order,
}: OrderConfirmationProps) => {
  const previewText = `Order Confirmation #${order?.id}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Order <strong>Confirmed!</strong>
              </Heading>
              <Text className="text-black text-[14px] leading-[24px]">
                Hello {order?.customerName},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Thank you for your purchase from Magnostadt. We're getting your order ready to be shipped.
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                <strong>Order ID:</strong> {order?.id}
              </Text>
            </Section>

            <Section>
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              <Heading as="h3" className="text-[18px] font-bold m-0 mb-4">
                Items Ordered
              </Heading>
              
              {order?.items.map((item) => (
                <Row key={item.productId} className="mb-4">
                   <Column>
                    <Img
                      src={item.product.imageUrl || 'https://via.placeholder.com/150'}
                      width="64"
                      height="64"
                      alt={item.product.name}
                      className="rounded"
                    />
                   </Column>
                   <Column className="pl-4">
                      <Text className="m-0 font-bold">{item.product.name}</Text>
                      <Text className="m-0 text-gray-500">Qty: {item.quantity}</Text>
                   </Column>
                   <Column className="text-right">
                      <Text className="m-0 font-mono">${Number(item.price).toFixed(2)}</Text>
                   </Column>
                </Row>
              ))}
              
              <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
              
              <Row>
                  <Column>
                    <Text className="m-0 font-bold text-[16px]">Total</Text>
                  </Column>
                  <Column className="text-right">
                     <Text className="m-0 font-bold text-[20px]">${Number(order?.total).toFixed(2)}</Text>
                  </Column>
              </Row>
            </Section>
            
             <Section className="mt-8">
               <Heading as="h3" className="text-[18px] font-bold m-0 mb-2">
                Shipping To
              </Heading>
              <Text className="m-0 text-gray-600">
                {order?.address}<br/>
                {order?.city}, {order?.zipCode}
              </Text>
             </Section>

            <Section className="mt-[32px] text-center">
              <Link
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`https://magnostadt.com/order/${order?.id}`} // Ideally env var
              >
                View Order Status
              </Link>
            </Section>
            
            <Section className="mt-8 border-t border-gray-200 pt-8">
               <Text className="text-center text-gray-400 text-xs">
                 © 2026 Magnostadt. All rights reserved.
               </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmation;
