import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supa = createClient(
"https://mktpkopqrzelxigcayqe.supabase.co",
"sb_publishable_g6n-He351w0iWQfAtmHGkQ_pQm_wHO9"
);

const rol = sessionStorage.getItem("rol");
const idComponente = sessionStorage.getItem("id_componente");

if (rol !== "VECTORES" || !idComponente) {
alert("Acceso no autorizado");
location.href="index.html";
}

/* ===============================
INIT
================================ */

document.addEventListener("DOMContentLoaded", async () => {

await cargarInsumos();
await cargarAlmacenes();
await cargarResumen();
await cargarPanelFolios();

document
.getElementById("id_insumo_lote")
.addEventListener("change", cargarPresentacionesPorInsumo);

document
.getElementById("filtro_almacen")
.addEventListener("change",cargarResumen);

document
.getElementById("filtro_almacen")
.addEventListener("change", async ()=>{

await cargarResumen();
await cargarPanelFolios();

});


});


/* ===============================
INSUMOS
================================ */

async function cargarInsumos(){

const {data,error}=await supa
.from("insumos")
.select("id,nombre,unidad_completa")
.eq("id_componente",idComponente)
.order("nombre");

if(error) return alert(error.message);

window.insumosMap={};

data.forEach(i=>{
window.insumosMap[i.id]=i;
});

llenarSelect("id_insumo_pres",data);
llenarSelect("id_insumo_lote",data);

}

document.getElementById("formInsumo").addEventListener("submit",async e=>{

e.preventDefault();

const {error}=await supa.from("insumos").insert({

nombre:nombre_insumo.value,
categoria:categoria.value,
id_componente:idComponente,
unidad_completa:!tipo_gasto.checked

});

if(error) return alert(error.message);

e.target.reset();
cargarInsumos();

});

/* ===============================
PRESENTACIONES
================================ */

document.getElementById("formPresentacion").addEventListener("submit",async e=>{

e.preventDefault();

const {error}=await supa.from("presentacion_insumo").insert({

id_insumo:id_insumo_pres.value,
description:descripcion.value,
unidad_medida:unidad_medida.value,
factor_conversion:Number(factor_conversion.value)

});

if(error) return alert(error.message);

e.target.reset();

});

/* ===============================
PRESENTACIONES POR INSUMO
================================ */

async function cargarPresentacionesPorInsumo(){

const idInsumo=id_insumo_lote.value;

const select=document.getElementById("id_presentacion");

select.innerHTML=`<option value="">Seleccione</option>`;

if(!idInsumo) return;

const {data,error}=await supa
.from("presentacion_insumo")
.select("id,description,unidad_medida,factor_conversion")
.eq("id_insumo",idInsumo)
.order("description");

if(error) return alert(error.message);

data.forEach(p=>{

const opt=document.createElement("option");

opt.value=p.id;
opt.textContent=`${p.description} (${p.factor_conversion} ${p.unidad_medida})`;

select.appendChild(opt);

});

}

/* ===============================
ALMACENES / JURISDICCIONES
================================ */

async function cargarAlmacenes(){

const {data,error}=await supa
.from("almacenes")
.select("id,nombre")
.eq("id_componente",idComponente)
.order("nombre");

if(error) return alert(error.message);

const sel=document.getElementById("id_almacen");
const filtro=document.getElementById("filtro_almacen");

sel.innerHTML=`<option value="">Seleccione jurisdicción</option>`;

data.forEach(a=>{

const opt=document.createElement("option");

opt.value=a.id;
opt.textContent=a.nombre;

sel.appendChild(opt);
const opt2=document.createElement("option");

opt2.value=a.id;
opt2.textContent=a.nombre;

filtro.appendChild(opt2);

});

}

async function cargarResumen(){

const idAlmacen = document.getElementById("filtro_almacen").value;

let query = supa
.from("vw_resumen_vectores")
.select("*");

if(idAlmacen){
query = query.eq("id_almacen", idAlmacen);
}

const {data,error} = await query;

if(error){
alert(error.message);
return;
}

/* ===============================
AGRUPAR POR INSUMO + PRESENTACION + LOTE
================================ */

const resumen = {};

data.forEach(r => {

const key = r.insumo + "_" + r.presentacion + "_" + r.lote;

if(!resumen[key]){

resumen[key] = {
insumo: r.insumo,
presentacion: r.presentacion,
unidad_medida: r.unidad_medida,
lote: r.lote,
fecha_caducidad: r.fecha_caducidad,
empaques: 0,
cantidad_real: 0
};

}

resumen[key].empaques += Number(r.empaques || 0);
resumen[key].cantidad_real += Number(r.cantidad_real || 0);

});

renderResumen(Object.values(resumen));

}

