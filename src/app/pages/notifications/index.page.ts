import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { NotificationsListComponent } from '@components/notifications-list/notifications-list.component';

@Component({
  standalone: true,
  templateUrl: './index.page.html',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent, NotificationsListComponent ],
})
export default class NotificationsPage {}
