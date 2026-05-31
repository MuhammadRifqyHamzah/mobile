import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TicketCategoryItem {
  id: string;
  name: string;
  price: number;
  total: number;
  sold: number;
  icon: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Entertainment' | 'Education' | 'Sports' | 'Business' | 'Community';
  badge: string;
  image: string;
  price: string;
  date: string;
  location: string;
  description: string;
  hasSeatSelection: boolean;
  eventType: string;
  ticketCategories: TicketCategoryItem[];
  soldOut?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private events: EventItem[] = [
    {
      id: 'concert',
      title: 'Hindia Pop Music Concert',
      category: 'Entertainment',
      badge: 'Entertainment',
      image: 'assets/images/HindiaConcert.jpg',
      price: 'Rp.300.000',
      date: '28 Mei • 19.00',
      location: 'Jakarta',
      description: 'Hindia Pop Music Concert menampilkan salah satu musisi paling berpengaruh di Indonesia, dikenal lewat lirik jujur dan storytelling emosional. Dengan konsep panggung unik dan atmosfer imersif, konser ini menghadirkan pengalaman bermakna melalui lagu-lagu populernya.',
      hasSeatSelection: true,
      eventType: 'concert',
      ticketCategories: [
        { id: 'vip', name: 'VIP PASS', price: 300000, total: 30, sold: 22, icon: 'star-outline' },
        { id: 'regular', name: 'REGULAR PASS', price: 150000, total: 70, sold: 47, icon: 'ticket-outline' }
      ]
    },
    {
      id: 'seminar',
      title: 'Digital Business Seminar 2026',
      category: 'Education',
      badge: 'Education',
      image: 'assets/images/TechSeminar.png',
      price: 'Rp.150.000',
      date: '15 Juni • 09.00',
      location: 'Bandung',
      description: 'Digital Business Seminar 2026 adalah seminar intensif untuk mempelajari strategi bisnis digital modern, e-commerce, content marketing, dan pertumbuhan bisnis berkelanjutan bersama praktisi berpengaruh.',
      hasSeatSelection: false,
      eventType: 'seminar',
      ticketCategories: [
        { id: 'seminar-pass', name: 'Seminar Pass', price: 150000, total: 200, sold: 120, icon: 'ticket-outline' }
      ]
    },
    {
      id: 'tech-future',
      title: 'Tech Future Conference 2026',
      category: 'Education',
      badge: 'Education',
      image: 'assets/images/tech_conference.png',
      price: 'Rp.250.000',
      date: '20 Juli • 13.00',
      location: 'Surabaya',
      description: 'Tech Future Conference 2026 adalah konferensi teknologi tahunan yang menghadirkan para ahli industri untuk membahas tren kecerdasan buatan, web3, dan masa depan teknologi informasi.',
      hasSeatSelection: false,
      eventType: 'seminar',
      ticketCategories: [
        { id: 'vip', name: 'VIP Pass', price: 500000, total: 30, sold: 30, icon: 'star-outline' },
        { id: 'regular', name: 'Regular Pass', price: 250000, total: 70, sold: 70, icon: 'ticket-outline' }
      ]
    }
  ];

  private savedEventIdsSubject = new BehaviorSubject<string[]>(this.loadSavedIds());
  savedEventIds$ = this.savedEventIdsSubject.asObservable();

  constructor() {}

  private loadSavedIds(): string[] {
    const ids = localStorage.getItem('saved_events');
    return ids ? JSON.parse(ids) : [];
  }

  getEvents(): EventItem[] {
    return this.events.map(event => {
      const total = event.ticketCategories.reduce((sum, cat) => sum + cat.total, 0);
      const sold = event.ticketCategories.reduce((sum, cat) => sum + cat.sold, 0);
      return {
        ...event,
        soldOut: (total - sold) === 0
      };
    });
  }

  getEventById(id: string): EventItem | undefined {
    const event = this.events.find(e => e.id === id);
    if (!event) return undefined;
    const total = event.ticketCategories.reduce((sum, cat) => sum + cat.total, 0);
    const sold = event.ticketCategories.reduce((sum, cat) => sum + cat.sold, 0);
    return {
      ...event,
      soldOut: (total - sold) === 0
    };
  }

  getSavedEventIds(): string[] {
    return this.savedEventIdsSubject.value;
  }

  isSaved(id: string): boolean {
    return this.getSavedEventIds().includes(id);
  }

  toggleSave(id: string): void {
    const current = this.getSavedEventIds();
    let updated: string[];
    if (current.includes(id)) {
      updated = current.filter(itemId => itemId !== id);
    } else {
      updated = [...current, id];
    }
    localStorage.setItem('saved_events', JSON.stringify(updated));
    this.savedEventIdsSubject.next(updated);
  }
}
