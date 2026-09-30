// ==========================================
// UTILIDADES Y FUNCIONES BASE
// ==========================================

function fmt(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// Limpia los puntos de miles antes de hacer operaciones matemáticas
function getN(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const valorLimpio = el.value.replace(/\./g, '');
    const val = parseFloat(valorLimpio);
    return isNaN(val) ? 0 : val;
}

// Función global para formatear cualquier input con puntos de miles mientras se escribe
function aplicarFormatoMiles(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let valorOriginal = e.target.value;
        
        // Quita todo lo que no sea número
        let valor = valorOriginal.replace(/\D/g, ''); 
        
        if (valor !== '') {
            // Formatea con puntos de miles (es-CO usa puntos para miles)
            valor = Number(valor).toLocaleString('es-CO');
        }
        
        e.target.value = valor;
    });
}

function obtenerFechaLocal() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function obtenerLunesSemana(fechaStr) {
    const d = new Date(fechaStr + 'T00:00:00');
    const diaSemana = d.getDay();
    const diff = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    const anio = lunes.getFullYear();
    const mes = String(lunes.getMonth() + 1).padStart(2, '0');
    const dia = String(lunes.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function formatearRangoSemana(lunesStr) {
    const lunes = new Date(lunesStr + 'T00:00:00');
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const opcionesMes = { month: 'short' };
    const mesLunes = lunes.toLocaleDateString('es-ES', opcionesMes);
    const mesDomingo = domingo.toLocaleDateString('es-ES', opcionesMes);

    return `📅 Semana del ${lunes.getDate()} de ${mesLunes} al ${domingo.getDate()} de ${mesDomingo} de ${domingo.getFullYear()}`;
}

// ==========================================
// CALCULO DE TOTALES Y CUADRE
// ==========================================

function calcularTotales() {
    const trabajo = getN('trabajo');
    const gasolina = getN('gasolina');
    const pass = getN('pass');
    const deudaUber = getN('deudaUber');
    const ahorro = getN('ahorro');

    const gananciaNeto = trabajo - (gasolina + pass + deudaUber + ahorro);

    const yo = getN('yo');
    const carro = getN('carro');
    const comidaCalle = getN('comidaCalle');
    const gastosFijos = getN('gastoFijo');

    const gastoTotal = yo + carro + comidaCalle + gastosFijos;

    const efectivo = getN('efectivo');
    const nequi = getN('nequi');
    const pendiente = getN('pendiente');

    const tengoTotal = efectivo + nequi + pendiente;

    const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    const fechaInput = document.getElementById('fecha');
    const fechaActual = fechaInput ? fechaInput.value : obtenerFechaLocal();
    
    const registrosAnteriores = registros.filter(r => r.fecha < fechaActual);
    
    let tengoAyer = 0;
    if (registrosAnteriores.length > 0) {
        tengoAyer = Number(registrosAnteriores[registrosAnteriores.length - 1].tengoTotal) || 0;
    } else {
        const fechasOrdenadas = [...registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
        const idxActual = fechasOrdenadas.findIndex(r => r.fecha === fechaActual);
        if (idxActual > 0) {
            tengoAyer = Number(fechasOrdenadas[idxActual - 1].tengoTotal) || 0;
        }
    }

    const inputsVacios = trabajo === 0 && gasolina === 0 && pass === 0 && ahorro === 0 && deudaUber === 0 &&
                         yo === 0 && carro === 0 && gastosFijos === 0 && comidaCalle === 0 &&
                         efectivo === 0 && nequi === 0 && pendiente === 0;

    const deberiaTener = inputsVacios ? 0 : (tengoAyer + gananciaNeto - gastoTotal);
    const diferencia = inputsVacios ? 0 : (tengoTotal - deberiaTener);

    const elGananciaNeto = document.getElementById('gananciaNeto');
    if (elGananciaNeto) elGananciaNeto.textContent = fmt(gananciaNeto);

    const elGastoTotal = document.getElementById('gastoTotal');
    if (elGastoTotal) elGastoTotal.textContent = fmt(gastoTotal);

    const elTengoTotal = document.getElementById('tengoTotal');
    if (elTengoTotal) elTengoTotal.textContent = fmt(tengoTotal);

    const elTengoAyer = document.getElementById('tengoAyer');
    if (elTengoAyer) elTengoAyer.textContent = inputsVacios ? '$0' : fmt(tengoAyer);

    const elDeberiaTener = document.getElementById('deberiaTener');
    if (elDeberiaTener) elDeberiaTener.textContent = inputsVacios ? '$0' : fmt(deberiaTener);

    const elDif = document.getElementById('diferencia');
    if (elDif) {
        elDif.textContent = fmt(diferencia);
        if (diferencia < 0) {
            elDif.style.color = '#f43f5e';
        } else if (diferencia > 0) {
            elDif.style.color = '#22c55e';
        } else {
            elDif.style.color = '#cbd5e1';
        }
    }

    if (typeof cargarGastosFijos === 'function') {
        cargarGastosFijos();
    }
}

// ==========================================
// GESTIÓN DE AHORRO PROGRAMADO / GASTOS FIJOS
// ==========================================

function agregarGastoFijo() {
    const inputConcepto = document.getElementById('nombreFijo');
    const inputValor = document.getElementById('valorFijo');
    const inputDia = document.getElementById('diaFijo');

    if (!inputConcepto || !inputValor || !inputDia) {
        alert('Error: No se encuentran los campos del formulario.');
        return;
    }

    const concepto = inputConcepto.value.trim();
    const valorMes = getN('valorFijo'); // Limpia los puntos automáticamente
    const diaPago = parseInt(inputDia.value) || 1;

    if (!concepto || valorMes <= 0) {
        alert('Por favor ingresa un concepto y un valor de mes válidos.');
        return;
    }

    const listaFijos = JSON.parse(localStorage.getItem('listaGastosFijos')) || [];

    listaFijos.push({
        id: Date.now().toString(),
        concepto,
        valorMes,
        diaPago,
        pagado: false
    });

    localStorage.setItem('listaGastosFijos', JSON.stringify(listaFijos));

    inputConcepto.value = '';
    inputValor.value = '';
    inputDia.value = '';

    cargarGastosFijos();
    calcularTotales();
}

function eliminarGastoFijo(id) {
    let listaFijos = JSON.parse(localStorage.getItem('listaGastosFijos')) || [];
    listaFijos = listaFijos.filter(item => item.id !== id);
    localStorage.setItem('listaGastosFijos', JSON.stringify(listaFijos));
    cargarGastosFijos();
    calcularTotales();
}

function togglePagadoGastoFijo(id) {
    let listaFijos = JSON.parse(localStorage.getItem('listaGastosFijos')) || [];
    listaFijos = listaFijos.map(item => {
        if (item.id === id) {
            item.pagado = !item.pagado;
        }
        return item;
    });
    localStorage.setItem('listaGastosFijos', JSON.stringify(listaFijos));
    cargarGastosFijos();
    calcularTotales();
}

function cargarGastosFijos() {
    const listaFijos = JSON.parse(localStorage.getItem('listaGastosFijos')) || [];
    const tbody = document.getElementById('tablaGastosFijos');
    
    if (!tbody) return;
    
    const fechaInput = document.getElementById('fecha');
    const hoyStr = fechaInput ? fechaInput.value : obtenerFechaLocal();
    const fechaHoy = new Date(hoyStr + 'T00:00:00');
    const anioActual = fechaHoy.getFullYear();
    const mesActual = fechaHoy.getMonth();

    let html = '';
    let totalAhorroDiarioReq = 0;
    let totalMetaAcumuladaHoy = 0;

    listaFijos.forEach(item => {
        let fechaPago = new Date(anioActual, mesActual, item.diaPago);
        if (fechaHoy > fechaPago) {
            fechaPago = new Date(anioActual, mesActual + 1, item.diaPago);
        }

        let fechaInicio = new Date(fechaPago.getFullYear(), fechaPago.getMonth() - 1, item.diaPago);
        
        const diffTiempoTotal = fechaPago - fechaInicio;
        const diffDiasTotal = Math.max(1, Math.round(diffTiempoTotal / (1000 * 60 * 60 * 24)));
        
        const ahorroDiario = item.valorMes / diffDiasTotal;

        const diffTiempoTrans = fechaHoy - fechaInicio;
        const diffDiasTrans = Math.max(0, Math.round(diffTiempoTrans / (1000 * 60 * 60 * 24)));
        
        let acumuladoHoy = ahorroDiario * diffDiasTrans;
        if (acumuladoHoy > item.valorMes) acumuladoHoy = item.valorMes;
        if (item.pagado) acumuladoHoy = 0;

        if (!item.pagado) {
            totalAhorroDiarioReq += ahorroDiario;
            totalMetaAcumuladaHoy += acumuladoHoy;
        }

        html += `
            <tr>
                <td><strong>${item.concepto}</strong></td>
                <td>${fmt(item.valorMes)}</td>
                <td>Día ${item.diaPago}</td>
                <td style="color: var(--neon-green, #22c55e);">${fmt(ahorroDiario)}</td>
                <td style="color: var(--neon-cyan, #38bdf8);">${fmt(acumuladoHoy)}</td>
                <td><input type="checkbox" ${item.pagado ? 'checked' : ''} onclick="togglePagadoGastoFijo('${item.id}')" style="cursor:pointer;"></td>
                <td><button onclick="eliminarGastoFijo('${item.id}')" style="background:#f43f5e; border:none; color:white; padding:3px 6px; border-radius:4px; cursor:pointer;" title="Eliminar">🗑️</button></td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding: 10px;">No hay gastos fijos registrados.</td></tr>';

    const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    let totalSaldoSemanaActual = 0;

    if (registros.length > 0) {
        const lunesActualKey = obtenerLunesSemana(hoyStr);
        const diasSemanaActual = registros.filter(r => obtenerLunesSemana(r.fecha) === lunesActualKey);
        
        if (diasSemanaActual.length > 0) {
            diasSemanaActual.sort((a, b) => a.fecha.localeCompare(b.fecha));
            const ultimoDia = diasSemanaActual[diasSemanaActual.length - 1];
            totalSaldoSemanaActual = Number(ultimoDia.tengoTotal) || 0;
        } else {
            const ultimoRegistro = registros[registros.length - 1];
            totalSaldoSemanaActual = Number(ultimoRegistro.tengoTotal) || 0;
        }
    }

    const totalLibre = totalSaldoSemanaActual - totalMetaAcumuladaHoy;

    const elTotalDiario = document.getElementById('totalAhorroDiarioSugerido');
    if (elTotalDiario) elTotalDiario.textContent = fmt(totalAhorroDiarioReq);

    const elMetaAcumulada = document.getElementById('totalAhorroSugerido');
    if (elMetaAcumulada) elMetaAcumulada.textContent = fmt(totalMetaAcumuladaHoy);

    const elLibre = document.getElementById('totalLibre');
    if (elLibre) {
        elLibre.textContent = fmt(totalLibre);
        elLibre.style.color = totalLibre < 0 ? '#f43f5e' : '#22c55e';
    }
}

// ==========================================
// GUARDAR / EDITAR / ELIMINAR DÍA
// ==========================================

function guardarDia() {
    const fechaInput = document.getElementById('fecha');
    const fecha = fechaInput ? fechaInput.value : obtenerFechaLocal();

    if (!fecha) {
        alert('Por favor selecciona una fecha.');
        return;
    }

    const trabajo = getN('trabajo');
    const gasolina = getN('gasolina');
    const pass = getN('pass');
    const deudaUber = getN('deudaUber');
    const ahorro = getN('ahorro');
    const gananciaNeto = trabajo - (gasolina + pass + deudaUber + ahorro);

    const yo = getN('yo');
    const carro = getN('carro');
    const comidaCalle = getN('comidaCalle');
    const gastosFijos = getN('gastoFijo');
    const gastoTotal = yo + carro + comidaCalle + gastosFijos;

    const efectivo = getN('efectivo');
    const nequi = getN('nequi');
    const pendiente = getN('pendiente');
    const tengoTotal = efectivo + nequi + pendiente;

    const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    const registrosAnteriores = registros.filter(r => r.fecha < fecha);
    let tengoAyer = 0;
    if (registrosAnteriores.length > 0) {
        tengoAyer = Number(registrosAnteriores[registrosAnteriores.length - 1].tengoTotal) || 0;
    }
    const deberiaTener = tengoAyer + gananciaNeto - gastoTotal;
    const diferencia = tengoTotal - deberiaTener;

    const nuevoRegistro = {
        fecha,
        trabajo,
        gasolina,
        pass,
        deudaUber,
        ahorro,
        gananciaNeto,
        yo,
        carro,
        comidaCalle,
        gastosFijos,
        gastoTotal,
        efectivo,
        nequi,
        pendiente,
        tengoTotal,
        diferencia
    };

    const index = registros.findIndex(r => r.fecha === fecha);
    if (index >= 0) {
        registros[index] = nuevoRegistro;
    } else {
        registros.push(nuevoRegistro);
    }

    registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
    localStorage.setItem('registrosGastos', JSON.stringify(registros));

    alert('¡Registro guardado con éxito!');

    // Limpiar el formulario después de guardar de forma exitosa
    const idsInputsMonetarios = [
        'trabajo', 'gasolina', 'pass', 'deudaUber', 'ahorro',
        'yo', 'carro', 'comidaCalle', 'gastoFijo', 'efectivo', 'nequi', 'pendiente'
    ];

    idsInputsMonetarios.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.value = '';
        }
    });

    // Recalcular los totales para que vuelvan a $0 en la interfaz
    calcularTotales();
    
    // Actualizar el historial inferior
    cargarHistorial();
}

function editarDiaHistorial(fecha) {
    const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    const registro = registros.find(r => r.fecha === fecha);
    if (!registro) return;

    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = registro.fecha;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val ? Number(val).toLocaleString('es-CO') : '';
    };

    setVal('trabajo', registro.trabajo);
    setVal('gasolina', registro.gasolina);
    setVal('pass', registro.pass);
    setVal('deudaUber', registro.deudaUber);
    setVal('ahorro', registro.ahorro);

    setVal('yo', registro.yo);
    setVal('carro', registro.carro);
    setVal('comidaCalle', registro.comidaCalle);
    setVal('gastoFijo', registro.gastosFijos);

    setVal('efectivo', registro.efectivo);
    setVal('nequi', registro.nequi);
    setVal('pendiente', registro.pendiente);

    calcularTotales();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarDiaHistorial(fecha) {
    if (!confirm(`¿Estás seguro de eliminar el registro del día ${fecha}?`)) return;

    let registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    registros = registros.filter(r => r.fecha !== fecha);
    localStorage.setItem('registrosGastos', JSON.stringify(registros));

    cargarHistorial();
    calcularTotales();
}

// ==========================================
// CARGAR HISTORIAL (SEMANAS Y MESES)
// ==========================================

function cargarHistorial() {
    const contenedor = document.getElementById('historial');
    if (!contenedor) return;

    const registros = JSON.parse(localStorage.getItem('registrosGastos')) || [];
    contenedor.innerHTML = '';

    if (registros.length === 0) {
        contenedor.innerHTML = '<p style="color:#94a3b8; text-align:center;">No hay días guardados aún.</p>';
        return;
    }

    const meses = {};
    registros.forEach(r => {
        const [anio, mesStr] = r.fecha.split('-');
        const mesKey = `${anio}-${mesStr}`;
        if (!meses[mesKey]) {
            meses[mesKey] = [];
        }
        meses[mesKey].push(r);
    });

    const mesesOrdenados = Object.keys(meses).sort((a, b) => b.localeCompare(a));
    const nombresMeses = {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };

    let htmlResumenesMensuales = '';
    mesesOrdenados.forEach((mesKey) => {
        const [anio, mesNum] = mesKey.split('-');
        const diasMes = meses[mesKey];
        diasMes.sort((a, b) => a.fecha.localeCompare(b.fecha));

        let brutoMes = 0, gasolinaMes = 0, passMes = 0, ahorroMes = 0, deudaUberMes = 0, gananciaMes = 0;
        let personalMes = 0, carroMes = 0, gastosFijosMes = 0, comidaMes = 0, gastosTotalesMes = 0;

        diasMes.forEach(d => {
            brutoMes += Number(d.trabajo) || 0;
            gasolinaMes += Number(d.gasolina) || 0;
            passMes += Number(d.pass) || 0;
            ahorroMes += Number(d.ahorro) || 0;
            deudaUberMes += Number(d.deudaUber) || 0;
            gananciaMes += Number(d.gananciaNeto) || 0;

            personalMes += Number(d.yo) || 0;
            carroMes += Number(d.carro) || 0;
            gastosFijosMes += Number(d.gastosFijos) || 0;
            comidaMes += Number(d.comidaCalle) || 0;
            gastosTotalesMes += Number(d.gastoTotal) || 0;
        });

        const diferenciaMes = gananciaMes - gastosTotalesMes;
        const colorDifMes = diferenciaMes < 0 ? '#f43f5e' : '#22c55e';
        const nombreMesTexto = `${nombresMeses[mesNum] || mesNum} ${anio}`;

        htmlResumenesMensuales += `
            <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 15px; width: 100%; box-sizing: border-box; color: #ffffff;">
                <div style="font-size: 15px; font-weight: 700; color: #ffffff; margin-bottom: 12px; text-align: center;">
                    📊 ${nombreMesTexto.toUpperCase()}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                    <div style="background: rgba(20, 83, 45, 0.3); border: 1px solid rgba(34, 197, 94, 0.3); padding: 12px; border-radius: 12px; font-size: 12px; color: #ffffff;">
                        <strong style="color: #22c55e; display: block; margin-bottom: 6px; font-size: 13px;">💼 TRABAJO MES</strong>
                        <div>Bruto: <strong>${fmt(brutoMes)}</strong></div>
                        <div>Gasolina: -${fmt(gasolinaMes)}</div>
                        <div>Pass: -${fmt(passMes)}</div>
                        <div>Deuda Uber: -${fmt(deudaUberMes)}</div>
                        <div>Ahorro Fijos: -${fmt(ahorroMes)}</div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; font-size: 13px;">
                            <strong>Neto: ${fmt(gananciaMes)}</strong>
                        </div>
                    </div>

                    <div style="background: rgba(159, 18, 57, 0.25); border: 1px solid rgba(244, 63, 94, 0.3); padding: 12px; border-radius: 12px; font-size: 12px; color: #ffffff;">
                        <strong style="color: #f43f5e; display: block; margin-bottom: 6px; font-size: 13px;">💸 GASTOS MES</strong>
                        <div>Personal: <strong>${fmt(personalMes)}</strong></div>
                        <div>Carro: ${fmt(carroMes)}</div>
                        <div>Gastos Fijos: ${fmt(gastosFijosMes)}</div>
                        <div>Comida: ${fmt(comidaMes)}</div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e; font-size: 13px;">
                            <strong>Total: ${fmt(gastosTotalesMes)}</strong>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(3, 7, 18, 0.8); width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; border: 1px solid rgba(250, 204, 21, 0.3);">
                    <span><strong>Balance Final Mes:</strong></span>
                    <strong style="color:${colorDifMes}; font-size: 16px;">${fmt(diferenciaMes)}</strong>
                </div>
            </div>
        `;
    });

    const desplegableMensualDiv = document.createElement('div');
    desplegableMensualDiv.style.marginBottom = '20px';
    desplegableMensualDiv.innerHTML = `
        <div style="background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; width: 100%; box-sizing: border-box;">
            <details>
                <summary style="cursor: pointer; font-size: 15px; color: #ffffff; font-weight: 700; list-style: none; display: flex; justify-content: space-between; align-items: center;">
                    <span>📂 Ver Resúmenes Mensuales</span>
                    <span style="font-size: 12px; font-weight: normal;">(Click para desplegar) ▼</span>
                </summary>
                <div style="margin-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                    ${htmlResumenesMensuales}
                </div>
            </details>
        </div>
    `;
    contenedor.appendChild(desplegableMensualDiv);

    const semanas = {};
    registros.forEach(r => {
        const lunesKey = obtenerLunesSemana(r.fecha);
        if (!semanas[lunesKey]) {
            semanas[lunesKey] = [];
        }
        semanas[lunesKey].push(r);
    });

    const semanasOrdenadas = Object.keys(semanas).sort((a, b) => new Date(b) - new Date(a));

    semanasOrdenadas.forEach((lunesKey) => {
        const dias = semanas[lunesKey];
        dias.sort((a, b) => a.fecha.localeCompare(b.fecha));

        let trabajoSemanal = 0, gasolinaSemanal = 0, passSemanal = 0, ahorroSemanal = 0, deudaUberSemanal = 0, gananciaSemanal = 0;
        let yoSemanal = 0, carroSemanal = 0, gastosFijosSemanal = 0, comidaCalleSemanal = 0, gastosSemanal = 0;

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
        });

        const diferenciaSemanal = gananciaSemanal - gastosSemanal;
        const ultimoDiaSemana = dias[dias.length - 1];
        const efectivoSemanal = ultimoDiaSemana ? (Number(ultimoDiaSemana.efectivo) || 0) : 0;
        const nequiSemanal = ultimoDiaSemana ? (Number(ultimoDiaSemana.nequi) || 0) : 0;
        const pendienteSemanal = ultimoDiaSemana ? (Number(ultimoDiaSemana.pendiente) || 0) : 0;
        const tengoTotalSemanal = efectivoSemanal + nequiSemanal + pendienteSemanal;

        const tituloSemana = formatearRangoSemana(lunesKey);
        const colorDifSemanal = diferenciaSemanal < 0 ? '#f43f5e' : '#22c55e';

        let htmlDias = '';
        dias.forEach(r => {
            const difNum = Number(r.diferencia) || 0;
            const colorDif = difNum < 0 ? '#f43f5e' : '#22c55e';
            const rEfectivo = Number(r.efectivo) || 0;
            const rNequi = Number(r.nequi) || 0;
            const rPendiente = Number(r.pendiente) || 0;
            const rTotal = Number(r.tengoTotal) || 0;

            htmlDias += `
                <div style="border-left: 3px solid #38bdf8; padding: 12px; margin-bottom: 10px; border-radius: 10px; background: rgba(3, 7, 18, 0.4); width: 100%; box-sizing: border-box; color: #ffffff;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div>📅 <strong>${r.fecha}</strong></div>
                        <div>
                            <button onclick="editarDiaHistorial('${r.fecha}')" title="Editar" style="background:none; border:none; cursor:pointer;">✏️</button>
                            <button onclick="eliminarDiaHistorial('${r.fecha}')" title="Eliminar" style="background:none; border:none; cursor:pointer;">🗑</button>
                        </div>
                    </div>
                    <div style="font-size: 12px; margin-bottom: 6px;">
                        Ganancia Neto: <strong style="color:#22c55e;">${fmt(r.gananciaNeto)}</strong> | 
                        Gastos: <strong style="color:#f43f5e;">${fmt(r.gastoTotal)}</strong> | 
                        Dif: <strong style="color:${colorDif};">${fmt(r.diferencia)}</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 6px 8px; border-radius: 6px; font-size: 11px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                        <span>Efectivo: <strong>${fmt(rEfectivo)}</strong></span>
                        <span>Nequi: <strong>${fmt(rNequi)}</strong></span>
                        <span style="color: #facc15;">⏳ Pendiente: <strong>${fmt(rPendiente)}</strong></span>
                        <span><strong>Total: ${fmt(rTotal)}</strong></span>
                    </div>
                </div>
            `;
        });

        const semanaDiv = document.createElement('div');
        semanaDiv.style.marginBottom = '20px';

        semanaDiv.innerHTML = `
            <div style="font-weight:700; margin-bottom:8px; color:#38bdf8; font-size:14px;">${tituloSemana}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div style="background: rgba(20, 83, 45, 0.3); border: 1px solid rgba(34, 197, 94, 0.3); padding: 12px; border-radius: 12px; font-size: 12px; color: #ffffff;">
                    <strong style="color: #22c55e; display: block; margin-bottom: 6px; font-size: 13px;">💼 TRABAJO</strong>
                    <div>Bruto: <strong>${fmt(trabajoSemanal)}</strong></div>
                    <div>Gasolina: -${fmt(gasolinaSemanal)}</div>
                    <div>Pass: -${fmt(passSemanal)}</div>
                    <div>Deuda Uber: -${fmt(deudaUberSemanal)}</div>
                    <div>Ahorro Fijos: -${fmt(ahorroSemanal)}</div>
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; font-size: 13px;">
                        <strong>Neto: ${fmt(gananciaSemanal)}</strong>
                    </div>
                </div>

                <div style="background: rgba(159, 18, 57, 0.25); border: 1px solid rgba(244, 63, 94, 0.3); padding: 12px; border-radius: 12px; font-size: 12px; color: #ffffff;">
                    <strong style="color: #f43f5e; display: block; margin-bottom: 6px; font-size: 13px;">💸 GASTOS</strong>
                    <div>Personal: <strong>${fmt(yoSemanal)}</strong></div>
                    <div>Carro: ${fmt(carroSemanal)}</div>
                    <div>Gastos Fijos: ${fmt(gastosFijosSemanal)}</div>
                    <div>Comida: ${fmt(comidaCalleSemanal)}</div>
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e; font-size: 13px;">
                        <strong>Total: ${fmt(gastosSemanal)}</strong>
                    </div>
                </div>
            </div>

            <div style="background: rgba(3, 7, 18, 0.6); border: 1px solid rgba(56, 189, 248, 0.3); padding: 10px 12px; border-radius: 10px; font-size: 12px; margin-bottom: 12px; width: 100%; box-sizing: border-box; color: #ffffff;">
                <strong style="color: #38bdf8; display: block; margin-bottom: 6px; font-size: 13px;">💰 SALDO Y DISPONIBILIDAD SEMANAL</strong>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>Efectivo total:</span> <strong>${fmt(efectivoSemanal)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span>Nequi total:</span> <strong>${fmt(nequiSemanal)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #facc15;">
                    <span>⏳ Pendiente por cobrar:</span> <strong>${fmt(pendienteSemanal)}</strong>
                </div>
                <div style="border-top: 1px solid rgba(56, 189, 248, 0.2); padding-top: 6px; display: flex; justify-content: space-between; font-size: 13px;">
                    <span><strong>Total Saldo (Incluyendo pendiente):</strong></span>
                    <strong>${fmt(tengoTotalSemanal)}</strong>
                </div>
            </div>

            <div style="background: rgba(3, 7, 18, 0.8); width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin-bottom: 12px; border: 1px solid rgba(236, 10, 10, 0.3);">
                <span><strong>Cuadre Final Semana:</strong></span>
                <strong style="color:${colorDifSemanal}; font-size: 16px;">${fmt(diferenciaSemanal)}</strong>
            </div>

            <details>
                <summary style="cursor: pointer; font-size: 13px; color: #a855f7; font-weight: 700; padding: 4px 0;">
                    <span>Ver detalle por días (${dias.length})</span>
                </summary>
                <div style="margin-top: 10px; color: #ffffff;">
                    ${htmlDias}
                </div>
            </details>
        `;

        contenedor.appendChild(semanaDiv);
    });
}

// ==========================================
// EVENTOS Y LISTENERS
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = obtenerFechaLocal();
    }

    // Aplicar formato automático de puntos de miles a todos los inputs monetarios
    const idsInputsMonetarios = [
        'valorFijo', 'trabajo', 'gasolina', 'pass', 'deudaUber', 'ahorro',
        'yo', 'carro', 'comidaCalle', 'gastoFijo', 'efectivo', 'nequi', 'pendiente'
    ];

    idsInputsMonetarios.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            aplicarFormatoMiles(inputEl);
        }
    });

    // Activar cálculo automático al escribir en cualquier input
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calcularTotales();
        });
    });

    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarDia);
    }

    calcularTotales();
    cargarHistorial();
    cargarGastosFijos();
});