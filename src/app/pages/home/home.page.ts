import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  notificationsOutline,
  heartOutline,
  heart,
  locationOutline
} from 'ionicons/icons';
import { EventService, EventItem } from '../../services/event.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private router = inject(Router);
  private eventService = inject(EventService);
  private profileService = inject(ProfileService);

  events: EventItem[] = [];
  userAvatar = '';
  userName = '';
  userLocation = '';
  searchQuery = '';
  selectedCategory = 'All';
  categories = ['All', 'Entertainment', 'Education', 'Sports', 'Business', 'Community'];
  unreadNotificationsCount = 0;
  
  private profileSubscription!: Subscription;

  constructor() {
    addIcons({
      searchOutline,
      notificationsOutline,
      heartOutline,
      heart,
      locationOutline
    });
  }

  ngOnInit() {
    this.events = this.eventService.getEvents();
    this.profileSubscription = this.profileService.profile$.subscribe(profile => {
      this.userAvatar = profile.avatar;
      this.userName = this.getFirstName(profile.fullName);
      this.userLocation = profile.location;
    });
  }

  ionViewWillEnter() {
    this.loadUnreadCount();
  }

  loadUnreadCount() {
    const saved = localStorage.getItem('joyvent_notifications');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        this.unreadNotificationsCount = list.filter((n: any) => n.unread).length;
      } catch (e) {
        console.error('Error parsing notifications for count:', e);
        this.unreadNotificationsCount = 0;
      }
    } else {
      this.unreadNotificationsCount = 2; // Default mock unread count
    }
  }

  ngOnDestroy() {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  getFirstName(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(' ')[0];
  }

  /* CATEGORY SELECTION */
  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  /* REALTIME FILTER LOGIC */
  getFilteredEvents(): EventItem[] {
    return this.events.filter(event => {
      // Filter by category
      const matchesCategory = this.selectedCategory === 'All' || event.category === this.selectedCategory;

      // Filter by search query (name, location, category)
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }


  isSaved(id: string): boolean {
    return this.eventService.isSaved(id);
  }

  toggleSave(event: Event, id: string) {
    event.stopPropagation();
    this.eventService.toggleSave(id);
  }

  goToDetail(eventId: string) {
    this.router.navigate(
      ['/detail-event'],
      {
        queryParams: {
          type: eventId
        }
      }
    );
  }

  goToNotifications() {
    this.router.navigate(['/notifications']);
  }
}