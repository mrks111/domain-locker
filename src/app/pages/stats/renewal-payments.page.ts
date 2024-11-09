import { Component } from '@angular/core';
import { YearCalendarComponent } from '@components/charts/year-calendar/year-calendar.component';

@Component({
  standalone: true,
  template: '<h1>Renewals Calendar</h1><app-year-calendar />',
  imports: [YearCalendarComponent],
})
export default class RenewalsCalendarPage {}
