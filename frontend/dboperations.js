

async function cargarEmpleados() {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="celda-carga">Cargando datos...</td></tr>`;

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
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#718096;">No se encontraron empleados.</td></tr>`;
        } else {
            datos.forEach(emp => {
                const tr = document.createElement('tr');
                const nombre  = emp.nombreEmpleado || 'N/D';
                const deptId  = emp.DepartID  !== null && emp.DepartID  !== undefined ? emp.DepartID  : 'N/D';
                const deptNom = emp.departamento || 'N/D';
                const rango   = emp.rango     !== null && emp.rango     !== undefined ? emp.rango     : 'N/D';

                tr.innerHTML = `
                    <td><span class="badge badge-id"># ${emp.idempleado}</span></td>
                    <td style="font-weight:500;color:#2d3748;">${nombre}</td>
                    <td>${deptId}</td>
                    <td>${deptNom}</td>
                    <td><span class="badge badge-role">${rango}</span></td>
                    <td></td>
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
        console.error('Error al cargar empleados:', error);
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:30px;color:#e53e3e;">
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
        const tdDepto  = filas[i].cells[3];
        const tdRango  = filas[i].cells[4];

        const nombre = tdNombre ? (tdNombre.textContent || '').toLowerCase() : '';
        const depto  = tdDepto  ? (tdDepto.textContent  || '').toLowerCase() : '';
        const rango  = tdRango  ? (tdRango.textContent  || '').toLowerCase() : '';

        const coincideTexto = nombre.includes(textoBuscar);
        const coincideDepto = deptFiltro  === '' || depto.includes(deptFiltro);
        const coincideRango = rangoFiltro === '' || rango.includes(rangoFiltro);

        filas[i].style.display = (coincideTexto && coincideDepto && coincideRango) ? '' : 'none';
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
