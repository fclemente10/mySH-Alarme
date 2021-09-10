import  {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import { AlertController, NavController, ToastController} from 'ionic-angular';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope';
import { DeviceMotion } from '@ionic-native/device-motion/ngx';

import { Subscription} from "rxjs";
import { Device } from '@ionic-native/device';
import {Alarm, Equipo, User} from "../../providers/user/user";
import  { WebsocketProvider } from "../../providers/websocket/websocket";


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {

  subscription: Subscription;
  enchufado: boolean;
  moved: boolean;
  myDate: string;
  dateArray= [];
  correoElectronico: string

  calib = 0.1;

  public xOrient:any;
  public yOrient:any;
  public zOrient:any;
  public timestamp:any

  equipo: Equipo = {
  serialNumber: '',
  dataTime: '',
  emailCliente: '',
  descripcion: 'mySH App Alarm',
  nombreEquipo: "Alarm",
}

  alarm: Alarm = {
  id: 0,
  serialNumber: '',
  dataTime: '',
  emailCliente: '',
}


  constructor(public navCtrl: NavController,
              private gyroscope: Gyroscope,
              private deviceMotion: DeviceMotion,
              public user: User,
              private device: Device,
              private alertCtrl: AlertController,
              public toastCtrl: ToastController,
              public ws: WebsocketProvider,
              ) {

  }
  ngOnInit() {
    this.enchufado = false;
    this.moved = false;
    this.correoElectronico = localStorage.getItem('emailCliente');
  }

  ngAfterViewInit(){
    if(localStorage.getItem('emailCliente') === null){
      let alert = this.alertCtrl.create({
        title: 'Añadir Correo Electronico',
        inputs: [
          {
            name: 'emailCliente',
            placeholder: 'Email'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: data => {
              console.log('Cancel clicked');
              location.reload();
            }
          },
          {
            text: 'Añadir equipo',
            handler: data => {
              if (data.emailCliente) {
                localStorage.setItem('emailCliente',data.emailCliente )
                this.confirmarCorreo();
              } else {
                let toast = this.toastCtrl.create({
                  message: 'Es necesario un correo Electronico ',
                  duration: 4000,
                  position: 'top'
                });
                toast.present();
                location.reload();
              }
            }
          }
        ]
      });
      alert.present();
    } else this.verificarEquipo()
  }
  verificarEquipo(){
    if(this.device.uuid != null){
    this.user.getEquipo(this.device.uuid).subscribe((resp: any) => {
      console.log('resp=> ');
      console.log(resp.emailCliente);
      let toast = this.toastCtrl.create({
        message: 'Equipo ya Registrado - Enjoy :) para= ' + localStorage.getItem('emailCliente') ,
        duration: 4000,
        position: 'top'
      });
      toast.present();
    }, (err) => {

      let alert = this.alertCtrl.create({
        title: 'Equipo no registrado',
        subTitle:  'Registrar equipo ',
        buttons: [
          {
            text: 'Vale',
            role: 'ok',
            handler: data => {
              console.log('Ok clicked');
              this.registrarEquipo();
            }
          }],
      });
      alert.present();
    });
    }else
    {
      let toast = this.toastCtrl.create({
        message: 'Equipo de pruebas' ,
        duration: 4000,
        position: 'top'
      });
      toast.present();
    }
  }

  confirmarCorreo(){
    let alert2 = this.alertCtrl.create({
      title: 'Confirmar Correo Electronico',
      message: 'Correo= ' + localStorage.getItem('emailCliente') + ' - Serial=  ' + this.device.uuid ,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
            location.reload();
          }
        },
        {
          text: 'Vale',
          handler: () => {
            this.registrarEquipo();
          }
        }
      ]
    });
    alert2.present();
  }

  registrarEquipo(){
    this.equipo.emailCliente = localStorage.getItem('emailCliente');
    this.equipo.dataTime = this.getDataTime();
    this.equipo.serialNumber = this.device.uuid;
    this.equipo.descripcion = "mySH App Alarm";
    this.equipo.nombreEquipo = "Alarm";

    this.user.postEquipo(this.equipo).subscribe((resp) => {
      let toast = this.toastCtrl.create({
        message: 'Equipo Creado' + resp.message,
        duration: 5000,
        position: 'top'
      });
      toast.present();
      location.reload();
    }, (err) => {
      // Unable to log in
      let toast2 = this.toastCtrl.create({
        message: 'Error' + err.message,
        duration: 5000,
        position: 'top'
      });
      toast2.present();
    });
  }

  gyrascope(){
    this.enchufado = true;
    let options: GyroscopeOptions = {
      frequency: 1000
    };

    this.gyroscope.getCurrent(options)
      .then((orientation: GyroscopeOrientation) => {
        console.log(orientation.x, orientation.y, orientation.z, orientation.timestamp);
        this.xOrient=(orientation.x*10).toFixed(3);
        this.yOrient=(orientation.y*10).toFixed(3);
        this.zOrient=(orientation.z*10).toFixed(3);
        this.timestamp=(orientation.timestamp).toFixed(3);
      })
      .catch()

   this.subscription = this.gyroscope.watch()
      .subscribe((orientation: GyroscopeOrientation) => {
        console.log(orientation.x, orientation.y, orientation.z, orientation.timestamp);
        this.xOrient=(orientation.x).toFixed(3);
        this.yOrient=(orientation.y).toFixed(3);
        this.zOrient=(orientation.z).toFixed(3);
        this.timestamp=orientation.timestamp;
        // Verifica si existe movimiento
        if(( Math.abs(this.xOrient) || Math.abs(this.yOrient) || Math.abs(this.zOrient) >= this.calib) &&
          (Math.abs(this.xOrient) || Math.abs(this.yOrient) || Math.abs(this.zOrient) >= this.calib )){
          this.moved = true;
          this.myDate = this.getDataTime();
          this.dateArray.push({'date': this.myDate});
          this.postAlarma();
        }
      });
  }

  getDataTime(): string{
    let currentdate = new Date();
    let datetime =  currentdate.getDate() + "/"
      + (currentdate.getMonth()+1)  + "/"
      + currentdate.getFullYear() + " @ "
      + currentdate.getHours() + ":"
      + currentdate.getMinutes() + ":"
      + currentdate.getSeconds();
    return datetime;
  }

  btnQuitarGyro(){
    this.subscription.unsubscribe();
    this.enchufado = false;
    this.moved = false;
//    this.dateArray = [];
  }

  postAlarma(): void{
    // prepara datos de alarma para servidor
    this.alarm.emailCliente = localStorage.getItem('emailCliente');
    this.alarm.dataTime = this.myDate;
    this.alarm.serialNumber = this.device.uuid;
    const msdn = '{"serial":"'+ this.device.uuid +'"}';

    this.user.postAlarm(this.alarm).subscribe((resp) => {
      let toast = this.toastCtrl.create({
        message: 'Alarma accionada',
        duration: 5000,
        position: 'top'
      });
      toast.present();
    }, (err) => {
      // Unable to log in
      let toast2 = this.toastCtrl.create({
        message: 'Error' + err.message,
        duration: 5000,
        position: 'top'
      });
      toast2.present();
    });
    this.ws.socket$.next(msdn);
    return
  }

  btnBorrar(){
    if(this.dateArray){
      this.user.delAlarm(this.device.uuid).subscribe((resp) => {
        let toast = this.toastCtrl.create({
          message: 'OK' + resp.message,
          duration: 5000,
          position: 'top'
        });
        toast.present();
        this.enchufado = false;
        this.moved = false;
        this.dateArray = [];
        location.reload();
      }, (err) => {
        // Unable to log in
        let toast2 = this.toastCtrl.create({
          message: 'Error' + err.message,
          duration: 5000,
          position: 'top'
        });
        toast2.present();
      });
    }
  }

  btnEnviaWS() {
    const message = ''//this.device.uuid ;
    const msdn = '{"serial":"'+this.device.uuid+'"}';
    this.ws.socket$.next(msdn);
  }
  ngOnDestroy(){

  }
}
