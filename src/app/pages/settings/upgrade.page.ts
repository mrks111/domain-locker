import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './upgrade.page.html',
  styles: [``]
})
export default class UpgradePageComponent {}
