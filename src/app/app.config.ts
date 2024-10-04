import { provideHttpClient, withInterceptors  } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter } from '@analogjs/router';
import { withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
// import { authInterceptor } from './interceptors/auth.interceptor';

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
    // provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
