import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MenuItem } from 'primeng/api';


@Component({
  standalone: true,
  selector: 'breadcrumbs',
  imports: [CommonModule, PrimeNgModule],
  template: `
  <p-breadcrumb class="mb-4" [model]="breadcrumbs">
    <ng-template pTemplate="item" let-item>
      <ng-container *ngIf="item.route; else elseBlock">
        <a [routerLink]="item.route" class="p-menuitem-link">
          <span [ngClass]="[item.icon ? item.icon : '', 'text-color']"></span>
          <span class="text-primary font-semibold">{{ item.label }}</span>
        </a>
      </ng-container>
      <ng-template #elseBlock>
        <a [href]="item.url">
          <span class="text-color">{{ item.label }}</span>
        </a>
      </ng-template>
    </ng-template>
  </p-breadcrumb>
  `,
  styles: [`
    ::ng-deep nav.p-breadcrumb {
      background: none !important;
      border: none !important;
      padding: 0 !important;
    }
  `]
})
export class BreadcrumbsComponent implements OnInit {
  @Input() breadcrumbs?: MenuItem[];
  @Input() pagePath?: string;
  public shouldShowBreadcrumbs: boolean = true;

  getIconForPath(path: string) {
    const icons: { [key: string]: string } = {
      'home': 'home',
      'assets': 'box',
      'registrars': 'receipt',
      'hosts': 'server',
      'certs': 'key',
      'ips': 'sitemap',
      'tags': 'tags',
      'dns': 'table',
      'statuses': 'shield',
    }
    const iconName = icons[path];
    if (!iconName) return
    return ` pi pi-${iconName}`;
  }

  getLabelForPath(path: string) {
    const labels: { [key: string]: string } = {
      'certs': 'Certificates',
    }

    const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    return labels[path] || capitalizeFirstLetter(path);
  }

  getRouteForPath(paths: string[], index: number) {
    return paths.slice(0, index + 1).join('/');
  }

  determineIfBreadcrumbsShouldBeShown(): boolean {
    if (!this.breadcrumbs && !this.pagePath) return false; 
    const hideOnPages = ['/'];
    if (this.pagePath && !hideOnPages.includes(this.pagePath)) return true;
    return false;
  }

  ngOnInit(): void {
    // Check that we're on a page which isn't excluded from breadcrumbs
    this.shouldShowBreadcrumbs = this.determineIfBreadcrumbsShouldBeShown();

    // Generate breadcrumbs from page path, if breadcrumbs isn't already provided
    if (this.pagePath && !this.breadcrumbs) {
      this.breadcrumbs = this.pagePath.split('/').map((path, index, paths) => {
        return {
          label: this.getLabelForPath(path),
          route: this.getRouteForPath(paths, index),
          icon: this.getIconForPath(path),
        };
      });
    }
  }

}
