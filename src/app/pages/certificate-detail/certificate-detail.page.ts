import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircle,
  downloadOutline,
  shareSocialOutline,
  ribbonOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-certificate-detail',
  templateUrl: './certificate-detail.page.html',
  styleUrls: ['./certificate-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class CertificateDetailPage implements OnInit {
  private router = inject(Router);

  cert: any = null;
  downloaded = false;
  shared = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircle,
      downloadOutline,
      shareSocialOutline,
      ribbonOutline
    });

    /* RECEIVE CERT STATE */
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    if (state) {
      this.cert = state;
    }
  }

  ngOnInit() {
    /* FALLBACK IF REFRESHED / STATE LOST */
    if (!this.cert) {
      this.cert = {
        id: 'JV-2026-SEM-92841',
        eventTitle: 'Digital Business Seminar 2026',
        participantName: 'JoyVent Participant',
        eventDate: '15 Juni 2026',
        organizer: 'Tech Corp Indonesia',
        status: 'Verified',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-JOYVENT-JV-2026-SEM-92841'
      };
    }
  }

  goBack() {
    this.router.navigate(['/certificates']);
  }

  downloadCertificate() {
    this.downloaded = true;
    setTimeout(() => {
      this.downloaded = false;
    }, 2500);
  }

  shareCertificate() {
    this.shared = true;
    setTimeout(() => {
      this.shared = false;
    }, 2500);
  }
}
