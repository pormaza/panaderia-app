import { useState, useEffect } from "react";

// ── Storage ──
async function sGet(key) {
  try { const r = await window.storage.get(key,true); return r ? JSON.parse(r.value) : null; }
  catch { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
}
async function sSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); localStorage.setItem(key, JSON.stringify(val)); }
  catch { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); } }
}
const SK = { ing:"rc2-ing", emp:"rc2-emp", rec:"rc2-rec", cf:"rc2-cf" };

// ── Utilidades ──
function uid() { return "x"+Math.random().toString(36).slice(2,9); }
function n(v) { return parseFloat(String(v??0).replace(",",".")) || 0; }
const $  = v => `$${n(v).toFixed(2)}`;
const P  = v => `${n(v).toFixed(1)}%`;

// ── Datos iniciales ──
const ING0 = [
  {id:"i1", nombre:"Azúcar",              unidad:"kg",     precio:"0.90"},
  {id:"i2", nombre:"Mantequilla",          unidad:"kg",     precio:"4.50"},
  {id:"i3", nombre:"Huevos",               unidad:"unidad", precio:"0.18"},
  {id:"i4", nombre:"Chocolate negro",      unidad:"kg",     precio:"8.00"},
  {id:"i5", nombre:"Almendras",            unidad:"kg",     precio:"12.00"},
  {id:"i6", nombre:"Maní",                 unidad:"kg",     precio:"2.50"},
  {id:"i7", nombre:"Miel",                 unidad:"kg",     precio:"6.00"},
  {id:"i8", nombre:"Fruta para mermelada", unidad:"kg",     precio:"1.50"},
  {id:"i9", nombre:"Almidón de yuca",      unidad:"kg",     precio:"1.20"},
  {id:"i10",nombre:"Sal",                  unidad:"kg",     precio:"0.33"},
  {id:"i11",nombre:"Vainilla",             unidad:"ml",     precio:"0.05"},
  {id:"i12",nombre:"Pan masa madre (u)",   unidad:"unidad", precio:"3.00"},
];

const EMP0 = [
  {id:"e1",nombre:"Bolsa pequeña ≤200g",  precio:"0.08"},
  {id:"e2",nombre:"Bolsa mediana 200-500g",precio:"0.12"},
  {id:"e3",nombre:"Bolsa grande 500g-1kg", precio:"0.18"},
  {id:"e4",nombre:"Bolsa extra >1kg",      precio:"0.25"},
  {id:"e5",nombre:"Frasco 250ml",          precio:"0.65"},
  {id:"e6",nombre:"Frasco 500ml",          precio:"0.85"},
  {id:"e7",nombre:"Frasco 1L",             precio:"1.20"},
  {id:"e8",nombre:"Sin empaque",           precio:"0.00"},
];

// Receta: ingredientes en su unidad natural (kg, unidad, ml…)
// Variante: pesoG (gramos por pieza), piezas (a producir), precioVenta, empaqueId, udsSemana
const REC0 = [
  { id:"r1", nombre:"Galletas de almidón", cat:"confiteria", perdida:"10",
    energia:"0.20", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i9",cant:"1"},{id:"a2",ingId:"i1",cant:"0.3"},{id:"a3",ingId:"i2",cant:"0.2"},{id:"a4",ingId:"i3",cant:"4"}],
    vars:[
      {id:"v1",nombre:"Paquete 140g", pesoG:"140",piezas:"20",precioVenta:"4.00",empaqueId:"e2",udsSemana:"30"},
      {id:"v2",nombre:"Paquete 280g", pesoG:"280",piezas:"5", precioVenta:"7.00",empaqueId:"e3",udsSemana:"0"},
    ], notas:"" },
  { id:"r2", nombre:"Galletas chocolate negro", cat:"confiteria", perdida:"10",
    energia:"0.20", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i4",cant:"0.5"},{id:"a2",ingId:"i1",cant:"0.2"},{id:"a3",ingId:"i2",cant:"0.15"},{id:"a4",ingId:"i3",cant:"2"}],
    vars:[{id:"v1",nombre:"Paquete 140g",pesoG:"140",piezas:"10",precioVenta:"4.00",empaqueId:"e2",udsSemana:"0"}], notas:"" },
  { id:"r3", nombre:"Forgotten cookies", cat:"confiteria", perdida:"5",
    energia:"0.15", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i3",cant:"4"},{id:"a2",ingId:"i1",cant:"0.25"},{id:"a3",ingId:"i4",cant:"0.2"}],
    vars:[{id:"v1",nombre:"Paquete 140g",pesoG:"140",piezas:"10",precioVenta:"4.00",empaqueId:"e1",udsSemana:"0"}], notas:"" },
  { id:"r4", nombre:"Almendras caramelizadas", cat:"confiteria", perdida:"5",
    energia:"0.15", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"1",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i5",cant:"0.5"},{id:"a2",ingId:"i1",cant:"0.15"}],
    vars:[
      {id:"v1",nombre:"Paquete 100g",pesoG:"100",piezas:"10",precioVenta:"5.00",empaqueId:"e2",udsSemana:"0"},
      {id:"v2",nombre:"Paquete 200g",pesoG:"200",piezas:"5", precioVenta:"9.00",empaqueId:"e3",udsSemana:"0"},
    ], notas:"" },
  { id:"r5", nombre:"Mermelada", cat:"conserveria", perdida:"20",
    energia:"0.30", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i8",cant:"2"},{id:"a2",ingId:"i1",cant:"0.8"}],
    vars:[
      {id:"v1",nombre:"Frasco 250ml",pesoG:"250",piezas:"8",precioVenta:"6.00", empaqueId:"e5",udsSemana:"0"},
      {id:"v2",nombre:"Frasco 500ml",pesoG:"500",piezas:"4",precioVenta:"10.00",empaqueId:"e6",udsSemana:"0"},
    ], notas:"" },
  { id:"r6", nombre:"Peanut butter", cat:"conserveria", perdida:"5",
    energia:"0.20", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"1",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i6",cant:"1.5"},{id:"a2",ingId:"i10",cant:"0.01"}],
    vars:[
      {id:"v1",nombre:"Frasco 250ml",pesoG:"250",piezas:"5",precioVenta:"7.00", empaqueId:"e5",udsSemana:"0"},
      {id:"v2",nombre:"Frasco 500ml",pesoG:"500",piezas:"2",precioVenta:"12.00",empaqueId:"e6",udsSemana:"0"},
    ], notas:"" },
  { id:"r7", nombre:"Honey", cat:"conserveria", perdida:"0",
    energia:"0.05", otros:"0",
    ops:[{id:"o1",nombre:"Operario 1",horas:"0.5",tarifa:"3.01"}],
    ings:[{id:"a1",ingId:"i7",cant:"1"}],
    vars:[{id:"v1",nombre:"Frasco 250ml",pesoG:"250",piezas:"4",precioVenta:"8.00",empaqueId:"e5",udsSemana:"0"}], notas:"" },
  { id:"r8", nombre:"Pan masa madre", cat:"panaderia", perdida:"0",
    energia:"0", otros:"0", ops:[],
    ings:[{id:"a1",ingId:"i12",cant:"1"}],
    vars:[{id:"v1",nombre:"Pieza 1kg",pesoG:"1000",piezas:"30",precioVenta:"7.00",empaqueId:"e4",udsSemana:"30"}],
    notas:"Costo por pieza desde el planner." },
];

