import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
/** Centralized notification bus for in-app alerts. */
export class NotificationService {
  private notificationSubject = new Subject<Notification | null>();
  notification$ = this.notificationSubject.asObservable();

  /** Emit a notification message with a type. */
  show(message: string, type: 'success' | 'error') {
    this.notificationSubject.next({ message, type });
  }

  /** Clear the current notification. */
  hide() {
    this.notificationSubject.next(null);
  }
}
