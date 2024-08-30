import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-not-found-page',
  template: `
    <div style="text-align: center; margin-top: 50px;">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a routerLink="/">Go to Home</a>
    </div>
  `,
})
export default class NotFoundPageComponent {}
