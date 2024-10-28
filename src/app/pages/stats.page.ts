import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
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
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.items = statsLinks;
  }

  isActive(link: string): boolean {
    const current = this.router.url;
    if (current === link) {
      return true;
    }
    return false;
  }
}

