import { Component, OnInit } from '@angular/core';
import { ConfirmerService } from '../../confirmer.service';

@Component({
  selector: 'etl-confirmer',
  templateUrl: './confirmer.component.html',
  styleUrls: ['./confirmer.component.less']
})
export class ConfirmerComponent implements OnInit {

  constructor(public srv: ConfirmerService) { }

  ngOnInit() {
  }

}
