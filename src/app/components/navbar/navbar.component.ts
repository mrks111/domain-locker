// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, PrimeNgModule],
  template: `
    <div class="custom-menubar flex justify-between items-center py-2 px-4">
      <div class="flex items-center">
        <button pButton icon="pi pi-bars" (click)="toggleSidebar()" class="p-button-text p-button-rounded mr-2 lg:hidden"></button>
        <img src="/icon.svg" class="w-10 h-10" alt="Domain Locker Logo">
        <span class="text-xl font-bold ml-2">Domain Locker</span>
      </div>
      <div class="hidden lg:block">
        <p-menubar [model]="items" [styleClass]="'bg-transparent border-none p-0'"></p-menubar>
      </div>
    </div>

    <p-sidebar [(visible)]="sidebarVisible" position="left" [styleClass]="'p-sidebar-sm'">
      <ng-template pTemplate="content">
        <div class="flex flex-col space-y-4">
          <a *ngFor="let item of items" 
             [routerLink]="item.routerLink"
             class="p-3 hover:bg-gray-100 rounded-md flex items-center"
             (click)="closeSidebar()">
            <i [class]="item.icon + ' mr-3'"></i>
            {{ item.label }}
          </a>
        </div>
      </ng-template>
    </p-sidebar>
  `,
  styles: [`
    ::ng-deep .custom-menubar .p-menubar {
      background: transparent;
      border: none;
      padding: 0;
    }
    ::ng-deep .custom-menubar .p-menubar-root-list {
      display: flex;
      align-items: center;
    }
    ::ng-deep .custom-menubar .p-menuitem-link {
      padding: 0.5rem 0.75rem;
    }
    ::ng-deep .custom-menubar .p-menuitem-icon {
      margin-right: 0.5rem;
    }
    ::ng-deep .p-sidebar {
      max-width: 100%;
    }
  `]
})
export class NavbarComponent implements OnInit {
  items: MenuItem[] = [];
  sidebarVisible: boolean = false;

  ngOnInit() {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-fw pi-home',
        routerLink: '/'
      },
      {
        label: 'Domains',
        icon: 'pi pi-fw pi-globe',
        routerLink: '/domains'
      },
      {
        label: 'About',
        icon: 'pi pi-fw pi-info-circle',
        items: [
          {
            label: 'Overview',
            routerLink: '/about'
          },
          {
            label: 'Pricing',
            routerLink: '/about/pricing'
          },
          {
            label: 'Security',
            routerLink: '/about/security'
          },
          {
            label: 'Self-Hosting',
            routerLink: '/about/self-hosting'
          }
        ]
      },
      {
        label: 'Login',
        icon: 'pi pi-fw pi-sign-in',
        routerLink: '/login'
      }
    ];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }
}
