import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.less']
})
export class FileUploaderComponent implements OnInit {

  @ViewChild('file', { static: true }) file: ElementRef;
  @Input() filename: string | null;
  @Output() close = new EventEmitter<void>();

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
        this.api.queryFiles();
      }
      this._active = false;
      this._progress = 100;
      setTimeout(() => {
        this.close.emit();
      }, 2000);
    }
  }

}
