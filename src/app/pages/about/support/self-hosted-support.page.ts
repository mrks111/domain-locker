import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ActivatedRoute } from '@angular/router';
import { GlobalMessageService } from '~/app/services/messaging.service';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  // templateUrl: './error.page.html',
  template: '',
  styles: [``],
})
export default class SelfHostedSupportPage implements OnInit {
  errorMessage?: string;

  constructor(
    private route: ActivatedRoute,
    private messagingService: GlobalMessageService,
  ) {}

  ngOnInit(): void {}
}
