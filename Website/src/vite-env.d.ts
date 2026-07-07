/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'ms-store-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      productid?: string;
      'window-mode'?: string;
      theme?: string;
      size?: string;
      language?: string;
      animation?: string;
    }, HTMLElement>;
  }
}
