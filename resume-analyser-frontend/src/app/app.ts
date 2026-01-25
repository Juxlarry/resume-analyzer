import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  // templateUrl: './app.html',
  template: `<router-outlet></router-outlet>`,
  // styleUrl: './app.css'
  styles: [``]
})
export class App {
  protected readonly title = signal('resume-analyser-frontend');
}
