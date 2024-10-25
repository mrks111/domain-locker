import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import DatabaseService from '@services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-tag-grid',
  templateUrl: './tag-grid.component.html',
  styleUrls: ['../../pages/assets/tags/tags.scss'],
  imports: [CommonModule, PrimeNgModule]
})
export class TagGridComponent implements OnInit {
  public tags: Array<any> = [];
  public loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadTagsWithCounts();
  }

  loadTagsWithCounts() {
    this.loading = true;

    this.databaseService.getTagsWithDomainCounts().subscribe({
      next: (tagsWithCounts) => {
        console.log(tagsWithCounts);
        this.tags = tagsWithCounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching tags with domain counts:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags with domain counts'
        });
        this.loading = false;
      }
    });
  }
}