const CF0 = { sueldo:"600", items:[{id:"x1",nombre:"Hogar/negocio",monto:"100"},{id:"x2",nombre:"Internet",monto:"30"}] };

// ── CÁLCULO PRINCIPAL ──
function calcular(rec, ings, piezasMap) {
  // piezasMap: { varId: número } — cuántas piezas de cada variante
  const perdida = n(rec.perdida) / 100;

  // 1. Por variante: peso crudo = peso horneado / (1 - perdida)
  // El usuario introduce el peso que quiere horneado
  const varsConG = (rec.vars||[]).map(v => {
    const piezasN = n(piezasMap[v.id] ?? v.piezas);
    const pesoHorneadoG = n(v.pesoG);
    const pesoCrudoG = perdida < 1 ? Math.round(pesoHorneadoG / (1 - perdida)) : pesoHorneadoG;
    const gramosNetos = piezasN * pesoHorneadoG;   // gramos horneados totales
    const gramosCrudos = piezasN * pesoCrudoG;      // masa cruda necesaria
    return { ...v, piezasN, pesoHorneadoG, pesoCrudoG, gramosNetos, gramosCrudos };
  });

  const totalNeto = varsConG.reduce((a,v) => a + v.gramosNetos, 0);

  // 2. Masa bruta (cruda) total necesaria = suma de gramos crudos por variante
  const totalBruto = varsConG.reduce((a,v) => a + v.gramosCrudos, 0);

  // 3. Peso bruto de la receta base (ingredientes en unidades de peso)
  const pesoBrutoBase = (rec.ings||[]).reduce((acc, li) => {
    const ing = ings.find(i => i.id === li.ingId);
    if (!ing) return acc;
    const cant = n(li.cant);
    if (ing.unidad === "kg")    return acc + cant * 1000;
    if (ing.unidad === "g")     return acc + cant;
    if (ing.unidad === "litro") return acc + cant * 1000;
    if (ing.unidad === "ml")    return acc + cant;
    return acc; // unidades (huevos, piezas) no suman peso
  }, 0);

  // 4. Factor de escala
  const factor = pesoBrutoBase > 0 ? totalBruto / pesoBrutoBase : 0;

  // 5. Ingredientes escalados y su costo
  const lineasIng = (rec.ings||[]).map(li => {
    const ing = ings.find(i => i.id === li.ingId) || {nombre:"?",unidad:"?",precio:"0"};
    const cantBase = n(li.cant);
    const cantTotal = cantBase * factor;
    const costo = cantTotal * n(ing.precio);
    return { nombre: ing.nombre, unidad: ing.unidad, cantBase, cantTotal, precio: n(ing.precio), costo };
  });

  const costoIng = lineasIng.reduce((a,l) => a + l.costo, 0);
  const costoEnergia = n(rec.energia) * factor;
  const costoOtros = n(rec.otros) * factor;
  const costoMO = (rec.ops||[]).reduce((a,op) => a + n(op.horas)*n(op.tarifa), 0) * factor;
  const costoProduccion = costoIng + costoEnergia + costoOtros + costoMO;

  // 6. Costo por gramo neto
  const costoPorGramo = totalNeto > 0 ? costoProduccion / totalNeto : 0;

  // 7. Por variante: costo, ganancia, margen
  const variantes = varsConG.map(v => {
    const emp = EMP0.find(e => e.id === v.empaqueId) || {nombre:"Sin empaque",precio:"0"};
    const costoEmp = n(emp.precio);
    const costoProducPieza = n(v.pesoG) * costoPorGramo;
    const costoPieza = costoProducPieza + costoEmp;
    const pvp = n(v.precioVenta);
    const ganPieza = pvp - costoPieza;
    const ganTotal = ganPieza * v.piezasN;
    const ingreso = pvp * v.piezasN;
    const margen = pvp > 0 ? (ganPieza / pvp) * 100 : 0;
    return { ...v, emp, costoEmp, costoProducPieza, costoPieza, pvp, ganPieza, ganTotal, ingreso, margen };
  });

  const costoEmpTotal = variantes.reduce((a,v) => a + v.costoEmp * v.piezasN, 0);
  const costoTotal = costoProduccion + costoEmpTotal;
  const ingresoTotal = variantes.reduce((a,v) => a + v.ingreso, 0);
  const ganTotal = ingresoTotal - costoTotal;

  return {
    factor, totalNeto: Math.round(totalNeto), totalBruto: Math.round(totalBruto),
    lineasIng, costoIng, costoEnergia, costoOtros, costoMO, costoProduccion,
    costoEmpTotal, costoTotal, ingresoTotal, ganTotal, variantes,
  };
}

// ── Colores ──
const A="#8b5e2a", AD="#6b4520", G="#9a7020";
const BG="#f5f0e8", SU="#fff", CA="#faf7f2";
const BO="#ddd5c0", BL="#ede5d0";
const TX="#2a1f0e", TM="#6b5a40", TD="#9a8a70";
const OK="#2a5a2a", OB="#e8f5e8";
const WA="#8a4010", WB="#fff3e8";
const IN="#2a5a78", IB="#e8f2f8";
const f="Arial", g="Georgia";

function catColor(cat) {
  if(cat==="confiteria")  return {c:"#5a7a2a",bg:"#edf5e0"};
  if(cat==="conserveria") return {c:"#2a5a7a",bg:"#e0edf5"};
  if(cat==="panaderia")   return {c:A,bg:"#f5ede0"};
  return {c:"#555",bg:"#f0f0f0"};
}
const CAT = {confiteria:"Confitería",conserveria:"Conservería",panaderia:"Panadería",otro:"Otro"};
const CATS = Object.keys(CAT);
const UNIDS = ["kg","g","litro","ml","unidad","docena","lb","oz"];

