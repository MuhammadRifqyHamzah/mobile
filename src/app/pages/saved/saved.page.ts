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
  arrowBackOutline
} from 'ionicons/icons';
import { EventService, EventItem } from '../../services/event.service';

@Component({
  selector: 'app-saved',
  templateUrl: './saved.page.html',
  styleUrls: ['./saved.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonRippleEffect, CommonModule, FormsModule]
})
export class SavedPage implements OnInit, OnDestroy {
  private eventService = inject(EventService);
  private router = inject(Router);

  savedEvents: EventItem[] = [];
  filteredEvents: EventItem[] = [];
  searchText: string = '';
  selectedCategory: string = 'All';
  categories: string[] = ['All', 'Entertainment', 'Education', 'Sports', 'Business', 'Community'];
  
  private subscription!: Subscription;

  constructor() {
    addIcons({
      searchOutline,
      heart,
      heartOutline,
      calendarOutline,
      locationOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.subscription = this.eventService.getEvents().subscribe({
      next: (allEvents) => {
        const sub = this.eventService.savedEventIds$.subscribe(savedIds => {
          this.savedEvents = allEvents.filter(event => savedIds.includes(event.id));
          this.filterEvents();
        });
        this.subscription.add(sub);
      },
      error: (err) => {
        console.error('Error fetching events in Saved:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  filterEvents() {
    this.filteredEvents = this.savedEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
                            event.location.toLowerCase().includes(this.searchText.toLowerCase()) ||
                            event.badge.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesCategory = this.selectedCategory === 'All' || event.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange() {
    this.filterEvents();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterEvents();
  }

  toggleSave(event: Event, id: string) {
    event.stopPropagation();
    this.eventService.toggleSave(id);
  }

  goToDetail(id: string) {
    this.router.navigate(['/detail-event'], {
      queryParams: { type: id }
    });
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }
}
