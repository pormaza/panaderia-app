import { useState, useMemo, useEffect } from "react";

// ═══════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════
async function storageGet(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
}
async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch(e) { console.error("Storage error:", e); }
  }
}
const SK = { recetas:"pan-recetas-v1", crono:"pan-crono-v1" };

// ═══════════════════════════════════════════════════════
// CONSTANTES CIENTÍFICAS
// ═══════════════════════════════════════════════════════
const DDT = 24;
const FRICCION = 3;
const PERDIDA_PAN = 13;

function toNum(v) { return parseFloat(String(v).replace(",",".")) || 0; }
const fmt = n => `$${toNum(n).toFixed(2)}`;
const fmtPct = n => `${toNum(n).toFixed(1)}%`;
function uid() { return "x" + Math.random().toString(36).slice(2,9); }

// ─── Tiempos de fermentación por tipo y temperatura ───
// Base científica Q10≈2, ajustada por enriquecimiento
// El azúcar y la grasa compiten por el agua disponible
// ralentizando la actividad de levaduras y bacterias
const TIPO_CONFIG = {
  clasico: {
    label:"Pan clásico de masa madre",
    bulkBaseMin:6, bulkBaseMax:9,
    fermBaseMin:4, fermBaseMax:8,
    hidMin:73, hidMax:80, mmMin:20, mmMax:30,
    color:"#8b5e2a", colorL:"#f5ede0",
    ciencia:[
      ["Fermentación en bloque","A baja temperatura (7–12°C) las levaduras salvajes producen CO₂ lentamente. Las bacterias lácticas generan ácido láctico y acético que desarrollan sabor y conservación. Buscar 50–60% de crecimiento."],
      ["Temperatura de masa (DDT 24°C)","El control de la temperatura de masa es el parámetro más crítico. En Guayaquil el agua debe estar muy fría para compensar el calor ambiente y la fricción de la máquina."],
      ["4 pliegues coil fold","Cada pliegue alinea las cadenas de gluten por tensión. Con 4 pliegues en las primeras 2h el gluten alcanza su máximo desarrollo sin sobre-trabajar la masa."],
      ["Hornear directo del frío","El salto térmico de 7–12°C a 230–250°C activa el oven spring final. La masa fría mantiene tensión superficial que favorece la oreja."],
    ],
    ingredientesExtra:[],
  },
  dulce: {
    label:"Pan dulce enriquecido",
    bulkBaseMin:9, bulkBaseMax:14,
    fermBaseMin:6, fermBaseMax:10,
    hidMin:55, hidMax:65, mmMin:15, mmMax:20,
    color:"#7a4a8a", colorL:"#f0e8f5",
    ciencia:[
      ["Efecto de azúcar y grasa","El azúcar compite con las levaduras por el agua disponible (efecto osmótico), ralentizando la fermentación hasta un 40–60% respecto al pan clásico. La grasa lubrica el gluten pero reduce su fuerza."],
      ["Incorporación progresiva de la mantequilla","La mantequilla debe incorporarse en cubos fríos, gradualmente, después de desarrollar el gluten completamente. Añadirla antes impide la formación del gluten."],
      ["Hidratación reducida 55–65%","La grasa y los huevos aportan humedad adicional. Una hidratación alta haría la masa imposible de manejar con tanto enriquecimiento."],
      ["Bulk más largo","Con MM al 15–20% y masa enriquecida el bulk tarda entre 16–24h a 7–12°C. No apresurarlo — el sabor se desarrolla en este tiempo."],
      ["Temperatura interna 88–92°C","Las masas dulces se hornean a menor temperatura (180–200°C) y más tiempo. La temperatura interna objetivo es 88–92°C, no 94–96°C como en el pan clásico."],
    ],
    ingredientesExtra:["Azúcar","Mantequilla","Huevos","Leche","Esencias"],
  },
  tradicional: {
    label:"Pan tradicional con masa madre",
    bulkBaseMin:5, bulkBaseMax:8,
    fermBaseMin:4, fermBaseMax:7,
    hidMin:70, hidMax:80, mmMin:15, mmMax:25,
    color:"#2a7a5a", colorL:"#e0f5ec",
    ciencia:[
      ["Versatilidad del pan tradicional","Focaccia, ciabatta, baguette y panes regionales usan hidrataciones variadas según su miga característica. La focaccia (80%+) busca una miga abierta y húmeda; la baguette (68–72%) una miga más cerrada."],
      ["Fermentación más corta","Con MM al 15–25% y sin enriquecimiento el bulk es más rápido que el clásico. La temperatura del frigorífico es el principal control."],
      ["Formado específico por tipo","Cada pan tradicional tiene su técnica de formado característica. La focaccia se extiende en bandeja con aceite. La ciabatta requiere manejo mínimo por su alta hidratación."],
      ["Temperatura de horneado variable","La focaccia hornea a 220°C con aceite de oliva. La baguette a 240–250°C con vapor abundante. Adaptar el Nero 500 según el pan."],
    ],
    ingredientesExtra:["Aceite de oliva","Hierbas aromáticas","Semillas"],
  },
  festivo: {
    label:"Pan festivo de temporada",
    bulkBaseMin:12, bulkBaseMax:18,
    fermBaseMin:8, fermBaseMax:14,
    hidMin:50, hidMax:62, mmMin:10, mmMax:15,
    color:"#8a2a2a", colorL:"#f5e0e0",
    ciencia:[
      ["Alta carga de enriquecimiento","Los panes festivos (rosca de reyes, stollen, pan de Navidad) tienen la mayor cantidad de grasa, azúcar y frutos secos. Esto hace la fermentación la más lenta de todas las categorías."],
      ["MM al 10–15% — por qué tan poco","Con alta carga de azúcar y grasa una proporción mayor de MM sobrefermentaría la masa antes de que el gluten esté desarrollado. Menos MM = más control."],
      ["Frutos secos e ingredientes adicionales","Las frutas confitadas, nueces y especias se incorporan siempre al final, después del último pliegue, para no interferir con el desarrollo del gluten."],
      ["Rosca de Reyes en Guayaquil","Con el calor ambiente la masa de rosca tiende a sobrefermentar rápido. Todo el proceso debe ocurrir en frío. El decorado (frutas, azúcar) se añade justo antes del horneo."],
      ["Stollen — proceso simplificado","El stollen tradicional lleva 3 días. La versión con masa madre simplificada puede hacerse en 2 días con frigorífico a 7–10°C. La mantequilla de cobertura se aplica caliente al salir del horno."],
    ],
    ingredientesExtra:["Frutas confitadas","Nueces","Pasas","Especias navideñas","Ralladura de naranja/limón","Agua de azahar"],
  },
};

// ─── Cálculo tiempos de fermentación ───
function calcTiempos(tipo, tempFrio) {
  const t = Math.max(0.5, toNum(tempFrio));
  const cfg = TIPO_CONFIG[tipo];
  const factor = Math.pow(2, (12 - t) / 10);
  return {
    bulkMin: Math.round(cfg.bulkBaseMin * factor * 10) / 10,
    bulkMax: Math.round(cfg.bulkBaseMax * factor * 10) / 10,
    fermMin: Math.round(cfg.fermBaseMin * factor * 10) / 10,
    fermMax: Math.round(cfg.fermBaseMax * factor * 10) / 10,
  };
}

// ─── DDT ───
function calcTAgua(tAmb) {
  return Math.round((DDT * 3) - tAmb - tAmb - FRICCION);
}

