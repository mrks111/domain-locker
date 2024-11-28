import { injectContent, injectContentFiles, MarkdownComponent } from '@analogjs/content';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

@Component({
  standalone: true,
  imports: [MarkdownComponent, AsyncPipe, NgIf, CommonModule],
  template: `
    <div>
    <ng-container *ngIf="doc$ | async as doc">
      <h1>{{ doc.attributes.title }}</h1>
      <analog-markdown [content]="doc.content"></analog-markdown>
    </ng-container>

    
    <h2>More Docs</h2>
    <ul>
        <li *ngFor="let doc of docs">
          <a [href]="'/about/'+doc.slug"> {{ doc.attributes.title }}</a>
        </li>
      </ul>
    </div>
  `,
})
export default class DocsComponent implements OnInit {
  
  async ngOnInit(): Promise<void> {
    

  }

  readonly doc$ = injectContent<DocAttributes>({
    param: 'slug',
    subdirectory: 'docs',
  });

  readonly docs = injectContentFiles<DocAttributes>((contentFile) => {
    console.log('contentFile', contentFile);
    return contentFile.filename.includes('/src/content/docs/')
  }
  );
}
