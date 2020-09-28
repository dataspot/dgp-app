import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDataRecordEditAux]'
})
export class DataRecordEditAuxDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
