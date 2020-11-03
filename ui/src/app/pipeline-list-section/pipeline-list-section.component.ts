import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-pipeline-list-section',
  templateUrl: './pipeline-list-section.component.html',
  styleUrls: ['./pipeline-list-section.component.less']
})
export class PipelineListSectionComponent implements OnInit {

  @Input() root = false;
  @Input() sections = [];

  constructor() { }

  ngOnInit(): void {
  }

}
