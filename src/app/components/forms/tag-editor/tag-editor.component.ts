import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MessageService } from 'primeng/api';
import DatabaseService from '@services/database.service';
import { Tag } from '@/types/common';

@Component({
  selector: 'app-tag-editor',
  templateUrl: './tag-editor.component.html',
  styleUrls: ['./tag-editor.component.scss'],
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
})
export class TagEditorComponent {
  @Input() tag: Tag | any = {};

  tagColors: string[] = ['blue', 'green', 'yellow', 'cyan', 'pink', 'indigo', 'teal', 'orange', 'purple', 'red', 'gray'];

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
  ) {}

  saveTag() {
    if (!this.tag.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Tag name is required',
      });
      return;
    }
    this.databaseService.updateTag(this.tag).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Tag saved successfully',
        });
      },
      error: (err) => {
        console.error('Error saving tag:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save tag',
        });
      }
    });
  }
  
}
