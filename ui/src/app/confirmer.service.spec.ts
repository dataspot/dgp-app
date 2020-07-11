import { TestBed } from '@angular/core/testing';

import { ConfirmerService } from './confirmer.service';

describe('ConfirmerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConfirmerService = TestBed.get(ConfirmerService);
    expect(service).toBeTruthy();
  });
});
