// Site identity: the one home for names, URLs and SEO copy used by the head, JSON-LD and footer.
export const SITE = {
  name: 'Nomadware',
  url: 'https://nomadware.io/',
  email: 'contact@nomadware.io',
  title: 'Nomadware — Software engineering, at agent speed',
  description:
    'Nomadware is a small software studio with large output: web, mobile, backend and infra, built with human judgment and shipped at agent speed.',
  locale: 'en_US',
  themeColor: '#0c0b12',
  ogImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    alt: 'Nomadware — We build software. Human judgment, at agent speed.',
  },
  logoPath: '/icon-512.png',
} as const;
