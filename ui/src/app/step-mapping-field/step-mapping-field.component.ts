import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-mapping-field',
  template: `
    <div class='mapping'>
      <div class='formish'>
        <label class='main'>{{mapping.name}}</label>
        <div class='compound'>
          <input [(ngModel)]='compound' type='checkbox'>
          <small *ngIf='!compound' i18n>Regular</small>
          <small *ngIf='compound' i18n>Normalized</small>
        </div>
      </div>
      <div class='formish'>
        <label i18n>Title:</label>
        <input [(ngModel)]='mapping.title' type='text'>
      </div>
      <div class='formish' *ngIf='!compound'>
        <select [value]='mapping.columnType' (change)='updateMapping($event.target.value); changed()'>
          <option [value]='null'>-</option>
          <option *ngFor='let ct of taxonomy.columnTypes'
                  [value]='ct.name'>{{ct.title}} - {{ct.description}}
          </option>
        </select>
      </div>
      <div class='mapping' *ngIf='compound'>
        <span>
          <select [value]='mapping.normalizeTarget' (change)='mapping.normalizeTarget = $event.target.value; changed()'>
            <option [value]='null'>-</option>
            <option *ngFor='let ct of taxonomy.columnTypes'
                    [value]='ct.title'>{{ct.title}} - {{ct.description}}
            </option>
          </select>
        </span>
        <span class='for' i18n>for</span>
        <app-extendable-keyvalue-list
          [taxonomy]='taxonomy'
          [data]='mapping.normalize || {}'
          (update)='mapping.normalize = $event; changed()'
        ></app-extendable-keyvalue-list>
      </div>
    </div>
`,
  styles: [`
  :host {
    display: block;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
    margin-bottom: 10px;
  }
  .mapping {
    display: flex;
    flex-flow: column;
  }
  .compound {
    flex: 0 1 auto;
  }
  .formish {
    justify-content: space-between;
  }
  .formish > * {
    min-width: 0;
    flex: 1 1 auto;
  }
  label.main {
    font-size: 18px;
    font-weight: bold;
  }
  input[type='checkbox'] {
    margin: 0 5px;
  }
  `]
})
export class StepMappingFieldComponent implements OnInit {

  objectKeys = Object.keys;

  @Input() mapping: any;
  @Input() taxonomy: any;
  @Output() change = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  changed() {
    this.change.emit();
  }

  get compound(): boolean {
    return !!this.mapping.normalize;
  }

  set compound(value: boolean) {
    if (value) {
      delete this.mapping['columnType'];
      this.mapping['normalize'] = {};
      this.mapping['normalizeTarget'] = '';
    } else {
      delete this.mapping['normalize'];
      delete this.mapping['normalizeTarget'];
      this.mapping['columnType'] = '';
    }
  }

  updateMapping(ctName) {
    if (ctName !== 'null') {
      this.mapping.columnType = ctName;
      if (!this.mapping.title) {
        for (const ct of this.taxonomy.columnTypes) {
          if (ct.name === ctName) {
            console.log('updating title to', ct.title);
            this.mapping.title = ct.title;
            break;
          }
        }
      }
    } else {
      delete this.mapping['columnType'];
    }
    this.changed();
  }

}
