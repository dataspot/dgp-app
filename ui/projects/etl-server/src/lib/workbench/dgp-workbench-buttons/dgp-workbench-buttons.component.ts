import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RolesService } from '../../roles.service';

@Component({
  selector: 'app-dgp-workbench-buttons',
  templateUrl: './dgp-workbench-buttons.component.html',
  styleUrls: ['./dgp-workbench-buttons.component.less']
})
export class DgpWorkbenchButtonsComponent implements OnInit {

  @Input() status: string;
  @Output() finalize = new EventEmitter<boolean>();

  constructor(private roles: RolesService) { }

  ngOnInit(): void {
  }

  submit() {
    this.finalize.emit(true);
  }

  save() {
    this.finalize.emit(false);
  }

  submittable() {
    return !this.roles._.pipelinesExecute && this.status === 'complete';
  }
}
