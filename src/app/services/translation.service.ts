import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private platformId = inject(PLATFORM_ID);
  private defaultLang = 'en';

  // Define available languages with hard-coded metadata
  availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  constructor(public translateService: TranslateService) {
    this.setInitialLanguage();
  }

  // Initialize the language based on stored preference or default
  private setInitialLanguage() {
    const languageToUse = this.getLanguageToUse();
    this.translateService.setDefaultLang(this.defaultLang);
    this.translateService.use(languageToUse);
  }

  // If on browser, check for saved language, otherwise use default
  private getLanguageToUse(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('language') || this.defaultLang;
    }
    return this.defaultLang;
  }

  // Switch the language and store the preference
  switchLanguage(langCode: string) {
    if (!langCode) return;
    this.translateService.use(langCode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('language', langCode);
    }
  }
}
