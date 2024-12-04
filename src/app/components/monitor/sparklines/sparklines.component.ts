import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import DatabaseService from '@services/database.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { ApexOptions } from 'ng-apexcharts';

interface Series { x: string; y: number };
interface MinMax { min: number; max: number };

@Component({
  selector: 'app-domain-sparklines',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, NgApexchartsModule],
  templateUrl: './sparklines.component.html',
  styleUrls: ['./sparklines.component.scss'],
})
export class DomainSparklineComponent implements OnInit {

  @Input() domainId!: string;
  @Input() userId!: string;

  timeframe: 'day' | 'week' | 'month' | 'year' = 'day';
  timeframeOptions = ['day', 'week', 'month', 'year'];
  uptimeData: any[] = [];
  isUp: boolean = false;
  uptimePercentage!: number;
  
  avgResponseTime!: number;
  avgDnsTime!: number;
  avgSslTime!: number;
  minMaxResponseTime!: MinMax;
  minMaxDnsTime!: MinMax;
  minMaxSslTime!: MinMax;

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

  /* From the db response data, puts in format ready for charts */
  processUptimeData(): void {
    if (!this.uptimeData.length) return;

    const totalChecks = this.uptimeData.length;
    const upChecks = this.uptimeData.filter((d) => d.is_up).length;
    this.isUp = this.uptimeData[0].is_up;
    this.uptimePercentage = (upChecks / totalChecks) * 100;

    const responseTimes = this.uptimeData.map((d) => ({
      x: d.checked_at,
      y: d.response_time_ms,
    }));
    const dnsTimes = this.uptimeData.map((d) => ({
      x: d.checked_at,
      y: d.dns_lookup_time_ms,
    }));
    const sslTimes = this.uptimeData.map((d) => ({
      x: d.checked_at,
      y: d.ssl_handshake_time_ms,
    }));

    this.avgResponseTime = this.calculateAverage(responseTimes.map((d) => d.y));
    this.avgDnsTime = this.calculateAverage(dnsTimes.map((d) => d.y));
    this.avgSslTime = this.calculateAverage(sslTimes.map((d) => d.y));

    this.minMaxResponseTime = this.calculateMinMax(responseTimes.map((d) => d.y));
    this.minMaxDnsTime = this.calculateMinMax(dnsTimes.map((d) => d.y));
    this.minMaxSslTime = this.calculateMinMax(sslTimes.map((d) => d.y));

    this.updateCharts(responseTimes, dnsTimes, sslTimes);
  }

  calculateAverage(times: number[]): number {
    const filteredTimes = times.filter((t) => t != null);
    return (
      filteredTimes.reduce((acc, time) => acc + time, 0) / filteredTimes.length
    );
  }

  calculateMinMax(times: number[]): MinMax {
    const filteredTimes = times.filter((t) => t != null);
    return {
      min: Math.min(...filteredTimes),
      max: Math.max(...filteredTimes),
    };
  }

  updateCharts(
    responseTimes: Series[],
    dnsTimes: Series[],
    sslTimes: Series[]
  ): void {
    this.responseTimeChart = this.createSparklineChart('response', responseTimes, '--cyan-400', 'Response Time');
    this.dnsTimeChart = this.createSparklineChart('dns', dnsTimes, '--indigo-400', 'DNS Time');
    this.sslTimeChart = this.createSparklineChart('ssl', sslTimes, '--purple-400', 'SSL Time');
  }

  createSparklineChart(
    id: string,
    data: Series[],
    color = '--blue-400',
    name: string
  ): ApexOptions {
    return {
      chart: {
        id,
        group: 'performance',
        type: 'line',
        height: 100,
        sparkline: { enabled: false },
        // events: {
        //   dataPointMouseEnter: (event, chartContext, config) => {
        //     console.log(event, chartContext, config);
        //   },
        //   dataPointMouseLeave: () => {
        //     console.log('Mouse leave');
        //   },
        // },
        zoom: {
          enabled: false,
        },
      },
      series: [
        {
          name,
          data,
          color: `var(${color})`,
        },
      ],
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: [`var(${color}, #60a5fa)`],
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          format: 'dd MMM HH:mm',
        },
        y: {
          formatter: (value: number) => value ? `${value.toFixed(2)} ms` : 'N/A',
        },
      },
      xaxis: {
        type: 'datetime',
      },
    };
  }
  

  updateHoveredValue(value: number | null): void {
    if (value !== null) {
      this.avgResponseTime = value;
    } else {
      this.avgResponseTime = this.calculateAverage(this.uptimeData.map((d) => d.response_time_ms)); // Reset to average
    }
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
    const thresholds = { // in ms
      ssl: { green: 80, yellow: 200, orange: 400 },
      dns: { green: 40, yellow: 80, orange: 150 },
      response: { green: 200, yellow: 500, orange: 1000 }
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

  public mapTimeToSentence(timeframe: 'day' | 'week' | 'month' | 'year'): string {
    switch (timeframe) {
      case 'day': return 'past 24 hours';
      case 'week': return 'past 7 days';
      case 'month': return 'past 30 days';
      case 'year': return 'past 12 months';
      default: return 'Unknown';
    }
  }
  
}
