# HábitoTracker

Gestor de hábitos con registros diarios y tabla de seguimiento.

Práctica avanzada del **RA3** · Desarrollo Web en Entorno Cliente · 2º DAW
IES Juan García Valdemora · Alumna: **Alba Casado García**

## Cómo abrirlo

Abre `index.html` con **Live Server** (clic derecho → *Open with Live Server*).
Con doble clic (`file://`) las cookies no funcionan.

## Modelo de datos

- Un hábito: `{ id, nombre, descripcion, categoria }`
- Un registro: `{ id, habitoId, fecha, observaciones, cumplido }`

Cada registro apunta a su hábito mediante `habitoId`, igual que una clave ajena en una base de datos.

---

## Fase 1 · Persistencia con JSON (criterio g)

Funciones: `guardarCookie`, `leerCookie`, `borrarCookie`, `guardarTodo` y `cargarTodo`.

**Ciclo objeto → JSON → cookie → objeto**

1. `JSON.stringify(habitos)` convierte el array de objetos en un texto.
2. `encodeURIComponent(texto)` codifica los caracteres conflictivos.
3. Se guarda con `document.cookie = "habitos=...; expires=...; path=/"`.
4. Al leer se hace al revés: se busca la cookie, `decodeURIComponent` y `JSON.parse`, y se recupera el array tal cual.

**¿Por qué hace falta `encodeURIComponent`?** Una cookie tiene el formato `nombre=valor; atributo; atributo`. El JSON trae comas, comillas, espacios, tildes y a veces `;`. Un `;` dentro del valor cortaría la cookie y el resto se perdería. `encodeURIComponent` lo convierte todo en caracteres seguros (`%3B`, `%22`...).

**try/catch:** si alguien edita la cookie a mano o se corta, `JSON.parse` lanzaría un error y pararía todo el programa. Con `try/catch` se avisa por consola y se devuelve `null`, y la app arranca con el array vacío.

Se usan **dos cookies**: `habitos` y `registros`. `guardarTodo()` guarda las dos de golpe.

Prueba en consola:

```js
guardarCookie("prueba", [{ a: 1 }, { b: "hola; adiós" }]);
leerCookie("prueba");   // -> [{ a: 1 }, { b: "hola; adiós" }]
borrarCookie("prueba");
```

## Fase 2 · Formulario A: crear hábitos (criterio e)

**Estructura de un hábito**

```js
{
  id: "lq3k9x2ab1c",          // único: Date.now() en base 36 + parte aleatoria
  nombre: "Beber 2 litros de agua",
  descripcion: "Repartido durante el día",
  categoria: "Salud"          // Salud, Estudio, Ocio, Deporte o Trabajo
}
```

**Validación** (en `crearHabito`):

- `evento.preventDefault()` para que el formulario no recargue la página.
- El nombre, quitando espacios con `trim()`, no puede estar vacío.
- No puede haber dos hábitos con el mismo nombre (se comprueba con `some`, sin distinguir mayúsculas).
- Si algo falla se muestra el error en rojo bajo el formulario y se pone el foco en el campo.

Si todo está bien: se crea el objeto, `habitos.push(habito)`, `guardarTodo()`, `formHabito.reset()` y se repinta la lista.

La lista se pinta con `createElement` y `textContent` (no con `innerHTML`), así un texto con etiquetas HTML no se ejecuta.

## Fase 3 · Formulario B: registrar días (criterios e + d)

**Estructura de un registro**

```js
{
  id: "lq3kb1z9f0a",
  habitoId: "lq3k9x2ab1c",    // id del hábito al que pertenece
  fecha: "2026-10-09",
  observaciones: "Me costó por la tarde",
  cumplido: true
}
```

**Cómo se rellena el desplegable por código** (`rellenarDesplegable`):

1. Se vacía el `<select>` con `innerHTML = ""`.
2. Se añade una primera opción vacía ("-- Elige un hábito --").
3. Se recorre `habitos` con `forEach` y por cada uno se crea un `<option>` con `createElement`: el `value` es el **id** del hábito y el texto es su nombre y su categoría.
4. Se llama al arrancar la página y **cada vez que se crea un hábito**, así el desplegable siempre está al día.

