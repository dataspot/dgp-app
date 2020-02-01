import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineListItemComponent } from './pipeline-list-item.component';

describe('PipelineListItemComponent', () => {
  let component: PipelineListItemComponent;
  let fixture: ComponentFixture<PipelineListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PipelineListItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
