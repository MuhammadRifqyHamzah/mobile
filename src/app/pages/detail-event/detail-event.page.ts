import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
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
import { EventService } from '../../services/event.service';

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
export class DetailEventPage implements OnInit {
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

    const event = this.eventService.getEventById(this.eventType);
    if (event) {
      this.eventTitle = event.title;
      this.eventImage = event.image;
      this.eventPrice = event.price;
      this.eventDate = event.date;
      this.eventLocation = event.location;
      this.eventDescription = event.description;
    } else {
      // Fallback to active event
      const fallback = this.eventService.getEventById('concert');
      if (fallback) {
        this.eventType = 'concert';
        this.eventTitle = fallback.title;
        this.eventImage = fallback.image;
        this.eventPrice = fallback.price;
        this.eventDate = fallback.date;
        this.eventLocation = fallback.location;
        this.eventDescription = fallback.description;
      } else {
        this.eventTitle = 'Hindia Pop Music Concert';
        this.eventImage = 'assets/images/HindiaConcert.jpg';
        this.eventPrice = 'Rp.300.000';
        this.eventDate = '28 Mei • 19.00';
        this.eventLocation = 'Jakarta';
        this.eventDescription = 'Hindia Pop Music Concert menampilkan salah satu musisi paling berpengaruh di Indonesia, dikenal lewat lirik jujur dan storytelling emosional.';
      }
    }

    const activeEvent = event || this.eventService.getEventById('concert');
    if (activeEvent) {
      this.ticketCategories = activeEvent.ticketCategories.map(cat => {
        const remaining = cat.total - cat.sold;
        const soldPercentage = Math.round((cat.sold / cat.total) * 100);
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

      this.totalTickets = activeEvent.ticketCategories.reduce((sum, cat) => sum + cat.total, 0);
      this.soldTickets = activeEvent.ticketCategories.reduce((sum, cat) => sum + cat.sold, 0);
      this.remainingTickets = this.totalTickets - this.soldTickets;
      this.soldPercentage = Math.round((this.soldTickets / this.totalTickets) * 100);
    } else {
      this.totalTickets = 0;
      this.soldTickets = 0;
      this.remainingTickets = 0;
      this.soldPercentage = 0;
      this.ticketCategories = [];
    }

    // Determine Overall Status Color & Text (MD3 styling)
    if (this.remainingTickets === 0) {
      this.ticketStatusText = 'Sold Out';
      this.ticketStatusColor = 'red';
    } else if (this.remainingTickets <= 15) {
      this.ticketStatusText = 'Almost Sold Out';
      this.ticketStatusColor = 'red';
    } else if (this.remainingTickets <= 40) {
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