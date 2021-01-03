import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-step-extract-structure',
  templateUrl: './step-extract-structure.component.html',
  styleUrls: ['./step-extract-structure.component.less']
})
export class StepExtractStructureComponent implements OnInit {

  @Input() structure;
  @Output() change = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
  }

  changed() {
    this.change.emit();
  }
}
