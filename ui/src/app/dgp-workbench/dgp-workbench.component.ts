import { Component, OnInit, OnDestroy } from '@angular/core';
import { WorkbenchService } from '../workbench.service';
import { ActivatedRoute } from '@angular/router';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-dgp-workbench',
  templateUrl: 'dgp-workbench.component.html',
  styleUrls: ['dgp-workbench.component.less']
})
export class DgpWorkbenchComponent implements OnInit, OnDestroy {

  step = 'extract';
  id = null;
  validation = {};

  constructor(private route: ActivatedRoute, private workbench: WorkbenchService, private store: StoreService) {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id');
      this.store.setPipelineId(this.id);
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.store.setPipelineId(null);
  }

}