// ─── Ingredientes ───
function calcIngredientes(receta, mult) {
  const harinaG = toNum(receta.harinaKg) * 1000;
  const agua = harinaG * (toNum(receta.hidratacion) / 100);
  const mm = harinaG * (toNum(receta.mmPct) / 100);
  const sal = harinaG * 0.02;
  const blanca = harinaG * (toNum(receta.pctBlanca) / 100);
  const integral = harinaG * (toNum(receta.pctIntegral) / 100);

  const masaTotal = harinaG + agua + mm + sal +
    receta.extras.reduce((a,e) => a + toNum(e.cantG), 0);
  const pesoHorneado = masaTotal * (1 - PERDIDA_PAN / 100);
  const piezas = toNum(receta.pesoPieza) > 0 ? Math.floor(masaTotal / toNum(receta.pesoPieza)) : 0;
  const sobrante = Math.round(masaTotal - piezas * toNum(receta.pesoPieza));

  return {
    harinaTotal: Math.round(harinaG * mult),
    blanca: Math.round(blanca * mult),
    integral: Math.round(integral * mult),
    agua: Math.round(agua * mult),
    mm: Math.round(mm * mult),
    sal: Math.round(sal * mult),
    masaTotal: Math.round(masaTotal * mult),
    pesoHorneado: Math.round(pesoHorneado * mult),
    piezas: piezas * mult,
    sobrante,
    extras: receta.extras.map(e => ({...e, cantGTotal: Math.round(toNum(e.cantG) * mult)})),
  };
}

// ─── Cálculo de masa por variantes ───
function calcMasa(receta) {
  const harinaG = toNum(receta.harinaKg) * 1000;
  const agua = harinaG * (toNum(receta.hidratacion) / 100);
  const mm = harinaG * (toNum(receta.mmPct) / 100);
  const sal = harinaG * 0.02;
  const extrasG = (receta.extras||[]).reduce((a,e) => a + toNum(e.cantG), 0);
  const masaBase = harinaG + agua + mm + sal + extrasG;
  const perdida = toNum(receta.perdidaCoccion||13) / 100;

  // Variantes: peso crudo por pieza = peso horneado / (1 - perdida)
  // masa total = suma de (piezas × peso crudo por pieza)
  const vars = (receta.vars||[]).map(v => {
    const pesoHorneadoG = toNum(v.pesoG); // peso deseado ya horneado
    const pesoCrudoG = perdida < 1 ? Math.round(pesoHorneadoG / (1 - perdida)) : pesoHorneadoG;
    const piezas = toNum(v.piezas||0);
    const masaNecesaria = piezas * pesoCrudoG;
    return { ...v, pesoHorneadoG, pesoCrudoG, piezas, masaNecesaria };
  });

  const masaTotalNecesaria = vars.reduce((a,v) => a + v.masaNecesaria, 0);
  const factor = masaBase > 0 ? masaTotalNecesaria / masaBase : 0;

  const blanca = harinaG * (toNum(receta.pctBlanca) / 100);
  const integral = harinaG * (toNum(receta.pctIntegral) / 100);

  return {
    vars, perdidaPct: Math.round(perdida*100),
    masaTotalNecesaria: Math.round(masaTotalNecesaria),
    masaBase: Math.round(masaBase),
    factor,
    blanca:   Math.round(blanca   * factor),
    integral: Math.round(integral * factor),
    agua:     Math.round(agua     * factor),
    mm:       Math.round(mm       * factor),
    sal:      Math.round(sal      * factor),
    extras:   (receta.extras||[]).map(e => ({...e, cantGTotal: Math.round(toNum(e.cantG) * factor)})),
    // Porcentajes del panadero (fijos, no cambian)
    hidratacion: receta.hidratacion,
    mmPct: receta.mmPct,
  };
}

