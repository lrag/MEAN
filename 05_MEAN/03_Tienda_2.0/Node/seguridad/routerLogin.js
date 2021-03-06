//npm install jsonwebtoken
const express = require("express")
const negocioUsuarios = require("../negocio/negocioUsuarios")
const jwt = require("jsonwebtoken")
const JWTUtil = require("../seguridad/JWTUtil.js")

//Creamos un router para que guarde la petición de login
const router = express.Router()
//La autenticacion con token y SIN ESTADO
//tiene login pero no logout
router.post("/login", login)

//Para renovar el JWT es necesario un token válido!!!
//Esta petición será interceptada por InterceptorAutenticacion
router.post("/renovarJWT", renovarJWT)
//Exportamos el router
exports.router = router

function login(request, response){

    let credenciales = request.body

    console.log("Credenciales:")
    console.log(credenciales.login)
    console.log(credenciales.pw)

    negocioUsuarios
        .buscarPorCredenciales(credenciales.login, credenciales.pw)
        .then( usuario => {

            /*
            jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
                data: 'foobar'
            }, 'secret');
            */
           
           let token = jwt.sign(
               { 
                   _id: usuario._id, 
                   login: usuario.login, 
                   rol: usuario.rol, 
                   exp: Math.floor(Date.now() / 1000) + 40,
                }, 
                JWTUtil.privateKey, 
                { algorithm: 'HS512'}
            )
            /*
            {
                "alg": "HS512",
                "typ": "JWT"
            }
            .
            {
                "_id"   : "5f97004ad6ea7202303089f6"
                "login" : "venancia",
                "roles" : "CLIENTE",
                "iat"   : FECHA_CREACION 
                "exp"   : FECHA DE EXPIRACIÓN
            }
            .
            gdjheruoñvh9by875u6oighbty9p8uytjg9r8phy598tjgb98ytneu98gu986gheu89hdgfugf
            */

            //Colocando el jwt en la cabecera de la respuesta
            //response.setHeader('Authorization','Bearer '+token)
            //response.setHeader('Access-Control-Expose-Headers', 'Authorization') 
            
            let body = {
                usuario : usuario,
                JWT     : token
            }
            response.json(body) 
        })
        .catch( error => {
            console.log("ERROR:")
            console.log(error)
            response.statusCode = error.codigo
            response.json(error) 
        })

}


function renovarJWT(request, response){

    let autoridad = request.autoridad
           
    let token = jwt.sign(
        { 
            _id: autoridad._id, 
            login: autoridad.login, 
            rol: autoridad.rol, 
            exp: Math.floor(Date.now() / 1000) + 60,
        }, 
        JWTUtil.privateKey, 
        { algorithm: 'HS512'}
    )
            
    let body = {
        JWT     : token
    }
    response.json(body) 

}

