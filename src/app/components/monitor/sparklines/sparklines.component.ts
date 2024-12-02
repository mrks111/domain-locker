import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import DatabaseService from '@services/database.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';

@Component({
  selector: 'app-domain-sparklines',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, NgApexchartsModule],
  templateUrl: './sparklines.component.html',
  // styleUrls: ['./domain-uptime.component.scss'],
})
export class DomainSparklineComponent implements OnInit {

  @Input() domainId!: string;
  @Input() userId!: string;

  timeframe: 'day' | 'week' | 'month' | 'year' = 'day';
  timeframeOptions = ['day', 'week', 'month', 'year'];
  uptimeData: any[] = [];
  isUp!: boolean;
  uptimePercentage!: number;
  avgResponseTime!: number;
  avgDnsTime!: number;
  avgSslTime!: number;

  // Chart data
  responseTimeChart: any;
  dnsTimeChart: any;
  sslTimeChart: any;

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.fetchUptimeData();
  }

  fetchUptimeData(): void {
    this.databaseService.getDomainUptime(this.userId, this.domainId, this.timeframe).then((data: any) => {
      console.log(data);
      if (data.data) {
        this.uptimeData = data.data;
        this.processUptimeData();
      } else {
        this.errorHandler.handleError({
          error: data?.error,
          message: 'Failed to load uptime data',
          showToast: true,
          location: 'Domain Uptime',
        });
      }
    })
    ;
  }

  processUptimeData(): void {
    if (!this.uptimeData.length) return;

    // Calculate stats
    const totalChecks = this.uptimeData.length;
    const upChecks = this.uptimeData.filter((d) => d.is_up).length;
    this.isUp = this.uptimeData[0].is_up;
    this.uptimePercentage = (upChecks / totalChecks) * 100;

    const responseTimes = this.uptimeData.map((d) => d.response_time_ms);
    const dnsTimes = this.uptimeData.map((d) => d.dns_lookup_time_ms);
    const sslTimes = this.uptimeData.map((d) => d.ssl_handshake_time_ms);

    this.avgResponseTime = this.calculateAverage(responseTimes);
    this.avgDnsTime = this.calculateAverage(dnsTimes);
    this.avgSslTime = this.calculateAverage(sslTimes);

    this.updateCharts(responseTimes, dnsTimes, sslTimes);
  }

  calculateAverage(times: number[]): number {
    const filteredTimes = times.filter((t) => t != null);
    return (
      filteredTimes.reduce((acc, time) => acc + time, 0) / filteredTimes.length
    );
  }

  updateCharts(
    responseTimes: number[],
    dnsTimes: number[],
    sslTimes: number[]
  ): void {
    this.responseTimeChart = this.createSparklineChart(responseTimes);
    this.dnsTimeChart = this.createSparklineChart(dnsTimes);
    this.sslTimeChart = this.createSparklineChart(sslTimes);
  }

  createSparklineChart(data: number[]): any {
    return {
      chart: {
        type: 'line',
        height: 50,
        sparkline: {
          enabled: true,
        },
      },
      series: [{ data }],
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  onTimeframeChange(timeframe: string): void {
    console.log(timeframe);
    this.timeframe = timeframe as 'day' | 'week' | 'month' | 'year';
    this.fetchUptimeData();
  }

  public round(value: number | undefined | null): number {
    if (!value || isNaN(value)) {
      return 0;
    }
    return Math.round(value * 100) / 100;
  }

  public getColorClassForPercentage(percentage: number): string {
    if (percentage > 99) return 'green-400';
    if (percentage > 95) return 'yellow-400';
    if (percentage > 90) return 'orange-400';
    return 'bad';
  }

  public getPerformanceColor(
    value: number,
    type: 'ssl' | 'dns' | 'response',
    prefix: string = 'text-',
    postfix: string = '-400'): string {
    if (typeof value !== 'number' || value < 0 || !type) {
      return 'grey';
    }
  
    // Define ranges for each type
    const thresholds = {
      ssl: { green: 100, yellow: 300, orange: 500 }, // in milliseconds
      dns: { green: 50, yellow: 100, orange: 250 }, // in milliseconds
      response: { green: 200, yellow: 500, orange: 1000 } // in milliseconds
    };
  
    // Ensure the type exists in thresholds
    const typeThresholds = thresholds[type];
    if (!typeThresholds) {
      return `${prefix}grey${postfix}`;
    }
  
    // Determine the color based on the value
    if (value <= typeThresholds.green) {
      return `${prefix}green${postfix}`;
    } else if (value <= typeThresholds.yellow) {
      return `${prefix}yellow${postfix}`;
    } else if (value <= typeThresholds.orange) {
      return `${prefix}orange${postfix}`;
    } else {
      return `${prefix}red${postfix}`;
    }
  }
  
}
