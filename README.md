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
