import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '../prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { statsLinks } from '@/app/constants/navigation-links';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule],
  selector: 'stats-index-page',
  templateUrl: './stats/index.page.html',
  styles: ['']
})
export default class StatsIndexPage implements OnInit {
  items: MenuItem[] | undefined;
  constructor() {}

  ngOnInit() {
    this.items = statsLinks;
  }
}

