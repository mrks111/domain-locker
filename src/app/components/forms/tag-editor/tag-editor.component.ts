import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-tag-editor',
  templateUrl: './tag-editor.component.html',
  styleUrls: ['./tag-editor.component.scss'],
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
})
export class TagEditorComponent {
  @Input() tag: any;

  tagColors: string[] = ['blue', 'green', 'yellow', 'cyan', 'pink', 'indigo', 'teal', 'orange', 'purple', 'red', 'gray'];

  constructor(private messageService: MessageService) {}

  saveTag() {
    if (!this.tag.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Tag name is required',
      });
      return;
    }
    if (this.tag.icon && !this.isValidIcon()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid icon format',
      });
      return;
    }

    // Logic to save the tag, e.g., update the tag in your service
    console.log('Saving tag:', this.tag);
  }

  isValidIcon(): boolean {
    const iconRegex = /^fa-solid fa-[a-z]+$/;
    return iconRegex.test(this.tag.icon);
  }
}
