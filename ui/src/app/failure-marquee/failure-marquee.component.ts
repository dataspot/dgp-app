import { Component, OnInit } from '@angular/core';
import { StoreService } from '../store.service';

@Component({
  selector: 'app-failure-marquee',
  templateUrl: './failure-marquee.component.html',
  styleUrls: ['./failure-marquee.component.less']
})
export class FailureMarqueeComponent implements OnInit {

  error: string = null;
  message: string = null;

  constructor(private store: StoreService) { }

  ngOnInit() {
    this.store.getFailure().subscribe((failure) => {
      this.error = failure;
      if (failure) {
        const parts = failure.split('\n');
        console.log(parts);
        this.message = parts[parts.length - 2];
      } else {
        this.message = null;
      }
    });
  }

}
