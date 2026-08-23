import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { LucideUser, LucideArrowRight, LucideBus, LucideMapPin, LucideLoaderCircle, LucideEye, LucideDownload, LucideX, LucideUsers } from '@lucide/angular';
import { AdminUsersService } from '../../../core/services/admin-users/admin-users.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AwardsService } from '../../../core/services/awards/awards.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [NgClass, DatePipe, LucideUser, LucideArrowRight, LucideBus, LucideMapPin, LucideLoaderCircle, LucideEye, LucideDownload, LucideX, LucideUsers],
  templateUrl: './user-detail.html',
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(AdminUsersService);
  private awardsSvc = inject(AwardsService);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthService);

  user = signal<any>(null);
  userAwards = signal<any>(null);
  showTicketModal = signal(false);
  ticketModalUrl = signal('');
  isLoading = signal(true);
  awardsLoading = signal(false);
  bookingsPage = signal(1);
  bookingsPerPage = 7;

  totalBookings = computed(() => (this.user()?.Booking ?? []).length);
  confirmedBookings = computed(() => this.user()?._confirmedBookings ?? 0);

  awardsSummary = computed(() => {
    const a = this.userAwards();
    if (!a) return null;
    return { totalEarnings: a.totalValue ?? 0, withdrawn: a.withdrawn ?? 0, available: a.available ?? 0 };
  });

  companyProfits = computed(() => {
    const u = this.user();
    if (!u) return null;
    return {
      totalProfits: u._totalProfits ?? 0,
      totalPaidOut: u._totalPaidOut ?? 0,
      remaining: u._remainingProfits ?? 0,
      bank: u.CompanyBankAccount ?? null,
    };
  });

  paginatedBookings = computed(() => {
    const u = this.user();
    const all = u?.Booking ?? [];
    const start = (this.bookingsPage() - 1) * this.bookingsPerPage;
    return all.slice(start, start + this.bookingsPerPage);
  });

  bookingsTotalPages = computed(() => {
    const u = this.user();
    const all = u?.Booking ?? [];
    return Math.max(1, Math.ceil(all.length / this.bookingsPerPage));
  });

  allTrips = computed(() => {
    const u = this.user();
    if (!u?.Bus) return [];
    const trips: any[] = [];
    for (const bus of u.Bus) {
      if (bus.Trip) {
        for (const t of bus.Trip) {
          trips.push({ ...t, busName: bus.name });
        }
      }
    }
    return trips;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/users']); return; }
    this.svc.getById(id).subscribe({
      next: (res: any) => { this.user.set(res?.data ?? res); this.isLoading.set(false); this.loadUserAwards(id); },
      error: () => { this.isLoading.set(false); },
    });
  }

  private loadUserAwards(userId: string) {
    this.awardsLoading.set(true);
    this.awardsSvc.getUserAwards(userId).subscribe({
      next: (r: any) => { this.userAwards.set(r?.data ?? r); this.awardsLoading.set(false); },
      error: () => { this.awardsLoading.set(false); },
    });
  }

  goBack() { history.back(); }

  /**
   * Ticket/PDF paths from the backend are root-relative (`/upload/x.pdf`) —
   * resolve them against the API base. Only same-origin /upload(s)/ URLs
   * (or inline base64 PDFs) are ever trusted further.
   */
  private resolveFileUrl(url: string | undefined): string | null {
    if (!url || typeof url !== 'string') return null;
    const raw = url.trim();
    if (!raw || raw.length > 512) return null;
    if (/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(raw)) return raw;
    let absolute: string;
    try {
      absolute = new URL(raw, environment.apiUrl.admin).toString();
    } catch {
      return null;
    }
    try {
      const target = new URL(absolute);
      const trustedBase = new URL(environment.apiUrl.admin.replace(/\/api\/?$/, ''));
      if (!/^https?:$/.test(target.protocol)) return null;
      if (target.origin !== trustedBase.origin) return null;
      if (!/^\/uploads?\//.test(target.pathname)) return null;
      return absolute;
    } catch {
      return null;
    }
  }

  viewTicket(url: string | undefined): void {
    const resolved = this.resolveFileUrl(url);
    if (resolved) { this.ticketModalUrl.set(resolved); this.showTicketModal.set(true); }
  }
  downloadTicket(url: string | undefined): void {
    if (!url) return;
    if (/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(url.trim())) {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ticket.pdf';
      a.click();
      return;
    }
    const resolved = this.resolveFileUrl(url);
    if (resolved) window.open(resolved, '_blank');
  }
  closeTicketModal(): void { this.showTicketModal.set(false); this.ticketModalUrl.set(''); }

  showPassengerList(tripId: string): void {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tripId)) return;
    const token = this.auth.getToken();
    if (!token || !/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) return;
    window.open(
      environment.apiUrl.admin + '/trips/passenger-list/' + tripId + '?token=' + encodeURIComponent(token),
      '_blank',
    );
  }
  safeUrl(url: string) {
    const resolved = this.resolveFileUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(resolved ?? 'about:blank');
  }

  genderLabel(g: string): string { return g === 'MALE' ? 'ذكر' : g === 'FEMALE' ? 'أنثى' : g; }
  methodLabel(m: string): string { return { bankak: 'بنكك', fawry: 'فوري', mashriq: 'المشرق', bravo: 'برافو' }[m] ?? m ?? '—'; }
  statusLabel(s: string): string { return { CONFIRMED: 'مؤكد', PENDING: 'قيد الانتظار', CANCELLED: 'ملغي' }[s] ?? s; }

  toArabic(n: number | string): string { return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]); }
  formatAmount(n: number | string): string { return this.toArabic(Math.round(Number(n)).toLocaleString('en')); }
  awardStatusLabel(s: string): string { return { PENDING: 'قيد الانتظار', APPROVED: 'مقبولة', REJECTED: 'مرفوضة' }[s] ?? s; }
  fmtDate(d: any): string { if (!d) return '—'; return this.toArabic(new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })); }
  passengers(b: any): any[] {
    const p = b?.passenger;
    if (!p) return [];
    return Array.isArray(p) ? p : [p];
  }
}
