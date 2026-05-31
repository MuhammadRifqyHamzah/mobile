import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  mailOutline,
  lockClosedOutline,
  eyeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ]

})
export class LoginPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {

    addIcons({
      mailOutline,
      lockClosedOutline,
      eyeOutline
    });

  }

  login() {
    this.authService.login();
    this.router.navigate(['/tabs/home']);
  }

}