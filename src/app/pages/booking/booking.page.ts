import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
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
  checkmarkCircle,
  alertCircleOutline,
  checkmarkCircleOutline
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

export class BookingPage implements OnInit, OnDestroy {
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

  isLoading = false;
  errorMessage = '';
  successMessage = '';

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
     SEAT LAYOUT (API SOURCE)
  ========================= */
  seatLayout: any[] = [];

  loadSeats(eventId: string | number) {
    this.eventService.getEventSeats(eventId.toString()).subscribe({
      next: (res) => {
        this.seatLayout = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load seats from API:', err);
      }
    });
  }

  getMaxY(): number {
    if (!this.seatLayout || this.seatLayout.length === 0) return 300;
    return Math.max(...this.seatLayout.map(s => s.y || 0));
  }

  getMaxX(): number {
    if (!this.seatLayout || this.seatLayout.length === 0) return 300;
    return Math.max(...this.seatLayout.map(s => s.x || 0));
  }

  /* =========================
     SELECTED SEATS
  ========================= */
  selectedSeats: string[] = [];

  private eventSubscription!: Subscription;

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
      checkmarkCircle,
      alertCircleOutline,
      checkmarkCircleOutline
    });
  }

  /* =========================
     ON INIT
  ========================= */
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'concert';
      this.eventType = type;

      if (this.eventSubscription) {
        this.eventSubscription.unsubscribe();
      }

      this.eventSubscription = this.eventService.getEventById(type).subscribe({
        next: (event) => {
          this.event = event;
          if (event) {
            this.loadSeats(event.id);
            // Redirection check for sold out event
            const total = event.ticketCategories.reduce((sum: number, cat: any) => sum + cat.total, 0);
            const sold = event.ticketCategories.reduce((sum: number, cat: any) => sum + cat.sold, 0);
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
            this.loadFallbackEvent();
          }
          this.syncLegacyQuantities();
        },
        error: (err) => {
          console.error('Error loading event in Booking:', err);
          this.loadFallbackEvent();
          this.syncLegacyQuantities();
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
    this.eventSubscription = this.eventService.getEventById('concert').subscribe({
      next: (fallback) => {
        this.event = fallback;
        if (fallback) {
          this.loadSeats(fallback.id);
          this.eventType = 'concert';
          this.eventImage = fallback.image;
          this.eventTitle = fallback.title;
          this.eventLocation = 'Jakarta International Expo';
          
          const parts = fallback.date.split('•');
          const datePart = parts[0]?.trim() || '';
          const timePart = parts[1]?.trim() || '';
          this.eventDate = `${datePart} 2026 • ${timePart} WIB`;

          this.ticketQuantities = {};
          fallback.ticketCategories.forEach(cat => {
            this.ticketQuantities[cat.id] = 0;
          });
          this.syncLegacyQuantities();
        }
      }
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

  toggleSeat(seat: any) {
    if (seat.status === 'booked') {
      return;
    }

    const index = this.selectedSeats.indexOf(seat.seat_number);

    /* UNSELECT */
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
      return;
    }

    /* LIMIT BY CATEGORY QTY */
    const catId = seat.ticket_category_id;
    const maxQty = this.ticketQuantities[catId] || 0;
    
    // Count how many seats of this ticket category are already selected
    const selectedCount = this.selectedSeats.filter(seatNum => {
      const s = this.seatLayout.find(item => item.seat_number === seatNum);
      return s && s.ticket_category_id === catId;
    }).length;

    if (selectedCount >= maxQty) {
      alert(`Anda telah memilih batas maksimum kursi (${maxQty}) untuk kategori tiket ini.`);
      return;
    }

    /* SELECT */
    this.selectedSeats.push(seat.seat_number);
  }

  /* =========================
     IS SELECTED
  ========================= */

  isSelected(seatNumber: string): boolean {
    return this.selectedSeats.includes(seatNumber);
  }

  /* =========================
     IS BOOKED
  ========================= */

  isBooked(seatNumber: string): boolean {
    const seat = this.seatLayout.find(s => s.seat_number === seatNumber);
    return seat ? seat.status === 'booked' : false;
  }

  /* =========================
     GO TO PAYMENT
  ========================= */

  goToPaymentInstruction() {
    // 1. Validasi
    const selectedCategoryId = Object.keys(this.ticketQuantities).find(
      (catId) => this.ticketQuantities[catId] > 0
    );

    if (!selectedCategoryId) {
      alert('Please select a ticket category.');
      return;
    }

    if (!this.fullName || !this.email || !this.phone) {
      alert('Please complete your contact details first.');
      return;
    }

    let selectedSeatId: number | undefined;
    let selectedSeatNumber: string | undefined;

    if (this.event && this.event.hasSeatSelection && this.selectedSeats.length > 0) {
      selectedSeatNumber = this.selectedSeats[0];
      const seatObj = this.seatLayout.find(s => s.seat_number === selectedSeatNumber);
      if (seatObj) {
        selectedSeatId = seatObj.id;
      }
    }

    this.eventService.createRegistration(this.event.id, selectedCategoryId, selectedSeatId, selectedSeatNumber).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = 'Registration created successfully!';
        
        // Refresh seats data from API (Revision 2)
        if (this.event) {
          this.loadSeats(this.event.id);
        }
        
        // Simpan registration_id ke localStorage
        if (res && res.data && res.data.id) {
          localStorage.setItem('latest_registration_id', res.data.id.toString());
        }

        // Construct bookingData matching what ticket-success expects (without local storage write in booking.page)
        const bookingData = {
          bookingId: res?.data?.registration_code || ('BK-' + Date.now()),
          registrationId: res?.data?.id,
          fullName: this.fullName,
          vipQty: this.vipQty,
          regularQty: this.regularQty,
          ticketQuantities: this.ticketQuantities,
          selectedSeats: this.selectedSeats,
          totalPrice: this.getTotalPrice(),
          paymentMethod: this.selectedPayment,
          payment_method: this.selectedPayment,
          eventType: this.eventType
        };

        // Navigasi langsung ke Payment Instruction
        this.router.navigate(
          ['/payment-instruction'],
          {
            queryParams: {
              type: this.eventType
            },
            state: bookingData
          }
        );
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Registration failed:', err);
        // Tampilkan pesan error backend jika request gagal
        if (err && err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err && err.message) {
          this.errorMessage = err.message;
        } else {
          this.errorMessage = 'Terjadi kesalahan saat melakukan registrasi. Silakan coba lagi.';
        }
      }
    });
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
      payment_method: this.selectedPayment,
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