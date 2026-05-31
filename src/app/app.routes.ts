import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [

  /* DEFAULT */

  {
    path: '',

    redirectTo: 'splash',

    pathMatch: 'full'
  },

  /* SPLASH & AUTH */

  {
    path: 'splash',
    loadComponent: () =>
      import('./pages/splash/splash.page').then(
        m => m.SplashPage
      )
  },

  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then(
        m => m.LoginPage
      )
  },

  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/register/register.page').then(
        m => m.RegisterPage
      )
  },

  /* TABS */

  {
    path: 'tabs',
    canActivate: [authGuard],

    loadComponent: () =>
      import('./tabs/tabs.page').then(
        m => m.TabsPage
      ),

    children: [

      /* HOME */

      {
        path: 'home',

        loadComponent: () =>
          import('./pages/home/home.page').then(
            m => m.HomePage
          )
      },

      /* EXPLORE */

      {
        path: 'explore',

        loadComponent: () =>
          import('./pages/explore/explore.page').then(
            m => m.ExplorePage
          )
      },

      /* TICKETS */

      {
        path: 'tickets',

        loadComponent: () =>
          import('./pages/my-tickets/my-tickets.page').then(
            m => m.MyTicketsPage
          )
      },

      /* SAVED */

      {
        path: 'saved',

        loadComponent: () =>
          import('./pages/saved/saved.page').then(
            m => m.SavedPage
          )
      },

      /* PROFILE */

      {
        path: 'profile',

        loadComponent: () =>
          import('./pages/profile/profile.page').then(
            m => m.ProfilePage
          )
      }

    ]

  },

  /* OTHER PROTECTED PAGES */

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'booking',
        loadComponent: () =>
          import('./pages/booking/booking.page').then(
            m => m.BookingPage
          )
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('./pages/edit-profile/edit-profile.page').then(
            m => m.EditProfilePage
          )
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.page').then(
            m => m.NotificationsPage
          )
      },
      {
        path: 'detail-event',
        loadComponent: () =>
          import('./pages/detail-event/detail-event.page').then(
            m => m.DetailEventPage
          )
      },
      {
        path: 'ticket',
        loadComponent: () =>
          import('./pages/ticket/ticket.page').then(
            m => m.TicketPage
          )
      },
      {
        path: 'ticket-success',
        loadComponent: () =>
          import('./pages/ticket-success/ticket-success.page').then(
            m => m.TicketSuccessPage
          )
      },
      {
        path: 'payment-instruction',
        loadComponent: () =>
          import('./pages/payment-instruction/payment-instruction.page').then(
            m => m.PaymentInstructionPage
          )
      },
      {
        path: 'explore',
        loadComponent: () => import('./pages/explore/explore.page').then( m => m.ExplorePage)
      },
      {
        path: 'saved',
        loadComponent: () => import('./pages/saved/saved.page').then( m => m.SavedPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
      },
      {
        path: 'certificates',
        loadComponent: () =>
          import('./pages/certificates/certificates.page').then(
            m => m.CertificatesPage
          )
      },
      {
        path: 'certificate-detail',
        loadComponent: () =>
          import('./pages/certificate-detail/certificate-detail.page').then(
            m => m.CertificateDetailPage
          )
      },
      {
        path: 'help-support',
        loadComponent: () =>
          import('./pages/help-support/help-support.page').then(
            m => m.HelpSupportPage
          )
      },
      {
        path: 'about-app',
        loadComponent: () =>
          import('./pages/about-app/about-app.page').then(
            m => m.AboutAppPage
          )
      }
    ]
  }
];