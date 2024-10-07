import { Component, Input } from '@angular/core';
import { DbDomain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '../../services/domain-utils.service';
import { DomainFaviconComponent } from '../../components/misc/favicon.component';

@Component({
  standalone: true,
  selector: 'app-domain-card',
  templateUrl: './domain-card.component.html',
  styleUrls: ['./domain-card.component.scss'],
  imports: [PrimeNgModule, NgFor, DatePipe, CommonModule, DomainFaviconComponent]
})
export class DomainCardComponent {
  @Input() domain!: DbDomain;  // Accept the domain as an input prop

  constructor(public domainUtils: DomainUtils) {}
}
