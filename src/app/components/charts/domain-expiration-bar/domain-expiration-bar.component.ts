import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MeterGroupModule, MeterItem } from 'primeng/metergroup';
import { TooltipModule } from 'primeng/tooltip';
import DatabaseService, { DomainExpiration } from '@services/database.service';

@Component({
  selector: 'app-domain-expiration-bar',
  standalone: true,
  imports: [CommonModule, MeterGroupModule, TooltipModule],
  templateUrl: './domain-expiration-bar.component.html',
  styles: [`
    ::ng-deep .p-metergroup p-metergrouplabel { display: none; }
  `]
})
export class DomainExpirationBarComponent implements OnInit {
  meterValues: MeterItem[] = [];
  counts = { imminently: 0, soon: 0, later: 0 };
  domainsPerCategory: { [key: string]: DomainExpiration[] } = { imminently: [], soon: [], later: [] };
  upcomingDomains: DomainExpiration[] = [];
  nextExpiringDomain?: DomainExpiration;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.databaseService.getDomainExpirations().subscribe(
      domains => this.calculateExpirations(domains)
    );
  }

  private calculateExpirations(domains: DomainExpiration[]) {
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    domains.forEach(domain => {
      const timeUntilExpiration = domain.expiration.getTime() - now.getTime();
      if (timeUntilExpiration < thirtyDays) {
        this.counts.imminently++;
        this.domainsPerCategory['imminently'].push(domain);
      } else if (timeUntilExpiration < ninetyDays) {
        this.counts.soon++;
        this.domainsPerCategory['soon'].push(domain);
      } else {
        this.counts.later++;
        this.domainsPerCategory['later'].push(domain);
      }
    });

    const total = domains.length;

    this.meterValues = [
      { label: `Imminently (${this.counts.imminently})`, value: (this.counts.imminently / total) * 100, color: 'var(--red-400)', icon: 'pi pi-exclamation-circle' },
      { label: `Soon (${this.counts.soon})`, value: (this.counts.soon / total) * 100, color: 'var(--orange-400)', icon: 'pi pi-exclamation-triangle' },
      { label: `Later (${this.counts.later})`, value: (this.counts.later / total) * 100, color: 'var(--green-400)', icon: 'pi pi-check' },
    ];

    this.upcomingDomains = this.domainsPerCategory['imminently'];
    this.nextExpiringDomain = domains.reduce<DomainExpiration | undefined>((next, current) => 
      (!next || current.expiration < next.expiration) ? current : next, undefined);
  }

  getTooltipContent(category: string): string {
    console.log(category);
    const domains = this.domainsPerCategory[category] || [];
    if (!domains.length) {
      return 'No domains';
    }
    const displayDomains = domains.slice(0, 4);
    let content = displayDomains.map(d => d.domain).join(', ');
    if (domains.length > 4) {
      content += ` and ${domains.length - 4} more`;
    }
    const daysStr = category === 'imminently' ? 'within 30 days' : category === 'soon' ? 'within 90 days' : 'more than 3 months from now';
    content += ` ${domains.length === 1 ? 'is' : 'are'} expiring ${daysStr}.`;
    return content;
  }

  formatExpirationMessage(domain: DomainExpiration): string {
    const days = Math.ceil((domain.expiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return `${domain.domain} in ${days} days (${domain.expiration.toLocaleDateString()})`;
  }

  getUpcomingDomainsMessage(): string {
    const domains = this.upcomingDomains.slice(0, 3).map(d => d.domain);
    let message = domains.join(', ');
    if (this.upcomingDomains.length > 3) {
      message += ` and ${this.upcomingDomains.length - 3} more`;
    }
    message += ` ${this.upcomingDomains.length === 1 ? 'is' : 'are'} expiring within the next 30 days.`;
    return message;
  }
}
