// src/app/pages/home.page.ts
import { Component } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  imports: [ButtonModule],
  template: `
    <h1>Welcome to Domain Locker</h1>
    <p>Manage your domains with ease.</p>
    <p-button label="Warning" severity="warning" />
    <a href="/about">About</a>
    <!-- Add more content, perhaps some summary charts or quick actions -->
  `,
})
export default class HomePageComponent {}
