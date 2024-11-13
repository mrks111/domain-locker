import { Injectable } from '@angular/core';
import flagsmith from 'flagsmith';
import { FEATURE_CONFIG } from './feature-config.json';

enum Plan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

enum EnvironmentType {
  DEV = 'dev',
  MANAGED = 'managed',
  SELF_HOSTED = 'self-hosted'
}

@Injectable({
  providedIn: 'root'
})
export class FeatureConfigService {
  private env = process.env;
  private userPlan: Plan;
  private environment: EnvironmentType;

  constructor() {
    // Initialize flagsmith and set environment
    flagsmith.init({ environmentID: this.env['FLAGS_ENV_ID'] || '' });
    this.environment = this.getEnvironmentType();
    this.userPlan = this.getUserPlan();
  }

  private getEnvironmentType(): EnvironmentType {
    if (this.env['ENV_TYPE'] === 'self-hosted') return EnvironmentType.SELF_HOSTED;
    if (this.env['ENV_TYPE'] === 'managed') return EnvironmentType.MANAGED;
    return EnvironmentType.DEV;
  }

  private getUserPlan(): Plan {
    // Retrieve from auth or env (use a fallback if not available)
    return this.env['USER_PLAN'] as Plan || Plan.FREE;
  }

  // Main function to check if a feature is enabled or retrieve its value
  async getFeatureValue(featureKey: string): Promise<any> {
    const feature = FEATURE_CONFIG[featureKey];

    if (!feature) throw new Error(`Feature '${featureKey}' not found in config`);

    // 1. Check Flagsmith if configured
    if (await this.getFlagsmithFeature(featureKey) !== undefined) {
      return await this.getFlagsmithFeature(featureKey);
    }

    // 2. Check based on environment-specific rules
    if (this.environment === EnvironmentType.SELF_HOSTED && feature.selfHostedValue) {
      return feature.selfHostedValue;
    }

    // 3. Check user plan for allowed features or overrides
    if (feature.planOverrides && feature.planOverrides[this.userPlan]) {
      return feature.planOverrides[this.userPlan];
    }
    if (feature.enabledFor?.includes(this.userPlan)) {
      return true;
    }

    // 4. Check for environment variables
    if (feature.source.includes('environment') && this.env[featureKey] !== undefined) {
      return this.env[featureKey] === 'true' || this.env[featureKey];
    }

    // 5. Return default
    return feature.default;
  }

  private async getFlagsmithFeature(featureKey: string): Promise<any> {
    try {
      const featureValue = await flagsmith.getValue(featureKey);
      return featureValue !== undefined ? featureValue : null;
    } catch (error) {
      console.warn(`Flagsmith unavailable: ${error instanceof Error ? error.message : 'Unknown Error'}`);
      return null;
    }
  }
}
