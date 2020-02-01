import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../api.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-edit-pipeline',
  templateUrl: './edit-pipeline.component.html',
  styleUrls: ['./edit-pipeline.component.less']
})
export class EditPipelineComponent implements OnInit {

  item: any = {params: {}};
  isNew = false;

  constructor(private route: ActivatedRoute, private router: Router, public api: ApiService) {
    this.route.paramMap.pipe(
      switchMap((params) => {
        console.log(params);
        const id = params.get('id');
        if (id === 'new') {
          this.isNew = true;
          return of({});
        }
        return this.api.queryPipeline(id);
      })
    ).subscribe((pipeline) => {
      this.item = pipeline;
      this.item.params = this.item.params || {};
    });
    api.configuration.subscribe(console.log);
  }

  ngOnInit() {
  }

  save() {
    this.api.savePipeline(this.item)
        .subscribe((result) => {
          if (result.id) {
            this.router.navigate(['/']);
          } else {
            console.log('Failed to SAVE!');
          }
        })
  }

  delete() {
    this.api.deletePipeline(this.item.id)
        .subscribe((result) => {
          if (result) {
            this.router.navigate(['/']);
          } else {
            console.log('Failed to DELETE!');
          }
        })
  }

}
