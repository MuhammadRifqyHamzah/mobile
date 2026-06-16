import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  ribbonOutline,
  checkmarkCircle,
  chevronForwardOutline
} from 'ionicons/icons';
import { EventService, EventItem } from '../../services/event.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.page.html',
  styleUrls: ['./certificates.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class CertificatesPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private eventService = inject(EventService);
  private profileService = inject(ProfileService);

  userName = '';
  certificates: any[] = [];
  private profileSubscription!: Subscription;
  private eventsSubscription!: Subscription;
  private allEvents: EventItem[] = [];

  constructor() {
    addIcons({
      arrowBackOutline,
      ribbonOutline,
      checkmarkCircle,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.profileSubscription = this.profileService.profile$.subscribe(profile => {
      this.userName = profile.fullName;
      this.loadCertificates();
    });

    this.eventsSubscription = this.eventService.getEvents(true).subscribe({
      next: (events) => {
        this.allEvents = events;
        this.loadCertificates();
      },
      error: (err) => {
        console.error('Error loading events in Certificates:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    this.loadCertificates();
  }

  loadCertificates() {
    const historyStr = localStorage.getItem('booking_history') || '[]';
    let bookings: any[] = [];
    try {
      bookings = JSON.parse(historyStr);
    } catch (e) {
      console.error(e);
    }

    // Filter unique completed bookings (we treat completed/paid bookings as eligible for certificates)
    const completedBookings = bookings.filter((b: any) => {
      const status = (b.status || '').toLowerCase();
      // Status 'Completed' or 'Upcoming' / 'Paid' are paid
      return status === 'completed' || status === 'upcoming' || status === 'paid';
    });

    // Make sure we always display at least one certificate for the default completed seminar event
    const hasSeminar = completedBookings.some((b: any) => b.eventType === 'seminar');
    if (!hasSeminar) {
      completedBookings.push({
        bookingId: 'BK-DEFAULT-SEM-2026',
        fullName: this.userName || 'JoyVent Participant',
        vipQty: 0,
        regularQty: 1,
        ticketQuantities: { 'seminar-pass': 1 },
        selectedSeats: [],
        totalPrice: 150000,
        paymentMethod: 'Bank Transfer',
        eventType: 'seminar',
        status: 'Completed'
      });
    }

    // Map to Certificate Items
    this.certificates = completedBookings.map((b: any) => {
      const event = this.allEvents.find((e: any) => e.id === b.eventType) || {
        title: b.eventType === 'seminar' ? 'Digital Business Seminar 2026' : 'Hindia Pop Music Concert',
        date: b.eventType === 'seminar' ? '15 Juni • 09.00' : '28 Mei • 19.00',
        location: b.eventType === 'seminar' ? 'Bandung' : 'Jakarta',
        category: b.eventType === 'seminar' ? 'Education' : 'Entertainment'
      };

      const parts = event.date.split('•');
      const datePart = parts[0]?.trim() || '';
      
      // Formulate unique cert ID based on bookingId suffix
      const suffix = b.bookingId ? b.bookingId.split('-').pop()?.substring(0, 5) || '92841' : '92841';
      const certId = `JV-2026-${b.eventType === 'seminar' ? 'SEM' : 'CON'}-${suffix.toUpperCase()}`;

      return {
        id: certId,
        bookingId: b.bookingId,
        eventId: b.eventType,
        eventTitle: event.title,
        participantName: b.fullName || this.userName || 'JoyVent Participant',
        eventDate: `${datePart} 2026`,
        organizer: b.eventType === 'seminar' ? 'Tech Corp Indonesia' : 'Pop & Joy Records',
        status: 'Verified',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-JOYVENT-${certId}`,
        fullBooking: b
      };
    });
  }

  goBack() {
    this.router.navigate(['/tabs/profile']);
  }

  viewCertificate(cert: any) {
    this.router.navigate(
      ['/certificate-detail'],
      {
        state: cert
      }
    );
  }
}
