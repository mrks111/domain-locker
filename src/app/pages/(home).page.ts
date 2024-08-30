// src/app/pages/home.page.ts
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <h1>Welcome to Domain Locker</h1>
    <p>Manage your domains with ease.</p>
    <a href="/about">About</a>
    <!-- Add more content, perhaps some summary charts or quick actions -->
  `,
})
export default class HomePageComponent {}
