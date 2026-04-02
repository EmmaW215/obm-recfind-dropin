import './globals.css';

export const metadata = {
  title: 'RecFindOBM \u2014 Drop-in Programs in Oakville',
  description: 'Find swimming, skating, sports, fitness and more drop-in recreation programs across Oakville community centres, arenas and pools.',
  keywords: 'Oakville, drop-in, recreation, swimming, skating, sports, community centre',
  openGraph: {
    title: 'RecFindOBM \u2014 Oakville Drop-in Programs',
    description: 'Find drop-in recreation programs near you in Oakville',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
