import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { getLocaleDirection } from '@angular/common';
import { ApiService } from './api.service';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  constructor(private api: ApiService, @Inject(LOCALE_ID) public locale: string) {
    this.api.configuration.pipe(first()).subscribe((configuration: any) => {
      const theme = configuration.theme || {};
      console.log('THEME=', configuration);
      console.log('LOCALE=', locale);
      const primary = theme.primary || '#059';
      const primary_dark = theme.primary_dark || '#003b6b';
      const secondary = theme.secondary || '#fff';
      const right = locale === 'he' ? 'left' : 'right;'
      const left = locale === 'he' ? 'right' : 'left;'
      const css = `
          body {
            direction: ${getLocaleDirection(locale)};
          }
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
          h2.workbench-subtitle {
            color: ${secondary};
            background-color: ${primary};
            min-width: 70%;
            padding: 3px 10px;
            margin: 20px -10px;
            font-size: 18px;
            font-weight: bold;
          }
          h3.workbench-subsubtitle {
            color: ${secondary};
            background-color: ${primary};
            min-width: 70%;
            padding: 3px 8px;
            margin: 12px -8px;
            font-size: 16px;
            font-weight: normal;
            margin-${right}: 40px;
          }
          h4.workbench-subsubsubtitle {
            color: ${primary};
            border-${left}: solid 8px ${primary};
            padding: 0px 8px;
            margin-${left}: -16px;
            margin-top: 20px;
            margin-bottom: 8px;
            font-size: 16px;
            font-weight: bold;
          }
          div.workbench-explanation {
            color: ${primary};
            font-size: 14px;
            font-weight: lighter;
          }
      `;
      const style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = css;
      document.getElementsByTagName('head')[0].appendChild(style);
      const scripts = configuration.extraScripts || [];
      for (const scriptContent of scripts) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = scriptContent;
        document.body.appendChild(script);
      }
    });
  }
}
