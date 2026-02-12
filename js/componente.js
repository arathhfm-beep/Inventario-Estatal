import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supa = createClient(
  "https://mktpkopqrzelxigcayqe.supabase.co",
  "sb_publishable_g6n-He351w0iWQfAtmHGkQ_pQm_wHO9"
);

const rol = sessionStorage.getItem("rol");
const idComponente = sessionStorage.getItem("id_componente");

if (rol !== "COMPONENTE" || !idComponente) {
  alert("Acceso no autorizado");
  location.href = "index.html";
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await cargarInsumos();
  await cargarAlmacenes();
  await cargarResumen();

  document
    .getElementById("id_insumo_lote")
    .addEventListener("change", cargarPresentacionesPorInsumo);

  document
    .getElementById("filtro_almacen")
    .addEventListener("change", cargarResumen);
});

/* ===============================
   INSUMOS
================================ */
async function cargarInsumos() {
  const { data, error } = await supa
    .from("insumos")
    .select("id, nombre, unidad_completa")
    .eq("id_componente", idComponente)
    .order("nombre");

  if (error) return alert(error.message);
   window.insumosMap = {};

  data.forEach(i => {
    window.insumosMap[i.id] = i;
  });

  llenarSelect("id_insumo_pres", data);
  llenarSelect("id_insumo_lote", data);
}

document.getElementById("formInsumo").addEventListener("submit", async e => {
  e.preventDefault();

  const { error } = await supa.from("insumos").insert({
    nombre: nombre_insumo.value,
    categoria: categoria.value,
    id_componente: idComponente,
    unidad_completa: !tipo_gasto.checked
  });
  
  if (error) return alert(error.message);

  e.target.reset();
  cargarInsumos();
});

/* ===============================
   PRESENTACIONES
================================ */
document.getElementById("formPresentacion").addEventListener("submit", async e => {
  e.preventDefault();

  const { error } = await supa.from("presentacion_insumo").insert({
    id_insumo: id_insumo_pres.value,
    description: descripcion.value,
    unidad_medida: unidad_medida.value,
    factor_conversion: Number(factor_conversion.value)
  });

  if (error) return alert(error.message);

  e.target.reset();
});

