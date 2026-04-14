import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* SUPABASE */

const supa = createClient(
"https://mktpkopqrzelxigcayqe.supabase.co",
"sb_publishable_g6n-He351w0iWQfAtmHGkQ_pQm_wHO9"
);

/* VARIABLES */

const idJurisdiccion = sessionStorage.getItem("id_jurisdiccion");

let idAlmacen = null;
let loteSeleccionado = null;


/* ===============================
INIT
=============================== */

document.addEventListener("DOMContentLoaded", async () => {

if(!idJurisdiccion){
alert("Acceso inválido");
location.href="index.html";
return;
}

activarTabs();

await obtenerAlmacen();

});


/* ===============================
TABS
=============================== */

function activarTabs(){

document.querySelectorAll(".tab").forEach(btn=>{

btn.addEventListener("click",()=>{

document.querySelectorAll(".tab")
.forEach(t=>t.classList.remove("activo"));

document.querySelectorAll(".panelTab")
.forEach(p=>p.classList.remove("activo"));

btn.classList.add("activo");

document
.getElementById(btn.dataset.tab)
.classList.add("activo");

});

});

}


/* ===============================
OBTENER ALMACEN
=============================== */

async function obtenerAlmacen(){

const {data,error} = await supa
.from("almacenes")
.select("id")
.eq("id_jurisdiccion",idJurisdiccion)
.single();

if(error){
alert("No se encontró almacén");
return;
}

idAlmacen = data.id;

await cargarInventario();
await cargarFolios();
await cargarMovimientos();

}


/* ===============================
INVENTARIO
=============================== */

async function cargarInventario(){

const tbody = document.querySelector("#tablaInventario tbody");

tbody.innerHTML="Cargando...";

const {data,error} = await supa
.from("vw_folios_disponibles")
.select("*")
.eq("id_almacen",idAlmacen);

if(error){
tbody.innerHTML="Error cargando inventario";
return;
}

/* agrupar por lote */

const resumen={};

data.forEach(f=>{

const key=f.lote+"_"+f.insumo;

if(!resumen[key]){

resumen[key]={

insumo:f.insumo,
lote:f.lote,
cantidad:0,
stock:0,
presentacion:f.description,
origen:f.origen

};

}

resumen[key].cantidad+=Number(f.disponible||0);

if(Number(f.disponible)>0){
resumen[key].stock++;
}

});

tbody.innerHTML="";

Object.values(resumen).forEach(r=>{

let boton="";

if(r.origen==="interno"){

boton=`
<button
class="btn btnMovimiento"
onclick="abrirFormulario('${r.lote}','${r.insumo}')">
Registrar movimiento
</button>
`;

}else{

boton=`<span style="color:#888">GEOSIS</span>`;

}

tbody.innerHTML+=`

<tr>

<td>${r.insumo}</td>

<td>${r.lote}</td>

<td>${r.cantidad}</td>

<td>${r.stock}</td>

<td>${r.presentacion||""}</td>

<td>${boton}</td>

</tr>

`;

});

/* KPI */

document.getElementById("totalInsumos")
.innerText = Object.keys(resumen).length;

}


/* ===============================
FOLIOS DISPONIBLES
=============================== */

async function cargarFolios(){

const panel=document.getElementById("panelFolios");

const {data,error}=await supa
.from("vw_folios_disponibles")
.select("*")
.eq("id_almacen",idAlmacen)
.gt("disponible",0)
.order("insumo");

if(error){
panel.innerHTML="Error cargando folios";
return;
}

/* KPI */

document.getElementById("totalFolios").innerText=data.length;

/* agrupar */

const grupos={};

data.forEach(f=>{

if(!grupos[f.insumo]) grupos[f.insumo]=[];

grupos[f.insumo].push(f);

});

panel.innerHTML="";

Object.entries(grupos).forEach(([insumo,folios])=>{

let html=`
<h3>${insumo}</h3>
<div class="foliosGrid">
`;

folios.forEach(f=>{

html+=`
<div class="folioCard">
  <div class="folioNumero">${f.folio}</div>
  <div class="folioCantidad">${f.disponible}</div>
</div>
`;

});

html+=`</tbody></table><br>`;

panel.innerHTML+=html;

});

}


/* ===============================
MOVIMIENTOS
=============================== */

async function cargarMovimientos(){

const cont=document.getElementById("movGeosis");

const filtro=document
.getElementById("buscarFolio")
.value
.trim();

let query=supa
.from("vw_movimientos_geosis_jurisdiccion")
.select("*")
.eq("id_almacen",idAlmacen)
.order("nombre_insumo")
.order("folio")
.order("fecha");

if(filtro){
query=query.ilike("folio",`%${filtro}%`);
}

const {data,error}=await query;

if(error){
cont.innerHTML="Error cargando movimientos";
return;
}

/* KPI */

document.getElementById("totalMov").innerText=data.length;

/* agrupar */

const grupos={};

data.forEach(m=>{

if(!grupos[m.nombre_insumo])
grupos[m.nombre_insumo]={};

if(!grupos[m.nombre_insumo][m.folio])
grupos[m.nombre_insumo][m.folio]=[];

grupos[m.nombre_insumo][m.folio].push(m);

});

/* render */

cont.innerHTML="";


Object.entries(grupos).forEach(([insumo,folios])=>{

let totalInsumo=0;

let html=`
<div class="card">

<div class="cardHeader" onclick="toggleCard(this)">
<span class="flecha">▶</span>
<span>${insumo}</span>
</div>

<div class="cardBody">
`;

Object.entries(folios).forEach(([folio,movs])=>{

let totalFolio=0;

html+=`
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

totalFolio+=Number(m.cantidad||0);

html+=`
<tr>
<td>${new Date(m.fecha).toLocaleDateString()}</td>
<td>${m.tipo_operativo}</td>
<td>${m.cantidad}</td>
<td>${m.folio_operativo||""}</td>
</tr>
`;

});

html+=`
<tr style="font-weight:bold;background:#f4f6f9">
<td colspan="2">Total folio</td>
<td>${totalFolio}</td>
<td></td>
</tr>
`;

html+=`</tbody></table><br>`;

totalInsumo+=totalFolio;

});

html+=`
<div style="font-weight:bold">
Total ${insumo}: ${totalInsumo}
</div>
</div>
</div>
`;

cont.innerHTML+=html;


});

/* total general */
}


/* ===============================
COLAPSAR CARD
=============================== */

function toggleCard(el){

const card=el.parentElement;

card.classList.toggle("abierto");

}

window.toggleCard=toggleCard;


/* ===============================
BUSCADOR
=============================== */

document
.getElementById("buscarFolio")
.addEventListener("input",cargarMovimientos);


/* ===============================
FORMULARIO
=============================== */

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

document
.getElementById("panelFormulario")
.classList.add("abierto");

}

window.abrirFormulario=abrirFormulario;


/* ===============================
CERRAR MODAL
=============================== */

function cerrarFormulario(){

document
.getElementById("panelFormulario")
.classList.remove("abierto");

}

window.cerrarFormulario=cerrarFormulario;


/* ===============================
GUARDAR MOVIMIENTO
=============================== */

document
.getElementById("formGasto")
.addEventListener("submit",async e=>{

e.preventDefault();

const folio=parseInt(
document.getElementById("folioSelect").value
);

const cantidad=Number(
document.getElementById("cantidadGasto").value
);

const fecha=document
.getElementById("fechaGasto").value;

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

alert("Movimiento registrado");

cerrarFormulario();

document.getElementById("formGasto").reset();

await cargarInventario();
await cargarFolios();
await cargarMovimientos();

});