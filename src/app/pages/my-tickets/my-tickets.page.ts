import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
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
  private expireCheckInterval: any;

  constructor() {
    addIcons({
      calendarOutline,
      locationOutline,
      ticketOutline
    });
  }

  ionViewWillEnter() {
    this.tickets = this.eventService.getEvents().map(event => {
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
  }

  ionViewDidLeave() {
    this.stopExpireCheck();
  }

  ngOnDestroy() {
    this.stopExpireCheck();
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
      
      // Update our mapped events with actual status & qty in history
      for (const booking of historyList) {
        const ticketId = booking.eventType || 'concert';
        const ticket = this.tickets.find(t => t.id === ticketId);
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
        const ticket = this.tickets.find(t => t.id === ticketId);
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
    const latestStr = localStorage.getItem('latest_booking');
    let stateData: any = null;
    if (latestStr) {
      try {
        const latest = JSON.parse(latestStr);
        if (latest.eventType === ticket.id) {
          stateData = latest;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!stateData) {
      stateData = {
        fullName: 'User',
        vipQty: ticket.id === 'concert' ? 1 : 0,
        regularQty: ticket.id === 'concert' ? 0 : 1,
        selectedSeats: [],
        totalPrice: ticket.id === 'concert' ? 1500000 : 150000,
        paymentMethod: 'Bank Transfer',
        eventType: ticket.id,
        status: 'Unpaid',
        paymentExpiredAt: Date.now() + 10 * 60 * 1000
      };
    }

    this.router.navigate(
      ['/payment-instruction'],
      {
        queryParams: {
          type: ticket.id
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
        ticket => ticket.status === 'Upcoming'
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
        ticket => ticket.status === 'Refund Requested' || ticket.status === 'Refunded'
      );
    }
    return [];
  }

  /* GO TO DETAIL */
  goToTicketDetail(ticket: any) {
    const type = ticket.id;
    
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

    if (!stateData) {
      stateData = {
        bookingId: 'JV-2026-92831',
        fullName: 'Rifqy',
        vipQty: type === 'concert' ? 4 : 1,
        regularQty: 0,
        selectedSeats: type === 'concert' ? ['V1', 'V2', 'V3', 'V4'] : ['R1'],
        totalPrice: type === 'concert' ? 1500000 : 150000,
        paymentMethod: 'Bank Transfer',
        eventType: type,
        status: ticket.status
      };
    }

    this.router.navigate(
      ['/ticket'],
      {
        queryParams: {
          type: type
        },
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
          type: ticket.id
        }
      }
    );
  }
}