import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { features } from '../data/feature-comparison';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DlIconComponent],
  templateUrl: './index.page.html',
})
export default class FeaturesPage {
  public features = features;
}
