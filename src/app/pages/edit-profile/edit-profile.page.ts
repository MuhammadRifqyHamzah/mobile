import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  personOutline,
  mailOutline,
  callOutline,
  locationOutline,
  checkmarkCircle,
  lockClosedOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonRippleEffect
  ],
})
export class EditProfilePage implements OnInit {
  private router = inject(Router);
  private profileService = inject(ProfileService);

  fullName = '';
  email = '';
  phone = '';
  location = '';
  avatar = '';

  /* SAVE NOTIFICATION */
  savedSuccess = false;

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      personOutline,
      mailOutline,
      callOutline,
      locationOutline,
      checkmarkCircle,
      lockClosedOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    const profile = this.profileService.getProfile();
    this.fullName = profile.fullName;
    this.email = profile.email;
    this.phone = profile.phone;
    this.location = profile.location;
    this.avatar = profile.avatar;
  }

  /* BACK TO PROFILE PAGE */
  goBack() {
    this.router.navigate(['/tabs/profile']);
  }

  /* SAVE CHANGES HANDLER */
  saveChanges() {
    if (
      this.fullName.trim() === '' ||
      this.email.trim() === '' ||
      this.phone.trim() === '' ||
      this.location.trim() === ''
    ) {
      alert('Tolong lengkapi semua field terlebih dahulu.');
      return;
    }

    // Save updates in ProfileService which persists to localStorage
    this.profileService.updateProfile({
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      location: this.location
    });

    // Trigger success notification
    this.savedSuccess = true;

    // Wait 1.5 seconds and go back to profile
    setTimeout(() => {
      this.savedSuccess = false;
      this.goBack();
    }, 1500);
  }

  /* CHANGE PASSWORD ACTION */
  changePassword() {
    alert('Buka dialog ubah password (fitur simulasi).');
  }
}
