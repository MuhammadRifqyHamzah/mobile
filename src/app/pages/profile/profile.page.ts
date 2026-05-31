import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  personOutline,
  notificationsOutline,
  lockClosedOutline,
  helpCircleOutline,
  informationCircleOutline,
  chevronForwardOutline,
  logOutOutline,
  ticketOutline,
  heartOutline,
  timeOutline,
  ribbonOutline
} from 'ionicons/icons';
import { EventService } from '../../services/event.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule]
})
export class ProfilePage implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  userName = '';
  userEmail = '';
  userAvatar = '';
  
  // Statistics
  activeTicketsCount = 0;
  savedEventsCount = 0;
  historyCount = 0;

  private subscription!: Subscription;
  private profileSubscription!: Subscription;

  menuItems = [
    {
      title: 'Edit Profile',
      icon: 'person-outline',
      action: 'edit'
    },
    {
      title: 'Notification',
      icon: 'notifications-outline',
      action: 'notifications'
    },
    {
      title: 'Certificates',
      icon: 'ribbon-outline',
      action: 'certificates'
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      action: 'help'
    },
    {
      title: 'About App',
      icon: 'information-circle-outline',
      action: 'about'
    }
  ];

  constructor() {
    addIcons({
      personOutline,
      notificationsOutline,
      lockClosedOutline,
      helpCircleOutline,
      informationCircleOutline,
      chevronForwardOutline,
      logOutOutline,
      ticketOutline,
      heartOutline,
      timeOutline,
      ribbonOutline
    });
  }

  ionViewWillEnter() {
    this.calculateStatistics();
  }

  ngOnInit() {
    this.subscription = this.eventService.savedEventIds$.subscribe(ids => {
      this.calculateStatistics();
    });

    this.profileSubscription = this.profileService.profile$.subscribe(profile => {
      this.userName = profile.fullName;
      this.userEmail = profile.email;
      this.userAvatar = profile.avatar;
    });
  }

  calculateStatistics() {
    // 1. Saved count
    const savedIds = this.eventService.getSavedEventIds();
    this.savedEventsCount = savedIds.length;

    // 2. Booking stats (unpaid, canceled, paid, completed, upcoming)
    const historyStr = localStorage.getItem('booking_history') || '[]';
    try {
      const bookings: any[] = JSON.parse(historyStr);

      // Clean up duplicates by bookingId
      const uniqueBookings: any[] = [];
      const seenIds = new Set<string>();
      for (const booking of bookings) {
        if (booking && booking.bookingId) {
          if (!seenIds.has(booking.bookingId)) {
            seenIds.add(booking.bookingId);
            uniqueBookings.push(booking);
          }
        }
      }

      // Check auto-expiration for unpaid bookings in history
      let historyChanged = false;
      for (const booking of uniqueBookings) {
        if (booking.status === 'Unpaid' && booking.paymentExpiredAt && Date.now() > booking.paymentExpiredAt) {
          booking.status = 'Canceled';
          historyChanged = true;
        }
      }
      if (historyChanged) {
        localStorage.setItem('booking_history', JSON.stringify(uniqueBookings));
        const latestStr = localStorage.getItem('latest_booking');
        if (latestStr) {
          try {
            const latest = JSON.parse(latestStr);
            if (latest.status === 'Unpaid' && latest.paymentExpiredAt && Date.now() > latest.paymentExpiredAt) {
              latest.status = 'Canceled';
              localStorage.setItem('latest_booking', JSON.stringify(latest));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      // Calculate Active Tickets Count (paid, upcoming, completed)
      this.activeTicketsCount = uniqueBookings.reduce((sum, booking) => {
        const status = (booking.status || '').toLowerCase();
        if (status === 'upcoming' || status === 'completed' || status === 'paid') {
          const qty = booking.ticketQuantities
            ? Object.values(booking.ticketQuantities).reduce((s: number, v: any) => s + Number(v || 0), 0)
            : (Number(booking.vipQty || 0) + Number(booking.regularQty || 0));
          return sum + qty;
        }
        return sum;
      }, 0);

      // Calculate History Count (total booking activities including unpaid and canceled)
      this.historyCount = uniqueBookings.length;
    } catch (e) {
      console.error(e);
      this.activeTicketsCount = 0;
      this.historyCount = 0;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  handleMenuClick(action: string) {
    console.log(`Menu clicked: ${action}`);
    if (action === 'edit') {
      this.router.navigate(['/edit-profile']);
    } else if (action === 'notifications') {
      this.router.navigate(['/notifications']);
    } else if (action === 'certificates') {
      this.router.navigate(['/certificates']);
    } else if (action === 'help') {
      this.router.navigate(['/help-support']);
    } else if (action === 'about') {
      this.router.navigate(['/about-app']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
