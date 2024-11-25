import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ThemeService, Theme, FontOption } from '@services/theme.service';
import { SupabaseService } from '@services/supabase.service';
import { TranslationService } from '@services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-ui-settings',
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './ui-options.component.html',
  styleUrls: ['./ui-options.component.scss']
})
export class UiSettingsComponent implements OnInit {
  @Input() isAuthenticated?: boolean = false;
  @Input() standAlone?: boolean = false;

  darkModeOptions = [
    { label: 'Light', value: false, icon: 'pi pi-sun' },
    { label: 'Dark', value: true, icon: 'pi pi-moon' }
  ];

  scaleOptions = [
    { label: 'Small', value: 'small', icon: 'pi pi-minus-circle' },
    { label: 'Medium', value: 'medium', icon: 'pi pi-circle-off' },
    { label: 'Large', value: 'large', icon: 'pi pi-plus-circle' }
  ];

  isDarkTheme: boolean = false;
  selectedTheme: Theme;
  themes: Theme[];
  scale: 'small' | 'medium' | 'large' = 'medium';

  fonts: FontOption[] = [];
  selectedFont: FontOption | null = null;

  private subscriptions: Subscription = new Subscription();
  languages: any[] = [];
  selectedLanguage: string = 'en';

  constructor(
    public supabaseService: SupabaseService,
    private themeService: ThemeService,
    private languageService: TranslationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.themes = this.themeService.getThemes();
    this.selectedTheme = this.themes[0];

    this.fonts = this.themeService.getFonts();
    this.subscriptions.add(
      this.themeService.selectedFont$.subscribe((font) => {
        this.selectedFont = font;
        // this.cdr.detectChanges();
      })
    );
  }


  ngOnInit(): void {
    this.languages = this.languageService.availableLanguages;
    this.selectedLanguage = this.languageService.translateService.currentLang;
    
    this.subscriptions.add(
      this.themeService.isDarkTheme$.subscribe(isDark => {
        this.isDarkTheme = isDark;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.themeService.selectedTheme$.subscribe(theme => {
        this.selectedTheme = theme;
        this.cdr.detectChanges();
      })
    );
  }

  onLanguageChange(langCode: string) {
    this.languageService.switchLanguage(langCode);
  }

  onDarkModeChange() {
    this.themeService.toggleDarkMode();
  }

  onThemeChange(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  onFontChange(font: FontOption) {
    this.themeService.setFont(font);
  }

  onScaleChange() {
    const scales = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = scales[this.scale] || scales.medium;
    localStorage.setItem('scale', this.scale);
  }

  async signOut() {
    await this.supabaseService.signOut();
    window.location.href = '/login';
  }
}