// ── Estilos base ──
const inp = {width:"100%",background:BG,border:`1px solid ${BO}`,borderRadius:4,color:TX,padding:".45rem .6rem",fontSize:".9rem",fontFamily:g,boxSizing:"border-box",outline:"none"};
const inpSm = {...inp,fontSize:".82rem",fontFamily:f,padding:".35rem .45rem"};
const sel = {...inp,fontSize:".82rem",fontFamily:f,padding:".38rem .45rem"};
const lbl = {display:"block",fontSize:".62rem",letterSpacing:".1em",textTransform:"uppercase",color:TM,fontFamily:f,marginBottom:".22rem"};
const card = {background:SU,border:`1px solid ${BO}`,borderRadius:6,padding:".9rem",marginBottom:".7rem",boxShadow:"0 1px 3px rgba(0,0,0,.05)"};
const cardHL = {...card,border:`2px solid ${A}`};
const sec = {fontSize:".6rem",letterSpacing:".2em",textTransform:"uppercase",color:A,fontFamily:f,marginBottom:".65rem",paddingBottom:".28rem",borderBottom:`1px solid ${BO}`};
const row = {display:"flex",gap:".55rem",flexWrap:"wrap",marginBottom:".55rem"};
const col = {flex:1,minWidth:"100px"};
const btn = {padding:".45rem .85rem",fontSize:".73rem",fontFamily:f,cursor:"pointer",border:`1px solid ${BO}`,borderRadius:4,background:SU,color:TM,display:"inline-flex",alignItems:"center",gap:".3rem"};
const btnP = {...btn,background:A,border:`1px solid ${AD}`,color:"#fff"};
const btnD = {...btn,background:WB,border:`1px solid ${WA}`,color:WA};
const btnSm = {padding:".25rem .5rem",fontSize:".68rem",fontFamily:f,cursor:"pointer",border:`1px solid ${BO}`,borderRadius:3,background:SU,color:TM};
const bar = {background:CA,border:`1px solid ${BL}`,borderRadius:4,padding:".45rem .75rem",marginTop:".35rem",display:"flex",justifyContent:"space-between",alignItems:"center"};
const barHL = {...bar,background:"#f0ede5",border:`1px solid ${A}`};
const tipV = {background:OB,border:`1px solid ${OK}44`,borderRadius:4,padding:".5rem .75rem",fontSize:".72rem",color:OK,fontFamily:f,lineHeight:1.5,marginTop:".45rem"};
const tipW = {background:WB,border:`1px solid ${WA}`,borderRadius:4,padding:".5rem .75rem",fontSize:".72rem",color:WA,fontFamily:f,lineHeight:1.5,marginTop:".45rem"};
const tipI = {background:IB,border:`1px solid ${IN}44`,borderRadius:4,padding:".5rem .75rem",fontSize:".72rem",color:IN,fontFamily:f,lineHeight:1.5,marginTop:".45rem"};
const tbl = {width:"100%",borderCollapse:"collapse",fontSize:".8rem",fontFamily:f};
const th = {textAlign:"left",fontSize:".58rem",letterSpacing:".1em",textTransform:"uppercase",color:TM,padding:".28rem .45rem",borderBottom:`2px solid ${BO}`,fontFamily:f};
const thR = {...th,textAlign:"right"};
const td = {padding:".35rem .45rem",borderBottom:`1px solid ${BL}`,color:TX,verticalAlign:"middle"};
const tdM = {...td,color:TM};
const tdR = {...td,textAlign:"right",color:TM};
const kpiG = {display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:".5rem",marginBottom:".7rem"};
const kpi = {background:SU,border:`1px solid ${BO}`,borderRadius:5,padding:".7rem",textAlign:"center"};
const badge = {fontSize:".57rem",padding:".1rem .35rem",borderRadius:3,fontFamily:f,textTransform:"uppercase",display:"inline-block"};
const nav = {display:"flex",marginBottom:"1rem",borderBottom:`2px solid ${BO}`,background:SU,borderRadius:"6px 6px 0 0",overflow:"hidden",flexWrap:"wrap"};
const navBtn = {flex:1,minWidth:"65px",padding:".6rem .25rem",fontSize:".61rem",letterSpacing:".06em",textTransform:"uppercase",fontFamily:f,cursor:"pointer",border:"none",borderBottom:"3px solid transparent",background:"transparent",color:TM,textAlign:"center",marginBottom:"-2px"};
const navA = {...navBtn,color:A,borderBottom:`3px solid ${A}`,background:"#f5ede0",fontWeight:"bold"};
const varCard = {background:CA,border:`1px solid ${BL}`,borderRadius:5,padding:".7rem",marginBottom:".5rem"};

