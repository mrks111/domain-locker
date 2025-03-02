import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ActivatedRoute } from '@angular/router';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { supportContent } from '~/app/pages/about/data/support-links';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
  styles: [``],
})
export default class SelfHostedSupportPage implements OnInit {
  errorMessage?: string;
  public content = supportContent;

  constructor(
    private route: ActivatedRoute,
    private messagingService: GlobalMessageService,
  ) {}

  ngOnInit(): void {}
}
