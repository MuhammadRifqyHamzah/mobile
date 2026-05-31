import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonIcon,
    RouterLink
  ]

})
export class RegisterPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {

    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline
    });

  }

  signUp() {
    this.authService.login(); // Auto-login on sign up
    this.router.navigate(['/tabs/home']);
  }

}