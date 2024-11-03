import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ThemeService, Theme } from '@services/theme.service';
import { SupabaseService } from '@services/supabase.service';
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

  private subscriptions: Subscription = new Subscription();

  constructor(
    public supabaseService: SupabaseService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {
    this.themes = this.themeService.getThemes();
    this.selectedTheme = this.themes[0];
  }


  ngOnInit(): void {
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

  onDarkModeChange() {
    this.themeService.toggleDarkMode();
  }

  onScaleChange() {
    this.setScale(this.scale);
    localStorage.setItem('scale', this.scale);
  }

  onThemeChange(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  setScale(scale: 'small' | 'medium' | 'large') {
    const scales = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = scales[scale] || scales.medium;
  }


  async signOut() {
    await this.supabaseService.signOut();
    window.location.href = '/login';
  }
}
