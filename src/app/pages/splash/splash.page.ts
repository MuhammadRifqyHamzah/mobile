import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent]
})
export class SplashPage implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/tabs/home']);
      } else {
        this.router.navigate(['/login']);
      }
    }, 1500);
  }
}
