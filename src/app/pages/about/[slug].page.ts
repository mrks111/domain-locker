import { injectContent, injectContentFiles, MarkdownComponent } from '@analogjs/content';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { aboutPages, AboutLink } from './data/about-page-list';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { PrimeNgModule } from '@/app/prime-ng.module';

import NotFoundPage from '@/app/pages/[...not-found].page'

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

@Component({
  standalone: true,
  imports: [MarkdownComponent, AsyncPipe, NgIf, CommonModule, PrimeNgModule, NotFoundPage],
  templateUrl: './[slug].page.html',
})
export default class DocsComponent implements OnInit {

  public aboutPages = aboutPages;
  public currentPage = '';

  public docsNotFound: boolean = false;
  public linksTitle: string | null = null;
  public links: AboutLink[] | null = null;

  readonly doc$ = injectContent<DocAttributes>({
    param: 'slug',
    subdirectory: 'docs',
  });

  readonly docs = injectContentFiles<DocAttributes>((contentFile) => {
    return contentFile.filename.includes('/src/content/docs/')
  });

  constructor(
    private route: ActivatedRoute,
  ) {}
  
  async ngOnInit(): Promise<void> {
    this.doc$.subscribe(doc => {
      if (!doc?.slug) {
        this.docsNotFound = true;
      }
    });

    this.route.params.pipe(
      switchMap(params => {
        this.currentPage = params['slug'];
        this.fondLinks(this.currentPage);
        return params['slug'];
      })
    ).subscribe(slug => {
      this.currentPage = slug as string;
    });
  }

  makeId(title: string): string {
    return title.toLowerCase().replace(/ /g, '-');
  }

  fondLinks(title: string): AboutLink[] | null {
    const foundSection = this.aboutPages.find(page => this.makeId(page.title) === this.makeId(title));
    if (foundSection) {
      this.linksTitle = foundSection.title;
      this.links = foundSection.links;
      return foundSection.links;
    }
    return null;
  }


}