// ─── Cronograma ───
function addMins(totalMin) {
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function parseTime(str) {
  const [h,m] = str.split(":").map(Number);
  return h*60+m;
}

function buildCronograma(receta, mmStart, amasadoStart, tempFrio, tAmb) {
  const tipo = receta.tipo;
  const cfg = TIPO_CONFIG[tipo];
  const tiempos = calcTiempos(tipo, tempFrio);
  const tAgua = calcTAgua(toNum(tAmb));
  const steps = [];
  const sep = (label, t="normal") => steps.push({isSep:true,label,t});
  const add = (minAbs, label, nota, alerta, tag) =>
    steps.push({time:addMins(minAbs%(24*60)), dia:Math.floor(minAbs/(24*60))+1, label, nota, alerta, tag});

  const mmAbs = parseTime(mmStart);
  let amasadoAbs = parseTime(amasadoStart);
  if (amasadoAbs <= mmAbs) amasadoAbs += 24*60;

  // DÍA 1 — Refresco MM
  sep("Día 1 · Refresco de Masa Madre");
  add(mmAbs, "Refresco MM 1:1:1 a temperatura ambiente",
    `A 28–30°C la MM alcanza su pico en 2–3h. Con ${cfg.label.toLowerCase()} usar MM al ${receta.mmPct}%.`,
    `⏰ Pico estimado: ${addMins(mmAbs+2*60)}–${addMins(mmAbs+3*60)}. Prueba de flotación.`, "ambiente");

  // AMASADO
  const diaAmasado = Math.floor(amasadoAbs/(24*60))+1;
  sep(`Día ${diaAmasado} · Amasado`);
  let t = amasadoAbs;

  add(t, "Verificar MM + tomar temperatura ambiente",
    "Prueba de flotación. Cúpula máxima. Medir temperatura ambiente para calcular agua.", null, null);
  t += 5;

  add(t, `Autólisis — harina + agua a ${tAgua}°C`,
    `DDT: (24×3)−${tAmb}−${tAmb}−3 = ${tAgua}°C. ${tipo==="dulce"||tipo==="festivo" ? "En masas enriquecidas la autólisis es más corta (30–40 min) — el azúcar y la grasa interfieren con la hidratación del gluten." : "Autólisis 60 min. Sin MM ni sal."}`,
    "✅ Temperatura de masa objetivo: 22–26°C.");
  t += (tipo==="dulce"||tipo==="festivo" ? 35 : 60);

  add(t, "Medir temperatura post-autólisis",
    "Objetivo 22–26°C. Registrar para ajustar próximas producciones.", null, null);
  t += 5;

  add(t, "Incorporar masa madre",
    `MM al ${receta.mmPct}%. ${tipo==="dulce"||tipo==="festivo" ? "Con masas enriquecidas la MM se incorpora antes que los enriquecedores." : "Amasar hasta integración completa."}`, null, null);
  t += 25;

  add(t, "Incorporar sal",
    "Sal siempre después de la MM. Disolver en mínima agua fría antes de añadir.", "✅ MM primero → sal después. Nunca simultáneos.", null);
  t += 20;

  if (tipo==="dulce"||tipo==="festivo") {
    add(t, "Incorporar azúcar gradualmente",
      "Añadir en 2–3 tandas mientras amasa. El azúcar en exceso de golpe inhibe las levaduras.", null, null);
    t += 15;
    add(t, "Incorporar mantequilla en cubos fríos",
      "Mantequilla fría, en cubos pequeños, de a poco. Esperar que cada adición se integre antes de la siguiente. El gluten debe estar bien desarrollado antes de añadirla.",
      "⚠️ Si la masa se calienta más de 26°C, detener y enfriar 15 min antes de continuar.", null);
    t += 20;
    if (tipo==="festivo") {
      add(t, "Incorporar frutas, nueces y especias",
        "Siempre al final, a mano, sin máquina. Los frutos secos cortan el gluten si se amasan con fuerza.", null, null);
      t += 10;
    }
  }

  add(t, "Reposo en máquina", "La masa debe despegarse de los bordes.", null, null);
  t += 15;

  // Pliegues
  ["1er","2do","3er","4to"].forEach((n,i) => {
    add(t, `${n} pliegue (coil fold) → frío a ${tempFrio}°C`,
      i===0 ? `Introducir en frigorífico a ${tempFrio}°C inmediatamente tras cada pliegue.`
            : i===3 ? "Pliegue final. Masa tensa, con burbujas incipientes."
            : "Sacar, plegar, volver al frío.",
      i===3 ? "✅ 4 pliegues completos. Red de gluten desarrollada." : null, "frio");
    t += 30;
  });

  const bulkIni = t;
  const bulkRevAbs = t + Math.round(tiempos.bulkMin * 60 * 0.85);
  const bulkFinMin = t + Math.round(tiempos.bulkMin * 60);
  const bulkFinMax = t + Math.round(tiempos.bulkMax * 60);

  add(t, `Fermentación en bloque (bulk) — inicio a ${tempFrio}°C`,
    `${cfg.label}: bulk estimado ${tiempos.bulkMin}–${tiempos.bulkMax}h a ${tempFrio}°C. ${tipo==="dulce"||tipo==="festivo" ? "La alta carga de azúcar y grasa ralentiza la fermentación — es normal que tarde más que el pan clásico." : ""} Primera revisión: ${addMins(bulkRevAbs%(24*60))} (Día ${Math.floor(bulkRevAbs/(24*60))+1}). Buscar 50–60% crecimiento.`,
    "⚠️ NO superar 65%. Con masas enriquecidas el gluten se debilita más rápido.", "frio");

  // Formado
  const formadoAbs = t + Math.round((tiempos.bulkMin+tiempos.bulkMax)/2*60);
  const diaFormado = Math.floor(formadoAbs/(24*60))+1;
  sep(`Día ${diaFormado} · Formado`);

  add(formadoAbs, "Evaluación del bulk",
    "50–60% crecimiento. Superficie abombada. Burbujeo activo en los bordes.", "⚠️ Sin 50%: cerrar y revisar cada hora.", null);
  add(formadoAbs+15, `División — ${receta.pesoPieza}g por pieza`,
    "Rasqueta, un corte por pieza. Pesar. Trabajar rápido.", null, null);
  add(formadoAbs+30, "Preformado",
    tipo==="dulce"||tipo==="festivo" ? "Tensión suave. Las masas enriquecidas son más delicadas — no forzar." : "Tensión mínima. Sin desgasificar.", null, null);
  add(formadoAbs+60, "Bench rest — 20–30 min",
    "El gluten se relaja para el formado final.", null, null);

  const formFinalAbs = formadoAbs + 90;
  add(formFinalAbs, `Formado final → banetones → frío a ${tempFrio}°C`,
    `Tensión real. Costura hacia arriba. Frío inmediatamente. Fermentación final: ${tiempos.fermMin}–${tiempos.fermMax}h.`,
    "✅ NO fermentar a temperatura ambiente.", "frio");

  // Horneo
  const horneoAbs = formFinalAbs + Math.round((tiempos.fermMin+tiempos.fermMax)/2*60);
  const diaHorneoRaw = Math.floor(horneoAbs/(24*60))+1;
  const horneoFinal = horneoAbs <= (diaHorneoRaw-1)*24*60+9*60
    ? (diaHorneoRaw-1)*24*60+9*60
    : diaHorneoRaw*24*60+9*60;
  const diaHorneo = Math.floor(horneoFinal/(24*60))+1;
  const tempHorno = tipo==="dulce"||tipo==="festivo" ? "180–200°C" : "230–250°C";
  const tempInterna = tipo==="dulce"||tipo==="festivo" ? "88–92°C" : "94–96°C";

  sep(`Día ${diaHorneo} · Horneo`);
  add(horneoFinal-60, `Precalentar horno a ${tempHorno}`,
    `Nero 500: todas las estancias. ${tipo==="dulce"||tipo==="festivo" ? "Masas enriquecidas hornean a menor temperatura para que el interior cocine antes de que la corteza se queme." : "Piedra necesita 60 min mínimo."}`, null, null);
  add(horneoFinal, "Greñar y hornear — directo del frío",
    `${tipo==="dulce"||tipo==="festivo" ? "Las masas dulces no forman oreja pronunciada — el corte es decorativo. Introducir vapor los primeros 10 min." : "Greñar 30–45°, un corte limpio. Introducir vapor. El salto térmico activa el oven spring."}`,
    tipo==="dulce"||tipo==="festivo" ? null : "✅ La oreja se forma porque el gas empuja por el corte.", null);
  add(horneoFinal+20, "Retirar vapor",
    "Abrir puerta 10 seg. Continuar cocción para corteza.", null, null);
  add(horneoFinal+35, "Verificar cocción",
    `Temperatura interna objetivo: ${tempInterna}. ${tipo==="dulce"||tipo==="festivo" ? "Las masas dulces oscurecen antes — no confundir con cocción completa." : "Base hueca al golpear."}`, null, null);
  add(horneoFinal+40, `Enfriar en rejilla — mínimo ${tipo==="dulce"||tipo==="festivo"?"2h":"1h"}`,
    tipo==="dulce"||tipo==="festivo"
      ? "Las masas enriquecidas necesitan más tiempo para que la miga se asiente. Cortar antes = miga húmeda y gomosa."
      : "El pan sigue cocinándose por inercia térmica.",
    `✅ Esperar ${tipo==="dulce"||tipo==="festivo"?"2h mínimo":"1h"} antes de cortar.`, null);

  const resumen = {
    dia1: `Refresco MM — ${mmStart}`,
    diaAmasado: `Día ${diaAmasado} — Amasado ${amasadoStart}`,
    diaFormado: `Día ${diaFormado} — Formado ${addMins(formadoAbs%(24*60))} (est.)`,
    diaHorneo: `Día ${diaHorneo} — Horneo 09:00`,
    bulk: `${tiempos.bulkMin}–${tiempos.bulkMax}h`,
    ferm: `${tiempos.fermMin}–${tiempos.fermMax}h`,
  };

  return { steps, resumen };
}

// ═══════════════════════════════════════════════════════
// RECETAS INICIALES
// ═══════════════════════════════════════════════════════
const RECETAS_INI = [
  {
    id:"r1", nombre:"Pan de masa madre 70/30", tipo:"clasico",
    harinaKg:"5", pctBlanca:"70", pctIntegral:"30",
    hidratacion:"78", mmPct:"30", pesoPieza:"1050",

    extras:[], notas:"Receta estándar semanal.",
  },
  {
    id:"r2", nombre:"Pan dulce de masa madre", tipo:"dulce",
    harinaKg:"3", pctBlanca:"100", pctIntegral:"0",
    hidratacion:"60", mmPct:"18", perdidaCoccion:"12",
    vars:[{id:"rv3",nombre:"Pieza 450g",pesoG:"450",piezas:"8"}],

    extras:[
      {id:uid(),nombre:"Azúcar",cantG:"300"},
      {id:uid(),nombre:"Mantequilla",cantG:"250"},
      {id:uid(),nombre:"Huevos",cantG:"150"},
    ], notas:"Base para pan dulce. Ajustar extras según variación.",
  },
  {
    id:"r3", nombre:"Focaccia de masa madre", tipo:"tradicional",
    harinaKg:"2", pctBlanca:"100", pctIntegral:"0",
    hidratacion:"80", mmPct:"20", perdidaCoccion:"10",
    vars:[{id:"rv4",nombre:"Bandeja 400g",pesoG:"400",piezas:"5"}],

    extras:[
      {id:uid(),nombre:"Aceite de oliva",cantG:"120"},
      {id:uid(),nombre:"Hierbas aromáticas",cantG:"10"},
    ], notas:"Alta hidratación, miga abierta. Hornear en bandeja con aceite.",
  },
  {
    id:"r4", nombre:"Rosca de Reyes / Stollen", tipo:"festivo",
    harinaKg:"2", pctBlanca:"100", pctIntegral:"0",
    hidratacion:"55", mmPct:"12", perdidaCoccion:"12",
    vars:[{id:"rv5",nombre:"Pieza 600g",pesoG:"600",piezas:"4"}],

    extras:[
      {id:uid(),nombre:"Azúcar",cantG:"200"},
      {id:uid(),nombre:"Mantequilla",cantG:"300"},
      {id:uid(),nombre:"Huevos",cantG:"150"},
      {id:uid(),nombre:"Frutas confitadas",cantG:"200"},
      {id:uid(),nombre:"Agua de azahar",cantG:"30"},
    ], notas:"Pan festivo de temporada. Decorar antes de hornear.",
  },
];

// ═══════════════════════════════════════════════════════
// ESTILOS
// ═══════════════════════════════════════════════════════
const C = {
  bg:"#f5f0e8", surface:"#fff", card:"#faf7f2",
  border:"#ddd5c0", borderLight:"#ede5d0",
  accent:"#8b5e2a", accentDark:"#6b4520", gold:"#9a7020",
  text:"#2a1f0e", textMuted:"#6b5a40", textDim:"#9a8a70",
  success:"#2a5a2a", successBg:"#e8f5e8",
  warning:"#8a4010", warningBg:"#fff3e8",
  info:"#2a5a78", infoBg:"#e8f2f8",
  frio:"#e8f2f8", frioBorder:"#a0c8e0", frioText:"#2a5a78",
  amb:"#e8f5e8", ambBorder:"#90c090", ambText:"#2a5a2a",
};

const S = {
  app:{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'Georgia','Times New Roman',serif"},
  header:{background:C.surface,borderBottom:`2px solid ${C.border}`,padding:"1.25rem 1.5rem 0.9rem",textAlign:"center"},
  eyebrow:{fontSize:"0.63rem",letterSpacing:"0.25em",color:C.accent,textTransform:"uppercase",fontFamily:"Arial,sans-serif",marginBottom:"0.3rem"},
  title:{fontSize:"clamp(1.3rem,4vw,1.9rem)",fontWeight:"normal",color:C.text,margin:"0 0 0.2rem"},
  subtitle:{fontSize:"0.76rem",color:C.textMuted,fontFamily:"Arial,sans-serif",fontStyle:"italic"},
  main:{maxWidth:"760px",margin:"0 auto",padding:"1rem 0.9rem 4rem"},
  sec:{fontSize:"0.61rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.accent,fontFamily:"Arial,sans-serif",marginBottom:"0.75rem",paddingBottom:"0.32rem",borderBottom:`1px solid ${C.border}`},
  card:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.95rem",marginBottom:"0.75rem",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"},
  cardHL:{background:C.surface,border:`1px solid ${C.accent}`,borderRadius:"6px",padding:"0.95rem",marginBottom:"0.75rem"},
  lbl:{display:"block",fontSize:"0.64rem",letterSpacing:"0.1em",textTransform:"uppercase",color:C.textMuted,fontFamily:"Arial,sans-serif",marginBottom:"0.28rem"},
  inp:{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"4px",color:C.text,padding:"0.48rem 0.6rem",fontSize:"0.95rem",fontFamily:"'Georgia',serif",boxSizing:"border-box",outline:"none"},
  inpSm:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:"4px",color:C.text,padding:"0.38rem 0.5rem",fontSize:"0.85rem",fontFamily:"Arial,sans-serif",boxSizing:"border-box",outline:"none",width:"100%"},
  sel:{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:"4px",color:C.text,padding:"0.42rem 0.5rem",fontSize:"0.85rem",fontFamily:"Arial,sans-serif",boxSizing:"border-box",outline:"none"},
  nav:{display:"flex",marginBottom:"1rem",borderBottom:`2px solid ${C.border}`,background:C.surface,borderRadius:"6px 6px 0 0",overflow:"hidden",flexWrap:"wrap"},
  navBtn:{flex:1,minWidth:"70px",padding:"0.65rem 0.3rem",fontSize:"0.63rem",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"Arial,sans-serif",cursor:"pointer",border:"none",borderBottom:"3px solid transparent",background:"transparent",color:C.textMuted,textAlign:"center",marginBottom:"-2px"},
  navBtnA:{color:C.accent,borderBottom:`3px solid ${C.accent}`,background:"#f5ede0",fontWeight:"bold"},
  subNav:{display:"flex",gap:"0.4rem",marginBottom:"0.9rem",flexWrap:"wrap"},
  subBtn:{flex:1,minWidth:"90px",padding:"0.48rem 0.6rem",fontSize:"0.72rem",fontFamily:"Arial,sans-serif",cursor:"pointer",border:`1px solid ${C.border}`,borderRadius:"4px",background:C.surface,color:C.textMuted,textAlign:"center"},
  subBtnA:{background:"#f5ede0",border:`1px solid ${C.accent}`,color:C.accentDark,fontWeight:"bold"},
  row:{display:"flex",gap:"0.6rem",flexWrap:"wrap",marginBottom:"0.6rem"},
  col:{flex:1,minWidth:"110px"},
  btn:{padding:"0.48rem 0.9rem",fontSize:"0.75rem",fontFamily:"Arial,sans-serif",cursor:"pointer",border:`1px solid ${C.border}`,borderRadius:"4px",background:C.surface,color:C.textMuted,display:"inline-flex",alignItems:"center",gap:"0.3rem"},
  btnP:{background:C.accent,border:`1px solid ${C.accentDark}`,color:"#fff"},
  btnD:{background:C.warningBg,border:`1px solid ${C.warning}`,color:C.warning},
  btnSm:{padding:"0.28rem 0.55rem",fontSize:"0.7rem",fontFamily:"Arial,sans-serif",cursor:"pointer",border:`1px solid ${C.border}`,borderRadius:"3px",background:C.surface,color:C.textMuted},
  bar:{background:C.card,border:`1px solid ${C.borderLight}`,borderRadius:"4px",padding:"0.5rem 0.8rem",marginTop:"0.4rem",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"0.3rem"},
  barLbl:{fontSize:"0.64rem",color:C.textMuted,fontFamily:"Arial,sans-serif",textTransform:"uppercase",letterSpacing:"0.08em"},
  barVal:{fontSize:"0.92rem",color:C.gold,fontFamily:"'Georgia',serif",fontWeight:"bold"},
  tipV:{background:C.successBg,border:`1px solid ${C.success}44`,borderRadius:"4px",padding:"0.55rem 0.8rem",fontSize:"0.74rem",color:C.success,fontFamily:"Arial,sans-serif",lineHeight:1.5,marginTop:"0.5rem"},
  tipW:{background:C.warningBg,border:`1px solid ${C.warning}`,borderRadius:"4px",padding:"0.55rem 0.8rem",fontSize:"0.74rem",color:C.warning,fontFamily:"Arial,sans-serif",lineHeight:1.5,marginTop:"0.5rem"},
  tipI:{background:C.infoBg,border:`1px solid ${C.info}44`,borderRadius:"4px",padding:"0.55rem 0.8rem",fontSize:"0.74rem",color:C.info,fontFamily:"Arial,sans-serif",lineHeight:1.5,marginTop:"0.5rem"},
  frioTag:{display:"inline-block",fontSize:"0.58rem",color:C.frioText,background:C.frio,border:`1px solid ${C.frioBorder}`,borderRadius:"3px",padding:"0 0.32rem",fontFamily:"Arial,sans-serif",marginLeft:"0.32rem",verticalAlign:"middle"},
  ambTag:{display:"inline-block",fontSize:"0.58rem",color:C.ambText,background:C.amb,border:`1px solid ${C.ambBorder}`,borderRadius:"3px",padding:"0 0.32rem",fontFamily:"Arial,sans-serif",marginLeft:"0.32rem",verticalAlign:"middle"},
  sepRow:{fontSize:"0.61rem",letterSpacing:"0.2em",textTransform:"uppercase",color:C.accent,fontFamily:"Arial,sans-serif",margin:"1.2rem 0 0.7rem",paddingBottom:"0.3rem",borderBottom:`2px solid ${C.border}`},
  stepRow:{display:"flex",gap:"0.75rem",marginBottom:"0.6rem",alignItems:"flex-start"},
  stepMeta:{minWidth:"55px",flexShrink:0},
  stepTime:{fontSize:"0.8rem",color:C.accent,fontFamily:"Arial,sans-serif",fontWeight:"bold",letterSpacing:"0.03em"},
  stepDia:{fontSize:"0.6rem",color:C.textDim,fontFamily:"Arial,sans-serif"},
  stepLabel:{fontSize:"0.88rem",color:C.text,lineHeight:1.3,fontWeight:"500"},
  stepNota:{fontSize:"0.73rem",color:C.textMuted,fontFamily:"Arial,sans-serif",marginTop:"0.18rem",lineHeight:1.45},
  alertW:{fontSize:"0.7rem",color:C.warning,background:C.warningBg,fontFamily:"Arial,sans-serif",marginTop:"0.18rem",padding:"0.2rem 0.45rem",borderRadius:"3px",borderLeft:`3px solid ${C.warning}`},
  alertO:{fontSize:"0.7rem",color:C.success,background:C.successBg,fontFamily:"Arial,sans-serif",marginTop:"0.18rem",padding:"0.2rem 0.45rem",borderRadius:"3px",borderLeft:`3px solid ${C.success}`},
  resBox:{background:"#f0ede5",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.85rem",marginBottom:"0.75rem"},
  resRow:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"0.82rem",padding:"0.22rem 0",borderBottom:`1px solid ${C.borderLight}`},
  pvp:{background:"#f0ede5",border:`2px solid ${C.accent}`,borderRadius:"6px",padding:"1rem",textAlign:"center",marginTop:"0.75rem"},
  kpiGrid:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0.55rem",marginBottom:"0.75rem"},
  kpi:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.75rem",textAlign:"center"},
  kpiVal:{fontSize:"1.4rem",fontWeight:"bold",color:C.accentDark,fontFamily:"'Georgia',serif",lineHeight:1,display:"block"},
  kpiLbl:{fontSize:"0.6rem",color:C.textMuted,fontFamily:"Arial,sans-serif",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:"0.15rem",display:"block"},
  badge:{fontSize:"0.6rem",padding:"0.12rem 0.4rem",borderRadius:"3px",fontFamily:"Arial,sans-serif",textTransform:"uppercase",letterSpacing:"0.06em",display:"inline-block"},
  ingGrid:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"0.55rem",marginTop:"0.75rem"},
  ingCard:{background:C.card,border:`1px solid ${C.border}`,borderRadius:"5px",padding:"0.75rem",textAlign:"center"},
  ingVal:{fontSize:"1.6rem",fontWeight:"bold",color:C.accentDark,display:"block",lineHeight:1},
  ingUnit:{fontSize:"0.68rem",color:C.textMuted,fontFamily:"Arial,sans-serif"},
  ingName:{fontSize:"0.62rem",color:C.textDim,fontFamily:"Arial,sans-serif",letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"0.18rem",display:"block"},
};

