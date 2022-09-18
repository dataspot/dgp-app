import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../store.service';

@Component({
  selector: 'etl-failure-marquee',
  templateUrl: './failure-marquee.component.html',
  styleUrls: ['./failure-marquee.component.less']
})
export class FailureMarqueeComponent implements OnInit {

  error: string | null = null;

  constructor(private store: StoreService) { }

  ngOnInit() {
    this.store.getFailure().subscribe((failure) => {
      this.error = failure;
    });
  }

}
