// =============================================
// server.js - Lógica del servidor (Backend)
// Crea el servidor web con Node.js y Express define las rutas HTTP y maneja los datos de las tareas en memoria.
// =============================================


const express = require('express');// Importa la herramienta para crear el servidor. Librería Express.
const app = express();// Crea la aplicación de servidor
const PORT = 3000; // Define el número de puerto donde el servidor escuchará las conexiones. 


app.use(express.json()); // Middleware. TRADUCTOR
// Permite recibir datos en formato JSON desde el cliente

app.use(express.static('public'));//Middleware. Muestra automáticamente los archivos de la carpeta 'public'
//permitiendo que cualquier cliente en la red pueda ver la interfaz de usuario."

// =============================================
// BASE DE DATOS EN MEMORIA RAM
// =============================================
let tareas = [];//Array que sirve como "base de datos" temporal (se borra al apagar el servidor)


// =============================================
// RUTAS HTTP - Define cómo responde el servidor a cada tipo de petición. 
// Cada ruta tiene:
// - Método HTTP (GET, POST, PUT, DELETE)
// - URL de la ruta (/tareas)
// - Función que maneja la petición (req, res)
//   req = request (lo que manda el cliente)
//   res = response (lo que devuelve el servidor)
// =============================================


// RUTA GET /tareas :
// Envía la lista de tareas a quien la pida
// ----------------------------------------------
app.get('/tareas', (req, res) => {
    // res.json() convierte el array "tareas" a
    // formato JSON y lo manda al cliente
    res.json(tareas);
});

// ----------------------------------------------
// RUTA POST /tareas :
// Recibe y guarda una nueva tarea
// ----------------------------------------------
app.post('/tareas', (req, res) => {
    // req.body contiene los datos que mandó app.js
    // Extrae el "nombre" enviado por el usuario
    const { nombre } = req.body;

    if (nombre.includes('<')) {
        return res.status(400).json({ error: 'No se permiten caracteres especiales de HTML' });
    }

    //Validación 1: Que no esté vacío
    // !nombre: si nombre está vacío
    // nombre.trim() === '': si solo tiene espacios
    // status(400) "Bad Request" 
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: 'La caja de texto está vacía' });
    }

    // Validación 2: Que no sea repetido
    //Busca si ya existe una tarea con el mismo nombre.
    // .toLowerCase() convierte a minúsculas.
    const existe = tareas.find(
        t => t.nombre.toLowerCase() === nombre.trim().toLowerCase()
    );
    // Si encontró una tarea igual, devuelve error
    if (existe) {
        return res.status(400).json({ error: 'Esa tarea ya existe' });
    }

    //Crea el objeto de la nueva tarea con:
    // ID: número único basado en la fecha/hora actual
    const tarea = {
        id: Date.now(), //garantiza que no haya duplicados
        nombre: nombre.trim(), //limpiamos nombre
        realizada: false
    };

    // Agrega la nueva tarea al array de tareas
    tareas.push(tarea);

    // Devuelve la tarea creada al cliente como confirmación
    res.json(tarea);
});

// ----------------------------------------------
// RUTA PUT:
// Cambia el estado (Realizada / Pendiente)
// ----------------------------------------------
app.put('/tareas/:id', (req, res) => {
    // Se busca en el array la tarea con ese ID
    const tarea = tareas.find(t => t.id == req.params.id); // req.params.id obtiene el ID de la URL

    // Si no encontró la tarea, devuelve error 404 "Not Found"
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });

    // Cambia el estado al contrario del actual:
    // Si era false (pendiente) -> pasa a true (realizada)
    // Si era true (realizada) -> pasa a false (pendiente)
    tarea.realizada = !tarea.realizada;

    res.json(tarea);// Devuelve la tarea con el estado actualizado
});

// ----------------------------------------------
// RUTA DELETE: Elimina las tareas seleccionadas

// Qué hace: elimina del array las tareas cuyos IDs llegaron en el cuerpo de la petición
// ----------------------------------------------
app.delete('/tareas', (req, res) => {
    // Extrae el array de IDs a eliminar del cuerpo
    const { ids } = req.body;

    // Valida que no esté vacío
    if (!ids || ids.length === 0) {
        return res.status(400).json({ error: 'No hay tareas seleccionadas' });
    }

    // NUEVO array solo con las tareas que NO están en el array de ids a eliminar.
    // !ids.includes(t.id) significa "si el ID de esta tarea NO está en la lista de IDs a eliminar, consérvala"
    tareas = tareas.filter(t => !ids.includes(t.id));

    // Confirmación
    res.json({ mensaje: 'Tareas eliminadas correctamente' });
});


// =============================================
// INICIO DEL SERVIDOR 
// hace que el servidor acepte conexiones desde CUALQUIER dirección IP
// de la red, no solo desde localhost.
// =============================================
app.listen(PORT, '0.0.0.0', () => {
    //mensaje de confirmación en la terminal
    //para ver si el servidor inició correctamente
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);

    console.log(`Accede desde la red en http://<TU_IP>:${PORT}`);
});