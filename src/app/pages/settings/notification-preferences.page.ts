import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import { GlobalMessageService } from '@services/messaging.service';

interface NotificationChannelField {
  label: string;
  name: string;
  placeholder?: string;
  validator?: any;
}

interface NotificationChannelProvider {
  label: string;
  value: string;
  fields: NotificationChannelField[];
}

interface NotificationChannel {
  name: string;
  formControlName: string;
  requires: NotificationChannelField[];
  providers?: NotificationChannelProvider[];
}

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, DlIconComponent],
  providers: [],
  styles: ['::ng-deep .p-card-content { padding: 0; } '],
})
export default class NotificationPreferencesPage implements OnInit {
  notificationForm!: FormGroup;

  notificationChannels: NotificationChannel[] = [
    {
      name: 'Email',
      formControlName: 'email',
      requires: [
        { label: 'Notification Email', name: 'address', placeholder: 'Enter email', validator: [Validators.required, Validators.email] }
      ]
    },
    {
      name: 'Push Notifications',
      formControlName: 'pushNotification',
      requires: []
    },
    {
      name: 'Web Hook',
      formControlName: 'webHook',
      requires: [
        { label: 'Webhook URL', name: 'url', placeholder: 'Enter webhook URL' }
      ],
      providers: [
        {
          label: 'Ntfy',
          value: 'ntfy',
          fields: [
            { label: 'Topic', name: 'topic', placeholder: 'Enter topic' }
          ]
        },
        {
          label: 'Gotify',
          value: 'gotify',
          fields: [
            { label: 'Token', name: 'token', placeholder: 'Enter token' }
          ]
        },
        {
          label: 'Pushbits',
          value: 'pushbits',
          fields: [
            { label: 'Token', name: 'token', placeholder: 'Enter token' },
            { label: 'User ID', name: 'userId', placeholder: 'Enter user ID' }
          ]
        },
        {
          label: 'Pushbullet',
          value: 'pushbullet',
          fields: [
            { label: 'Access Token', name: 'accessToken', placeholder: 'Enter access token' }
          ]
        },
        {
          label: 'Custom',
          value: 'custom',
          fields: [
            { label: 'Headers', name: 'headers', placeholder: 'Specified as valid JSON' }
          ]
        }
      ],
    },
    {
      name: 'Signal',
      formControlName: 'signal',
      requires: [
        { label: 'Signal Number', name: 'number', placeholder: 'Enter Signal number' },
        { label: 'API Key', name: 'apiKey', placeholder: 'Enter API key' }
      ]
    },
    {
      name: 'Telegram',
      formControlName: 'telegram',
      requires: [
        { label: 'Bot Token', name: 'botToken', placeholder: 'Enter bot token' },
        { label: 'Chat ID', name: 'chatId', placeholder: 'Enter chat ID' }
      ]
    },
    {
      name: 'Slack',
      formControlName: 'slack',
      requires: [
        { label: 'Webhook URL', name: 'webhookUrl', placeholder: 'Enter webhook URL' }
      ]
    },
    {
      name: 'Matrix',
      formControlName: 'matrix',
      requires: [
        { label: 'Homeserver URL', name: 'homeserverUrl', placeholder: 'Enter homeserver URL' },
        { label: 'Access Token', name: 'accessToken', placeholder: 'Enter access token' }
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private globalMessageService: GlobalMessageService,
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    const formGroupConfig: Record<string, FormGroup> = this.notificationChannels.reduce((config, channel) => {
        const channelConfig: { [key: string]: any } = { enabled: [false] };
        channel.requires.forEach(requirement => {
            channelConfig[requirement.name] = ['', requirement.validator || []];
        });

        if (channel.providers) {
            channelConfig['provider'] = [''];
            channel.providers.forEach((provider: NotificationChannelProvider) => {
                provider.fields.forEach((field: NotificationChannelField) => {
                    channelConfig[field.name] = ['', field.validator || []];
                });
            });
        }
        config[channel.formControlName] = this.fb.group(channelConfig) as FormGroup;
        return config;
    }, {} as Record<string, FormGroup>);

    this.notificationForm = this.fb.group(formGroupConfig);
}


  savePreferences() {
    let isValid = true;
    this.notificationChannels.forEach(channel => {
      const channelForm = this.notificationForm.get(channel.formControlName) as FormGroup;
      const isEnabled = channelForm.get('enabled')?.value;

      if (isEnabled) {
        // Apply required validation to each field in enabled sections
        channel.requires.forEach(field => {
          const control = channelForm.get(field.name);
          if (control) {
            control.setValidators([Validators.required].concat(field.validator || []));
            control.updateValueAndValidity();
            if (control.invalid) {
              control.markAsTouched();
              isValid = false;
            }
          }
        });

        // Apply required validation to provider-specific fields if a provider is selected
        if (channel.providers) {
          const selectedProvider = channelForm.get('provider')?.value;
          const provider = channel.providers.find(p => p.value === selectedProvider);

          provider?.fields.forEach(field => {
            const control = channelForm.get(field.name);
            if (control) {
              control.setValidators([Validators.required].concat(field.validator || []));
              control.updateValueAndValidity();
              if (control.invalid) {
                control.markAsTouched();
                isValid = false;
              }
            }
          });
        }
      } else {
        // Clear validators if the section is disabled
        channel.requires.forEach(field => {
          const control = channelForm.get(field.name);
          if (control) {
            control.clearValidators();
            control.updateValueAndValidity();
          }
        });

        if (channel.providers) {
          channel.providers.forEach(provider => {
            provider.fields.forEach(field => {
              const control = channelForm.get(field.name);
              if (control) {
                control.clearValidators();
                control.updateValueAndValidity();
              }
            });
          });
        }
      }
    });

    // Log the entire form data to the console
    console.log('Form Data:', this.notificationForm.value);

    if (isValid) {
      this.globalMessageService.showMessage({
        severity: 'success',
        summary: 'Success',
        detail: 'Preferences saved successfully'
      });
    } else {
      this.globalMessageService.showMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Please complete all required fields for enabled notifications'
      });
    }
  }
}
