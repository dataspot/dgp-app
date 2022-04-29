import { AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../api.service';
import { switchMap, map, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { StoreService } from '../../store.service';
import { RolesService } from '../../roles.service';
import { ConfirmerService } from '../../confirmer.service';
import { DynamicFieldsEditorComponent } from '../../components/dynamic-fields-editor/dynamic-fields-editor.component';

@Component({
  selector: 'app-edit-pipeline',
  templateUrl: './edit-pipeline.component.html',
  styleUrls: ['./edit-pipeline.component.less']
})
export class EditPipelineComponent implements OnInit {

  item: any = {params: {}, schedule: ''};
  isNew = false;
  _valid = false;
  _showVisibility = true;
  @ViewChild('fieldsEditor', {static: false}) fieldsEditor: DynamicFieldsEditorComponent;

  constructor(private route: ActivatedRoute, private router: Router, public api: ApiService,
              public store: StoreService, public roles: RolesService, private confirmer: ConfirmerService) {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const id = params.get('id');
        if (id === 'new') {
          this.isNew = true;
          return api.configuration.pipe(
            map((configuration) => {
              const privateValue = this.processForcePrivate(configuration);
              return {
                private: privateValue,
                kind: configuration.kinds[0].name,
                schedule: 'manual'
              };
            })
          );
        }
        return this.api.queryPipeline(id);
      })
    ).subscribe((pipeline) => {
      this.item = pipeline;
      this.item.params = this.item.params || {};
      this.item.schedule = this.item.schedule || '';
      this.item.kind = this.item.kind || '';
      const d = new Date();
      this.item.creation_date = d.getTime();
    });
  }

  processForcePrivate(configuration) {
    console.log('FP', configuration.features.forcePrivate);
    if (configuration.features.forcePrivate === false) {
      this._showVisibility = false;
      return false;
    } else if (configuration.features.forcePrivate === true) {
      this._showVisibility = false;
      return true;
    } else {
      this._showVisibility = true;
      return true;
    }
  }

  showVisiblity() {
    return this._showVisibility || this.roles._.pipelinesEditAll;
  }

  ngOnInit() {
    this.store.newConfig();
  }

  updateValidity() {
    this._valid = !!this.fieldsEditor && this.fieldsEditor.valid;
  }

  valid() {
    return this.fields.length == 0 || this._valid;
  }

  _save() {
    this.item.private = this.item.private !== 'false' && this.item.private !== false;
    return this.api.savePipeline(this.item);
  }

  save() {
    this._save()
        .subscribe((result) => {
          if (result.id) {
            this.api.queryPipelines();
            this.router.navigate(['/pipelines']);
          } else {
            console.log('Failed to SAVE!');
          }
        });
  }

  dgp() {
    this._save()
        .subscribe((result) => {
          if (result.id) {
            this.router.navigate(['/dgp/' + result.id]);
          } else {
            console.log('Failed to SAVE!');
          }
        });
  }

  delete() {
    this.confirmer.confirm(this.confirmer.ACTION_DELETE_TASK, this.item.name)
      .pipe(
        filter((x) => x),
        switchMap(() => this.api.deletePipeline(this.item.id))
      ).subscribe((result) => {
          if (result) {
            this.router.navigate(['/']);
          } else {
            console.log('Failed to DELETE!');
          }
        });
  }

  get fields() {
    return ((this.api.currentConfig.kinds_map[this.item.kind] || {}).fields) || []
  }

}
