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
  ToastController,
  AlertController
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
  private alertController = inject(AlertController);

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
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: async (res) => {
        // Hubungkan profil user dengan data yang dikembalikan oleh backend Laravel
        this.profileService.loadProfileForUser(res.user.email, {
          name: res.user.name,
          avatar: res.user.profile_photo || ''
        });
        this.profileService.updateProfile({
          phone: res.user.phone || '',
          location: ''
        });

        const toast = await this.toastController.create({
          message: 'Login sukses!',
          duration: 1500,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();

        this.navCtrl.navigateRoot('/tabs/home');
      },
      error: async (err) => {
        console.error('Login error:', err);
        let errMsg = 'Email atau password salah!';
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

  async loginWithGoogle() {
    try {
      // Inisialisasi GoogleAuth (sangat disarankan untuk platform web/testing)
      await GoogleAuth.initialize({
        clientId: '1046359789271-uv3c0lmtp77tq29st4bng4kovt1b4urf.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (e: any) {
      console.warn('GoogleAuth initialize warning/error:', e);
      console.log('Initialize Error details:', JSON.stringify(e));
    }

    try {
      try {
        await GoogleAuth.signOut();
      } catch (e: any) {
        console.warn('GoogleAuth signOut warning/error:', e);
        console.log('SignOut Error details:', JSON.stringify(e));
      }
      
      console.log('Starting Google Sign In...');
      const googleUser = await GoogleAuth.signIn();
      console.log('Google User Full Response:', googleUser);
      console.log('Google User JSON:', JSON.stringify(googleUser, null, 2));
      
      console.log('Authentication Object:', googleUser?.authentication);
      const idToken = googleUser?.authentication?.idToken;
      console.log('ID Token:', idToken);

      console.log('About to call Laravel Google Login API');
      const name = googleUser.name || `${googleUser.givenName} ${googleUser.familyName}`;
      const email = googleUser.email;

      this.authService.googleLogin({ name, email }).subscribe({
        next: (res) => {
          this.ngZone.run(async () => {
            // Update profil user dengan data yang dikembalikan oleh backend
            this.profileService.loadProfileForUser(res.user.email, {
              name: res.user.name,
              avatar: res.user.profile_photo || googleUser.imageUrl || ''
            });
            this.profileService.updateProfile({
              phone: res.user.phone || '',
              location: ''
            });

            const toast = await this.toastController.create({
              message: 'Google login sukses!',
              duration: 1500,
              position: 'bottom',
              color: 'success'
            });
            await toast.present();

            this.navCtrl.navigateRoot('/tabs/home');
          });
        },
        error: (err) => {
          this.ngZone.run(async () => {
            console.error('Google Login Error:', err);
            
            let errMsg = 'Google Login gagal menghubungkan ke server!';
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
              duration: 5000,
              position: 'bottom',
              color: 'danger'
            });
            await toast.present();
          });
        }
      });
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      console.log('Google Sign In Error Details:', {
        message: error?.message,
        code: error?.code,
        stringified: JSON.stringify(error),
        stack: error?.stack
      });

      // Tampilkan Alert
      const alert = await this.alertController.create({
        header: 'Google Sign In Error',
        subHeader: error?.message || 'Unknown Error',
        message: `Code: ${error?.code || 'None'}\n\nJSON: ${JSON.stringify(error)}\n\nStack: ${error?.stack || 'None'}`,
        buttons: ['OK']
      });
      await alert.present();

      // Tampilkan Toast
      const toast = await this.toastController.create({
        message: `Error: ${error?.message || 'Google Auth Failed'} (Code: ${error?.code || 'N/A'})`,
        duration: 5000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

}