/* =============================================================
   HábitoTracker · Gestor de hábitos con registros
   Desarrollo Web en Entorno Cliente · 2º DAW · RA3
   Alumna: Alba Casado García
   ============================================================= */

console.log("HábitoTracker iniciado");

/* -------------------------------------------------------------
   DATOS DE LA APLICACIÓN
   Dos arrays de objetos relacionados por id:
     hábito   -> { id, nombre, descripcion, categoria }
     registro -> { id, habitoId, fecha, observaciones, cumplido }
   ------------------------------------------------------------- */
let habitos = [];
let registros = [];

/* =============================================================
   FASE 1 · PERSISTENCIA CON JSON EN COOKIES
   ============================================================= */

/**
 * Guarda cualquier valor (array, objeto, número...) en una cookie.
 * objeto -> JSON.stringify -> encodeURIComponent -> cookie
 * @param {string} nombre  Nombre de la cookie
 * @param {*}      valor   Dato a guardar
 * @param {number} dias    Días hasta que caduque (365 por defecto)
 */
function guardarCookie(nombre, valor, dias = 365) {
  const texto = encodeURIComponent(JSON.stringify(valor));
  const caducidad = new Date();
  caducidad.setTime(caducidad.getTime() + dias * 24 * 60 * 60 * 1000);
  document.cookie = nombre + "=" + texto +
    "; expires=" + caducidad.toUTCString() +
    "; path=/; SameSite=Lax";
}

/**
 * Lee una cookie y deshace los dos pasos del guardado.
 * cookie -> decodeURIComponent -> JSON.parse -> objeto
 * Si no existe o está corrupta devuelve null.
 * @param {string} nombre Nombre de la cookie
 * @returns {*} El dato recuperado o null
 */
function leerCookie(nombre) {
  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    const posicion = cookie.indexOf("=");
    const clave = cookie.substring(0, posicion);

    if (clave === nombre) {
      const valor = cookie.substring(posicion + 1);
      try {
        return JSON.parse(decodeURIComponent(valor));
      } catch (error) {
        // La cookie existe pero su contenido no es JSON válido
        console.warn("Cookie '" + nombre + "' corrupta, se ignora:", error.message);
        return null;
      }
    }
  }
  return null;
}

/**
 * Borra una cookie poniéndole una fecha de caducidad pasada.
 * @param {string} nombre Nombre de la cookie
 */
function borrarCookie(nombre) {
  document.cookie = nombre + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

/** Guarda los dos arrays de golpe, cada uno en su propia cookie. */
function guardarTodo() {
  guardarCookie("habitos", habitos);
  guardarCookie("registros", registros);
}

/** Recupera los dos arrays. Si no hay cookie empieza con un array vacío. */
function cargarTodo() {
  habitos = leerCookie("habitos") || [];
  registros = leerCookie("registros") || [];
}

/* =============================================================
   UTILIDADES
   ============================================================= */

/** Genera un id único combinando la fecha actual y un número aleatorio. */
function crearId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Busca un hábito por su id. Devuelve el objeto o undefined. */
function buscarHabito(id) {
  return habitos.find(function (habito) {
    return habito.id === id;
  });
}

/* =============================================================
   FASE 2 · FORMULARIO A: CREAR HÁBITOS
   ============================================================= */
const formHabito = document.getElementById("formHabito");
const habNombre = document.getElementById("habNombre");
const habDescripcion = document.getElementById("habDescripcion");
const habCategoria = document.getElementById("habCategoria");
const errorHabito = document.getElementById("errorHabito");
const listaHabitos = document.getElementById("listaHabitos");

/**
 * Valida el formulario, crea el objeto hábito y lo añade al array.
 * Validación: nombre obligatorio y que no esté repetido.
 */
function crearHabito(evento) {
  evento.preventDefault(); // que el formulario no recargue la página

  const nombre = habNombre.value.trim();

  if (nombre === "") {
    errorHabito.textContent = "El nombre del hábito es obligatorio.";
    habNombre.focus();
    return;
  }

  const repetido = habitos.some(function (habito) {
    return habito.nombre.toLowerCase() === nombre.toLowerCase();
  });
  if (repetido) {
    errorHabito.textContent = "Ya tienes un hábito con ese nombre.";
    habNombre.focus();
    return;
  }

  const habito = {
    id: crearId(),
    nombre: nombre,
    descripcion: habDescripcion.value.trim(),
    categoria: habCategoria.value
  };

  habitos.push(habito);
  guardarTodo();

  formHabito.reset();
  errorHabito.textContent = "";
  pintarListaHabitos();
  console.log("Hábito creado:", habito);
}

/** Pinta la lista de hábitos creados recorriendo el array. */
function pintarListaHabitos() {
  listaHabitos.innerHTML = "";

  if (habitos.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "vacio";
    vacio.textContent = "Todavía no has creado ningún hábito.";
    listaHabitos.appendChild(vacio);
    return;
  }

  habitos.forEach(function (habito) {
    const li = document.createElement("li");

    const nombre = document.createElement("strong");
    nombre.textContent = habito.nombre;

    const categoria = document.createElement("span");
    categoria.className = "categoria";
    categoria.textContent = habito.categoria;

    li.append(nombre, categoria);

    if (habito.descripcion) {
      const descripcion = document.createElement("span");
      descripcion.className = "descripcion";
      descripcion.textContent = habito.descripcion;
      li.appendChild(descripcion);
    }

    listaHabitos.appendChild(li);
  });
}

formHabito.addEventListener("submit", crearHabito);

/* =============================================================
   ARRANQUE
   ============================================================= */
cargarTodo();
pintarListaHabitos();
console.log("Hábitos cargados:", habitos);
console.log("Registros cargados:", registros);
