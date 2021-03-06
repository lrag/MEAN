const mongoDB = require("mongodb")
const conexionBD  = require("../util/conexionBD")
const validar = require("../util/validacionUtil").validar

//Reglas de validación para los objetos usuario
/*
let reglasInsercion = {
    nombre  : 'required|min:3|max:40',
    login   : 'required|min:5|max:15',
    pw      : 'required|min:5|max:15',
    correoE : 'required|email',
}

let reglasModificacion = {
    nombre    : 'required|min:3|max:40',
    direccion : 'required|min:10|max:200',
    telefono  : 'required|min:9|max:40',
    login     : 'required|min:5|max:15',
    correoE   : 'required|email',
}
*/

let reglas = {
    nombre    : 'required|min:3|max:40',
    login     : 'required|min:5|max:15',
    pw        : 'min:5|max:15',
    correoE   : 'required|email',
    direccion : 'min:10|max:200',
    telefono  : 'min:9|max:40',
}

//Propiedades admitidas en los objetos usuario
let propiedadesUsuario = [ '_id', 'nombre', 'login', 'pw', 'rol', 'correoE', 'idioma', 'telefono', 'direccion' ]

exports.insertarUsuario = function(usuario){
    return new Promise(
        function(resolve, reject){

            //VALIDAR            
            let errores = validar(usuario, propiedadesUsuario, reglas)
            if(errores){
                reject({ codigo:400, descripcion:errores})
                return
            }

            //Por defecto los nuevos usuario son CLIENTES
            usuario.rol = "CLIENTE"

            let coleccionUsuarios = conexionBD.esquema.collection("usuarios")            
            coleccionUsuarios
                .findOne( { login : usuario.login } )
                .then( data => {
                    if(data){
                        //MAL: 400, Ya hay un usuario con ese login
                        reject({ codigo:400, descripcion:"Ya existe un usuario con ese login"})
                        return
                    }

                    return coleccionUsuarios.insertOne( usuario )
                })
                .then( resultado => resolve(resultado.insertedId) )//BIEN: Se ha insertado
                .catch( error => reject({ codigo:500, descripcion:"Ay mamá, que nos hemos matao"}) ) //MAL: 500
        })
}

exports.borrarUsuario = function(_id, autoridad){
    return new Promise( 
        (resolve, reject) => {

            //Autorizacion:
            //Empleados: pueden hacer y deshacer a su antojo con los usuarios
            //Clientes: Un cliente solo puede modificarse a si mismo
            if(autoridad.rol == "CLIENTE" && autoridad._id!=_id){
                reject({ 
                    codigo : 403, 
                    descripcion : "Los usuarios de tipo cliente solo pueden borrarse a si mismos"
                })
                return
            } 

            let coleccionUsuarios = conexionBD.esquema.collection("usuarios")

            //Debemos convertir el string recibido en un ObjectID
            //Aqui iria un try/catch
            _id = new mongoDB .ObjectId(_id)

            coleccionUsuarios
                .deleteOne( { _id : _id }) 
                .then( resultado => {
                    //Con el operador ternario:
                    //(resultado.deletedCount==0) ? reject({ codigo : 404, descripcion: "El usuario no existe "}) : resolve()
                    if(resultado.deletedCount == 0){
                        //MAL : 404
                        reject({ codigo : 404, descripcion: "El usuario no existe "})
                        return 
                    }
                    //BIEN!
                    resolve() //Aqui no tenenemos nada que pasar!
                })
                .catch( error => reject({ codigo: 500, descripcion: "Error en la base de datos"}) ) //MAL : 500
        })
}

