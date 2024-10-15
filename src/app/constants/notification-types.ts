
export interface NotificationType {
  key: string;
  label: string;
  description: string;
  note?: string;
  default?: boolean
}

export const notificationTypes:NotificationType[] = [
  {
    key: 'domain-exp',
    label: 'Expiring Soon',
    description: 'Get notified before a domain is due to expire',
    default: true,
  },
  {
    key: 'ip-change',
    label: 'IP Change',
    description: 'Get notified when the IP address the domain points to changes',
    note: 'If you use a firewall service like Cloudflare, this is NOT recommended, as the IP address will change frequently',
  },
  {
    key: 'whois-change',
    label: 'WHOIS Change',
    description: 'Get notified when any WHOIS records change'
  },
  {
    key: 'dns-change',
    label: 'DNS Change',
    description: 'Get notified when any DNS records are added, removed or amended',
  },
  {
    key: 'ssl-exp',
    label: 'SSL Expiry',
    description: 'Get notified when an SSL certificate is due to expire',
    note: 'This is not recommended if you have auto-SSL, as the certificates have a short lifespan and are renewed automatically',
  },
  {
    key: 'ssl-change',
    label: 'SSL Change',
    description: 'Get notified when any attributes in an SSL certificate change',
    note: 'This is not recommended if you have auto-SSL, as the certificates have a short lifespan and so will change frequently',
  },
  {
    key: 'host-change',
    label: 'Host Change',
    description: 'Get notified when the domain is moved to a different host',
  },
  {
    key: 'security-change',
    label: 'Security Features Change',
    description: 'Get notified when any security features on your domain are added, removed or amended',
  },
];
