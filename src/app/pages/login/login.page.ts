import { Component, inject, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

import {
  IonContent,
  IonIcon,
  NavController,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    RouterLink,
    FormsModule
  ]

})
export class LoginPage {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private ngZone = inject(NgZone);
  private toastController = inject(ToastController);

  email = '';
  password = '';
  showPassword = false;

  constructor() {

    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });

  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!this.email || !this.password) {
      const toast = await this.toastController.create({
        message: 'Email dan password tidak boleh kosong!',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    if (!emailRegex.test(this.email)) {
      const toast = await this.toastController.create({
        message: 'Format email tidak valid!',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Jika valid, lakukan login
    this.profileService.loadProfileForUser(this.email);
    this.authService.login();
    this.navCtrl.navigateRoot('/tabs/home');
  }

  async loginWithGoogle() {
    try {
      // Inisialisasi GoogleAuth (sangat disarankan untuk platform web/testing)
      await GoogleAuth.initialize({
        clientId: '1046359789271-uv3c0lmtp77tq29st4bng4kovt1b4urf.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (e) {
      // Ignore if already initialized
    }

    try {
      try {
        await GoogleAuth.signOut();
      } catch (e) {
        // ignore error if not logged in
      }
      const googleUser = await GoogleAuth.signIn();
      console.log('Google User:', googleUser);
      
      // Token ini yang akan dikirim ke backend Anda untuk diverifikasi
      const idToken = googleUser.authentication.idToken;
      console.log('ID Token:', idToken);

      // Simulasikan login sukses di dalam Angular Zone agar UI/routing terupdate
      this.ngZone.run(() => {
        // Update profil user dengan data asli dari Google
        this.profileService.loadProfileForUser(googleUser.email, {
          name: googleUser.name || `${googleUser.givenName} ${googleUser.familyName}`,
          avatar: googleUser.imageUrl || ''
        });
        
        this.authService.login();
        this.navCtrl.navigateRoot('/tabs/home');
      });
    } catch (error) {
      console.error('Google Sign In Error:', error);
    }
  }

}