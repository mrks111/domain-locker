import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import DatabaseService from '../../services/database.service';
import { Notification } from '@/types/Database';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  templateUrl: './index.page.html',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent],
})
export default class NotificationsPage implements OnInit {
  notifications: (Notification & { domain_name: string })[] = [];
  private hoverTimeouts: { [id: string]: any } = {};

  constructor(
    private databaseService: DatabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.databaseService.getUserNotifications().subscribe(
      (notifications) => {
        this.notifications = notifications;
      },
      (error) => {
        console.error('Error loading notifications:', error);
      }
    );
  }

  async markAsRead(notificationId: string) {
    try {
      await firstValueFrom(this.databaseService.markNotificationReadStatus(notificationId, true));
      this.updateNotificationStatus(notificationId, true);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async markAsUnread(notificationId: string) {
    try {
      await firstValueFrom(this.databaseService.markNotificationReadStatus(notificationId, false));
      this.updateNotificationStatus(notificationId, false);
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  }

  private updateNotificationStatus(notificationId: string, readStatus: boolean) {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = readStatus;
      this.cdr.detectChanges();
    }
  }

  // Hover-to-Mark-as-Read Feature
  onNotificationHoverStart(notificationId: string) {
    this.hoverTimeouts[notificationId] = setTimeout(() => {
      this.markAsRead(notificationId);
    }, 1500);
  }

  onNotificationHoverEnd(notificationId: string) {
    clearTimeout(this.hoverTimeouts[notificationId]);
  }
}
