
export const statsLinks = [
  { label: 'Timeline', icon: 'pi pi-calendar', routerLink: '/stats/registration-timeline' },
  { label: 'Map', icon: 'pi pi-map-marker',  routerLink: '/stats/host-map' },
  { label: 'Domain Providers', icon: 'pi pi-chart-pie', routerLink: '/stats/domain-providers' },
  { label: 'Security Profile', icon: 'pi pi-unlock', routerLink: '/stats/security-profile' },
  { label: 'Tag Cloud', icon: 'pi pi-tags', routerLink: '/stats/tag-cloud' },
  { label: 'SSL Lifespan', icon: 'pi pi-chart-bar', routerLink: '/stats/ssl-lifespan' },
  { label: 'Subdomain Map', icon: 'pi pi-sitemap', routerLink: '/stats/tld-and-sub' },
  { label: 'Response Times', icon: 'pi pi-wave-pulse', routerLink: '/stats/uptime' },
  { label: 'Change Frequency', icon: 'pi pi-history', routerLink: '/stats/change-frequency' },
  { label: 'Payments Chart', icon: 'pi pi-credit-card', routerLink: '/stats/renewal-payments' },
  { label: 'Domain Valuations', icon: 'pi pi-chart-scatter', routerLink: '/stats/cost-analysis' },
  { label: 'Upcoming Expiries', icon: 'pi pi-clock', routerLink: '/stats/upcoming-expirations' },
];

export const settingsLinks = [
  { label: 'User Settings', icon: 'pi pi-user-edit', routerLink: '/settings/user-settings' },
  { label: 'Notification Preferences', icon: 'pi pi-bell', routerLink: '/settings/notification-preferences' },
  { label: 'Display Modes', icon: 'pi pi-palette', routerLink: '/settings/display-modes' },
  { label: 'Manage Plan', icon: 'pi pi-shop', routerLink: '/settings/manage-plan' },
  { label: 'Developer Options', icon: 'pi pi-code', routerLink: '/settings/developer-options' },
  { label: 'Announcements', icon: 'pi pi-megaphone', routerLink: '/settings/announcements' },
  { label: 'Get Help', icon: 'pi pi-question-circle', routerLink: '/settings/get-help' },
  { label: 'Danger Zone', icon: 'pi pi-exclamation-triangle', routerLink: '/settings/danger-zone' },
];

export const authenticatedNavLinks = [
  {
    label: 'Domains',
    icon: 'pi pi-fw pi-globe',
    routerLink: '/domains',
    items: [
      {
        label: 'Inventory',
        icon: 'pi pi-briefcase',
        routerLink: '/domains',
      },
      {
        label: 'Valuation',
        icon: 'pi pi-money-bill',
        routerLink: '/value',
      },
      {
        label: 'Change History',
        icon: 'pi pi-history',
        routerLink: '/domains/change-history',
      },
      {
        label: 'Categories',
        icon: 'pi pi-fw pi-tags',
        routerLink: '/assets/tags',
      },
      {
        label: 'Add Domain',
        icon: 'pi pi-fw pi-plus',
        routerLink: '/domains/add'
      },
      {
        label: 'Move Data',
        icon: 'pi pi-fw pi-truck',
        items: [
          {
            label: 'Bulk Import',
            icon: 'pi pi-fw pi-upload',
            routerLink: '/domains/add/bulk-add'
          },
          {
            label: 'Bulk Export',
            icon: 'pi pi-download',
            routerLink: '/domains/export',
          },
        ],
      },
    ],
  },
  {
    label: 'Assets',
    icon: 'pi pi-box',
    routerLink: '/assets',
    items: [
      {
        label: 'Registrars',
        icon: 'pi pi-fw pi-receipt',
        routerLink: '/assets/registrars',
      },
      {
        label: 'Hosts',
        icon: 'pi pi-fw pi-server',
        routerLink: '/assets/hosts',
      },
      {
        label: 'Certificates',
        icon: 'pi pi-fw pi-key',
        routerLink: '/assets/certs',
      },
      {
        label: 'IPs',
        icon: 'pi pi-fw pi-sitemap',
        routerLink: '/assets/ips',
      },
      {
        label: 'DNS',
        icon: 'pi pi-fw pi-table',
        routerLink: '/assets/dns',
      },
      {
        label: 'Tags',
        icon: 'pi pi-fw pi-tags',
        routerLink: '/assets/tags',
      },
      {
        label: 'Security',
        icon: 'pi pi-fw pi-shield',
        routerLink: '/assets/statuses',
      },
    ],
  },
  {
    label: 'Statistics',
    icon: 'pi pi-fw pi-wave-pulse',
    routerLink: '/stats',
    // items: statsLinks,
    // items: [
    //   { label: 'View All', items: statsLinks }
    // ],
  },
];
