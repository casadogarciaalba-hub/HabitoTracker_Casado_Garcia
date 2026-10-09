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
  rellenarDesplegable(); // el nuevo hábito aparece en el formulario B
  pintarEstadisticas();
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
   FASE 3 · FORMULARIO B: REGISTRAR DÍAS
   ============================================================= */
const formRegistro = document.getElementById("formRegistro");
const regHabito = document.getElementById("regHabito");
const regFecha = document.getElementById("regFecha");
const regObservaciones = document.getElementById("regObservaciones");
const regCumplido = document.getElementById("regCumplido");
const errorRegistro = document.getElementById("errorRegistro");

/** Devuelve la fecha de hoy en formato AAAA-MM-DD (el que usa input date). */
function hoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return fecha.getFullYear() + "-" + mes + "-" + dia;
}

/**
 * Rellena el desplegable de hábitos recorriendo el array.
 * Cada <option> lleva como value el id del hábito y como texto su nombre.
 */
function rellenarDesplegable() {
  const seleccionado = regHabito.value; // para no perder la elección actual
  regHabito.innerHTML = "";

  const primera = document.createElement("option");
  primera.value = "";
  primera.textContent = habitos.length === 0
    ? "Primero crea un hábito"
    : "-- Elige un hábito --";
  regHabito.appendChild(primera);

  habitos.forEach(function (habito) {
    const opcion = document.createElement("option");
    opcion.value = habito.id;
    opcion.textContent = habito.nombre + " (" + habito.categoria + ")";
    regHabito.appendChild(opcion);
  });

  regHabito.value = buscarHabito(seleccionado) ? seleccionado : "";
}

/**
 * Valida el formulario B, crea el registro con su habitoId
 * y lo añade al array registros.
 */
function crearRegistro(evento) {
  evento.preventDefault();

  const habitoId = regHabito.value;
  const fecha = regFecha.value;

  if (habitoId === "" || !buscarHabito(habitoId)) {
    errorRegistro.textContent = "Elige un hábito del desplegable.";
    regHabito.focus();
    return;
  }

  if (fecha === "") {
    errorRegistro.textContent = "La fecha es obligatoria.";
    regFecha.focus();
    return;
  }

  const registro = {
    id: crearId(),
    habitoId: habitoId,          // relación con el hábito
    fecha: fecha,
    observaciones: regObservaciones.value.trim(),
    cumplido: regCumplido.checked
  };

  registros.push(registro);
  guardarTodo();
  refrescarVistas();

  formRegistro.reset();
  regFecha.value = hoy();
  regHabito.value = habitoId;    // deja elegido el mismo hábito
  errorRegistro.textContent = "";
  console.log("Registro creado:", registro);
}

formRegistro.addEventListener("submit", crearRegistro);

/* =============================================================
   FASE 4 · MENÚ Y MODAL CON LA TABLA
   ============================================================= */
const modal = document.getElementById("modal");
const cerrarModal = document.getElementById("cerrarModal");
const enlaceInicio = document.getElementById("enlaceInicio");
const enlaceSeguimiento = document.getElementById("enlaceSeguimiento");
const cuerpoTabla = document.getElementById("cuerpoTabla");
const resumenTabla = document.getElementById("resumenTabla");

/** Convierte "2026-10-09" en "09/10/2026" para mostrarlo en la tabla. */
function formatearFecha(fechaISO) {
  const partes = fechaISO.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

/** Devuelve una copia de los registros ordenada de la fecha más reciente a la más antigua. */
function registrosOrdenados() {
  return registros.slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha);
  });
}

/**
 * Genera la tabla dentro del modal: una fila por registro con
 * nombre del hábito (buscado por habitoId), fecha, observaciones
 * y estado, más un resumen de cumplidos y fallados.
 */
function pintarTabla() {
  cuerpoTabla.innerHTML = "";

  if (registros.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 5;
    celda.className = "vacio";
    celda.textContent = "No hay registros todavía.";
    fila.appendChild(celda);
    cuerpoTabla.appendChild(fila);
    resumenTabla.textContent = "";
    return;
  }

  registrosOrdenados().forEach(function (registro) {
    const habito = buscarHabito(registro.habitoId);
    const fila = document.createElement("tr");

    const celdaHabito = document.createElement("td");
    celdaHabito.textContent = habito ? habito.nombre : "(hábito borrado)";

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = formatearFecha(registro.fecha);

    const celdaObs = document.createElement("td");
    celdaObs.textContent = registro.observaciones || "—";

    const celdaEstado = document.createElement("td");
    celdaEstado.textContent = registro.cumplido ? "✓ Cumplido" : "✗ Fallado";
    celdaEstado.className = registro.cumplido ? "ok" : "ko";

    // Botón para invertir el estado de este registro
    const celdaAccion = document.createElement("td");
    const botonCambiar = document.createElement("button");
    botonCambiar.type = "button";
    botonCambiar.className = "boton-cambiar";
    botonCambiar.textContent = "Cambiar";
    botonCambiar.addEventListener("click", function () {
      toggleCumplido(registro.id);
    });
    celdaAccion.appendChild(botonCambiar);

    fila.append(celdaHabito, celdaFecha, celdaObs, celdaEstado, celdaAccion);
    cuerpoTabla.appendChild(fila);
  });

  const cumplidos = registros.filter(function (r) { return r.cumplido; }).length;
  const fallados = registros.length - cumplidos;
  resumenTabla.textContent = "Cumplidos: " + cumplidos + " · Fallados: " + fallados +
    " · Total: " + registros.length;
}

