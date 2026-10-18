# Cómo editar el contenido

Todo el contenido de la app está en esta carpeta, en archivos JSON que
puedes editar con cualquier editor de texto. No hace falta tocar código.

```
server/data/
├── app.json                      Textos del encabezado de la app
└── sessions/
    ├── sesion-01.json            Una sesión por archivo (hasta sesion-10.json)
    ├── ...
    └── _plantilla-sesion.json    Plantilla para copiar (la app NO la carga)
```

## Reglas del diseño

- **Máximo 10 sesiones**: los archivos se llaman `sesion-01.json` a
  `sesion-10.json`. Un archivo con otro número o con otro nombre se ignora.
- **Máximo 10 preguntas por sesión**. Si pones más, solo se usan las
  primeras 10 válidas.
- **Solo opción múltiple** (2 a 6 opciones, una correcta).
- Un error en un archivo (JSON mal escrito, una pregunta incompleta) no
  tumba la app: esa sesión o pregunta se omite y el resto funciona. Para
  ver qué se omitió y por qué, ejecuta `npm run validate` desde la raíz del
  proyecto (o desde `server/`).

## Crear o reemplazar una sesión

1. Copia `sessions/_plantilla-sesion.json` como `sessions/sesion-NN.json`
   (por ejemplo `sesion-03.json`; si ya existe, edítalo directamente).
2. Cambia `title`, `description` y las preguntas.
3. Ejecuta `npm run validate`.
4. Reinicia el servidor (intranet) o haz commit y push (Vercel).

## Formato de una sesión

```json
{
  "title": "Muestreo y cuantización",
  "description": "Del mundo analógico al digital.",
  "shuffleQuestions": true,
  "questions": [
    {
      "prompt": "¿Qué fenómeno ocurre al muestrear por debajo de Nyquist?",
      "options": [
        { "id": "a", "text": "Aliasing" },
        { "id": "b", "text": "Saturación" },
        { "id": "c", "text": "Ruido térmico nulo" }
      ],
      "correctOptionId": "a",
      "explanation": "Las frecuencias altas se pliegan sobre las bajas."
    }
  ]
}
```

| Campo | ¿Obligatorio? | Descripción |
|---|---|---|
| `title` | Sí | Título de la sesión (se muestra en la lista). |
| `description` | No | Texto corto bajo el título. |
| `shuffleQuestions` | No | `true` (por defecto) baraja el orden de las preguntas en cada intento; `false` las muestra en el orden del archivo. |
| `questions` | Sí | Lista de preguntas (máx. 10). |

### Campos de cada pregunta

| Campo | ¿Obligatorio? | Descripción |
|---|---|---|
| `prompt` | Sí | Enunciado. |
| `options` | Sí | De 2 a 6 opciones `{ "id": "a", "text": "..." }`. Los `id` deben ser distintos entre sí (se muestran en mayúscula como A, B, C…). |
| `correctOptionId` | Sí | El `id` de la opción correcta. |
| `explanation` | No | Se muestra después de responder. Recomendada. |
| `image` | No | Imagen de la pregunta (ver abajo). |
| `id` | No | Identificador único dentro de la sesión. Si lo omites se genera uno (`sesion-03-q01`, …). |

Los textos son texto plano: puedes escribir `<`, `>` o `&` sin problema
(por ejemplo «fs < 2B»). No se interpreta HTML.

## Imágenes

```json
"image": {
  "url": "img/mi-figura.png",
  "alt": "Descripción de la imagen para quien no pueda verla",
  "caption": "Pie de figura opcional, p. ej. la fuente."
}
```

- `url` es **obligatoria**. Puede ser:
  - **Una imagen local**: guarda el archivo en `public/img/` y usa la ruta
    `img/nombre-del-archivo.png`. Funciona sin internet y también dentro
    del APK (queda empaquetada con la app). **Es la opción recomendada**.
  - **Un enlace web** `https://...`: es cómodo, pero el dispositivo
    necesita internet, y la imagen puede cambiar o desaparecer si su
    dueño la mueve. Si no carga, la app muestra un aviso en su lugar.
- `alt` es muy recomendable (accesibilidad). Si falta, `npm run validate`
  te avisa.
- `caption` es opcional.
- El estudiante puede tocar la imagen para verla ampliada.
- Formatos que funcionan en el navegador y en Android: PNG, JPG, WebP, SVG.
  Procura imágenes de menos de ~500 KB.
- **Derechos de autor**: usa imágenes propias o con licencia que permita
  su uso, y menciona la fuente en `caption` cuando la licencia lo exija.
  Para imágenes de Wikimedia Commons, revisa la licencia en la página del
  archivo.

Ejemplo de imagen web de Wikimedia Commons (así está en la sesión 6):

```
https://commons.wikimedia.org/wiki/Special:FilePath/NOMBRE_DEL_ARCHIVO.svg?width=600
```

(`NOMBRE_DEL_ARCHIVO.svg` es el nombre exacto del archivo en Commons, y
`?width=600` pide una versión de ese ancho.)

## Textos del encabezado: `app.json`

```json
{
  "eyebrow": "Programa de Telecomunicaciones, ESPOL",
  "title": "Telecom Q&A",
  "subtitle": "Elige una sesión de clase y practica con preguntas de opción múltiple.",
  "sessionsLabel": "Elige una sesión"
}
```

Cambia aquí el texto pequeño sobre el título (`eyebrow`), el título, el
subtítulo y la frase que encabeza la lista de sesiones. Cualquier campo que
omitas usa un valor por defecto.

## ¿Prefieres escribir las preguntas en Excel?

Puedes armar una hoja con una fila por pregunta (sesión, enunciado,
opciones A–D, letra correcta, explicación) y convertirla a estos archivos
JSON con un pequeño script. Si lo necesitas, pídelo y se prepara.
