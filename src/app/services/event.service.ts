import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private http = inject(HttpClient);
  private readonly TOKEN_KEY = 'joyvent_auth_token';

  private savedEventIdsSubject = new BehaviorSubject<string[]>(this.loadSavedIds());
  savedEventIds$ = this.savedEventIdsSubject.asObservable();

  constructor() {}

  private loadSavedIds(): string[] {
    const ids = localStorage.getItem('saved_events');
    return ids ? JSON.parse(ids) : [];
  }

  getEvents(includeFinished: boolean = false): Observable<EventItem[]> {
    const url = includeFinished 
      ? `${environment.apiUrl}/events?include_finished=1` 
      : `${environment.apiUrl}/events`;
    return this.http.get<any>(url).pipe(
      map(res => {
        const rawEvents = res.data || [];
        return rawEvents.map((e: any) => this.mapEvent(e));
      })
    );
  }

  getEventById(id: string): Observable<EventItem> {
    return this.http.get<any>(`${environment.apiUrl}/events/${id}`).pipe(
      map(res => this.mapEvent(res.data))
    );
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

  /* HELPERS & DATA MAPPING */
  private mapEvent(e: any): EventItem {
    const mappedCategories = this.mapTicketCategories(e.ticket_categories);
    const total = mappedCategories.reduce((sum, cat) => sum + cat.total, 0);
    const sold = mappedCategories.reduce((sum, cat) => sum + cat.sold, 0);

    return {
      id: e.id.toString(),
      title: e.name,
      category: this.mapCategory(e.category),
      badge: e.category,
      image: e.banner_image || 'assets/images/HindiaConcert.jpg',
      price: this.formatPrice(e.ticket_categories),
      date: this.formatDate(e.start_date, e.start_time),
      location: e.location,
      description: e.description || '',
      hasSeatSelection: !!e.has_seat_layout,
      eventType: e.category ? e.category.toLowerCase() : 'concert',
      ticketCategories: mappedCategories,
      soldOut: (total - sold) === 0 && total > 0
    };
  }

  private mapCategory(cat: string): 'Entertainment' | 'Education' | 'Sports' | 'Business' | 'Community' {
    const validCategories: Array<'Entertainment' | 'Education' | 'Sports' | 'Business' | 'Community'> = [
      'Entertainment', 'Education', 'Sports', 'Business', 'Community'
    ];
    if (validCategories.includes(cat as any)) {
      return cat as any;
    }
    return 'Entertainment';
  }

  private formatPrice(categories: any[]): string {
    if (!categories || categories.length === 0) {
      return 'Free';
    }
    const prices = categories.map(cat => parseFloat(cat.price));
    const minPrice = Math.min(...prices);
    if (minPrice === 0) {
      return 'Free';
    }
    return `Rp.${minPrice.toLocaleString('id-ID')}`;
  }

  private formatDate(startDateStr: string, startTimeStr?: string): string {
    if (!startDateStr) return '';
    try {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const date = new Date(startDateStr);
      const day = date.getDate();
      const month = months[date.getMonth()];
      
      let timeStr = '';
      if (startTimeStr) {
        const parts = startTimeStr.split(':');
        if (parts.length >= 2) {
          timeStr = ` • ${parts[0]}.${parts[1]}`;
        }
      }
      return `${day} ${month}${timeStr}`;
    } catch (e) {
      return startDateStr;
    }
  }

  private mapTicketCategories(categories: any[]): TicketCategoryItem[] {
    if (!categories) return [];
    return categories.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      price: parseFloat(cat.price) || 0,
      total: cat.quota || 0,
      sold: Number(cat.sold) || 0,
      icon: cat.name.toLowerCase().includes('vip') ? 'star-outline' : 'ticket-outline'
    }));
  }

  getEventSeats(eventId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/events/${eventId}/seats`);
  }

  createRegistration(eventId: string, ticketCategoryId: string, seatId?: number, seatNumber?: string): Observable<any> {
    const payload: any = {
      event_id: Number(eventId),
      ticket_category_id: Number(ticketCategoryId)
    };
    if (seatId !== undefined && seatId !== null) {
      payload.seat_id = seatId;
    }
    if (seatNumber) {
      payload.seat_number = seatNumber;
    }
    return this.http.post<any>(`${environment.apiUrl}/registrations`, payload);
  }

  getRegistrations(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/registrations`).pipe(
      map(res => res.data || [])
    );
  }

  getRegistrationById(id: number | string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/registrations/${id}`).pipe(
      map(res => res.data)
    );
  }

  updateRegistrationStatus(registrationId: number | string, status: string): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/registrations/${registrationId}`, {
      status: status
    });
  }

  requestRefund(registrationId: number | string, reason: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/registrations/${registrationId}/refund`, {
      reason: reason
    });
  }
}

