import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { BillingService } from '@/app/services/billing.service';
import { EnvService, type EnvironmentType } from '@/app/services/environment.service';

import { features, type FeatureConfig, type FeatureDefinitions } from '@/app/constants/feature-options';


@Injectable({
  providedIn: 'root',
})
export class FeatureConfigService {
  private environment: EnvironmentType;
  private userPlan$: Observable<string | null>;
  private features: FeatureDefinitions = features;

  private activeFeatures$: BehaviorSubject<Record<keyof FeatureDefinitions, any>> = new BehaviorSubject({} as Record<keyof FeatureDefinitions, any>);

  constructor(private billingService: BillingService, private environmentService: EnvService) {
    this.environment = this.environmentService.getEnvironmentType();
    this.userPlan$ = this.billingService.getUserPlan();

    // Reactive update for feature configurations
    combineLatest([this.userPlan$]).subscribe(([userPlan]) => {
      const features = this.resolveFeatures(userPlan || 'free');
      this.activeFeatures$.next(features);
    });
  }

  /**
   * Resolves features based on user plan, environment, and feature configuration.
   */
  private resolveFeatures(userPlan: string): Record<keyof FeatureDefinitions, any> {
    const features: Partial<Record<keyof FeatureDefinitions, any>> = {};

    for (const [feature, config] of Object.entries(this.features) as [keyof FeatureDefinitions, FeatureConfig<any>][]) {
      let value = config.default;

      if (this.environment in config) {
        value = config[this.environment as keyof FeatureConfig<any>]!;
      } else if (this.environment === 'managed' && typeof config.managed === 'object') {
        value = config.managed[userPlan] ?? config.default;
      } else if (this.environment === 'managed' && typeof config.managed !== 'undefined') {
        value = config.managed;
      }

      features[feature] = value;
    }

    return features as Record<keyof FeatureDefinitions, any>;
  }

  /**
   * Get the resolved value for a specific feature.
   */
  public getFeatureValue<T>(feature: keyof FeatureDefinitions): Observable<T | null> {
    return this.activeFeatures$.pipe(map((features) => (features[feature] ?? null) as T | null));
  }

  /**
   * Check if a specific feature is enabled (boolean features).
   */
  public isFeatureEnabled(feature: keyof FeatureDefinitions): Observable<boolean> {
    return this.getFeatureValue<boolean>(feature).pipe(map((value) => !!value));
  }
}
