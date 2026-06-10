import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, Platform, NavController, AlertController } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet!: IonRouterOutlet;

  private platform = inject(Platform);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private alertController = inject(AlertController);

  private isAlertOpen = false;

  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {
      // Initialize Google Auth globally to prevent uninitialized crash on signOut/signIn
      try {
        await GoogleAuth.initialize({
          clientId: '1046359789271-uv3c0lmtp77tq29st4bng4kovt1b4urf.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      } catch (e) {
        console.log('GoogleAuth already initialized or failed on start:', e);
      }

      this.platform.backButton.subscribeWithPriority(10, () => {
        const url = this.router.url;

        // If we are on other tab pages (Explore, Saved, Profile, My Tickets), go back to Home tab first
        if (url.startsWith('/tabs/') && url !== '/tabs/home') {
          this.navCtrl.navigateRoot('/tabs/home');
          return;
        }

        // If we are on root pages OR we can't go back further, show exit confirmation dialog
        if (
          !this.routerOutlet ||
          !this.routerOutlet.canGoBack() ||
          url === '/login' ||
          url === '/register' ||
          url === '/splash' ||
          url === '/tabs/home'
        ) {
          this.showExitConfirm();
        } else {
          // Otherwise pop the current page from stack (go back)
          this.routerOutlet.pop();
        }
      });
    });
  }

  async showExitConfirm() {
    if (this.isAlertOpen) return;

    this.isAlertOpen = true;
    const alert = await this.alertController.create({
      header: 'Keluar Aplikasi',
      message: 'Apakah Anda yakin ingin keluar dari JoyVent?',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            this.isAlertOpen = false;
          }
        },
        {
          text: 'Keluar',
          handler: () => {
            this.isAlertOpen = false;
            App.exitApp();
          }
        }
      ]
    });

    await alert.present();
  }
}
