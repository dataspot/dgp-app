import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-taxonomy-item',
  templateUrl: './taxonomy-item.component.html',
  styleUrls: ['./taxonomy-item.component.less']
})
export class TaxonomyItemComponent implements OnInit {

  @Input() ct: any;
  @Output() changed = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
  }

  emit() {
    this.changed.emit();
  }

}
