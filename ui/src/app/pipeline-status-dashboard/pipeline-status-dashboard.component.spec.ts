import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineStatusDashboardComponent } from './pipeline-status-dashboard.component';

describe('PipelineStatusDashboardComponent', () => {
  let component: PipelineStatusDashboardComponent;
  let fixture: ComponentFixture<PipelineStatusDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineStatusDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineStatusDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
