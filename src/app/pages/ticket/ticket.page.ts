import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
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
  closeCircleOutline
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
export class TicketPage implements OnInit {
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

  /* REFUND AND SCAN SIMULATION VARIABLES */
  status = 'Upcoming';
  bookingId = '';
  eventType = 'concert';
  refundReason = '';
  refundRequestedAt = 0;
  
  showModal = false;
  selectedReason = '';
  customReason = '';
  refundReasons = ['Cannot attend', 'Wrong ticket purchase', 'Schedule conflict', 'Other'];

  showScannerSim = false;

  /* TOAST NOTIFICATION */
  toastVisible = false;
  toastMessage = '';
  private toastTimeout: any;

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
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const type = params['type'] || 'concert';
      this.eventType = type;

      const event = this.eventService.getEventById(type);
      const activeEvent = event || this.eventService.getEventById('concert');

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
        this.paymentMethod = foundBooking.paymentMethod || 'Bank Transfer';
        this.status = foundBooking.status || 'Upcoming';
        this.bookingId = foundBooking.bookingId || '';
        this.refundReason = foundBooking.refundReason || '';
        this.refundRequestedAt = foundBooking.refundRequestedAt || 0;
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
        const state = history.state;
        let ticketQuantities = state?.ticketQuantities || foundBooking?.ticketQuantities;
        if (ticketQuantities) {
          this.purchasedTickets = Object.keys(ticketQuantities)
            .map(catId => {
              const cat = activeEvent.ticketCategories.find(c => c.id === catId);
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
    });
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

    this.status = 'Refund Requested';
    this.refundReason = finalReason;
    this.refundRequestedAt = requestedAt;

    // Update latest_booking in localStorage
    const latestStr = localStorage.getItem('latest_booking');
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.eventType === this.eventType) {
          latest.status = 'Refund Requested';
          latest.refundReason = finalReason;
          latest.refundRequestedAt = requestedAt;
          localStorage.setItem('latest_booking', JSON.stringify(latest));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Update booking_history in localStorage
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      const index = historyList.findIndex((b: any) => b.eventType === this.eventType);
      
      const updatedBooking = {
        bookingId: this.bookingId || 'JV-2026-92831',
        fullName: this.fullName,
        vipQty: this.vipQty,
        regularQty: this.regularQty,
        selectedSeats: this.selectedSeats,
        totalPrice: this.totalPrice,
        paymentMethod: this.paymentMethod,
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

    this.closeRefundModal();
    this.showToast('Refund request submitted successfully');
  }

  /* SIMULATION ACTIONS */
  simulateApproveRefund() {
    this.status = 'Refunded';

    // Update latest_booking
    const latestStr = localStorage.getItem('latest_booking');
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.eventType === this.eventType) {
          latest.status = 'Refunded';
          localStorage.setItem('latest_booking', JSON.stringify(latest));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Update booking_history
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      const index = historyList.findIndex((b: any) => b.eventType === this.eventType);
      if (index > -1) {
        historyList[index].status = 'Refunded';
        localStorage.setItem('booking_history', JSON.stringify(historyList));
      }
    } catch (e) {
      console.error(e);
    }

    this.showToast('Refund approved and completed successfully');
  }

  /* SCANNER SIMULATOR */
  openScannerSim() {
    this.showScannerSim = true;
  }

  closeScannerSim() {
    this.showScannerSim = false;
  }
}