import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from './theme.service';

@Component({
  selector: 'lib-etl-server',
  template: `
    <etl-confirmer></etl-confirmer>
    <router-outlet></router-outlet>
  `,
  styles: [`
      :host {
        width: 100%;
        height: 100%;
        display: flex;
        flex-flow: column;
        align-items: center;
    }
  `]
})
export class EtlServerComponent implements OnInit {

  constructor(private theme: ThemeService, private activatedRoute: ActivatedRoute) {
    activatedRoute. url.subscribe((x) => {
      return;
    });
  }

  ngOnInit(): void {
  }

}
