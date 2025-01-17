
export interface AboutLink {
  title: string;
  description: string;
  link?: string;
  href?: string;
  icon: string;
}

export interface AboutPage {
  title: string;
  links: AboutLink[];
}

export const aboutPages: AboutPage[] = [
  {
    title: 'Intro',
    links: [
      {
        title: 'Why you need a Domain Management System',
        description: '',
        link: '/about/domain-management',
        icon: '',
      },
      { title: 'Features', description: '', link: '/about/features', icon: '' },
      { title: 'Pricing', description: '', link: '/about/pricing', icon: '' },
      { title: 'Comparison', description: '', link: '/about/alternatives', icon: '' },
    ],
  },
  {
    title: 'Getting Started Guides',
    links: [
      { title: 'Domain Locker Usage Guide', description: '', link: '', icon: '' },
      { title: 'Self Hosted Setup', description: '', link: '/about/self-hosting', icon: '' },
    ],
  },
  {
    title: 'Support',
    links: [
      { title: 'Docs', description: '', link: '', icon: '' },
      { title: 'FaQ', description: '', link: '', icon: '' },
      { title: 'Contact', description: '', link: '/about/contact', icon: '' },
    ],
  },
  {
    title: 'Security',
    links: [
      { title: 'Domain Management Security Best Practices', description: '', link: '', icon: '' },
      { title: 'Securing your self-hosted instance', description: '', link: '', icon: '' },
      { title: 'Reporting a Security Issue', description: '', link: '', icon: '' },
      { title: 'Additional Security Resources', description: '', link: '', icon: '' },
    ],
  },
  {
    title: 'Articles',
    links: [
      { title: 'Useful tools and resources', description: '', link: '/about/external-tools', icon: '' },
      { title: 'What is a domain name', description: '', link: '', icon: '' },
      { title: 'Registering and managing domains', description: '', link: '', icon: '' },
      { title: 'Using a custom domain for your app', description: '', link: '', icon: '' },
      
    ],
  },
  {
    title: 'Legal',
    links: [
      { title: 'Privacy Policy', description: '', link: '/about/legal/privacy-policy', icon: '' },
      { title: 'Terms of Service', description: '', link: '', icon: '' },
      { title: 'Open Source License', description: '', link: '', icon: '' },
      { title: 'Accessibility', description: '', link: '', icon: '' },
      { title: 'Security.txt', description: '', link: '', icon: '' },
      { title: 'GDPR Compliance', description: '', link: '', icon: '' },
      { title: 'Fair Use Policy', description: '', link: '', icon: '' },
    ],
  },
  {
    title: 'External Links',
    links: [
      { title: 'GitHub', description: 'Source code', href: 'https://github.com/lissy93/domain-locker', icon: 'pi pi-github' },
      { title: 'DockerHub', description: '', href: '', icon: '' },
      { title: 'More Apps', description: '', href: 'https://apps.aliciasykes.com', icon: '' },
    ],
  },
];
