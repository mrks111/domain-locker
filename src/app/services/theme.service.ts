import { Injectable, inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface Theme {
  name: string;
  code: string;
  color: string;
  darkLink: string;
  lightLink: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private renderer: Renderer2;
  private themes: Theme[] = [
    { name: 'Lara Purple', code: 'lara-purple', color: '#8B5CF6', darkLink: '/themes/purple-dark.css', lightLink: '/themes/purple-light.css' },
    { name: 'Material Indigo', code: 'md-indigo', color: '#3F51B5', darkLink: '/themes/indigo-dark.css', lightLink: '/themes/indigo-light.css' },
    { name: 'Bootstrap Blue', code: 'bootstrap-blue', color: '#007BFF', darkLink: '/themes/blue-dark.css', lightLink: '/themes/blue-light.css' },
    { name: 'Lara Teal', code: 'lara-teal', color: '#14B8A6', darkLink: '/themes/teal-dark.css', lightLink: '/themes/teal-light.css' },
    { name: 'Vela Orange', code: 'vela-orange', color: '#FF9800', darkLink: '/themes/orange-dark.css', lightLink: '/themes/orange-light.css' },
    { name: 'Arya Green', code: 'arya-green', color: '#4CAF50', darkLink: '/themes/green-dark.css', lightLink: '/themes/green-light.css' }
  ];

  private defaultTheme = this.themes[0];
  
  private selectedThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  selectedTheme$ = this.selectedThemeSubject.asObservable();

  private isDarkThemeSubject = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.isDarkThemeSubject.asObservable();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  public initializeTheme() {
    if (isPlatformBrowser(this.platformId)) {
      // Get users saved preferences from local storage
      const savedTheme = localStorage.getItem('selectedTheme');
      const savedIsDark = localStorage.getItem('isDarkTheme');
      
      // Determine if should use dark mode (either user's preference, or system preference)
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const useDarkMode = savedIsDark ? savedIsDark === 'true' : prefersDarkMode;

      // Determine current theme to apply (either user's saved theme, or fallback to default)
      const theme = this.themes.find(t => t.code === savedTheme || '') || this.defaultTheme;

      // Set the theme and dark mode
      this.selectedThemeSubject.next(theme);
      this.isDarkThemeSubject.next(useDarkMode);

      // Apply to DOM
      this.applyTheme(theme, useDarkMode);
    }
  }

  setTheme(theme: Theme) {
    this.selectedThemeSubject.next(theme);
    this.applyTheme(theme, this.isDarkThemeSubject.value);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('selectedTheme', theme.code);
    }
  }

  toggleDarkMode() {
    const newIsDark = !this.isDarkThemeSubject.value;
    this.isDarkThemeSubject.next(newIsDark);
    this.applyTheme(this.selectedThemeSubject.value, newIsDark);  
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('isDarkTheme', newIsDark.toString());
    }
  }

  private applyTheme(theme: Theme, isDark: boolean) {
    if (isPlatformBrowser(this.platformId)) {
      const linkId = 'app-theme';
      const linkElement = this.document.getElementById(linkId) as HTMLLinkElement;
      const newThemeUrl = isDark ? theme.darkLink : theme.lightLink;

      if (linkElement) {
        this.renderer.setAttribute(linkElement, 'href', newThemeUrl);
      } else {
        const newLinkElement = this.renderer.createElement('link');
        this.renderer.setAttribute(newLinkElement, 'id', linkId);
        this.renderer.setAttribute(newLinkElement, 'rel', 'stylesheet');
        this.renderer.setAttribute(newLinkElement, 'type', 'text/css');
        this.renderer.setAttribute(newLinkElement, 'href', newThemeUrl);
        this.renderer.appendChild(this.document.head, newLinkElement);
      }
    }
  }
}
