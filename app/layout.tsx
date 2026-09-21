import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.creator, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,
  applicationName: siteConfig.name,
  category: "Business Operations",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@pulseops",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-background font-sans text-foreground antialiased">
        <script
          // Early bis_* cleanup — browser extensions inject bis_skin_checked / bis_register / __processed_* before React hydrates,
          // causing hydration mismatch on Next.js dev overlay <div hidden>. Strip them before hydration.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=function(){try{var d=document,s='[bis_skin_checked],[bis_register],[bis_version]',a=d.querySelectorAll(s);a.forEach(function(n){n.removeAttribute('bis_skin_checked');n.removeAttribute('bis_register');n.removeAttribute('bis_version');});var b=d.querySelectorAll('*');b.forEach(function(n){var r=n.attributes;for(var i=r.length-1;i>=0;i--){var k=r[i].name;if(k.indexOf('bis_')===0||k.indexOf('__processed')===0)n.removeAttribute(k)}})}catch{}};c();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',c,{once:true});var o=new MutationObserver(c);o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register','bis_version']});}catch{}})();`,
          }}
        />
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ className: "bg-popover text-popover-foreground" }} />
        </AuthProvider>
      </body>
    </html>
  );
}
