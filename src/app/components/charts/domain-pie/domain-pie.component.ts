import { Component, OnInit, ViewChild, AfterViewInit, PLATFORM_ID, Inject, ElementRef } from "@angular/core";
import { ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexLegend, ApexStroke } from "ng-apexcharts";
import DatabaseService from '@services/database.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { NgIf } from '@angular/common';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  legend: ApexLegend;
  stroke: ApexStroke;
  colors: string[];
};

@Component({
  selector: 'app-registrar-pie-chart',
  template: `
    <div #chartContainer class="chart-container">
      <apx-chart *ngIf="dataLoaded"
        [series]="chartOptions.series"
        [chart]="chartOptions.chart"
        [labels]="chartOptions.labels"
        [responsive]="chartOptions.responsive"
        [theme]="chartOptions.theme"
        [legend]="chartOptions.legend"
        [stroke]="chartOptions.stroke"
      [colors]="chartOptions.colors"
      ></apx-chart>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 100%;
    }
  `],
  standalone: true,
  imports: [NgApexchartsModule, NgIf]
})
export class RegistrarPieChartComponent implements OnInit, AfterViewInit {
  @ViewChild("chart") chart: ChartComponent;
  @ViewChild('chartContainer', { static: true }) chartContainer: ElementRef;
  public chartOptions: Partial<ChartOptions>;
  public dataLoaded = false;
  
  constructor(
    private databaseService: DatabaseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "pie",
        id: 'registrarPieChart',
        background: 'transparent',
      },
      labels: [],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: '100%'
          },
          legend: {
            position: "bottom"
          }
        }
      }],
      theme: {
        mode: 'dark',
        palette: 'palette1',
        monochrome: {
          enabled: false,
          color: '#255aee',
          shadeTo: 'dark',
          shadeIntensity: 0.65
        },
      },
      legend: {
        position: 'bottom',
        labels: {
          colors: 'var(--surface-500)'
        }
      },
      stroke: {
        colors: ['var(--surface-100)']
      },
      colors: []
    };
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRegistrarData();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setChartColors();
      this.setChartSize();
    }
  }

  loadRegistrarData() {
    this.getRegistrarData().pipe(
      tap(data => {
        this.chartOptions.series = data.map(item => item.count);
        this.chartOptions.labels = data.map(item => item.name);
        this.dataLoaded = true;
      })
    ).subscribe();
  }

  getRegistrarData(): Observable<{name: string, count: number}[]> {
    return this.databaseService.getDomainCountsByRegistrar().pipe(
      map(counts => Object.entries(counts).map(([name, count]) => ({ name, count })))
    );
  }

  setChartColors() {
    if (isPlatformBrowser(this.platformId)) {
      const style = getComputedStyle(document.body);
      const colors = [
        style.getPropertyValue('--purple-400'),
        style.getPropertyValue('--blue-400'),
        style.getPropertyValue('--green-400'),
        style.getPropertyValue('--cyan-400'),
        style.getPropertyValue('--indigo-400'),
        style.getPropertyValue('--teal-400'),
        style.getPropertyValue('--pink-400'),
        style.getPropertyValue('--yellow-400'),
        style.getPropertyValue('--orange-400'),
        style.getPropertyValue('--red-400')
      ];
      this.chartOptions.colors = colors;
    }
  }

  setChartSize() {
    if (this.chartContainer) {
      const { width, height } = this.chartContainer.nativeElement.getBoundingClientRect();
      this.chartOptions.chart = {
        ...this.chartOptions.chart,
        width: '90%',
        height: height,
      };
    }
  }
}
