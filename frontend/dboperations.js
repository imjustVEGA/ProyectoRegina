/* =======================================================
   dboperations.js  –  Club Regina
   ======================================================= */

/* -------------------------------------------------------
   EMPLEADOS
   ------------------------------------------------------- */

/**
 * ============================================================================
 * SISTEMA DE CONTROL DE ASISTENCIAS - CLUB REGINA
 * Módulo de Operaciones Frontend y Conexión con la API (dboperations.js)
 * ============================================================================
 */

/* ============================================================================
   1. GESTIÓN DE EMPLEADOS
   ============================================================================ */

/**
 * Carga la lista de empleados desde el backend y actualiza la tabla en el frontend.
 * 
 * Funcionalidad:
 * 1. Muestra un estado visual de carga en el cuerpo de la tabla (`#cuerpoTabla`).
 * 2. Obtiene el token JWT de autenticación desde `localStorage`. Si no existe, redirige a `Login.html`.
 * 3. Realiza una petición GET a `http://localhost:3000/users` con cabecera `Authorization: Bearer <token>`.
 * 4. Si el token expiró o es inválido (HTTP 401), elimina el token y redirige a `Login.html`.
 * 5. Genera dinámicamente las filas de la tabla con ID, Nombre y Departamento del empleado.
 * 6. Invoca a `actualizarEstadisticasEmpleados(datos)` para actualizar los contadores de las tarjetas.
 * 7. Extrae los departamentos únicos y puebla el filtro desplegable `<select id="seleccionDepto">`.
 * 
 * @async
 * @function cargarEmpleados
 * @returns {Promise<void>}
 */