/* ===============================
   PRESENTACIONES POR INSUMO
================================ */
async function cargarPresentacionesPorInsumo() {
  const idInsumo = id_insumo_lote.value;
  const select = document.getElementById("id_presentacion");

  select.innerHTML = `<option value="">Seleccione presentación</option>`;
  if (!idInsumo) return;

  const { data, error } = await supa
    .from("presentacion_insumo")
    .select("id, description, unidad_medida, factor_conversion")
    .eq("id_insumo", idInsumo)
    .order("description");

  if (error) return alert(error.message);

  data.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.description} (${p.factor_conversion} ${p.unidad_medida})`;
    select.appendChild(opt);
  });
}

/* ===============================
   MOVIMIENTOS
================================ */
document.getElementById("formLote").addEventListener("submit", async e => {
  e.preventDefault();

  const cantidadEmpaques = Number(cantidad.value);
  
 const idInsumo = id_insumo_lote.value;
  const insumo = window.insumosMap[idInsumo];

if (!insumo) {
  alert("Seleccione un insumo válido");
  return;
}

if (cantidadEmpaques <= 0 || Number.isNaN(cantidadEmpaques)) {
  alert("Cantidad inválida");
  return;
}

if (insumo.unidad_completa && !Number.isInteger(cantidadEmpaques)) {
  alert("Este insumo solo permite cantidades enteras");
  return;
}
  const idPresentacion = id_presentacion.value;
  const loteTxt = lote.value.trim();
  const tipo = tipo_movimiento.value;
  const almacenDestino = id_almacen.value;
  const almacenOrigen = document.getElementById("id_almacen_origen")?.value || null;

  /* ===============================
     1. BUSCAR LOTE (GLOBAL POR COMPONENTE)
  ================================ */
  const { data: loteExistente, error: errLote } = await supa
    .from("lotes")
    .select("id")
    .eq("id_presentacion", idPresentacion)
    .eq("lote", loteTxt)
    .eq("id_componente", idComponente)
    .maybeSingle();

  if (errLote) return alert(errLote.message);

  let idLoteFinal;

  /* ===============================
     2. CREAR LOTE SI NO EXISTE
  ================================ */
  if (!loteExistente) {
    const { data: nuevoLote, error } = await supa
      .from("lotes")
      .insert([{
        id_presentacion: idPresentacion,
        lote: loteTxt,
        fecha_caducidad: fecha_caducidad.value || null,
        fecha_llegada: fecha_llegada.value || null,
        proveedor: proveedor.value || null,
        id_componente: idComponente
      }])
      .select("id")
      .single();

    if (error) return alert(error.message);
    idLoteFinal = nuevoLote.id;
  } else {
    idLoteFinal = loteExistente.id;
  }

  /* ===============================
     3. REGISTRAR MOVIMIENTO(S)
  ================================ */
  const folio = `MOV-${Date.now()}`;
  const fecha = new Date().toISOString().split("T")[0];

  const movimientos = [];

  // DONACIÓN = 2 movimientos
  if (tipo === "DONACION_ENTRADA" || tipo === "DONACION_SALIDA") {
    if (!almacenOrigen || !almacenDestino) {
      alert("Debe seleccionar almacén origen y destino");
      return;
    }
    if (tipo === "DONACION_SALIDA") {
  const stockDisponible = await obtenerStockLote(
    idLoteFinal,
    almacenOrigen
  );

  const factor = Number(
  document
    .querySelector("#id_presentacion option:checked")
    .textContent.match(/\((.*?)\)/)[1]
);

const cantidadRealSolicitada = cantidadEmpaques * factor;

if (stockDisponible < cantidadRealSolicitada) {
  alert(
    `Stock insuficiente.\nDisponible: ${stockDisponible}\nSolicitado: ${cantidadRealSolicitada}`
  );
  return;
} 
}
console.log(movimientos);
    movimientos.push(
      {
        folio,
        id_lote: idLoteFinal,
        tipo: "DONACION_SALIDA",
        cantidad: cantidadEmpaques,
        id_almacen_origen: almacenOrigen,
        id_almacen_destino: null,
        id_componente: idComponente,
        fecha_movimiento: fecha
      },
      {
        folio,
        id_lote: idLoteFinal,
        tipo: "DONACION_ENTRADA",
        cantidad: cantidadEmpaques,
        id_almacen_origen: null,
        id_almacen_destino: almacenDestino,
        id_componente: idComponente,
        fecha_movimiento: fecha
      }
    );
  } else {
    // CUALQUIER OTRO MOVIMIENTO
    movimientos.push({
      folio,
      id_lote: idLoteFinal,
      tipo,
      cantidad: cantidadEmpaques,
      id_almacen_destino: almacenDestino,
      id_componente: idComponente,
      fecha_movimiento: fecha
    });
  }

  const { error: errMov } = await supa
    .from("movimientos_inventario")
    .insert(movimientos);

  if (errMov) return alert(errMov.message);

  e.target.reset();
  await cargarResumen();
});

/* ===============================
   RESUMEN
================================ */
async function cargarResumen() {
  const filtroAlmacen = filtro_almacen.value;

  let query;

  // 👉 SIN filtro = resumen global (sin duplicados)
  if (!filtroAlmacen) {
    query = supa
      .from("v_resumen_componente_global")
      .select("*")
      .eq("id_componente", idComponente);
  } 
  // 👉 CON filtro = detalle por almacén
  else {
    query = supa
      .from("v_resumen_componente")
      .select("*")
      .eq("id_componente", idComponente)
      .eq("id_almacen", filtroAlmacen);
  }

  const { data, error } = await query;
  if (error) return alert(error.message);

  const tbody = document.getElementById("tablaResumen");
  tbody.innerHTML = "";
  data.sort((a, b) => {
  if (a.insumo !== b.insumo) {
    return a.insumo.localeCompare(b.insumo, 'es', { sensitivity: 'base' });
  }
  if (a.presentacion !== b.presentacion) {
    return a.presentacion.localeCompare(b.presentacion, 'es', { sensitivity: 'base' });
  }
  return a.lote.localeCompare(b.lote, 'es', { sensitivity: 'base' });
});
 data.forEach(r => {

  let clase = "";
  let textoFecha = "SIN CAD";

  if (r.fecha_caducidad) {
    const hoy = new Date();
    const fechaCad = new Date(r.fecha_caducidad);

    const diffMeses =
      (fechaCad.getFullYear() - hoy.getFullYear()) * 12 +
      (fechaCad.getMonth() - hoy.getMonth());

    textoFecha = r.fecha_caducidad;

    if (diffMeses <= 1) {
      clase = "cad-rojo";
    } else if (diffMeses <= 6) {
      clase = "cad-amarillo";
    }
  } else {
    clase = "cad-gris";
  }

  tbody.insertAdjacentHTML("beforeend", `
    <tr class="${clase}">
      <td>${r.insumo}</td>
      <td>${r.presentacion}</td>
      <td>${r.lote} (${textoFecha})</td>
      <td>${r.cantidad_empaques}</td>
      <td>${r.cantidad_real}</td>
    </tr>
  `);
});

}

/* ===============================
   ALMACENES
================================ */
async function cargarAlmacenes() {
  const { data, error } = await supa
    .from("almacenes")
    .select("id, nombre")
    .eq("id_componente", idComponente)
    .order("nombre");

  if (error) {
    alert(error.message);
    return;
  }

  const selDestino = document.getElementById("id_almacen");
  const selOrigen = document.getElementById("id_almacen_origen");

  selDestino.innerHTML = `<option value="">Almacén destino</option>`;
  selOrigen.innerHTML = `<option value="">Almacén origen</option>`;
  const filtro = document.getElementById("filtro_almacen");
filtro.innerHTML = `<option value="">Todos los almacenes</option>`;

data.forEach(a => {
  const opt = document.createElement("option");
  opt.value = a.id;
  opt.textContent = a.nombre;
  filtro.appendChild(opt);
});

  data.forEach(a => {
    const opt1 = document.createElement("option");
    opt1.value = a.id;
    opt1.textContent = a.nombre;

    const opt2 = opt1.cloneNode(true);

    selDestino.appendChild(opt1);
    selOrigen.appendChild(opt2);
  });
}
async function obtenerStockLote(idLote, idAlmacen) {
  const { data, error } = await supa
    .from("movimientos_inventario")
    .select(`
      tipo,
      cantidad,
      lotes (
        presentacion_insumo (
          factor_conversion
        )
      )
    `)
    .eq("id_lote", idLote)
    .or(
      `id_almacen_origen.eq.${idAlmacen},id_almacen_destino.eq.${idAlmacen}`
    );

  if (error) {
    alert(error.message);
    return 0;
  }

  let stockReal = 0;

  data.forEach(m => {
    const factor = m.lotes.presentacion_insumo.factor_conversion;
    const real = m.cantidad * factor;

    if (
      ["ENTRADA","DONACION_ENTRADA","AJUSTE_POSITIVO","INVENTARIO_INICIAL"]
        .includes(m.tipo)
    ) {
      stockReal += real;
    }

    if (
      ["SALIDA","DONACION_SALIDA","AJUSTE_NEGATIVO"]
        .includes(m.tipo)
    ) {
      stockReal -= real;
    }
  });

  return stockReal;
}



/* ===============================
   UTIL
================================ */
function llenarSelect(id, data, incluirTodos = false) {
  const select = document.getElementById(id);
  select.innerHTML = incluirTodos
    ? `<option value="">Todos</option>`
    : `<option value="">Seleccione</option>`;

  data.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = i.nombre;
    select.appendChild(opt);
  });
}





