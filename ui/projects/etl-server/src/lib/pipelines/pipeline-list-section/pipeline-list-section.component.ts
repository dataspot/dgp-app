import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'etl-pipeline-list-section',
  templateUrl: './pipeline-list-section.component.html',
  styleUrls: ['./pipeline-list-section.component.less']
})
export class PipelineListSectionComponent implements OnInit {

  @Input() root = false;
  @Input() sections: any[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
