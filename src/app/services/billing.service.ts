import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '~/app/services/supabase.service';
import { EnvService } from '~/app/services/environment.service';
import { ErrorHandlerService } from '~/app/services//error-handler.service';

/**
 * Environment Types
 */
export type BillingPlans = 'free' | 'hobby' | 'pro' | 'enterprise';
type SpecialPlans = 'sponsor' | 'complimentary' | 'tester' | 'demo' | 'super';
export type UserType = BillingPlans | SpecialPlans;
type EnvironmentType = 'dev' | 'managed' | 'selfHosted' | 'demo';

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

    if (envType === 'selfHosted') {
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


  async createCheckoutSession(productId: string): Promise<string> {
    const userId = (await this.supabaseService.getCurrentUser())?.id;
    const endpoint = this.envService.getEnvVar('DL_STRIPE_CHECKOUT_URL', '/api/v1/checkout-session');

    try {
      const body = { userId, productId };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to create checkout session');
      }
      return data.url;
    } catch (error) {
      throw error;
    }
  }

}
