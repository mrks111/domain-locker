import { Component, Input } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ContentFile } from '@analogjs/content';
import { Observable } from 'rxjs';
import { MarkdownComponent } from '@analogjs/content';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MetaTagsService } from '@/app/services/meta-tags.service';

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

@Component({
  standalone: true,
  selector: 'app-docs-viewer',
  imports: [CommonModule, NgIf, MarkdownComponent, PrimeNgModule],
  template: `
  <section class="flex flex-row-reverse items-start gap-4 h-full mx-auto my-4 flex-wrap md:flex-nowrap">
    <article *ngIf="doc" class="p-card p-4 flex-1 h-full min-h-64 max-w-[60rem] w-2">
      <h1 class="text-3xl">{{ doc.attributes.title }}</h1>
      <analog-markdown class="block max-w-[59rem]" [content]="doc.content"></analog-markdown>
    </article>

    <div class="relative h-full min-h-64 min-w-64 w-full md:w-fit mr-0 md:mr-4">
      <nav class="p-card py-4 relative md:fixed">
        <a [routerLink]="['/about', categoryName]" class="no-underline text-default">
          <h2 class="capitalize mx-4">{{ categoryName }} Docs</h2>
        </a>
        <ul class="list-none p-0 mx-0 mt-4 flex flex-col">
          <li *ngFor="let file of allDocs; index as index" class="border-x-0 border-b-0 border-t-2 border-solid border-surface-200">
            <a
              [routerLink]="['/about', categoryName, file.slug]"
              pTooltip="{{ file.attributes.description }}"
              showDelay="300"
              class="no-underline py-2 block px-4 hover:bg-surface-100 transition-all duration-200"
              [ngClass]="{ 'text-default font-bold': file.slug === doc?.slug, 'text-primary': file.slug !== doc?.slug}"
            >
              <span class="opacity-70 text-default font-normal">{{index + 1}}. </span>
              {{ file.attributes.title }}
            </a>
          </li>
        </ul>
        <a routerLink="/about" class="w-full flex">
          <p-button
            label="All Docs"
            class="mx-auto no-underline"
            severity="secondary"
            [outlined]="true"
            size="small"
            icon="pi pi-arrow-left"
          />
        </a>
      </nav>
    </div>
  </section>
  `,
  styles: [`
    ::ng-deep article hr {
      border-color: var(--surface-50);
      margin-bottom: 2rem;
    }
    ::ng-deep article  h2 { opacity: 70%; }
  `]
})
export class DocsViewerComponent {
  /** The doc$ to display. If it's null or never resolves, we'll treat it as 'not found'. */
  @Input() doc$!: Observable<ContentFile<DocAttributes | Record<string, never>>>;

  /** The array of docs for the same category, used for listing. */
  @Input() allDocs: ContentFile<DocAttributes>[] = [];

  /** The name of the category (e.g. 'legal', 'blog'), for building links. */
  @Input() categoryName: string = '';

  doc: ContentFile<DocAttributes | Record<string, never>> | null = null;

  constructor(private metaTagsService: MetaTagsService) {}

  ngOnInit() {
    this.doc$.subscribe(doc => {
      // Set current doc when it resolves
      this.doc = doc;

      // Then set meta tags, from doc attributes
      if (doc?.attributes) {
        const { title, description } = doc.attributes;
        this.metaTagsService.setCustomMeta(title, description);
      }
    });
  }
}
