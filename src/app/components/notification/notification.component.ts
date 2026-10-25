import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
/** Presentational notification banner with close action. */
export class NotificationComponent {
  @Input() message = '';
  @Input() type: 'success' | 'error' = 'success';
  @Output() close = new EventEmitter<void>();

  /** Emit close event to the parent outlet. */
  onClose() {
    this.close.emit();
  }
}
