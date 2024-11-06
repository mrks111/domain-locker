import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import DatabaseService from '@services/database.service';
import { DbDomain } from '@/types/Database';
import { notificationTypes, NotificationType } from '@/app/constants/notification-types';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GlobalMessageService } from '@services/messaging.service';

@Component({
  selector: 'app-edit-domain',
  templateUrl: './edit-domain.page.html',
  styleUrls: ['./edit-domain.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PrimeNgModule],
  providers: [MessageService]
})
export default class EditDomainComponent implements OnInit {
  domainForm: FormGroup;
  domain: DbDomain | undefined;
  notificationTypes: NotificationType[] = notificationTypes;
  public isLoading = true;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private databaseService: DatabaseService,
    private globalMessageService: GlobalMessageService,
  ) {
    this.domainForm = this.fb.group({
      registrar: ['', Validators.required],
      expiryDate: [null, Validators.required],
      tags: [[]],
      notes: [''],
      notifications: this.fb.group({})
    });

    this.notificationTypes.forEach(type => {
      (this.domainForm.get('notifications') as FormGroup).addControl(type.key, this.fb.control(false));
    });
  }

  ngOnInit() {
    const domainName = this.route.snapshot.paramMap.get('domain-name');
    if (domainName) {
      this.loadDomain(domainName);
    } else {
      this.globalMessageService.showMessage({ severity: 'error', summary: 'Error', detail: 'Domain not found' });
      this.router.navigate(['/domains']);
    }
  }

  loadDomain(domainName: string) {
    this.databaseService.getDomain(domainName).subscribe({
      next: (domain) => {
        this.domain = domain;
        this.populateForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading domain:', error);
        this.globalMessageService.showMessage({ severity: 'error', summary: 'Error', detail: 'Failed to load domain' });
        this.router.navigate(['/domains', this.domain!.domain_name]);
        this.isLoading = false;
      }
    });
  }

  populateForm() {
    // Set the main form values
    this.domainForm.patchValue({
      registrar: this.domain!.registrar?.name,
      expiryDate: new Date(this.domain!.expiry_date),
      tags: this.domain!.tags,
      notes: this.domain!.notes
    });
  
    // Set the notification values within the form group
    const notificationsFormGroup = this.domainForm.get('notifications') as FormGroup;
    (this.domain!.notification_preferences || []).forEach((notification: { notification_type: string, is_enabled: boolean }) => {
      const notificationControl = notificationsFormGroup.get(notification.notification_type);
      if (notificationControl) {
        notificationControl.setValue(notification.is_enabled);
      }
    });
  }

  onSubmit() {
    if (this.domainForm.valid) {
      this.isLoading = true;
      const formValue = this.domainForm.value;
  
      // Prepare updated domain data
      const updatedDomain: any = {
        domain: {
          domain_name: this.domain!.domain_name,
          registrar: formValue.registrar,
          expiry_date: formValue.expiryDate,
          notes: formValue.notes,
        },
        tags: formValue.tags,
        notifications: Object.entries(formValue.notifications)
          .map(([notification_type, is_enabled]) => ({ notification_type: notification_type, is_enabled: is_enabled as boolean }))
      };
  
      // Call the database service to update the domain
      this.databaseService.updateDomain(this.domain!.id, updatedDomain).subscribe({
        next: () => {
          this.globalMessageService.showMessage({ severity: 'success', summary: 'Success', detail: 'Domain updated successfully' });
          this.isLoading = false;
          this.router.navigate(['/domains', this.domain!.domain_name]);
        },
        error: (err) => {
          console.error('Error updating domain:', err);
          this.isLoading = false;
          this.globalMessageService.showMessage({ severity: 'error', summary: 'Error', detail: 'Failed to update domain' });
        }
      });
    } else {
      this.globalMessageService.showMessage({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields correctly' });
    }
  }
  
}
