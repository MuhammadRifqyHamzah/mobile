import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private readonly STORAGE_KEY = 'joyvent_user_profile';

  private readonly defaultProfile: UserProfile = {
    fullName: 'Ficar Aliansyah',
    email: 'ficar.aliansyah@joyvent.com',
    phone: '081234567890',
    location: 'Purwasari, Karawang',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  };

  private profileSubject = new BehaviorSubject<UserProfile>(this.loadProfileFromStorage());
  profile$: Observable<UserProfile> = this.profileSubject.asObservable();

  constructor() {}

  private loadProfileFromStorage(): UserProfile {
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    this.profileSubject.next(updated);
  }
}
