import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import * as XLSX from 'xlsx';
import { AdminReportsService } from '../../services/admin-reports.service';
import { Profile, ProfileService } from '../../services/profile.service';

interface ReportRow {
  userId: string;
  name: string;
  devotionDays: number;
  percentage: number;
}

type ReportRange = 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-admin-reports',
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    NgxChartsModule
  ],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss'
})
/** Admin-only reporting dashboard with filters, KPIs, chart, and export. */
export class AdminReportsComponent implements OnInit {
  profiles: Profile[] = [];
  selectedUserId: string | null = null;
  selectedRange: ReportRange = 'weekly';

  selectedDate = new Date();
  weekStart = new Date();
  weekEnd = new Date();
  weekEndDisplay = new Date();

  loading = false;
  rows: ReportRow[] = [];
  displayedColumns = ['user', 'devotionDays', 'percentage'];
  distributionData: { name: string; value: number }[] = [];
  topConsistency: ReportRow | null = null;
  averageDays = 0;
  activeUsers = 0;

  chartView: [number, number] = [700, 280];
  chartScheme: Color = {
    name: 'devotionScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#2F6B5A', '#8AA398', '#C9D6CF']
  };

  constructor(
    private adminReportsService: AdminReportsService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {}

  /** Initialize default range and load initial data. */
  ngOnInit() {
    this.setRange(this.selectedDate);
    this.loadProfiles();
    this.loadReport();
  }

  /** Fetch all user profiles for the filter dropdown. */
  async loadProfiles() {
    this.profiles = await this.profileService.getAllProfiles();
  }

  /** Load devotion report rows for the selected range and user filter. */
  async loadReport() {
    this.loading = true;
    try {
      const reportRows = await this.adminReportsService.getWeeklyDevotionReport(
        this.weekStart,
        this.weekEnd
      );

      const mapped = reportRows.map(row => {
        const devotionDays = Number(row.devotion_days ?? 0);
        const percentage = this.getPercentage(devotionDays);
        return {
          userId: row.user_id,
          name: row.full_name || 'Unnamed',
          devotionDays,
          percentage
        };
      });

      this.rows = this.selectedUserId
        ? mapped.filter(row => row.userId === this.selectedUserId)
        : mapped;
      this.updateDerivedData();
    } catch (error) {
      this.rows = [];
      this.distributionData = [];
      this.topConsistency = null;
      this.averageDays = 0;
      this.activeUsers = 0;
      this.snackBar.open('Failed to load reports. Please try again.', 'Close', {
        duration: 4000,
        panelClass: 'error-snackbar'
      });
    } finally {
      this.loading = false;
    }
  }

  /** Update range based on date selection. */
  onDateChange(date: Date | null) {
    if (!date) return;
    this.selectedDate = date;
    this.setRange(date);
    this.loadReport();
  }

  /** Switch between daily/weekly/monthly aggregation ranges. */
  onRangeChange(range: ReportRange) {
    this.selectedRange = range;
    this.setRange(this.selectedDate);
    this.loadReport();
  }

  /** Apply user filter and refresh report. */
  onUserFilterChange(userId: string | null) {
    this.selectedUserId = userId;
    this.loadReport();
  }

  /** Export the currently filtered rows to an Excel file. */
  exportToExcel() {
    const exportRows = this.rows.map(row => ({
      'User Name': row.name,
      'Devotion Days': row.devotionDays,
      'Percentage': `${row.percentage}%`,
      'Range Start': this.weekStart.toISOString(),
      'Range End': this.weekEnd.toISOString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    const filename = `devotion-report-${this.selectedRange}-${this.formatDateForFile(this.weekStart)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }

  /** Compute range boundaries based on the active range type. */
  private setRange(date: Date) {
    if (this.selectedRange === 'daily') {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      this.weekStart = start;
      this.weekEnd = end;
      this.weekEndDisplay = new Date(start);
      return;
    }

    if (this.selectedRange === 'monthly') {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

      this.weekStart = start;
      this.weekEnd = end;
      const endDisplay = new Date(end);
      endDisplay.setDate(endDisplay.getDate() - 1);
      this.weekEndDisplay = endDisplay;
      return;
    }

    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    this.weekStart = weekStart;
    this.weekEnd = weekEnd;

    const weekEndDisplay = new Date(weekEnd);
    weekEndDisplay.setDate(weekEndDisplay.getDate() - 1);
    this.weekEndDisplay = weekEndDisplay;
  }

  /** Get Monday 00:00 as the week start for a given date. */
  private getWeekStart(date: Date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /** Compute completion percentage relative to the active range. */
  private getPercentage(devotionDays: number) {
    if (this.selectedRange === 'daily') {
      return devotionDays > 0 ? 100 : 0;
    }
    if (this.selectedRange === 'monthly') {
      const daysInMonth = new Date(this.weekStart.getFullYear(), this.weekStart.getMonth() + 1, 0).getDate();
      return Math.round((devotionDays / daysInMonth) * 100);
    }
    return Math.round((devotionDays / 7) * 100);
  }

  /** Derive KPIs and distribution chart data from current rows. */
  private updateDerivedData() {
    const counts = { low: 0, mid: 0, high: 0 };
    let totalDays = 0;
    let activeUsers = 0;
    let top: ReportRow | null = null;

    for (const row of this.rows) {
      totalDays += row.devotionDays;
      if (row.devotionDays > 0) activeUsers += 1;
      if (!top || row.devotionDays > top.devotionDays) {
        top = row;
      }

      if (row.devotionDays <= 2) counts.low += 1;
      else if (row.devotionDays <= 5) counts.mid += 1;
      else counts.high += 1;
    }

    this.averageDays = this.rows.length ? Math.round((totalDays / this.rows.length) * 10) / 10 : 0;
    this.activeUsers = activeUsers;
    this.topConsistency = top;
    this.distributionData = [
      { name: '0–2 days', value: counts.low },
      { name: '3–5 days', value: counts.mid },
      { name: '6–7 days', value: counts.high }
    ];
  }

  /** Format dates for export filenames. */
  private formatDateForFile(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
