import { Component, OnInit } from '@angular/core';
import { filter, take } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { RolesService } from '../roles.service';

@Component({
  selector: 'app-pipeline-list',
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.less']
})
export class PipelineListComponent implements OnInit {

  pipelineSections = [];

  constructor(public api: ApiService, public roles: RolesService) {
  }

  processSections(pipelines, level) {
    const sections = {};
    const ret = [];
    for (const pipeline of pipelines) {
      const parts = pipeline.display.split('//');
      if (parts.length === 1) {
        ret.push({type: 'pipeline', item: pipeline});
      } else {
        const section = parts.splice(0, 1)[0];
        pipeline.display = parts.join('//');
        sections[section] = (sections[section] || []);
        sections[section].push(pipeline);
      }
    }
    for (const section of Object.keys(sections)) {
      const contents = this.processSections(sections[section], level + 1);
      ret.push({type: 'section', display: section, items: contents, level: level, open: true});
    }
    return ret;
  }

  ngOnInit() {
    this.api.pipelines.pipe(
      filter((x: any[]) => (!!x && x.length > 0)),
      take(2)
    ).subscribe((pipelines) => {
      if (pipelines) {
        for (const pipeline of pipelines) {
          pipeline.display = pipeline.name;
        }
        this.pipelineSections = this.processSections(pipelines, 0);
      }
    });
    this.api.queryPipelines();
  }

}