async function cargarEmpleados() {
    const tbody = document.getElementById('cuerpoTabla');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="3" class="celda-carga">Cargando datos...</td></tr>`;

    try {
        // 1. Validar existencia del token de sesión
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        // 2. Consultar endpoint protegido de empleados
        const response = await fetch('http://localhost:3000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. Manejar sesión expirada o no autorizada
        if (response.status === 401) {
            localStorage.removeItem('jwtToken');
            window.location.href = 'Login.html';
            return;
        }
        if (!response.ok) throw new Error('Error al conectar con el servidor');

        const datos = await response.json();

        // 4. Renderizar las filas de la tabla
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

        // 5. Actualizar tarjetas de estadísticas
        actualizarEstadisticasEmpleados(datos);

        // 6. Poblar filtro desplegable de departamentos
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

        // 7. Poblar filtro desplegable de rangos (si existe)
        const rangoSelect = document.getElementById('seleccionRango');
        if (rangoSelect) {
            rangoSelect.innerHTML = '<option value="">Todos los rangos</option>';
            const rangos = new Set();
            datos.forEach(e => { if (e.rango) rangos.add(e.rango); });
            rangos.forEach(r => {
                const o = document.createElement('option');
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

/**
 * Calcula y actualiza las métricas numéricas de las tarjetas de empleados.
 * 
 * Métricas calculadas:
 * - Total de empleados: Cantidad de registros devueltos.
 * - Departamentos únicos: Conteo sin duplicados usando `Set`.
 * - Personal de rango/supervisión: Conteo de tipos de privilegios registrados.
 * - Nuevos empleados en los últimos 30 días: Basado en la propiedad `fechaCreacion`.
 * 
 * @function actualizarEstadisticasEmpleados
 * @param {Array<Object>} datos - Lista de empleados obtenida de la API.
 */
function actualizarEstadisticasEmpleados(datos) {
    // Total general de empleados
    const elTotal = document.getElementById('estadisticaTotalEmpleados');
    if (elTotal) elTotal.textContent = datos.length;

    // Departamentos únicos en la base de datos
    const depts = new Set();
    datos.forEach(e => { if (e.departamento) depts.add(e.departamento); });
    const elDeptos = document.getElementById('estadisticaTotalDeptos');
    if (elDeptos) elDeptos.textContent = depts.size;

    // Rangos distintos / roles con personal a cargo
    const rangos = new Set();
    datos.forEach(e => { if (e.rango) rangos.add(e.rango); });
    const elSuper = document.getElementById('estadisticaTotalSupervisores');
    if (elSuper) elSuper.textContent = rangos.size;

    // Empleados registrados en los últimos 30 días
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

/**
 * Filtra en tiempo real las filas visibles de la tabla de empleados.
 * 
 * Evalúa:
 * 1. Texto de búsqueda (`#campoBuscar`): Coincidencia con el nombre del empleado.
 * 2. Departamento seleccionado (`#seleccionDepto`): Coincidencia con la columna de departamento.
 * 
 * @function filtrarEmpleados
 */
function filtrarEmpleados() {
    const campoBuscar  = document.getElementById('campoBuscar');
    const deptSelect   = document.getElementById('seleccionDepto');

    const textoBuscar  = campoBuscar  ? campoBuscar.value.toLowerCase()  : '';
    const deptFiltro   = deptSelect   ? deptSelect.value                 : '';

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

/* ============================================================================
   2. CONTROL DE ASISTENCIAS
   ============================================================================ */

/**
 * Carga el historial de checadas y asistencias desde el backend hacia la tabla.
 * 
 * Funcionalidad:
 * 1. Muestra un estado visual de carga en `#cuerpoTablaAsistencias`.
 * 2. Valida la sesión activa del usuario mediante el token JWT en `localStorage`.
 * 3. Realiza la petición GET a `http://localhost:3000/asistencias`.
 * 4. Si el token expiró (401), limpia la sesión y redirige a `Login.html`.
 * 5. Mapea cada registro en filas con columnas de: ID Empleado, Nombre, Puesto, Fecha, Hora, Tipo de Verificación, Estado y Dispositivo.
 * 6. Invoca a `actualizarEstadisticasAsistencias(datos)` para refrescar los contadores de la vista.
 * 7. Llena las opciones del filtro de área/puesto (`#filtroDepartamentoAsistencia`).
 * 
 * @async
 * @function cargarAsistencias
 * @returns {Promise<void>}
 */
async function cargarAsistencias() {
    const tbody = document.getElementById('cuerpoTablaAsistencias');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#718096;">Cargando datos...</td></tr>`;

    try {
        // 1. Validar autenticación
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        // 2. Consultar endpoint de asistencias
        const response = await fetch('http://localhost:3000/asistencias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 3. Manejar sesión expirada
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

        // 4. Llenar tabla de asistencias con formato visual
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

        // 5. Actualizar tarjetas de estadísticas
        actualizarEstadisticasAsistencias(datos);

        // 6. Poblar filtro de área / puesto
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

/**
 * Calcula y actualiza las tarjetas de resumen estadístico de asistencias.
 * 
 * Funcionalidad:
 * - Total de registros: Cantidad total de eventos en el conjunto actual.
 * - Asistencias: Registros con estado 'presente', 'asistencia', 'a tiempo' o 'entrada'.
 * - Ausencias: Registros con estado 'ausente', 'ausencia' o 'falta'.
 * - Tardanzas: Registros con estado 'tardanza', 'tarde' o 'retraso'.
 * 
 * @function actualizarEstadisticasAsistencias
 * @param {Array<Object>} datos - Lista de asistencias.
 */
function actualizarEstadisticasAsistencias(datos) {
    // Total general de registros
    const elTotal = document.getElementById('estadisticaTotal');
    if (elTotal) elTotal.textContent = datos.length;

    // Filtrar registros de asistencias del día de hoy
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

    // Asistencias / entradas presentes hoy
    const asistenciasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'presente' || e === 'asistencia' || e === 'a tiempo' || e === 'entrada';
    }).length;
    
    const elAsist = document.getElementById('estadisticaAsistencias');
    if (elAsist) elAsist.textContent = asistenciasHoy;

    // Ausencias registradas hoy
    const ausenciasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'ausente' || e === 'ausencia' || e === 'falta';
    }).length;
    
    const elAus = document.getElementById('estadisticaAusencias');
    if (elAus) elAus.textContent = ausenciasHoy;

    // Tardanzas o retardos hoy
    const tardanzasHoy = registrosDeHoy.filter(d => {
        const e = (d.estado || '').toLowerCase();
        return e === 'tardanza' || e === 'tarde' || e === 'retraso';
    }).length;
    const elTard = document.getElementById('estadisticaTardanzas');
    if (elTard) elTard.textContent = tardanzasHoy;
}

/**
 * Filtra dinámicamente las filas de la tabla de asistencias según múltiples criterios combinados.
 * 
 * Criterios de filtrado:
 * 1. Búsqueda por texto (`#busquedaAsistencia`): Nombre o ID del empleado.
 * 2. Filtro por área / puesto (`#filtroDepartamentoAsistencia`).
 * 3. Rango de fechas (`#fechaInicio` a `#fechaFin`).
 * 
 * @function filtrarAsistencias
 */
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

/* ============================================================================
   3. EXPORTACIÓN DE REPORTES CSV
   ============================================================================ */

/**
 * Exporta y descarga un archivo CSV con las filas actualmente visibles y filtradas de la tabla de asistencias.
 * 
 * Funcionalidad:
 * 1. Lee todas las filas visibles (`display !== 'none'`) de `#tablaAsistencias`.
 * 2. Agrega la marca BOM UTF-8 (`\uFEFF`) para abrir correctamente tildes y caracteres especiales en Excel.
 * 3. Genera la cabecera CSV y escapa comas y saltos de línea de cada celda.
 * 4. Crea un elemento `<a>` temporal para disparar la descarga de `reporte_asistencias.csv`.
 * 
 * @function generarReporteAsistencias
 */
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

/* ============================================================================
   4. PANEL PRINCIPAL (DASHBOARD)
   ============================================================================ */

/**
 * Carga y calcula todas las métricas del panel principal (Dashboard en Menu.html).
 * 
 * Funcionalidad:
 * 1. Verifica la validez del token JWT en `localStorage`.
 * 2. Realiza peticiones paralelas a `/users` y `/asistencias` usando `Promise.all`.
 * 3. Procesa y calcula los KPIs del día de hoy:
 *    - Total de empleados activos.
 *    - Número y porcentaje de asistencia de hoy.
 *    - Número y porcentaje de ausencia de hoy.
 *    - Porcentaje de puntualidad de las checadas.
 * 4. Actualiza las barras de progreso visuales asociadas a los porcentajes.
 * 5. Genera la lista interactiva de asistencias recientes (últimos 5 registros con avatar y estado).
 * 6. Genera el gráfico de dona (Doughnut chart) con Chart.js según la distribución por área / puesto y su leyenda.
 * 
 * @async
 * @function cargarDashboard
 * @returns {Promise<void>}
 */
async function cargarDashboard() {
    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) { window.location.href = 'Login.html'; return; }

        // 1. Peticiones simultáneas a la API
        const reqUsers = fetch('http://localhost:3000/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
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

        // 2. Calcular total de empleados activos
        const totalEmpleados = usuarios.length;
        if(document.getElementById('empleadosActivosNum')) document.getElementById('empleadosActivosNum').textContent = totalEmpleados;
        if(document.getElementById('empleadosActivosNum2')) document.getElementById('empleadosActivosNum2').textContent = totalEmpleados;

        // 3. Filtrar asistencias correspondientes al día de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const asistenciasHoy = asistencias.filter(a => a.fecha && a.fecha.startsWith(hoy));
        
        const numAsistenciasHoy = asistenciasHoy.filter(a => {
            const est = (a.estado || '').toLowerCase();
            return est === 'presente' || est === 'asistencia' || est === 'a tiempo' || est === 'tardanza' || est === 'tarde' || est === 'entrada';
        }).length;
        
        // 4. Identificar empleados únicos presentes hoy
        const empleadosPresentes = new Set();
        asistenciasHoy.forEach(a => {
            const est = (a.estado || '').toLowerCase();
            if (est === 'presente' || est === 'asistencia' || est === 'a tiempo' || est === 'tardanza' || est === 'tarde' || est === 'entrada') {
                empleadosPresentes.add(a.idEmpleado || a.nomEmpleado);
            }
        });
        
        // 5. Calcular métricas porcentuales
        const numAusenciasHoy = totalEmpleados - empleadosPresentes.size;
        const porcentajeAsistencia = totalEmpleados > 0 ? Math.round((empleadosPresentes.size / totalEmpleados) * 100) : 0;
        const porcentajeAusencia = totalEmpleados > 0 ? Math.round((numAusenciasHoy / totalEmpleados) * 100) : 0;
        
        const aTiempo = asistenciasHoy.filter(a => {
            const est = (a.estado || '').toLowerCase();
            return est === 'presente' || est === 'asistencia' || est === 'a tiempo' || est === 'entrada';
        }).length;
        const porcentajePuntualidad = numAsistenciasHoy > 0 ? Math.round((aTiempo / numAsistenciasHoy) * 100) : 100;

        // 6. Actualizar contadores y barras de progreso en el DOM
        if(document.getElementById('asistenciasHoyNum')) document.getElementById('asistenciasHoyNum').textContent = numAsistenciasHoy;
        if(document.getElementById('porcentajeAsistencia')) document.getElementById('porcentajeAsistencia').textContent = porcentajeAsistencia;
        if(document.getElementById('barraAsistencia')) document.getElementById('barraAsistencia').style.width = porcentajeAsistencia + '%';

        if(document.getElementById('ausenciasHoyNum')) document.getElementById('ausenciasHoyNum').textContent = numAusenciasHoy;
        if(document.getElementById('porcentajeAusencia')) document.getElementById('porcentajeAusencia').textContent = porcentajeAusencia;
        if(document.getElementById('barraAusencia')) document.getElementById('barraAusencia').style.width = porcentajeAusencia + '%';

        if(document.getElementById('porcentajePuntualidad')) document.getElementById('porcentajePuntualidad').textContent = porcentajePuntualidad;
        if(document.getElementById('barraPuntualidad')) document.getElementById('barraPuntualidad').style.width = porcentajePuntualidad + '%';

        // 7. Llenar lista de registros de asistencias recientes (últimos 5)
        const listaRecientes = document.getElementById('listaAsistenciasRecientes');
        if (listaRecientes) {
            listaRecientes.innerHTML = '';
            const recientes = asistenciasHoy.slice(-5).reverse();
            
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

        // 8. Configurar y renderizar gráfico de dona por área (Chart.js)
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

            // Generar leyenda visual asociada al gráfico
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
