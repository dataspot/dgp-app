import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private api: ApiService) {
    this.api.configuration.pipe(first()).subscribe((configuration: any) => {
      const theme = configuration.theme || {};
      console.log('THEME=', configuration);
      const primary = theme.primary || '#059';
      const primary_dark = theme.primary_dark || '#003b6b';
      const secondary = theme.secondary || '#fff';
      const css = `
          a, a:visited {
              color: ${primary};
          }
          .theme-primary-fg {
            color: ${primary};
          }
          .theme-secondary-fg {
              color: ${secondary} !important;
          }
          .theme-primary-bg {
              background-color: ${primary};
          }
          .theme-secondary-bg {
              background-color: ${secondary};
          }
          .theme-primary-dark-bg {
              background-color: ${primary_dark};
          }
          .theme-primary-dark-border {
              border-color: ${primary_dark};
          }
          .buttons .button {
              color: ${secondary};
              background-color: ${primary};
              border-color: ${primary_dark};
          }
          .buttons .button:hover {
              background-color: ${secondary};
              color: ${primary};
          }
      `;
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = css;
      document.getElementsByTagName('head')[0].appendChild(style);
    });
  }
}
