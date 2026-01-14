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
export class NotificationOutletComponent implements OnInit {
  notification: Notification | null = null;
  private subscription: Subscription | undefined;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onClose() {
    this.notificationService.hide();
  }
}
