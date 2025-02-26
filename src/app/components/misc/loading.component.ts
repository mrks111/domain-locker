import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  standalone: true,
  selector: 'loading',
  imports: [CommonModule, PrimeNgModule, TranslateModule],
  template: `
     <div
      class="flex justify-center flex-col items-center h-full min-h-80 gap-4 w-fit mx-auto scale-1 md:scale-125 xl:scale-150 mt-2 md:mt-4 lg:mt-8 xl:mt-16 animate-fade-in"
    >
      <!-- Title -->
      <p class="m-0 text-4xl font-extrabold text-default tracking-widest">
        <!-- If user supplied custom, use that; otherwise fallback to translation or text -->
        {{ loadingTitle || getTranslatedOrFallback('GLOBAL.LOADING.INITIALIZING', 'Initializing') }}
      </p>

      <!-- Animated bar loader -->
      <div class="w-28 flex gap-2">
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.3s]"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.5s]"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.8s]"></div>
      </div>

      <!-- Description -->
      <p *ngIf="loadingDescription; else defaultDesc" class="m-0 mt-4 text-lg text-surface-400 text-center">
        {{ loadingDescription }}
      </p>
      <ng-template #defaultDesc>
        <p class="m-0 mt-4 text-lg text-surface-400 text-center">
          {{ getTranslatedOrFallback('GLOBAL.LOADING.DEFAULT_DESCRIPTION', "We\'re just getting everything ready for you.\nThis shouldn\'t take a moment...") }}
        </p>
      </ng-template>

      <!-- Error display (appears after a timeout) -->
      <div *ngIf="showError" class="text-center">
        <p class="m-0 text-xs text-surface-400">
          {{ getTranslatedOrFallback('GLOBAL.LOADING.ERROR_SHORT', 'It shouldn\'t be taking this long...') }}
        </p>
        <p class="m-0 text-lg text-red-400">
          {{ getTranslatedOrFallback('GLOBAL.LOADING.ERROR_LONG', 'Something might have gone wrong') }}
        </p>
      </div>

      <div *ngIf="showError" class="flex gap-2">
        <a routerLink="/">
          <p-button
            size="small"
            [label]="getTranslatedOrFallback('GLOBAL.LOADING.BUTTON.HOME', 'Home')"
            severity="primary"
            icon="pi pi-home"
          ></p-button>
        </a>
        <p-button
          size="small"
          [label]="getTranslatedOrFallback('GLOBAL.LOADING.BUTTON.RELOAD', 'Reload')"
          severity="secondary"
          icon="pi pi-sync"
          (click)="reloadPage()"
        ></p-button>
      </div>
    </div>
  `,
})
export class LoadingComponent implements AfterViewInit, OnDestroy {
  @Input() loadingTitle?: string;
  @Input() loadingDescription?: string;
  public showError: boolean = false;
  private errorTimeout: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private translate: TranslateService,
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.errorTimeout = window.setTimeout(() => {
        this.showError = true;
      }, 8500);
    }
  }

  ngOnDestroy() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  reloadPage() {
    if (isPlatformBrowser(this.platformId)) {
      window.location.reload();
    }
  }

  public getTranslatedOrFallback(key: string, fallback: string): string {
    const translation = this.translate.instant(key);
    if (!translation || translation === key) {
      return fallback;
    }
    return translation;
  }
}
