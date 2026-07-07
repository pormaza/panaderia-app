import { useState, useMemo, useEffect } from "react";

async function storageGet(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  }
}
async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch(e) { console.error(e); }
  }
}
const SK = {
  ing:  "rc-v1-ingredientes", emp:  "rc-v1-empaques", rec:  "rc-v1-recetas", cf:   "rc-v1-costos-fijos",
};

function uid() { return "x" + Math.random().toString(36).slice(2,9); }
function toN(v) { return parseFloat(String(v ?? 0).replace(",",".")) || 0; }
const fmt  = n => `$${toN(n).toFixed(2)}`;
const fmtP = n => `${toN(n).toFixed(1)}%`;

const UNIDADES = ["kg","g","litro","ml","unidad","docena","lb","oz"];
const CATS = ["confiteria","conserveria","panaderia","otro"];
const CAT_LABEL = { confiteria:"Confitería", conserveria:"Conservería", panaderia:"Panadería", otro:"Otro" };

const ING_INI = [
  { id:"i1", nombre:"Azúcar", unidad:"kg", costo:"0.90"  }, { id:"i2", nombre:"Mantequilla", unidad:"kg", costo:"4.50"  }, { id:"i3", nombre:"Huevos", unidad:"unidad", costo:"0.18"  }, { id:"i4", nombre:"Chocolate negro", unidad:"kg", costo:"8.00"  }, { id:"i5", nombre:"Almendras", unidad:"kg", costo:"12.00" }, { id:"i6", nombre:"Maní", unidad:"kg", costo:"2.50"  }, { id:"i7", nombre:"Miel", unidad:"kg", costo:"6.00"  }, { id:"i8", nombre:"Fruta para mermelada", unidad:"kg", costo:"1.50"  }, { id:"i9", nombre:"Almidón de yuca", unidad:"kg", costo:"1.20"  }, { id:"i10", nombre:"Sal", unidad:"kg", costo:"0.33"  }, { id:"i11", nombre:"Vainilla", unidad:"ml", costo:"0.05"  }, { id:"i12", nombre:"Agua", unidad:"litro", costo:"0.001" }, { id:"i13", nombre:"Pan masa madre (pieza)",unidad:"unidad", costo:"3.00"  },
];

const EMP_INI = [
  { id:"e1", nombre:"Bolsa pequeña (≤200g)", costo:"0.08" }, { id:"e2", nombre:"Bolsa mediana (200–500g)",costo:"0.12" }, { id:"e3", nombre:"Bolsa grande (500g–1kg)", costo:"0.18" }, { id:"e4", nombre:"Bolsa extra (>1kg)", costo:"0.25" }, { id:"e5", nombre:"Frasco 250ml", costo:"0.65" }, { id:"e6", nombre:"Frasco 500ml", costo:"0.85" }, { id:"e7", nombre:"Frasco 1L", costo:"1.20" }, { id:"e8", nombre:"Sin empaque", costo:"0.00" },
];

