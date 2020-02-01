import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-pipeline-status-dashboard',
  templateUrl: './pipeline-status-dashboard.component.html',
  styleUrls: ['./pipeline-status-dashboard.component.less']
})
export class PipelineStatusDashboardComponent implements OnInit {

  total = 0;
  successful = 0;
  failed = 0;

  constructor(private api: ApiService) { 
    this.api.pipelines
      .subscribe((pipelines) => {
        this.total = pipelines.length;
        console.log(pipelines);
        console.log(pipelines.filter((x) => x.status.status === 'success'));
        this.successful = pipelines.filter((x) => x.status.status === 'success').length;
        this.failed = pipelines.filter((x) => x.status.status === 'failed').length;
      })
  }

  ngOnInit() {
  }

}
