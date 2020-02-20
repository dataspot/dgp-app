import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-step-tabs',
  templateUrl: 'step-tabs.component.html',
  styleUrls: ['step-tabs.component.less']
})
export class StepTabsComponent implements OnInit {

  @Input() selected: string;
  @Input() validation: any = {};
  @Output() change = new EventEmitter<string>();

  constructor(public store: StoreService) { }

  ngOnInit() {
    if (!this.validation.map)     { this.validation.map = {}; }
    if (!this.validation.extract) { this.validation.extract = {}; }
    if (!this.validation.enrich)  { this.validation.enrich = {}; }
    if (!this.validation.publish) { this.validation.publish = {}; }
  }

  select(selected) {
    this.selected = selected;
    this.change.emit(selected);
  }

}
