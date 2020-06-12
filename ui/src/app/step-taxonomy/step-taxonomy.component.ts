import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-step-taxonomy',
  templateUrl: './step-taxonomy.component.html',
  styleUrls: ['./step-taxonomy.component.less']
})
export class StepTaxonomyComponent implements OnInit {

  @Input() taxonomy: any;
  @Output() change = new EventEmitter<void>();

  constructor(private store: StoreService) { }

  ngOnInit() {
  }

  changed() {
    this.change.emit();
  }


}
