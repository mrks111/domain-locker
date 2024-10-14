import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

import { DbDomain } from '@/types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '@services/domain-utils.service';
import { DomainFaviconComponent } from '@components/misc/favicon.component';
import { type FieldOption } from '@components/domain-filters/domain-filters.component';


@Component({
  standalone: true,
  selector: 'app-domain-card',
  templateUrl: './domain-card.component.html',
  styleUrls: ['./domain-card.component.scss'],
  imports: [PrimeNgModule, NgFor, DatePipe, CommonModule, DomainFaviconComponent]
})
export class DomainCardComponent implements OnInit {
  @Input() domain!: DbDomain;
  @Input() visibleFields: FieldOption[] = [];
  contextMenuItems: MenuItem[] | undefined;

  constructor(public domainUtils: DomainUtils) {}

  isVisible(field: string): boolean {
    return this.visibleFields.some(option => option.value === field);
  }

  ngOnInit() {
    this.contextMenuItems = [
      { label: 'View', icon: 'pi pi-reply' },  
      { label: 'Edit', icon: 'pi pi-pencil' },
      { label: 'Delete', icon: 'pi pi-trash' },
      { label: 'Copy URL', icon: 'pi pi-copy' },
      { label: 'Visit URL', icon: 'pi pi-external-link' },
      // { label: 'Advanced',
      //   icon: 'pi pi-file-edit',
      //   items: [
      //     { label: 'Copy', icon: 'pi pi-copy' },
      //     { label: 'Cut', icon: '' },
      //   ]
      // },
    ];
  }
}
