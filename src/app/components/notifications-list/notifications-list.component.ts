import { Component, Input, OnInit } from '@angular/core';
import DatabaseService from '@/app/services/database.service';
import { Notification } from '@/types/Database';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-notifications-list',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent ],

  templateUrl: './notifications-list.component.html'
})
export class NotificationsListComponent implements OnInit {
  notifications: (Notification & { domain_name: string })[] = [];

  @Input() isInModal = false;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.databaseService.getUserNotifications().subscribe(
      (notifications) => {
        this.notifications = notifications;
      },
      (error) => {
        console.error('Error loading notifications:', error);
      }
    );
  }

  markAsRead(notificationId: string) {
    this.databaseService.markNotificationReadStatus(notificationId, true).subscribe(() => {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) notification.read = true;
    });
  }

  markAsUnread(notificationId: string) {
    this.databaseService.markNotificationReadStatus(notificationId, false).subscribe(() => {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) notification.read = false;
    });
  }
}
