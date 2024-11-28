import { Component } from '@angular/core';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'about-index-page',
  templateUrl: './about.page.html',
  imports: [CommonModule, PrimeNgModule],
})
export default class AboutPageComponent {
  sections = [
    {
      title: 'Intro',
      links: [
        {
          title: 'Why you need a Domain Management System',
          description: '',
          link: '',
          icon: '',
        },
        { title: 'Features', description: '', link: '/about/features', icon: '' },
        { title: 'Alternatives & Comparison', description: '', link: '/about/alternatives', icon: '' },
        { title: 'Pricing', description: '', link: '/about/pricing', icon: '' },
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
        { title: 'What is a domain name', description: '', link: '', icon: '' },
        { title: 'Registering and managing domains', description: '', link: '', icon: '' },
        { title: 'Using a custom domain for your app', description: '', link: '', icon: '' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { title: 'Privacy Policy', description: '', link: '', icon: '' },
        { title: 'Terms of Service', description: '', link: '', icon: '' },
        { title: 'Open Source License', description: '', link: '', icon: '' },
        { title: 'Trademark Policy', description: '', link: '', icon: '' },
        { title: 'Security.txt', description: '', link: '', icon: '' },
        { title: 'GDPR Policy', description: '', link: '', icon: '' },
        { title: 'Fair Use Policy', description: '', link: '', icon: '' },
      ],
    },
    {
      title: 'External Links',
      links: [
        { title: 'GitHub', description: '', link: '', icon: '' },
        { title: 'DockerHub', description: '', link: '', icon: '' },
        { title: 'More Apps', description: '', link: '', icon: '' },
      ],
    },
  ];
}

