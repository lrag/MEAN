import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { App, Credentials } from 'realm-web';
import { Usuario } from 'src/app/entidades/usuario';
import { AutenticacionService } from 'src/app/servicios/autenticacion.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  public mensaje:string = ""

  public usuario:Usuario = new Usuario()

  constructor(private autenticationService:AutenticacionService,
              private router:Router) { 
  }
  
  public entrar():void{
    
  

    this.autenticationService.logIn(this.usuario.correoE,this.usuario.pw)
    .then( usuario => {
      console.log(usuario)
      this.router.navigateByUrl("/aplicacion")
    })
    .catch( error => {
      console.log(error)
      this.mensaje = "Credenciales incorrectas"
    })

  }

}
