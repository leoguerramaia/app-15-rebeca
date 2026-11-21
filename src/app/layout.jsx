import './globals.css';
import ResponsiveWrapper from '../components/ResponsiveWrapper';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: '15 Anos - Rebeca',
  description: 'Aplicativo do evento de 15 anos da Rebeca',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <ResponsiveWrapper>
          {children}
        </ResponsiveWrapper>
      </body>
    </html>
  );
}
