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
   ARRANQUE
   ============================================================= */
cargarTodo();
console.log("Hábitos cargados:", habitos);
console.log("Registros cargados:", registros);
