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

let idAlmacen=null;
let loteSeleccionado=null;

/* ===============================
OBTENER ALMACEN
================================ */

async function obtenerAlmacenUsuario(){

const {data,error} = await supa
.from("almacenes")
.select("id")
.eq("id_jurisdiccion",idJurisdiccion)
.single();

if(error || !data){
alert("No se encontró almacén");
return;
}

idAlmacen=data.id;

await cargarInventario();
await cargarFolios();
await cargarMovimientosGeosis();

}


/* ===============================
INVENTARIO
================================ */

async function cargarInventario(){

const tbody = document.querySelector("#tablaInventario tbody");

tbody.innerHTML = "Cargando...";

const {data,error} = await supa
.from("vw_folios_disponibles")
.select(`
id_almacen,
insumo,
lote,
fecha_caducidad,
disponible,
unidad_medida,
origen,
description
`)
.eq("id_almacen", idAlmacen);

if(error){
alert(error.message);
return;
}

const resumen = {};

/* agrupar por insumo + lote */

data.forEach(f => {

const key = f.insumo + "_" + f.lote;

if(!resumen[key]){

resumen[key] = {
insumo: f.insumo,
lote: f.lote,
caducidad: f.fecha_caducidad,
unidad: f.unidad_medida,
stock: 0,
botes: 0,
descripcion: f.description,
origen: f.origen || null
};

}

/* sumar stock */

resumen[key].stock += Number(f.disponible || 0);
if(Number(f.disponible) > 0){
resumen[key].botes++;
}
});





/* limpiar tabla */

tbody.innerHTML = "";

/* render filas */

Object.values(resumen).forEach(r => {

const cad = r.caducidad
? new Date(r.caducidad).toLocaleDateString()
: "—";

/* determinar acción */

let accion = "";

if(r.origen === "interno"){

accion = `
<button onclick="abrirFormulario('${r.lote}','${r.insumo}')">
Registrar movimiento
</button>
`;

}else{

accion = `<span style="color:#888">Controlado por GEOSIS</span>`;

}

/* render fila */

tbody.innerHTML += `

<tr>

<td>
${r.lote}
<br>
<small>Cad: ${cad}</small>
</td>

<td>
${r.insumo}
</td>

<td>
${Math.round(r.stock)} ${r.unidad || ""}
<br>
<small>${r.botes} ${r.descripcion}</small>
</td>

<td>
${accion}
</td>

</tr>

`;

});

/* si no hay datos */

if(Object.keys(resumen).length === 0){

tbody.innerHTML = `
<tr>
<td colspan="4" style="text-align:center;color:#777">
Sin inventario disponible
</td>
</tr>
`;

}

}




/* ===============================
FOLIOS DISPONIBLES
================================ */

async function cargarFolios(){

const panel = document.getElementById("panelFolios");

const {data,error} = await supa
.from("vw_folios_disponibles")
.select("*")
.eq("id_almacen", idAlmacen)
.is("origen",null)
.gt("disponible", 0)
.order("insumo");

if(error){
panel.innerHTML = "Error";
return;
}

const grupos = {};

/* agrupar por insumo */

data.forEach(f => {

if(!grupos[f.insumo]) grupos[f.insumo] = [];

grupos[f.insumo].push({
folio: f.folio,
disponible: f.disponible,
unidad: f.unidad_medida
});

});

panel.innerHTML = "";

const maxCols = 10;

Object.entries(grupos).forEach(([insumo, folios]) => {

let html = `
<table>

<thead>
<tr>
<th colspan="${maxCols}">${insumo}</th>
</tr>
</thead>

<tbody>
`;

for(let i = 0; i < folios.length; i++){

if(i % maxCols === 0) html += "<tr>";

html += `
<td>
${folios[i].folio}
<br>
<small>${folios[i].disponible} ${folios[i].unidad || ""}</small>
</td>
`;

if(i % maxCols === maxCols - 1) html += "</tr>";

}

if(folios.length % maxCols !== 0) html += "</tr>";

html += "</tbody></table>";

panel.innerHTML += html;

});

}


/* ===============================
MOVIMIENTOS
================================ */

