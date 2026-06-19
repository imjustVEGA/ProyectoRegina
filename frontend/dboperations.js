/* =======================================================
   dboperations.js  –  Club Regina
   ======================================================= */

/* -------------------------------------------------------
   EMPLEADOS
   ------------------------------------------------------- */

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

        actualizarEstadisticasEmpleados(datos);

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

        // -- 4. Poblar filtro de rangos --
        const rangoSelect = document.getElementById('seleccionRango');
        if (rangoSelect) {
            rangoSelect.innerHTML = '<option value="">Todos los rangos</option>';
            const rangos = new Set();
            datos.forEach(e => { if (e.rango) rangos.add(e.rango); });
            rangos.forEach(r => {
                const o = document.createElement('option');
                //o.value = r.toLowerCase();
                o.textContent = r;
                rangoSelect.appendChild(o);
            });
        }

    } catch (error) {
        tbody.innerHTML = `
            <tr><td colspan="3" style="text-align:center;padding:30px;color:#e53e3e;">
                Ocurrió un error al cargar los datos.<br>
                <small>${error.message}</small>
            </td></tr>`;
    }
}

function actualizarEstadisticasEmpleados(datos) {
    const elTotal = document.getElementById('estadisticaTotalEmpleados');
    if (elTotal) elTotal.textContent = datos.length;

    const depts = new Set();
    datos.forEach(e => { if (e.departamento) depts.add(e.departamento); });
    const elDeptos = document.getElementById('estadisticaTotalDeptos');
    if (elDeptos) elDeptos.textContent = depts.size;

    const rangos = new Set();
    datos.forEach(e => { if (e.rango) rangos.add(e.rango); });
    const elSuper = document.getElementById('estadisticaTotalSupervisores');
    if (elSuper) elSuper.textContent = rangos.size;

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

async function cargarAsistencias() {
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

        actualizarEstadisticasAsistencias(datos);

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
        tbody.innerHTML = `
            <tr><td colspan="8" style="text-align:center;padding:30px;color:#e53e3e;">
                Ocurrió un error al cargar los datos.<br>
                <small>${error.message}</small>
            </td></tr>`;
    }
}

function actualizarEstadisticasAsistencias(datos) {
    const elTotal = document.getElementById('estadisticaTotal');
    if (elTotal) elTotal.textContent = datos.length;

    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaHoy = `${año}-${mes}-${dia}`;

    const registrosDeHoy = datos.filter(d => {
        if (!d.fecha) return false;
        const fechaRegistro = d.fecha.split('T')[0].trim(); 
        return fechaRegistro === fechaHoy;
    });

    const asistenciasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'presente' || e === 'asistencia' || e === 'a tiempo';
    }).length;
    
    const elAsist = document.getElementById('estadisticaAsistencias');
    if (elAsist) elAsist.textContent = asistenciasHoy;

    const ausenciasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'ausente' || e === 'ausencia' || e === 'falta';
    }).length;
    
    const elAus = document.getElementById('estadisticaAusencias');
    if (elAus) elAus.textContent = ausenciasHoy;

    const tardanzasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'tardanza' || e === 'tarde' || e === 'retraso';
    }).length;
    const elTard = document.getElementById('estadisticaTardanzas');
    if (elTard) elTard.textContent = tardanzasHoy;
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

