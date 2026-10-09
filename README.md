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
