import { Component } from '@angular/core';
import { DomainListComponent } from '../../components/domain-list/domain-list.component';

@Component({
  standalone: true,
  selector: 'domain-index-page',
  imports: [ DomainListComponent ],
  template: '<app-domain-list></app-domain-list>',
})
export default class DomainIndexPageComponent {}
