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

/* =========================
INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {

await cargarInsumos();
await cargarAlmacenes();
await cargarLotes();
await cargarResumen();

document
.getElementById("id_insumo_lote")
.addEventListener("change", cargarPresentacionesPorInsumo);

});

/* =========================
CARGAR INSUMOS
========================= */

async function cargarInsumos(){

const {data,error} = await supa
.from("insumos")
.select("id,nombre,unidad_completa")
.eq("id_componente",idComponente)
.order("nombre");

if(error) return alert(error.message);

llenarSelect("id_insumo_pres",data);
llenarSelect("id_insumo_lote",data);

}

/* =========================
CARGAR LOTES
========================= */

async function cargarLotes(){

const {data,error} = await supa
.from("lotes")
.select("id,lote")
.eq("id_componente",idComponente)
.order("lote");

if(error) return alert(error.message);

const select=document.getElementById("folio_lote");
select.innerHTML=`<option value="">Seleccione lote</option>`;

data.forEach(l=>{
const opt=document.createElement("option");
opt.value=l.id;
opt.textContent=l.lote;
select.appendChild(opt);
});

}

/* =========================
REGISTRAR FOLIOS
========================= */

document
.getElementById("formFolios")
.addEventListener("submit",async e=>{

e.preventDefault();

const idLote=folio_lote.value;
const folio=folio_codigo.value.trim();
const capacidad=Number(capacidad.value);
const almacen=folio_almacen.value;

if(!folio) return alert("Ingrese folio");

const {error}=await supa
.from("folios_lote")
.insert({

id_lote:idLote,
folio,
capacidad,
id_almacen:almacen

});

if(error) return alert(error.message);

alert("Folio registrado");

e.target.reset();

});

/* =========================
ALMACENES
========================= */

async function cargarAlmacenes(){

const {data,error}=await supa
.from("almacenes")
.select("id,nombre")
.eq("id_componente",idComponente);

if(error) return alert(error.message);

const sel=document.getElementById("id_almacen");
const sel2=document.getElementById("id_almacen_origen");
const sel3=document.getElementById("folio_almacen");

data.forEach(a=>{

const opt=document.createElement("option");
opt.value=a.id;
opt.textContent=a.nombre;

sel.appendChild(opt);
sel2.appendChild(opt.cloneNode(true));
sel3.appendChild(opt.cloneNode(true));

});

}

/* =========================
UTIL
========================= */

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