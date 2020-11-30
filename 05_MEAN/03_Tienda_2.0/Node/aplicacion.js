const fs = require("fs")
const https = require("https")
const express = require('express')
const mongoose = require('mongoose')
const mongooseUtil = require('./util/mongooseUtil')
const bodyParser = require("body-parser")
const usuarios = require("./servicios_rest/usuariosRest")
const productos = require("./servicios_rest/productosRest")
const pedidos = require("./servicios_rest/pedidosRest")
const JWTUtil = require("./seguridad/JWTUtil.js")
const routerLogin = require("./seguridad/routerLogin.js")
const interceptorAutenticacion = require("./seguridad/interceptorAutenticacion").interceptorAutenticacion

console.log("Arrancando...")

//Creamos la clave para los JWT
JWTUtil.crearClaveJWT()

//Conectamos con la base de datos
//mongooseUtil.conectarBBDD(arrancarServidor)

const negocioPedidos = require("./negocio/negocioPedidos")
mongooseUtil.conectarBBDD(arrancarServidor)

function arrancarServidor(){

    let app = express()

    //Esperamos jotasones en los bodys
    app.use(bodyParser.json())

    //Esta función se llamará para TODAS las peticiones recibidas
    //Si se la asignamos a un router (router.use(funcion)) se aplicará solo a las peticiones 
    //relacionadas con él
    app.use(interceptorLog, 
            interceptorCors,
            interceptorAutenticacion)

    //Le indicamos a express que utilice los router que hemos definido
    app.use(routerLogin.router)
    app.use(usuarios.router)
    app.use(productos.router)
    app.use(pedidos.router)

    app.disable('x-powered-by')

    //Arrancamos el servidor
    let cert = {
        key  : fs.readFileSync("./certificado/server.key"),
        cert : fs.readFileSync("./certificado/server.cert") 
    }
    https.createServer(cert, app).listen(9000, function(){
        console.log("Esperando peticiones https en el puerto 9000")
    })

}

//                          //
// Interceptores de express //
//                          //

function interceptorLog(request, response, next){
    console.log("------------------------------------------------------------------")
    console.log("Peticion recibida: "+request.method+" "+request.url+". "+new Date())
    next()
}

function interceptorCors(request, response, next){
    console.log("Interceptor CORS")
    
    response.header("Access-Control-Allow-Origin", "*")
    response.header('Access-Control-Allow-Methods', 
                    'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    response.header("Access-Control-Allow-Headers", 
                    "Origin, X-Requested-With, Content-Type, Accept, Authorization")  

    //Si ha sido un OPTIONS no tiene sentido que continuemos procesando
    //la peticion
    if(request.method.toUpperCase() == "OPTIONS"){
        response.end()
        return
    }
    
    next()
}

