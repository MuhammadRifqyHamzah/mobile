import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { EventService } from '../../services/event.service';
import { environment } from '../../../environments/environment';
import {
  arrowBackOutline,
  timeOutline,
  copyOutline,
  chevronDownOutline,
  chevronUpOutline,
  checkmarkCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-payment-instruction',
  templateUrl: './payment-instruction.page.html',
  styleUrls: ['./payment-instruction.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class PaymentInstructionPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private http = inject(HttpClient);

  /* COUNTDOWN */
  hours = 0;
  minutes = 0;
  seconds = 0;
  paymentExpiredAt = 0;
  isWarning = false;
  isBlinking = false;
  isExpired = false;
  private timerInterval: any;
  serverTimeOffset = 0;

  /* BOOKING DATA */
  bookingId = '';
  registrationId: string | null = null;
  fullName = '';
  vipQty = 0;
  regularQty = 0;
  ticketQuantities: { [key: string]: number } = {};
  selectedSeats: string[] = [];
  totalPrice = 0;
  paymentMethod = '';
  eventType = '';
  paymentStatus = 'pending';
  paymentAmount = 0;

  /* ACCORDION STATE */
  guide1Open = false;
  guide2Open = false;
  guide3Open = false;

  /* COPY NOTIFICATION */
  copied = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      timeOutline,
      copyOutline,
      chevronDownOutline,
      chevronUpOutline,
      checkmarkCircle
    });

    /* RECEIVE DATA FROM STATE */
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    if (state) {
      this.bookingId = state['bookingId'] || '';
      this.registrationId = state['registrationId'] || null;
      this.fullName = state['fullName'];
      this.vipQty = state['vipQty'];
      this.regularQty = state['regularQty'];
      this.ticketQuantities = state['ticketQuantities'] || {};
      this.selectedSeats = state['selectedSeats'];
      this.totalPrice = state['totalPrice'];
      this.paymentMethod = state['paymentMethod'] || state['payment_method'] || 'Bank Transfer';
      this.eventType = state['eventType'] || '';
      
      this.paymentStatus = state['payment_status'] || 'pending';
      this.paymentAmount = state['payment_amount'] !== null && state['payment_amount'] !== undefined ? Number(state['payment_amount']) : this.totalPrice;
      
      if (state['payment_expired_at']) {
        this.paymentExpiredAt = this.parseServerDate(state['payment_expired_at']).getTime();
      } else {
        this.paymentExpiredAt = state['paymentExpiredAt'] || (Date.now() + 10 * 60 * 1000);
      }
    } else {
      /* FALLBACK FROM LOCAL STORAGE */
      const latestStr = localStorage.getItem('latest_booking');
      if (latestStr) {
        try {
          const latest = JSON.parse(latestStr);
          this.bookingId = latest.bookingId || '';
          this.registrationId = latest.registrationId || localStorage.getItem('latest_registration_id') || null;
          this.fullName = latest.fullName || '';
          this.vipQty = latest.vipQty || 0;
          this.regularQty = latest.regularQty || 0;
          this.ticketQuantities = latest.ticketQuantities || {};
          this.selectedSeats = latest.selectedSeats || [];
          this.totalPrice = latest.totalPrice || 0;
          this.paymentMethod = latest.paymentMethod || latest.payment_method || 'Bank Transfer';
          this.eventType = latest.eventType || '';
          this.paymentExpiredAt = latest.paymentExpiredAt || (Date.now() + 10 * 60 * 1000);
        } catch (e) {
          console.error(e);
        }
      } else {
        this.registrationId = localStorage.getItem('latest_registration_id') || null;
        this.paymentExpiredAt = Date.now() + 10 * 60 * 1000;
      }
    }

    /* READ QUERY PARAMETERS FOR FALLBACK/SAFETY */
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      if (type) {
        this.eventType = type;
      }
    });
  }

  private parseServerDate(dateStr: any): Date {
    if (!dateStr) return new Date();
    const str = dateStr.toString();
    if (str.includes('T') || str.includes('+') || str.endsWith('Z')) {
      return new Date(str);
    }
    const formatted = str.replace(' ', 'T') + '+07:00';
    return new Date(formatted);
  }

  ngOnInit() {
    if (this.registrationId) {
      this.fetchRegistrationAndSyncTimer();
    } else {
      // Offline fallback: save initial booking data and start countdown
      const bookingData = {
        bookingId: this.bookingId,
        registrationId: this.registrationId,
        fullName: this.fullName,
        vipQty: this.vipQty,
        regularQty: this.regularQty,
        ticketQuantities: this.ticketQuantities,
        selectedSeats: this.selectedSeats,
        totalPrice: this.totalPrice,
        paymentMethod: this.paymentMethod,
        payment_method: this.paymentMethod,
        eventType: this.eventType,
        paymentExpiredAt: this.paymentExpiredAt,
        status: 'Unpaid'
      };

      const latestStr = localStorage.getItem('latest_booking');
      let shouldSave = true;
      if (latestStr) {
        try {
          const latest = JSON.parse(latestStr);
          if (latest.eventType === this.eventType && latest.status === 'Upcoming') {
            shouldSave = false;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (shouldSave) {
        localStorage.setItem('latest_booking', JSON.stringify(bookingData));

        // Sync history
        const historyStr = localStorage.getItem('booking_history') || '[]';
        try {
          const history = JSON.parse(historyStr);
          const index = history.findIndex((b: any) => b.bookingId === this.bookingId);
          if (index > -1) {
            if (history[index].status !== 'Upcoming') {
              history[index] = bookingData;
            }
          } else {
            history.push(bookingData);
          }
          localStorage.setItem('booking_history', JSON.stringify(history));
        } catch (e) {
          console.error(e);
        }
      }

      this.startCountdown();
    }
  }

  fetchRegistrationAndSyncTimer() {
    if (!this.registrationId) {
      this.startCountdown();
      return;
    }

    this.eventService.getRegistrationById(this.registrationId).subscribe({
      next: (reg) => {
        if (reg) {
          this.paymentStatus = reg.payment_status || 'pending';
          this.paymentAmount = reg.payment_amount !== null && reg.payment_amount !== undefined ? Number(reg.payment_amount) : this.totalPrice;
          this.paymentMethod = reg.payment_method || reg.paymentMethod || this.paymentMethod || 'Bank Transfer';
          if (reg.payment_expired_at) {
            this.paymentExpiredAt = this.parseServerDate(reg.payment_expired_at).getTime();
          }

          // Fetch with http to get the response headers for Server Date if possible
          const url = `${environment.apiUrl}/registrations/${this.registrationId}`;
          this.http.get<any>(url, { observe: 'response' }).subscribe({
            next: (response) => {
              const serverDateHeader = response.headers.get('Date');
              if (serverDateHeader) {
                const serverTime = new Date(serverDateHeader).getTime();
                const localTime = Date.now();
                this.serverTimeOffset = serverTime - localTime;
                console.log('Server time sync: offset =', this.serverTimeOffset, 'ms');
              }
              this.updateLocalStorageAndCountdown();
            },
            error: (err) => {
              console.warn('Failed to fetch server date header, falling back to local clock:', err);
              this.updateLocalStorageAndCountdown();
            }
          });
        } else {
          this.startCountdown();
        }
      },
      error: (err) => {
        console.error('Error fetching registration in payment instruction:', err);
        this.startCountdown();
      }
    });
  }

  private updateLocalStorageAndCountdown() {
    const bookingData = {
      bookingId: this.bookingId,
      registrationId: this.registrationId,
      fullName: this.fullName,
      vipQty: this.vipQty,
      regularQty: this.regularQty,
      ticketQuantities: this.ticketQuantities,
      selectedSeats: this.selectedSeats,
      totalPrice: this.totalPrice,
      paymentMethod: this.paymentMethod,
      payment_method: this.paymentMethod,
      eventType: this.eventType,
      paymentExpiredAt: this.paymentExpiredAt,
      status: this.paymentStatus === 'paid' ? 'Upcoming' : 'Unpaid'
    };

    localStorage.setItem('latest_booking', JSON.stringify(bookingData));

    // Sync history
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const history = JSON.parse(historyStr);
      const index = history.findIndex((b: any) => b.bookingId === this.bookingId);
      if (index > -1) {
        history[index] = { ...history[index], ...bookingData };
      } else {
        history.push(bookingData);
      }
      localStorage.setItem('booking_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }

    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /* COUNTDOWN TIMER */
  startCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const updateTimer = () => {
      const nowSynced = Date.now() + this.serverTimeOffset;
      const timeLeft = this.paymentExpiredAt - nowSynced;

      if (timeLeft <= 0) {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.isExpired = true;
        this.isWarning = false;
        this.isBlinking = false;
        clearInterval(this.timerInterval);
        this.handleExpiration();
        return;
      }

      const totalSeconds = Math.floor(timeLeft / 1000);
      this.hours = Math.floor(totalSeconds / 3600);
      this.minutes = Math.floor((totalSeconds % 3600) / 60);
      this.seconds = totalSeconds % 60;

      this.isExpired = false;
      this.isWarning = totalSeconds < 120; // < 2 minutes (120 seconds)
      this.isBlinking = totalSeconds < 60;  // < 1 minute (60 seconds)
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  handleExpiration() {
    const latestStr = localStorage.getItem('latest_booking');
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.status === 'Unpaid') {
          latest.status = 'Canceled';
          localStorage.setItem('latest_booking', JSON.stringify(latest));

          const historyStr = localStorage.getItem('booking_history') || '[]';
          try {
            const history = JSON.parse(historyStr);
            const index = history.findIndex((b: any) => b.bookingId === this.bookingId);
            if (index > -1) {
              if (history[index].status === 'Unpaid') {
                history[index].status = 'Canceled';
                localStorage.setItem('booking_history', JSON.stringify(history));
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  /* ACCORDION TOGGLE */
  toggleGuide(index: number) {
    if (index === 1) {
      this.guide1Open = !this.guide1Open;
    } else if (index === 2) {
      this.guide2Open = !this.guide2Open;
    } else if (index === 3) {
      this.guide3Open = !this.guide3Open;
    }
  }

  /* GET VA / PAYMENT CODE */
  getPaymentCode(): string {
    switch (this.paymentMethod) {
      case 'Bank Transfer':
        return '126 1234 5678 9101';
      case 'E-Wallet':
        return '0821-3456-7890';
      case 'QRIS':
        return 'JOYVENT-QRIS-92841';
      case 'Credit Card':
        return '4321-7890-5678-1234';
      default:
        return '126 1234 5678 9101';
    }
  }

  /* GET ACCORDION LABELS BASED ON METHOD */
  getGuideTitle(index: number): string {
    if (this.paymentMethod === 'E-Wallet') {
      if (index === 1) return 'Petunjuk pembayaran via aplikasi GoPay';
      if (index === 2) return 'Petunjuk pembayaran via aplikasi OVO';
      return 'Petunjuk pembayaran via aplikasi DANA';
    } else if (this.paymentMethod === 'QRIS') {
      if (index === 1) return 'Cara scan menggunakan Mobile Banking';
      if (index === 2) return 'Cara scan menggunakan E-Wallet';
      return 'Syarat & Ketentuan pembayaran QRIS';
    } else if (this.paymentMethod === 'Credit Card') {
      if (index === 1) return 'Cara autentikasi 3D Secure (OTP)';
      if (index === 2) return 'Ketentuan kartu kredit cicilan 0%';
      return 'Cara verifikasi limit transaksi';
    } else {
      if (index === 1) return 'Petunjuk transfer via M-Banking';
      if (index === 2) return 'Petunjuk transfer via Internet Banking';
      return 'Petunjuk transfer via ATM';
    }
  }

  /* SIMULATE COPY CODE */
  copyCode() {
    const code = this.getPaymentCode().replace(/\s/g, '');
    navigator.clipboard.writeText(code).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }).catch(() => {
      // Fallback
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  /* NAVIGATION BACK */
  goBack() {
    this.router.navigate(
      ['/booking'],
      {
        queryParams: {
          type: this.eventType
        }
      }
    );
  }

  /* GO TO SUCCESS */
  goToSuccess() {
    const regId = this.registrationId || localStorage.getItem('latest_registration_id');

    console.log('[PATCH Request] Registration ID:', regId);
    console.log('[PATCH Request] Body:', { status: 'confirmed' });

    const navigateToSuccess = () => {
      const bookingData = {
        bookingId: this.bookingId,
        registrationId: this.registrationId,
        fullName: this.fullName,
        vipQty: this.vipQty,
        regularQty: this.regularQty,
        ticketQuantities: this.ticketQuantities,
        selectedSeats: this.selectedSeats,
        totalPrice: this.totalPrice,
        paymentMethod: this.paymentMethod,
        payment_method: this.paymentMethod,
        eventType: this.eventType,
        paymentExpiredAt: this.paymentExpiredAt,
        status: 'Upcoming'
      };
      localStorage.setItem('latest_booking', JSON.stringify(bookingData));

      // Sync history
      const historyStr = localStorage.getItem('booking_history') || '[]';
      try {
        const history = JSON.parse(historyStr);
        const index = history.findIndex((b: any) => b.bookingId === this.bookingId);
        if (index > -1) {
          history[index] = bookingData;
        } else {
          history.push(bookingData);
        }
        localStorage.setItem('booking_history', JSON.stringify(history));
      } catch (e) {
        console.error(e);
      }

      this.router.navigate(
        ['/ticket-success'],
        {
          queryParams: {
            type: this.eventType
          },
          state: bookingData
        }
      );
    };

    if (regId) {
      this.eventService.updateRegistrationStatus(regId, 'confirmed').subscribe({
        next: (res) => {
          console.log('[PATCH Response] Success:', res);
          navigateToSuccess();
        },
        error: (err) => {
          console.error('[PATCH Response] Error:', err);
          let errMsg = 'Failed to update payment status on server. Please try again.';
          if (err && err.error && err.error.message) {
            errMsg = err.error.message;
          }
          alert(errMsg);
        }
      });
    } else {
      console.warn('[PATCH Request] No registration ID found. Falling back to offline simulation.');
      navigateToSuccess();
    }
  }

  /* BACK TO HOME */
  backToHome() {
    const bookingData = {
      bookingId: this.bookingId,
      registrationId: this.registrationId,
      fullName: this.fullName,
      vipQty: this.vipQty,
      regularQty: this.regularQty,
      ticketQuantities: this.ticketQuantities,
      selectedSeats: this.selectedSeats,
      totalPrice: this.totalPrice,
      paymentMethod: this.paymentMethod,
      payment_method: this.paymentMethod,
      eventType: this.eventType,
      paymentExpiredAt: this.paymentExpiredAt,
      status: 'Unpaid'
    };
    localStorage.setItem('latest_booking', JSON.stringify(bookingData));

    // Sync history
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const history = JSON.parse(historyStr);
      const index = history.findIndex((b: any) => b.bookingId === this.bookingId);
      if (index > -1) {
        if (history[index].status !== 'Upcoming') {
          history[index] = bookingData;
        }
      } else {
        history.push(bookingData);
      }
      localStorage.setItem('booking_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }

    this.router.navigate(['/tabs/home']);
  }
}