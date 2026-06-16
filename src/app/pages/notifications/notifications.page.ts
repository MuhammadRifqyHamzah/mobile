import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonRippleEffect, IonRefresher, IonRefresherContent, IonSpinner } from '@ionic/angular/standalone';
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
  timeOutline,
  cardOutline,
  arrowUndoOutline,
  ribbonOutline,
  trophyOutline,
  calendarOutline
} from 'ionicons/icons';
import { NotificationService, NotificationItem } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonRippleEffect,
    IonRefresher,
    IonRefresherContent,
    IonSpinner
  ],
})
export class NotificationsPage implements OnInit {
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  selectedFilter = 'All';
  notifications: NotificationItem[] = [];
  isLoading = false;

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
      timeOutline,
      cardOutline,
      arrowUndoOutline,
      ribbonOutline,
      trophyOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications(event?: any) {
    if (!event) {
      this.isLoading = true;
    }
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  doRefresh(event: any) {
    this.loadNotifications(event);
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
      return this.notifications.filter(n => !n.is_read);
    } else if (this.selectedFilter === 'Payment') {
      return this.notifications.filter(n => n.type === 'payment' || n.type === 'refund');
    } else if (this.selectedFilter === 'Events') {
      return this.notifications.filter(n => n.type === 'event' || n.type === 'certificate' || n.type === 'lucky_draw');
    }
    return this.notifications;
  }

  /* ACTION: MARK ALL AS READ */
  markAllAsRead() {
    this.notifications.forEach(n => n.is_read = true);
    this.notificationService.markAllAsRead().subscribe({
      error: (err) => console.error('Error marking all read on server:', err)
    });
  }

  /* ACTION: CLEAR ALL NOTIFICATIONS */
  clearAll() {
    this.notifications = [];
    this.notificationService.clearAll().subscribe({
      error: (err) => console.error('Error clearing notifications on server:', err)
    });
  }

  /* INTERACTION: TAP TO READ & REDIRECT */
  handleNotificationClick(notification: NotificationItem) {
    if (!notification.is_read) {
      notification.is_read = true; // Optimistic update
      this.notificationService.markAsRead(notification.id).subscribe({
        error: (err) => console.error('Failed to mark read on server:', err)
      });
    }

    if (notification.action_url) {
      const parts = notification.action_url.split('?');
      const path = '/' + parts[0];
      const queryParams: any = {};
      if (parts.length > 1) {
        const pairs = parts[1].split('&');
        for (const pair of pairs) {
          const [key, val] = pair.split('=');
          queryParams[key] = val;
        }
      }
      this.router.navigate([path], { queryParams });
    }
  }

  /* HELPER: GET ICON BY TYPE */
  getIcon(type: string): string {
    switch (type) {
      case 'payment': return 'card-outline';
      case 'refund': return 'arrow-undo-outline';
      case 'event': return 'calendar-outline';
      case 'certificate': return 'ribbon-outline';
      case 'lucky_draw': return 'trophy-outline';
      default: return 'notifications-outline';
    }
  }

  /* HELPER: GET ICON BACKGROUND CLASS BY TYPE */
  getIconBg(type: string): string {
    switch (type) {
      case 'payment':
      case 'refund':
        return 'payment-bg';
      default:
        return 'events-bg';
    }
  }

  /* HELPER: GET RELATIVE TIME FROM DATE STRING */
  getRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const now = new Date();
      // Replace space with T to handle raw MySQL strings correctly
      const date = new Date(dateStr.replace(' ', 'T'));
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (isNaN(seconds)) return '';
      if (seconds < 5) return 'Just now';
      if (seconds < 60) return `${seconds}s ago`;

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;

      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  }
}
