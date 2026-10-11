import './globals.css';
import ResponsiveWrapper from '../components/ResponsiveWrapper';

export const metadata = {
  title: '15 Anos - Rebeca',
  description: 'Aplicativo do evento de 15 anos da Rebeca',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ResponsiveWrapper>
          {children}
        </ResponsiveWrapper>
      </body>
    </html>
  );
}