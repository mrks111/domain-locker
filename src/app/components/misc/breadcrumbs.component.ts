import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MenuItem } from 'primeng/api';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { statsLinks, settingsLinks, aboutLinks, authenticatedNavLinks, unauthenticatedNavLinks } from '@/app/constants/navigation-links';

@Component({
  standalone: true,
  selector: 'breadcrumbs',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent],
  template: `
  <p-breadcrumb styleClass="ml-2 mb-2" *ngIf="shouldShowBreadcrumbs" [model]="breadcrumbs">
    <ng-template pTemplate="item" let-item>
      <ng-container *ngIf="item.route; else elseBlock">
        <a [routerLink]="item.route" class="p-menuitem-link">
          <span [ngClass]="['mr-2 text-primary', item.icon ? item.icon : '!mr-0']"></span>
          <app-domain-favicon *ngIf="isDomainPage(item.label)" [domain]="item.label" [size]="20" class="mr-1" />
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
export class BreadcrumbsComponent implements OnInit, OnChanges {
  @Input() breadcrumbs?: MenuItem[];
  @Input() pagePath?: string;
  public shouldShowBreadcrumbs: boolean = true;
  private navLinksMap: { [key: string]: { label: string, icon: string } } = {};

  ngOnInit(): void {
    this.flattenNavLinks();
    this.updateBreadcrumbs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagePath'] && !changes['pagePath'].firstChange) {
      this.updateBreadcrumbs();
    }
  }

  public isDomainPage(path: string): boolean {
    const domainPattern = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}?$/;
    return domainPattern.test(path);
  }

  private updateBreadcrumbs(): void {
    // Check that we're on a page which isn't excluded from breadcrumbs
    this.shouldShowBreadcrumbs = this.determineIfBreadcrumbsShouldBeShown();
    
    // Generate breadcrumbs from page path, if breadcrumbs isn't already provided
    if (this.pagePath) {
      this.breadcrumbs = this.pagePath.split('?')[0]
      .split('/')
      .filter(path => path)
      .map((path, index, paths) => {
        const cleanPath = path.split('?')[0].split('#')[0];
        return {
          label: this.getLabelForPath(cleanPath),
          route: this.getRouteForPath(paths.map(p => p.split('?')[0]), index),
          icon: this.getIconForPath(cleanPath),
        };
      });
      this.breadcrumbs.unshift({ label: 'Home', route: '/', icon: 'pi pi-home' });
    }
  }

  private determineIfBreadcrumbsShouldBeShown(): boolean {
    if (!this.breadcrumbs && !this.pagePath) return false; 
    const hideOnPages = ['/'];
    if (this.pagePath && !hideOnPages.includes(this.pagePath.split('?')[0])) return true;
    return false;
  }

  private getIconForPath(path: string) {
    if (this.navLinksMap[path] && this.navLinksMap[path].icon) {
      return this.navLinksMap[path].icon;
    }
    const icons: { [key: string]: string } = {
      'settings': 'wrench',
      'about': 'lightbulb',
      'contact': 'headphones',
      'notifications': 'bell',
      'edit-events': 'list-check',
      'pricing': 'money-bill',
    };
    const iconName = icons[path];
    if (!iconName) return;
    return ` pi pi-${iconName}`;
  }

  private getLabelForPath(path: string) {
    const labels: { [key: string]: string } = {
      'certs': 'Certificates',
      'dns': 'DNS Records',
      'ips': 'IP Addresses',
      'edit-events': 'Edit Events',
    };
    const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    path = decodeURIComponent(path);
    return labels[path] || capitalizeFirstLetter(path);
  }

  private getRouteForPath(paths: string[], index: number) {
    return paths.slice(0, index + 1).join('/');
  }

  private flattenNavLinks(): void {
    const addLinksToMap = (links: any[]) => {
      for (const link of links) {
        if (link.routerLink) {
          const path = link.routerLink.split('/').pop();
          if (path) {
            this.navLinksMap[path] = { label: link.label, icon: link.icon };
          }
        }
        if (link.items) {
          addLinksToMap(link.items);
        }
      }
    };
    const allLinks = [
      ...statsLinks,
      ...settingsLinks,
      ...aboutLinks,
      ...authenticatedNavLinks,
      ...unauthenticatedNavLinks,
    ];
    addLinksToMap(allLinks);
  }
}
