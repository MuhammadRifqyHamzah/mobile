import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  locationOutline,
  ticketOutline
} from 'ionicons/icons';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-my-tickets',
  templateUrl: './my-tickets.page.html',
  styleUrls: ['./my-tickets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class MyTicketsPage implements OnDestroy {
  private router = inject(Router);
  private eventService = inject(EventService);

  selectedTab = 'upcoming';

  tickets: any[] = [];
  isLoading = false;
  private expireCheckInterval: any;
  private eventsSubscription!: Subscription;

  constructor() {
    addIcons({
      calendarOutline,
      locationOutline,
      ticketOutline
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.eventsSubscription = this.eventService.getRegistrations().subscribe({
      next: (registrations) => {
        this.isLoading = false;
        // Map backend registrations to mobile ticket model
        this.tickets = registrations
          .map(reg => this.mapRegistrationToTicket(reg))
          .filter(t => t !== null);
          
        this.startExpireCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('API getRegistrations failed, falling back to local history:', err);
        this.loadLegacyFallback();
      }
    });
  }

  loadLegacyFallback() {
    this.eventsSubscription = this.eventService.getEvents(true).subscribe({
      next: (events) => {
        this.tickets = events.map(event => {
          const parts = event.date.split('•');
          return {
            id: event.id,
            title: event.title,
            date: `${parts[0]?.trim()} 2026`,
            time: `${parts[1]?.trim()} WIB`,
            location: event.location,
            image: event.image,
            status: event.id === 'concert' ? 'Upcoming' : 'Completed',
            qty: event.id === 'concert' ? 4 : 1
          };
        });
        this.syncTicketsWithHistory();
        this.startExpireCheck();
      },
      error: (err) => {
        console.error('Error loading events in My Tickets fallback:', err);
      }
    });
  }

  mapRegistrationToTicket(reg: any): any {
    const event = reg.event;
    const ticketCategory = reg.ticket_category;
    
    if (!event) return null;

    // Parse date and time
    const startDateStr = event.start_date || '';
    const startTimeStr = event.start_time || '';
    
    let datePart = '';
    let timePart = '';
    
    if (startDateStr) {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dateObj = new Date(startDateStr);
      if (!isNaN(dateObj.getTime())) {
        datePart = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      } else {
        datePart = startDateStr;
      }
    }

    if (startTimeStr) {
      const parts = startTimeStr.split(':');
      if (parts.length >= 2) {
        timePart = `${parts[0]}.${parts[1]} WIB`;
      }
    }

    // Determine UI status from backend registration status
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

    if (reg.refund) {
      if (reg.refund.status === 'approved') {
        uiStatus = 'Refunded';
      } else if (reg.refund.status === 'rejected') {
        uiStatus = 'Refund Rejected';
      } else {
        uiStatus = 'Refund In Process';
      }
    }

    // Image fallback
    const image = event.banner_image || 'assets/images/HindiaConcert.jpg';

    return {
      id: reg.id.toString(), // Database registration ID
      eventId: event.id.toString(), // To fetch event details later
      title: event.name || '',
      date: datePart,
      time: timePart,
      location: event.location || '',
      image: image,
      status: uiStatus,
      isApi: true,
      qty: 1, // Currently backend registration is 1 seat/ticket category per row
      bookingId: reg.registration_code || reg.qr_code || `REG-${reg.id}`,
      ticketCategoryName: ticketCategory ? ticketCategory.name : 'Ticket Class',
      totalPrice: ticketCategory ? Number(ticketCategory.price) : 0,
      selectedSeats: reg.seat_number ? [reg.seat_number] : [],
      paymentMethod: reg.payment_method || reg.paymentMethod || 'Bank Transfer',
      payment_method: reg.payment_method || reg.paymentMethod || 'Bank Transfer',
      payment_status: reg.payment_status,
      payment_amount: reg.payment_amount !== null ? Number(reg.payment_amount) : (ticketCategory ? Number(ticketCategory.price) : 0),
      payment_expired_at: reg.payment_expired_at,
      paid_at: reg.paid_at
    };
  }

  ionViewDidLeave() {
    this.stopExpireCheck();
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.stopExpireCheck();
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  startExpireCheck() {
    if (this.expireCheckInterval) {
      clearInterval(this.expireCheckInterval);
    }
    this.expireCheckInterval = setInterval(() => {
      this.syncTicketsWithHistory();
    }, 1000);
  }

  stopExpireCheck() {
    if (this.expireCheckInterval) {
      clearInterval(this.expireCheckInterval);
    }
  }

  syncTicketsWithHistory() {
    // 1. Sync list based on localStorage booking_history
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      
      // Auto-expire check for unpaid items in history
      let historyChanged = false;
      for (const booking of historyList) {
        if (booking.status === 'Unpaid' && booking.paymentExpiredAt && Date.now() > booking.paymentExpiredAt) {
          booking.status = 'Canceled';
          historyChanged = true;
        }
      }
      if (historyChanged) {
        localStorage.setItem('booking_history', JSON.stringify(historyList));
      }
      
      // Update our mapped events with actual status & qty in history (only applies to legacy fallback tickets or if matched by eventType)
      for (const booking of historyList) {
        const ticketId = booking.eventType || 'concert';
        const ticket = this.tickets.find(t => !t.isApi && (t.id === ticketId || t.eventId === ticketId));
        if (ticket) {
          const totalQty = booking.ticketQuantities 
            ? Object.values(booking.ticketQuantities).reduce((sum: number, val: any) => sum + Number(val || 0), 0)
            : (booking.vipQty || 0) + (booking.regularQty || 0);
          ticket.qty = totalQty;
          ticket.status = booking.status || 'Upcoming';
        }
      }
    } catch (e) {
      console.error('Error syncing ticket list with history:', e);
    }

    // 2. Fallback check for latest_booking
    const latestStr = localStorage.getItem('latest_booking');
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.status === 'Unpaid' && latest.paymentExpiredAt && Date.now() > latest.paymentExpiredAt) {
          latest.status = 'Canceled';
          localStorage.setItem('latest_booking', JSON.stringify(latest));
        }

        const ticketId = latest.eventType || 'concert';
        const ticket = this.tickets.find(t => !t.isApi && (t.id === ticketId || t.eventId === ticketId));
        if (ticket) {
          const historyStr = localStorage.getItem('booking_history') || '[]';
          const historyList = JSON.parse(historyStr);
          const historyMatch = historyList.find((b: any) => b.eventType === ticketId);
          
          if (!historyMatch) {
            const totalQty = latest.ticketQuantities 
              ? Object.values(latest.ticketQuantities).reduce((sum: number, val: any) => sum + Number(val || 0), 0)
              : (latest.vipQty || 0) + (latest.regularQty || 0);
            ticket.qty = totalQty;
            ticket.status = latest.status || 'Upcoming';
          }
        }
      } catch (e) {
        console.error('Error syncing latest booking:', e);
      }
    }
  }

  continuePayment(ticket: any) {
    const targetType = ticket.eventId || ticket.id;
    const latestStr = localStorage.getItem('latest_booking');
    let stateData: any = null;
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.eventType === targetType) {
          stateData = latest;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!stateData) {
      stateData = {
        registrationId: ticket.isApi ? ticket.id : null,
        fullName: 'User',
        vipQty: ticket.ticketCategoryName?.toLowerCase().includes('vip') ? 1 : 0,
        regularQty: !ticket.ticketCategoryName?.toLowerCase().includes('vip') ? 1 : 0,
        selectedSeats: ticket.selectedSeats || [],
        totalPrice: ticket.totalPrice || (ticket.id === 'concert' ? 1500000 : 150000),
        paymentMethod: ticket.paymentMethod || ticket.payment_method || 'Bank Transfer',
        payment_method: ticket.payment_method || ticket.paymentMethod || 'Bank Transfer',
        eventType: targetType,
        status: 'Unpaid',
        paymentExpiredAt: Date.now() + 10 * 60 * 1000
      };
    } else if (ticket.isApi) {
      stateData.registrationId = ticket.id;
      stateData.payment_status = ticket.payment_status;
      stateData.payment_amount = ticket.payment_amount;
      stateData.paymentMethod = ticket.paymentMethod || ticket.payment_method || 'Bank Transfer';
      stateData.payment_method = ticket.payment_method || ticket.paymentMethod || 'Bank Transfer';
      stateData.payment_expired_at = ticket.payment_expired_at;
      stateData.paid_at = ticket.paid_at;
    }

    this.router.navigate(
      ['/payment-instruction'],
      {
        queryParams: {
          type: targetType
        },
        state: stateData
      }
    );
  }

  /* CHANGE TAB */
  changeTab(tab: string) {
    this.selectedTab = tab;
  }

  /* FILTER TICKETS */
  getFilteredTickets() {
    if (this.selectedTab === 'upcoming') {
      return this.tickets.filter(
        ticket => ticket.status === 'Upcoming' || ticket.status === 'Refund Rejected'
      );
    }
    if (this.selectedTab === 'unpaid') {
      return this.tickets.filter(
        ticket => ticket.status === 'Unpaid'
      );
    }
    if (this.selectedTab === 'completed') {
      return this.tickets.filter(
        ticket => ticket.status === 'Completed'
      );
    }
    if (this.selectedTab === 'canceled') {
      return this.tickets.filter(
        ticket => ticket.status === 'Canceled'
      );
    }
    if (this.selectedTab === 'refund') {
      return this.tickets.filter(
        ticket => ticket.status === 'Refund In Process' || ticket.status === 'Refunded' || ticket.status === 'Refund Rejected'
      );
    }
    return [];
  }

  /* GO TO DETAIL */
  goToTicketDetail(ticket: any) {
    const type = ticket.eventId || ticket.id;
    
    // Find the correct matching booking from history
    let stateData: any = null;
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const historyList = JSON.parse(historyStr);
      stateData = historyList.find((b: any) => b.eventType === type);
    } catch (e) {
      console.error(e);
    }

    // Fallback to latest_booking if not found in history
    if (!stateData) {
      const latestStr = localStorage.getItem('latest_booking');
      if (latestStr) {
        try {
          const latest = JSON.parse(latestStr);
          if (latest.eventType === type) {
            stateData = latest;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Construct stateData from API registration data if not found in local storage
    if (!stateData && ticket.eventId) {
      stateData = {
        registrationId: ticket.id,
        bookingId: ticket.bookingId,
        fullName: 'User',
        vipQty: ticket.ticketCategoryName?.toLowerCase().includes('vip') ? 1 : 0,
        regularQty: !ticket.ticketCategoryName?.toLowerCase().includes('vip') ? 1 : 0,
        ticketQuantities: {},
        selectedSeats: ticket.selectedSeats || [],
        totalPrice: ticket.totalPrice,
        paymentMethod: ticket.paymentMethod || ticket.payment_method || 'Bank Transfer',
        payment_method: ticket.payment_method || ticket.paymentMethod || 'Bank Transfer',
        eventType: ticket.eventId,
        status: ticket.status
      };
    }

    // Ultimate fallback mock
    if (!stateData) {
      stateData = {
        bookingId: 'JV-2026-92831',
        fullName: 'Rifqy',
        vipQty: type === 'concert' ? 4 : 1,
        regularQty: 0,
        selectedSeats: type === 'concert' ? ['V1', 'V2', 'V3', 'V4'] : ['R1'],
        totalPrice: type === 'concert' ? 1500000 : 150000,
        paymentMethod: 'Bank Transfer',
        payment_method: 'Bank Transfer',
        eventType: type,
        status: ticket.status
      };
    }

    if (ticket.isApi) {
      stateData.registrationId = ticket.id;
      stateData.payment_status = ticket.payment_status;
      stateData.payment_amount = ticket.payment_amount;
      stateData.paymentMethod = ticket.paymentMethod || ticket.payment_method || 'Bank Transfer';
      stateData.payment_method = ticket.payment_method || ticket.paymentMethod || 'Bank Transfer';
      stateData.payment_expired_at = ticket.payment_expired_at;
      stateData.paid_at = ticket.paid_at;
    }

    const queryParams: any = {
      type: type
    };
    if (ticket.eventId) {
      queryParams.registrationId = ticket.id;
    }

    this.router.navigate(
      ['/ticket'],
      {
        queryParams: queryParams,
        state: stateData
      }
    );
  }

  /* BOOK AGAIN */
  bookAgain(ticket: any) {
    this.router.navigate(
      ['/detail-event'],
      {
        queryParams: {
          type: ticket.eventId || ticket.id
        }
      }
    );
  }
}