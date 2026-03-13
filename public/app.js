
// =============================================
// app.js - Lógica del cliente (Frontend)
// Este archivo maneja toda la interacción del usuario con la interfaz y se comunica con el
// servidor mediante fetch (peticiones HTTP)
// =============================================

// Array local que guarda una copia de las tareas que vienen del servidor. Se actualiza cada vez que se hace un cambio.
let tareas = [];

// Hace una petición GET al servidor para obtener todas las tareas guardadas y las almacena en el
// array local "tareas". Luego llama a renderizar() para mostrarlas en pantalla.
// "async" significa que la función puede esperar respuestas del servidor sin bloquear la página.
async function cargarTareas() {
    // fetch('/tareas') hace una petición HTTP GET
    // al servidor en la ruta /tareas
    const res = await fetch('/tareas');

    // .json() convierte la respuesta del servidor (que viene en formato JSON) a un array de JS
    tareas = await res.json();

    // Llama a renderizar para mostrar las tareas actualizadas en la página
    renderizar();
}

// Genera todas las tareas en la página HTML.
// Separa las tareas en dos listas:
// Tareas por hacer (realizada = false)
// Tareas realizadas (realizada = true)
function renderizar() {
    // Obtiene el elemento <ul> de tareas por hacer
    const listaPorHacer = document.getElementById('listaPorHacer');

    // Obtiene el elemento <ul> de tareas realizadas
    const listaRealizadas = document.getElementById('listaRealizadas');

    // Limpia las listas antes de volver a generar para evitar que se dupliquen las tareas
    listaPorHacer.innerHTML = '';
    listaRealizadas.innerHTML = '';

    // Recorre cada tarea del array y crea su elemento visual en la página
    tareas.forEach(t => {
        // Crea un elemento <li> para cada tarea
        const li = document.createElement('li');

        // Crea un checkbox para seleccionar la tarea (permite marcarla como realizada o eliminarla)
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; // tipo checkbox

        // Guarda el ID de la tarea en el checkbox para identificarla cuando se haga clic
        checkbox.dataset.id = t.id;
        
        // BOTÓN DE ESTADO - Para marcar como realizada
        // Este botón es el único que cambia el estado de la tarea entre "por hacer" y "realizada"
        const btnEstado = document.createElement('button');

        // El texto del botón cambia según el estado actual:
        // Si ya está realizada -> muestra "Deshacer"
        // Si está pendiente -> muestra "Realizada"
        btnEstado.textContent = t.realizada ? 'Deshacer' : 'Realizada';

        // Al hacer clic en el botón, llama a cambiarEstado() con el ID de esa tarea específica
        btnEstado.addEventListener('click', () => cambiarEstado(t.id));

        // Agrega el checkbox al elemento <li>
        li.appendChild(checkbox);

        // Agrega el nombre de la tarea como texto
        // Los espacios ' ' separan visualmente los elementos
        li.appendChild(document.createTextNode(' ' + t.nombre + ' '));

        // Agrega el botón de estado al elemento <li>
        li.appendChild(btnEstado);

        // Decide en qué lista colocar la tarea según su estado actual
        if (t.realizada) {
            // Si está realizada → va a la lista de realizadas
            listaRealizadas.appendChild(li);
        } else {
            // Si está pendiente → va a la lista por hacer
            listaPorHacer.appendChild(li);
        }
    });
}