async function cargarPanelFolios(){

const idAlmacen = document.getElementById("filtro_almacen").value;

const panel = document.getElementById("panelFolios");

panel.innerHTML="Cargando...";

let data;

/* ==========================
SIN FILTRO → RESUMEN ESTATAL
========================== */

if(!idAlmacen){

const {data:res,error} = await supa
.from("vw_folios_disponibles")
.select("jurisdiccion,insumo");

if(error) return alert(error.message);

const mapa={};

res.forEach(r=>{

const key = r.jurisdiccion+"-"+r.insumo;

if(!mapa[key]){
mapa[key]={
jur:r.jurisdiccion,
ins:r.insumo,
total:0
};
}

mapa[key].total++;

});

data = Object.values(mapa);

panel.innerHTML="";

data.forEach(r=>{

panel.innerHTML += `
<div>
<b>${r.jur}</b> — ${r.ins}<br>
Folios: ${r.total}
</div>
<hr>
`;

});

}

/* ==========================
CON FILTRO → FOLIOS REALES
========================== */

else{

const {data:res,error} = await supa
.from("vw_folios_disponibles")
.select("*")
.eq("id_almacen",idAlmacen)
.gt("disponible",0)
.order("insumo");

if(error) return alert(error.message);

panel.innerHTML="";

const maxCols = 10; // máximo folios por fila

// agrupar por insumo
const grupos = {};

res.forEach(r=>{
  if(!grupos[r.insumo]) grupos[r.insumo] = [];
  grupos[r.insumo].push(r.folio);
});

// generar tabla por insumo
Object.entries(grupos).forEach(([insumo,folios])=>{

  const tabla = document.createElement("table");

  tabla.style.marginBottom = "15px";

  let html = `
    <thead>
      <tr>
        <th colspan="${maxCols}">${insumo}</th>
      </tr>
    </thead>
    <tbody>
  `;

  for(let i=0;i<folios.length;i++){

    if(i % maxCols === 0){
      html += "<tr>";
    }

    html += `<td>${folios[i]}</td>`;

    if(i % maxCols === maxCols-1){
      html += "</tr>";
    }

  }

  if(folios.length % maxCols !== 0){
    html += "</tr>";
  }

  html += "</tbody>";

  tabla.innerHTML = html;

  panel.appendChild(tabla);

});
}
}

/* ===============================
CARGA MASIVA FOLIOS
================================ */

document.getElementById("formFolios").addEventListener("submit", async e => {

e.preventDefault();

const idPresentacion = id_presentacion.value;
const loteTxt = lote.value.trim();
const almacen = id_almacen.value;

const inicio = Number(folio_inicio.value);
const fin = Number(folio_fin.value);

if(fin < inicio){
alert("Rango inválido");
return;
}

/* ===============================
OBTENER CAPACIDAD DE PRESENTACION
================================ */

const { data: pres, error: errPres } = await supa
.from("presentacion_insumo")
.select("factor_conversion")
.eq("id", idPresentacion)
.single();

if(errPres){
alert(errPres.message);
return;
}

const capacidad = pres.factor_conversion;


/* ===============================
BUSCAR O CREAR LOTE
================================ */

const fechaCad = fecha_caducidad.value;
const fechaLleg = fecha_llegada.value;
const proveedorTxt = proveedor.value;
const origenValue = document.getElementById("origen").value;
const origen = origenValue === "" ? null : origenValue;

const { data: loteExistente } = await supa
.from("lotes")
.select("id")
.eq("id_presentacion", idPresentacion)
.eq("lote", loteTxt)
.maybeSingle();

let idLote;

if(!loteExistente){

const { data: nuevo, error } = await supa
.from("lotes")
.insert({

id_presentacion: idPresentacion,
lote: loteTxt,
fecha_caducidad: fechaCad,
fecha_llegada: fechaLleg,
proveedor: proveedorTxt || null,
id_componente: idComponente,
origen: origen

})
.select("id")
.single();

if(error){
alert(error.message);
return;
}

idLote = nuevo.id;

}else{

idLote = loteExistente.id;

}

/* ===============================
INSERTAR FOLIOS
================================ */

const registros = [];

for(let f = inicio; f <= fin; f++){

registros.push({

id_lote: idLote,
folio: String(f),
capacidad: capacidad,
id_almacen: almacen

});

}

const { error } = await supa
.from("folios_lote")
.insert(registros);

if(error){
alert(error.message);
return;
}

alert(`Folios cargados: ${registros.length}`);

e.target.reset();

});

/* ===============================
UTIL
================================ */

function llenarSelect(id,data){

const select=document.getElementById(id);

select.innerHTML=`<option value="">Seleccione</option>`;

data.forEach(i=>{

const opt=document.createElement("option");

opt.value=i.id;
opt.textContent=i.nombre;

select.appendChild(opt);

});

}

function renderResumen(data){

const tbody = document.getElementById("tablaResumen");

tbody.innerHTML="";

data.forEach(r=>{

const rojo = r.cantidad_real < 0
? "style='color:red;font-weight:bold'"
: "";

tbody.innerHTML += `
<tr>
<td>${r.insumo}</td>
<td>${r.presentacion}</td>
<td>${r.lote} (${r.fecha_caducidad ?? ""})</td>
<td>${r.empaques}</td>
<td ${rojo}>${r.cantidad_real} ${r.unidad_medida}</td>
</tr>
`;

});

}