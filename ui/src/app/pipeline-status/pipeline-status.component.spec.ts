import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineStatusComponent } from './pipeline-status.component';

describe('PipelineStatusComponent', () => {
  let component: PipelineStatusComponent;
  let fixture: ComponentFixture<PipelineStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
