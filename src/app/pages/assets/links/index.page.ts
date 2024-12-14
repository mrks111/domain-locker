import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { Link } from '@/types/Database';
import DatabaseService from '@/app/services/database.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TagEditorComponent } from '@/app/components/forms/tag-editor/tag-editor.component';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { ContextMenu } from 'primeng/contextmenu';

type DisplayBy = 'all-links' | 'by-domain';


@Component({
  standalone: true,
  selector: 'app-tags-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, TagEditorComponent, DomainFaviconComponent],
  templateUrl: './index.page.html',
  // styleUrl: './tags.scss'
})
export default class LinksIndexPageComponent implements OnInit {
  
  links: any;
  loading: boolean = true;

  displayBy: DisplayBy = 'all-links';
  displayByOptions: { label: string; value: DisplayBy }[] = [
    { label: 'All Links', value: 'all-links' },
    { label: 'By Domain', value: 'by-domain' },
  ];

  // For the right-click context menu
  @ViewChild('menu') menu: ContextMenu | undefined;
  selectedLink: Link | null = null;
  public contextMenuItems: MenuItem[] = [];

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.loadLinks();

    this.contextMenuItems = [
      { label: 'Open Link', icon: 'pi pi-external-link', command: () => this.openLink() },
      { label: 'Edit Link', icon: 'pi pi-pencil', command: () => this.showEditLink() },
      { label: 'Linked Domains', icon: 'pi pi-check-square', command: () => this.showEditLink() },
      { label: 'Delete Link', icon: 'pi pi-trash', command: () => this.deleteLink() },
      { label: 'Add New Link', icon: 'pi pi-plus', command: () => this.addNewLink() },
    ];
  }

  openLink() {
    console.log('Open Link', this.selectedLink);
  }
  deleteLink() {}
  showEditLink() {}
  addNewLink() {}
  

  loadLinks() {
    this.loading = true;
    this.databaseService.getAllLinks().subscribe({
      next: (links) => {
        console.log(links);
        this.links = links;
        // this.links = tags.map(tag => ({ ...tag, domainCount: 0 }));
        // this.loadDomainCounts();
      },
      error: (error) => {
        this.errorHandlerService.handleError({
          error,
          message: 'Failed to load links',
          showToast: true,
          location: 'Assets.Links.Index',
        });
        this.loading = false;
      }
    });
  }

  onRightClick(event: MouseEvent, link: Link) {
    console.log(link);
    this.selectedLink = link;
    if (this.menu) {
      this.menu.show(event);
    }
    event.preventDefault();
  }


}
