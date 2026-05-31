import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  ticketOutline,
  gridOutline,
  qrCodeOutline,
  ribbonOutline,
  arrowUndoOutline,
  notificationsOutline,
  peopleOutline,
  starOutline,
  codeSlashOutline,
  logoInstagram,
  mailOutline,
  logoGithub,
  checkmarkCircle
} from 'ionicons/icons';

interface FeatureItem {
  title: string;
  icon: string;
  desc: string;
}

interface StatItem {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-about-app',
  templateUrl: './about-app.page.html',
  styleUrls: ['./about-app.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class AboutAppPage {
  private router = inject(Router);

  /* TOAST NOTIFICATION */
  toastVisible = false;
  toastMessage = '';
  private toastTimeout: any;

  /* FEATURES LIST */
  features: FeatureItem[] = [
    { title: 'Event Booking', icon: 'calendar-outline', desc: 'Browse and book events easily' },
    { title: 'Digital Tickets', icon: 'ticket-outline', desc: 'Organized dashboard for tickets' },
    { title: 'Seat Selection', icon: 'grid-outline', desc: 'Realtime interactive seat selector' },
    { title: 'QR Ticket', icon: 'qr-code-outline', desc: 'Gate validation ticket scanner' },
    { title: 'Certificates', icon: 'ribbon-outline', desc: 'Claim certificates post-events' },
    { title: 'Refund System', icon: 'arrow-undo-outline', desc: 'Simulated request refund flow' },
    { title: 'Event Reminder', icon: 'notifications-outline', desc: 'Stay updated with alert updates' }
  ];

  /* STATISTICS LIST */
  stats: StatItem[] = [
    { value: '10+', label: 'Events Listed', icon: 'calendar-outline' },
    { value: '100+', label: 'Participants', icon: 'people-outline' },
    { value: '50+', label: 'Tickets Issued', icon: 'ticket-outline' },
    { value: '98%', label: 'User Satisfaction', icon: 'star-outline' }
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      ticketOutline,
      gridOutline,
      qrCodeOutline,
      ribbonOutline,
      arrowUndoOutline,
      notificationsOutline,
      peopleOutline,
      starOutline,
      codeSlashOutline,
      logoInstagram,
      mailOutline,
      logoGithub,
      checkmarkCircle
    });
  }

  /* BACK TO PROFILE */
  goBack() {
    this.router.navigate(['/tabs/profile']);
  }

  /* TRIGGER SIMULATED TOAST */
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

  socialClick() {
    this.showToast('Coming soon');
  }
}
