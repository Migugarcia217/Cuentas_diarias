document.addEventListener('DOMContentLoaded', () => {
  establecerFechaHoy();

  const inputsMoneda = document.querySelectorAll('.moneda-input');

  // Aplicar formato de miles al escribir
  inputsMoneda.forEach(input => {
    input.addEventListener('input', (e) => {
      formatearInputMoneda(e.target);
      calcularTotales();
    });
  });

  // Si cambias la fecha manualmente, recalcular los ahorros programados
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    fechaInput.addEventListener('change', () => {
      calcularTotales();
      cargarGastosFijos();
    });
  }

  // Al regresar/reabrir la aplicación (PWA), verificar y actualizar si es un nuevo día
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      establecerFechaHoy();
    }
  });

  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) btnGuardar.addEventListener('click', guardarRegistro);

  const btnAgregarFijo = document.getElementById('btnAgregarFijo');
  if (btnAgregarFijo) btnAgregarFijo.addEventListener('click', agregarGastoFijo);
  
  const btnBorrarTodo = document.getElementById('btnBorrarHistorial');
  if (btnBorrarTodo) btnBorrarTodo.addEventListener('click', borrarHistorialCompleto);

  cargarGastosFijos();
  cargarHistorial();
  calcularTotales();
});

// Obtener fecha local exacta sin desfase por zona horaria (YYYY-MM-DD)
function obtenerFechaLocal() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

function establecerFechaHoy() {
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    fechaInput.value = obtenerFechaLocal();
  }
}

// Limpia el texto ingresado y devuelve únicamente el valor numérico puro
function getN(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const val = el.value;
  const num = val.replace(/\./g, '').replace(/,/g, '');
  return parseFloat(num) || 0;
}

// Asigna un valor a un input aplicando formato con puntos de miles
function setInputValue(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  if (valor !== undefined && valor !== null && valor !== 0 && valor !== '') {
    el.value = Math.round(Number(valor)).toLocaleString('es-CO');
  } else {
    el.value = '';
  }
}

// Formatea el valor de entrada agregando separadores de miles con puntos al escribir
function formatearInputMoneda(input) {
  let valor = input.value.replace(/\D/g, ''); // Deja solo números
  if (valor) {
    input.value = parseInt(valor, 10).toLocaleString('es-CO');
  } else {
    input.value = '';
  }
}

// Formato de moneda estricto con puntos de miles completo (ej: $185.000)
function fmt(num) {
  const n = Number(num) || 0;
  return '$' + Math.round(n).toLocaleString('es-CO');
}

function calcularTotales() {
  // 1. TRABAJO
  const trabajo = getN('trabajo');
  const gasolina = getN('gasolina');
  const pass = getN('pass');
  const ahorro = getN('ahorro');
  const deudaUber = getN('deudaUber');

  const gananciaNeto = trabajo - (gasolina + pass + ahorro + deudaUber);

  // 2. GASTOS
  const yo = getN('yo');
  const carro = getN('carro');
  const gastosFijos = getN('gastosFijos');
  const comidaCalle = getN('comidaCalle');

  const gastoTotal = yo + carro + gastosFijos + comidaCalle;

  // 3. EFECTIVO
  const efectivo = getN('efectivo');
  const nequi = getN('nequi');
  const pendiente = getN('pendiente');

  const tengoTotal = efectivo + nequi + pendiente;

  // 4. CUADRE (Compara Tengo Total contra Debería Tener)
  const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
  const fechaInput = document.getElementById('fecha');
  const fechaActual = fechaInput ? fechaInput.value : obtenerFechaLocal();
  
  // Buscar el último registro antes de la fecha actual seleccionada
  const registrosAnteriores = registros.filter(r => r.fecha < fechaActual);
  const tengoAyer = registrosAnteriores.length > 0 ? (registrosAnteriores[registrosAnteriores.length - 1].tengoTotal || 0) : 0;

  const deberiaTener = tengoAyer + gananciaNeto - gastoTotal;
  const diferencia = tengoTotal - deberiaTener;

  // Mostrar en pantalla
  const elGananciaNeto = document.getElementById('gananciaNeto');
  if (elGananciaNeto) elGananciaNeto.textContent = fmt(gananciaNeto);

  const elGastoTotal = document.getElementById('gastoTotal');
  if (elGastoTotal) elGastoTotal.textContent = fmt(gastoTotal);

  const elTengoTotal = document.getElementById('tengoTotal');
  if (elTengoTotal) elTengoTotal.textContent = fmt(tengoTotal);

  const elTengoAyer = document.getElementById('tengoAyer');
  if (elTengoAyer) elTengoAyer.textContent = fmt(tengoAyer);

  const elDeberiaTener = document.getElementById('deberiaTener');
  if (elDeberiaTener) elDeberiaTener.textContent = fmt(deberiaTener);

  const elDif = document.getElementById('diferencia');
  if (elDif) {
    elDif.textContent = fmt(diferencia);
    if (diferencia < 0) {
      elDif.style.color = '#dc3545'; // Rojo si falta
    } else if (diferencia > 0) {
      elDif.style.color = '#28a745'; // Verde si sobra
    } else {
      elDif.style.color = '#333333';
    }
  }
}

