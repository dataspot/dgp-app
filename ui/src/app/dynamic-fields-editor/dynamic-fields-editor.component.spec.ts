import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFieldsEditorComponent } from './dynamic-fields-editor.component';

describe('DynamicFieldsEditorComponent', () => {
  let component: DynamicFieldsEditorComponent;
  let fixture: ComponentFixture<DynamicFieldsEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicFieldsEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicFieldsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
