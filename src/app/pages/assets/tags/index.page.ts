import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { Tag } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-tags-index',
  imports: [CommonModule, RouterModule, PrimeNgModule],
  templateUrl: './index.page.html',
  styleUrl: './tags.scss'
})
export default class TagsIndexPageComponent implements OnInit {
  tags: (Tag & { domainCount: number })[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.loading = true;
    this.databaseService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags.map(tag => ({ ...tag, domainCount: 0 }));
        this.loadDomainCounts();
      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags'
        });
        this.loading = false;
      }
    });
  }

  loadDomainCounts() {
    this.databaseService.getDomainCountsByTag().subscribe({
      next: (counts) => {
        this.tags = this.tags.map(tag => ({
          ...tag,
          domainCount: counts[tag.name] || 0
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domain counts:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domain counts'
        });
        this.loading = false;
      }
    });
  }
}