function guardarRegistro() {
  const fechaInput = document.getElementById('fecha');
  const fechaStr = fechaInput ? fechaInput.value : '';

  if (!fechaStr) {
    alert('Por favor selecciona una fecha');
    return;
  }

  const trabajo = getN('trabajo');
  const gasolina = getN('gasolina');
  const pass = getN('pass');
  const ahorro = getN('ahorro');
  const deudaUber = getN('deudaUber');
  const gananciaNeto = trabajo - (gasolina + pass + ahorro + deudaUber);

  const yo = getN('yo');
  const carro = getN('carro');
  const gastosFijos = getN('gastosFijos');
  const comidaCalle = getN('comidaCalle');
  const gastoTotal = yo + carro + gastosFijos + comidaCalle;

  const efectivo = getN('efectivo');
  const nequi = getN('nequi');
  const pendiente = getN('pendiente');
  const tengoTotal = efectivo + nequi + pendiente;

  const registrosPrevios = JSON.parse(localStorage.getItem('registrosGastos')) || [];
  const registrosAnteriores = registrosPrevios.filter(r => r.fecha < fechaStr);
  const tengoAyer = registrosAnteriores.length > 0 ? (registrosAnteriores[registrosAnteriores.length - 1].tengoTotal || 0) : 0;
  
  const deberiaTener = tengoAyer + gananciaNeto - gastoTotal;
  const diferencia = tengoTotal - deberiaTener;

  const registro = {
    fecha: fechaStr,
    trabajo, gasolina, pass, ahorro, deudaUber,
    gananciaNeto,
    yo, carro, gastosFijos, comidaCalle,
    gastoTotal,
    efectivo, nequi, pendiente,
    tengoTotal,
    diferencia
  };

  let registros = registrosPrevios;
  
  // Reemplazar si el día ya existe o agregar si es nuevo
  const indexExistente = registros.findIndex(r => r.fecha === fechaStr);
  if (indexExistente !== -1) {
    registros[indexExistente] = registro;
  } else {
    registros.push(registro);
  }

  // Ordenar cronológicamente
  registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  localStorage.setItem('registrosGastos', JSON.stringify(registros));

  alert('Día guardado con éxito');

  limpiarFormulario();
  cargarHistorial();
  cargarGastosFijos();
}

function limpiarFormulario() {
  const camposMoneda = document.querySelectorAll('.moneda-input');
  camposMoneda.forEach(input => input.value = '');
  
  establecerFechaHoy();
  calcularTotales();
}

// --- EDICIÓN Y ELIMINACIÓN ---

