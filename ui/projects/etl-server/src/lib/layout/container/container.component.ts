import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.less']
})
export class ContainerComponent implements OnInit {

  constructor(private theme: ThemeService) { }

  ngOnInit() {
  }

}
