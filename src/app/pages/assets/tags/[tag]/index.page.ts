import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DbDomain } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '@/app/components/domain-collection/domain-collection.component';
import { TagEditorComponent } from '@/app/components/forms/tag-editor/tag-editor.component';

@Component({
  standalone: true,
  selector: 'app-tag-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent, TagEditorComponent],
  templateUrl: './tag.page.html',
  styleUrl: './tag.page.scss',
})
export default class TagDomainsPageComponent implements OnInit {
  tagName: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;
  dialogOpen: boolean = false;

  tag = {
    name: '',
    color: '',
    icon: '',
    notes: ''
  };

  showDialog() {
      this.dialogOpen = true;
  }


  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tagName = params['tag'];
      this.loadDomains();
    });
    this.tag.name = this.tagName;
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.getDomainsByTag(this.tagName).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error fetching domains for tag ${this.tagName}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this tag'
        });
        this.loading = false;
      }
    });
  }
}
