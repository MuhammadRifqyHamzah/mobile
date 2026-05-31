import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  trashOutline,
  notificationsOutline,
  musicalNotesOutline,
  sparklesOutline,
  ticketOutline,
  timeOutline
} from 'ionicons/icons';

export interface NotificationItem {
  id: number;
  title: string;
  description: string;
  category: 'Payment' | 'Events';
  time: string;
  unread: boolean;
  icon: string;
  iconBg: string;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class NotificationsPage implements OnInit {
  private router = inject(Router);

  selectedFilter = 'All';

  notifications: NotificationItem[] = [
    {
      id: 1,
      title: 'Hindia Concert starts tomorrow',
      description: 'Prepare your tickets and arrive 1 hour early at the venue.',
      category: 'Events',
      time: '5 mins ago',
      unread: true,
      icon: 'musical-notes-outline',
      iconBg: 'events-bg'
    },
    {
      id: 2,
      title: 'Payment successful',
      description: 'Your payment for Hindia Pop Music Concert has been confirmed.',
      category: 'Payment',
      time: '2 hours ago',
      unread: true,
      icon: 'checkmark-circle-outline',
      iconBg: 'payment-bg'
    },
    {
      id: 3,
      title: 'New recommended event near you',
      description: 'Tech Summit Indonesia is happening next week in Jakarta.',
      category: 'Events',
      time: '1 day ago',
      unread: false,
      icon: 'sparkles-outline',
      iconBg: 'events-bg'
    },
    {
      id: 4,
      title: 'Your ticket has been confirmed',
      description: 'Check your e-ticket under the Tickets tab.',
      category: 'Payment',
      time: '2 days ago',
      unread: false,
      icon: 'ticket-outline',
      iconBg: 'payment-bg'
    },
    {
      id: 5,
      title: 'Event schedule updated',
      description: 'Tech Summit Indonesia schedule has been updated. Open detail to see.',
      category: 'Events',
      time: '3 days ago',
      unread: false,
      icon: 'time-outline',
      iconBg: 'events-bg'
    }
  ];

  constructor() {
    addIcons({
      arrowBackOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      trashOutline,
      notificationsOutline,
      musicalNotesOutline,
      sparklesOutline,
      ticketOutline,
      timeOutline
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('joyvent_notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    } else {
      this.saveNotifications();
    }
  }

  saveNotifications() {
    localStorage.setItem('joyvent_notifications', JSON.stringify(this.notifications));
  }

  /* BACK NAVIGATION */
  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  /* FILTER TAB SWITCHER */
  setFilter(filter: string) {
    this.selectedFilter = filter;
  }

  /* FILTER LOGIC */
  getFilteredNotifications(): NotificationItem[] {
    if (this.selectedFilter === 'Unread') {
      return this.notifications.filter(n => n.unread);
    } else if (this.selectedFilter === 'Payment') {
      return this.notifications.filter(n => n.category === 'Payment');
    } else if (this.selectedFilter === 'Events') {
      return this.notifications.filter(n => n.category === 'Events');
    }
    return this.notifications;
  }

  /* ACTION: MARK ALL AS READ */
  markAllAsRead() {
    this.notifications.forEach(n => n.unread = false);
    this.saveNotifications();
  }

  /* ACTION: CLEAR ALL NOTIFICATIONS */
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
  }

  /* INTERACTION: TAP TO READ */
  markAsRead(notification: NotificationItem) {
    notification.unread = false;
    this.saveNotifications();
  }
}
