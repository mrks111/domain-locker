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
import { LinkDialogComponent } from '@components/misc/edit-link.component';
import { ContextMenu } from 'primeng/contextmenu';
import { DialogService } from 'primeng/dynamicdialog';

type DisplayBy = 'all-links' | 'by-domain';

export interface ModifiedLink extends Omit<Link, 'id'> {
  id?: string;
  link_ids?: string[];
  domains?: string[];
}

export interface LinkResponse {
  groupedByDomain: Record<string, ModifiedLink[]>;
  linksWithDomains: ModifiedLink[];
}


@Component({
  standalone: true,
  selector: 'app-tags-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, TagEditorComponent, DomainFaviconComponent, LinkDialogComponent],
  templateUrl: './index.page.html',
  providers: [DialogService],
  // styleUrl: './tags.scss'
})
export default class LinksIndexPageComponent implements OnInit {
  
  links!: LinkResponse;
  loading: boolean = true;

  displayBy: DisplayBy = 'all-links';
  displayByOptions: { label: string; value: DisplayBy }[] = [
    { label: 'All Links', value: 'all-links' },
    { label: 'By Domain', value: 'by-domain' },
  ];

  // For the right-click context menu
  @ViewChild('menu') menu: ContextMenu | undefined;
  selectedLink: ModifiedLink | null = null;
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
      { label: 'Delete Link', icon: 'pi pi-trash', command: () => this.confirmDelete() },
      { label: 'Add New Link', icon: 'pi pi-plus', command: () => this.addNewLink() },
    ];
  }

  openLink() {
    if (this.selectedLink) {
      window.open(this.selectedLink.link_url, '_blank');
    }
  }
  
  showEditLink() {
    this.openLinkDialog(this.selectedLink);
  }

  addNewLink() {
    this.openLinkDialog(null);
  }

  deleteLink(): void {
    if (!this.selectedLink) return;
    const linkIds = this.selectedLink.id || this.selectedLink.link_ids;
    if (!linkIds) return;
    this.databaseService.linkQueries.deleteLinks(linkIds).subscribe({
      next: () => {
        this.loadLinks(); // Refresh the list after deletion
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Link deleted successfully!',
        });
      },
      error: (error) => {
        this.errorHandlerService.handleError({
          error,
          message: 'Failed to delete the link.',
          showToast: true,
          location: 'LinksIndexPageComponent.deleteLink',
        });
      },
    });
  }  

  loadLinks() {
    this.loading = true;
    this.databaseService.linkQueries.getAllLinks().subscribe({
      next: (links) => {
        this.links = links;
        console.log(links);
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

  onRightClick(event: MouseEvent, link: ModifiedLink) {
    console.log(link);
    this.selectedLink = link;
    if (this.menu) {
      this.menu.show(event);
    }
    event.preventDefault();
  }

  
  openLinkDialog(link: ModifiedLink | null = null): void {
    const ref = this.dialogService.open(LinkDialogComponent, {
      header: link ? 'Edit Link' : 'Add New Link',
      data: { link, isEdit: !!link },
      width: '50%',
      height: '36rem',
    });
  
    ref.onClose.subscribe((result: ModifiedLink | null) => {
      if (result) {
        if (link && link.id) {
          // Handle edit logic
          this.updateLink(link.id, result);
        } else {
          // Handle add logic
          this.addLink(result);
        }
      }
    });
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the link "${this.selectedLink?.link_name}"?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteLink(); // Proceed with deletion
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

  private updateLink(linkId: string, linkData: ModifiedLink): void {
    this.databaseService.linkQueries.updateLinkInDomains(linkData).subscribe({
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


  private addLink(linkData: ModifiedLink): void {
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
