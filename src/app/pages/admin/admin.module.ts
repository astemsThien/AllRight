import {NgModule} from '@angular/core';
import {DevExtremeModule} from 'devextreme-angular';
import {TranordComponent} from './tranord/tranord.component';
import {CommonModule} from '@angular/common';
import {TranordmassComponent} from './tranordmass/tranordmass.component';
import {TranordstatusComponent} from './tranordstatus/tranordstatus.component';
import {TranordallocateComponent} from './tranordallocate/tranordallocate.component';
import {TranordaccidentComponent} from './tranordaccident/tranordaccident.component';
import {PopupModule} from '../popup/popup.module';
import { AstemsComponent } from './astems/astems.component';
import { Astems02Component } from './astems02/astems02.component';
import { Astems03Component } from './astems03/astems03.component';
import { Astems04Component } from './astems04/astems04.component';
import { Astems05Component } from './astems05/astems05.component';

@NgModule({
  declarations: [
    TranordComponent,
    TranordmassComponent,
    TranordstatusComponent,
    TranordallocateComponent,
    TranordaccidentComponent,
    AstemsComponent,
    Astems02Component,
    Astems03Component,
    Astems04Component,
    Astems05Component
  ],
  imports: [
    DevExtremeModule,
    CommonModule,
    PopupModule
  ]
})
export class AdminModule {
}
