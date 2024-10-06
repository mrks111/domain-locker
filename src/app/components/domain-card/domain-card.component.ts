import { Component, Input } from '@angular/core';
import { Domain } from '../../../types/Database';
import { PrimeNgModule } from '../../prime-ng.module';
import { NgFor, DatePipe, CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-domain-card',
  templateUrl: './domain-card.component.html',
  styleUrls: ['./domain-card.component.scss'],
  imports: [PrimeNgModule, NgFor, DatePipe, CommonModule]
})
export class DomainCardComponent {
  @Input() domain!: Domain;  // Accept the domain as an input prop
}
