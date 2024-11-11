import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@services/database.service';
import { Router } from '@angular/router';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-tld-organization-chart',
  templateUrl: './domain-hierarchy.component.html',
  styleUrls: ['./domain-hierarchy.component.scss'],
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
})
export class TldOrganizationChartComponent implements OnInit {
  chartData: TreeNode[] = [];

  constructor(private db: DatabaseService, private router: Router) {}

  ngOnInit() {
    this.prepareChartData();
  }

  private prepareChartData() {
    this.db.listDomains().subscribe(
      (domains) => {
        const tldMap = new Map<string, TreeNode>();

        domains.forEach((domain) => {
          const tld = this.extractTld(domain.domain_name);
          const subdomains = domain.sub_domains || [];

          // Initialize TLD node if it doesn’t already exist
          if (!tldMap.has(tld)) {
            tldMap.set(tld, {
              label: tld,
              type: 'tld',
              expanded: true,
              children: [],
            });
          }

          // Create domain node with subdomains and tooltip
          const domainNode: TreeNode = {
            label: domain.domain_name,
            type: 'domain',
            expanded: true,
            data: {
              tooltip: `Registrar: ${domain.registrar?.name || 'Unknown'}\nExpiry Date: ${domain.expiry_date || 'N/A'}`,
              routerLink: `/domains/${domain.domain_name}`,
            },
            styleClass: 'bg-indigo-500 text-white',
            children: subdomains.map((subdomain) => ({
              label: subdomain.name,
              type: 'subdomain',
              expanded: true,
            })),
          };
          tldMap.get(tld)!.children!.push(domainNode);
        });
        this.chartData = [{ label: 'Domains', expanded: true, children: Array.from(tldMap.values()) }];
      },
      (error) => {
        console.error('Error fetching domains:', error);
      }
    );
}


  private extractTld(domainName: string): string {
    return domainName.split('.').pop()?.toLowerCase() || '';
  }
}
