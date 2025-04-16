import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  OnDestroy,
  ElementRef,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MaterialModule } from '../../../material.module';
import { CommonModule } from '@angular/common';
import { PRIMARY_COLOR_HEX } from '../../../constants/app.constants';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [BaseChartDirective, MaterialModule, CommonModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
})
export class BarChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  @Input() title = 'Graphique';
  @Input() labels: string[] = [];
  @Input() data: number[] = [];
  @Input() color = PRIMARY_COLOR_HEX;
  @Input() xAxisTitle = 'Période';
  @Input() yAxisTitle = 'Valeurs';

  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.chart) {
        this.updateChart();
      } else {
        console.warn('Chart instance not available in ngAfterViewInit');
      }
    }, 250);
  }

  ngOnDestroy() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 100);
  }

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: '',
        borderColor: '',
        borderWidth: 1,
      },
    ],
  };

  public barChartOptions: ChartOptions<'bar'> = this.getUpdatedChartOptions();

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['labels'] ||
      changes['data'] ||
      changes['color'] ||
      changes['title'] ||
      changes['xAxisTitle'] ||
      changes['yAxisTitle']
    ) {
      this.updateChart();
    }
  }

  private updateChart() {
    if (!Array.isArray(this.labels) || this.labels.length === 0 || 
        !Array.isArray(this.data) || this.data.length === 0) {
      
      this.barChartData = {
        labels: ['No Data'],
        datasets: [
          {
            data: [0],
            label: this.title,
            backgroundColor: this.color,
            borderColor: this.color,
            borderWidth: 1,
          },
        ],
      };
      
      this.barChartOptions = this.getUpdatedChartOptions();
      
      if (this.chart) {
        this.chart.options = this.barChartOptions;
        setTimeout(() => {
          this.chart.update();
        }, 0);
      }
      
      return;
    }
    
    let gradientColor: string | CanvasGradient = this.color;
    
    if (this.chart?.chart) {
      const ctx = this.chart.chart.ctx;
      if (ctx && typeof ctx.createLinearGradient === 'function') {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.adjustColor(this.color, -30));
        gradientColor = gradient;
      }
    }
    
    this.barChartData = {
      labels: this.labels,
      datasets: [
        {
          data: this.data,
          label: this.title,
          backgroundColor: gradientColor,
          borderColor: this.color,
          borderWidth: 1,
          hoverBackgroundColor: this.adjustColor(this.color, 20),
          barPercentage: 0.8,
          categoryPercentage: 0.8,
          borderRadius: 4
        },
      ],
    };

    this.barChartOptions = this.getUpdatedChartOptions();

    if (this.chart) {
      this.chart.options = this.barChartOptions;
      setTimeout(() => {
        this.chart.update();
      }, 0);
    } else {
      console.warn('Chart instance not available');
    }
  }

  private getUpdatedChartOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.75,
      plugins: {
        title: {
          display: true,
          text: this.title,
          color: '#ffffff',
          font: {
            size: 18,
            weight: 'bold',
          },
          padding: {
            bottom: 15,
          },
        },
        legend: { 
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 4,
          displayColors: false,
          callbacks: {
            label: (context) => {
              return `${context.formattedValue}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { 
            display: true,
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: { 
            color: '#ffffff', 
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45
          },
          title: {
            display: true,
            text: this.xAxisTitle,
            color: '#ffffff',
            font: { 
              size: 14,
              weight: 'bold' 
            },
            padding: {
              top: 10
            }
          },
        },
        y: {
          beginAtZero: true,
          grid: { 
            color: 'rgba(255, 255, 255, 0.1)' 
          },
          ticks: { 
            color: '#ffffff',
            font: { size: 12 }
          },
          title: {
            display: true,
            text: this.yAxisTitle,
            color: '#ffffff',
            font: { 
              size: 14,
              weight: 'bold'
            },
            padding: {
              bottom: 10
            }
          },
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      elements: {
        bar: {
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    };
  }

  private adjustColor(color: string, amount: number): string {
    let hex = color;
    if (hex.startsWith('#')) {
      hex = hex.slice(1);
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const adjustBrightness = (value: number) => {
      return Math.max(0, Math.min(255, value + amount));
    };
    
    const rr = adjustBrightness(r).toString(16).padStart(2, '0');
    const gg = adjustBrightness(g).toString(16).padStart(2, '0');
    const bb = adjustBrightness(b).toString(16).padStart(2, '0');
    
    return `#${rr}${gg}${bb}`;
  }
}
