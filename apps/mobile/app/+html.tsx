import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: rootCss }} />
      </head>
      <body style={{ height: '100%', margin: 0 }}>{children}</body>
    </html>
  );
}

const rootCss = `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
body {
  background-color: #F7F8F6;
  overflow: hidden;
}
#root > div {
  height: 100%;
  display: flex;
  flex-direction: column;
}
`;
