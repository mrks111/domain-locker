import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimeNgModule } from '@/app/prime-ng.module';
import DatabaseService from '@/app/services/database.service';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import { Observable } from 'rxjs';

export interface LinkDialogData {
  id?: string;
  link_name?: string;
  link_url?: string;
  link_description?: string;
  domains?: string[];
}

@Component({
  standalone: true,
  selector: 'app-link-dialog',
  imports: [CommonModule, ReactiveFormsModule, PrimeNgModule],
  templateUrl: './edit-link.component.html',
})
export class LinkDialogComponent implements OnInit {
  linkForm: FormGroup;
  domainOptions$: Observable<string[]> | undefined;
  visible = true;

  isEdit: boolean;
  link: LinkDialogData | null;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    public config: DynamicDialogConfig, // Inject config to get passed data
    public ref: DynamicDialogRef // For dialog control
  ) {
    const { link, isEdit } = this.config.data || {};
    this.link = link || null;
    this.isEdit = !!isEdit;

    // Initialize the form
    this.linkForm = this.fb.group({
      link_name: [this.link?.link_name || '', Validators.required],
      link_url: [
        this.link?.link_url || '',
        [Validators.required, Validators.pattern(/^https?:\/\/.+$/)],
      ],
      link_description: [this.link?.link_description || ''],
      domains: [this.link?.domains || []],
    });
  }

  ngOnInit(): void {
    this.domainOptions$ = this.databaseService.listDomainNames();
  }

  onSave(): void {
    if (this.linkForm.invalid) return;
    this.ref.close(this.linkForm.value); // Return data to parent
  }

  onCancel(): void {
    this.ref.close(null); // Dismiss dialog without saving
  }
}