**Relación registro → hábito:** el registro no copia el nombre del hábito, solo guarda su `habitoId` (el `value` de la opción elegida). Cuando hace falta el nombre se busca con `buscarHabito(registro.habitoId)`, que usa `habitos.find(...)`. Si se cambiara el nombre del hábito, todos sus registros lo verían cambiado, como una clave ajena en una base de datos.

**Validación:** tiene que haber un hábito elegido que exista en el array y una fecha. La fecha se rellena por defecto con la de hoy.

## Fase 4 · Menú y ventana flotante (modal) con la tabla (criterio d)

**Menú:** `<nav id="menu">` con dos enlaces, *Inicio* y *Ver seguimiento*. El enlace activo se resalta con la clase `activo`.

**Cómo funciona el modal:**

- En el HTML hay una capa `<div id="modal" class="modal oculto">` con una caja interior (título, botón ✕ y tabla).
- En el CSS, `.modal` usa `position: fixed; inset: 0;` para tapar toda la pantalla, con fondo `rgba(0, 0, 0, .6)` para que se vea la página oscurecida detrás. La caja interior tiene `max-width` y va centrada con flexbox.
- La clase `.oculto` tiene `display: none`.
- En el JS, *Ver seguimiento* hace `modal.classList.remove("oculto")` y la ✕ hace `modal.classList.add("oculto")`.
- También se cierra al pulsar en el fondo oscuro (`e.target === this`, es decir, el clic ha sido en la capa y no dentro de la caja) y con la tecla Escape.

**Modal vs `window.open`:** el modal **no es otra ventana**. Es un `div` de la misma página que se muestra u oculta cambiando una clase: comparte el mismo `document`, las mismas variables y el mismo array. `window.open` abre una ventana (o pestaña) nueva del navegador, con su propio documento y sus propias variables, y para hablar con la ventana principal necesita `window.opener`.

**La tabla** se genera por código en `pintarTabla()`: una fila por registro (ordenados por fecha, de más reciente a más antigua). El nombre del hábito se busca con su `habitoId`, el estado se pinta con ✓ en verde o ✗ en rojo, y debajo va el resumen de cumplidos y fallados, que se cuentan con `filter`.

## Fase 5 · Cambiar el estado desde la tabla (criterios e + g)

Cada fila de la tabla tiene un botón **Cambiar** que llama a `toggleCumplido(id)`:

```js
function toggleCumplido(id) {
  const registro = registros.find(r => r.id === id);
  registro.cumplido = !registro.cumplido;   // true <-> false
  guardarTodo();                            // se guarda en cookie
  refrescarVistas();                        // se repinta la tabla
}
```

`find` devuelve **el mismo objeto** que está dentro del array (no una copia), así que al cambiar `registro.cumplido` se cambia el array real.

**Segunda ventana con `window.opener`:** en el modal hay un botón *Abrir en otra ventana* que hace `window.open("seguimiento.html", ...)`. Esa ventana no tiene datos propios:

- **`window.opener`** es la referencia que tiene la ventana hija a la ventana que la abrió. Desde ella se puede usar cualquier función global del padre.
- Para pintar, la hija pide los datos con `window.opener.obtenerDatos()`.
- El botón *Cambiar* de la hija ejecuta `window.opener.toggleCumplido(id)`. La función se ejecuta **en la ventana principal**, cambia su array, guarda la cookie y repinta el modal. Después la hija vuelve a pintar su tabla y se ve el nuevo estado al instante.
- En sentido contrario, el padre guarda la referencia que devuelve `window.open` (`ventanaSeguimiento`). Si se añade un registro o se cambia un estado desde la principal, llama a `ventanaSeguimiento.pintarTabla()` y la segunda ventana también se actualiza.
- Si la ventana principal se cierra, `hayPadre()` lo detecta (`window.opener.closed`) y se muestra un aviso en vez de dar error.

Así un botón de la segunda ventana cambia los datos de la primera: es comunicación entre ventanas (criterio f).