// ═══════════════════════════════════════════════════════
// EDITOR DE RECETA
// ═══════════════════════════════════════════════════════
function EditorReceta({receta, onSave, onCancel}) {
  const [f, setF] = useState({...receta, unidadesSemana: receta.unidadesSemana||'0'});
  const [extras, setExtras] = useState(receta.extras.map(e=>({...e})));
  const [varsEd, setVarsEd] = useState((receta.vars||[{id:uid(),nombre:"Pieza 900g",pesoG:"900",piezas:"0"}]).map(v=>({...v})));
  const setVar = (idx,k,v) => setVarsEd(p=>p.map((x,i)=>i===idx?{...x,[k]:v}:x));

  const sf = (k,v) => setF(p=>({...p,[k]:v}));
  const setExtra = (idx,k,v) => setExtras(prev=>prev.map((e,i)=>i===idx?{...e,[k]:v}:e));
  const addExtra = () => setExtras(prev=>[...prev,{id:uid(),nombre:"",cantG:"0"}]);
  const removeExtra = idx => setExtras(prev=>prev.filter((_,i)=>i!==idx));

  const cfg = TIPO_CONFIG[f.tipo];

  const handleSave = () => onSave({...f, extras: extras.map(e=>({...e})), vars: varsEd.map(v=>({...v}))});

  return <div style={S.cardHL}>
    <div style={{...S.sec,marginBottom:"0.8rem"}}>Editar receta de pan</div>

    <div style={S.row}>
      <div style={{...S.col,flex:3}}><label style={S.lbl}>Nombre de la receta</label>
        <input style={S.inp} type="text" value={f.nombre} onChange={e=>sf("nombre",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>Tipo de pan</label>
        <select style={S.sel} value={f.tipo} onChange={e=>sf("tipo",e.target.value)}>
          {Object.entries(TIPO_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select></div>
    </div>

    <div style={{...S.tipI,marginBottom:"0.75rem"}}>
      💡 {cfg.label} · Hidratación recomendada: {cfg.hidMin}–{cfg.hidMax}% · MM: {cfg.mmMin}–{cfg.mmMax}%
    </div>

    <div style={{...S.sec,marginBottom:"0.6rem"}}>Harinas e hidratación</div>
    <div style={S.row}>
      <div style={S.col}><label style={S.lbl}>Harina total (kg)</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.harinaKg} onChange={e=>sf("harinaKg",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>% Harina blanca</label>
        <input style={S.inp} type="text" inputMode="numeric" value={f.pctBlanca}
          onChange={e=>{const v=Math.min(100,Math.max(0,parseInt(e.target.value)||0));sf("pctBlanca",String(v));sf("pctIntegral",String(100-v));}}/></div>
      <div style={S.col}><label style={S.lbl}>% Integral</label>
        <input style={S.inp} type="text" inputMode="numeric" value={f.pctIntegral}
          onChange={e=>{const v=Math.min(100,Math.max(0,parseInt(e.target.value)||0));sf("pctIntegral",String(v));sf("pctBlanca",String(100-v));}}/></div>
      <div style={S.col}><label style={S.lbl}>Hidratación (%)</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.hidratacion} onChange={e=>sf("hidratacion",e.target.value)}/></div>
      <div style={S.col}><label style={S.lbl}>Masa madre (%)</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.mmPct} onChange={e=>sf("mmPct",e.target.value)}/></div>
    </div>

    <div style={{...S.sec,marginBottom:"0.6rem"}}>Pérdida de cocción</div>
    <div style={S.row}>
      <div style={S.col}><label style={S.lbl}>Pérdida cocción (%)</label>
        <input style={S.inp} type="text" inputMode="decimal" value={f.perdidaCoccion||"13"}
          onChange={e=>sf("perdidaCoccion",e.target.value)}/>
        <div style={{fontSize:"0.68rem",color:C.textMuted,fontFamily:"Arial,sans-serif",marginTop:"0.2rem"}}>
          Peso crudo = peso horneado ÷ (1 − {f.perdidaCoccion||13}%)
        </div>
      </div>
    </div>
    <div style={{...S.sec,marginTop:"0.8rem",marginBottom:"0.6rem"}}>Variantes de peso</div>
    <div style={S.tipI}>💡 Define los tamaños de pieza. Las piezas a producir se ajustan en Producción.</div>
    {(varsEd).map((v,idx)=>(
      <div key={v.id} style={{...S.cardHL,marginTop:"0.5rem",padding:"0.7rem"}}>
        <div style={S.row}>
          <div style={{...S.col,flex:2}}><label style={S.lbl}>Nombre variante</label>
            <input style={S.inpSm} type="text" value={v.nombre} onChange={e=>setVar(idx,"nombre",e.target.value)}/></div>
          <div style={S.col}><label style={S.lbl}>Peso/pieza (g)</label>
            <input style={S.inpSm} type="text" inputMode="decimal" value={v.pesoG} onChange={e=>setVar(idx,"pesoG",e.target.value)}/></div>
          <div style={{paddingTop:"1.2rem"}}>
            <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}} onClick={()=>setVarsEd(p=>p.filter((_,i)=>i!==idx))}>✕</button>
          </div>
        </div>
      </div>
    ))}
    <button style={{...S.btn,marginTop:"0.4rem"}} onClick={()=>setVarsEd(p=>[...p,{id:uid(),nombre:"Nueva variante",pesoG:"500",piezas:"0"}])}>+ Variante</button>



    {cfg.ingredientesExtra.length > 0 && <>
      <div style={{...S.sec,marginBottom:"0.6rem"}}>
        Ingredientes extras — {cfg.label}
      </div>
      <div style={S.tipI}>💡 Ingredientes típicos para este tipo: {cfg.ingredientesExtra.join(", ")}</div>
    </>}

    <div style={{...S.sec,marginTop:"0.8rem",marginBottom:"0.6rem"}}>Ingredientes adicionales de la receta</div>
    {extras.map((e,idx)=>(
      <div key={e.id} style={{...S.row,alignItems:"center"}}>
        <div style={{...S.col,flex:3}}><label style={S.lbl}>Nombre</label>
          <input style={S.inpSm} type="text" value={e.nombre} onChange={ev=>setExtra(idx,"nombre",ev.target.value)}/></div>
        <div style={S.col}><label style={S.lbl}>Cantidad (g)</label>
          <input style={S.inpSm} type="text" inputMode="decimal" value={e.cantG} onChange={ev=>setExtra(idx,"cantG",ev.target.value)}/></div>

        <div style={{paddingTop:"1.2rem"}}>
          <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}} onClick={()=>removeExtra(idx)}>✕</button>
        </div>
      </div>
    ))}
    <button style={{...S.btn,marginBottom:"0.75rem"}} onClick={addExtra}>+ Ingrediente extra</button>



    <div><label style={S.lbl}>Notas</label>
      <input style={S.inp} type="text" value={f.notas} onChange={e=>sf("notas",e.target.value)}/></div>

    <div style={{display:"flex",gap:"0.5rem",marginTop:"0.85rem"}}>
      <button style={{...S.btn,...S.btnP}} onClick={handleSave}>💾 Guardar receta</button>
      <button style={S.btn} onClick={onCancel}>Cancelar</button>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════
