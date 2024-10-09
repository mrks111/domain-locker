import { Component, Input } from '@angular/core';
import { DbDomain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '../../services/domain-utils.service';

@Component({
  standalone: true,
  selector: 'app-domain-list',
  template: `
    <p-table [value]="domains" [columns]="columns" [scrollable]="true" scrollHeight="400px"
             [loading]="loading" styleClass="p-datatable-sm" [resizableColumns]="true">
      <ng-template pTemplate="header" let-columns>
        <tr>
          <th *ngFor="let col of columns" [pSortableColumn]="col.field" [style.width.px]="col.width">
            {{col.header}}
            <p-sortIcon [field]="col.field"></p-sortIcon>
          </th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-domain let-columns="columns">
        <tr>
          <td *ngFor="let col of columns">
            <ng-container [ngSwitch]="col.field">
              <span *ngSwitchCase="'domain_name'">{{domain.domain_name}}</span>
              <span *ngSwitchCase="'registrar'">{{domain.registrar?.name}}</span>
              <span *ngSwitchCase="'expiry_date'">{{domain.expiry_date | date:'mediumDate'}}</span>
              <span *ngSwitchCase="'tags'">
                <p-tag *ngFor="let tag of domain.tags" [value]="tag" styleClass="mr-1"></p-tag>
              </span>
              <span *ngSwitchCase="'notes'">{{domainUtils.truncateNotes(domain.notes)}}</span>
              <span *ngSwitchCase="'ip_addresses'">
                <ng-container *ngFor="let ip of domain.ip_addresses">
                  {{ip.ip_address}} ({{ip.is_ipv6 ? 'IPv6' : 'IPv4'}})<br>
                </ng-container>
              </span>
              <span *ngSwitchCase="'ssl'">
                {{domain.ssl?.issuer}}<br>
                Valid until: {{domain.ssl?.valid_to | date:'shortDate'}}
              </span>
              <span *ngSwitchDefault>{{domain[col.field]}}</span>
            </ng-container>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
  imports: [PrimeNgModule, NgFor, NgSwitch, NgSwitchCase, DatePipe, CommonModule]
})
export class DomainListComponent {
  @Input() domains: DbDomain[] = [];
  @Input() loading: boolean = false;

  columns = [
    { field: 'domain_name', header: 'Domain', width: 200 },
    { field: 'registrar', header: 'Registrar', width: 150 },
    { field: 'expiry_date', header: 'Expiry', width: 120 },
    { field: 'tags', header: 'Tags', width: 150 },
    { field: 'notes', header: 'Notes', width: 200 },
    { field: 'ip_addresses', header: 'IP Addresses', width: 150 },
    { field: 'ssl', header: 'SSL', width: 200 }
  ];

  constructor(public domainUtils: DomainUtils) {}
}
