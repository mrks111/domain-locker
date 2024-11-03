import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PrimeNgModule } from '../prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { settingsLinks } from '@/app/constants/navigation-links';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule],
  templateUrl: './settings/index.page.html',
  // styles: ['::ng-deep .content-container { max-width: 1600px; }']
})
export default class SettingsIndexPage implements OnInit {
  items: MenuItem[] | undefined;
  hideSideBar = false;
  @ViewChild('sidebarNav', { static: false }) sidebarNav!: ElementRef;
  hideTextLabels = false;
  private resizeObserver!: ResizeObserver;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.items = settingsLinks;
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }
}
