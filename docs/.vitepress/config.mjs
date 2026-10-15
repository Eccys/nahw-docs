import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Nahw Docs',
  description: 'Full in-depth Nahw (Arabic syntax & grammar) documentation grounded in classical scholarship.',
  lang: 'en-US',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Al-Kalimah', link: '/guide/kalimah' },
      { text: "Al-I'rab", link: '/guide/irab' },
      { text: 'Al-Jumlah', link: '/guide/jumlah' }
    ],
    sidebar: [
      {
        text: 'Foundations (المقدمة)',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Al-Kalimah (Parts of Speech)', link: '/guide/kalimah' },
          { text: "Al-I'rab & Al-Bina'", link: '/guide/irab' },
          { text: 'Al-Jumlah (Sentence Structure)', link: '/guide/jumlah' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Eccys/nahw-docs' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024–present Eccys'
    }
  }
});
