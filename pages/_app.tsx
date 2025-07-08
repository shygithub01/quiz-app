// pages/_app.tsx
import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import '../styles/globals.css' // adjust path to your CSS file

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#667eea',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8f9fa',
          borderRadius: '12px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        },
        elements: {
          card: {
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: 'none',
            padding: '40px'
          },
          headerTitle: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '15px'
          },
          headerSubtitle: {
            color: '#666',
            fontSize: '1.1rem',
            marginBottom: '30px'
          },
          socialButtonsBlockButton: {
            border: '2px solid #ddd',
            borderRadius: '12px',
            padding: '12px',
            transition: 'all 0.3s ease'
          },
          formButtonPrimary: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            transition: 'all 0.3s ease'
          },
          formFieldInput: {
            border: '2px solid #ddd',
            borderRadius: '8px',
            padding: '12px 15px',
            fontSize: '16px',
            transition: 'border-color 0.3s ease'
          },
          footerActionLink: {
            color: '#667eea',
            fontWeight: '600'
          }
        }
      }}
      afterSignOutUrl="/"
    >
      <Component {...pageProps} />
    </ClerkProvider>
  )
}

