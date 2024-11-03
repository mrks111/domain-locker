import { DlIconComponent } from '@/app/components/misc/svg-icon.component';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, DlIconComponent],
  templateUrl: './display-options.page.html',
})
export default class DisplayOptionsPageComponent {

}
