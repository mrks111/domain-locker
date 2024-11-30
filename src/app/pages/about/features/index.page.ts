import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DlIconComponent } from '@components/misc/svg-icon.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DlIconComponent],
  templateUrl: './index.page.html',
})
export default class FeaturesPage {
  public features = [
    {
      featureTitle: 'Track Assets',
      icon: 'track',
      iconViewBox: '0 0 576 512',
      featureInfo: [
        'We auto-fetch assets like SSL, hosts, registrars, IPs, and DNS.',
        'You can add additional context, like subdomains, costs, tags, notes, and more.',
      ],
    },
    {
      featureTitle: 'Domain Data',
      icon: 'data',
      iconViewBox: '0 0 448 512',
      featureInfo: [
        'Detailed domain info: WHOIS, server location, updates, etc.',
        'Security insights and recommended actions for each domain.',
      ],
    },
    {
      featureTitle: 'Valuation',
      icon: 'value',
      featureInfo: [
        'Track purchase price, renewal costs, and current valuation.',
        'Manage payments and monitor profit/loss trends.',
      ],
    },
    {
      featureTitle: 'Stats',
      icon: 'chart',
      featureInfo: [
        'Visualize domain data with charts and analytics.',
        'Maps, change timelines, provider breakdowns, and more.',
      ],
    },
    {
      featureTitle: 'Notifications',
      icon: 'notification',
      iconViewBox: '0 0 640 512',
      featureInfo: [
        'Alerts for expirations or changes to SSL, host, registrar, etc.',
        'Choose your method: email, webhook, push, Telegram, Signal, etc.',
      ],
    },
    {
      featureTitle: 'Data',
      icon: 'export',
      iconViewBox: '0 0 567 512',
      featureInfo: [
        'Access via API, Prometheus, iCal, RSS, or embeddable widgets (coming soon).',
        'Export your data anytime for migration or backup.',
      ],
    },
    {
      featureTitle: 'Track Changes',
      icon: 'logs',
      iconViewBox: '0 0 576 512',
      featureInfo: [
        'View audit logs for all domain changes.',
        'Track updates to security, host, SSL, DNS, WHOIS, and more.',
        'Monitor website response time and uptime history.',
      ],
    },
    {
      featureTitle: 'Monitor',
      icon: 'monitor',
      iconViewBox: '0 0 576 512',
      featureInfo: [
        'Monitor web health for domains.',
        'Track uptime, ping times, response codes and availability.',
      ],
    },
    {
      featureTitle: 'Customizable',
      icon: 'customize',
      iconViewBox: '0 0 576 512',
      featureInfo: [
        'Choose themes, color schemes, dark/light modes, and languages.',
        'Make the app yours, in your native language.',
      ],
    },
    {
      featureTitle: 'Secure & Private',
      icon: 'secure',
      featureInfo: [
        'Full control of your data with easy import/export/deletion.',
        'SSO (GitHub, Google) and 2FA for extra security.',
        'No unnecessary data collection, transparent privacy policy.',
      ],
    },
    {
      featureTitle: 'Open Source',
      icon: 'open',
      featureInfo: [
        'Download, review, and improve our open-source code.',
        'Self-host Domain Locker on your own server.',
      ],
    },
    {
      featureTitle: 'Quality',
      icon: 'quality',
      featureInfo: [
        'Accessible, responsive, and lightning-fast.',
        'Well-documented and thoroughly tested for reliability.',
      ],
    },
  ];
}
