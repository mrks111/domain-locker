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
import { LinkDialogComponent, LinkDialogData } from '@components/misc/edit-link.component';
import { ContextMenu } from 'primeng/contextmenu';
import { DialogService } from 'primeng/dynamicdialog';

type DisplayBy = 'all-links' | 'by-domain';


@Component({
  standalone: true,
  selector: 'app-tags-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, TagEditorComponent, DomainFaviconComponent, LinkDialogComponent],
  templateUrl: './index.page.html',
  providers: [DialogService],
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
  selectedLink: Link | any | null = null;
  public contextMenuItems: MenuItem[] = [];

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private dialogService: DialogService,
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
    window.open(this.selectedLink.link_url, '_blank');
  }
  deleteLink() {}
  showEditLink() {
    this.openLinkDialog(this.selectedLink);
  }
  addNewLink() {
    this.openLinkDialog(null);
  }
  

  loadLinks() {
    this.loading = true;
    this.databaseService.linkQueries.getAllLinks().subscribe({
      next: (links) => {
        this.links = links;
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

  
  openLinkDialog(link: Link | any | null = null): void {
    const ref = this.dialogService.open(LinkDialogComponent, {
      header: link ? 'Edit Link' : 'Add New Link',
      data: { link, isEdit: !!link },
      width: '50%',
      height: '36rem',
    });
  
    ref.onClose.subscribe((result: LinkDialogData | null) => {
      if (result) {
        if (link) {
          // Handle edit logic
          this.updateLink(link.link_ids, result);
        } else {
          // Handle add logic
          this.addLink(result);
        }
      }
    });
  }
  

  private updateLink(linkId: string, linkData: LinkDialogData): void {
    this.databaseService.linkQueries.updateLinkInDomains(linkId, linkData).subscribe({
      next: () => {
        this.loadLinks(); // Reload the links to reflect the updates
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Link updated successfully!',
        });
      },
      error: (error) => {
        this.errorHandlerService.handleError({
          error,
          message: 'Failed to update the link.',
          showToast: true,
          location: 'LinksIndexPageComponent.updateLink',
        });
      },
    });
  }  


  private addLink(linkData: LinkDialogData): void {
    this.databaseService.linkQueries.addLinkToDomains(linkData).subscribe({
      next: () => {
        this.loadLinks(); // Reload the links to reflect the addition
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Link added successfully!',
        });
      },
      error: (error) => {
        this.errorHandlerService.handleError({
          error,
          message: 'Failed to add the link.',
          showToast: true,
          location: 'LinksIndexPageComponent.addLink',
        });
      },
    });
  }
  
}
