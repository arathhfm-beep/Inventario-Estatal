import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supa = createClient(
  "https://mktpkopqrzelxigcayqe.supabase.co",
  "sb_publishable_g6n-He351w0iWQfAtmHGkQ_pQm_wHO9"
);

/* ===============================
   Validación de rol estatal
================================ */

const rol = sessionStorage.getItem("rol");

if (rol !== "ESTATAL") {
  alert("Acceso no autorizado");
  window.location.href = "index.html";
}

/* ===============================
   Estado global
================================ */

let inventario = [];

/* ===============================
   Cargar inventario estatal
================================ */

async function cargarInventarioEstatal() {
  const { data, error } = await supa
    .from("v_inventario_estatal")
    .select("*")
    .gt("stock_empaques", 0);

  if (error) {
    console.error(error);
    alert(error.message);
    return;
  }

  inventario = data;

  cargarFiltrosDesdeVista(data);
  aplicarFiltros();
}

/* ===============================
   Cargar filtros desde la vista
================================ */

function cargarFiltrosDesdeVista(data) {
  const selComp = document.getElementById("filtroComponente");
  const selJur = document.getElementById("filtroJurisdiccion");

  selComp.innerHTML = `<option value="">Todos</option>`;
  selJur.innerHTML = `<option value="">Todas</option>`;

  const componentes = new Map();
  const jurisdicciones = new Map();

  data.forEach(r => {
    if (r.id_componente && r.componente) {
      componentes.set(r.id_componente, r.componente);
    }
    if (r.id_jurisdiccion && r.jurisdiccion) {
      jurisdicciones.set(r.id_jurisdiccion, r.jurisdiccion);
    }
  });

  componentes.forEach((nombre, id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = nombre;
    selComp.appendChild(opt);
  });

  jurisdicciones.forEach((nombre, id) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = nombre;
    selJur.appendChild(opt);
  });
}

/* ===============================
   Estado de caducidad
================================ */

function estadoCaducidad(fecha) {
  if (!fecha) return "SIN FECHA";
  const dias = (new Date(fecha) - new Date()) / 86400000;
  if (dias < 0) return "VENCIDO";
  if (dias <= 60) return "PRÓXIMO";
  return "OK";
}

/* ===============================
   Aplicar filtros (en memoria)
================================ */

function aplicarFiltros() {
  const idComponente = document.getElementById("filtroComponente").value;
  const idJurisdiccion = document.getElementById("filtroJurisdiccion").value;
  const filtroCad = document.getElementById("filtroCaducidad").value;

  const filtrado = inventario.filter(r => {
    if (idComponente && r.id_componente !== idComponente) return false;
    if (idJurisdiccion && r.id_jurisdiccion !== idJurisdiccion) return false;

    if (filtroCad) {
      return estadoCaducidad(r.fecha_caducidad) === filtroCad;
    }

    return true;
  });

  renderInventarioEstatal(filtrado);
}

/* ===============================
   Render tabla
================================ */

let ultimoResultado = [];

function renderInventarioEstatal(data) {
  ultimoResultado = data;

  const tbody = document.querySelector("#tablaInventarioEstatal tbody");
  tbody.innerHTML = "";

  data.forEach(r => {
    const alerta = estadoCaducidad(r.fecha_caducidad);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.componente}</td>
      <td>${r.jurisdiccion}</td>
      <td>${r.insumo}</td>
      <td>${r.lote}</td>
      <td class="alerta ${alerta === "VENCIDO" ? "alerta-roja" : alerta === "PRÓXIMO" ? "alerta-ambar" : ""}">
        ${r.fecha_caducidad ?? "—"}
      </td>
      <td>${r.stock_empaques}</td>
      <td class="alerta ${alerta === "VENCIDO" ? "alerta-roja" : alerta === "PRÓXIMO" ? "alerta-ambar" : ""}">
        ${alerta}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarCSV(data) {
  if (!data.length) {
    alert("No hay datos para exportar");
    return;
  }

  const encabezados = Object.keys(data[0]);

  const filas = data.map(row =>
    encabezados.map(h =>
      `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`
    ).join(",")
  );

  const csv = [
    encabezados.join(","),
    ...filas
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "Inventario.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ===============================
   Eventos
================================ */

document
  .getElementById("filtroComponente")
  .addEventListener("change", aplicarFiltros);

document
  .getElementById("filtroJurisdiccion")
  .addEventListener("change", aplicarFiltros);

document
  .getElementById("filtroCaducidad")
  .addEventListener("change", aplicarFiltros);

document
  .getElementById("btnExportar")
  .addEventListener("click", () => exportarCSV(ultimoResultado));

/* ===============================
   Init
================================ */

cargarInventarioEstatal();


