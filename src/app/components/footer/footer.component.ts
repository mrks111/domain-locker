import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [ CommonModule, PrimeNgModule ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  styles: []
})
export class FooterComponent {
  @Input() public big: boolean = true;
  public year: number = new Date().getFullYear();
  constructor(private router: Router) {}

  public fc = {
    name: 'Domain Locker',
    description: 'The all-on-one domain management tool',
    ctas: [
      {
        label: 'Sign Up',
        click: () => this.router.navigate(['/signup']),
        icon: 'pi pi-sparkles',
        isPrimary: true,
      },
      {
        label: 'Get the Code',
        click: () => window.open('https://github.com/lissy93/domain-locker', '_blank'),
        icon: 'pi pi-github',
        isPrimary: false,
      },
    ],
    left: [
      { label: 'Features', link: '/features' },
      { label: 'Pricing', link: '/pricing' },
      { label: 'Self-Hosting', link: '' },
      { label: 'Alternatives', link: '' },
    ],
    middle: [
      { label: 'GitHub', link: 'https://github.com/lissy93/domain-locker' },
      { label: 'More Apps...', link: 'https://as93.net' },
      { label: 'Support', link: '/about/get-help' },
      { label: 'Attributions', link: '/about/attributions' },
    ],
    right: [
      { label: 'License', link: '/about/legal/license' },
      { label: 'Security', link: '/about/legal/security' },
      { label: 'Privacy Policy', link: '/about/legal/privacy' },
      { label: 'Terms of Service', link: '/about/legal/terms' },
    ],
  };
}
