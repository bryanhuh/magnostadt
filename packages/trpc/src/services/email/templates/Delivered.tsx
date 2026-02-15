import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';


interface DeliveredProps {
  order: {
    id: string;
    customerName: string;
    items: {
      product: {
        name: string;
      };
    }[];
  };
}

export const Delivered = ({
  order,
}: DeliveredProps) => {
  const previewText = `Your order #${order?.id} has been delivered!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Order <strong>Delivered!</strong> 📦
              </Heading>
              <Text className="text-black text-[14px] leading-[24px]">
                Hello {order?.customerName},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Your package has arrived! We hope you enjoy your new gear from Magnostadt.
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                 It includes <strong>{order?.items[0]?.product.name}</strong> 
                 {order?.items.length > 1 && ` and ${order.items.length - 1} other item(s)`}.
              </Text>
            </Section>

            <Section className="mt-[32px] text-center">
              <Link
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`https://magnostadt.com/order/${order?.id}`}
              >
                View Order
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

export default Delivered;
