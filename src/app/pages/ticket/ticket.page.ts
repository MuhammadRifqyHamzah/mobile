import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowUndoOutline,
  checkmarkCircle,
  constructOutline,
  timeOutline,
  lockClosedOutline,
  qrCodeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { EventService } from '../../services/event.service';

interface PurchasedTicket {
  name: string;
  qty: number;
}

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.page.html',
  styleUrls: ['./ticket.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class TicketPage implements OnInit, OnDestroy {
  Date = Date;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  purchasedTickets: PurchasedTicket[] = [];

  eventTitle = '';
  eventDate = '';
  eventTime = '';
  eventLocation = '';
  eventImage = 'assets/images/HindiaConcert.jpg';
  eventCategory = '';

  fullName = '';
  vipQty = 0;
  regularQty = 0;
  selectedSeats: string[] = [];
  totalPrice = 0;
  paymentMethod = '';
  paymentStatus = '';
  paymentAmount = 0;
  paymentExpiredAt = '';
  paidAt = '';

  /* REFUND AND SCAN SIMULATION VARIABLES */
  status = 'Upcoming';
  bookingId = '';
  qrCode = '';
  registrationId: string | null = null;
  eventType = 'concert';
  refundReason = '';
  refundRequestedAt = 0;
  refundUpdatedAt = 0;
  
  showModal = false;
  selectedReason = '';
  customReason = '';
  refundReasons = ['Cannot attend', 'Wrong ticket purchase', 'Schedule conflict', 'Other'];

  showScannerSim = false;

  /* TOAST NOTIFICATION */
  toastVisible = false;
  toastMessage = '';
  private toastTimeout: any;

  private eventSubscription!: Subscription;

  constructor() {
    addIcons({
      arrowBackOutline,
      arrowUndoOutline,
      checkmarkCircle,
      constructOutline,
      timeOutline,
      lockClosedOutline,
      qrCodeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline
    });
  }

  private normalizeServerDate(dateStr: any): string {
    if (!dateStr) return '';
    const str = dateStr.toString();
    if (str.includes('T') || str.includes('+') || str.endsWith('Z')) {
      return str;
    }
    return str.replace(' ', 'T') + '+07:00';
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'concert';
      this.eventType = type;
      const registrationId = params['registrationId'];

      console.log('Received registrationId:', registrationId);

      if (this.eventSubscription) {
        this.eventSubscription.unsubscribe();
      }

      if (registrationId) {
        this.registrationId = registrationId.toString();
        this.eventSubscription = this.eventService.getRegistrationById(registrationId).subscribe({
          next: (registration) => {
            console.log('GET /registrations/{id} response:', registration);
            if (registration) {
              this.populateFromApiRegistration(registration);
            } else {
              console.warn('Registration not found in API, loading legacy fallback...');
              this.loadLegacyData(type);
            }
          },
          error: (err) => {
            console.error('Error loading registration from API, loading legacy fallback:', err);
            this.loadLegacyData(type);
          }
        });
      } else {
        this.loadLegacyData(type);
      }
    });
  }

  loadLegacyData(type: string) {
    this.eventSubscription = this.eventService.getEventById(type).subscribe({
      next: (event) => {
        if (event) {
          this.populateBookingAndEventData(event, type);
        } else {
          this.loadFallbackEvent(type);
        }
      },
      error: (err) => {
        console.error('Error loading event in Ticket:', err);
        this.loadFallbackEvent(type);
      }
    });
  }

  populateFromApiRegistration(reg: any) {
    this.registrationId = reg.id.toString();
    const user = reg.user;
    const event = reg.event;
    const category = reg.ticket_category;

    if (!event) return;

    // 1. Populate Event Details
    this.eventTitle = event.name || '';
    this.eventLocation = event.location || '';
    this.eventImage = event.banner_image || 'assets/images/HindiaConcert.jpg';
    this.eventCategory = event.category === 'Entertainment' ? 'Music Festival' : (event.category || '');

    // Parse date and time
    const startDateStr = event.start_date || '';
    const startTimeStr = event.start_time || '';
    
    if (startDateStr) {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateObj = new Date(startDateStr);
      if (!isNaN(dateObj.getTime())) {
        this.eventDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      } else {
        this.eventDate = startDateStr;
      }
    }

    if (startTimeStr) {
      const parts = startTimeStr.split(':');
      if (parts.length >= 2) {
        this.eventTime = `${parts[0]}.${parts[1]} WIB`;
      }
    }

    // 2. Populate Booking Details
    this.fullName = user ? user.name : 'User';
    this.bookingId = reg.registration_code || reg.qr_code || `REG-${reg.id}`;
    this.qrCode = reg.qr_code || '';
    this.totalPrice = category ? Number(category.price) : 0;
    this.paymentMethod = reg.payment_method || reg.paymentMethod || 'Bank Transfer';
    this.selectedSeats = reg.seat_number ? [reg.seat_number] : [];

    this.paymentStatus = reg.payment_status || '';
    this.paymentAmount = reg.payment_amount !== null ? Number(reg.payment_amount) : (category ? Number(category.price) : 0);
    this.paymentExpiredAt = this.normalizeServerDate(reg.payment_expired_at);
    this.paidAt = this.normalizeServerDate(reg.paid_at);
    
    // Determine quantities
    const isVip = category?.name?.toLowerCase().includes('vip');
    this.vipQty = isVip ? 1 : 0;
    this.regularQty = !isVip ? 1 : 0;

    // Purchased Tickets array
    this.purchasedTickets = [];
    if (category) {
      this.purchasedTickets.push({
        name: category.name || 'Ticket Class',
        qty: 1
      });
    }

    // Mapped Status
    let uiStatus = 'Upcoming';
    const backendStatus = (reg.status || 'pending').toLowerCase();
    
    if (backendStatus === 'pending') {
      uiStatus = 'Unpaid';
    } else if (backendStatus === 'cancelled') {
      uiStatus = 'Canceled';
    } else if (backendStatus === 'confirmed') {
      // Check if event is finished
      const now = new Date();
      const endDateStr = event.end_date || event.start_date;
      const endTimeStr = event.end_time || '23:59:59';
      const eventEndObj = new Date(`${endDateStr} ${endTimeStr}`);
      if (!isNaN(eventEndObj.getTime()) && now > eventEndObj) {
        uiStatus = 'Completed';
      } else {
        uiStatus = 'Upcoming';
      }
    }
    this.status = uiStatus;

    // Handle refund (if relation is loaded)
    if (reg.refund) {
      this.status = reg.refund.status === 'approved' 
        ? 'Refunded' 
        : (reg.refund.status === 'rejected' ? 'Refund Rejected' : 'Refund In Process');
      this.refundReason = reg.refund.reason || '';
      this.refundRequestedAt = new Date(reg.refund.created_at).getTime() || Date.now();
      this.refundUpdatedAt = new Date(reg.refund.updated_at).getTime() || Date.now();
    }
  }

  ngOnDestroy() {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }

  private loadFallbackEvent(type: string) {
    this.eventService.getEventById('concert').subscribe({
      next: (fallbackEvent) => {
        this.populateBookingAndEventData(fallbackEvent, 'concert');
      },
      error: () => {
        this.populateBookingAndEventData(null, type);
      }
    });
  }

  private populateBookingAndEventData(activeEvent: any, type: string) {
    // Attempt to load this specific event from booking_history
    let foundBooking: any = null;
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      foundBooking = historyList.find((b: any) => b.eventType === type);
    } catch (e) {
      console.error(e);
    }

    // Fallback to latest_booking if booking_history doesn't contain it
    if (!foundBooking) {
      const latestStr = localStorage.getItem('latest_booking');
      if (latestStr) {
        try {
          const latest = JSON.parse(latestStr);
          if (latest.eventType === type) {
            foundBooking = latest;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Populate booking data
    if (foundBooking) {
      this.fullName = foundBooking.fullName || 'Rifqy';
      this.vipQty = foundBooking.vipQty || 0;
      this.regularQty = foundBooking.regularQty || 0;
      this.selectedSeats = foundBooking.selectedSeats || [];
      this.totalPrice = foundBooking.totalPrice || 0;
      this.paymentMethod = foundBooking.paymentMethod || foundBooking.payment_method || 'Bank Transfer';
      this.status = foundBooking.status || 'Upcoming';
      this.bookingId = foundBooking.bookingId || '';
      this.qrCode = foundBooking.qr_code || foundBooking.bookingId || '';
      this.refundReason = foundBooking.refundReason || '';
      this.refundRequestedAt = foundBooking.refundRequestedAt || 0;

      this.paymentStatus = foundBooking.payment_status || (this.status === 'Upcoming' || this.status === 'Completed' ? 'paid' : (this.status === 'Canceled' ? 'failed' : 'pending'));
      this.paymentAmount = foundBooking.payment_amount !== null && foundBooking.payment_amount !== undefined ? Number(foundBooking.payment_amount) : this.totalPrice;
      this.paymentExpiredAt = this.normalizeServerDate(foundBooking.payment_expired_at || foundBooking.paymentExpiredAt);
      this.paidAt = this.normalizeServerDate(foundBooking.paid_at || foundBooking.paidAt);
    } else {
      // Mock default state
      this.fullName = 'Rifqy';
      this.vipQty = type === 'concert' ? 4 : 1;
      this.regularQty = 0;
      this.selectedSeats = type === 'concert' ? ['V1', 'V2', 'V3', 'V4'] : ['R1'];
      this.totalPrice = type === 'concert' ? 1500000 : 150000;
      this.paymentMethod = 'Bank Transfer';
      this.status = type === 'concert' ? 'Upcoming' : 'Completed';
      this.bookingId = 'JV-2026-92831';
      this.qrCode = 'QR-TEST';

      this.paymentStatus = 'paid';
      this.paymentAmount = this.totalPrice;
      this.paymentExpiredAt = '';
      this.paidAt = '';
    }

    // Populate event detail
    this.purchasedTickets = [];
    if (activeEvent) {
      this.eventTitle = activeEvent.title;
      const parts = activeEvent.date.split('•');
      this.eventDate = `${parts[0]?.trim()} 2026`;
      this.eventTime = `${parts[1]?.trim()} WIB`;
      this.eventLocation = activeEvent.location;
      this.eventImage = activeEvent.image;
      this.eventCategory = activeEvent.category === 'Entertainment' ? 'Music Festival' : activeEvent.category;

      // Extract category names if quantities match
      const state = window.history.state;
      let ticketQuantities = state?.ticketQuantities || foundBooking?.ticketQuantities;
      if (ticketQuantities) {
        this.purchasedTickets = Object.keys(ticketQuantities)
          .map(catId => {
            const cat = activeEvent.ticketCategories.find((c: any) => c.id === catId);
            return {
              name: cat ? cat.name : catId,
              qty: ticketQuantities[catId]
            };
          })
          .filter(item => item.qty > 0);
      }
    }

    if (this.purchasedTickets.length === 0) {
      if (this.vipQty > 0) {
        this.purchasedTickets.push({ name: 'VIP PASS', qty: this.vipQty });
      }
      if (this.regularQty > 0) {
        this.purchasedTickets.push({ name: 'REGULAR PASS', qty: this.regularQty });
      }
    }
  }

  goBack() {
    this.router.navigate(['/tabs/tickets']);
  }

  /* TOAST NOTIFICATION HELPERS */
  showToast(message: string) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage = message;
    this.toastVisible = true;
    this.toastTimeout = setTimeout(() => {
      this.toastVisible = false;
    }, 2000);
  }

  /* REFUND ACTIONS */
  openRefundModal() {
    this.selectedReason = '';
    this.customReason = '';
    this.showModal = true;
  }

  closeRefundModal() {
    this.showModal = false;
  }

  selectReason(reason: string) {
    this.selectedReason = reason;
  }

  submitRefund() {
    if (!this.selectedReason) return;

    const finalReason = this.selectedReason === 'Other' 
      ? (this.customReason.trim() || 'Other') 
      : this.selectedReason;
    const requestedAt = Date.now();

    if (this.registrationId) {
      this.eventService.requestRefund(this.registrationId, finalReason).subscribe({
        next: (res) => {
          this.status = 'Refund Requested';
          this.refundReason = finalReason;
          this.refundRequestedAt = requestedAt;

          this.updateLocalRefundState(finalReason, requestedAt);
          this.closeRefundModal();
          this.showToast('Refund request submitted successfully');
        },
        error: (err) => {
          console.error('Error submitting refund to backend:', err);
          this.showToast('Failed to submit refund request');
        }
      });
    } else {
      // Offline fallback mock
      this.status = 'Refund Requested';
      this.refundReason = finalReason;
      this.refundRequestedAt = requestedAt;
      this.updateLocalRefundState(finalReason, requestedAt);
      this.closeRefundModal();
      this.showToast('Refund request submitted (offline mock)');
    }
  }

  private updateLocalRefundState(finalReason: string, requestedAt: number) {
    const latestStr = localStorage.getItem('latest_booking');
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.eventType === this.eventType) {
          latest.status = 'Refund Requested';
          latest.refundReason = finalReason;
          latest.refundRequestedAt = requestedAt;
          latest.qr_code = this.qrCode;
          localStorage.setItem('latest_booking', JSON.stringify(latest));
        }
      } catch (e) {
        console.error(e);
      }
    }

    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      const index = historyList.findIndex((b: any) => b.eventType === this.eventType);
      
      const updatedBooking = {
        bookingId: this.bookingId || 'JV-2026-92831',
        qr_code: this.qrCode,
        fullName: this.fullName,
        vipQty: this.vipQty,
        regularQty: this.regularQty,
        selectedSeats: this.selectedSeats,
        totalPrice: this.totalPrice,
        paymentMethod: this.paymentMethod,
        payment_method: this.paymentMethod,
        eventType: this.eventType,
        status: 'Refund Requested',
        refundReason: finalReason,
        refundRequestedAt: requestedAt
      };

      if (index > -1) {
        historyList[index] = { ...historyList[index], ...updatedBooking };
      } else {
        historyList.push(updatedBooking);
      }
      localStorage.setItem('booking_history', JSON.stringify(historyList));
    } catch (e) {
      console.error(e);
    }
  }

  /* SCANNER SIMULATOR */
  openScannerSim() {
    this.showScannerSim = true;
  }

  closeScannerSim() {
    this.showScannerSim = false;
  }
}