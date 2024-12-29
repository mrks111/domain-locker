import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subdomain } from '@/types/Database';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { ConfirmationService } from 'primeng/api';
import { makeKVList } from './subdomain-utils';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';

@Component({
  standalone: true,
  selector: 'app-subdomain-list',
  imports: [CommonModule, RouterModule, PrimeNgModule, DomainFaviconComponent],
  template: `
    <ul class="list-none p-0 m-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <li
        *ngFor="let subdomain of subdomains"
        class="p-card px-4 py-3 rounded shadow relative"
        (contextmenu)="onRightClick($event, subdomain)"
      >
        <a
          [routerLink]="['/assets/subdomains', domain, subdomain.name]"
          class="text-primary no-underline hover:underline"
        >
          <h3 class="text-lg font-bold text-default truncate">
            <app-domain-favicon [domain]="subdomain.name + '.' + domain" [size]="24" class="mr-2" />
            <span class="text-primary">{{ subdomain.name }}</span>
            <span>.</span>
            <span>{{ domain }}</span>
          </h3>
        </a>
        <ul *ngFor="let item of makeKVList(subdomain.sd_info)"
          class="m-0 p-0 list-none text-sm text-surface-500 opacity-90">
          <li class="truncate">
            <strong class="font-semibold">{{ item.key }}</strong>: {{ item.value }}
          </li>
        </ul>
      </li>
    </ul>
    <p-confirmDialog />
    <p-contextMenu #contextMenu [model]="menuItems"></p-contextMenu>
  `,
  providers: [ConfirmationService],
})
export class SubdomainListComponent {
  @Input() domain: string = '';
  @Input() subdomains: Subdomain[] = [];
  @ViewChild('contextMenu') menu: ContextMenu | undefined;
  makeKVList = makeKVList;

  menuItems: MenuItem[] = [];
  selectedSubdomain: Subdomain | null = null;

  constructor(
    private confirmationService: ConfirmationService,
    private router: Router,
) {}

  onRightClick(event: MouseEvent, subdomain: Subdomain) {
    this.selectedSubdomain = subdomain;
    this.menuItems = this.createMenuItems();
    if (this.menu) this.menu.show(event);
    event.preventDefault();
  }

  createMenuItems(): MenuItem[] {
    if (!this.selectedSubdomain) return [];

    const subdomainUrl = `${this.selectedSubdomain.name}.${this.domain}`;
    return [
      {
        label: 'View Subdomain',
        icon: 'pi pi-search',
        command: () => this.navigateTo(`/assets/subdomains/${this.domain}/${this.selectedSubdomain!.name}`),
      },
      {
        label: 'Visit Subdomain',
        icon: 'pi pi-external-link',
        command: () => window.open(`https://${subdomainUrl}`, '_blank'),
      },
      {
        label: 'Edit Subdomain',
        icon: 'pi pi-pencil',
        command: () => this.editSubdomain(this.selectedSubdomain!),
      },
      {
        label: 'Delete Subdomain',
        icon: 'pi pi-trash',
        command: () => this.confirmDeleteSubdomain(this.selectedSubdomain!),
      },
      {
        separator: true,
      },
      {
        label: 'View Parent Domain',
        icon: 'pi pi-folder',
        command: () => this.navigateTo(`/domains/${this.domain}`),
      },
      {
        label: 'Edit Parent',
        icon: 'pi pi-cog',
        command: () => this.navigateTo(`/domains/${this.domain}/edit`),
      },
    ];
  }

  private navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private editSubdomain(subdomain: Subdomain): void {
    // Placeholder for opening edit dialog
    console.log('Editing subdomain:', subdomain);
  }

  private confirmDeleteSubdomain(subdomain: Subdomain): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete subdomain "${subdomain.name}.${this.domain}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log('Subdomain deleted:', subdomain);
      },
    });
  }
}
