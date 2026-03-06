/* eslint-disable react-refresh/only-export-components */
import "./globals.css";

export const metadata = {
  title: "Nexus3D Admin Dashboard",
  description: "SaaS analytics and operations dashboard for 3D printing services"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
