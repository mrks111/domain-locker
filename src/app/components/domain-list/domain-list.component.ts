import { Component, Input } from '@angular/core';
import { DbDomain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '../../services/domain-utils.service';

@Component({
  standalone: true,
  selector: 'app-domain-list',
  templateUrl: 'domain-list.component.html',
  imports: [PrimeNgModule, NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule]
})
export class DomainListComponent {
  @Input() domains: DbDomain[] = [];
  @Input() loading: boolean = false;
  @Input() visibleColumns: any[] = [];

  constructor(public domainUtils: DomainUtils) {}
}