/** Muestra el modal quitando la clase "oculto". */
function abrirModal(evento) {
  evento.preventDefault();
  pintarTabla();
  modal.classList.remove("oculto");
  enlaceSeguimiento.classList.add("activo");
  enlaceInicio.classList.remove("activo");
}

/** Oculta el modal poniendo la clase "oculto". */
function ocultarModal() {
  modal.classList.add("oculto");
  enlaceInicio.classList.add("activo");
  enlaceSeguimiento.classList.remove("activo");
}

enlaceSeguimiento.addEventListener("click", abrirModal);

enlaceInicio.addEventListener("click", function (evento) {
  evento.preventDefault();
  ocultarModal();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

cerrarModal.addEventListener("click", ocultarModal);

// Cerrar al pulsar en el fondo oscuro (no dentro de la caja)
modal.addEventListener("click", function (e) {
  if (e.target === this) {
    ocultarModal();
  }
});

// Cerrar con la tecla Escape
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("oculto")) {
    ocultarModal();
  }
});

/* =============================================================
   FASE 5 · CAMBIAR EL ESTADO DESDE LA TABLA
   ============================================================= */
const abrirVentana = document.getElementById("abrirVentana");
let ventanaSeguimiento = null; // referencia a la segunda ventana

/**
 * Invierte el campo cumplido de un registro del array REAL,
 * guarda en cookie y repinta todo lo que lo muestra.
 * Es una función global, así que la segunda ventana puede llamarla con
 * window.opener.toggleCumplido(id).
 * @param {string} id Id del registro
 * @returns {boolean} true si se encontró y se cambió
 */
function toggleCumplido(id) {
  const registro = registros.find(function (r) {
    return r.id === id;
  });
  if (!registro) {
    return false;
  }

  registro.cumplido = !registro.cumplido;
  guardarTodo();
  refrescarVistas();
  console.log("Registro " + id + " ahora cumplido =", registro.cumplido);
  return true;
}

/**
 * Devuelve los datos a la segunda ventana. Como habitos y registros
 * se declaran con let, no son propiedades de window: la hija los
 * pide a través de esta función.
 */
function obtenerDatos() {
  return { habitos: habitos, registros: registros };
}

/** Repinta la tabla del modal y, si está abierta, la de la segunda ventana. */
function refrescarVistas() {
  pintarTabla();
  pintarEstadisticas();

  if (ventanaSeguimiento && !ventanaSeguimiento.closed &&
      typeof ventanaSeguimiento.pintarTabla === "function") {
    ventanaSeguimiento.pintarTabla();
  }
}

// Abre la tabla en una segunda ventana del navegador
abrirVentana.addEventListener("click", function () {
  ventanaSeguimiento = window.open(
    "seguimiento.html",
    "seguimiento",
    "width=760,height=560"
  );
});

/* =============================================================
   FASE 6 · ESTADÍSTICAS Y BORRAR TODO
   ============================================================= */
const totalHabitos = document.getElementById("totalHabitos");
const totalCumplidos = document.getElementById("totalCumplidos");
const totalFallados = document.getElementById("totalFallados");
const porcentaje = document.getElementById("porcentaje");
const borrarTodo = document.getElementById("borrarTodo");

/** Calcula el resumen recorriendo el array de registros con filter. */
function pintarEstadisticas() {
  const cumplidos = registros.filter(function (r) { return r.cumplido; }).length;
  const fallados = registros.filter(function (r) { return !r.cumplido; }).length;
  const exito = registros.length === 0
    ? 0
    : Math.round((cumplidos / registros.length) * 100);

  totalHabitos.textContent = habitos.length;
  totalCumplidos.textContent = cumplidos;
  totalFallados.textContent = fallados;
  porcentaje.textContent = exito + "%";
}

/** Pide confirmación, borra las dos cookies y vacía los arrays. */
function borrarDatos() {
  const seguro = confirm("¿Seguro que quieres borrar todos los hábitos y registros? No se puede deshacer.");
  if (!seguro) {
    return;
  }

  borrarCookie("habitos");
  borrarCookie("registros");
  habitos = [];
  registros = [];

  pintarListaHabitos();
  rellenarDesplegable();
  refrescarVistas();
  console.log("Datos borrados");
}

borrarTodo.addEventListener("click", borrarDatos);

/* =============================================================
   ARRANQUE
   ============================================================= */
cargarTodo();
pintarListaHabitos();
rellenarDesplegable();
pintarEstadisticas();
regFecha.value = hoy();
console.log("Hábitos cargados:", habitos);
console.log("Registros cargados:", registros);
