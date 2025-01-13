import { Component, Input } from '@angular/core';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { ContentFile } from '@analogjs/content';
import { Observable } from 'rxjs';
import { MarkdownComponent } from '@analogjs/content';
import { PrimeNgModule } from '@/app/prime-ng.module';

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

@Component({
  standalone: true,
  selector: 'app-docs-viewer',
  imports: [CommonModule, NgIf, AsyncPipe, MarkdownComponent, PrimeNgModule],
  template: `
    <section *ngIf="(doc$ | async) as doc" class="p-card p-4 my-4 mx-auto">
      <h1 class="text-3xl">{{ doc.attributes.title }}</h1>
      <analog-markdown [content]="doc.content"></analog-markdown>
    </section>

    <section>
      <h2>{{ categoryName }} Docs</h2>
      <ul>
        <li *ngFor="let file of allDocs">
          <a [routerLink]="['/about', categoryName, file.slug]">{{ file.attributes.title }}</a>
        </li>
      </ul>
    </section>
  `,
})
export class DocsViewerComponent {
  /** The doc$ to display. If it's null or never resolves, we'll treat it as 'not found'. */
  @Input() doc$!:Observable<ContentFile<DocAttributes | Record<string, never>>>;

  /** The array of docs for the same category, used for listing. */
  @Input() allDocs: ContentFile<DocAttributes>[] = [];

  /** The name of the category (e.g. 'legal', 'blog'), for building links. */
  @Input() categoryName: string = '';
}
