import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DlIconComponent } from '@components/misc/svg-icon.component';

interface NotificationChannel {
  name: string;
  formControlName: string;
  requires: { label: string; name: string; placeholder?: string; validator?: any }[];
  providers?: { label: string; value: string; fields: { label: string; name: string; placeholder?: string; validator?: any }[] };
}

@Component({
  selector: 'app-notification-preferences',
  templateUrl: './notification-preferences.page.html',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, DlIconComponent],
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
            { label: 'Headers', name: 'headers', placeholder: 'Specified as valid JSON', value: '{}' }
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
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    const formGroupConfig = this.notificationChannels.reduce((config, channel) => {
      const channelConfig: any = { enabled: [false] };
      channel.requires.forEach(requirement => {
        channelConfig[requirement.name] = ['', requirement.validator || []];
      });
      if (channel.providers) {
        channelConfig.provider = [''];
        channel.providers.forEach(provider => {
          provider.fields.forEach(field => {
            channelConfig[field.name] = ['', field.validator || []];
          });
        });
      }
      config[channel.formControlName] = this.fb.group(channelConfig);
      return config;
    }, {});

    this.notificationForm = this.fb.group(formGroupConfig);
  }
}
