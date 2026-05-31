import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  heart,
  heartOutline,
  calendarOutline,
  locationOutline,
  funnelOutline,
  swapVerticalOutline,
  chevronDownOutline
} from 'ionicons/icons';
import { EventService, EventItem } from '../../services/event.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ]
})
export class ExplorePage implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private router = inject(Router);

  events: EventItem[] = [];
  filteredEvents: EventItem[] = [];
  searchText: string = '';
  selectedCategory: string = 'All';
  categories: string[] = ['All', 'Entertainment', 'Education', 'Sports', 'Business', 'Community'];
  
  priceFilters: string[] = ['All', 'Free', 'Paid'];
  selectedPrice: string = 'All';

  sortFilters: string[] = ['Popular', 'Newest', 'Lowest Price'];
  selectedSort: string = 'Popular';

  savedEventIds: string[] = [];
  private savedSubscription!: Subscription;

  constructor() {
    addIcons({
      searchOutline,
      heart,
      heartOutline,
      calendarOutline,
      locationOutline,
      funnelOutline,
      swapVerticalOutline,
      chevronDownOutline
    });
  }

  ngOnInit() {
    this.events = this.eventService.getEvents();
    
    // Subscribe to saved events to sync state instantly
    this.savedSubscription = this.eventService.savedEventIds$.subscribe(ids => {
      this.savedEventIds = ids;
    });

    this.filterAndSortEvents();
  }

  ngOnDestroy() {
    if (this.savedSubscription) {
      this.savedSubscription.unsubscribe();
    }
  }

  /* SEARCH & FILTER LOGIC */
  filterAndSortEvents() {
    // 1. Apply search and category filter and price filter
    let result = this.events.filter(event => {
      // Category filter
      const matchesCategory = this.selectedCategory === 'All' || event.category === this.selectedCategory;

      // Search filter (title, location, category)
      const q = this.searchText.toLowerCase().trim();
      const matchesSearch = !q ||
        event.title.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q) ||
        event.badge.toLowerCase().includes(q);

      // Price filter
      let matchesPrice = true;
      const priceVal = this.getEventPriceValue(event.price);
      if (this.selectedPrice === 'Free') {
        matchesPrice = priceVal === 0;
      } else if (this.selectedPrice === 'Paid') {
        matchesPrice = priceVal > 0;
      }

      return matchesCategory && matchesSearch && matchesPrice;
    });

    // 2. Apply sorting
    if (this.selectedSort === 'Popular') {
      result.sort((a, b) => this.getPopularityScore(b.id) - this.getPopularityScore(a.id));
    } else if (this.selectedSort === 'Newest') {
      result.sort((a, b) => this.getEventDateWeight(a.date) - this.getEventDateWeight(b.date));
    } else if (this.selectedSort === 'Lowest Price') {
      result.sort((a, b) => this.getEventPriceValue(a.price) - this.getEventPriceValue(b.price));
    }

    this.filteredEvents = result;
  }

  /* HELPERS */
  private getEventPriceValue(priceStr: string): number {
    if (priceStr.toLowerCase().includes('gratis') || priceStr.toLowerCase().includes('free')) {
      return 0;
    }
    const numStr = priceStr.replace(/[^0-9]/g, '');
    return parseInt(numStr) || 0;
  }

  private getEventDateWeight(dateStr: string): number {
    const lower = dateStr.toLowerCase();
    let day = 1;
    let month = 1;
    const parts = lower.split('•')[0].trim().split(' ');
    if (parts.length >= 2) {
      day = parseInt(parts[0]) || 1;
      const monthName = parts[1];
      if (monthName.includes('mei')) month = 5;
      else if (monthName.includes('jun')) month = 6;
      else if (monthName.includes('jul')) month = 7;
      else if (monthName.includes('agu')) month = 8;
    }
    return month * 100 + day; // Ascending order helper
  }

  private getPopularityScore(id: string): number {
    const scores: { [key: string]: number } = {
      'concert': 10,
      'jazz-festival': 9,
      'uiux-workshop': 8,
      'seminar': 7,
      'rock-fest': 6,
      'marketing-seminar': 5,
      'marathon': 4,
      'community-charity': 3
    };
    return scores[id] || 0;
  }

  /* ACTIONS */
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterAndSortEvents();
  }

  setPriceFilter(price: string) {
    this.selectedPrice = price;
    this.filterAndSortEvents();
  }

  setSortFilter(sort: string) {
    this.selectedSort = sort;
    this.filterAndSortEvents();
  }

  isSaved(id: string): boolean {
    return this.savedEventIds.includes(id);
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
}
