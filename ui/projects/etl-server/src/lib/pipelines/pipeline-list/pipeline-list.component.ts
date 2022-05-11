import { Component, OnInit } from '@angular/core';
import { filter, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../api.service';
import { ConfirmerService } from '../../confirmer.service';
import { RolesService } from '../../roles.service';

@Component({
  selector: 'app-pipeline-list',
  templateUrl: './pipeline-list.component.html',
  styleUrls: ['./pipeline-list.component.less']
})
export class PipelineListComponent implements OnInit {

  sortByField: string = '';

  pipelineSections = [];

  constructor(public api: ApiService, public roles: RolesService,
              private confirmer: ConfirmerService) {
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

  executeSuccessful() {
    this.confirmer.confirm(this.confirmer.ACTION_EXECUTE_ALL, null).pipe(
      filter((x) => x),
      switchMap(() => this.api.triggerPipelines('dgp_kind', true)),
    ).subscribe((result) => {
      console.log('EXECUTE SUCCESSFUL RESULT', result);
    });
  }

  sortByChanged (event: any) {
    //update the ui
    this.sortByField = event.target.value;
    if (this.sortByField === 'created-date-up'){
      this.api.pipelines.pipe(
        filter((x: any[]) => (!!x && x.length > 0)),
        take(2)
      ).subscribe((pipelines) =>{
        if (pipelines) {
          pipelines.sort((a, b) => a.creation_date > b.creation_date ? 1 : -1);
          for (const pipeline of pipelines) {
            pipeline.display = pipeline.name;
          }
      
          this.pipelineSections = this.processSections(pipelines, 0);
        }
      });
    } else {
      this.api.pipelines.pipe(
        filter((x: any[]) => (!!x && x.length > 0)),
        take(2)
      ).subscribe((pipelines) =>{
        if (pipelines) {
          pipelines.sort((a, b) => a.creation_date < b.creation_date ? 1 : -1);
          for (const pipeline of pipelines) {
            pipeline.display = pipeline.name;
          }
      
          this.pipelineSections = this.processSections(pipelines, 0);
        }
      });
    }
    
  }

}

