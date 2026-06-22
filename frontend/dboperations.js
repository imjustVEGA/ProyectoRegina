

async function cargarEmpleados() {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" class="celda-carga">Cargando datos...</td></tr>`;

    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        const response = await fetch('http://localhost:3000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'Login.html';
            return;
        }
        if (!response.ok) throw new Error('Error al conectar con el servidor');

        const datos = await response.json();

        // -- 1. Llenar tabla --
        tbody.innerHTML = '';
        if (!datos || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;padding:30px;color:#718096;">No se encontraron empleados.</td></tr>`;
        } else {
            datos.forEach(emp => {
                const tr = document.createElement('tr');
                const nombre  = emp.nombreEmpleado || 'N/D';
                const deptNom = emp.departamento || 'N/D';

                tr.innerHTML = `
                    <td><span class="badge badge-id"># ${emp.idempleado}</span></td>
                    <td style="font-weight:500;color:#2d3748;">${nombre}</td>
                    <td>${deptNom}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // -- 2. Actualizar tarjetas de estadísticas --
        actualizarEstadisticasEmpleados(datos);

        // -- 3. Poblar filtro de departamentos --
        const deptSelect = document.getElementById('seleccionDepto');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">Todos los departamentos</option>';
            const depts = new Set();
            datos.forEach(e => { if (e.departamento) depts.add(e.departamento); });
            depts.forEach(d => {
                const o = document.createElement('option');
                o.value = d.toLowerCase();
                o.textContent = d;
                deptSelect.appendChild(o);
            });
        }

        // -- 4. Filtro de rangos eliminado --

    } catch (error) {
        console.error('Error al cargar empleados:', error);
        tbody.innerHTML = `
            <tr><td colspan="3" style="text-align:center;padding:30px;color:#e53e3e;">
                Ocurrió un error al cargar los datos.<br>
                <small>${error.message}</small>
            </td></tr>`;
    }
}

function actualizarEstadisticasEmpleados(datos) {
    // Total empleados
    const elTotal = document.getElementById('estadisticaTotalEmpleados');
    if (elTotal) elTotal.textContent = datos.length;

    // Departamentos únicos
    const depts = new Set();
    datos.forEach(e => { if (e.departamento) depts.add(e.departamento); });
    const elDeptos = document.getElementById('estadisticaTotalDeptos');
    if (elDeptos) elDeptos.textContent = depts.size;

    // Rangos distintos (gerenciales / supervisores)
    const rangos = new Set();
    datos.forEach(e => { if (e.rango) rangos.add(e.rango); });
    const elSuper = document.getElementById('estadisticaTotalSupervisores');
    if (elSuper) elSuper.textContent = rangos.size;

    // Nuevos en los últimos 30 días (usando fechaCreacion si existe)
    const ahora  = new Date();
    const hace30 = new Date(ahora);
    hace30.setDate(ahora.getDate() - 30);
    const nuevos = datos.filter(e => {
        if (!e.fechaCreacion) return false;
        const f = new Date(e.fechaCreacion);
        return f >= hace30 && f <= ahora;
    }).length;
    const elNuevos = document.getElementById('estadisticaNuevosMes');
    if (elNuevos) elNuevos.textContent = nuevos;
}

function filtrarEmpleados() {
    const campoBuscar  = document.getElementById('campoBuscar');
    const deptSelect   = document.getElementById('seleccionDepto');
    const rangoSelect  = document.getElementById('seleccionRango');

    const textoBuscar  = campoBuscar  ? campoBuscar.value.toLowerCase()  : '';
    const deptFiltro   = deptSelect   ? deptSelect.value                 : '';
    const rangoFiltro  = rangoSelect  ? rangoSelect.value                : '';

    const table = document.getElementById('tablaEmpleados');
    if (!table) return;
    const filas = table.getElementsByTagName('tr');

    for (let i = 1; i < filas.length; i++) {
        if (filas[i].cells.length <= 1) continue;

        const tdNombre = filas[i].cells[1];
        const tdDepto  = filas[i].cells[2];

        const nombre = tdNombre ? (tdNombre.textContent || '').toLowerCase() : '';
        const depto  = tdDepto  ? (tdDepto.textContent  || '').toLowerCase() : '';

        const coincideTexto = nombre.includes(textoBuscar);
        const coincideDepto = deptFiltro  === '' || depto.includes(deptFiltro);

        filas[i].style.display = (coincideTexto && coincideDepto) ? '' : 'none';
    }
}

/* -------------------------------------------------------
   ASISTENCIAS
   ------------------------------------------------------- */

async function cargarAsistencias() {
    // El tbody tiene id="cuerpoTablaAsistencias" en Asistencias.html
    const tbody = document.getElementById('cuerpoTablaAsistencias');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#718096;">Cargando datos...</td></tr>`;

    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        const response = await fetch('http://localhost:3000/asistencias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'Login.html';
            return;
        }
        if (!response.ok) throw new Error('Error al conectar con el servidor');

        const datos = await response.json();

        if (!datos || datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#718096;">No se encontraron asistencias.</td></tr>`;
            actualizarEstadisticasAsistencias([]);
            return;
        }

        tbody.innerHTML = '';
        datos.forEach(asis => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge badge-id"># ${asis.idEmpleado || 'N/D'}</span></td>
                <td style="font-weight:500;color:#2d3748;">${asis.nomEmpleado || 'N/D'}</td>
                <td>${asis.puesto    || 'N/D'}</td>
                <td>${asis.fecha     || 'N/D'}</td>
                <td>${asis.hora      || 'N/D'}</td>
                <td><span class="badge badge-role">${asis.verificacion || 'N/D'}</span></td>
                <td><span class="badge badge-role">${asis.estado       || 'N/D'}</span></td>
                <td>${asis.dispotivo || 'N/D'}</td>
            `;
            tbody.appendChild(tr);
        });

        // -- Actualizar tarjetas de estadísticas --
        actualizarEstadisticasAsistencias(datos);

        // -- Poblar filtro de área/puesto --
        const areaSelect = document.getElementById('filtroDepartamentoAsistencia');
        if (areaSelect) {
            areaSelect.innerHTML = '<option value="">Todas las áreas / puestos</option>';
            const areas = new Set();
            datos.forEach(a => { if (a.puesto) areas.add(a.puesto); });
            areas.forEach(a => {
                const o = document.createElement('option');
                o.value = a.toLowerCase();
                o.textContent = a;
                areaSelect.appendChild(o);
            });
        }

    } catch (error) {
        console.error('Error al cargar asistencias:', error);
        tbody.innerHTML = `
            <tr><td colspan="8" style="text-align:center;padding:30px;color:#e53e3e;">
                Ocurrió un error al cargar los datos.<br>
                <small>${error.message}</small>
            </td></tr>`;
    }
}

function actualizarEstadisticasAsistencias(datos) {
    // Total registros
    const elTotal = document.getElementById('estadisticaTotal');
    if (elTotal) elTotal.textContent = datos.length;

    // Asistencias (estado = 'Presente' o similar)
    const asistencias = datos.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'presente' || e === 'asistencia' || e === 'a tiempo';
    }).length;
    const elAsist = document.getElementById('estadisticaAsistencias');
    if (elAsist) elAsist.textContent = asistencias;

    // Ausencias
    const ausencias = datos.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'ausente' || e === 'ausencia' || e === 'falta';
    }).length;
    const elAus = document.getElementById('estadisticaAusencias');
    if (elAus) elAus.textContent = ausencias;

    // Tardanzas
    const tardanzas = datos.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'tardanza' || e === 'tarde' || e === 'retraso';
    }).length;
    const elTard = document.getElementById('estadisticaTardanzas');
    if (elTard) elTard.textContent = tardanzas;
}

function filtrarAsistencias() {
    const inputBusqueda = document.getElementById('busquedaAsistencia');
    const fechaInicioEl = document.getElementById('fechaInicio');
    const fechaFinEl    = document.getElementById('fechaFin');
    const areaSelect    = document.getElementById('filtroDepartamentoAsistencia');

    const textoBuscar = inputBusqueda ? inputBusqueda.value.toLowerCase() : '';
    const fechaInicio = fechaInicioEl ? fechaInicioEl.value : '';
    const fechaFin    = fechaFinEl    ? fechaFinEl.value    : '';
    const areaFiltro  = areaSelect    ? areaSelect.value    : '';

    const table = document.getElementById('tablaAsistencias');
    if (!table) return;
    const filas = table.getElementsByTagName('tr');

    for (let i = 1; i < filas.length; i++) {
        if (filas[i].cells.length <= 1) continue;

        const tdID     = filas[i].cells[0];
        const tdNombre = filas[i].cells[1];
        const tdArea   = filas[i].cells[2];
        const tdFecha  = filas[i].cells[3];

        const id     = tdID     ? (tdID.textContent     || '').toLowerCase() : '';
        const nombre = tdNombre ? (tdNombre.textContent || '').toLowerCase() : '';
        const area   = tdArea   ? (tdArea.textContent   || '').toLowerCase() : '';
        const fecha  = tdFecha  ? (tdFecha.textContent  || '').split('T')[0].trim() : '';

        const coincideTexto = nombre.includes(textoBuscar) || id.includes(textoBuscar);
        const coincideArea  = areaFiltro === '' || area.toLowerCase() === areaFiltro;
        let   coincideFecha = true;
        if (fechaInicio && fecha < fechaInicio) coincideFecha = false;
        if (fechaFin    && fecha > fechaFin)    coincideFecha = false;

        filas[i].style.display = (coincideTexto && coincideArea && coincideFecha) ? '' : 'none';
    }
}

/* -------------------------------------------------------
   REPORTE CSV
   ------------------------------------------------------- */

function generarReporteAsistencias() {
    const table = document.getElementById('tablaAsistencias');
    if (!table) return;
    const filas = table.getElementsByTagName('tr');

    let csv = "data:text/csv;charset=utf-8,\uFEFF";
    csv += "ID Empleado,Nombre Completo,Puesto,Fecha,Hora,Verificacion,Estado,Dispositivo\n";

    for (let i = 1; i < filas.length; i++) {
        if (filas[i].style.display === 'none' || filas[i].cells.length <= 1) continue;
        const cols = [];
        for (let j = 0; j < filas[i].cells.length; j++) {
            let txt = (filas[i].cells[j].innerText || filas[i].cells[j].textContent || '')
                .replace(/[\r\n,]/gm, ' ').trim();
            if (j === 0 && txt.startsWith('# ')) txt = txt.substring(2);
            cols.push(`"${txt}"`);
        }
        csv += cols.join(',') + '\n';
    }

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'reporte_asistencias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* -------------------------------------------------------
   DASHBOARD
   ------------------------------------------------------- */

async function cargarDashboard() {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        // Fetch usuarios
        const reqUsers = fetch('http://localhost:3000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch asistencias
        const reqAsist = fetch('http://localhost:3000/asistencias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const [resUsers, resAsist] = await Promise.all([reqUsers, reqAsist]);

        if (resUsers.status === 401 || resAsist.status === 401) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'Login.html';
            return;
        }

        const usuarios = await resUsers.json();
        const asistencias = await resAsist.json();

        // Calcular metricas
        const totalEmpleados = usuarios.length;
        if(document.getElementById('empleadosActivosNum')) document.getElementById('empleadosActivosNum').textContent = totalEmpleados;
        if(document.getElementById('empleadosActivosNum2')) document.getElementById('empleadosActivosNum2').textContent = totalEmpleados;

        // Fecha de hoy para filtrar
        const hoy = new Date().toISOString().split('T')[0];
        
        // Asistencias de hoy
        const asistenciasHoy = asistencias.filter(a => a.fecha && a.fecha.startsWith(hoy));
        
        const numAsistenciasHoy = asistenciasHoy.filter(a => {
            const est = (a.estado || '').toLowerCase();
            return est === 'presente' || est === 'asistencia' || est === 'a tiempo' || est === 'tardanza' || est === 'tarde';
        }).length;
        
        const numAusenciasHoy = asistenciasHoy.filter(a => {
            const est = (a.estado || '').toLowerCase();
            return est === 'ausente' || est === 'ausencia' || est === 'falta';
        }).length;

        const porcentajeAsistencia = totalEmpleados > 0 ? Math.round((numAsistenciasHoy / totalEmpleados) * 100) : 0;
        const porcentajeAusencia = totalEmpleados > 0 ? Math.round((numAusenciasHoy / totalEmpleados) * 100) : 0;
        
        const aTiempo = asistenciasHoy.filter(a => {
            const est = (a.estado || '').toLowerCase();
            return est === 'presente' || est === 'asistencia' || est === 'a tiempo';
        }).length;
        const porcentajePuntualidad = numAsistenciasHoy > 0 ? Math.round((aTiempo / numAsistenciasHoy) * 100) : 100;

        if(document.getElementById('asistenciasHoyNum')) document.getElementById('asistenciasHoyNum').textContent = numAsistenciasHoy;
        if(document.getElementById('porcentajeAsistencia')) document.getElementById('porcentajeAsistencia').textContent = porcentajeAsistencia;
        if(document.getElementById('barraAsistencia')) document.getElementById('barraAsistencia').style.width = porcentajeAsistencia + '%';

        if(document.getElementById('ausenciasHoyNum')) document.getElementById('ausenciasHoyNum').textContent = numAusenciasHoy;
        if(document.getElementById('porcentajeAusencia')) document.getElementById('porcentajeAusencia').textContent = porcentajeAusencia;
        if(document.getElementById('barraAusencia')) document.getElementById('barraAusencia').style.width = porcentajeAusencia + '%';

        if(document.getElementById('porcentajePuntualidad')) document.getElementById('porcentajePuntualidad').textContent = porcentajePuntualidad;
        if(document.getElementById('barraPuntualidad')) document.getElementById('barraPuntualidad').style.width = porcentajePuntualidad + '%';

        // Llenar lista recientes
        const listaRecientes = document.getElementById('listaAsistenciasRecientes');
        if (listaRecientes) {
            listaRecientes.innerHTML = '';
            const recientes = asistenciasHoy.slice(-5).reverse(); // Tomar ultimos 5
            
            if (recientes.length === 0) {
                listaRecientes.innerHTML = '<div style="text-align:center; padding: 20px; color: #6b7280;">No hay registros recientes hoy.</div>';
            } else {
                recientes.forEach(a => {
                    const estClass = (a.estado || '').toLowerCase().includes('ausente') ? 'ausente' : 
                                   (a.estado || '').toLowerCase().includes('tarde') || (a.estado || '').toLowerCase().includes('tardanza') ? 'tarde' : 'presente';
                    
                    const html = `
                    <div class="item-reciente">
                        <div class="perfil-reciente">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(a.nomEmpleado || 'U')}&background=random" alt="User">
                            <div class="info-perfil">
                                <h4>${a.nomEmpleado || 'Desconocido'}</h4>
                                <p>${a.puesto || 'Sin puesto'}</p>
                            </div>
                        </div>
                        <div class="datos-reciente">
                            <p>${a.hora || '--:--'}</p>
                            <span class="estado-badge ${estClass}">${a.estado || 'N/D'}</span>
                        </div>
                    </div>`;
                    listaRecientes.insertAdjacentHTML('beforeend', html);
                });
            }
        }

        // Grafico de dona (por área)
        const areasCount = {};
        let totalAsistenciasArea = 0;
        
        asistenciasHoy.forEach(a => {
            if (a.puesto) {
                areasCount[a.puesto] = (areasCount[a.puesto] || 0) + 1;
                totalAsistenciasArea++;
            }
        });

        const ctx = document.getElementById('graficoAsistencias');
        if (ctx && Object.keys(areasCount).length > 0) {
            const labels = Object.keys(areasCount);
            const data = Object.values(areasCount);
            const colors = ['#0b5c6b', '#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6'];
            
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 0,
                        cutout: '75%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true }
                    }
                }
            });

            // Generar leyenda
            const leyenda = document.getElementById('leyendaGrafico');
            if (leyenda) {
                leyenda.innerHTML = '';
                labels.forEach((label, idx) => {
                    const perc = Math.round((data[idx] / totalAsistenciasArea) * 100);
                    leyenda.innerHTML += `
                    <div class="item-leyenda">
                        <div><span class="punto" style="background-color: ${colors[idx]}"></span> ${label}</div>
                        <strong>${perc}%</strong>
                    </div>`;
                });
            }

            if(document.getElementById('promedioGeneralAsistencia')) document.getElementById('promedioGeneralAsistencia').textContent = porcentajeAsistencia + '%';
        } else if (ctx) {
             const leyenda = document.getElementById('leyendaGrafico');
             if(leyenda) leyenda.innerHTML = '<div style="font-size:0.8rem;color:#6b7280;text-align:center;">No hay datos para graficar hoy</div>';
        }

    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}
