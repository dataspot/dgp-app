import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtlServerComponent } from './etl-server.component';

describe('EtlServerComponent', () => {
  let component: EtlServerComponent;
  let fixture: ComponentFixture<EtlServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EtlServerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EtlServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
