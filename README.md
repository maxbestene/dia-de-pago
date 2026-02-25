# Calculadora de Crédito - Prototipo Funcional

Prototipo funcional mobile de solicitud de crédito basado en diseños de Figma.

## Características Implementadas

### ✅ Fase 1: Estructura Base
- HTML semántico optimizado para mobile
- CSS con variables y diseño mobile-first
- Sistema de diseño basado en tokens del Figma

### ✅ Fase 2: Componentes
- **Header**: Botón de retroceso funcional
- **Input de monto**: Display grande con formato de moneda
- **Teclado numérico**: 10 dígitos + decimal + borrar
- **Botón Continuar**: Con estados activo/deshabilitado

### ✅ Fase 3: Lógica
- Ingreso de números con teclado on-screen
- Formato automático de moneda (separadores de miles)
- Validación de límite máximo ($10,000)
- Manejo de decimales (hasta 2 lugares)
- Estados reactivos del botón continuar

### ✅ Fase 4: Interacciones
- Animaciones y transiciones suaves
- Feedback visual en todos los botones
- Soporte de teclado físico (0-9, ,/., Backspace, Enter)
- Feedback háptico (en dispositivos compatibles)
- Cursor parpadeante cuando el monto es 0

## Funcionalidades

1. **Teclado numérico personalizado**
   - Números del 0 al 9
   - Botón decimal (coma)
   - Botón borrar con ícono

2. **Validaciones**
   - Monto máximo: $10,000
   - Solo 2 decimales permitidos
   - No permite múltiples comas decimales
   - Formato automático con separadores de miles

3. **Estados dinámicos**
   - Botón "Continuar" deshabilitado cuando monto = 0
   - Información de cuotas aparece cuando hay monto válido
   - Helper text muestra el límite disponible
   - Botón preset para llenar el máximo al instante

4. **Responsive**
   - Optimizado para mobile (320px - 428px)
   - Se adapta a diferentes alturas de pantalla
   - Funciona en orientación vertical

## Cómo usar

1. **Abrir el prototipo**
   ```bash
   open index.html
   ```
   O arrastrar `index.html` al navegador

2. **Interactuar**
   - Toca los números en el teclado para ingresar el monto
   - Usa la coma para agregar decimales
   - Toca el botón de borrar para eliminar dígitos
   - Toca "Continuar" cuando el monto sea válido
   - Usa el botón "$10.000" para llenar el máximo

3. **Desarrollo local**
   ```bash
   # Si tienes Python instalado
   python3 -m http.server 8000

   # O con Node.js
   npx serve
   ```
   Luego abre: http://localhost:8000

## Estructura del Proyecto

```
credito-calculator/
├── index.html      # Estructura HTML
├── styles.css      # Estilos y diseño
├── script.js       # Lógica y funcionalidad
└── README.md       # Esta documentación
```

## Tecnologías

- **HTML5**: Semántico y accesible
- **CSS3**: Variables CSS, Grid, Flexbox, animaciones
- **JavaScript vanilla**: Sin dependencias externas

## Próximos Pasos

Este prototipo está listo para:
- Conectar con el siguiente paso del flujo (pantalla de confirmación, detalles, etc.)
- Integrar con APIs reales
- Agregar más validaciones de negocio
- Implementar analytics/tracking
- Agregar tests

## Notas

- El diseño está optimizado para mobile (versión nativa/app)
- Los colores y espaciados coinciden con el design system de Figma
- El teclado simula el comportamiento de teclados nativos móviles
- Incluye soporte para teclado físico (útil para testing en desktop)
