import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
