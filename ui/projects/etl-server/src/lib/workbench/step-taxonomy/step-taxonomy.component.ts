import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { StoreService } from '../../store.service';

@Component({
  selector: 'etl-step-taxonomy',
  templateUrl: './step-taxonomy.component.html',
  styleUrls: ['./step-taxonomy.component.less']
})
export class StepTaxonomyComponent implements OnInit, OnChanges {

  @Input() taxonomy: any;
  @Output() change = new EventEmitter<void>();
  hidden = false;

  constructor(private store: StoreService) { }

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.taxonomy && this.taxonomy.options && this.taxonomy.options.length === 1) {
      if (!this.taxonomy.id) {
        this.taxonomy.id = this.taxonomy.options[0].id;
        this.changed();
      }
      setTimeout(() => {
        this.hidden = true;
      }, 0);
    }
  }

  set missingValues(missingValues: string) {
    this.taxonomy.missingValues = missingValues.split(',');
    this.taxonomy.missingValues.push('');
  }

  get missingValues() {
    if (this.taxonomy && this.taxonomy.missingValues && Array.isArray(this.taxonomy.missingValues)) {
      return this.taxonomy.missingValues.filter((i: string) => i !== '').join(',');
    }
    return '';
  }

  changed() {
    this.change.emit();
  }


}
