import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import {DeviceMotion} from "@ionic-native/device-motion/ngx";
import {User} from "../providers/user/user";
import {Api} from "../providers/api/api";
import {HttpClientModule} from "@angular/common/http";
import {Device} from "@ionic-native/device";
import { WebsocketProvider } from '../providers/websocket/websocket';

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    Api,
    User,
    StatusBar,
    SplashScreen,
    Gyroscope,
    DeviceMotion,
    Device,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    WebsocketProvider
  ]
})
export class AppModule {}
