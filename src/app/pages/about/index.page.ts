import { Component } from '@angular/core';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { aboutPages } from '@/app/pages/about/data/about-page-list';

@Component({
  standalone: true,
  selector: 'about-index-page',
  templateUrl: './about.page.html',
  imports: [CommonModule, PrimeNgModule],
})
export default class AboutPageComponent {
  sections = aboutPages;

  makeId(title: string): string {
    return title.toLowerCase().replace(/ /g, '-');
  }
}
