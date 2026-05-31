import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  Router,
  ActivatedRoute
} from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonRippleEffect
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  personOutline,
  mailOutline,
  callOutline,
  cardOutline,
  walletOutline,
  qrCodeOutline,
  businessOutline,
  checkmarkCircle
} from 'ionicons/icons';

import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-booking',

  templateUrl: './booking.page.html',

  styleUrls: ['./booking.page.scss'],

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})

export class BookingPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);


  event: any;
  ticketQuantities: { [catId: string]: number } = {};

  /* =========================
     EVENT DATA
  ========================= */

  eventImage = '';

  eventTitle = '';

  eventLocation = '';

  eventDate = '';

  eventType = '';

  /* =========================
     STEP
  ========================= */

  stepsIndex = 0;

  getSteps(): number[] {
    if (this.event && !this.event.hasSeatSelection) {
      return [1, 2, 4];
    }
    return [1, 2, 3, 4];
  }

  get currentStep(): number {
    return this.getSteps()[this.stepsIndex];
  }

  /* =========================
     FORM DATA
  ========================= */

  fullName = '';

  email = '';

  phone = '';

  /* =========================
     PRICE
  ========================= */

  vipPrice = 300000;

  regularPrice = 150000;

  /* =========================
     QTY
  ========================= */

  vipQty = 0;

  regularQty = 0;

  /* =========================
     PAYMENT
  ========================= */

  selectedPayment = 'Bank Transfer';

  /* =========================
     VIP SEATS
  ========================= */

  vipSeats = this.generateSeats('V', 30, 5);

  /* =========================
     REGULAR SEATS
  ========================= */

  regularSeats = this.generateSeats('R', 70, 5);

  /* =========================
     BOOKED SEATS
  ========================= */

  bookedSeats = [
    'V3', 'V9', 'V15', 'V22', 'V28',
    'R4', 'R8', 'R14', 'R25', 'R33', 'R42', 'R55', 'R62', 'R68'
  ];

  /* =========================
     SEAT GENERATION HELPER
  ========================= */

  generateSeats(prefix: string, total: number, cols: number): string[][] {
    const seats: string[][] = [];
    let row: string[] = [];
    for (let i = 1; i <= total; i++) {
      row.push(`${prefix}${i}`);
      if (row.length === cols) {
        seats.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      seats.push(row);
    }
    return seats;
  }

  /* =========================
     SELECTED SEATS
  ========================= */

  selectedSeats: string[] = [];

  /* =========================
     CONSTRUCTOR
  ========================= */

  constructor() {

    addIcons({
      arrowBackOutline,
      personOutline,
      mailOutline,
      callOutline,
      cardOutline,
      walletOutline,
      qrCodeOutline,
      businessOutline,
      checkmarkCircle
    });

  }

  /* =========================
     ON INIT
  ========================= */

  ngOnInit() {

    this.route.queryParams.subscribe(params => {

      const type = params['type'] || 'concert';

      this.eventType = type;

      const event = this.eventService.getEventById(type);
      this.event = event;
      if (event) {
        // Redirection check for sold out event
        const total = event.ticketCategories.reduce((sum, cat) => sum + cat.total, 0);
        const sold = event.ticketCategories.reduce((sum, cat) => sum + cat.sold, 0);
        if (total - sold === 0) {
          alert('This event is sold out. Booking is not available.');
          this.router.navigate(['/detail-event'], { queryParams: { type: this.eventType } });
          return;
        }

        this.eventImage = event.image;
        this.eventTitle = event.title;
        this.eventLocation = event.location === 'Jakarta' ? 'Jakarta International Expo' : event.location;
        
        const parts = event.date.split('•');
        const datePart = parts[0]?.trim() || '';
        const timePart = parts[1]?.trim() || '';
        this.eventDate = `${datePart} 2026 • ${timePart} WIB`;

        this.ticketQuantities = {};
        event.ticketCategories.forEach(cat => {
          this.ticketQuantities[cat.id] = 0;
        });
      } else {
        const fallback = this.eventService.getEventById('concert');
        this.event = fallback;
        if (fallback) {
          this.eventType = 'concert';
          this.eventImage = fallback.image;
          this.eventTitle = fallback.title;
          this.eventLocation = 'Jakarta International Expo';
          this.eventDate = '28 Mei 2026 • 19.00 WIB';
          this.ticketQuantities = {};
          fallback.ticketCategories.forEach(cat => {
            this.ticketQuantities[cat.id] = 0;
          });
        }
      }
      this.syncLegacyQuantities();

    });

  }

  /* =========================
     IONIC LIFE CYCLE
  ========================= */

  ionViewWillEnter() {

    this.resetBookingState();

  }

  /* =========================
     RESET STATE
  ========================= */

  resetBookingState() {

    this.stepsIndex = 0;

    this.fullName = '';

    this.email = '';

    this.phone = '';

    this.ticketQuantities = {};
    if (this.event) {
      this.event.ticketCategories.forEach((cat: any) => {
        this.ticketQuantities[cat.id] = 0;
      });
    }

    this.selectedSeats = [];

    this.selectedPayment = 'Bank Transfer';
    this.syncLegacyQuantities();

  }

  /* =========================
     NEXT STEP
  ========================= */

  nextStep() {

    /* STEP 1 VALIDATION */

    if (this.currentStep === 1) {

      if (
        this.fullName.trim() === '' ||
        this.email.trim() === '' ||
        this.phone.trim() === ''
      ) {

        alert(
          'Please complete your biodata first.'
        );

        return;

      }

    }

    /* STEP 2 VALIDATION */

    if (this.currentStep === 2) {

      if (
        this.getTotalTicketsCount() === 0
      ) {

        alert(
          'Please select at least 1 ticket.'
        );

        return;

      }

    }

    /* STEP 3 VALIDATION */

    if (this.currentStep === 3) {

      const totalTicket =
        this.getTotalTicketsCount();

      if (
        this.selectedSeats.length !== totalTicket
      ) {

        alert(
          'Selected seats must match total tickets.'
        );

        return;

      }

    }

    /* NEXT */

    if (this.stepsIndex < this.getSteps().length - 1) {

      this.stepsIndex++;

    }

  }

  /* =========================
     PREV STEP
  ========================= */

  prevStep() {

    if (this.stepsIndex > 0) {

      this.stepsIndex--;

    }

  }

  /* =========================
     ON BACK CLICK
  ========================= */

  onBackClick() {

    if (this.stepsIndex > 0) {

      this.prevStep();

    } else {

      this.router.navigate(
        ['/detail-event'],
        {
          queryParams: {
            type: this.eventType
          }
        }
      );

    }

  }

  /* =========================
     VIP QTY
  ========================= */

  syncLegacyQuantities() {
    this.vipQty = this.ticketQuantities['vip'] || 0;
    this.regularQty = this.ticketQuantities['regular'] || 0;
  }

  increaseQty(catId: string) {
    if (this.ticketQuantities[catId] === undefined) {
      this.ticketQuantities[catId] = 0;
    }
    this.ticketQuantities[catId]++;
    this.syncLegacyQuantities();
  }

  decreaseQty(catId: string) {
    if (this.ticketQuantities[catId] && this.ticketQuantities[catId] > 0) {
      this.ticketQuantities[catId]--;
    }
    this.syncLegacyQuantities();
  }

  getStepperSteps() {
    if (this.event && !this.event.hasSeatSelection) {
      return [
        { id: 1, label: 'Biodata' },
        { id: 2, label: 'Tiket' },
        { id: 4, label: 'Bayar' }
      ];
    }
    return [
      { id: 1, label: 'Biodata' },
      { id: 2, label: 'Tiket' },
      { id: 3, label: 'Kursi' },
      { id: 4, label: 'Bayar' }
    ];
  }

  getStepProgress(): number {
    const totalSteps = this.getSteps().length;
    if (totalSteps <= 1) return 0;
    return (this.stepsIndex / (totalSteps - 1)) * 100;
  }

  increaseVip() {

    this.vipQty++;

  }

  decreaseVip() {

    if (this.vipQty > 0) {

      this.vipQty--;

    }

  }

  increaseRegular() {

    this.regularQty++;

  }

  decreaseRegular() {

    if (this.regularQty > 0) {

      this.regularQty--;

    }

  }

  getTotalTicketsCount(): number {
    return Object.values(this.ticketQuantities).reduce((sum, val) => sum + val, 0);
  }

  /* =========================
     TOTAL PRICE
  ========================= */

  getTotalPrice(): number {

    if (!this.event) return 0;
    return this.event.ticketCategories.reduce((sum: number, cat: any) => {
      const qty = this.ticketQuantities[cat.id] || 0;
      return sum + (qty * cat.price);
    }, 0);

  }

  /* =========================
     PAYMENT
  ========================= */

  selectPayment(method: string) {

    this.selectedPayment = method;

  }

  /* =========================
     TOGGLE SEAT
  ========================= */

  toggleSeat(seat: string) {

    /* BOOKED */

    if (this.bookedSeats.includes(seat)) {

      return;

    }

    const index =
      this.selectedSeats.indexOf(seat);

    /* UNSELECT */

    if (index > -1) {

      this.selectedSeats.splice(index, 1);

      return;

    }

    /* VIP LIMIT */

    if (seat.startsWith('V')) {

      const vipSelected =
        this.selectedSeats.filter(
          s => s.startsWith('V')
        ).length;

      if (vipSelected >= this.vipQty) {

        return;

      }

    }

    /* REGULAR LIMIT */

    if (seat.startsWith('R')) {

      const regularSelected =
        this.selectedSeats.filter(
          s => s.startsWith('R')
        ).length;

      if (regularSelected >= this.regularQty) {

        return;

      }

    }

    /* SELECT */

    this.selectedSeats.push(seat);

  }

  /* =========================
     IS SELECTED
  ========================= */

  isSelected(seat: string): boolean {

    return this.selectedSeats.includes(seat);

  }

  /* =========================
     IS BOOKED
  ========================= */

  isBooked(seat: string): boolean {

    return this.bookedSeats.includes(seat);

  }

  /* =========================
     GO TO PAYMENT
  ========================= */

  goToPaymentInstruction() {
    const expiredAt = Date.now() + 10 * 60 * 1000; // 10 minutes in ms
    const bookingId = 'BK-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const bookingData = {
      bookingId: bookingId,
      fullName: this.fullName,
      vipQty: this.vipQty,
      regularQty: this.regularQty,
      ticketQuantities: this.ticketQuantities,
      selectedSeats: this.selectedSeats,
      totalPrice: this.getTotalPrice(),
      paymentMethod: this.selectedPayment,
      eventType: this.eventType,
      paymentExpiredAt: expiredAt,
      status: 'Unpaid'
    };

    localStorage.setItem('latest_booking', JSON.stringify(bookingData));

    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const history = JSON.parse(historyStr);
      history.push(bookingData);
      localStorage.setItem('booking_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }

    this.router.navigate(
      ['/payment-instruction'],
      {
        queryParams: {
          type: this.eventType
        },
        state: bookingData
      }
    );

  }

  /* =========================
     GO TO TICKET SUCCESS
  ========================= */

  goToTicket() {
    const bookingData = {
      fullName: this.fullName,
      vipQty: this.vipQty,
      regularQty: this.regularQty,
      ticketQuantities: this.ticketQuantities,
      selectedSeats: this.selectedSeats,
      totalPrice: this.getTotalPrice(),
      paymentMethod: this.selectedPayment,
      eventType: this.eventType
    };
    localStorage.setItem('latest_booking', JSON.stringify(bookingData));

    this.router.navigate(
      ['/ticket-success'],
      {
        queryParams: {
          type: this.eventType
        },
        state: bookingData
      }
    );
  }

}