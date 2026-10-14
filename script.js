// ==========================================
// UTILIDADES Y FUNCIONES BASE
// ==========================================

function fmt(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function getN(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const valorLimpio = el.value.replace(/\./g, '');
    const val = parseFloat(valorLimpio);
    return isNaN(val) ? 0 : val;
}

function aplicarFormatoMiles(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let valorOriginal = e.target.value;
        let valor = valorOriginal.replace(/\D/g, ''); 
        
        if (valor !== '') {
            valor = Number(valor).toLocaleString('es-CO');
        }
        
        e.target.value = valor;
        calcularTotales();
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
    const mercado = getN('mercado');
    const gastosFijos = getN('gastoFijo');

    const gastoTotal = yo + carro + comidaCalle + mercado + gastosFijos;

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
                         yo === 0 && carro === 0 && gastosFijos === 0 && comidaCalle === 0 && mercado === 0 &&
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
            elDif.style.color = '#ff007f';
        } else if (diferencia > 0) {
            elDif.style.color = '#00ff88';
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

    if (!inputConcepto || !inputValor || !inputDia) return;

    const concepto = inputConcepto.value.trim();
    const valorMes = getN('valorFijo'); 
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
        diaPago
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

function cargarGastosFijos() {
    const listaFijos = JSON.parse(localStorage.getItem('listaGastosFijos')) || [];
    const tbody = document.getElementById('tablaGastosFijos');
    
    if (!tbody) return;
    
    const fechaInput = document.getElementById('fecha');
    const hoyStr = fechaInput ? fechaInput.value : obtenerFechaLocal();
    const fechaHoy = new Date(hoyStr + 'T00:00:00');

    let html = '';
    let totalAhorroDiarioReq = 0;
    let totalMetaAcumuladaHoy = 0;

    const diasCicloBase = 30; 

    listaFijos.forEach(item => {
        const ahorroDiario = item.valorMes / diasCicloBase;
        let acumuladoHoy = 0;

        let anio = fechaHoy.getFullYear();
        let mes = fechaHoy.getMonth();
        
        let fechaPagoCiclo = new Date(anio, mes, item.diaPago);

        if (fechaHoy < fechaPagoCiclo) {
            mes -= 1;
            fechaPagoCiclo = new Date(anio, mes, item.diaPago);
        }

        const diffTiempoTrans = fechaHoy - fechaPagoCiclo;
        const diffDiasTrans = Math.max(0, Math.round(diffTiempoTrans / (1000 * 60 * 60 * 24)));

        acumuladoHoy = ahorroDiario * diffDiasTrans;

        totalAhorroDiarioReq += ahorroDiario;
        totalMetaAcumuladaHoy += acumuladoHoy;

        html += `
            <tr>
                <td><strong>${item.concepto}</strong></td>
                <td>${fmt(item.valorMes)}</td>
                <td>Día ${item.diaPago}</td>
                <td style="color: var(--holo-green);">${fmt(ahorroDiario)}</td>
                <td style="color: var(--holo-cyan);">${fmt(acumuladoHoy)}</td>
                <td><button type="button" onclick="eliminarGastoFijo('${item.id}')" style="background:#ff007f; border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;" title="Eliminar">🗑</button></td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 10px;">No hay gastos fijos registrados.</td></tr>';

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

    const elSaldoActualFijo = document.getElementById('totalSaldoActualFijo');
    if (elSaldoActualFijo) elSaldoActualFijo.textContent = fmt(totalSaldoSemanaActual);

    const elLibre = document.getElementById('totalLibre');
    if (elLibre) {
        elLibre.textContent = fmt(totalLibre);
        elLibre.style.color = totalLibre < 0 ? '#ff007f' : '#00ff88';
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
    const mercado = getN('mercado');
    const gastosFijos = getN('gastoFijo');
    const gastoTotal = yo + carro + comidaCalle + mercado + gastosFijos;

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
        mercado,
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

    const idsInputsMonetarios = [
        'trabajo', 'gasolina', 'pass', 'deudaUber', 'ahorro',
        'yo', 'carro', 'comidaCalle', 'mercado', 'gastoFijo', 'efectivo', 'nequi', 'pendiente'
    ];

    idsInputsMonetarios.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.value = '';
        }
    });

    calcularTotales();
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
    setVal('mercado', registro.mercado);
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

    function generarHtmlTarjeta(titulo, diasList) {
        let trabajoTotal = 0, gasolinaTotal = 0, passTotal = 0, ahorroTotal = 0, deudaUberTotal = 0, gananciaTotal = 0;
        let yoTotal = 0, carroTotal = 0, gastosFijosTotal = 0, comidaCalleTotal = 0, mercadoTotal = 0, gastosTotal = 0;

        diasList.forEach(d => {
            trabajoTotal += Number(d.trabajo) || 0;
            gananciaTotal += Number(d.gananciaNeto) || 0;
            gastosTotal += Number(d.gastoTotal) || 0;
            gasolinaTotal += Number(d.gasolina) || 0;
            passTotal += Number(d.pass) || 0;
            ahorroTotal += Number(d.ahorro) || 0;
            deudaUberTotal += Number(d.deudaUber) || 0;
            yoTotal += Number(d.yo) || 0;
            carroTotal += Number(d.carro) || 0;
            gastosFijosTotal += Number(d.gastosFijos) || 0;
            comidaCalleTotal += Number(d.comidaCalle) || 0;
            mercadoTotal += Number(d.mercado) || 0;
        });

        const diferenciaTotal = gananciaTotal - gastosTotal;
        const ultimoDia = diasList[diasList.length - 1];
        const efectivoTotal = ultimoDia ? (Number(ultimoDia.efectivo) || 0) : 0;
        const nequiTotal = ultimoDia ? (Number(ultimoDia.nequi) || 0) : 0;
        const pendienteTotal = ultimoDia ? (Number(ultimoDia.pendiente) || 0) : 0;
        const tengoTotalReal = efectivoTotal + nequiTotal + pendienteTotal;
        const colorDif = diferenciaTotal < 0 ? '#ff007f' : '#00ff88';

        let htmlDias = '';
        diasList.forEach(r => {
            const difNum = Number(r.diferencia) || 0;
            const colorDiaDif = difNum < 0 ? '#ff007f' : '#00ff88';
            htmlDias += `
                <div style="border-left: 3px solid var(--holo-cyan); padding: 12px; margin-bottom: 10px; border-radius: 10px; background: rgba(3, 7, 18, 0.4); width: 100%; box-sizing: border-box; color: #ffffff;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div>📅 <strong>${r.fecha}</strong></div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="editarDiaHistorial('${r.fecha}')" title="Editar" style="background: rgba(0, 240, 255, 0.2); border: 1px solid var(--holo-cyan); color: var(--holo-cyan); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">✏️ Editar</button>
                            <button type="button" onclick="eliminarDiaHistorial('${r.fecha}')" title="Eliminar" style="background: rgba(255, 0, 127, 0.2); border: 1px solid var(--holo-pink); color: var(--holo-pink); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑 Eliminar</button>
                        </div>
                    </div>
                    <div style="font-size: 13px; margin-bottom: 6px;">
                        Neto: <strong style="color:var(--holo-green);">${fmt(r.gananciaNeto)}</strong> | 
                        Gastos: <strong style="color:var(--holo-pink);">${fmt(r.gastoTotal)}</strong> | 
                        Dif: <strong style="color:${colorDiaDif};">${fmt(r.diferencia)}</strong>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 6px 8px; border-radius: 6px; font-size: 12px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
                        <span>Efectivo: <strong>${fmt(r.efectivo)}</strong></span>
                        <span>Nequi: <strong>${fmt(r.nequi)}</strong></span>
                        <span style="color: var(--holo-yellow);">Pendiente: <strong>${fmt(r.pendiente)}</strong></span>
                        <span><strong>Total: ${fmt(r.tengoTotal)}</strong></span>
                    </div>
                </div>
            `;
        });

        return `
            <div style="background: #030508; border:2px solid var(--holo-cyan); border-radius: 16px; padding: 18px; margin-bottom: 20px; box-sizing: border-box; width: 100%; box-shadow: 0 0 15px rgba(0, 240, 255, 0.25);">
                <div style="font-weight:700; margin-bottom:14px; color:var(--holo-cyan); font-size:15px; font-family:'Audiowide', cursive;">
                    📊 ${titulo}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                    <div style="background: rgba(20, 83, 45, 0.3); border: 1px solid rgba(0, 255, 136, 0.4); padding: 12px; border-radius: 12px; font-size: 14px; color: #ffffff;">
                        <strong style="color: var(--holo-green); display: block; margin-bottom: 6px; font-size: 15px; font-family:'Audiowide', cursive;">💼 TRABAJO</strong>
                        <div>Trabajo: <strong>${fmt(trabajoTotal)}</strong></div>
                        <div>Gasolina: -${fmt(gasolinaTotal)}</div>
                        <div>Pass: -${fmt(passTotal)}</div>
                        <div>Deuda Uber: -${fmt(deudaUberTotal)}</div>
                        <div>Ahorro Fijos: -${fmt(ahorroTotal)}</div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0, 255, 136, 0.3); color: var(--holo-green);">
                            <strong>Neto: ${fmt(gananciaTotal)}</strong>
                        </div>
                    </div>
                    <div style="background: rgba(159, 18, 57, 0.25); border: 1px solid rgba(255, 0, 127, 0.4); padding: 12px; border-radius: 12px; font-size: 14px; color: #ffffff;">
                        <strong style="color: var(--holo-pink); display: block; margin-bottom: 6px; font-size: 15px; font-family:'Audiowide', cursive;">💸 GASTOS</strong>
                        <div>Personal: <strong>${fmt(yoTotal)}</strong></div>
                        <div>Carro: ${fmt(carroTotal)}</div>
                        <div>Gastos Fijos: ${fmt(gastosFijosTotal)}</div>
                        <div>Comida: ${fmt(comidaCalleTotal)}</div>
                        <div>Mercado: ${fmt(mercadoTotal)}</div>
                        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 0, 127, 0.3); color: var(--holo-pink);">
                            <strong>Total: ${fmt(gastosTotal)}</strong>
                        </div>
                    </div>
                </div>
                <div style="background: rgba(15, 23, 42, 0.9); padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; margin-bottom: 15px; border: 1px solid rgba(0, 255, 136, 0.5);">
                    <span><strong>Balance Final:</strong></span>
                    <strong style="color:${colorDif}; font-size: 16px;">${fmt(diferenciaTotal)}</strong>
                </div>
                <div style="background: rgba(13, 17, 23, 0.9); border: 2px solid rgba(255, 234, 0, 0.6); padding: 14px; border-radius: 12px; font-size: 14px; margin-bottom: 15px;">
                    <strong style="color: var(--holo-yellow); display: block; margin-bottom: 6px; font-family:'Audiowide', cursive;">💰 SALDO Y DISPONIBILIDAD</strong>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>Efectivo:</span> <strong>${fmt(efectivoTotal)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>Nequi:</span> <strong>${fmt(nequiTotal)}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--holo-yellow);"><span>Pendiente:</span> <strong>${fmt(pendienteTotal)}</strong></div>
                    <div style="border-top: 1px solid rgba(0, 240, 255, 0.2); padding-top: 6px; display: flex; justify-content: space-between;">
                        <strong style="color:var(--holo-green); font-family:'Audiowide', cursive;">TOTAL SALDO REAL:</strong>
                        <strong style="color: var(--holo-green);">${fmt(tengoTotalReal)}</strong>
                    </div>
                </div>
                <details style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 10px;">
                    <summary style="cursor: pointer; font-size: 13px; color: var(--holo-purple); font-weight: 700;">Ver detalle por días (${diasList.length}) ▼</summary>
                    <div style="margin-top: 10px;">${htmlDias}</div>
                </details>
            </div>
        `;
    }

    // 1. Resúmenes Mensuales
    const meses = {};
    registros.forEach(r => {
        if (!r.fecha) return;
        const partes = r.fecha.split('-');
        if (partes.length < 2) return;
        const mesKey = `${partes[0]}-${partes[1]}`;
        if (!meses[mesKey]) meses[mesKey] = [];
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
        const partesMes = mesKey.split('-');
        const diasMes = meses[mesKey];
        diasMes.sort((a, b) => a.fecha.localeCompare(b.fecha));
        const nombreMesTexto = `${nombresMeses[partesMes[1]] || partesMes[1]} ${partesMes[0]}`;
        htmlResumenesMensuales += generarHtmlTarjeta(nombreMesTexto.toUpperCase(), diasMes);
    });

    const desplegableMensualDiv = document.createElement('div');
    desplegableMensualDiv.style.marginBottom = '20px';
    desplegableMensualDiv.innerHTML = `
        <div style="background: rgba(13, 17, 23, 0.85); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 16px; padding: 16px;">
            <details>
                <summary style="cursor: pointer; font-size: 15px; color: #ffffff; font-weight: 700;">📂 Ver Resúmenes Mensuales ▼</summary>
                <div style="margin-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                    ${htmlResumenesMensuales}
                </div>
            </details>
        </div>
    `;
    contenedor.appendChild(desplegableMensualDiv);

    // 2. Resúmenes Semanales
    const semanas = {};
    registros.forEach(r => {
        if (!r.fecha) return;
        const lunesKey = obtenerLunesSemana(r.fecha);
        if (!semanas[lunesKey]) semanas[lunesKey] = [];
        semanas[lunesKey].push(r);
    });

    const semanasOrdenadas = Object.keys(semanas).sort((a, b) => b.localeCompare(a));
    let htmlResumenesSemanales = '';
    semanasOrdenadas.forEach((lunesKey) => {
        const diasSemana = semanas[lunesKey];
        diasSemana.sort((a, b) => a.fecha.localeCompare(b.fecha));
        const tituloSemana = formatearRangoSemana(lunesKey);
        htmlResumenesSemanales += generarHtmlTarjeta(tituloSemana, diasSemana);
    });

    const desplegableSemanalDiv = document.createElement('div');
    desplegableSemanalDiv.style.marginBottom = '20px';
    desplegableSemanalDiv.innerHTML = `
        <div style="background: rgba(13, 17, 23, 0.85); border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 16px; padding: 16px;">
            <details>
                <summary style="cursor: pointer; font-size: 15px; color: #ffffff; font-weight: 700;">📂 Ver Resúmenes Semanales ▼</summary>
                <div style="margin-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                    ${htmlResumenesSemanales}
                </div>
            </details>
        </div>
    `;
    contenedor.appendChild(desplegableSemanalDiv);
}

function formatearRangoSemana(lunesStr) {
    const lunes = new Date(lunesStr + 'T00:00:00');
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const opcionesMes = { month: 'short' };
    const mesLunes = lunes.toLocaleDateString('es-ES', opcionesMes);
    const mesDomingo = domingo.toLocaleDateString('es-ES', opcionesMes);
    return `SEMANA DEL ${lunes.getDate()} ${mesLunes} AL ${domingo.getDate()} ${mesDomingo} ${domingo.getFullYear()}`.toUpperCase();
}

// ==========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = obtenerFechaLocal();
        fechaInput.addEventListener('change', () => calcularTotales());
    }

    const idsInputs = [
        'trabajo', 'gasolina', 'pass', 'deudaUber', 'ahorro',
        'yo', 'carro', 'comidaCalle', 'mercado', 'gastoFijo',
        'efectivo', 'nequi', 'pendiente', 'valorFijo'
    ];

    idsInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) aplicarFormatoMiles(el);
    });

    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarDia);
    }

    calcularTotales();
    cargarGastosFijos();
    cargarHistorial();
});