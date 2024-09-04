// src/app/prime-ng.module.ts
import { NgModule } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { SidebarModule } from 'primeng/sidebar';
import { PasswordModule } from 'primeng/password';

import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { MessageModule } from 'primeng/message';

import { CheckboxModule } from 'primeng/checkbox';

import { StyleClassModule } from 'primeng/styleclass';

import { MenuModule } from 'primeng/menu';

import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ChipModule } from 'primeng/chip';
import { OverlayModule } from 'primeng/overlay';


@NgModule({
  exports: [
    MenubarModule,
    InputTextModule,
    ButtonModule,
    TableModule,
    DialogModule,
    CardModule,
    SidebarModule,
    FormsModule,
    TabViewModule,
    MessageModule,
    CheckboxModule,
    StyleClassModule,
    PasswordModule,
    MenuModule,
    RadioButtonModule,
    SelectButtonModule,
    ChipModule,
    OverlayModule,
  ]
})
export class PrimeNgModule { }
