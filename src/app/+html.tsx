import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0C0806" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#F7F4EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0C0806" />
        <meta name="color-scheme" content="dark light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --browser-chrome-color: #0C0806;
              }
              html, body, #root {
                background-color: #0C0806;
                min-height: 100%;
                min-height: 100dvh;
                margin: 0;
                padding: 0;
                overflow-x: hidden;
              }
              @media (prefers-color-scheme: light) {
                :root {
                  --browser-chrome-color: #F7F4EE;
                }
                html, body, #root {
                  background-color: #F7F4EE;
                }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
