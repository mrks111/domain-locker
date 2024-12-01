import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { sections } from '../data/useful-links';

@Component({
  selector: 'app-external-tools',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DlIconComponent],
  templateUrl: './index.page.html',
})
export default class FeaturesPage {
  public sections = sections;

  makeId(title: string) {
    return title.toLowerCase().replace(/\s/g, '-');
  }
}
