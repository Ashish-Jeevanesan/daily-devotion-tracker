import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-outlet',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  template: `
    @if (notification) {
      <app-notification
        [message]="notification.message"
        [type]="notification.type"
        (close)="onClose()"
      ></app-notification>
    }
  `,
})
/** Hosts global notifications and connects to the notification stream. */
export class NotificationOutletComponent implements OnInit {
  notification: Notification | null = null;
  private subscription: Subscription | undefined;

  constructor(private notificationService: NotificationService) {}

  /** Subscribe to notification events on init. */
  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
    });
  }

  /** Clean up the notification subscription. */
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /** Dismiss the current notification. */
  onClose() {
    this.notificationService.hide();
  }
}
