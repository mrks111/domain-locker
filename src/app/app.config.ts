import { provideHttpClient  } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, TransferState } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/app/environments/environment';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateService } from '@ngx-translate/core';



export function translateLoaderFactory(http: HttpClient, transferState: TransferState) {
  return new TranslateHttpLoader(http, `${environment.appUrl}/i18n/`, '.json');
}

export function languageInitializerFactory(translate: TranslateService) {
  return () => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    translate.setDefaultLang(savedLanguage);
    translate.use(savedLanguage);
  };
}



export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideClientHydration(),
    provideContent(
      withMarkdownRenderer()
    ),
    provideAnimations(),
    provideFileRouter(
      withInMemoryScrolling({ anchorScrolling: 'enabled' }),
      withEnabledBlockingInitialNavigation()
    ),
    ConfirmationService,
    MessageService,
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: translateLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),


  ],
};
