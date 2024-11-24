import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '@/app/services/supabase.service';
import { EnvService } from '@/app/services/environment.service';
import { ErrorHandlerService } from '@/app/services//error-handler.service';
import { resolve } from '@angular/compiler-cli';

/**
 * Environment Types
 */
type BillingPlans = 'free' | 'hobby' | 'pro' | 'enterprise';
type SpecialPlans = 'sponsor' | 'complimentary' | 'tester' | 'demo' | 'super';
type UserType = BillingPlans | SpecialPlans;
type EnvironmentType = 'dev' | 'managed' | 'self-hosted' | 'demo';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private userPlan$ = new BehaviorSubject<UserType | null>(null);
  private environmentType: EnvironmentType;

  constructor(
    private supabaseService: SupabaseService,
    private envService: EnvService,
    private errorHandler: ErrorHandlerService,
  ) {
    this.environmentType = this.envService.getEnvironmentType();
  }

  /**
   * Fetches and caches the user's current plan from the database.
   */
  async fetchUserPlan(): Promise<void> {
    const envType = this.environmentType;

    if (envType === 'self-hosted') {
      this.userPlan$.next('super');
      return;
    } else if (envType === 'dev') {
      this.userPlan$.next('tester');
      return;
    } else if (envType === 'demo') {
      this.userPlan$.next('demo');
      return;
    }

    try {
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.userPlan$.next(null);
        return;
      }

      // Fetch user plan from `user_info`
      const { data, error } = await this.supabaseService.getUserBillingInfo();
      if (error || !data?.current_plan) {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch billing info',
          location: 'billing service',
        });
        this.userPlan$.next('free');
        return;
      }
      this.userPlan$.next(data.current_plan as UserType);
    } catch (error) {
      this.errorHandler.handleError({
        error,
        location: 'billing service',
        message: 'Unable to verify billing plan, fallback to free plan',
      });
      this.userPlan$.next('free');
    }
  }

  /**
   * Returns an observable of the user's current plan.
   */
  getUserPlan(): Observable<UserType | null> {
    return this.userPlan$.asObservable();
  }

  /**
   * All the special plans (like sponsor, complimentary, etc.) are mapped
   * to the corresponding billing plan, used for feature availability checks.
   * @param plan 
   * @returns 
   */
  private mapSpecialPlanToBillingPlan(plan: UserType): BillingPlans {
    if (['free', 'hobby', 'pro', 'enterprise'].includes(plan)) {
      return plan as BillingPlans;
    }
    const planMap: Record<SpecialPlans, BillingPlans> = {
      sponsor: 'hobby',
      complimentary: 'hobby',
      tester: 'pro',
      demo: 'pro',
      super: 'enterprise',
    };
    return planMap[plan as SpecialPlans] || 'free';
  }

    /**
   * Creates a Stripe checkout session for the selected plan.
   * @param planId Plan identifier
   */
    async createCheckoutSession(planId: string): Promise<{ url: string }> {
      // const { data, error } = await this.supabaseService.callFunction('create_checkout_session', { plan_id: planId });
      // if (error) {
      //   console.error('Failed to create checkout session:', error);
      //   throw error;
      // }
      // return data;
      return { url: 'https://dummy-url.com' }; // TODO: Replace with actual implementation
    }

    /**
   * Checks if a feature is available for the current user.
   * @param feature Feature to check
   * TODO: I may break this out into a dedicated feature service
   */
    async isFeatureAvailable(feature: string): Promise<boolean> {
      const plan = this.userPlan$.getValue();
  
      if (!plan) return false;
  
      const features = this.getFeaturesForPlan(this.mapSpecialPlanToBillingPlan(plan));
      return features.includes(feature);
    }

  /**
   * Retrieves features available for the given plan.
   * @param plan User's plan
   * TODO: I may break this out into a dedicated feature service
   */
  private getFeaturesForPlan(plan: BillingPlans): string[] {
    // TODO: This needs refining based on the actual features available
    const planFeatures: Record<BillingPlans, string[]> = {
      free: ['basic-domain-info', 'notifications'],
      hobby: ['domain-tracking', 'detailed-info', 'analytics'],
      pro: ['all', 'support', 'monitoring', 'branding'],
      enterprise: ['everything', 'priority-support'],
    };

    return planFeatures[plan] || [];
  }
}
