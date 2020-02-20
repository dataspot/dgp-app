import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-steps',
  templateUrl: 'steps.component.html',
  styleUrls: ['steps.component.less']
})
export class StepsComponent implements OnInit {

  @Input() step: string;
  @Input() validation: any;
  @Output() selected = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  select(chosen: string) {
    this.step = chosen;
    this.selected.emit(chosen);
  }

}
