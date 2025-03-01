import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { EnvService, EnvironmentType, EnvVar } from '~/app/services/environment.service';
import { BillingService } from '~/app/services/billing.service';
import { from, Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { ThemeService } from '~/app/services/theme.service';
import { SupabaseService } from '~/app/services/supabase.service';
import { TranslationService } from '~/app/services/translation.service';
import DatabaseService from '~/app/services/database.service';
import { FeatureService } from '~/app/services/features.service';


// @ts-ignore
declare const __APP_VERSION__: string;
// Similarly for app name
declare const __APP_NAME__: string;

/** Short interface for domain info */
interface DomainInfo {
  protocol: string;
  host: string;
  origin: string;
}

/** Short interface for screen info */
interface ScreenInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './debug-info.page.html',
  styles: [``],
})
export default class DebugInfoPage implements OnInit {
  // Basic app info
  public appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
  public appName = typeof __APP_NAME__ !== 'undefined' ? __APP_NAME__ : 'DL-App';
  public environmentType!: EnvironmentType;
  public errorLog: { date: Date; message: string; location?: string; error?: any }[] = [];
  public enabledDb = { supabase: false, postgres: false };

  // Observables / data from services
  currentPlan$?: Observable<string | null>;
  user$?: Observable<User | null>;
  displayOptions?: { theme: string; darkMode: boolean; font: string; scale: string };
  language: string = 'English';

  // Domain / Browser Info (client side)
  public domainInfo?: DomainInfo;
  public userAgent?: string;
  public platform?: string;
  public ipAddress?: string;
  public screenInfo?: ScreenInfo;
  public cookiesEnabled?: boolean;
  public navigatorLanguage?: string;
  public navigatorLanguages?: readonly string[];
  public userAgentData?: string;
  public doNotTrack?: string | null;
  public isOnline?: boolean;
  public hardwareConcurrency?: number;
  public deviceMemory?: number;
  public timeZone?: string;
  public orientation?: string;

  // Additional
  public setEnvVars: { envName: EnvVar; hasValue: boolean }[] = [];
  public featureChecks: { feature: string; enabled: boolean }[] = [];
  public tableChecks: { table: string; count: number | string; success: string }[] = [];
  public loadingTableChecks = false;

  constructor(
    private errorHandler: ErrorHandlerService,
    private billingService: BillingService,
    private envService: EnvService,
    private themeService: ThemeService,
    private supabaseService: SupabaseService,
    private translationService: TranslationService,
    private databaseService: DatabaseService,
    private featureService: FeatureService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // 1) Basic logs, environment type, DB usage
    this.errorLog = this.errorHandler.getRecentErrorLog();
    this.environmentType = this.envService.getEnvironmentType();
    this.enabledDb = {
      supabase: this.envService.isSupabaseEnabled(),
      postgres: this.envService.isPostgresEnabled(),
    };

    // 2) Observables
    this.currentPlan$ = this.billingService.getUserPlan();
    if (this.enabledDb.supabase) {
      this.user$ = from(this.supabaseService.getCurrentUser());
    }
    this.displayOptions = this.themeService.getUserPreferences();
    this.language = this.translationService.getLanguageToUse();

    // 3) Only gather certain data in browser
    if (isPlatformBrowser(this.platformId)) {
      this.gatherDomainAndBrowserInfo();
      this.gatherExtendedNavigatorInfo();
      this.fetchUserIpAddress();
    }

    // 4) Feature checks
    this.featureService.featureReportForDebug()
      .then((features) => {
        this.featureChecks = features;
      })
      .catch((err) => {
        this.errorHandler.handleError({
          error: err,
          message: 'Failed to fetch feature checks',
          location: 'DebugInfoPage',
        });
      });

    // 5) Attempt table checks
    try {
      this.onCheckTables();
    } catch (err: any) {
      this.errorHandler.handleError({
        error: err,
        message: 'Failed to check tables',
        location: 'DebugInfoPage',
      });
    }

    // 6) Env vars
    this.setEnvVars = this.envService.checkAllEnvironmentalVariables();
  }

  /**
   * Basic domain & browser info:
   *  - window.location => domainInfo
   *  - navigator => userAgent, platform
   */
  private gatherDomainAndBrowserInfo(): void {
    try {
      this.domainInfo = {
        protocol: window.location.protocol,
        host: window.location.host,
        origin: window.location.origin,
      };
      this.userAgent = navigator.userAgent || 'UnknownAgent';
      this.platform = navigator.platform || 'UnknownPlatform';

      // screen info
      this.screenInfo = {
        width: window.screen.width,
        height: window.screen.height,
        devicePixelRatio: window.devicePixelRatio || 1,
      };

      // cookies
      this.cookiesEnabled = navigator.cookieEnabled;

      // language
      this.navigatorLanguage = navigator.language || 'none';
      this.navigatorLanguages = navigator.languages || [];
    } catch (err) {
      console.error('Failed to gather domain/browser info:', err);
    }
  }

  /**
   * Extended info from navigator: userAgentData, doNotTrack, etc.
   */
  private async gatherExtendedNavigatorInfo(): Promise<void> {
    try {
      if ((navigator as any).userAgentData) {
        const uaData = (navigator as any).userAgentData;
        if (uaData.getHighEntropyValues) {
          const highEntropy = await uaData.getHighEntropyValues([
            'platform',
            'model',
            'uaFullVersion',
          ]);
          this.userAgentData = JSON.stringify(highEntropy);
        } else {
          this.userAgentData = JSON.stringify(uaData);
        }
      }

      this.doNotTrack = navigator.doNotTrack;
      this.isOnline = navigator.onLine;
      this.hardwareConcurrency = navigator.hardwareConcurrency || 1;
      this.deviceMemory = (navigator as any).deviceMemory || undefined;
      this.timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UnknownZone';
      this.orientation = window.screen.orientation?.type || 'UnknownOrientation';
    } catch (err) {
      console.warn('Extended navigator info fetch failed:', err);
    }
  }

  /**
   * Fetch user IP from an external service, e.g. ipify
   */
  private fetchUserIpAddress(): void {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => {
        this.ipAddress = data?.ip || 'Unknown';
      })
      .catch((err) => {
        console.warn('Failed to fetch IP address:', err);
        this.ipAddress = 'FetchFailed';
      });
  }

  /**
   * Check DB tables
   */
  public onCheckTables() {
    this.loadingTableChecks = true;
    this.tableChecks = [];

    this.databaseService.instance.checkAllTables().subscribe({
      next: (results) => {
        this.tableChecks = results;
        this.loadingTableChecks = false;
      },
      error: (err) => {
        console.error('Unexpected error from checkAllTables:', err);
        this.loadingTableChecks = false;
      },
    });
  }

  /** Dummy error generator for testing */
  public triggerDummyError(): void {
    this.errorHandler.handleError({
      error: new Error('Test Error- ignore me!'),
      message: 'This is a dummy error',
      location: 'DebugInfoPage',
      showToast: true,
    });
  }
}
