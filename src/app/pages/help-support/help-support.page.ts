import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  helpCircleOutline,
  headsetOutline,
  mailOutline,
  logoWhatsapp,
  timeOutline,
  documentTextOutline,
  alertCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  chatbubbleEllipsesOutline,
  informationCircleOutline
} from 'ionicons/icons';

interface FaqItem {
  q: string;
  a: string;
  expanded: boolean;
  bulletPoints?: string[];
}

@Component({
  selector: 'app-help-support',
  templateUrl: './help-support.page.html',
  styleUrls: ['./help-support.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class HelpSupportPage {
  private router = inject(Router);

  /* TOAST NOTIFICATION */
  toastVisible = false;
  toastMessage = '';
  private toastTimeout: any;

  /* FAQ DATA */
  faqs: FaqItem[] = [
    {
      q: 'How do I buy tickets?',
      a: 'Select your event, choose tickets, complete payment, and your ticket will appear in My Tickets.',
      expanded: false
    },
    {
      q: 'Why is my ticket not showing?',
      a: 'Your ticket may not appear because:',
      bulletPoints: [
        'Payment has not been completed',
        'Payment session has expired',
        'The ticket is in the Unpaid or Canceled tab',
        'The app needs to refresh booking data'
      ],
      expanded: false
    },
    {
      q: 'Can I request a refund?',
      a: 'Refund requests can be submitted before the event starts. Refund approval depends on the organizer’s policy and ticket conditions. Canceled events are eligible for full refunds.',
      expanded: false
    },
    {
      q: 'How do I get my certificate?',
      a: 'Certificates are available after the event has been completed successfully.',
      expanded: false
    }
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      helpCircleOutline,
      headsetOutline,
      mailOutline,
      logoWhatsapp,
      timeOutline,
      documentTextOutline,
      alertCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      chatbubbleEllipsesOutline,
      informationCircleOutline
    });
  }

  /* BACK NAVIGATION */
  goBack() {
    this.router.navigate(['/tabs/profile']);
  }

  /* FAQ TOGGLE */
  toggleFaq(index: number) {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }

  /* SHOW TOAST MESSAGE */
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

  /* ACTION HANDLERS */
  contactSupport() {
    this.showToast('Support feature will be available soon');
  }

  reportProblem() {
    this.showToast('Report system coming soon');
  }
}
