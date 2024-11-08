import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  TranslateLoader,
  TranslateService,
  MissingTranslationHandler,
  MissingTranslationHandlerParams,
} from '@ngx-translate/core';
import { environment } from '@/app/environments/environment';

@Injectable()
export class ServerSafeTranslateLoader implements TranslateLoader {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  /** Loads translations from the server or client-side based on the platform */
  getTranslation(lang: string): Observable<any> {
    const langRequestUrl = isPlatformBrowser(this.platformId) ?
      `/i18n/${lang}.json`
      : `${environment.BASE_URL}/api/translations?lang=${lang}`;
    return this.http.get(langRequestUrl).pipe(catchError(() => of({})));
  }
}

/** Handler for missing translations, used to log the error and return the fallback */
@Injectable({ providedIn: 'root' })
export class CustomMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    console.warn(`Missing translation for key: "${params.key}"`);
    return `[${params.key}]`;
  }
}

/** Initializes the language based on client or server environment */
export function languageInitializerFactory(translate: TranslateService, platformId: Object) {
  return () => {
    const defaultLang = 'en';
    if (isPlatformBrowser(platformId)) {
      const savedLanguage = localStorage?.getItem('language') || defaultLang;
      translate.setDefaultLang(defaultLang);
      translate.use(savedLanguage);
    } else {
      translate.setDefaultLang(defaultLang);
    }
  };
}
