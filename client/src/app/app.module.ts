import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignInComponent } from './authenticated/signIn.component';
import { ChatModule } from './chat/chat.module';
import { GlobalStateReducer } from './global.state';
import { RoomListComponent } from './room-list/room-list.component';
import { RoomCreationComponent } from './room/room-creation.component';
import { SignUpComponent } from './user/sign-up/sign-up.component';

const mqttOptions: IMqttServiceOptions = {
  host: environment.mqtt.HOST,
  port: environment.mqtt.WS_PORT,
};

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    RoomListComponent,
    RoomCreationComponent,
    SignUpComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ChatModule,
    MqttModule.forRoot(mqttOptions)
  ],
  providers: [
    GlobalStateReducer,
    { provide: 'initState', useValue: {}}
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
