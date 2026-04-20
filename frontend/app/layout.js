import './globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'Coinbird — The Budget Planner',
  description: 'A beautiful personal finance app for smart budgeting and financial growth.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
