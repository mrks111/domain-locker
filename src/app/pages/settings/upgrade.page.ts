import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './upgrade.page.html',
  styles: [``]
})
export default class UpgradePageComponent {}
