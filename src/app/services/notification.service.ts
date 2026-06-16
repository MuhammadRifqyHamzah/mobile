import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationItem {
  id: number;
  source_key: string;
  user_id: number;
  event_id: number | null;
  title: string;
  message: string | null;
  type: 'payment' | 'refund' | 'event' | 'certificate' | 'lucky_draw' | 'system';
  action_url: string | null;
  data: any | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<any>(`${environment.apiUrl}/notifications`).pipe(
      map(res => res.data || [])
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<any>(`${environment.apiUrl}/notifications/unread-count`).pipe(
      map(res => res.count || 0)
    );
  }

  getNotificationById(id: number): Observable<NotificationItem> {
    return this.http.get<any>(`${environment.apiUrl}/notifications/${id}`).pipe(
      map(res => res.data)
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/notifications/read-all`, {});
  }

  clearAll(): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/notifications/clear-all`);
  }
}