exports.modificarUsuario = function(usuario,  //Usuario a modificar
                                    autoridad){ //Usuario que ordena la modificacion. _ID, ROL, login

    return new Promise(
        function(resolve, reject){

            //VALIDAR            
            let errores = validar(usuario, propiedadesUsuario, reglas)
            if(errores){
                reject({ codigo:400, descripcion:errores})
                return
            }

            //Autorizacion:
            //Empleados: pueden hacer y deshacer a su antojo con los usuarios
            //Clientes: Un cliente solo puede modificarse a si mismo
            if(autoridad.rol == "CLIENTE" && autoridad._id!=usuario._id){
                reject({ 
                    codigo : 403, 
                    descripcion : "Los usuarios de tipo cliente solo pueden modificarse a si mismos"
                })
                return
            }

            let coleccionUsuarios = conexionBD.esquema.collection("usuarios")  
            //Creamos un ObjectId a partir del string que hemos recibido
            let _id
            try {
                _id = new mongoDB.ObjectId(usuario._id)
            } catch( e ){
                reject({
                    codigo : 400,
                    descripcion : "Sintaxis incorrecta en el _id"
                })
                return
            }

            coleccionUsuarios
                .findOneAndUpdate(
                    { "_id" : _id },             
                    {
                        $set : {
                            nombre    : usuario.nombre,
                            //Esto no se puede cambiar
                            //login     : usuario.login,
                            //Para cambiar esto haríamos una función específica
                            //pw        : usuario.pw,
                            //Esto no se puede cambiar
                            //rol       : usuario.rol,
                            correoE   : usuario.correoE,
                            direccion : usuario.direccion,
                            telefono  : usuario.telefono,
                            idioma    : usuario.idioma
                        }
                    },
                    {
                        //Con este parámetro opcional le pedimos a MongoDB
                        //que en la respuesta entregue el documento tal cual ha quedado
                        //despues del update
                        returnOriginal : false
                    }
                    )
                .then( resultado => {
                    if(!resultado.value){
                        //MAL: 404
                        reject({ codigo : 404, descripcion: "El usuario no existe"})
                        return
                    }
                    //BIEN!
                    resolve(resultado.value) //
                })
                .catch( error =>  reject({ codigo: 500, descripcion: "Error en la base de datos"}) ) //MAL: 500
        })
}

exports.listarUsuarios = function(autoridad){
    return new Promise(
        function(resolve, reject){

            if(autoridad.rol != "EMPLEADO"){
                reject({ 
                    codigo : 403, 
                    descripcion : "Solo los empleados pueden listar"
                })
                return
            }
            
            let coleccionUsuarios = conexionBD.esquema.collection("usuarios")
            //Find es síncrono y devuelve un cursor
            let cursor = coleccionUsuarios.find()
            //Trabajar con el cursos ya es asíncrono
            cursor
                .toArray()
                .then( documentos => resolve(documentos) )//BIEN
                .catch( error => reject({ codigo: 500, descripcion: "Error en la base de datos"}) ) //MAL: 500
        })
}

exports.buscarUsuario = function(_id, autoridad){
    return new Promise(
        function(resolve, reject){
        
            if(autoridad.rol != "EMPLEADO"){
                reject({ 
                    codigo : 403, 
                    descripcion : "Solo los empleados pueden buscar por id"
                })
                return
            }

            let coleccionUsuarios = conexionBD.esquema.collection("usuarios")

            //Aqui falta el try y el catch
            _id = new mongoDB.ObjectId(_id)

            coleccionUsuarios
                .findOne( { _id : _id } )
                .then( documento => {

                    //Con el operador ternario:
                    //(!documento) ? reject( { codigo: 404, descripcion: "No existe un usuario con ese id" }) : resolve(documento)

                    if(!documento){
                        //MAL: 404
                        reject({ codigo: 404, descripcion: "No existe un usuario con ese id"})
                        return
                    }
                    //BIEN!
                    resolve(documento)
                })
                .catch( error => reject({ codigo: 500, descripcion: "Error en la base de datos"}) ) //MAL: 500
        })
}

exports.buscarPorCredenciales = function(login, pw){
    return new Promise(function(resolve, reject){
        conexionBD
            .esquema
            .collection("usuarios")
            .findOne( { login:login, pw:pw } )
            .then( usuario => {                
                if(!usuario){
                    reject({ codigo: 404, descripcion: "No hay un usuario con esas credenciales"})
                    return
                }
                //Le quitamos el password al usuario por seguridad
                usuario.pw = null
                resolve(usuario)
            })
            .catch( error => {
                console.log(error)
                reject({ codigo: 500, descripcion: "Error en la base de datos"})
            }) //MAL: 500
    })
}
