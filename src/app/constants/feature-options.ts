import { BillingPlans } from '@/app/services/billing.service';

export type FeatureConfig<T> = {
  default: T;
  managed?: T | Record<BillingPlans, T>;
  selfHosted?: T;
  dev?: T;
  demo?: T;
};

export type FeatureDefinitions = {
  domainLimit: FeatureConfig<number>;
  notificationChannels: FeatureConfig<boolean>;
  changeNotifications: FeatureConfig<boolean>;
  visualStats: FeatureConfig<boolean>;
  changeHistory: FeatureConfig<boolean>;
  accountSettings: FeatureConfig<boolean>;
  writePermissions: FeatureConfig<boolean>;
};

export const features: FeatureDefinitions = {
  domainLimit: {
    default: 10000,
    managed: {
      free: 5,
      hobby: 20,
      pro: 100,
      enterprise: 1000,
    },
  },
  notificationChannels: {
    default: false,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  changeNotifications: {
    default: false,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  visualStats: {
    default: true,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  changeHistory: {
    default: true,
    managed: {
      free: false,
      hobby: true,
      pro: true,
      enterprise: true,
    },
  },
  accountSettings: {
    default: true,
    managed: true,
    selfHosted: false,
  },
  writePermissions: {
    default: true,
    demo: false,
  },
};

export const featureDescriptions: Record<keyof FeatureDefinitions, { label: string; description: string }> = {
  domainLimit: {
    label: 'Domain Limit',
    description: 'The maximum number of domains you can add to your account',
  },
  notificationChannels: {
    label: 'Notification Channels',
    description: 'Receive notifications via email, push notifications, or webhooks',
  },
  changeNotifications: {
    label: 'Change Notifications',
    description: 'Receive notifications when the status of your domains change',
  },
  visualStats: {
    label: 'Stats',
    description: 'View detailed statistics for your domains',
  },
  changeHistory: {
    label: 'Change History',
    description: 'View a history of changes to your domains',
  },
  accountSettings: {
    label: 'Account Settings',
    description: 'Update your account settings',
  },
  writePermissions: {
    label: 'Write Permissions',
    description: 'Allow others to write to your account',
  },
};
