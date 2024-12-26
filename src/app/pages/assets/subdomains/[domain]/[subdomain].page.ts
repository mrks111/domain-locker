import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import DatabaseService from '@/app/services/database.service';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { makeKVList } from './../subdomain-utils';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-subdomain-detail',
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './[subdomain].page.html',
})
export default class SubdomainDetailPageComponent implements OnInit {
  domain: string = '';
  subdomainName: string = '';
  subdomainInfo: { key: string; value: string }[] = [];
  subdomain: any = null;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.domain = this.route.snapshot.params['domain'];
    this.subdomainName = this.route.snapshot.params['subdomain'];
    this.loadSubdomain();
  }

  loadSubdomain() {
    this.loading = true;
    this.databaseService.subdomainsQueries
      .getSubdomainInfo(this.domain, this.subdomainName)
      .subscribe({
        next: (subdomain) => {
          this.subdomain = subdomain;
          this.subdomainInfo = makeKVList(subdomain.sd_info);
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.handleError({ error });
          this.loading = false;
        },
      });
  }


  confirmDelete(event: Event): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the link "${this.subdomainName}.${this.domain}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // TODO: Implement deletion
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Deletion cancelled',
        });
      },
    });
  }
}



