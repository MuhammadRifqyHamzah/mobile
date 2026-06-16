import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  locationOutline,
  heartOutline,
  heart,
  arrowBackOutline,
  checkmarkCircle,
  starOutline,
  ticketOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { EventService, EventItem } from '../../services/event.service';

export interface TicketCategory {
  name: string;
  total: number;
  sold: number;
  remaining: number;
  soldPercentage: number;
  statusText: string;
  statusColor: string; // 'green' | 'orange' | 'red'
  icon: string;
}

@Component({
  selector: 'app-detail-event',
  templateUrl: './detail-event.page.html',
  styleUrls: ['./detail-event.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon
  ],
})
export class DetailEventPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  eventType = '';
  eventTitle = '';
  eventImage = '';
  eventPrice = '';
  eventDate = '';
  eventLocation = '';
  eventDescription = '';

  ticketCategories: TicketCategory[] = [];
  totalTickets = 0;
  soldTickets = 0;
  remainingTickets = 0;
  soldPercentage = 0;
  ticketStatusText = '';
  ticketStatusColor = '';

  private eventSubscription!: Subscription;

  constructor() {
    addIcons({
      calendarOutline,
      locationOutline,
      heartOutline,
      heart,
      arrowBackOutline,
      checkmarkCircle,
      starOutline,
      ticketOutline,
      informationCircleOutline
    });
  }

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    this.eventType = type || 'concert';

    this.eventSubscription = this.eventService.getEventById(this.eventType).subscribe({
      next: (event) => {
        if (event) {
          this.setEventDetails(event);
        } else {
          this.loadFallbackEvent();
        }
      },
      error: (err) => {
        console.error('Error fetching event details:', err);
        this.loadFallbackEvent();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe();
    }
  }

  private setEventDetails(event: EventItem) {
    this.eventTitle = event.title;
    this.eventImage = event.image;
    this.eventPrice = event.price;
    this.eventDate = event.date;
    this.eventLocation = event.location;
    this.eventDescription = event.description;

    this.ticketCategories = event.ticketCategories.map(cat => {
      const remaining = cat.total - cat.sold;
      const soldPercentage = cat.total > 0 ? Math.round((cat.sold / cat.total) * 100) : 0;
      let statusText = 'Available';
      let statusColor = 'green';
      if (remaining === 0) {
        statusText = 'Sold Out';
        statusColor = 'red';
      } else if (remaining <= 10) {
        statusText = 'Almost Sold Out';
        statusColor = 'red';
      } else if (remaining <= 20) {
        statusText = 'Limited Tickets';
        statusColor = 'orange';
      }
      return {
        name: cat.name,
        total: cat.total,
        sold: cat.sold,
        remaining: remaining,
        soldPercentage: soldPercentage,
        statusText: statusText,
        statusColor: statusColor,
        icon: cat.icon
      };
    });

    this.totalTickets = event.ticketCategories.reduce((sum, cat) => sum + cat.total, 0);
    this.soldTickets = event.ticketCategories.reduce((sum, cat) => sum + cat.sold, 0);
    this.remainingTickets = this.totalTickets - this.soldTickets;
    this.soldPercentage = this.totalTickets > 0 ? Math.round((this.soldTickets / this.totalTickets) * 100) : 0;

    // Determine Overall Status Color & Text (MD3 styling)
    this.updateStatusText();
  }

  private loadFallbackEvent() {
    this.eventService.getEventById('concert').subscribe({
      next: (fallback) => {
        if (fallback) {
          this.setEventDetails(fallback);
        } else {
          this.setStaticFallback();
        }
      },
      error: () => {
        this.setStaticFallback();
      }
    });
  }

  private setStaticFallback() {
    this.eventTitle = 'Hindia Pop Music Concert';
    this.eventImage = 'assets/images/HindiaConcert.jpg';
    this.eventPrice = 'Rp.300.000';
    this.eventDate = '28 Mei • 19.00';
    this.eventLocation = 'Jakarta';
    this.eventDescription = 'Hindia Pop Music Concert menampilkan salah satu musisi paling berpengaruh di Indonesia, dikenal lewat lirik jujur dan storytelling emosional.';
    
    this.totalTickets = 0;
    this.soldTickets = 0;
    this.remainingTickets = 0;
    this.soldPercentage = 0;
    this.ticketCategories = [];
    this.updateStatusText();
  }

  private updateStatusText() {
    if (this.remainingTickets === 0 && this.totalTickets > 0) {
      this.ticketStatusText = 'Sold Out';
      this.ticketStatusColor = 'red';
    } else if (this.remainingTickets <= 15 && this.totalTickets > 0) {
      this.ticketStatusText = 'Almost Sold Out';
      this.ticketStatusColor = 'red';
    } else if (this.remainingTickets <= 40 && this.totalTickets > 0) {
      this.ticketStatusText = 'Limited Tickets';
      this.ticketStatusColor = 'orange';
    } else {
      this.ticketStatusText = 'Available';
      this.ticketStatusColor = 'green';
    }
  }

  isSaved(): boolean {
    return this.eventService.isSaved(this.eventType);
  }

  toggleSave() {
    this.eventService.toggleSave(this.eventType);
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }

  goToBooking() {
    this.router.navigate(
      ['/booking'],
      {
        queryParams: {
          type: this.eventType
        }
      }
    );
  }
}