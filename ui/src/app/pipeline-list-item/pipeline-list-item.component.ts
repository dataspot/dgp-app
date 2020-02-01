import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-pipeline-list-item',
  templateUrl: './pipeline-list-item.component.html',
  styleUrls: ['./pipeline-list-item.component.less']
})
export class PipelineListItemComponent implements OnInit {

  @Input() item: any;

  constructor(public api: ApiService) { }

  ngOnInit() {
  }

}
