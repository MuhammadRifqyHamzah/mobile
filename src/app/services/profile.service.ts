import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'joyvent_user_profile';

  private readonly defaultProfile: UserProfile = {
    fullName: 'User JoyVent',
    email: 'user@joyvent.com',
    phone: '',
    location: '',
    avatar: ''
  };

  private profileSubject = new BehaviorSubject<UserProfile>(this.loadProfileFromStorage());
  profile$: Observable<UserProfile> = this.profileSubject.asObservable();

  constructor() {}

  fetchProfile(): Observable<UserProfile> {
    return this.http.get<any>(`${environment.apiUrl}/user`).pipe(
      map(user => {
        const profile: UserProfile = {
          fullName: user.name,
          email: user.email,
          phone: user.phone || '',
          location: '',
          avatar: user.profile_photo || ''
        };
        localStorage.setItem('joyvent_active_email', user.email);
        localStorage.setItem(`joyvent_user_profile_${user.email}`, JSON.stringify(profile));
        this.profileSubject.next(profile);
        return profile;
      })
    );
  }

  private loadProfileFromStorage(): UserProfile {
    const activeEmail = localStorage.getItem('joyvent_active_email');
    if (activeEmail) {
      const storedData = localStorage.getItem(`joyvent_user_profile_${activeEmail}`);
      if (storedData) {
        try {
          return JSON.parse(storedData);
        } catch (e) {
          console.error('Error parsing stored profile data', e);
        }
      }
    }
    // Fallback if no active email or no stored data
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Error parsing stored profile data', e);
      }
    }
    return { ...this.defaultProfile };
  }

  getProfile(): UserProfile {
    return this.profileSubject.value;
  }

  updateProfile(profile: Partial<UserProfile>) {
    const current = this.profileSubject.value;
    const updated = { ...current, ...profile };
    const activeEmail = localStorage.getItem('joyvent_active_email');
    if (activeEmail) {
      localStorage.setItem(`joyvent_user_profile_${activeEmail}`, JSON.stringify(updated));
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
    this.profileSubject.next(updated);
  }

  clearProfile() {
    localStorage.removeItem('joyvent_active_email');
    this.profileSubject.next({ ...this.defaultProfile });
  }

  // Load or initialize user-specific profile
  loadProfileForUser(email: string, googleData?: { name?: string; avatar?: string }) {
    localStorage.setItem('joyvent_active_email', email);
    const key = `joyvent_user_profile_${email}`;
    const storedData = localStorage.getItem(key);
    if (storedData) {
      try {
        const profile = JSON.parse(storedData);
        if (googleData) {
          profile.fullName = googleData.name || profile.fullName;
          profile.avatar = googleData.avatar || profile.avatar;
          localStorage.setItem(key, JSON.stringify(profile));
        }
        this.profileSubject.next(profile);
      } catch (e) {
        console.error('Error parsing user profile data', e);
      }
    } else {
      const newProfile: UserProfile = {
        fullName: (googleData && googleData.name) || email.split('@')[0],
        email: email,
        phone: '',
        location: '',
        avatar: (googleData && googleData.avatar) || ''
      };
      localStorage.setItem(key, JSON.stringify(newProfile));
      this.profileSubject.next(newProfile);
    }
  }
}
