import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonRippleEffect,
  NavController
} from '@ionic/angular/standalone';
import {
  Router,
  ActivatedRoute
} from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  ticketOutline,
  locationOutline,
  calendarOutline,
  qrCodeOutline
} from 'ionicons/icons';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-ticket-success',
  templateUrl: './ticket-success.page.html',
  styleUrls: ['./ticket-success.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class TicketSuccessPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  /* =========================
     EVENT DATA
  ========================= */
  eventTitle = '';
  eventDate = '';
  eventLocation = '';
  eventCategory = '';

  /* =========================
     BOOKING DATA
  ========================= */
  bookingId = '';
  registrationId: string | null = null;
  fullName = '';
  vipQty = 0;
  regularQty = 0;
  ticketQuantities: { [key: string]: number } = {};
  selectedSeats: string[] = [];
  totalPrice = 0;
  paymentMethod = '';

  private eventSubscription!: Subscription;

  /* =========================
     CONSTRUCTOR
  ========================= */
  constructor() {
    addIcons({
      checkmarkCircle,
      ticketOutline,
      locationOutline,
      calendarOutline,
      qrCodeOutline
    });

    /* RECEIVE BOOKING DATA */
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    if (state) {
      this.bookingId = state['bookingId'] || '';
      this.registrationId = state['registrationId'] || null;
      this.ticketQuantities = state['ticketQuantities'] || {};
      this.fullName = state['fullName'];
      this.vipQty = state['vipQty'];
      this.regularQty = state['regularQty'];
      this.selectedSeats = state['selectedSeats'];
      this.totalPrice = state['totalPrice'];
      this.paymentMethod = state['paymentMethod'] || state['payment_method'] || 'Bank Transfer';
    }
  }

  /* =========================
     ON INIT
  ========================= */
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'concert';

      if (this.eventSubscription) {
        this.eventSubscription.unsubscribe();
      }

      this.eventSubscription = this.eventService.getEventById(type).subscribe({
        next: (event) => {
          if (event) {
            this.eventTitle = event.title;
            const parts = event.date.split('•');
            const datePart = parts[0]?.trim() || '';
            const timePart = parts[1]?.trim() || '';
            this.eventDate = `${datePart} 2026 • ${timePart} WIB`;
            
            this.eventLocation = event.location === 'Jakarta' ? 'Jakarta International Expo' : event.location;
            this.eventCategory = event.category === 'Entertainment' ? 'Music Festival' : event.category;
          } else {
            this.loadFallbackEvent();
          }

          // Fetch fresh registration data from backend
          const regId = this.registrationId || localStorage.getItem('latest_registration_id');
          if (regId) {
            this.eventService.getRegistrationById(regId).subscribe({
              next: (reg) => {
                console.log('[GET Response] Reloaded registration in success page:', reg);
                if (reg) {
                  this.registrationId = reg.id.toString();
                  this.bookingId = reg.registration_code || reg.qr_code || `REG-${reg.id}`;
                  this.paymentMethod = reg.payment_method || this.paymentMethod || 'Bank Transfer';
                  if (reg.user) {
                    this.fullName = reg.user.name;
                  }
                  if (reg.ticket_category) {
                    this.totalPrice = Number(reg.ticket_category.price);
                  }
                }
                this.saveBookingData(type);
              },
              error: (err) => {
                console.error('[GET Response] Error reloading registration:', err);
                this.saveBookingData(type);
              }
            });
          } else {
            this.saveBookingData(type);
          }
        },
        error: (err) => {
          console.error('Error fetching event in TicketSuccess:', err);
          this.loadFallbackEvent();
          this.saveBookingData(type);
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }

  private loadFallbackEvent() {
    this.eventService.getEventById('concert').subscribe({
      next: (fallback) => {
        if (fallback) {
          this.eventTitle = fallback.title;
          this.eventDate = '28 Mei 2026 • 19.00 WIB';
          this.eventLocation = 'Jakarta International Expo';
          this.eventCategory = 'Music Festival';
        }
      }
    });
  }

  private saveBookingData(type: string) {
    if (this.fullName) {
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
        eventType: type || 'concert',
        status: 'Upcoming'
      };
      localStorage.setItem('latest_booking', JSON.stringify(bookingData));

      if (this.bookingId) {
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
      }
    }
  }

  /* =========================
     GO TO MY TICKET
  ========================= */
  goToMyTicket() {
    const type =
      this.eventTitle === 'Digital Business Seminar 2026'
        ? 'seminar'
        : 'concert';

    const regId = this.registrationId || localStorage.getItem('latest_registration_id');

    this.router.navigate(
      ['/ticket'],
      {
        queryParams: {
          type: type,
          registrationId: regId
        },
        state: {
          bookingId: this.bookingId,
          registrationId: regId,
          fullName: this.fullName,
          vipQty: this.vipQty,
          regularQty: this.regularQty,
          ticketQuantities: this.ticketQuantities,
          selectedSeats: this.selectedSeats,
          totalPrice: this.totalPrice,
          paymentMethod: this.paymentMethod,
          payment_method: this.paymentMethod
        }
      }
    );
  }

  /* =========================
     SEAT TEXT
  ========================= */
  getSeatText(): string {
    if (!this.selectedSeats || this.selectedSeats.length === 0) {
      return '-';
    }
    return this.selectedSeats.join(', ');
  }

  /* =========================
     GO TO HOME
  ========================= */
  goToHome() {
    this.navCtrl.navigateRoot('/tabs/home');
  }
}