// COMPONENTE: CALCULADORA
// ═══════════════════════════════════════════════════════
function Calculadora({receta, tAmb, setTAmb, tAgua, onSavePiezas}) {
  // Si la receta no tiene vars (guardada antes de esta versión), añadir una por defecto
  const varsReceta = (receta.vars && receta.vars.length > 0)
    ? receta.vars
    : [{id:"default", nombre:"Pieza estándar", pesoG:"900", piezas:"0"}];

  const initPiezas = () =>
    Object.fromEntries(varsReceta.map(v=>[v.id, String(toNum(v.piezas)||0)]));

  const [piezas, setPiezas] = useState(initPiezas);

  // Reset cuando cambia la receta
  useEffect(()=>{
    setPiezas(initPiezas());
  }, [receta.id]);

  const setPieza = (id, val) => {
    const next = {...piezas, [id]: val};
    setPiezas(next);
    onSavePiezas(varsReceta.map(v=>({...v, piezas: next[v.id]||"0"})));
  };

  // Receta con piezas actuales para calcular
  const recCalc = {...receta, vars: varsReceta.map(v=>({...v, piezas: String(toNum(piezas[v.id])||0)}))};
  const masa = calcMasa(recCalc);

  return <>
    {/* Piezas por variante */}
    <div style={S.sec}>Piezas a producir por variante</div>
    {varsReceta.map(v=>(
      <div key={v.id} style={{...S.card,display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",padding:"0.7rem"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"0.88rem",fontWeight:"500",color:C.text}}>{v.nombre}</div>
          <div style={{fontSize:"0.72rem",color:C.textMuted,fontFamily:"Arial,sans-serif"}}>{v.pesoG}g por pieza</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
          <label style={{...S.lbl,marginBottom:0,fontSize:"0.65rem"}}>Piezas:</label>
          <input
            style={{width:"65px",background:C.bg,border:`2px solid ${C.accent}`,borderRadius:"4px",color:C.accentDark,padding:"0.38rem 0.45rem",fontSize:"1.1rem",fontFamily:"'Georgia',serif",textAlign:"center",outline:"none",fontWeight:"bold"}}
            type="text" inputMode="numeric"
            value={piezas[v.id]||"0"}
            onChange={e=>setPieza(v.id, e.target.value)}
          />
        </div>
        <div style={{fontSize:"0.75rem",color:C.textMuted,fontFamily:"Arial,sans-serif"}}>
          {(()=>{
            const perdida = toNum(receta.perdidaCoccion||13)/100;
            const pesoCrudo = perdida<1 ? Math.round(toNum(v.pesoG)/(1-perdida)) : toNum(v.pesoG);
            const p = toNum(piezas[v.id]||0);
            return p>0 ? `${toNum(v.pesoG)}g horneado · ${pesoCrudo}g crudo · total ${(p*pesoCrudo).toLocaleString()}g` : `${toNum(v.pesoG)}g horneado → ${pesoCrudo}g crudo`;
          })()}
        </div>
      </div>
    ))}

    {/* Resumen masa */}
    {masa.masaTotalNecesaria > 0 && <>
      <div style={S.sec}>Masa total necesaria</div>
      <div style={{...S.card,display:"flex",gap:"0.6rem",flexWrap:"wrap"}}>
        {[
          ["Masa cruda total",`${masa.masaTotalNecesaria.toLocaleString()} g`],
          [`Pérdida ${masa.perdidaPct}%`,`−${Math.round(masa.masaTotalNecesaria*masa.perdidaPct/100).toLocaleString()} g`],
          ["Factor ×base",`×${toNum(masa.factor).toFixed(2)}`],
        ].map(([l,v])=>(
          <div key={l} style={{flex:1,minWidth:"100px",background:C.card,border:`1px solid ${C.borderLight}`,borderRadius:"5px",padding:"0.6rem",textAlign:"center"}}>
            <div style={{fontSize:"0.6rem",color:C.textMuted,fontFamily:"Arial,sans-serif",textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div>
            <div style={{fontSize:"1rem",fontWeight:"bold",color:C.accentDark,fontFamily:"'Georgia',serif"}}>{v}</div>
          </div>
        ))}
      </div>
    </>}

    {/* DDT */}
    <div style={S.sec}>Temperatura del agua (DDT)</div>
    <div style={S.card}>
      <label style={S.lbl}>Temperatura ambiente (°C)</label>
      <input style={S.inp} type="text" inputMode="numeric" value={tAmb} onChange={e=>setTAmb(e.target.value)}/>
      <div style={{background:"#f0ede5",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"0.85rem",marginTop:"0.6rem"}}>
        <div style={{fontSize:"0.64rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.accent,fontFamily:"Arial,sans-serif",marginBottom:"0.35rem"}}>Temperatura del agua</div>
        <div><span style={{fontSize:"1.85rem",fontWeight:"bold",color:C.accentDark,fontFamily:"'Georgia',serif"}}>{tAgua}</span>
          <span style={{fontSize:"0.8rem",color:C.textMuted,fontFamily:"Arial,sans-serif",marginLeft:"0.3rem"}}>°C</span></div>
        <div style={{fontSize:"0.68rem",color:C.textDim,fontFamily:"Arial,sans-serif",marginTop:"0.3rem"}}>(24×3)−{tAmb}−{tAmb}−3 = <strong>{tAgua}°C</strong> · DDT objetivo: 24°C</div>
      </div>
      {tAgua < 4 && <div style={S.tipV}>❄ Usar agua con hielo.</div>}
    </div>

    {/* Ingredientes escalados */}
    {masa.masaTotalNecesaria > 0 && <>
      <div style={S.sec}>Ingredientes necesarios</div>
      <div style={S.card}>
        <div style={S.ingGrid}>
          {[
            [masa.blanca>0?masa.blanca:null,`Harina blanca (${receta.pctBlanca}%)`],
            [masa.integral>0?masa.integral:null,`Integral (${receta.pctIntegral}%)`],
            [masa.agua,"Agua"],
            [masa.mm,"Masa madre"],
            [masa.sal,"Sal"],
            ...masa.extras.map(e=>[e.cantGTotal,e.nombre]),
          ].filter(([v])=>v!==null&&v>0).map(([v,nm])=>(
            <div key={nm} style={S.ingCard}>
              <span style={S.ingVal}>{v}</span>
              <span style={S.ingUnit}>g</span>
              <span style={S.ingName}>{nm}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:"0.9rem"}}>
          <div style={{...S.sec,marginBottom:"0.4rem"}}>Porcentajes del panadero</div>
          {[
            ["Harina total","100%"],
            ["Agua",`${receta.hidratacion}%`],
            ["Masa madre",`${receta.mmPct}%`],
            ["Sal","2%"],
            ...receta.extras.map(e=>[e.nombre,`${((toNum(e.cantG)/toNum(receta.harinaKg)/10)||0).toFixed(1)}%`]),
          ].map(([nm,v])=>(
            <div key={nm} style={{display:"flex",justifyContent:"space-between",fontSize:"0.76rem",color:C.textMuted,fontFamily:"Arial,sans-serif",padding:"0.26rem 0",borderBottom:`1px solid ${C.borderLight}`}}>
              <span>{nm}</span><span style={{color:C.accent,fontWeight:"bold"}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>}
  </>;
}

// ═══════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("recetas");
  const [panTab, setPanTab] = useState("calc");
  const [loading, setLoading] = useState(true);
  const [recetas, setRecetas] = useState(RECETAS_INI);
  const [recetaActiva, setRecetaActiva] = useState("r1");
  const [editId, setEditId] = useState(null);
  const [mmStart, setMmStart] = useState("06:00");
  const [amasadoStart, setAmasadoStart] = useState("08:00");
  const [tempFrio, setTempFrio] = useState("10");
  const [tAmb, setTAmb] = useState("30");


  useEffect(()=>{
    (async()=>{
      const r = await storageGet(SK.recetas);
      if(r) setRecetas(r);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{ if(!loading) storageSet(SK.recetas, recetas); },[recetas,loading]);
  useEffect(()=>{ if(!loading) storageSet(SK.crono,{mmStart,amasadoStart,tempFrio,tAmb}); },
    [mmStart,amasadoStart,tempFrio,tAmb,loading]);

  const receta = recetas.find(r=>r.id===recetaActiva) || recetas[0];

  const tAgua = useMemo(()=> calcTAgua(toNum(tAmb)), [tAmb]);
  const tiempos = useMemo(()=> receta ? calcTiempos(receta.tipo, toNum(tempFrio)) : null, [receta, tempFrio]);
  const {steps, resumen} = useMemo(()=>
    receta ? buildCronograma(receta, mmStart, amasadoStart, tempFrio, tAmb)
           : {steps:[], resumen:{}},
    [receta, mmStart, amasadoStart, tempFrio, tAmb]);

  const saveReceta = (r) => {
    setRecetas(prev=>prev.some(x=>x.id===r.id)?prev.map(x=>x.id===r.id?r:x):[...prev,r]);
    setEditId(null);
    setRecetaActiva(r.id);
  };

  const newReceta = () => {
    const r = {id:uid(),nombre:"Nueva receta",tipo:"clasico",
      harinaKg:"3",pctBlanca:"100",pctIntegral:"0",
      hidratacion:"75",mmPct:"25",perdidaCoccion:"13",
      vars:[{id:uid(),nombre:"Pieza 900g",pesoG:"900",piezas:"0"}],
      extras:[],notas:""};
    setRecetas(prev=>[...prev,r]);
    setEditId(r.id);
    setRecetaActiva(r.id);
  };

  const delReceta = (id) => {
    setRecetas(prev=>prev.filter(r=>r.id!==id));
    setRecetaActiva(recetas.find(r=>r.id!==id)?.id||"");
  };

  const cfg = receta ? TIPO_CONFIG[receta.tipo] : null;

  if(loading) return <div style={S.app}><div style={{textAlign:"center",padding:"2rem",color:C.textMuted,fontFamily:"Arial,sans-serif"}}>Cargando...</div></div>;

  return <div style={S.app}>
    <div style={S.header}>
      <div style={S.eyebrow}>Planificador de Producción · Panes de Masa Madre</div>
      <h1 style={S.title}>Casa Ormaza Velásquez</h1>
      <p style={S.subtitle}>Pan clásico · Pan dulce · Tradicional · Festivo · Ecuador</p>
    </div>

    <div style={S.main}>
      <div style={S.nav}>
        {[["recetas","🍞 Recetas"],["produccion","⚙️ Producción"],["ciencia","🔬 Ciencia"]].map(([k,l])=>(
          <button key={k} style={{...S.navBtn,...(tab===k?S.navBtnA:{})}} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ══ RECETAS ══ */}
      {tab==="recetas" && <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
          <div style={S.sec}>Mis recetas de pan</div>
          <button style={{...S.btn,...S.btnP}} onClick={newReceta}>+ Nueva receta</button>
        </div>

        {recetas.map(r=>{
          const c = TIPO_CONFIG[r.tipo];
          if(editId===r.id) return <EditorReceta key={r.id} receta={r} onSave={saveReceta}
            onCancel={()=>{setEditId(null);if(r.nombre==="Nueva receta")delReceta(r.id);}}/>;
          return <div key={r.id} style={{...S.card,border:recetaActiva===r.id?`2px solid ${c.color}`:`1px solid ${C.border}`,cursor:"pointer"}}
            onClick={()=>setRecetaActiva(r.id)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.4rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
                <span style={{fontSize:"0.92rem",fontWeight:"500",color:C.text}}>{r.nombre}</span>
                <span style={{...S.badge,background:c.colorL,color:c.color}}>{c.label}</span>
              </div>
              <div style={{display:"flex",gap:"0.6rem",alignItems:"center"}}>
                <span style={{fontSize:"0.78rem",color:C.textMuted,fontFamily:"Arial,sans-serif"}}>MM {r.mmPct}% · Hid {r.hidratacion}%</span>
                <button style={{...S.btnSm}} onClick={e=>{e.stopPropagation();setEditId(r.id);}}>✏️</button>
                <button style={{...S.btnSm,color:C.warning,borderColor:C.warning}} onClick={e=>{e.stopPropagation();delReceta(r.id);}}>✕</button>
              </div>
            </div>
            {r.notas ? <div style={{fontSize:"0.74rem",color:C.textMuted,fontFamily:"Arial,sans-serif",marginTop:"0.3rem"}}>{r.notas}</div> : null}
          </div>;
        })}
      </>}

      {/* ══ PRODUCCIÓN ══ */}
      {tab==="produccion" && receta && <>
        {/* Selector de receta */}
        <div style={S.sec}>Receta activa</div>
        <div style={S.card}>
          <select style={S.sel} value={recetaActiva} onChange={e=>setRecetaActiva(e.target.value)}>
            {recetas.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <div style={{marginTop:"0.5rem",display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
            <span style={{...S.badge,background:cfg.colorL,color:cfg.color}}>{cfg.label}</span>
            <span style={{fontSize:"0.76rem",color:C.textMuted,fontFamily:"Arial,sans-serif"}}>MM {receta.mmPct}% · Hid {receta.hidratacion}% · {receta.pctBlanca}% blanca / {receta.pctIntegral}% integral</span>
          </div>
        </div>

        <div style={S.subNav}>
          {[["calc","Calculadora"],["cronograma","Cronograma"]].map(([k,l])=>(
            <div key={k} style={{...S.subBtn,...(panTab===k?S.subBtnA:{})}} onClick={()=>setPanTab(k)}>{l}</div>
          ))}
        </div>

        {/* CALCULADORA */}
        {panTab==="calc" && <Calculadora receta={receta} tAmb={tAmb} setTAmb={setTAmb} tAgua={tAgua} onSavePiezas={(vars)=>setRecetas(prev=>prev.map(r=>r.id!==recetaActiva?r:{...r,vars}))}/>}

        {/* CRONOGRAMA */}
        {panTab==="cronograma" && <>
          <div style={S.sec}>Parámetros del ciclo</div>
          <div style={S.card}>
            <div style={S.row}>
              <div style={S.col}><label style={S.lbl}>Temp. frigorífico (°C)</label>
                <input style={S.inp} type="text" inputMode="numeric" value={tempFrio} onChange={e=>{setTempFrio(e.target.value);}}/></div>
              <div style={S.col}><label style={S.lbl}>Refresco MM (Día 1)</label>
                <input style={S.inp} type="time" value={mmStart} onChange={e=>setMmStart(e.target.value)}/></div>
              <div style={S.col}><label style={S.lbl}>Inicio amasado</label>
                <input style={S.inp} type="time" value={amasadoStart} onChange={e=>setAmasadoStart(e.target.value)}/></div>
            </div>
            <div style={S.tipI}>❄ A {tempFrio}°C: bulk {tiempos?.bulkMin}–{tiempos?.bulkMax}h · Fermentación final {tiempos?.fermMin}–{tiempos?.fermMax}h</div>
          </div>

          <div style={S.resBox}>
            <div style={{fontSize:"0.61rem",letterSpacing:"0.15em",textTransform:"uppercase",color:C.accent,fontFamily:"Arial,sans-serif",marginBottom:"0.5rem"}}>Resumen del ciclo — {receta.nombre}</div>
            {resumen && Object.entries(resumen).map(([k,v])=>(
              <div key={k} style={S.resRow}>
                <span style={{fontWeight:"bold",color:C.accentDark,fontFamily:"'Georgia',serif",fontSize:"0.82rem",textTransform:"capitalize"}}>{k}</span>
                <span style={{color:C.textMuted,fontFamily:"Arial,sans-serif",fontSize:"0.75rem"}}>{v}</span>
              </div>
            ))}
          </div>

          <div style={S.sec}>Cronograma completo</div>
          <div style={S.card}>
            {steps.map((step,i)=>{
              if(step.isSep) return <div key={i} style={S.sepRow}>{step.label}</div>;
              const isOk = step.alerta?.startsWith("✅");
              return <div key={i} style={S.stepRow}>
                <div style={S.stepMeta}>
                  <div style={S.stepTime}>{step.time}</div>
                  <div style={S.stepDia}>Día {step.dia}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={S.stepLabel}>
                    {step.label}
                    {step.tag==="frio" && <span style={S.frioTag}>❄ {tempFrio}°C</span>}
                    {step.tag==="ambiente" && <span style={S.ambTag}>🌡 28–30°C</span>}
                  </div>
                  {step.nota && <div style={S.stepNota}>{step.nota}</div>}
                  {step.alerta && <div style={isOk?S.alertO:S.alertW}>{step.alerta}</div>}
                </div>
              </div>;
            })}
          </div>
        </>}
      </>}

      {/* ══ CIENCIA ══ */}
      {tab==="ciencia" && <>
        {Object.entries(TIPO_CONFIG).map(([tipo,cfg])=>(
          <div key={tipo} style={S.card}>
            <div style={{fontSize:"0.72rem",fontWeight:"bold",color:cfg.color,fontFamily:"Arial,sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.7rem",paddingBottom:"0.35rem",borderBottom:`2px solid ${cfg.color}44`}}>
              {cfg.label}
            </div>
            {cfg.ciencia.map(([t,x])=>(
              <div key={t} style={{marginBottom:"0.85rem"}}>
                <div style={{fontSize:"0.83rem",color:C.accentDark,marginBottom:"0.2rem",fontWeight:"bold"}}>{t}</div>
                <div style={{fontSize:"0.76rem",color:C.textMuted,fontFamily:"Arial,sans-serif",lineHeight:1.5}}>{x}</div>
              </div>
            ))}
            {cfg.ingredientesExtra.length>0 && (
              <div style={S.tipI}>💡 Ingredientes típicos: {cfg.ingredientesExtra.join(", ")}</div>
            )}
          </div>
        ))}

        <div style={S.card}>
          <div style={{fontSize:"0.72rem",fontWeight:"bold",color:C.accent,fontFamily:"Arial,sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.7rem"}}>
            DDT — Desired Dough Temperature
          </div>
          {[
            ["¿Qué es?","La temperatura de masa objetivo de 24°C garantiza que levaduras y bacterias lácticas trabajen en equilibrio. 1°C de diferencia altera los tiempos de fermentación significativamente."],
            ["Fórmula para Guayaquil","T°agua = (24×3) − T°ambiente − T°harina − fricción(3). Con 30°C: agua a 9°C. Con 34°C: agua a 1°C (hielo obligatorio)."],
            ["Masas enriquecidas y DDT","En panes dulces y festivos la DDT sigue siendo 24°C pero la mantequilla fría puede bajar la temperatura de masa — compensar con agua ligeramente menos fría."],
          ].map(([t,x])=>(
            <div key={t} style={{marginBottom:"0.85rem"}}>
              <div style={{fontSize:"0.83rem",color:C.accentDark,marginBottom:"0.2rem",fontWeight:"bold"}}>{t}</div>
              <div style={{fontSize:"0.76rem",color:C.textMuted,fontFamily:"Arial,sans-serif",lineHeight:1.5}}>{x}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  </div>;
}
