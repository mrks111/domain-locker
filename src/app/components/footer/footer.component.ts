import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [ CommonModule, PrimeNgModule ],
  templateUrl: './footer.component.html',
  styles: []
})
export class FooterComponent {
  @Input() public big: boolean = false;
}
