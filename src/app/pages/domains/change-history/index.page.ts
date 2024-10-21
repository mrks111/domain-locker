import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../../prime-ng.module';
import { DomainUpdatesComponent } from '@/app/components/domain-things/domain-updates/domain-updates.component';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [CommonModule, PrimeNgModule, DomainUpdatesComponent ],
  templateUrl: './change-history.page.html',
  // styleUrl: './domain-name.page.scss',
})
export default class ChangeHistoryPage {}
