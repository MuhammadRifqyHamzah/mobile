import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

import {
  IonContent,
  IonIcon,
  NavController,
  ToastController
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
  private toastController = inject(ToastController);

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

  async signUp() {
    if (!this.fullName || !this.email || !this.password) {
      const toast = await this.toastController.create({
        message: 'Semua field wajib diisi!',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    if (this.password.length < 6) {
      const toast = await this.toastController.create({
        message: 'Password minimal 6 karakter!',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.authService.register({
      name: this.fullName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: async (res) => {
        this.profileService.loadProfileForUser(res.user.email, {
          name: res.user.name,
          avatar: res.user.profile_photo || ''
        });
        
        const toast = await this.toastController.create({
          message: 'Registrasi sukses!',
          duration: 1500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();

        this.navCtrl.navigateRoot('/tabs/home');
      },
      error: async (err) => {
        console.error('Register error:', err);
        let errMsg = 'Registrasi gagal. Silakan coba lagi.';
        if (err && err.error) {
          if (err.error.errors) {
            const errorKeys = Object.keys(err.error.errors);
            if (errorKeys.length > 0) {
              errMsg = err.error.errors[errorKeys[0]][0];
            }
          } else if (err.error.message) {
            errMsg = err.error.message;
          }
        }

        const toast = await this.toastController.create({
          message: errMsg,
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

}