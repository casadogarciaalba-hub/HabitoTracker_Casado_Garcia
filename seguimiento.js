/* =============================================================
   HábitoTracker · Segunda ventana de seguimiento
   Esta ventana NO tiene datos propios: los lee de la ventana
   principal con window.opener y le pide a ella que los cambie.
   Alumna: Alba Casado García
   ============================================================= */

const cuerpoTabla = document.getElementById("cuerpoTabla");
const resumenTabla = document.getElementById("resumenTabla");
const cerrarVentana = document.getElementById("cerrarVentana");

/** Comprueba que la ventana principal sigue abierta y accesible. */
function hayPadre() {
  return window.opener !== null && !window.opener.closed &&
    typeof window.opener.obtenerDatos === "function";
}

/** Convierte "2026-10-09" en "09/10/2026". */
function formatearFecha(fechaISO) {
  const partes = fechaISO.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

/** Escribe una única fila con un mensaje que ocupa toda la tabla. */
function filaMensaje(texto, clase) {
  const fila = document.createElement("tr");
  const celda = document.createElement("td");
  celda.colSpan = 5;
  celda.className = clase;
  celda.textContent = texto;
  fila.appendChild(celda);
  cuerpoTabla.appendChild(fila);
}

/**
 * Pinta la tabla con los datos de la ventana principal.
 * El botón "Cambiar" llama a window.opener.toggleCumplido(id), que
 * modifica el array REAL del padre y guarda en cookie.
 * La ventana principal también llama a esta función cuando cambia algo.
 */
function pintarTabla() {
  cuerpoTabla.innerHTML = "";
  resumenTabla.textContent = "";

  if (!hayPadre()) {
    filaMensaje("La ventana principal está cerrada. Abre esta tabla desde HábitoTracker.", "aviso");
    return;
  }

  const datos = window.opener.obtenerDatos();

  if (datos.registros.length === 0) {
    filaMensaje("No hay registros todavía.", "vacio");
    return;
  }

  const ordenados = datos.registros.slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha);
  });

  ordenados.forEach(function (registro) {
    const habito = datos.habitos.find(function (h) {
      return h.id === registro.habitoId;
    });
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

    const celdaAccion = document.createElement("td");
    const botonCambiar = document.createElement("button");
    botonCambiar.type = "button";
    botonCambiar.className = "boton-cambiar";
    botonCambiar.textContent = "Cambiar";
    botonCambiar.addEventListener("click", function () {
      if (hayPadre()) {
        // Se ejecuta EN LA VENTANA PRINCIPAL y cambia su array
        window.opener.toggleCumplido(registro.id);
      }
      pintarTabla(); // se ve el nuevo estado al instante
    });
    celdaAccion.appendChild(botonCambiar);

    fila.append(celdaHabito, celdaFecha, celdaObs, celdaEstado, celdaAccion);
    cuerpoTabla.appendChild(fila);
  });

  const cumplidos = datos.registros.filter(function (r) { return r.cumplido; }).length;
  const fallados = datos.registros.length - cumplidos;
  resumenTabla.textContent = "Cumplidos: " + cumplidos + " · Fallados: " + fallados +
    " · Total: " + datos.registros.length;
}

cerrarVentana.addEventListener("click", function () {
  window.close();
});

pintarTabla();
