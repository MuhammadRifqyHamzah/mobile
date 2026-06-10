import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

import {
  IonContent,
  IonIcon,
  NavController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    FormsModule
  ]

})
export class RegisterPage {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  fullName = '';
  email = '';
  password = '';
  showPassword = false;

  constructor() {

    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });

  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  signUp() {
    this.profileService.loadProfileForUser(this.email || 'user@joyvent.com', {
      name: this.fullName || 'User JoyVent'
    });
    this.authService.login(); // Auto-login on sign up
    this.navCtrl.navigateRoot('/tabs/home');
  }

}