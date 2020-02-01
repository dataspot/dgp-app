import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineListHeadersComponent } from './pipeline-list-headers.component';

describe('PipelineListHeadersComponent', () => {
  let component: PipelineListHeadersComponent;
  let fixture: ComponentFixture<PipelineListHeadersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineListHeadersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineListHeadersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
