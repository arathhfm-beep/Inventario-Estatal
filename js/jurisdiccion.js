import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supa = createClient(
  "https://mktpkopqrzelxigcayqe.supabase.co",
  "sb_publishable_g6n-He351w0iWQfAtmHGkQ_pQm_wHO9"
);

const idJurisdiccion = sessionStorage.getItem("id_jurisdiccion");

if (!idJurisdiccion) {
  alert("Acceso no válido");
  location.href = "index.html";
}

let idAlmacen = null;

async function obtenerAlmacenUsuario() {
  const { data, error } = await supa
    .from("almacenes")
    .select("id")
    .eq("id_jurisdiccion", idJurisdiccion)
    .single();

  if (error || !data) {
    alert("No se encontró almacén para la jurisdicción");
    return;
  }

  idAlmacen = data.id;
  cargarInventario();
}

/* ===============================
   CARGAR INVENTARIO
   ============================== */
async function cargarInventario() {
  const { data, error } = await supa
    .from("v_movimientos_jurisdiccion")
    .select("*")
    .eq("id_almacen", idAlmacen);

  if (error) {
    alert(error.message);
    return;
  }

  const resumen = {};

  data.forEach(m => {
    const key = m.id_lote;

    if (!resumen[key]) {
      resumen[key] = {
        id_lote: m.id_lote,
        id_almacen: m.id_almacen,
        lote: m.lote,
        insumo: m.insumo,
        presentacion: m.presentacion,
        caducidad: m.fecha_caducidad,
        unidad_completa: m.unidad_completa,
        factor: Number(m.factor_conversion),
        stock_real: 0
      };
    }

    // Usamos movimiento_real de la vista para sumar/restar
    const cantidadReal = Number(m.movimiento_real || 0);

    resumen[key].stock_real += cantidadReal;
  });

  // Recalcular empaques desde stock_real
  Object.values(resumen).forEach(r => {
    r.stock_empaques = r.unidad_completa
      ? Math.floor(r.stock_real / r.factor)
      : Math.ceil(r.stock_real / r.factor);
  });

  renderInventario(resumen);
}

/* ===============================
   RENDER INVENTARIO
   ============================== */
function renderInventario(resumen) {
  const tbody = document.querySelector("#tablaInventario tbody");
  tbody.innerHTML = "";

  Object.values(resumen).forEach(r => {
    if (r.stock_real <= 0) return;

    const cad = r.caducidad
      ? new Date(r.caducidad).toLocaleDateString()
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.lote}<br><small>Cad: ${cad}</small></td>
      <td>${r.insumo}<br><small>${r.presentacion}</small></td>
      <td>
        ${r.stock_empaques}
        <br>
        <small>${r.stock_real} cantidad total</small>
        ${
          r.unidad_completa
            ? '<br><small class="tag-completo">Debe gastarse completo</small>'
            : '<br><small class="tag-parcial">Permite gasto parcial</small>'
        }
      </td>
      <td><button>Registrar salida</button></td>
    `;

    tr.querySelector("button").onclick = () => seleccionarLote(r);

    tbody.appendChild(tr);
  });
}

/* ===============================
   SELECCIONAR LOTE
   ============================== */
let loteActual = null;

function seleccionarLote(r) {
  loteActual = r;

  document.getElementById("id_lote").value = r.id_lote;
  document.getElementById("id_almacen").value = r.id_almacen;
  document.getElementById("loteSeleccionado").innerText =
    `${r.lote} (Cad: ${r.caducidad ? new Date(r.caducidad).toLocaleDateString() : "—"})`;
}

/* ===============================
   REGISTRAR SALIDA
   ============================== */
document.getElementById("formSalida").addEventListener("submit", async e => {
  e.preventDefault();

  if (!loteActual) {
    alert("Seleccione un lote");
    return;
  }

  const cantidad = Number(document.getElementById("cantidad").value);

  if (cantidad <= 0 || Number.isNaN(cantidad)) {
    alert("Cantidad inválida");
    return;
  }

  // Validación mínima en frontend
  if (loteActual.unidad_completa && !Number.isInteger(cantidad)) {
    alert("Este insumo debe gastarse completo");
    return;
  }

  const payload = {
    id_lote: loteActual.id_lote,
    id_almacen_origen: loteActual.id_almacen,
    id_jurisdiccion: idJurisdiccion,
    tipo: "SALIDA",
    cantidad: cantidad,
    folio: document.getElementById("folio").value || null,
    fecha_movimiento: document.getElementById("fecha_movimiento").value,
    observaciones: document.getElementById("observaciones").value || null
  };

  const { error } = await supa
    .from("movimientos_inventario")
    .insert([payload]);

  if (error) {
    alert(error.message);
    return;
  }

  alert("Salida registrada correctamente");
  e.target.reset();
  loteActual = null;
  cargarInventario();
});

document
  .getElementById("btnBuscarMov")
  .addEventListener("click", buscarMovimientos);

document
  .getElementById("busquedaMov")
  .addEventListener("keypress", e => {
    if (e.key === "Enter") buscarMovimientos();
  });

async function buscarMovimientos() {
  const texto = document.getElementById("busquedaMov").value.trim();
  const contenedor = document.getElementById("resultadosMovimientos");

  if (!texto) {
    contenedor.innerHTML = "<p>Escriba algo para buscar.</p>";
    return;
  }

  contenedor.innerHTML = "Buscando...";

  const { data, error } = await supa
    .from("vista_movimientos_jurisdiccion")
    .select("*")
    .eq("id_jurisdiccion", idJurisdiccion)
    .or(`lote.ilike.%${texto}%,nombre_insumo.ilike.%${texto}%`)
    .order("fecha_movimiento", { ascending: false });

  if (error) {
    console.error(error);
    contenedor.innerHTML = "Error al buscar.";
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron movimientos.</p>";
    return;
  }

  contenedor.innerHTML = "";

  data.forEach(mov => {
    const card = document.createElement("div");
    card.className = "card-mov";

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-insumo">${mov.nombre_insumo}</div>
          <div class="card-lote">Lote: ${mov.lote}</div>
        </div>
        <div class="card-cantidad"> ${mov.cantidad}</div>
      </div>

      <div class="card-body">
        <div><strong>Folio:</strong> ${mov.folio}</div>
        <div><strong>Fecha:</strong> ${new Date(mov.fecha_movimiento).toLocaleDateString()}</div>
        ${mov.observaciones ? `<div><strong>Obs:</strong> ${mov.observaciones}</div>` : ""}
      </div>
    `;

    contenedor.appendChild(card);
  });
}



/* ===============================
   INIT
   ============================== */
obtenerAlmacenUsuario();

