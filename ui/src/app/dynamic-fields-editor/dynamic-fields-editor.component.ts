import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-dynamic-fields-editor',
  templateUrl: './dynamic-fields-editor.component.html',
  styleUrls: ['./dynamic-fields-editor.component.less']
})
export class DynamicFieldsEditorComponent implements OnInit {

  @Input() item: any;
  @Input() fields: any[];

  constructor() { }

  ngOnInit() {
  }

}
