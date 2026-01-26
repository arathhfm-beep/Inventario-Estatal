# 📦 Sistema de Inventarios Estatal

Sistema de inventarios diseñado para el **control estatal de insumos**, con manejo por **Almacenes**, **Jurisdicciones** y **Componentes**, construido sobre **Supabase** y un modelo basado en **movimientos de inventario** (no stock fijo).

Este proyecto permite registrar, auditar y consultar inventarios de forma consistente, evitando descuadres y asegurando reglas claras para cada tipo de usuario y operación.

---

## 🧭 Alcance del sistema

El sistema cubre tres niveles operativos:

* **Vista Estatal** (supervisión y control global)
* **Vista de Componente** (operación completa de inventario)
* **Vista de Jurisdicción** (registro de gastos)

El stock **no se guarda directamente**, sino que se **calcula dinámicamente** a partir de una tabla de movimientos.

---

## 🧱 Arquitectura general

### 🔹 Base de datos

* **Supabase (PostgreSQL)**
* Uso de **funciones SQL** y **triggers** para validaciones críticas
* Seguridad basada en reglas de negocio del lado servidor

### 🔹 Modelo de inventario

* El inventario se calcula a partir de:

  * Entradas
  * Salidas
  * Transferencias
  * Ajustes
  * Gastos

No existe una columna de stock persistente.

---

### 📥📤 Operación

* `movimientos_inventario`

  * Entrada
  * Salida
  * Transferencia
  * Ajuste positivo
  * Ajuste negativo
  * Gasto

---

## ⚙️ Tipos de movimiento

| Tipo de movimiento | Descripción                |
| ------------------ | -------------------------- |
| Stock inicial      | Carga inicial de insumos   |
| Entrada            | Recepción de insumos       |
| Salida             | Salida general             |
| Transferencia      | Movimiento entre almacenes |
| Ajuste positivo    | Corrección por sobrante    |
| Ajuste negativo    | Corrección por faltante    |
| Gasto              | Consumo de insumos         |

---

## 📐 Reglas de negocio clave

### 🔒 Validaciones por trigger

* ❌ No permite stock negativo
* ❌ No permite gastar más de lo disponible
* ❌ Valida almacén y jurisdicción origen/destino
* ❌ Aplica reglas según tipo de insumo

Ejemplo de error controlado:

```
Stock insuficiente. Disponible: X, solicitado: Y
```

---

## 🧪 Tipos de insumos

El sistema distingue entre:

### 🔹 Insumos con gasto parcial

* Se pueden consumir en fracciones
* Ejemplo: presentación de **50 L**, se pueden gastar **5 L**

### 🔹 Insumos con gasto completo

* Se consumen por unidad completa
* Ejemplo: empaques, piezas, frascos

El trigger valida automáticamente el tipo de gasto permitido.

---

## 🖥️ Vistas del sistema

### 🟢 Vista Estatal

**Rol:** Supervisor estatal

**Permite:**

* Visualizar inventario global
* Consultar por:

  * Estado
  * Jurisdicción
  * Almacén
  * Insumo
* Auditoría de movimientos
* Reportes consolidados

**No permite:**

* Movimientos directos de inventario

---

### 🔵 Vista de Componente

**Rol:** Operador de componente

**Permite:**

* Todos los tipos de movimiento:

  * Stock inicial
  * Entrada
  * Salida
  * Transferencia
  * Ajustes
* Gestión completa del inventario

**Uso típico:**

* Almacenes centrales
* Control operativo

---

### 🟠 Vista de Jurisdicción

**Rol:** Usuario jurisdiccional

**Permite:**

* Registrar **gastos** únicamente
* Gasto parcial o completo según insumo

**Restricciones:**

* ❌ No puede hacer entradas
* ❌ No puede hacer transferencias
* ❌ No puede hacer ajustes

---

## 🔄 Flujo de inventario

1. Carga de stock inicial (componente)
2. Entradas por compra o recepción
3. Transferencias a jurisdicciones
4. Registro de gastos desde jurisdicción
5. Ajustes (si aplica)
6. Cálculo dinámico de stock

---

## 🔐 Seguridad

* Validaciones críticas en **SQL (triggers)**
* El frontend no puede violar reglas de negocio
* Evita manipulaciones de stock

---

## 🧮 Cálculo de stock

El stock se obtiene mediante funciones SQL que:

* Suman entradas
* Restan salidas y gastos
* Consideran transferencias
* Agrupan por:

  * Insumo
  * Almacén
  * Jurisdicción

---

## 🛠️ Tecnologías usadas

* **Supabase**
* **PostgreSQL**
* **JavaScript (ESM)**
* **HTML / CSS**
* Triggers y funciones SQL

---

## 📌 Buenas prácticas implementadas

* Inventario basado en movimientos
* Reglas en backend
* Mensajes de error claros
* Separación por roles
* Control de gasto parcial/completo

---

## 🚀 Estado del proyecto

✅ Operativo

🔧 En mejora continua

---

## ✍️ Autor

**Arath Flores**
Sistema de Inventarios Estatal

---
