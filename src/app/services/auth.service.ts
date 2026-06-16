import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly TOKEN_KEY = 'joyvent_auth_token';
  private loginSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$: Observable<boolean> = this.loginSubject.asObservable();

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/register`, data).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loginSubject.next(true);
        }
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loginSubject.next(true);
        }
      })
    );
  }

  googleLogin(data: { name: string; email: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/google-login`, data).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loginSubject.next(true);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/logout`, {}).pipe(
      tap({
        next: () => this.clearLocalAuth(),
        error: () => this.clearLocalAuth()
      })
    );
  }

  private clearLocalAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.loginSubject.next(false);
  }

  getUser(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/user`);
  }

  setMockSession(): void {
    localStorage.setItem(this.TOKEN_KEY, 'mock-joyvent-token-12345');
    this.loginSubject.next(true);
  }
}
