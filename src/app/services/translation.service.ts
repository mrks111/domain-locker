import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'de']);
    this.translate.setDefaultLang('en');
    this.useLanguage('en');
  }

  // Method to switch language
  useLanguage(language: string) {
    this.translate.use(language);
  }

  // Optional: method to get current language
  get currentLanguage(): string {
    return this.translate.currentLang;
  }
}
