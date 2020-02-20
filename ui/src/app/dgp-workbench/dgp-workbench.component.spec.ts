import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DgpWorkbenchComponent } from './dgp-workbench.component';

describe('DgpWorkbenchComponent', () => {
  let component: DgpWorkbenchComponent;
  let fixture: ComponentFixture<DgpWorkbenchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DgpWorkbenchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DgpWorkbenchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
