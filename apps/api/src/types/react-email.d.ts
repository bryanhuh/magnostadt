// Ambient type declarations for @react-email/components
// Provides fallback types on Vercel where bun's monorepo hoisting
// prevents TypeScript from resolving the package's own type exports

declare module '@react-email/components' {
    import type { FC, ReactNode } from 'react';

    interface BaseProps {
        children?: ReactNode;
        className?: string;
        style?: React.CSSProperties;
        [key: string]: any;
    }

    export const Body: FC<BaseProps>;
    export const Container: FC<BaseProps>;
    export const Head: FC<BaseProps>;
    export const Heading: FC<BaseProps & { as?: string }>;
    export const Html: FC<BaseProps>;
    export const Img: FC<BaseProps & { src?: string; width?: string; height?: string; alt?: string }>;
    export const Link: FC<BaseProps & { href?: string }>;
    export const Preview: FC<BaseProps>;
    export const Section: FC<BaseProps>;
    export const Text: FC<BaseProps>;
    export const Tailwind: FC<BaseProps>;
    export const Hr: FC<BaseProps>;
    export const Column: FC<BaseProps>;
    export const Row: FC<BaseProps>;
}
