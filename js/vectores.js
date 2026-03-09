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

document
.getElementById("id_insumo_lote")
.addEventListener("change", cargarPresentacionesPorInsumo);

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

sel.innerHTML=`<option value="">Seleccione jurisdicción</option>`;

data.forEach(a=>{

const opt=document.createElement("option");

opt.value=a.id;
opt.textContent=a.nombre;

sel.appendChild(opt);

});

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
/* ===============================
BUSCAR O CREAR LOTE
================================ */

const fechaCad = fecha_caducidad.value;
const fechaLleg = fecha_llegada.value;
const proveedorTxt = proveedor.value;

const { data: loteExistente } = await supa
.from("lotes")
.select("id")
.eq("id_presentacion", idPresentacion)
.eq("lote", loteTxt)
.eq("id_almacen", almacen)
.eq("id_componente", idComponente)
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
id_almacen: almacen,
id_componente: idComponente

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