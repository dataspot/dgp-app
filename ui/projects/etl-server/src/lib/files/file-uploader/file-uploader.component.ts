import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { delay } from 'rxjs';
import { ApiService } from '../../api.service';

@Component({
  selector: 'etl-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.less']
})
export class FileUploaderComponent implements OnInit {

  @ViewChild('file', { static: true }) file: ElementRef;
  @Input() filename: string | null;
  @Output() close = new EventEmitter<string>();

  _progress = 0;
  _active = false;
  _success = false;
  _selected = false;

  selectedFile: File | null = null;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.addFiles();
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: FileList = this.file.nativeElement.files;
    console.log(files);
    if (files.length > 0) {
      this.selectedFile = files.item(0);
      if (this.selectedFile) {
        this._selected = true;
        this.active = true;
        this.api.uploadFile(
          this.selectedFile, this.filename || this.selectedFile.name,
          (progress: any) => { this.progress = progress; },
          (success: any) => { this.success = success; }
        );
      }
    }
  }

  set progress(progress: number) {
    if (this._selected && this._active) {
      this._progress = progress;
    }
  }

  set active(active: boolean) {
    if (this._selected) {
      this._active = active;
    }
  }

  set success(success: boolean) {
    if (this._active) {
      this._success = success;
      if (success) {
        let filename = this.selectedFile?.name;
        this.api.queryFiles(false).pipe(
          delay(2000)
        ).subscribe((files) => {
          let found = false;
          for (const file of files) {
            if (file.filename === filename) {
              this.close.emit(filename);
              found = true;
            }
          }
          if (!found) {
            this.success = false;
            console.log(`file not found - ${filename} is not in ${files.map((f: any) => f.filename).join(', ')}`);
          }
        });
      }
      this._active = false;
      this._progress = 100;
    }
  }

}