const REC_INI = [
  { id:"r1", nombre:"Galletas de almidón", categoria:"confiteria", perdida:"10",
    ingredientes:[{id:"a1",ingId:"i9",cant:"1"},{id:"a2",ingId:"i1",cant:"0.3"},{id:"a3",ingId:"i2",cant:"0.2"},{id:"a4",ingId:"i3",cant:"4"}],
    energia:"0.20", otrosCostos:"0",
    operarios:[{id:"b1",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    variantes:[{id:"c1",nombre:"Paquete 140g",pesoG:"140",empaqueId:"e2",precioVenta:"4.00",unidadesSemana:"30"}], notas:"" },
  { id:"r2", nombre:"Galletas de chocolate negro", categoria:"confiteria", perdida:"10",
    ingredientes:[{id:"a5",ingId:"i4",cant:"0.5"},{id:"a6",ingId:"i1",cant:"0.2"},{id:"a7",ingId:"i2",cant:"0.15"},{id:"a8",ingId:"i3",cant:"2"}],
    energia:"0.20", otrosCostos:"0",
    operarios:[{id:"b2",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    variantes:[{id:"c2",nombre:"Paquete 140g",pesoG:"140",empaqueId:"e2",precioVenta:"4.00",unidadesSemana:"0"}], notas:"" },
  { id:"r3", nombre:"Forgotten cookies", categoria:"confiteria", perdida:"5",
    ingredientes:[{id:"a9",ingId:"i3",cant:"4"},{id:"a10",ingId:"i1",cant:"0.25"},{id:"a11",ingId:"i4",cant:"0.2"}],
    energia:"0.15", otrosCostos:"0",
    operarios:[{id:"b3",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    variantes:[{id:"c3",nombre:"Paquete 140g",pesoG:"140",empaqueId:"e1",precioVenta:"4.00",unidadesSemana:"0"}], notas:"" },
  { id:"r4", nombre:"Almendras caramelizadas", categoria:"confiteria", perdida:"5",
    ingredientes:[{id:"a12",ingId:"i5",cant:"0.5"},{id:"a13",ingId:"i1",cant:"0.15"}],
    energia:"0.15", otrosCostos:"0",
    operarios:[{id:"b4",nombre:"Operario 1",horas:"1",tarifa:"3.01"}],
    variantes:[{id:"c4",nombre:"Paquete 100g",pesoG:"100",empaqueId:"e2",precioVenta:"5.00",unidadesSemana:"0"},{id:"c5",nombre:"Paquete 200g",pesoG:"200",empaqueId:"e3",precioVenta:"9.00",unidadesSemana:"0"}], notas:"" },
  { id:"r5", nombre:"Mermelada", categoria:"conserveria", perdida:"20",
    ingredientes:[{id:"a14",ingId:"i8",cant:"2"},{id:"a15",ingId:"i1",cant:"0.8"}],
    energia:"0.30", otrosCostos:"0",
    operarios:[{id:"b5",nombre:"Operario 1",horas:"2",tarifa:"3.01"}],
    variantes:[{id:"c6",nombre:"Frasco 250ml",pesoG:"250",empaqueId:"e5",precioVenta:"6.00",unidadesSemana:"0"},{id:"c7",nombre:"Frasco 500ml",pesoG:"500",empaqueId:"e6",precioVenta:"10.00",unidadesSemana:"0"}], notas:"" },
  { id:"r6", nombre:"Peanut butter", categoria:"conserveria", perdida:"5",
    ingredientes:[{id:"a16",ingId:"i6",cant:"1.5"},{id:"a17",ingId:"i10",cant:"0.01"}],
    energia:"0.20", otrosCostos:"0",
    operarios:[{id:"b6",nombre:"Operario 1",horas:"1",tarifa:"3.01"}],
    variantes:[{id:"c8",nombre:"Frasco 250ml",pesoG:"250",empaqueId:"e5",precioVenta:"7.00",unidadesSemana:"0"}], notas:"" },
  { id:"r7", nombre:"Honey", categoria:"conserveria", perdida:"0",
    ingredientes:[{id:"a18",ingId:"i7",cant:"1"}],
    energia:"0.05", otrosCostos:"0",
    operarios:[{id:"b7",nombre:"Operario 1",horas:"0.5",tarifa:"3.01"}],
    variantes:[{id:"c9",nombre:"Frasco 250ml",pesoG:"250",empaqueId:"e5",precioVenta:"8.00",unidadesSemana:"0"}], notas:"" },
  { id:"r8", nombre:"Pan masa madre", categoria:"panaderia", perdida:"0",
    ingredientes:[{id:"a19",ingId:"i13",cant:"1"}],
    energia:"0", otrosCostos:"0", operarios:[],
    variantes:[{id:"c10",nombre:"Pieza 1kg",pesoG:"1000",empaqueId:"e4",precioVenta:"7.00",unidadesSemana:"30"}],
    notas:"Costo por pieza introducido manualmente desde el planner." },
];

const CF_INI = {
  sueldo:"600", items:[
    {id:uid(),nombre:"Hogar / negocio",monto:"100"}, {id:uid(),nombre:"Internet",monto:"30"}, ],
};

// Costo de ingredientes de una receta (1 batch, sin multiplicador)
function calcIngCost(rec, ings) {
  return rec.ingredientes.map(li => {
    const ing = ings.find(i => i.id === li.ingId);
    if (!ing) return { nombre:"?", cant:toN(li.cant), unidad:"?", costoUnit:0, costoTotal:0 };
    const cant = toN(li.cant);
    // Costo: cantidad × precio por unidad (misma unidad)
    const costoTotal = cant * toN(ing.costo);
    return { nombre:ing.nombre, cant, unidad:ing.unidad, costoUnit:toN(ing.costo), costoTotal };
  });
}

// Peso bruto total del batch en gramos
function calcPesoBruto(rec, ings) {
  return rec.ingredientes.reduce((acc, li) => {
    const ing = ings.find(i => i.id === li.ingId);
    if (!ing) return acc;
    const cant = toN(li.cant);
    if (ing.unidad === "kg")    return acc + cant * 1000;
    if (ing.unidad === "g")     return acc + cant;
    if (ing.unidad === "litro") return acc + cant * 1000;
    if (ing.unidad === "ml")    return acc + cant;
    return acc; // unidades (huevos etc) no suman peso
  }, 0);
}

// Cálculo completo de una receta con multiplicador
function calcReceta(rec, ings, emps, mult = 1) {
  const m = Math.max(0.1, toN(mult));
  const lineasIng = calcIngCost(rec, ings);
  const costoIngUnit = lineasIng.reduce((a, l) => a + l.costoTotal, 0); // 1 batch
  const costoIngTotal = costoIngUnit * m;

  const pesoBrutoUnit = calcPesoBruto(rec, ings); // gramos, 1 batch
  const perdida = toN(rec.perdida) / 100;
  const pesoNetoUnit = Math.round(pesoBrutoUnit * (1 - perdida));
  const pesoBrutoTotal = Math.round(pesoBrutoUnit * m);
  const pesoNetoTotal = Math.round(pesoNetoUnit * m);

  const costoEnergiaUnit = toN(rec.energia);
  const costoEnergiaTotal = costoEnergiaUnit * m;

  const costoOtrosUnit = toN(rec.otrosCostos);
  const costoOtrosTotal = costoOtrosUnit * m;

  const costoMOUnit = (rec.operarios || []).reduce((a, op) =>
    a + toN(op.horas) * toN(op.tarifa), 0);
  const costoMOTotal = costoMOUnit * m;

  // Variantes: piezas, costo por pieza, ganancia
  const variantes = (rec.variantes || []).map(v => {
    const emp = emps.find(e => e.id === v.empaqueId) || { costo:"0", nombre:"Sin empaque" };
    const pesoG = toN(v.pesoG);
    const piezasUnit = pesoG > 0 ? Math.floor(pesoNetoUnit / pesoG) : 0;
    const piezasTotal = piezasUnit * m;
    const costoEmpUnit = toN(emp.costo) * piezasUnit;
    const costoEmpTotal = costoEmpUnit * m;
    const costoTotalBatch = costoIngTotal + costoEnergiaTotal + costoOtrosTotal + costoMOTotal + costoEmpTotal;
    const costoPorPieza = piezasTotal > 0 ? costoTotalBatch / piezasTotal : 0;
    const pvp = toN(v.precioVenta);
    const gananciaPorPieza = pvp - costoPorPieza;
    const gananciaTotal = gananciaPorPieza * piezasTotal;
    const ingresoTotal = pvp * piezasTotal;
    const margen = pvp > 0 ? (gananciaPorPieza / pvp) * 100 : 0;
    return {
      ...v, emp, pesoG, piezasUnit, piezasTotal, costoEmpUnit, costoEmpTotal, costoPorPieza, pvp, gananciaPorPieza, gananciaTotal, ingresoTotal, margen, };
  });

  return {
    lineasIng, costoIngUnit, costoIngTotal, pesoBrutoUnit, pesoNetoUnit, pesoBrutoTotal, pesoNetoTotal, costoEnergiaUnit, costoEnergiaTotal, costoOtrosUnit, costoOtrosTotal, costoMOUnit, costoMOTotal, variantes, mult: m, };
}

// Finanzas globales
function calcFinanzas(recetas, ings, emps, cf) {
  const totalFijos = toN(cf.sueldo) + (cf.items||[]).reduce((a,i)=>a+toN(i.monto),0);

  const lineas = recetas.flatMap(rec =>
    (rec.variantes||[])
      .filter(v => toN(v.unidadesSemana) > 0)
      .map(v => {
        const d = calcReceta(rec, ings, emps, 1);
        const dv = d.variantes.find(x => x.id === v.id);
        if (!dv) return null;
        const udsMes = toN(v.unidadesSemana) * 4;
        // Batchs necesarios para producir esas unidades
        const batchs = dv.piezasUnit > 0 ? Math.ceil(udsMes / dv.piezasUnit) : 0;
        const dBatch = calcReceta(rec, ings, emps, batchs);
        const dvBatch = dBatch.variantes.find(x => x.id === v.id);
        const ingreso = udsMes * toN(v.precioVenta);
        const costoVar = dvBatch ? dvBatch.costoPorPieza * udsMes : 0;
        const ganBruta = ingreso - costoVar;
        const margen = ingreso > 0 ? (ganBruta/ingreso)*100 : 0;
        return { rec, v, udsMes, batchs, ingreso, costoVar, ganBruta, margen, dv };
      })
      .filter(Boolean)
  );

  const totalIngresos = lineas.reduce((a,l)=>a+l.ingreso,0);
  const totalCostoVar = lineas.reduce((a,l)=>a+l.costoVar,0);
  const ganBruta = totalIngresos - totalCostoVar;
  const ganNeta = ganBruta - totalFijos;
  const margenProm = totalIngresos > 0 ? ganBruta/totalIngresos : 0;
  const puntoEq = margenProm > 0 ? totalFijos/margenProm : 0;
  const cobertura = puntoEq > 0 ? Math.min((totalIngresos/puntoEq)*100, 100) : 0;

  return { lineas, totalIngresos, totalCostoVar, ganBruta, ganNeta, totalFijos, puntoEq, cobertura, margenProm };
}

const C={bg:"#f5f0e8",surface:"#fff",card:"#faf7f2",border:"#ddd5c0",borderLight:"#ede5d0",accent:"#8b5e2a",accentDark:"#6b4520",gold:"#9a7020",text:"#2a1f0e",textMuted:"#6b5a40",textDim:"#9a8a70",success:"#2a5a2a",successBg:"#e8f5e8",warning:"#8a4010",warningBg:"#fff3e8",info:"#2a5a78",infoBg:"#e8f2f8",catC:"#5a7a2a",catCL:"#edf5e0",catS:"#2a5a7a",catSL:"#e0edf5",catP:"#8b5e2a",catPL:"#f5ede0",catO:"#5a5a5a",catOL:"#f0f0f0"};
const f="Arial";const g="Georgia";
const S={
app:{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:`${g},serif`},
header:{background:C.surface,borderBottom:`2px solid ${C.border}`,padding:"1.25rem 1.5rem .9rem",textAlign:"center"},
eyebrow:{fontSize:".63rem",letterSpacing:".25em",color:C.accent,textTransform:"uppercase",fontFamily:f,marginBottom:".3rem"},
title:{fontSize:"clamp(1.3rem,4vw,1.9rem)",fontWeight:"normal",color:C.text,margin:"0 0 .2rem"},
subtitle:{fontSize:".76rem",color:C.textMuted,fontFamily:f,fontStyle:"italic"},
main:{maxWidth:"800px",margin:"0 auto",padding:"1rem .9rem 4rem"},
sec:{fontSize:".61rem",letterSpacing:".2em",textTransform:"uppercase",color:C.accent,fontFamily:f,marginBottom:".75rem",paddingBottom:".32rem",borderBottom:`1px solid ${C.border}`},
card:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:".95rem",marginBottom:".75rem",boxShadow:"0 1px 3px rgba(0,0,0,.05)"},
cardHL:{background:C.surface,border:`2px solid ${C.accent}`,borderRadius:6,padding:".95rem",marginBottom:".75rem"},
lbl:{display:"block",fontSize:".64rem",letterSpacing:".1em",textTransform:"uppercase",color:C.textMuted,fontFamily:f,marginBottom:".28rem"},
inp:{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,padding:".48rem .6rem",fontSize:".95rem",fontFamily:g,boxSizing:"border-box",outline:"none"},
inpSm:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,padding:".38rem .5rem",fontSize:".85rem",fontFamily:f,boxSizing:"border-box",outline:"none",width:"100%"},
sel:{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,padding:".42rem .5rem",fontSize:".85rem",fontFamily:f,boxSizing:"border-box",outline:"none"},
nav:{display:"flex",marginBottom:"1rem",borderBottom:`2px solid ${C.border}`,background:C.surface,borderRadius:"6px 6px 0 0",overflow:"hidden",flexWrap:"wrap"},
navBtn:{flex:1,minWidth:"70px",padding:".65rem .3rem",fontSize:".63rem",letterSpacing:".06em",textTransform:"uppercase",fontFamily:f,cursor:"pointer",border:"none",borderBottom:"3px solid transparent",background:"transparent",color:C.textMuted,textAlign:"center",marginBottom:"-2px"},
navA:{color:C.accent,borderBottom:`3px solid ${C.accent}`,background:"#f5ede0",fontWeight:"bold"},
row:{display:"flex",gap:".6rem",flexWrap:"wrap",marginBottom:".6rem"},
col:{flex:1,minWidth:"110px"},
btn:{padding:".48rem .9rem",fontSize:".75rem",fontFamily:f,cursor:"pointer",border:`1px solid ${C.border}`,borderRadius:4,background:C.surface,color:C.textMuted,display:"inline-flex",alignItems:"center",gap:".3rem"},
btnP:{background:C.accent,border:`1px solid ${C.accentDark}`,color:"#fff"},
btnD:{background:C.warningBg,border:`1px solid ${C.warning}`,color:C.warning},
btnSm:{padding:".28rem .55rem",fontSize:".7rem",fontFamily:f,cursor:"pointer",border:`1px solid ${C.border}`,borderRadius:3,background:C.surface,color:C.textMuted},
bar:{background:C.card,border:`1px solid ${C.borderLight}`,borderRadius:4,padding:".5rem .8rem",marginTop:".4rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:".3rem"},
barHL:{background:"#f0ede5",border:`1px solid ${C.accent}`,borderRadius:4,padding:".5rem .8rem",marginTop:".4rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:".3rem"},
barLbl:{fontSize:".64rem",color:C.textMuted,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"},
barVal:{fontSize:".92rem",color:C.gold,fontFamily:g,fontWeight:"bold"},
tipV:{background:C.successBg,border:`1px solid ${C.success}55`,borderRadius:4,padding:".55rem .8rem",fontSize:".74rem",color:C.success,fontFamily:f,lineHeight:1.5,marginTop:".5rem"},
tipW:{background:C.warningBg,border:`1px solid ${C.warning}`,borderRadius:4,padding:".55rem .8rem",fontSize:".74rem",color:C.warning,fontFamily:f,lineHeight:1.5,marginTop:".5rem"},
tipI:{background:C.infoBg,border:`1px solid ${C.info}55`,borderRadius:4,padding:".55rem .8rem",fontSize:".74rem",color:C.info,fontFamily:f,lineHeight:1.5,marginTop:".5rem"},
tbl:{width:"100%",borderCollapse:"collapse",fontSize:".82rem",fontFamily:f},
th:{textAlign:"left",fontSize:".6rem",letterSpacing:".1em",textTransform:"uppercase",color:C.textMuted,padding:".3rem .5rem",borderBottom:`2px solid ${C.border}`,fontFamily:f},
thR:{textAlign:"right",fontSize:".6rem",letterSpacing:".1em",textTransform:"uppercase",color:C.textMuted,padding:".3rem .5rem",borderBottom:`2px solid ${C.border}`,fontFamily:f},
td:{padding:".38rem .5rem",borderBottom:`1px solid ${C.borderLight}`,color:C.text,verticalAlign:"middle"},
tdM:{padding:".38rem .5rem",borderBottom:`1px solid ${C.borderLight}`,color:C.textMuted,verticalAlign:"middle"},
tdR:{padding:".38rem .5rem",borderBottom:`1px solid ${C.borderLight}`,color:C.textMuted,textAlign:"right",verticalAlign:"middle"},
kpiGrid:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:".55rem",marginBottom:".75rem"},
kpi:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,padding:".75rem",textAlign:"center"},
kpiVal:{fontSize:"1.4rem",fontWeight:"bold",color:C.accentDark,fontFamily:g,lineHeight:1,display:"block"},
kpiLbl:{fontSize:".6rem",color:C.textMuted,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em",marginTop:".15rem",display:"block"},
badge:{fontSize:".58rem",padding:".1rem .38rem",borderRadius:3,fontFamily:f,textTransform:"uppercase",letterSpacing:".06em",display:"inline-block"},
varCard:{background:C.card,border:`1px solid ${C.borderLight}`,borderRadius:5,padding:".75rem",marginBottom:".5rem"},
multBox:{background:"#f0ede5",border:`1px solid ${C.border}`,borderRadius:6,padding:".85rem",marginBottom:".75rem",display:"flex",alignItems:"center",gap:".9rem",flexWrap:"wrap"},
multInp:{width:"65px",background:C.surface,border:`1px solid ${C.accent}`,borderRadius:4,color:C.accentDark,padding:".4rem .5rem",fontSize:"1.1rem",fontFamily:g,textAlign:"center",outline:"none",fontWeight:"bold"},
barBg:{background:C.borderLight,borderRadius:4,height:"7px",overflow:"hidden",marginTop:".4rem"},

rowSB:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".4rem"},
rowSBS:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".3rem",marginBottom:".3rem"},
flexWrap:{display:"flex",flexWrap:"wrap",gap:".9rem"},
bigNum:{fontSize:"1.5rem",fontWeight:"bold",fontFamily:g,lineHeight:1},
};

function catC(cat) {
  if(cat==="confiteria")  return {color:C.catC, bg:C.catCL};
  if(cat==="conserveria") return {color:C.catS, bg:C.catSL};
  if(cat==="panaderia")   return {color:C.catP, bg:C.catPL};
  return {color:C.catO, bg:C.catOL};
}

function TabIngredientes({ings, setIngs}) {
  const [edit, setEdit] = useState({});
  const [nuevo, setNuevo] = useState({nombre:"",unidad:"kg",costo:""});
  const [show, setShow] = useState(false);

  const startEdit = i => setEdit(p=>({...p,[i.id]:{nombre:i.nombre,unidad:i.unidad,costo:String(i.costo)}}));
  const setEV = (id,f,v) => setEdit(p=>({...p,[id]:{...p[id],[f]:v}}));
  const saveRow = id => {
    const e = edit[id];
    setIngs(prev=>prev.map(i=>i.id===id?{...i,nombre:e.nombre,unidad:e.unidad,costo:e.costo}:i));
    setEdit(p=>{const n={...p};delete n[id];return n;});
  };
  const cancelRow = id => setEdit(p=>{const n={...p};delete n[id];return n;});
  const delRow = id => { setIngs(prev=>prev.filter(i=>i.id!==id)); cancelRow(id); };
  const addRow = () => {
    if(!nuevo.nombre.trim()) return;
    setIngs(prev=>[...prev,{id:uid(),nombre:nuevo.nombre.trim(),unidad:nuevo.unidad,costo:nuevo.costo}]);
    setNuevo({nombre:"",unidad:"kg",costo:""});
    setShow(false);
  };

  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".75rem"}}>
      <div style={S.sec}>Ingredientes — precios actualizables</div>
      <button style={{...S.btn,...S.btnP}} onClick={()=>setShow(true)}>+ Añadir</button>
    </div>
    <div style={S.tipI}>💡 Actualiza el precio de un ingrediente aquí y se recalcula automáticamente en todas las recetas que lo usan.</div>

    {show && <div style={{...S.cardHL,marginTop:".75rem"}}>
      <div style={S.row}>
        <div style={{...S.col,flex:3}}><label style={S.lbl}>Nombre</label>
          <input style={S.inp} type="text" value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Avena"/></div>
        <div style={S.col}><label style={S.lbl}>Unidad</label>
          <select style={S.sel} value={nuevo.unidad} onChange={e=>setNuevo(p=>({...p,unidad:e.target.value}))}>
            {UNIDADES.map(u=><option key={u}>{u}</option>)}</select></div>
        <div style={S.col}><label style={S.lbl}>Precio / unidad ($)</label>
          <input style={S.inp} type="text" inputMode="decimal" value={nuevo.costo} onChange={e=>setNuevo(p=>({...p,costo:e.target.value}))} placeholder="0.00"/></div>
      </div>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <button style={{...S.btn,...S.btnP}} onClick={addRow}>Guardar</button>
        <button style={S.btn} onClick={()=>setShow(false)}>Cancelar</button>
      </div>
    </div>}

    <div style={S.card}>
      <table style={S.tbl}>
        <thead><tr>
          <th style={S.th}>Ingrediente</th>
          <th style={S.th}>Unidad</th>
          <th style={S.thR}>Precio / unidad</th>
          <th style={{...S.th,width:"90px"}}></th>
        </tr></thead>
        <tbody>
          {ings.map(i=>{
            const ed = edit[i.id];
            return <tr key={i.id} style={{background:ed?"#fdf8f0":"transparent"}}>
              <td style={S.td}>{ed
                ? <input style={{...S.inpSm,width:"100%"}} type="text" value={ed.nombre}
                    onChange={e=>setEV(i.id,"nombre",e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&saveRow(i.id)}/>
                : i.nombre}
              </td>
              <td style={S.tdM}>{ed
                ? <select style={{...S.inpSm,width:"90px"}} value={ed.unidad}
                    onChange={e=>setEV(i.id,"unidad",e.target.value)}>
                    {UNIDADES.map(u=><option key={u}>{u}</option>)}</select>
                : i.unidad}
              </td>
              <td style={{...S.td,textAlign:"right"}}>{ed
                ? <input style={{...S.inpSm,width:"90px",textAlign:"right"}} type="text" inputMode="decimal"
                    value={ed.costo} onChange={e=>setEV(i.id,"costo",e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&saveRow(i.id)}/>
                : <span style={{color:C.accentDark,fontWeight:"bold"}}>{fmt(i.costo)}</span>}
              </td>
              <td style={{...S.td,textAlign:"right"}}>
                {ed
                  ? <><button style={{...S.btnSm,background:C.accent,color:"#fff",border:"none",marginRight:"0.3rem"}} onClick={()=>saveRow(i.id)}>✓</button>
                      <button style={S.btnSm} onClick={()=>cancelRow(i.id)}>✕</button></>
                  : <><button style={{...S.btnSm,marginRight:"0.3rem"}} onClick={()=>startEdit(i)}>✏️</button>
                      <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}} onClick={()=>delRow(i.id)}>✕</button></>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </>;
}

function TabEmpaques({emps, setEmps}) {
  const [edit, setEdit] = useState({});
  const [nuevo, setNuevo] = useState({nombre:"",costo:""});
  const [show, setShow] = useState(false);

  const startEdit = e => setEdit(p=>({...p,[e.id]:{nombre:e.nombre,costo:String(e.costo)}}));
  const setEV = (id,f,v) => setEdit(p=>({...p,[id]:{...p[id],[f]:v}}));
  const saveRow = id => {
    const e = edit[id];
    setEmps(prev=>prev.map(x=>x.id===id?{...x,nombre:e.nombre,costo:e.costo}:x));
    setEdit(p=>{const n={...p};delete n[id];return n;});
  };
  const cancelRow = id => setEdit(p=>{const n={...p};delete n[id];return n;});
  const delRow = id => { setEmps(prev=>prev.filter(x=>x.id!==id)); cancelRow(id); };
  const addRow = () => {
    if(!nuevo.nombre.trim()) return;
    setEmps(prev=>[...prev,{id:uid(),nombre:nuevo.nombre.trim(),costo:nuevo.costo}]);
    setNuevo({nombre:"",costo:""});
    setShow(false);
  };

  return <>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".75rem"}}>
      <div style={S.sec}>Empaques</div>
      <button style={{...S.btn,...S.btnP}} onClick={()=>setShow(true)}>+ Añadir</button>
    </div>

    {show && <div style={{...S.cardHL,marginBottom:".75rem"}}>
      <div style={S.row}>
        <div style={{...S.col,flex:3}}><label style={S.lbl}>Descripción</label>
          <input style={S.inp} type="text" value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Bolsa kraft 200g"/></div>
        <div style={S.col}><label style={S.lbl}>Costo ($)</label>
          <input style={S.inp} type="text" inputMode="decimal" value={nuevo.costo} onChange={e=>setNuevo(p=>({...p,costo:e.target.value}))} placeholder="0.00"/></div>
      </div>
      <div style={{display:"flex",gap:"0.5rem"}}>
        <button style={{...S.btn,...S.btnP}} onClick={addRow}>Guardar</button>
        <button style={S.btn} onClick={()=>setShow(false)}>Cancelar</button>
      </div>
    </div>}

    <div style={S.card}>
      <table style={S.tbl}>
        <thead><tr>
          <th style={S.th}>Empaque</th>
          <th style={S.thR}>Costo / unidad</th>
          <th style={{...S.th,width:"90px"}}></th>
        </tr></thead>
        <tbody>
          {emps.map(e=>{
            const ed = edit[e.id];
            return <tr key={e.id} style={{background:ed?"#fdf8f0":"transparent"}}>
              <td style={S.td}>{ed
                ? <input style={{...S.inpSm,width:"100%"}} type="text" value={ed.nombre}
                    onChange={ev=>setEV(e.id,"nombre",ev.target.value)}
                    onKeyDown={ev=>ev.key==="Enter"&&saveRow(e.id)}/>
                : e.nombre}
              </td>
              <td style={{...S.td,textAlign:"right"}}>{ed
                ? <input style={{...S.inpSm,width:"90px",textAlign:"right"}} type="text" inputMode="decimal"
                    value={ed.costo} onChange={ev=>setEV(e.id,"costo",ev.target.value)}
                    onKeyDown={ev=>ev.key==="Enter"&&saveRow(e.id)}/>
                : <span style={{color:C.accentDark,fontWeight:"bold"}}>{fmt(e.costo)}</span>}
              </td>
              <td style={{...S.td,textAlign:"right"}}>
                {ed
                  ? <><button style={{...S.btnSm,background:C.accent,color:"#fff",border:"none",marginRight:"0.3rem"}} onClick={()=>saveRow(e.id)}>✓</button>
                      <button style={S.btnSm} onClick={()=>cancelRow(e.id)}>✕</button></>
                  : <><button style={{...S.btnSm,marginRight:"0.3rem"}} onClick={()=>startEdit(e)}>✏️</button>
                      <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}} onClick={()=>delRow(e.id)}>✕</button></>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  </>;
}

function EditorReceta({rec, ings, emps, onSave, onCancel}) {
  const [f, setF] = useState({
    nombre:rec.nombre, categoria:rec.categoria, perdida:String(rec.perdida), energia:String(rec.energia), otrosCostos:String(rec.otrosCostos), notas:rec.notas||"", });
  const [lines, setLines] = useState(rec.ingredientes.map(l=>({...l,cantStr:String(l.cant)})));
  const [ops, setOps] = useState((rec.operarios||[]).map(o=>({...o})));
  const [vars, setVars] = useState((rec.variantes||[]).map(v=>({...v,pesoGStr:String(v.pesoG),pvpStr:String(v.precioVenta),semsStr:String(v.unidadesSemana||0)})));

  const sf = (k,v) => setF(p=>({...p,[k]:v}));
  const setLC = (idx,k,v) => setLines(p=>p.map((l,i)=>i===idx?{...l,[k]:v}:l));
  const setOC = (idx,k,v) => setOps(p=>p.map((o,i)=>i===idx?{...o,[k]:v}:o));
  const setVC = (idx,k,v) => setVars(p=>p.map((v2,i)=>i===idx?{...v2,[k]:v}:v2));

  const save = () => onSave({
    ...rec, nombre:f.nombre, categoria:f.categoria, perdida:f.perdida, energia:f.energia, otrosCostos:f.otrosCostos, notas:f.notas, ingredientes: lines.map(l=>({id:l.id,ingId:l.ingId,cant:l.cantStr})), operarios: ops.map(o=>({...o})), variantes: vars.map(v=>({
      id:v.id, nombre:v.nombre, pesoG:v.pesoGStr, empaqueId:v.empaqueId, precioVenta:v.pvpStr, unidadesSemana:v.semsStr, })), });

  return <div style={S.cardHL}>
    <div style={{...S.sec,marginBottom:"0.8rem"}}>Editar receta</div>

    {/* Datos generales */}
    <div style={S.row}>
      <div style={{...S.col,flex:3}}><label style={S.lbl}>Nombre del producto</label>
        <input style={S.inp} type="text" value={f.nombre} onChange={e=>sf("nombre",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>Categoría</label>
        <select style={S.sel} value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
          {CATS.map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}</select></div>
    </div>
    <div style={S.row}>
      <div style={S.col}><label style={S.lbl}>Pérdida cocción (%)</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.perdida} onChange={e=>sf("perdida",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>Energía $ / batch</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.energia} onChange={e=>sf("energia",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>Otros costos $ / batch</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.otrosCostos} onChange={e=>sf("otrosCostos",e.target.value)}/></div>
    </div>

    {/* Ingredientes */}
    <div style={{...S.sec,marginTop:".8rem",marginBottom:".6rem"}}>Ingredientes</div>
    <table style={S.tbl}>
      <thead><tr>
        <th style={S.th}>Ingrediente</th>
        <th style={{...S.thR,width:"110px"}}>Cantidad</th>
        <th style={{...S.th,width:"50px"}}></th>
      </tr></thead>
      <tbody>
        {lines.map((li,idx)=>{
          const ing = ings.find(i=>i.id===li.ingId);
          return <tr key={li.id}>
            <td style={S.td}>
              <select style={S.sel} value={li.ingId} onChange={e=>setLC(idx,"ingId",e.target.value)}>
                {ings.map(i=><option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
              </select>
            </td>
            <td style={{...S.td,textAlign:"right"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.3rem",justifyContent:"flex-end"}}>
                <input style={{...S.inpSm,width:"75px",textAlign:"right"}} type="text" inputMode="decimal"
                  value={li.cantStr} onChange={e=>setLC(idx,"cantStr",e.target.value)}/>
                <span style={{fontSize:".75rem",color:C.textDim,fontFamily:f,minWidth:"30px"}}>{ing?.unidad||""}</span>
              </div>
            </td>
            <td style={{...S.td,textAlign:"center"}}>
              <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}}
                onClick={()=>setLines(p=>p.filter((_,i)=>i!==idx))}>✕</button>
            </td>
          </tr>;
        })}
      </tbody>
    </table>
    <button style={{...S.btn,marginTop:".4rem"}}
      onClick={()=>setLines(p=>[...p,{id:uid(),ingId:ings[0]?.id||"",cantStr:"0"}])}>+ Ingrediente</button>

    {/* Operarios */}
    <div style={{...S.sec,marginTop:".8rem",marginBottom:".6rem"}}>Mano de obra</div>
    {ops.map((op,idx)=>(
      <div key={op.id} style={{...S.row,alignItems:"flex-end"}}>
        <div style={{...S.col,flex:2}}><label style={S.lbl}>Nombre</label>
          <input style={S.inpSm} type="text" value={op.nombre} onChange={e=>setOC(idx,"nombre",e.target.value)}/></div>
        <div style={S.col}><label style={S.lbl}>Horas</label>
          <input style={S.inpSm} type="text" inputMode="decimal" value={op.horas} onChange={e=>setOC(idx,"horas",e.target.value)}/></div>
        <div style={S.col}><label style={S.lbl}>$/hora</label>
          <input style={S.inpSm} type="text" inputMode="decimal" value={op.tarifa} onChange={e=>setOC(idx,"tarifa",e.target.value)}/></div>
        <div><button style={{...S.btnSm,color:C.warning,borderColor:C.warning}}
          onClick={()=>setOps(p=>p.filter((_,i)=>i!==idx))}>✕</button></div>
      </div>
    ))}
    <button style={{...S.btn,marginBottom:".75rem"}}
      onClick={()=>setOps(p=>[...p,{id:uid(),nombre:"Operario",horas:"2",tarifa:"3.01"}])}>+ Operario</button>

    {/* Variantes */}
    <div style={{...S.sec,marginTop:".6rem",marginBottom:".6rem"}}>Variantes de venta (tamaños)</div>
    <div style={S.tipI}>💡 Misma receta, distintos tamaños. El costo se calcula automáticamente por peso.</div>
    {vars.map((v,idx)=>(
      <div key={v.id} style={{...S.varCard,marginTop:".5rem"}}>
        <div style={S.row}>
          <div style={{...S.col,flex:2}}><label style={S.lbl}>Nombre de la variante</label>
            <input style={S.inpSm} type="text" value={v.nombre} onChange={e=>setVC(idx,"nombre",e.target.value)} placeholder="Ej: Paquete 140g"/></div>
          <div style={S.col}><label style={S.lbl}>Peso por unidad (g)</label>
            <input style={S.inpSm} type="text" inputMode="decimal" value={v.pesoGStr} onChange={e=>setVC(idx,"pesoGStr",e.target.value)}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.lbl}>Empaque</label>
            <select style={S.sel} value={v.empaqueId} onChange={e=>setVC(idx,"empaqueId",e.target.value)}>
              {emps.map(e=><option key={e.id} value={e.id}>{e.nombre} ({fmt(e.costo)})</option>)}
            </select></div>
          <div style={S.col}><label style={S.lbl}>Precio de venta ($)</label>
            <input style={S.inpSm} type="text" inputMode="decimal" value={v.pvpStr} onChange={e=>setVC(idx,"pvpStr",e.target.value)}/></div>
          <div style={S.col}><label style={S.lbl}>Unidades / semana</label>
            <input style={S.inpSm} type="text" inputMode="numeric" value={v.semsStr} onChange={e=>setVC(idx,"semsStr",e.target.value)}/></div>
        </div>
        <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}}
          onClick={()=>setVars(p=>p.filter((_,i)=>i!==idx))}>✕ Eliminar variante</button>
      </div>
    ))}
    <button style={{...S.btn,marginTop:".4rem"}}
      onClick={()=>setVars(p=>[...p,{id:uid(),nombre:"Nueva variante",pesoGStr:"100",empaqueId:emps[0]?.id||"",pvpStr:"0",semsStr:"0"}])}>+ Variante</button>

    <div style={{marginTop:".8rem"}}><label style={S.lbl}>Notas</label>
      <input style={S.inp} type="text" value={f.notas} onChange={e=>sf("notas",e.target.value)}/></div>

    <div style={{display:"flex",gap:"0.5rem",marginTop:"0.85rem"}}>
      <button style={{...S.btn,...S.btnP}} onClick={save}>💾 Guardar</button>
      <button style={S.btn} onClick={onCancel}>Cancelar</button>
    </div>
  </div>;
}

function Desglose({rec, ings, emps, onEdit, onDel}) {
  const [multStr, setMultStr] = useState("1");
  const mult = Math.max(0.1, toN(multStr)||1);
  const d = calcReceta(rec, ings, emps, mult);
  const cc = catC(rec.categoria);

  return <div style={S.card}>
    {/* Cabecera */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.7rem"}}>
      <div>
        <span style={{fontSize:".95rem",fontWeight:"500",color:C.text}}>{rec.nombre}</span>
        <span style={{...S.badge,background:cc.bg,color:cc.color,marginLeft:"0.5rem"}}>{CAT_LABEL[rec.categoria]}</span>
      </div>
      <div style={{display:"flex",gap:"0.4rem"}}>
        <button style={{...S.btn,...S.btnP}} onClick={onEdit}>✏️ Editar</button>
        <button style={{...S.btn,...S.btnD}} onClick={onDel}>Eliminar</button>
      </div>
    </div>

    {/* Multiplicador */}
    <div style={S.multBox}>
      <div>
        <div style={S.barLbl}>Multiplicador de batch</div>
        <input style={S.multInp} type="text" inputMode="decimal" value={multStr}
          onChange={e=>setMultStr(e.target.value)}
          onBlur={e=>setMultStr(String(Math.max(0.1,toN(e.target.value)||1)))}/>
      </div>
      <div style={{flex:1,fontSize:".8rem",fontFamily:f,color:C.textMuted}}>
        <div>Peso bruto: <strong style={{color:C.text}}>{d.pesoBrutoTotal.toLocaleString()} g</strong>
          <span style={{marginLeft:"0.5rem"}}>Pérdida {rec.perdida}%</span></div>
        <div style={{marginTop:"0.2rem"}}>Peso neto: <strong style={{color:C.accentDark}}>{d.pesoNetoTotal.toLocaleString()} g</strong></div>
      </div>
    </div>

    {/* Ingredientes */}
    <div style={{...S.sec,marginBottom:".5rem"}}>Ingredientes</div>
    <table style={S.tbl}>
      <thead><tr>
        <th style={S.th}>Ingrediente</th>
        <th style={S.thR}>Cant/batch</th>
        <th style={S.thR}>Total ×{mult}</th>
        <th style={S.thR}>$/unidad</th>
        <th style={S.thR}>Costo</th>
      </tr></thead>
      <tbody>
        {d.lineasIng.map((li,i)=>(
          <tr key={i}>
            <td style={S.td}>{li.nombre}</td>
            <td style={S.tdR}>{li.cant} {li.unidad}</td>
            <td style={S.tdR}>{(li.cant*mult).toFixed(3)} {li.unidad}</td>
            <td style={S.tdR}>{fmt(li.costoUnit)}</td>
            <td style={{...S.td,textAlign:"right",color:C.accentDark,fontWeight:"bold"}}>{fmt(li.costoTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Costos de producción */}
    <div style={{...S.sec,marginTop:"0.85rem",marginBottom:".5rem"}}>Costos de producción</div>
    {[
      ["Ingredientes", d.costoIngTotal], ["Energía", d.costoEnergiaTotal], ...(rec.operarios||[]).map(op=>[`${op.nombre} (${op.horas}h × $${op.tarifa}/h)`, toN(op.horas)*toN(op.tarifa)*mult]), ...(toN(rec.otrosCostos)>0 ? [["Otros costos", d.costoOtrosTotal]] : []), ].map(([l,v])=>(
      <div key={l} style={S.bar}><span style={S.barLbl}>{l}</span><span style={S.barVal}>{fmt(v)}</span></div>
    ))}
    <div style={S.barHL}>
      <span style={{...S.barLbl,color:C.accentDark,fontWeight:"bold"}}>Subtotal producción (sin empaque)</span>
      <span style={{...S.barVal,color:C.accentDark}}>{fmt(d.costoIngTotal+d.costoEnergiaTotal+d.costoMOTotal+d.costoOtrosTotal)}</span>
    </div>

    {/* Variantes */}
    <div style={{...S.sec,marginTop:"0.85rem",marginBottom:".6rem"}}>Variantes de venta</div>
    {d.variantes.map(v=>(
      <div key={v.id} style={S.varCard}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.3rem",marginBottom:".5rem"}}>
          <strong style={{fontSize:".88rem",color:C.text}}>{v.nombre}</strong>
          <span style={{fontSize:".78rem",color:C.textMuted,fontFamily:f}}>{v.emp.nombre} — {fmt(v.emp.costo)}/u</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0.4rem",marginBottom:".4rem"}}>
          {[
            ["Peso/unidad", `${v.pesoG} g`], ["Piezas del batch", `${v.piezasTotal}`], ["Empaque total", fmt(v.costoEmpTotal)], ["Costo por pieza", fmt(v.costoPorPieza)], ].map(([l,val])=>(
            <div key={l} style={{background:C.bg,borderRadius:4,padding:"0.4rem 0.6rem"}}>
              <div style={{fontSize:".6rem",color:C.textMuted,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>{l}</div>
              <div style={{fontSize:".92rem",fontWeight:"bold",color:C.accentDark,fontFamily:g}}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#f0ede5",border:`1px solid ${C.accent}`,borderRadius:5,padding:".75rem",textAlign:"center"}}>
          <div style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:"1.5rem",fontWeight:"bold",color:C.accentDark,fontFamily:g,lineHeight:1}}>{fmt(v.pvp)}</div>
              <div style={{fontSize:".62rem",color:C.textMuted,fontFamily:f}}>precio de venta</div>
            </div>
            <div>
              <div style={{fontSize:"1.5rem",fontWeight:"bold",color:v.gananciaPorPieza>=0?C.success:C.warning,fontFamily:g,lineHeight:1}}>{fmt(v.gananciaPorPieza)}</div>
              <div style={{fontSize:".62rem",color:C.textMuted,fontFamily:f}}>ganancia/pieza</div>
            </div>
            <div>
              <div style={{fontSize:"1.5rem",fontWeight:"bold",color:v.gananciaTotal>=0?C.success:C.warning,fontFamily:g,lineHeight:1}}>{fmt(v.gananciaTotal)}</div>
              <div style={{fontSize:".62rem",color:C.textMuted,fontFamily:f}}>ganancia total batch</div>
            </div>
            <div>
              <div style={{fontSize:"1.5rem",fontWeight:"bold",color:v.margen>=40?C.success:v.margen>=20?C.gold:C.warning,fontFamily:g,lineHeight:1}}>{fmtP(v.margen)}</div>
              <div style={{fontSize:".62rem",color:C.textMuted,fontFamily:f}}>margen</div>
            </div>
          </div>
        </div>
        {toN(v.unidadesSemana)>0 && (
          <div style={{...S.tipV,marginTop:".4rem"}}>📦 {v.unidadesSemana} unidades/semana en finanzas</div>
        )}
      </div>
    ))}
    {rec.notas ? <div style={S.tipI}>📝 {rec.notas}</div> : null}
  </div>;
}

export default function Recetas() {
  const [tab, setTab]     = useState("recetas");
  const [loading, setLoading] = useState(true);
  const [ings, setIngs]   = useState(ING_INI);
  const [emps, setEmps]   = useState(EMP_INI);
  const [recs, setRecs]   = useState(REC_INI);
  const [cf, setCf]       = useState(CF_INI);
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);

  // Cargar datos
  useEffect(()=>{
    (async()=>{
      const [i,e,r,c] = await Promise.all([
        storageGet(SK.ing), storageGet(SK.emp), storageGet(SK.rec), storageGet(SK.cf), ]);
      if(i) setIngs(i);
      if(e) setEmps(e);
      if(r) setRecs(r);
      if(c) setCf(c);
      setLoading(false);
    })();
  },[]);

  // Guardar automáticamente
  useEffect(()=>{ if(!loading) storageSet(SK.ing, ings); },[ings,loading]);
  useEffect(()=>{ if(!loading) storageSet(SK.emp, emps); },[emps,loading]);
  useEffect(()=>{ if(!loading) storageSet(SK.rec, recs); },[recs,loading]);
  useEffect(()=>{ if(!loading) storageSet(SK.cf, cf);   },[cf, loading]);

  const saveRec = r => {
    setRecs(prev=>prev.some(x=>x.id===r.id)?prev.map(x=>x.id===r.id?r:x):[...prev,r]);
    setEditId(null); setViewId(r.id);
  };
  const newRec = () => {
    const r = {id:uid(),nombre:"Nueva receta",categoria:"confiteria", perdida:"10",energia:"0.20",otrosCostos:"0",notas:"", ingredientes:[],operarios:[{id:uid(),nombre:"Operario 1",horas:"2",tarifa:"3.01"}], variantes:[{id:uid(),nombre:"Variante 1",pesoG:"100",empaqueId:emps[0]?.id||"",precioVenta:"0",unidadesSemana:"0"}], };
    setRecs(prev=>[...prev,r]);
    setEditId(r.id); setViewId(null);
  };
  const delRec = id => { setRecs(prev=>prev.filter(r=>r.id!==id)); setViewId(null); setEditId(null); };

  const fin = useMemo(()=>calcFinanzas(recs,ings,emps,cf),[recs,ings,emps,cf]);

  if(loading) return <div style={S.app}><div style={{textAlign:"center",padding:"3rem",color:C.textMuted,fontFamily:f}}>Cargando datos...</div></div>;

  return <div style={S.app}>
    <div style={S.header}>
      <div style={S.eyebrow}>Gestión de Recetas · Costos · Finanzas</div>
      <h1 style={S.title}>Recetas & Costos</h1>
      <p style={S.subtitle}>Confitería · Conservería · Panadería · Datos guardados automáticamente</p>
    </div>

    <div style={S.main}>
      <div style={S.nav}>
        {[["recetas","📋 Recetas"],["ingredientes","🌾 Ingredientes"],["empaques","📦 Empaques"],["finanzas","📊 Finanzas"]].map(([k,l])=>(
          <button key={k} style={{...S.navBtn,...(tab===k?S.navA:{})}} onClick={()=>{ setTab(k); setViewId(null); setEditId(null); }}>{l}</button>
        ))}
      </div>

      {/* ══ RECETAS ══ */}
      {tab==="recetas" && <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".75rem"}}>
          <div style={S.sec}>Catálogo de productos</div>
          <button style={{...S.btn,...S.btnP}} onClick={newRec}>+ Nueva receta</button>
        </div>

        {recs.map(r=>{
          const cc = catC(r.categoria);
          if(editId===r.id) return <EditorReceta key={r.id} rec={r} ings={ings} emps={emps}
            onSave={saveRec} onCancel={()=>{setEditId(null);if(r.nombre==="Nueva receta")delRec(r.id);}}/>;

          if(viewId===r.id) return <div key={r.id}>
            <Desglose rec={r} ings={ings} emps={emps}
              onEdit={()=>{setEditId(r.id);setViewId(null);}}
              onDel={()=>delRec(r.id)}/>
            <button style={{...S.btn,marginBottom:".75rem",marginTop:"-0.3rem"}} onClick={()=>setViewId(null)}>← Lista</button>
          </div>;

          // Vista de lista
          const d = calcReceta(r, ings, emps, 1);
          const mejorVar = d.variantes.reduce((best,v)=>(!best||v.margen>best.margen)?v:best, null);
          return <div key={r.id} style={{...S.card,cursor:"pointer"}} onClick={()=>{setViewId(r.id);setEditId(null);}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.4rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
                <span style={{fontSize:".92rem",fontWeight:"500",color:C.text}}>{r.nombre}</span>
                <span style={{...S.badge,background:cc.bg,color:cc.color}}>{CAT_LABEL[r.categoria]}</span>
              </div>
              <div style={{display:"flex",gap:"0.8rem",alignItems:"center"}}>
                {mejorVar && <>
                  <span style={{fontSize:".8rem",color:C.textMuted,fontFamily:f}}>{mejorVar.piezasUnit} uds/batch</span>
                  <span style={{fontSize:".88rem",fontWeight:"bold",color:C.accentDark,fontFamily:g}}>{fmt(mejorVar.costoPorPieza)}/u</span>
                  <span style={{fontSize:".82rem",fontWeight:"bold",color:mejorVar.margen>=40?C.success:mejorVar.margen>=20?C.gold:C.warning,fontFamily:f}}>{fmtP(mejorVar.margen)}</span>
                </>}
                <span style={{fontSize:".7rem",color:C.textDim,fontFamily:f}}>ver →</span>
              </div>
            </div>
            {r.variantes.length > 1 && (
              <div style={{fontSize:".72rem",color:C.textMuted,fontFamily:f,marginTop:"0.25rem"}}>
                {r.variantes.length} variantes: {r.variantes.map(v=>v.nombre).join(" · ")}
              </div>
            )}
          </div>;
        })}
      </>}

      {/* ══ INGREDIENTES ══ */}
      {tab==="ingredientes" && <TabIngredientes ings={ings} setIngs={setIngs}/>}

      {/* ══ EMPAQUES ══ */}
      {tab==="empaques" && <TabEmpaques emps={emps} setEmps={setEmps}/>}

      {/* ══ FINANZAS ══ */}
      {tab==="finanzas" && <>
        {/* Costos fijos */}
        <div style={S.sec}>Costos fijos mensuales</div>
        <div style={S.card}>
          <div style={S.row}>
            <div style={S.col}><label style={S.lbl}>Tu sueldo mensual ($)</label>
              <input style={S.inp} type="text" inputMode="decimal" value={cf.sueldo}
                onChange={e=>setCf(p=>({...p,sueldo:e.target.value}))}/></div>
          </div>
          <div style={{...S.sec,marginBottom:".5rem"}}>Gastos administrativos y otros fijos</div>
          {(cf.items||[]).map((item,idx)=>(
            <div key={item.id} style={{...S.row,alignItems:"flex-end",marginBottom:".4rem"}}>
              <div style={{...S.col,flex:3}}>
                <input style={S.inpSm} type="text" value={item.nombre}
                  onChange={e=>setCf(p=>({...p,items:p.items.map((x,i)=>i===idx?{...x,nombre:e.target.value}:x)}))}/></div>
              <div style={S.col}>
                <input style={S.inpSm} type="text" inputMode="decimal" value={item.monto}
                  onChange={e=>setCf(p=>({...p,items:p.items.map((x,i)=>i===idx?{...x,monto:e.target.value}:x)}))}/></div>
              <div><button style={{...S.btnSm,color:C.warning,borderColor:C.warning}}
                onClick={()=>setCf(p=>({...p,items:p.items.filter((_,i)=>i!==idx)}))}>✕</button></div>
            </div>
          ))}
          <button style={{...S.btn,marginBottom:".5rem"}}
            onClick={()=>setCf(p=>({...p,items:[...(p.items||[]),{id:uid(),nombre:"Nuevo gasto",monto:"0"}]}))}>+ Gasto fijo</button>
          <div style={S.barHL}>
            <span style={{...S.barLbl,color:C.accentDark,fontWeight:"bold"}}>Total costos fijos / mes</span>
            <span style={{...S.barVal,color:C.accentDark,fontSize:"1rem"}}>{fmt(fin.totalFijos)}</span>
          </div>
        </div>

        {/* KPIs */}
        <div style={S.sec}>Panel financiero mensual</div>
        <div style={S.kpiGrid}>
          {[
            [fmt(fin.totalIngresos),"Ingresos brutos",null], [fmt(fin.totalCostoVar),"Costos variables",null], [fmt(fin.ganBruta),"Ganancia bruta",null], [fmt(fin.ganNeta),"Ganancia neta",fin.ganNeta>=0?C.success:C.warning], ].map(([v,l,col])=>(
            <div key={l} style={S.kpi}>
              <span style={{...S.kpiVal,...(col?{color:col}:{})}}>{v}</span>
              <span style={S.kpiLbl}>{l}</span>
            </div>
          ))}
        </div>

        {/* Punto de equilibrio */}
        <div style={S.sec}>Punto de equilibrio</div>
        <div style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"0.4rem",marginBottom:"0.45rem"}}>
            <div>
              <div style={{fontSize:".64rem",color:C.textMuted,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>Ingresos necesarios/mes</div>
              <div style={{fontSize:"1.35rem",fontWeight:"bold",color:C.accentDark,fontFamily:g}}>{fmt(fin.puntoEq)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:".64rem",color:C.textMuted,fontFamily:f,textTransform:"uppercase",letterSpacing:".08em"}}>Cobertura actual</div>
              <div style={{fontSize:"1.35rem",fontWeight:"bold",fontFamily:g,color:fin.cobertura>=100?C.success:C.warning}}>{fmtP(fin.cobertura)}</div>
            </div>
          </div>
          <div style={S.barBg}>
            <div style={{height:"100%",borderRadius:4,width:`${fin.cobertura}%`,background:fin.cobertura>=100?C.success:C.warning,transition:"width 0.3s"}}/>
          </div>
          {fin.ganNeta>=0
            ? <div style={S.tipV}>✅ El negocio cubre todos sus costos fijos. Ganancia neta: {fmt(fin.ganNeta)}/mes.</div>
            : <div style={S.tipW}>⚠️ Faltan {fmt(fin.puntoEq-fin.totalIngresos)}/mes para cubrir los costos fijos.</div>}
        </div>

        {/* Por producto */}
        <div style={S.sec}>Por producto / variante</div>
        <div style={S.card}>
          {fin.lineas.length===0
            ? <div style={{color:C.textMuted,fontFamily:f,fontSize:".82rem"}}>Introduce unidades por semana en las variantes de cada receta para ver los números aquí.</div>
            : fin.lineas.map((l,i)=>{
              const cc = catC(l.rec.categoria);
              return <div key={i} style={{marginBottom:"0.9rem",paddingBottom:"0.9rem",borderBottom:`1px solid ${C.borderLight}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.3rem",marginBottom:".3rem"}}>
                  <div>
                    <span style={{fontSize:".88rem",fontWeight:"500",color:C.text}}>{l.rec.nombre}</span>
                    <span style={{...S.badge,background:cc.bg,color:cc.color,marginLeft:"0.4rem"}}>{l.v.nombre}</span>
                  </div>
                  <span style={{fontSize:".88rem",fontWeight:"bold",color:l.ganBruta>=0?C.success:C.warning,fontFamily:g}}>{fmt(l.ganBruta)}/mes</span>
                </div>
                <div style={{display:"flex",gap:"0.9rem",flexWrap:"wrap"}}>
                  {[
                    [`${l.udsMes} uds/mes`, null], [`Ingreso ${fmt(l.ingreso)}`, null], [`Costo var. ${fmt(l.costoVar)}`, null], [`${fmtP(l.margen)} margen`, l.margen>=40?C.success:l.margen>=20?C.gold:C.warning], ].map(([v,col])=>(
                    <span key={v} style={{fontSize:".73rem",color:col||C.textMuted,fontFamily:f}}>{v}</span>
                  ))}
                </div>
              </div>;
            })
          }
        </div>

        {/* Palancas de crecimiento */}
        <div style={S.sec}>Opciones de crecimiento</div>
        <div style={S.card}>
          {[
            ["Aumentar volumen del producto estrella","El producto con mayor margen genera más ganancia neta por unidad adicional vendida. Identifícalo en la tabla de arriba y enfoca el crecimiento en él."], ["Nuevas variantes de tamaño","Ofrecer el mismo producto en tamaño grande o paquete familiar aumenta el ticket promedio sin aumentar el costo fijo de producción."], ["Reducir costos variables","Revisar precios de ingredientes con proveedores alternativos. Una reducción del 10% en el costo de un ingrediente clave puede mejorar el margen varios puntos."], ["Punto de equilibrio como meta","Si el negocio no cubre costos fijos aún, calcula cuántas unidades adicionales de tu producto más vendido necesitas para llegar al equilibrio."], ].map(([t,x])=>(
            <div key={t} style={{marginBottom:"0.85rem"}}>
              <div style={{fontSize:"0.83rem",color:C.accentDark,marginBottom:".2rem",fontWeight:"bold"}}>{t}</div>
              <div style={{fontSize:".76rem",color:C.textMuted,fontFamily:f,lineHeight:1.5}}>{x}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  </div>;
}
