import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './environments/environment';

@Injectable()
export class ServerSafeTranslateLoader implements TranslateLoader {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  /* Loads translations from the server or client-side based on the platform */
  getTranslation(lang: string): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      // Client-side: Load translations via HttpClient
      return this.http.get(`/i18n/${lang}.json`).pipe(
        catchError((error) => {
          console.error(`Error loading client-side translations for "${lang}":`, error);
          return of({});
        })
      );
    } else {
      // Server-side: Fetch translations via API
      const endpoint = `${environment.BASE_URL}/api/translations?lang=${lang}`;
      return new Observable((observer) => {
        fetch(endpoint)
          .then((response) => response.json())
          .then((data) => {
            observer.next(data.translations || {});
            observer.complete();
          })
          .catch((error) => {
            console.error(`Error loading server-side translations for "${lang}":`, error);
            observer.next({});
            observer.complete();
          });
      });
    }
  }
}

/** Initializes the language based on client or server environment */
export function languageInitializerFactory(translate: TranslateService, platformId: Object) {
  return () => {
    const defaultLang = 'en';
    if (isPlatformBrowser(platformId)) {
      const savedLanguage = localStorage?.getItem('language') || defaultLang;
      translate.setDefaultLang(savedLanguage);
      translate.use(savedLanguage);
    } else {
      translate.setDefaultLang(defaultLang);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Core Providers
    provideHttpClient(withFetch()),
    provideClientHydration(),
    provideContent(withMarkdownRenderer()),
    provideAnimations(),
    provideFileRouter(
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withEnabledBlockingInitialNavigation()
    ),
    
    // PrimeNG Services
    ConfirmationService,
    MessageService,
    
    // Translation Module
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: ServerSafeTranslateLoader },
      })
    ),
    
    // Language Initialization
    {
      provide: APP_INITIALIZER,
      useFactory: languageInitializerFactory,
      deps: [TranslateService, PLATFORM_ID],
      multi: true,
    },
  ],
};