// Lee el texto del input, valida que no esté vacío ni sea duplicado, y manda la nueva tarea al
// servidor con una petición POST.
async function agregarTarea() {
    // Obtiene el elemento input donde el usuario escribe
    const input = document.getElementById('nuevaTarea');

    // .trim() elimina espacios en blanco al inicio y final
    const nombre = input.value.trim();

    //Si el input está vacío, muestra alerta y detiene la función con "return"
    if (!nombre) {
        alert('La caja de texto está vacía');
        return; // Sale de la función, no hace nada más
    }

    // Hace una petición HTTP POST al servidor enviando el nombre de la nueva tarea en formato JSON
    const res = await fetch('/tareas', {
        method: 'POST', // Tipo de petición: crear dato
        headers: { 'Content-Type': 'application/json' }, // Indica que se manda JSON
        body: JSON.stringify({ nombre }) // Convierte el objeto a texto JSON
    });

    // Convierte la respuesta del servidor a objeto JS
    const data = await res.json();

    // Si el servidor responde con error (tarea duplicada o vacía), muestra la alerta.
    // res.ok es false cuando el servidor devuelve error
    if (!res.ok) {
        alert(data.error); // Muestra el mensaje de error del servidor
        return; // Sale de la función
    }

    // Limpia el input después de agregar exitosamente
    input.value = '';

    // Recarga las tareas del servidor para mostrar la nueva tarea en la lista
    cargarTareas();
}

// Cuando el usuario hace clic en el botón "Realizada" o "Deshacer", esta función manda una petición PUT
// al servidor para cambiar el estado de esa tarea (de "por hacer" a "realizada" o viceversa).
// El checkbox ya NO llama a esta función.
async function cambiarEstado(id) {
    // Petición HTTP PUT al servidor con el ID de la tarea
    // El servidor busca esa tarea y cambia su estado
    await fetch(`/tareas/${id}`, { method: 'PUT' });

    // Recarga las tareas para reflejar el cambio en pantalla
    // La tarea cambiará de lista automáticamente
    cargarTareas();
}

// Elimina las tareas que están marcadas con checkbox.
// Recibe un parámetro "soloRealizadas":
// false-> elimina de la lista "por hacer"
// true-> elimina de la lista "realizadas"
async function eliminarSeleccionadas(soloRealizadas) {
    // Obtiene TODOS los checkboxes que están marcados en toda la página
    const checkboxes = document.querySelectorAll('input[type=checkbox]:checked');

    // Array donde se guardarán los IDs a eliminar
    const ids = [];

    // Recorre cada checkbox marcado
    checkboxes.forEach(cb => {
        // Busca la tarea que corresponde a ese checkbox comparando el dataset.id del checkbox con el id de la tarea
        const tarea = tareas.find(t => t.id == cb.dataset.id);

        // Solo agrega el ID si la tarea pertenece a la sección correcta (realizada o no realizada)
        // Esto evita que el botón "Eliminar" de una sección elimine tareas de la otra sección
        if (tarea && tarea.realizada === soloRealizadas) {
            ids.push(tarea.id);
        }
    });

    //Si no hay ninguna tarea seleccionada con checkbox, muestra alerta y no hace nada
    if (ids.length === 0) {
        alert('No hay tareas seleccionadas para eliminar');
        return;
    }

    // Manda petición HTTP DELETE al servidor con los IDs de las tareas que se deben eliminar
    await fetch('/tareas', {
        method: 'DELETE', // Tipo de petición: eliminar dato
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }) // Manda el array de IDs a eliminar
    });

    // Recarga las tareas para reflejar los cambios y las tareas eliminadas ya no aparecerán 
    cargarTareas();
}

//botones
// Conecta cada botón del HTML con su función.
// Esto reemplaza el uso de onclick="" en el HTML,
// Botón "Agrega tarea" -> llama a agregarTarea()
document.getElementById('btnAgregar')
    .addEventListener('click', agregarTarea);

// Botón "Eliminar" de tareas por hacer
// Llama a eliminarSeleccionadas(false) donde false indica que elimina tareas NO realizadas
document.getElementById('btnEliminarPorHacer')
    .addEventListener('click', () => eliminarSeleccionadas(false));

// Botón "Eliminar" de tareas realizadas Llama a eliminarSeleccionadas(true) donde 
// true indica que elimina tareas SÍ realizadas
document.getElementById('btnEliminarRealizadas')
    .addEventListener('click', () => eliminarSeleccionadas(true));

// Cuando la página carga, inmediatamente pide las tareas al servidor para mostrarlas
cargarTareas();

        