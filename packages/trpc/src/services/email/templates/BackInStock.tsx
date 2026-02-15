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
} from '@react-email/components';

interface BackInStockProps {
  product: {
    name: string;
    imageUrl?: string | null;
    slug: string;
    price: string | number;
  };
}

export const BackInStock = ({ product }: BackInStockProps) => {
  const previewText = `${product?.name} is back in stock!`;
  const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px] text-center">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Great news! <strong>{product?.name}</strong> is back in stock!
              </Heading>

              {product?.imageUrl && (
                <Img
                  src={product.imageUrl}
                  width="200"
                  height="250"
                  alt={product.name}
                  className="mx-auto rounded my-4"
                  style={{ objectFit: 'contain' }}
                />
              )}

              <Text className="text-black text-[14px] leading-[24px] text-center">
                The item you've been waiting for is now available. Don't miss out — grab it before it's gone again!
              </Text>

              <Text className="text-black text-[20px] font-bold text-center my-4">
                ${Number(product?.price).toFixed(2)}
              </Text>
            </Section>

            <Section className="text-center mt-[16px]">
              <Link
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`${appUrl}/product/${product?.slug}`}
              >
                Shop Now
              </Link>
            </Section>

            <Section className="mt-8 border-t border-gray-200 pt-8">
              <Text className="text-center text-gray-400 text-xs">
                You received this email because you signed up for a back-in-stock alert on Magnostadt.
              </Text>
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

export default BackInStock;
