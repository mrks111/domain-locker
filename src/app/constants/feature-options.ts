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
  statsEnabled: FeatureConfig<boolean>;
  advancedAnalytics: FeatureConfig<boolean>;
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
  statsEnabled: {
    default: true,
    managed: {
      free: false,
      hobby: false,
      pro: true,
      enterprise: true,
    },
  },
  advancedAnalytics: {
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