// ── TabIngredientes ──
function TabIng({ings, setIngs}) {
  const [ed, setEd] = useState({});
  const [nw, setNw] = useState({nombre:"",unidad:"kg",precio:""});
  const [show, setShow] = useState(false);
  const startEd = i => setEd(p=>({...p,[i.id]:{nombre:i.nombre,unidad:i.unidad,precio:String(i.precio)}}));
  const setEV = (id,k,v) => setEd(p=>({...p,[id]:{...p[id],[k]:v}}));
  const save = id => { const e=ed[id]; setIngs(p=>p.map(i=>i.id===id?{...i,...e}:i)); setEd(p=>{const q={...p};delete q[id];return q;}); };
  const cancel = id => setEd(p=>{const q={...p};delete q[id];return q;});
  const del = id => { setIngs(p=>p.filter(i=>i.id!==id)); cancel(id); };
  const add = () => { if(!nw.nombre.trim()) return; setIngs(p=>[...p,{id:uid(),...nw}]); setNw({nombre:"",unidad:"kg",precio:""}); setShow(false); };
  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
      <div style={sec}>Ingredientes — actualiza precios aquí</div>
      <button style={btnP} onClick={()=>setShow(true)}>+ Añadir</button>
    </div>
    <div style={tipI}>💡 Cambia el precio de un ingrediente y se recalcula en todas las recetas al instante.</div>
    {show && <div style={{...cardHL,marginTop:".7rem"}}>
      <div style={row}>
        <div style={{...col,flex:3}}><label style={lbl}>Nombre</label><input style={inp} type="text" value={nw.nombre} onChange={e=>setNw(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Avena"/></div>
        <div style={col}><label style={lbl}>Unidad</label><select style={sel} value={nw.unidad} onChange={e=>setNw(p=>({...p,unidad:e.target.value}))}>{UNIDS.map(u=><option key={u}>{u}</option>)}</select></div>
        <div style={col}><label style={lbl}>Precio/unidad ($)</label><input style={inp} type="text" inputMode="decimal" value={nw.precio} onChange={e=>setNw(p=>({...p,precio:e.target.value}))} placeholder="0.00"/></div>
      </div>
      <div style={{display:"flex",gap:".4rem"}}><button style={btnP} onClick={add}>Guardar</button><button style={btn} onClick={()=>setShow(false)}>Cancelar</button></div>
    </div>}
    <div style={card}>
      <table style={tbl}><thead><tr><th style={th}>Ingrediente</th><th style={th}>Unidad</th><th style={thR}>Precio/unidad</th><th style={{...th,width:"80px"}}></th></tr></thead>
        <tbody>{ings.map(i=>{const e=ed[i.id]; return <tr key={i.id} style={{background:e?"#fdf8f0":"transparent"}}>
          <td style={td}>{e?<input style={{...inpSm,width:"100%"}} type="text" value={e.nombre} onChange={ev=>setEV(i.id,"nombre",ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&save(i.id)}/>:i.nombre}</td>
          <td style={tdM}>{e?<select style={{...inpSm,width:"85px"}} value={e.unidad} onChange={ev=>setEV(i.id,"unidad",ev.target.value)}>{UNIDS.map(u=><option key={u}>{u}</option>)}</select>:i.unidad}</td>
          <td style={{...td,textAlign:"right"}}>{e?<input style={{...inpSm,width:"85px",textAlign:"right"}} type="text" inputMode="decimal" value={e.precio} onChange={ev=>setEV(i.id,"precio",ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&save(i.id)}/>:<span style={{color:AD,fontWeight:"bold"}}>{$(i.precio)}</span>}</td>
          <td style={{...td,textAlign:"right"}}>{e?<><button style={{...btnSm,background:A,color:"#fff",border:"none",marginRight:".25rem"}} onClick={()=>save(i.id)}>✓</button><button style={btnSm} onClick={()=>cancel(i.id)}>✕</button></>:<><button style={{...btnSm,marginRight:".25rem"}} onClick={()=>startEd(i)}>✏️</button><button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>del(i.id)}>✕</button></>}
          </td></tr>;})}
        </tbody>
      </table>
    </div>
  </>;
}

// ── TabEmpaques ──
function TabEmp({emps, setEmps}) {
  const [ed, setEd] = useState({});
  const [nw, setNw] = useState({nombre:"",precio:""});
  const [show, setShow] = useState(false);
  const startEd = e => setEd(p=>({...p,[e.id]:{nombre:e.nombre,precio:String(e.precio)}}));
  const setEV = (id,k,v) => setEd(p=>({...p,[id]:{...p[id],[k]:v}}));
  const save = id => { const e=ed[id]; setEmps(p=>p.map(x=>x.id===id?{...x,...e}:x)); setEd(p=>{const q={...p};delete q[id];return q;}); };
  const cancel = id => setEd(p=>{const q={...p};delete q[id];return q;});
  const del = id => { setEmps(p=>p.filter(x=>x.id!==id)); cancel(id); };
  const add = () => { if(!nw.nombre.trim()) return; setEmps(p=>[...p,{id:uid(),...nw}]); setNw({nombre:"",precio:""}); setShow(false); };
  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
      <div style={sec}>Empaques</div><button style={btnP} onClick={()=>setShow(true)}>+ Añadir</button>
    </div>
    {show && <div style={{...cardHL,marginBottom:".7rem"}}>
      <div style={row}>
        <div style={{...col,flex:3}}><label style={lbl}>Descripción</label><input style={inp} type="text" value={nw.nombre} onChange={e=>setNw(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Caja kraft"/></div>
        <div style={col}><label style={lbl}>Precio ($)</label><input style={inp} type="text" inputMode="decimal" value={nw.precio} onChange={e=>setNw(p=>({...p,precio:e.target.value}))} placeholder="0.00"/></div>
      </div>
      <div style={{display:"flex",gap:".4rem"}}><button style={btnP} onClick={add}>Guardar</button><button style={btn} onClick={()=>setShow(false)}>Cancelar</button></div>
    </div>}
    <div style={card}>
      <table style={tbl}><thead><tr><th style={th}>Empaque</th><th style={thR}>Precio/unidad</th><th style={{...th,width:"80px"}}></th></tr></thead>
        <tbody>{emps.map(e=>{const ed2=ed[e.id]; return <tr key={e.id} style={{background:ed2?"#fdf8f0":"transparent"}}>
          <td style={td}>{ed2?<input style={{...inpSm,width:"100%"}} type="text" value={ed2.nombre} onChange={ev=>setEV(e.id,"nombre",ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&save(e.id)}/>:e.nombre}</td>
          <td style={{...td,textAlign:"right"}}>{ed2?<input style={{...inpSm,width:"85px",textAlign:"right"}} type="text" inputMode="decimal" value={ed2.precio} onChange={ev=>setEV(e.id,"precio",ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&save(e.id)}/>:<span style={{color:AD,fontWeight:"bold"}}>{$(e.precio)}</span>}</td>
          <td style={{...td,textAlign:"right"}}>{ed2?<><button style={{...btnSm,background:A,color:"#fff",border:"none",marginRight:".25rem"}} onClick={()=>save(e.id)}>✓</button><button style={btnSm} onClick={()=>cancel(e.id)}>✕</button></>:<><button style={{...btnSm,marginRight:".25rem"}} onClick={()=>startEd(e)}>✏️</button><button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>del(e.id)}>✕</button></>}
          </td></tr>;})}
        </tbody>
      </table>
    </div>
  </>;
}

// ── Editor de receta ──
function EditorRec({rec, ings, emps, onSave, onCancel}) {
  const [f, setF] = useState({nombre:rec.nombre,cat:rec.cat,perdida:String(rec.perdida),energia:String(rec.energia),otros:String(rec.otros),notas:rec.notas||""});
  const [rIngs, setRIngs] = useState(rec.ings.map(l=>({...l,cantStr:String(l.cant)})));
  const [ops, setOps] = useState(rec.ops.map(o=>({...o})));
  const [vars, setVars] = useState(rec.vars.map(v=>({...v})));
  const sf = (k,v) => setF(p=>({...p,[k]:v}));
  const setRI = (idx,k,v) => setRIngs(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const setOP = (idx,k,v) => setOps(p=>p.map((o,i)=>i===idx?{...o,[k]:v}:o));
  const setV = (idx,k,v) => setVars(p=>p.map((x,i)=>i===idx?{...x,[k]:v}:x));
  const save = () => onSave({...rec,...f,
    ings: rIngs.map(l=>({id:l.id,ingId:l.ingId,cant:l.cantStr})),
    ops: ops.map(o=>({...o})),
    vars: vars.map(v=>({...v})),
  });
  return <div style={cardHL}>
    <div style={{...sec,marginBottom:".75rem"}}>Editar receta</div>
    <div style={row}>
      <div style={{...col,flex:3}}><label style={lbl}>Nombre</label><input style={inp} type="text" value={f.nombre} onChange={e=>sf("nombre",e.target.value)}/></div>
      <div style={col}><label style={lbl}>Categoría</label><select style={sel} value={f.cat} onChange={e=>sf("cat",e.target.value)}>{CATS.map(c=><option key={c} value={c}>{CAT[c]}</option>)}</select></div>
    </div>
    <div style={row}>
      <div style={col}><label style={lbl}>Pérdida cocción (%)</label>
        <input style={inp} type="text" inputMode="decimal" value={f.perdida} onChange={e=>sf("perdida",e.target.value)}/>
        <div style={{fontSize:".68rem",color:TM,fontFamily:f,marginTop:".2rem"}}>
          El peso de cada variante es el peso horneado. La app calcula la masa cruda necesaria.
        </div>
      </div>
      <div style={col}><label style={lbl}>Energía $/receta</label><input style={inp} type="text" inputMode="decimal" value={f.energia} onChange={e=>sf("energia",e.target.value)}/></div>
      <div style={col}><label style={lbl}>Otros costos $/receta</label><input style={inp} type="text" inputMode="decimal" value={f.otros} onChange={e=>sf("otros",e.target.value)}/></div>
    </div>

    <div style={{...sec,marginTop:".75rem",marginBottom:".55rem"}}>Ingredientes (en su unidad natural)</div>
    <table style={tbl}><thead><tr><th style={th}>Ingrediente</th><th style={{...thR,width:"120px"}}>Cantidad</th><th style={{...th,width:"40px"}}></th></tr></thead>
      <tbody>{rIngs.map((li,idx)=>{const ing=ings.find(i=>i.id===li.ingId); return <tr key={li.id}>
        <td style={td}><select style={{...sel,width:"100%"}} value={li.ingId} onChange={e=>setRI(idx,"ingId",e.target.value)}>{ings.map(i=><option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}</select></td>
        <td style={{...td,textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:".25rem",justifyContent:"flex-end"}}><input style={{...inpSm,width:"70px",textAlign:"right"}} type="text" inputMode="decimal" value={li.cantStr} onChange={e=>setRI(idx,"cantStr",e.target.value)}/><span style={{fontSize:".72rem",color:TD,minWidth:"28px"}}>{ing?.unidad||""}</span></div></td>
        <td style={{...td,textAlign:"center"}}><button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>setRIngs(p=>p.filter((_,i)=>i!==idx))}>✕</button></td>
      </tr>;})}
      </tbody>
    </table>
    <button style={{...btn,marginTop:".4rem"}} onClick={()=>setRIngs(p=>[...p,{id:uid(),ingId:ings[0]?.id||"",cantStr:"0"}])}>+ Ingrediente</button>

    <div style={{...sec,marginTop:".75rem",marginBottom:".55rem"}}>Mano de obra</div>
    {ops.map((op,idx)=><div key={op.id} style={{...row,alignItems:"flex-end"}}>
      <div style={{...col,flex:2}}><label style={lbl}>Nombre</label><input style={inpSm} type="text" value={op.nombre} onChange={e=>setOP(idx,"nombre",e.target.value)}/></div>
      <div style={col}><label style={lbl}>Horas</label><input style={inpSm} type="text" inputMode="decimal" value={op.horas} onChange={e=>setOP(idx,"horas",e.target.value)}/></div>
      <div style={col}><label style={lbl}>$/hora</label><input style={inpSm} type="text" inputMode="decimal" value={op.tarifa} onChange={e=>setOP(idx,"tarifa",e.target.value)}/></div>
      <div><button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>setOps(p=>p.filter((_,i)=>i!==idx))}>✕</button></div>
    </div>)}
    <button style={{...btn,marginBottom:".7rem"}} onClick={()=>setOps(p=>[...p,{id:uid(),nombre:"Operario",horas:"2",tarifa:"3.01"}])}>+ Operario</button>

    <div style={{...sec,marginTop:".55rem",marginBottom:".55rem"}}>Variantes de venta</div>
    <div style={tipI}>💡 Las piezas a producir se ajustan en la vista de producción. Aquí define los parámetros de cada variante.</div>
    {vars.map((v,idx)=><div key={v.id} style={{...varCard,marginTop:".5rem"}}>
      <div style={row}>
        <div style={{...col,flex:2}}><label style={lbl}>Nombre variante</label><input style={inpSm} type="text" value={v.nombre} onChange={e=>setV(idx,"nombre",e.target.value)}/></div>
        <div style={col}><label style={lbl}>Peso/pieza (g)</label><input style={inpSm} type="text" inputMode="decimal" value={v.pesoG} onChange={e=>setV(idx,"pesoG",e.target.value)}/></div>
        <div style={col}><label style={lbl}>Precio venta ($)</label><input style={inpSm} type="text" inputMode="decimal" value={v.precioVenta} onChange={e=>setV(idx,"precioVenta",e.target.value)}/></div>
      </div>
      <div style={row}>
        <div style={col}><label style={lbl}>Empaque</label><select style={sel} value={v.empaqueId} onChange={e=>setV(idx,"empaqueId",e.target.value)}>{emps.map(e=><option key={e.id} value={e.id}>{e.nombre} ({$(e.precio)})</option>)}</select></div>
        <div style={col}><label style={lbl}>Uds/semana (finanzas)</label><input style={inpSm} type="text" inputMode="numeric" value={v.udsSemana} onChange={e=>setV(idx,"udsSemana",e.target.value)}/></div>
      </div>
      <button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>setVars(p=>p.filter((_,i)=>i!==idx))}>✕ Eliminar variante</button>
    </div>)}
    <button style={{...btn,marginTop:".4rem"}} onClick={()=>setVars(p=>[...p,{id:uid(),nombre:"Nueva variante",pesoG:"100",piezas:"10",precioVenta:"0.00",empaqueId:emps[0]?.id||"",udsSemana:"0"}])}>+ Variante</button>

    <div style={{marginTop:".75rem"}}><label style={lbl}>Notas</label><input style={inp} type="text" value={f.notas} onChange={e=>sf("notas",e.target.value)}/></div>
    <div style={{display:"flex",gap:".45rem",marginTop:".8rem"}}><button style={btnP} onClick={save}>💾 Guardar</button><button style={btn} onClick={onCancel}>Cancelar</button></div>
  </div>;
}

// ── Vista de producción (Desglose) ──
function Desglose({rec, ings, emps, onEdit, onDel, onSavePiezas}) {
  // Estado local de piezas — independiente, solo para este render
  const [piezas, setPiezas] = useState(() =>
    Object.fromEntries((rec.vars||[]).map(v => [v.id, String(n(v.piezas)||0)]))
  );

  const setPieza = (id, val) => {
    const next = {...piezas, [id]: val};
    setPiezas(next);
    onSavePiezas(rec.id, next);
  };

  // Calcular con piezas actuales
  const d = calcular(rec, ings, piezas);
  const cc = catColor(rec.cat);

  return <div style={card}>
    {/* Cabecera */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:".4rem",marginBottom:".65rem"}}>
      <div>
        <span style={{fontSize:".92rem",fontWeight:"500",color:TX}}>{rec.nombre}</span>
        <span style={{...badge,background:cc.bg,color:cc.c,marginLeft:".45rem"}}>{CAT[rec.cat]}</span>
      </div>
      <div style={{display:"flex",gap:".35rem"}}>
        <button style={btnP} onClick={onEdit}>✏️ Editar</button>
        <button style={btnD} onClick={onDel}>Eliminar</button>
      </div>
    </div>

    {/* Piezas por variante */}
    <div style={{...sec,marginBottom:".5rem"}}>Piezas a producir por variante</div>
    {(rec.vars||[]).map(v => {
      const emp = emps.find(e=>e.id===v.empaqueId)||{nombre:"Sin empaque",precio:"0"};
      const pNum = n(piezas[v.id]||0);
      const gramosNetos = pNum * n(v.pesoG);
      return <div key={v.id} style={{...varCard,display:"flex",alignItems:"center",gap:".75rem",flexWrap:"wrap"}}>
        <div style={{minWidth:"120px"}}>
          <div style={{fontSize:".82rem",fontWeight:"500",color:TX}}>{v.nombre}</div>
          <div style={{fontSize:".7rem",color:TM,fontFamily:f}}>{v.pesoG}g · {emp.nombre}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
          <label style={{...lbl,marginBottom:0,fontSize:".68rem"}}>Piezas:</label>
          <input
            style={{width:"65px",background:SU,border:`2px solid ${A}`,borderRadius:4,color:AD,padding:".35rem .4rem",fontSize:"1.1rem",fontFamily:g,textAlign:"center",outline:"none",fontWeight:"bold"}}
            type="text" inputMode="numeric"
            value={piezas[v.id]||"0"}
            onChange={e => setPieza(v.id, e.target.value)}
          />
        </div>
        <div style={{fontSize:".75rem",color:TM,fontFamily:f}}>
          {(()=>{
            const perdidaV = n(rec.perdida||0)/100;
            const pesoCrudo = perdidaV < 1 ? Math.round(n(v.pesoG)/(1-perdidaV)) : n(v.pesoG);
            return pNum > 0
              ? `${n(v.pesoG)}g horneado · ${pesoCrudo}g crudo · total ${(pNum*pesoCrudo).toLocaleString()}g`
              : `${n(v.pesoG)}g horneado → ${pesoCrudo}g crudo`;
          })()}
        </div>
      </div>;
    })}


    {/* Resumen de masa */}
    <div style={{...sec,marginBottom:".4rem"}}>Masa necesaria</div>
    <div style={{...tipI,marginBottom:".5rem"}}>💡 Peso introducido = peso <strong>horneado</strong>. La app calcula la masa cruda necesaria con {rec.perdida}% de pérdida por cocción.</div>
    <div style={{display:"flex",gap:".55rem",flexWrap:"wrap",marginBottom:".65rem"}}>
      {[["Masa cruda total",`${d.totalBruto.toLocaleString()} g`],[`Pérdida ${rec.perdida}%`,`−${(d.totalBruto-d.totalNeto).toLocaleString()} g`],[`Peso horneado`,`${d.totalNeto.toLocaleString()} g`],[`Factor ×base`,`×${n(d.factor).toFixed(2)}`]].map(([l,v])=>
        <div key={l} style={{background:CA,border:`1px solid ${BL}`,borderRadius:4,padding:".4rem .6rem",flex:1,minWidth:"90px"}}>
          <div style={{fontSize:".58rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div>
          <div style={{fontSize:".9rem",fontWeight:"bold",color:AD,fontFamily:g}}>{v}</div>
        </div>
      )}
    </div>

    {/* Ingredientes escalados */}
    <div style={{...sec,marginBottom:".4rem"}}>Ingredientes necesarios</div>
    <table style={tbl}><thead><tr>
      <th style={th}>Ingrediente</th>
      <th style={thR}>Cant. base</th>
      <th style={thR}>Total necesario</th>
      <th style={thR}>Costo</th>
    </tr></thead><tbody>
      {d.lineasIng.map((li,i)=><tr key={i}>
        <td style={td}>{li.nombre}</td>
        <td style={tdR}>{li.cantBase} {li.unidad}</td>
        <td style={tdR}><strong style={{color:AD}}>{n(li.cantTotal).toFixed(3)} {li.unidad}</strong></td>
        <td style={{...td,textAlign:"right",color:AD,fontWeight:"bold"}}>{$(li.costo)}</td>
      </tr>)}
    </tbody></table>

    {/* Costos de producción */}
    <div style={{...sec,marginTop:".75rem",marginBottom:".4rem"}}>Costos de producción</div>
    {[["Ingredientes",d.costoIng],["Energía",d.costoEnergia],["Mano de obra",d.costoMO],...(n(rec.otros)>0?[["Otros",d.costoOtros]]:[])].map(([l,v])=>
      <div key={l} style={bar}><span style={{fontSize:".62rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>{l}</span><span style={{fontSize:".88rem",color:G,fontFamily:g,fontWeight:"bold"}}>{$(v)}</span></div>
    )}
    <div style={barHL}><span style={{fontSize:".62rem",color:AD,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em",fontWeight:"bold"}}>Subtotal producción</span><span style={{fontSize:".92rem",color:AD,fontFamily:g,fontWeight:"bold"}}>{$(d.costoProduccion)}</span></div>

    {/* Por variante */}
    <div style={{...sec,marginTop:".75rem",marginBottom:".5rem"}}>Por variante</div>
    {d.variantes.filter(v=>v.piezasN>0).map(v=>
      <div key={v.id} style={{...varCard,marginBottom:".5rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".45rem",flexWrap:"wrap",gap:".3rem"}}>
          <strong style={{fontSize:".85rem",color:TX}}>{v.nombre}</strong>
          <span style={{fontSize:".72rem",color:TM,fontFamily:f}}>{v.emp.nombre} · {$(v.costoEmp)}/u</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:".38rem",marginBottom:".45rem"}}>
          {[["Piezas",v.piezasN],["Gramos netos",`${v.gramosNetos.toLocaleString()}g`],["Costo/pieza",$(v.costoPieza)],["Precio venta",$(v.pvp)]].map(([l,val])=>
            <div key={l} style={{background:BG,borderRadius:4,padding:".38rem .55rem"}}>
              <div style={{fontSize:".58rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".07em"}}>{l}</div>
              <div style={{fontSize:".88rem",fontWeight:"bold",color:AD,fontFamily:g}}>{val}</div>
            </div>
          )}
        </div>
        <div style={{background:"#f0ede5",border:`1px solid ${A}`,borderRadius:5,padding:".65rem",textAlign:"center"}}>
          <div style={{display:"flex",gap:".9rem",justifyContent:"center",flexWrap:"wrap"}}>
            <div><div style={{fontSize:"1.35rem",fontWeight:"bold",color:v.ganPieza>=0?OK:WA,fontFamily:g,lineHeight:1}}>{$(v.ganPieza)}</div><div style={{fontSize:".6rem",color:TM,fontFamily:f}}>ganancia/pieza</div></div>
            <div><div style={{fontSize:"1.35rem",fontWeight:"bold",color:v.ganTotal>=0?OK:WA,fontFamily:g,lineHeight:1}}>{$(v.ganTotal)}</div><div style={{fontSize:".6rem",color:TM,fontFamily:f}}>ganancia total</div></div>
            <div><div style={{fontSize:"1.35rem",fontWeight:"bold",color:v.margen>=40?OK:v.margen>=20?G:WA,fontFamily:g,lineHeight:1}}>{P(v.margen)}</div><div style={{fontSize:".6rem",color:TM,fontFamily:f}}>margen</div></div>
          </div>
        </div>
      </div>
    )}

    {/* Totales */}
    <div style={{...barHL,marginTop:".5rem"}}><span style={{fontSize:".62rem",color:AD,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em",fontWeight:"bold"}}>Ingreso total</span><span style={{fontSize:".92rem",color:AD,fontFamily:g,fontWeight:"bold"}}>{$(d.ingresoTotal)}</span></div>
    <div style={{...bar,background:d.ganTotal>=0?OB:WB,border:`1px solid ${d.ganTotal>=0?OK:WA}`,marginTop:".35rem"}}>
      <span style={{fontSize:".62rem",fontFamily:f,textTransform:"uppercase",letterSpacing:".08em",fontWeight:"bold",color:d.ganTotal>=0?OK:WA}}>Ganancia neta batch</span>
      <span style={{fontSize:".92rem",fontFamily:g,fontWeight:"bold",color:d.ganTotal>=0?OK:WA}}>{$(d.ganTotal)}</span>
    </div>
    {rec.notas?<div style={tipI}>📝 {rec.notas}</div>:null}
  </div>;
}

// ── APP ──
export default function App() {
  const [tab, setTab] = useState("recetas");
  const [loading, setLoading] = useState(true);
  const [ings, setIngs] = useState(ING0);
  const [emps, setEmps] = useState(EMP0);
  const [recs, setRecs] = useState(REC0);
  const [cf, setCf] = useState(CF0);
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);

  useEffect(()=>{
    (async()=>{
      const [i,e,r,c] = await Promise.all([sGet(SK.ing),sGet(SK.emp),sGet(SK.rec),sGet(SK.cf)]);
      if(i) setIngs(i); if(e) setEmps(e); if(r) setRecs(r); if(c) setCf(c);
      setLoading(false);
    })();
  },[]);
  useEffect(()=>{ if(!loading) sSet(SK.ing,ings); },[ings,loading]);
  useEffect(()=>{ if(!loading) sSet(SK.emp,emps); },[emps,loading]);
  useEffect(()=>{ if(!loading) sSet(SK.rec,recs); },[recs,loading]);
  useEffect(()=>{ if(!loading) sSet(SK.cf,cf);   },[cf,loading]);

  const saveRec = r => { setRecs(p=>p.some(x=>x.id===r.id)?p.map(x=>x.id===r.id?r:x):[...p,r]); setEditId(null); setViewId(r.id); };
  const delRec = id => { setRecs(p=>p.filter(r=>r.id!==id)); setViewId(null); setEditId(null); };
  const newRec = () => {
    const r = {id:uid(),nombre:"Nueva receta",cat:"confiteria",perdida:"10",energia:"0.20",otros:"0",notas:"",
      ings:[], ops:[{id:uid(),nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
      vars:[{id:uid(),nombre:"Variante 1",pesoG:"100",piezas:"10",precioVenta:"0.00",empaqueId:emps[0]?.id||"",udsSemana:"0"}]};
    setRecs(p=>[...p,r]); setEditId(r.id); setViewId(null);
  };
  const savePiezas = (recId, piezasMap) => {
    setRecs(p=>p.map(r=>r.id!==recId?r:{
      ...r, vars: r.vars.map(v=>({...v, piezas: String(n(piezasMap[v.id])||0)}))
    }));
  };

  // Finanzas
  const totalFijos = n(cf.sueldo) + (cf.items||[]).reduce((a,x)=>a+n(x.monto),0);
  const linFin = recs.flatMap(r=>(r.vars||[]).filter(v=>n(v.udsSemana)>0).map(v=>{
    const piezasMap = Object.fromEntries((r.vars||[]).map(x=>[x.id,x.piezas]));
    const d = calcular(r, ings, piezasMap);
    const dv = d.variantes.find(x=>x.id===v.id);
    if(!dv) return null;
    const udsMes = n(v.udsSemana)*4;
    const ingreso = udsMes*n(v.precioVenta);
    const costoVar = dv.costoPieza*udsMes;
    const ganBruta = ingreso-costoVar;
    const margen = ingreso>0?(ganBruta/ingreso)*100:0;
    return {r,v,dv,udsMes,ingreso,costoVar,ganBruta,margen};
  }).filter(Boolean));
  const totIng = linFin.reduce((a,l)=>a+l.ingreso,0);
  const totCVar = linFin.reduce((a,l)=>a+l.costoVar,0);
  const ganBruta = totIng-totCVar;
  const ganNeta = ganBruta-totalFijos;
  const mProm = totIng>0?ganBruta/totIng:0;
  const puntoEq = mProm>0?totalFijos/mProm:0;
  const cobert = puntoEq>0?Math.min((totIng/puntoEq)*100,100):0;

  if(loading) return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,color:TM}}>Cargando...</div>;

  return <div style={{minHeight:"100vh",background:BG,color:TX,fontFamily:`${g},serif`}}>
    <div style={{background:SU,borderBottom:`2px solid ${BO}`,padding:"1.1rem 1.4rem .8rem",textAlign:"center"}}>
      <div style={{fontSize:".6rem",letterSpacing:".25em",color:A,textTransform:"uppercase",fontFamily:f,marginBottom:".25rem"}}>Gestión de Recetas · Costos · Finanzas</div>
      <h1 style={{fontSize:"clamp(1.2rem,4vw,1.8rem)",fontWeight:"normal",color:TX,margin:"0 0 .15rem"}}>Casa Ormaza Velásquez</h1>
      <p style={{fontSize:".73rem",color:TM,fontFamily:f,fontStyle:"italic"}}>Confitería · Conservería · Panadería Artesanal con Masa Madre Natural</p>
    </div>

    <div style={{maxWidth:"800px",margin:"0 auto",padding:"1rem .85rem 4rem"}}>
      <div style={nav}>
        {[["recetas","📋 Recetas"],["ingredientes","🌾 Ingredientes"],["empaques","📦 Empaques"],["finanzas","📊 Finanzas"]].map(([k,l])=>
          <button key={k} style={tab===k?navA:navBtn} onClick={()=>{setTab(k);setViewId(null);setEditId(null);}}>{l}</button>
        )}
      </div>

      {/* RECETAS */}
      {tab==="recetas" && <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
          <div style={sec}>Catálogo de productos</div>
          <button style={btnP} onClick={newRec}>+ Nueva receta</button>
        </div>
        {recs.map(r=>{
          const cc=catColor(r.cat);
          if(editId===r.id) return <EditorRec key={r.id} rec={r} ings={ings} emps={emps} onSave={saveRec} onCancel={()=>{setEditId(null);if(r.nombre==="Nueva receta")delRec(r.id);}}/>;
          if(viewId===r.id) return <div key={r.id}>
            <Desglose rec={r} ings={ings} emps={emps} onEdit={()=>{setEditId(r.id);setViewId(null);}} onDel={()=>delRec(r.id)} onSavePiezas={savePiezas}/>
            <button style={{...btn,marginBottom:".7rem",marginTop:"-.2rem"}} onClick={()=>setViewId(null)}>← Lista</button>
          </div>;
          // Lista
          const piezasMap = Object.fromEntries((r.vars||[]).map(v=>[v.id,v.piezas]));
          const d = calcular(r,ings,piezasMap);
          const mv = d.variantes.find(v=>v.piezasN>0);
          return <div key={r.id} style={{...card,cursor:"pointer"}} onClick={()=>{setViewId(r.id);setEditId(null);}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".4rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:".45rem",flexWrap:"wrap"}}>
                <span style={{fontSize:".9rem",fontWeight:"500",color:TX}}>{r.nombre}</span>
                <span style={{...badge,background:cc.bg,color:cc.c}}>{CAT[r.cat]}</span>
              </div>
              <div style={{display:"flex",gap:".75rem",alignItems:"center"}}>
                {mv&&<><span style={{fontSize:".78rem",color:TM,fontFamily:f}}>{mv.piezasN} uds</span><span style={{fontSize:".85rem",fontWeight:"bold",color:AD,fontFamily:g}}>{$(mv.costoPieza)}/u</span><span style={{fontSize:".8rem",fontWeight:"bold",color:mv.margen>=40?OK:mv.margen>=20?G:WA,fontFamily:f}}>{P(mv.margen)}</span></>}
                <span style={{fontSize:".68rem",color:TD,fontFamily:f}}>ver →</span>
              </div>
            </div>
            {r.vars.length>1&&<div style={{fontSize:".7rem",color:TM,fontFamily:f,marginTop:".2rem"}}>{r.vars.map(v=>v.nombre).join(" · ")}</div>}
          </div>;
        })}
      </>}

      {/* INGREDIENTES */}
      {tab==="ingredientes" && <TabIng ings={ings} setIngs={setIngs}/>}

      {/* EMPAQUES */}
      {tab==="empaques" && <TabEmp emps={emps} setEmps={setEmps}/>}

      {/* FINANZAS */}
      {tab==="finanzas" && <>
        <div style={sec}>Costos fijos mensuales</div>
        <div style={card}>
          <div style={row}>
            <div style={col}><label style={lbl}>Tu sueldo mensual ($)</label><input style={inp} type="text" inputMode="decimal" value={cf.sueldo} onChange={e=>setCf(p=>({...p,sueldo:e.target.value}))}/></div>
          </div>
          <div style={{...sec,marginBottom:".45rem"}}>Gastos fijos adicionales</div>
          {(cf.items||[]).map((item,idx)=><div key={item.id} style={{...row,alignItems:"flex-end",marginBottom:".4rem"}}>
            <div style={{...col,flex:3}}><input style={inpSm} type="text" value={item.nombre} onChange={e=>setCf(p=>({...p,items:p.items.map((x,i)=>i===idx?{...x,nombre:e.target.value}:x)}))}/></div>
            <div style={col}><input style={inpSm} type="text" inputMode="decimal" value={item.monto} onChange={e=>setCf(p=>({...p,items:p.items.map((x,i)=>i===idx?{...x,monto:e.target.value}:x)}))}/></div>
            <div><button style={{...btnSm,color:WA,borderColor:WA}} onClick={()=>setCf(p=>({...p,items:p.items.filter((_,i)=>i!==idx)}))}>✕</button></div>
          </div>)}
          <button style={{...btn,marginBottom:".5rem"}} onClick={()=>setCf(p=>({...p,items:[...(p.items||[]),{id:uid(),nombre:"Nuevo gasto",monto:"0"}]}))}>+ Gasto fijo</button>
          <div style={barHL}><span style={{fontSize:".62rem",color:AD,fontFamily:f,textTransform:"uppercase",fontWeight:"bold"}}>Total fijos/mes</span><span style={{fontSize:".92rem",color:AD,fontFamily:g,fontWeight:"bold"}}>{$(totalFijos)}</span></div>
        </div>

        <div style={sec}>Panel mensual</div>
        <div style={kpiG}>
          {[[$(totIng),"Ingresos brutos",null],[$(totCVar),"Costos variables",null],[$(ganBruta),"Ganancia bruta",null],[$(ganNeta),"Ganancia neta",ganNeta>=0?OK:WA]].map(([v,l,c])=>
            <div key={l} style={kpi}><span style={{fontSize:"1.35rem",fontWeight:"bold",color:c||AD,fontFamily:g,lineHeight:1,display:"block"}}>{v}</span><span style={{fontSize:".58rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em",marginTop:".12rem",display:"block"}}>{l}</span></div>
          )}
        </div>

        <div style={sec}>Punto de equilibrio</div>
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:".4rem",marginBottom:".4rem"}}>
            <div><div style={{fontSize:".6rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>Necesario/mes</div><div style={{fontSize:"1.25rem",fontWeight:"bold",color:AD,fontFamily:g}}>{$(puntoEq)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:".6rem",color:TM,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>Cobertura</div><div style={{fontSize:"1.25rem",fontWeight:"bold",fontFamily:g,color:cobert>=100?OK:WA}}>{P(cobert)}</div></div>
          </div>
          <div style={{background:BL,borderRadius:4,height:"7px",overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${cobert}%`,background:cobert>=100?OK:WA,transition:"width .3s"}}/></div>
          {ganNeta>=0?<div style={tipV}>✅ El negocio cubre todos sus costos. Ganancia neta: {$(ganNeta)}/mes.</div>:<div style={tipW}>⚠️ Faltan {$(puntoEq-totIng)}/mes para cubrir los costos fijos.</div>}
        </div>

        <div style={sec}>Por producto / variante</div>
        <div style={card}>
          {linFin.length===0?<div style={{color:TM,fontFamily:f,fontSize:".8rem"}}>Introduce unidades/semana en las variantes de cada receta para ver los números aquí.</div>
          :linFin.map((l,i)=>{const cc=catColor(l.r.cat); return <div key={i} style={{marginBottom:".85rem",paddingBottom:".85rem",borderBottom:`1px solid ${BL}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".3rem",marginBottom:".3rem"}}>
              <div><span style={{fontSize:".85rem",fontWeight:"500",color:TX}}>{l.r.nombre}</span><span style={{...badge,background:cc.bg,color:cc.c,marginLeft:".35rem"}}>{l.v.nombre}</span></div>
              <span style={{fontSize:".85rem",fontWeight:"bold",color:l.ganBruta>=0?OK:WA,fontFamily:g}}>{$(l.ganBruta)}/mes</span>
            </div>
            <div style={{display:"flex",gap:".85rem",flexWrap:"wrap"}}>
              {[[`${l.udsMes} uds/mes`,null],[`Ingreso ${$(l.ingreso)}`,null],[`Costo var. ${$(l.costoVar)}`,null],[`${P(l.margen)} margen`,l.margen>=40?OK:l.margen>=20?G:WA]].map(([v,c])=>
                <span key={v} style={{fontSize:".72rem",color:c||TM,fontFamily:f}}>{v}</span>
              )}
            </div>
          </div>;})}
        </div>
      </>}
    </div>
  </div>;
}
