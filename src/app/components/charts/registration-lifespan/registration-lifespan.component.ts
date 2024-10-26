import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@services/database.service';
import { Router } from '@angular/router';

interface Domain {
  id: number;
  name: string;
  start: Date;
  end: Date;
}

@Component({
  standalone: true,
  selector: 'app-domain-gantt-chart',
  templateUrl: './registration-lifespan.component.html',
  styleUrls: ['./registration-lifespan.component.scss'],
  imports: [PrimeNgModule, CommonModule]
})
export class DomainGanttChartComponent implements OnInit { 
  domains: Domain[] = [];
  yearRange: number[] = [];
  todayPosition: string = '';
  loading = true;

  private readonly colors = [
    'var(--red-400)', 'var(--blue-400)', 'var(--green-400)',
    'var(--purple-400)', 'var(--yellow-400)', 'var(--orange-400)'
  ];

  constructor(
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDomains();
    this.calculateYearRangeAndTodayPosition();
  }

  private loadDomains() {
    this.databaseService.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains.map((domain, index) => ({
          id: index,
          name: domain.domain_name,
          start: new Date(domain.registration_date),
          end: new Date(domain.expiry_date || new Date())
        }));
        this.loading = false;
      },
      error: () => {
        console.error('Error fetching domains');
        this.loading = false;
      }
    });
  }

  private calculateYearRangeAndTodayPosition() {
    const startYear = 1990;
    const endYear = new Date().getFullYear() + 10;
    this.yearRange = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    const yearsSpan = endYear - startYear + 1;
    this.todayPosition = `${((new Date().getFullYear() - startYear) / yearsSpan) * 100}%`;
  }

  calculateBarPosition(domain: Domain): { left: string; width: string } {
    const startYear = this.yearRange[0];
    const yearsSpan = this.yearRange.length;
    const startPos = ((domain.start.getFullYear() - startYear) / yearsSpan) * 100;
    const duration = ((domain.end.getFullYear() - domain.start.getFullYear()) / yearsSpan) * 100;
    return { left: `${startPos}%`, width: `${duration}%` };
  }

  getBarColor(index: number): string {
    return this.colors[index % this.colors.length];
  }
}