function editarDiaHistorial(fecha) {
  const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
  const registro = registros.find(r => r.fecha === fecha);

  if (!registro) {
    alert('No se encontró el registro seleccionado.');
    return;
  }

  document.getElementById('fecha').value = registro.fecha;

  setInputValue('trabajo', registro.trabajo);
  setInputValue('gasolina', registro.gasolina);
  setInputValue('pass', registro.pass);
  setInputValue('ahorro', registro.ahorro);
  setInputValue('deudaUber', registro.deudaUber);

  setInputValue('yo', registro.yo);
  setInputValue('carro', registro.carro);
  setInputValue('gastosFijos', registro.gastosFijos);
  setInputValue('comidaCalle', registro.comidaCalle);

  setInputValue('efectivo', registro.efectivo);
  setInputValue('nequi', registro.nequi);
  setInputValue('pendiente', registro.pendiente);

  calcularTotales();
  cargarGastosFijos();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarDiaHistorial(fecha) {
  const confirmar = confirm(`¿Deseas eliminar el registro del día ${fecha}?`);
  if (confirmar) {
    let registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    registros = registros.filter(r => r.fecha !== fecha);
    localStorage.setItem('registrosGastos', JSON.stringify(registros));
    cargarHistorial();
    calcularTotales();
  }
}

function borrarHistorialCompleto() {
  const confirmar = confirm('¿Estás seguro de que deseas borrar TODO el historial guardado? Esta acción no se puede deshacer.');
  if (confirmar) {
    localStorage.removeItem('registrosGastos');
    cargarHistorial();
    calcularTotales();
    alert('Historial borrado con éxito');
  }
}

// --- HISTORIAL SEMANAL Y VALORES COMPLETOS ---

function obtenerLunesSemana(fechaStr) {
  const [a, m, d] = fechaStr.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const diaSemana = fecha.getDay();
  const diffToMonday = (diaSemana === 0 ? -6 : 1 - diaSemana);
  fecha.setDate(fecha.getDate() + diffToMonday);
  
  const y = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function formatearRangoSemana(lunesStr) {
  const [a, m, d] = lunesStr.split('-').map(Number);
  const lunes = new Date(a, m - 1, d);
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);

  const opciones = { day: 'numeric', month: 'short' };
  const inicio = lunes.toLocaleDateString('es-CO', opciones);
  const fin = domingo.toLocaleDateString('es-CO', opciones);
  return `Semana del ${inicio} al ${fin}`;
}

function cargarHistorial() {
  const contenedor = document.getElementById('historial');
  if (!contenedor) return;

  const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
  contenedor.innerHTML = '';

  if (registros.length === 0) {
    contenedor.innerHTML = '<p class="subtext">No hay días guardados aún.</p>';
    return;
  }

  const semanas = {};
  registros.forEach(r => {
    const lunesKey = obtenerLunesSemana(r.fecha);
    if (!semanas[lunesKey]) {
      semanas[lunesKey] = [];
    }
    semanas[lunesKey].push(r);
  });

  const semanasOrdenadas = Object.keys(semanas).sort((a, b) => new Date(b) - new Date(a));

  semanasOrdenadas.forEach((lunesKey, index) => {
    const dias = semanas[lunesKey];
    
    // Totales de Trabajo
    let trabajoSemanal = 0, gasolinaSemanal = 0, passSemanal = 0, ahorroSemanal = 0, deudaUberSemanal = 0, gananciaSemanal = 0;
    // Totales de Gastos
    let yoSemanal = 0, carroSemanal = 0, gastosFijosSemanal = 0, comidaCalleSemanal = 0, gastosSemanal = 0;
    let diferenciaSemanal = 0;

    dias.forEach(d => {
      trabajoSemanal += Number(d.trabajo) || 0;
      gasolinaSemanal += Number(d.gasolina) || 0;
      passSemanal += Number(d.pass) || 0;
      ahorroSemanal += Number(d.ahorro) || 0;
      deudaUberSemanal += Number(d.deudaUber) || 0;
      gananciaSemanal += Number(d.gananciaNeto) || 0;

      yoSemanal += Number(d.yo) || 0;
      carroSemanal += Number(d.carro) || 0;
      gastosFijosSemanal += Number(d.gastosFijos) || 0;
      comidaCalleSemanal += Number(d.comidaCalle) || 0;
      gastosSemanal += Number(d.gastoTotal) || 0;

      diferenciaSemanal += Number(d.diferencia) || 0;
    });

    const semanaDiv = document.createElement('div');
    semanaDiv.className = 'bloque-semana';

    const tituloSemana = formatearRangoSemana(lunesKey);
    const colorDifSemanal = diferenciaSemanal < 0 ? '#dc3545' : '#28a745';

    let htmlDias = '';
    dias.forEach(r => {
      const difNum = Number(r.diferencia) || 0;
      const colorDif = difNum < 0 ? '#dc3545' : '#28a745';

      htmlDias += `
        <div class="item-historial">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div class="historial-fecha">📅 <strong>${r.fecha}</strong></div>
            <div>
              <button class="btn-editar" onclick="editarDiaHistorial('${r.fecha}')" title="Editar">✏️</button>
              <button class="btn-eliminar" onclick="eliminarDiaHistorial('${r.fecha}')" title="Eliminar">🗑️</button>
            </div>
          </div>
          <div class="historial-detalles">
            <span>Ganancia Neto: <strong>${fmt(r.gananciaNeto)}</strong></span> | 
            <span>Gastos: <strong>${fmt(r.gastoTotal)}</strong></span> | 
            <span>Dif: <strong style="color:${colorDif};">${fmt(r.diferencia)}</strong></span>
          </div>
        </div>
      `;
    });

    semanaDiv.innerHTML = `
      <div class="encabezado-semana">${tituloSemana}</div>

      <!-- TARJETAS DE DOS COLUMNAS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        
        <!-- COLUMNA INGRESO -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 10px; font-size: 11px;">
          <strong style="color: #166534; display: block; margin-bottom: 6px; font-size: 12px;">💼 TRABAJO</strong>
          <div>Bruto: <strong>${fmt(trabajoSemanal)}</strong></div>
          <div>Gasolina: -${fmt(gasolinaSemanal)}</div>
          <div>Peajes: -${fmt(passSemanal)}</div>
          <div>Ahorro: -${fmt(ahorroSemanal)}</div>
          <div>Deuda Uber: -${fmt(deudaUberSemanal)}</div>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #bbf7d0; color: #15803d; font-size: 12px;">
            <strong>Neto: ${fmt(gananciaSemanal)}</strong>
          </div>
        </div>

        <!-- COLUMNA GASTOS -->
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 10px; font-size: 11px;">
          <strong style="color: #991b1b; display: block; margin-bottom: 6px; font-size: 12px;">💸 GASTOS</strong>
          <div>Personal: ${fmt(yoSemanal)}</div>
          <div>Carro: ${fmt(carroSemanal)}</div>
          <div>Gastos Fijos: ${fmt(gastosFijosSemanal)}</div>
          <div>Comida: ${fmt(comidaCalleSemanal)}</div>
          <div style="margin-top: 18px; padding-top: 4px; border-top: 1px solid #fecaca; color: #b91c1c; font-size: 12px;">
            <strong>Total: ${fmt(gastosSemanal)}</strong>
          </div>
        </div>

      </div>

      <!-- CUADRE GENERAL -->
      <div style="background: #f8fafc; padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 10px;">
        <span><strong>Cuadre Neto Semana:</strong></span>
        <strong style="color:${colorDifSemanal}; font-size: 14px;">${fmt(diferenciaSemanal)}</strong>
      </div>

      <!-- DESPLEGABLE DE DÍAS -->
      <details>
        <summary style="cursor: pointer; font-size: 12px; color: #2563eb; font-weight: 600; padding: 4px 0;">
          Ver detalle por días (${dias.length})
        </summary>
        <div class="lista-dias-semana" style="margin-top: 8px;">
          ${htmlDias}
        </div>
      </details>
    `;

    contenedor.appendChild(semanaDiv);
  });
}

// --- GESTIÓN DE AHORRO PROGRAMADO PARA GASTOS FIJOS ---
function agregarGastoFijo() {
  const nombre = document.getElementById('nombreFijo').value.trim();
  const monto = getN('montoFijo');
  const diaPago = parseInt(document.getElementById('diaPagoFijo').value) || 30;

  if (!nombre || monto <= 0) {
    alert('Ingresa un nombre y monto válido');
    return;
  }

  let fijos = JSON.parse(localStorage.getItem('gastosFijosLista')) || [];
  fijos.push({ id: Date.now(), nombre, monto, diaPago });
  localStorage.setItem('gastosFijosLista', JSON.stringify(fijos));

  document.getElementById('nombreFijo').value = '';
  document.getElementById('montoFijo').value = '';
  document.getElementById('diaPagoFijo').value = '';

  cargarGastosFijos();
}

function eliminarGastoFijo(id) {
  let fijos = JSON.parse(localStorage.getItem('gastosFijosLista')) || [];
  fijos = fijos.filter(f => f.id !== id);
  localStorage.setItem('gastosFijosLista', JSON.stringify(fijos));
  cargarGastosFijos();
}

function cargarGastosFijos() {
  const tablaBody = document.getElementById('tablaGastosFijos');
  if (!tablaBody) return;
  const fijos = JSON.parse(localStorage.getItem('gastosFijosLista')) || [];
  tablaBody.innerHTML = '';

  const fechaEl = document.getElementById('fecha');
  const partesFecha = (fechaEl ? fechaEl.value || obtenerFechaLocal() : obtenerFechaLocal()).split('-');
  const diaDelMes = parseInt(partesFecha[2], 10) || 1;

  let totalAhorroDiario = 0;
  let totalAhorroSugeridoAcumulado = 0;

  fijos.forEach(f => {
    const diaPago = f.diaPago > 0 ? f.diaPago : 30;

    // 1. El valor diario siempre es la cuota dividida en 30 días
    const ahorroPorDia = f.monto / 30;

    // 2. Cálculo de días transcurridos dentro del ciclo de 30 días de cobro
    let diasTranscurridos;
    if (diaDelMes < diaPago) {
      // Si aún no llega el día de pago este mes, venimos ahorrando desde el mes pasado
      diasTranscurridos = 30 - (diaPago - diaDelMes);
    } else {
      // Si hoy es el mismo día de pago o ya pasó en este mes
      diasTranscurridos = diaDelMes - diaPago;
    }

    const ahorroAcumuladoHoy = ahorroPorDia * diasTranscurridos;

    totalAhorroDiario += ahorroPorDia;
    totalAhorroSugeridoAcumulado += ahorroAcumuladoHoy;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.nombre}</td>
      <td>${fmt(f.monto)}</td>
      <td>Día ${f.diaPago}</td>
      <td><strong>${fmt(ahorroPorDia)}</strong></td>
      <td><strong>${fmt(ahorroAcumuladoHoy)}</strong></td>
      <td><button class="btn-eliminar" onclick="eliminarGastoFijo(${f.id})">X</button></td>
    `;
    tablaBody.appendChild(tr);
  });

  const totalDiarioEl = document.getElementById('totalAhorroDiarioSugerido');
  if (totalDiarioEl) {
    totalDiarioEl.textContent = fmt(totalAhorroDiario);
  }

  const totalSugeridoEl = document.getElementById('totalAhorroSugerido');
  if (totalSugeridoEl) {
    totalSugeridoEl.textContent = fmt(totalAhorroSugeridoAcumulado);
  }
}