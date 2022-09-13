import { TestBed } from '@angular/core/testing';

import { EtlServerService } from './etl-server.service';

describe('EtlServerService', () => {
  let service: EtlServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EtlServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
