import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-extra-config-questions',
  templateUrl: './extra-config-questions.component.html',
  styleUrls: ['./extra-config-questions.component.less']
})
export class ExtraConfigQuestionsComponent implements OnInit {

  @Input() questions: any[];

  constructor() { }

  ngOnInit() {
  }

}
