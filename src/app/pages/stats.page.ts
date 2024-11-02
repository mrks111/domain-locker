import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PrimeNgModule } from '../prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { statsLinks } from '@/app/constants/navigation-links';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule],
  selector: 'stats-index-page',
  templateUrl: './stats/index.page.html',
  styles: ['::ng-deep .content-container { max-width: 1600px; }']
})
export default class StatsIndexPage implements OnInit, OnDestroy {
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
    this.items = statsLinks;

    // Toggle sidebar based on the URL route
    this.hideSideBar = this.router.url === '/stats';
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.hideSideBar = event.urlAfterRedirects === '/stats';
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    // Set up ResizeObserver to monitor the sidebar width
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect.width < 150) {
          this.hideTextLabels = true;
        } else {
          this.hideTextLabels = false;
        }
        this.cdr.detectChanges(); // Trigger change detection for hideTextLabels
      }
    });
    if (this.sidebarNav) {
      this.resizeObserver.observe(this.sidebarNav.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.resizeObserver && this.sidebarNav) {
      this.resizeObserver.unobserve(this.sidebarNav.nativeElement);
      this.resizeObserver.disconnect();
    }
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }
}
