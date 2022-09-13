import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../api.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-taxonomies',
  templateUrl: './taxonomies.component.html',
  styleUrls: ['./taxonomies.component.less']
})
export class TaxonomiesComponent implements OnInit {

  _selected = '';
  selectedTaxonomy: any = null;
  taxonomies: any[] = [];
  JSON = JSON;

  constructor(public api: ApiService) {
    this.api.taxonomies.pipe(first()).subscribe((taxonomies) => {
      this.taxonomies = taxonomies;
    });
    this.api.queryTaxonomies();
  }

  ngOnInit() {
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    this._selected = value;
    this.selectedTaxonomy = null;
    for (const taxonomy of this.taxonomies) {
      if (taxonomy.id === value) {
        this.selectedTaxonomy = taxonomy;
        break;
      }
    }
  }

  changed() {
    this.selectedTaxonomy.column_types = this.selectedTaxonomy.column_types.filter((x: any) => !!x.name);
    this.api.updateTaxonomy(this.selectedTaxonomy)
        .subscribe((result) => {
          console.log('saved');
        });
  }

  nameFromEvent(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  addNew(event: string) {
    const ct = JSON.parse(event);
    this.selectedTaxonomy.column_types.push(ct);
  }

  createNew(name: string) {
    return JSON.stringify({name: name, title: name, dataType: 'string'});
  }
}
