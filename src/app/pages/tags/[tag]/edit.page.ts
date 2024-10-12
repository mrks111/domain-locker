import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { DbDomain } from '@/types/Database';
import { DomainCollectionComponent } from '@/app/components/domain-collection/domain-collection.component';
import { TagEditorComponent } from '@/app/components/forms/tag-editor/tag-editor.component';

@Component({
  standalone: true,
  selector: 'app-tag-edit',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent, TagEditorComponent],
  template: '<app-tag-editor [tag]="tag"></app-tag-editor>',
})
export default class TagDomainsPageComponent implements OnInit {
  tagName: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;
  dialogOpen: boolean = false;

  tag = { name: '', color: '', icon: '', notes: '' };

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tagName = params['tag'];
    });
    this.tag.name = this.tagName;
  }

}