async function cargarMovimientosGeosis(){

const cont = document.getElementById("movGeosis");
const filtro = document.getElementById("buscarFolio")?.value.trim();

cont.innerHTML = "Cargando...";

let query = supa
.from("vw_movimientos_geosis_jurisdiccion")
.select("*")
.eq("id_almacen", idAlmacen)
.order("nombre_insumo")
.order("folio")
.order("fecha");

if(filtro && filtro.length > 0){
query = query.ilike("folio", `%${filtro}%`);
}

const {data,error} = await query;

if(error){
cont.innerHTML="Error al cargar movimientos";
return;
}

if(!data || data.length===0){
cont.innerHTML="<p>No hay movimientos registrados.</p>";
return;
}

/* ===============================
AGRUPAR POR INSUMO -> FOLIO
================================ */

const grupos = {};

data.forEach(m=>{

if(!grupos[m.nombre_insumo]){
grupos[m.nombre_insumo] = {};
}

if(!grupos[m.nombre_insumo][m.folio]){
grupos[m.nombre_insumo][m.folio] = [];
}

grupos[m.nombre_insumo][m.folio].push(m);

});

/* ===============================
RENDER
================================ */

cont.innerHTML="";

Object.entries(grupos).forEach(([insumo,folios])=>{

let totalInsumo = 0;

let html = `
<div class="card">
<h3>${insumo}</h3>
`;

Object.entries(folios).forEach(([folio,movs])=>{

let totalFolio = 0;

html += `
<table>

<thead>
<tr>
<th colspan="4">Folio ${folio}</th>
</tr>
<tr>
<th>Fecha</th>
<th>Tipo</th>
<th>Cantidad</th>
<th>Operativo</th>
</tr>
</thead>

<tbody>
`;

movs.forEach(m=>{

totalFolio += Number(m.cantidad);

html += `
<tr>
<td>${new Date(m.fecha).toLocaleDateString()}</td>
<td>${m.tipo_operativo}</td>
<td>${m.cantidad}</td>
<td>${m.folio_operativo || "-"}</td>
</tr>
`;

});

html += `
<tr style="font-weight:bold;background:#f5f7fa">
<td colspan="2">Total folio ${folio}</td>
<td>${totalFolio}</td>
<td></td>
</tr>
`;

html += `</tbody></table><br>`;

totalInsumo += totalFolio;

});

html += `
<div style="text-align:right;font-weight:bold">
Total ${insumo}: ${totalInsumo}
</div>
</div>
`;

cont.innerHTML += html;

});

}


/* ===============================
FORMULARIO
================================ */

async function abrirFormulario(lote,insumo){

loteSeleccionado={lote,insumo};

const {data,error}=await supa
.from("vw_folios_disponibles")
.select("folio")
.eq("id_almacen",idAlmacen)
.eq("lote",lote)
.gt("disponible",0)
.order("folio");

if(error){
alert("Error cargando folios");
return;
}

const select=document.getElementById("folioSelect");

select.innerHTML="";

data.forEach(f=>{

select.innerHTML+=`
<option value="${f.folio}">
${f.folio}
</option>
`;

});

document.getElementById("panelFormulario").classList.add("abierto");

}
window.abrirFormulario=abrirFormulario;


/* ===============================
GUARDAR MOVIMIENTO
================================ */

document.getElementById("formGasto").addEventListener("submit",async e=>{

e.preventDefault();

const folio=parseInt(document.getElementById("folioSelect").value);
const cantidad=Number(document.getElementById("cantidadGasto").value);
const fecha=document.getElementById("fechaGasto").value;

const payload={
folio:folio,
nombre_insumo:loteSeleccionado.insumo,
cantidad:cantidad,
fecha:fecha,
tipo_operativo:"SALIDA",
origen:"interno"
};

const {error}=await supa
.from("movimientos_raw")
.insert([payload]);

if(error){
alert(error.message);
return;
}

alert("Gasto registrado");

document.getElementById("formGasto").reset();

document
.getElementById("panelForm")
.classList.remove("abierto");   

cargarInventario();
cargarFolios();
cargarMovimientosGeosis();


});


document
.getElementById("buscarFolio")
.addEventListener("input",cargarMovimientosGeosis);

/* ===============================
INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {

obtenerAlmacenUsuario();

});