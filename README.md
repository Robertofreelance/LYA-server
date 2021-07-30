Este backend fue hecho con Nodejs y express, se mantuvo lo mas sencillo posible para facilitar el proceso del mismo.

Instrucciones:
usar la cmd o git bash y introducir los comandos:
1)npm install
2)npm start

Se debe crear un .env con la variable de entorno: MONGO_URI. La cual debe contener la url de la base de datos MONGODB

Endpoints: Tiene la documentación en postman pero si no precisa de este basicamente se maneja de esta forma:

/users = returna un array con todos los users
/user(post) = crea un usuario y con su información adicional, body: nombres(string),apellidos(string), email(string),telefono(string),direccion(string),arte(string),musica(string),cine(string).
/user/:email(get) = busca un usuario con el parametro de email que coincida y luego lo retorna.
/user/:email(put) = busca un usuario con el parametro de email que coincida y luego lo actualiza y retorna el resultado, body: nombres(string?),apellidos(string?), email(string?),telefono(string?),direccion(string?),arte(string?),musica(string?),cine(string?).
/adicionales = retorna un array con toda la información adicional brindada.
/user/:email(delete): busca un usuario con el parametro de email que coincida y luego lo elimina y retorna un mensaje de confirmación
/autorization(post): ingresa sus credenciales de usuario y retorna un token para el inicio de sesión, body: email(string), password(string)
/autorization(delete): elimina el token actual para el cierre de sesión.
/messages/send(post): Envia un mensaje via mqtt si el usuario esta validado, body: message(string)