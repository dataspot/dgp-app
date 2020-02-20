import { Component, OnInit, Input } from '@angular/core';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-extra-config-question',
  templateUrl: './extra-config-question.component.html',
  styleUrls: ['./extra-config-question.component.less']
})
export class ExtraConfigQuestionComponent implements OnInit {

  @Input() question: any;
  config = null;
  _value = null;

  constructor(private store: StoreService ) { }

  ngOnInit() {
    this._value = this.question.default;
    this.store.getConfig()
        .subscribe((config) => {
          this.config = config;
          this.extract();
        });

  }

  extract() {
    const key: string = this.question.key;
    const parts = key.split('.');
    let value = this.config;
    while (value && parts.length > 0) {
      const part = parts.shift();
      value = value[part];
    }
    this._value = value;
  }

  insert() {
    const key: string = this.question.key;
    const parts = key.split('.');
    let value = this.config;
    while (parts.length > 1) {
      const part = parts.shift();
      if (!value[part]) {
        value[part] = {};
      }
      value = value[part];
    }
    value[parts[0]] = this._value;
    this.store.setConfig(this.config);
  }

  set value(value) {
    this._value = value;
    this.insert();
  }

  get value() {
    return this._value;
  }
}
