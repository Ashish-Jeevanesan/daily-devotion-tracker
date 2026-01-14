import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification | null>();
  notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error') {
    this.notificationSubject.next({ message, type });
  }

  hide() {
    this.notificationSubject.next(null);
  }
}
