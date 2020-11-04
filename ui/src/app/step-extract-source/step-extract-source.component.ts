import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-step-extract-source',
  templateUrl: 'step-extract-source.component.html',
  styles: []
})
export class StepExtractSourceComponent implements OnInit {

  @Input() source;
  @Input() loader;
  @Output() update = new EventEmitter<string>();

  constructor(public api: ApiService) {
  }

  ngOnInit() {
  }

  changed(config?: any) {
    if (config) {
      config.__revision = -1;
    }
    this.update.emit(config);
  }

}
