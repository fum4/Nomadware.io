// Site identity: the one home for names, URLs and SEO copy used by the head, JSON-LD and footer.
export const SITE = {
  name: 'Nomadware',
  url: 'https://nomadware.io/',
  email: 'contact@nomadware.io',
  title: 'Nomadware — Software engineering, at agent speed',
  description:
    'Bring us your idea. We unpack, question and sharpen it. We design, build and ship the code that connects it all.',
  locale: 'en_US',
  themeColor: '#0c0b12',
  ogImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    alt: 'Nomadware — We build software. Human judgment, at agent speed.',
  },
  logoPath: '/logo.png',
} as const;
