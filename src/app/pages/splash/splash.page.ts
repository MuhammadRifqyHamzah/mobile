import { Component, OnInit, inject } from '@angular/core';
import { IonContent, NavController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent]
})
export class SplashPage implements OnInit {
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);

  ngOnInit() {
    setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.navCtrl.navigateRoot('/tabs/home');
      } else {
        this.navCtrl.navigateRoot('/login');
      }
    }, 1500);
  }
}
