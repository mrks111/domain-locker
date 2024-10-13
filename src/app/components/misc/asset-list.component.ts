import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { DlIconComponent } from '@components/misc/svg-icon.component';

@Component({
  standalone: true,
  selector: 'app-asset-list',
  template: `
    <h2 class="my-4 block">Assets</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
      <ng-container *ngFor="let asset of assets">
        <a class="asset-card-link" [routerLink]="asset.link">
          <div class="p-card asset-card">
            <h4>{{ asset.title }}</h4>
            <div class="absolute top-2 right-4 h-16 w-16 opacity-70">
              <dl-icon [icon]="asset.icon" [viewBox]="asset.viewBox || '0 0 512 512'" classNames="w-full h-full" color="var(--surface-200)"></dl-icon>
            </div>
          </div>
        </a>
      </ng-container>
    </div>
  `,
  styles: [`
    .asset-card-link {
      text-decoration: none;
      color: inherit;
      .asset-card {
        position: relative;
        break-inside: avoid !important;
        transition: ease-in-out 0.3s;
        border: 3px solid transparent;
        cursor: pointer;
        height: 100%;
        padding: 1rem;
        h4 {
          font-size: 1.4rem;
          margin: 0.5rem 0;
        }
        &:hover {
          border-color: var(--primary-color);
        }
      }
    }
  `],
  imports: [CommonModule, PrimeNgModule, DlIconComponent]
})
export default class AssetListComponent {
  assets = [
    { title: 'Registrars', link: '/assets/registrars', icon: 'registrar', viewBox: '0 0 620 512' },
    { title: 'IP Addresses', link: '/assets/ips', icon: 'ips' },
    { title: 'SSL Certificates', link: '/assets/certs', icon: 'ssl' },
    { title: 'Hosts', link: '/assets/hosts', icon: 'host' },
    { title: 'DNS Records', link: '/assets/dns', icon: 'dns', viewBox: '0 0 620 512' },
    { title: 'Tags', link: '/assets/tags', icon: 'tags' }
  ];
}
