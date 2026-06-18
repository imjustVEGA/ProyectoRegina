async function cargarEmpleados() {
    const tbody = document.querySelector('#tablaEmpleados tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #718096;">Cargando datos...</td></tr>';

    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = 'Login.html';
            return;
        }

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

        if (!datos || datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #718096;">No se encontraron empleados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        datos.forEach(emp => {
            const tr = document.createElement('tr');

            const nombre = emp.nombreEmpleado || 'N/D';
            const depto = emp.DepartID !== null ? emp.DepartID : 'N/D';
            const deptName = emp.departamento || 'N/D';
            const rango = emp.rango !== null ? emp.rango : 'N/D';

            tr.innerHTML = `
                <td><span class="badge badge-id"># ${emp.idempleado}</span></td>
                <td style="font-weight: 500; color: #2d3748;">${nombre}</td>
                <td>${depto}</td>
                <td>${deptName}</td>
                <td><span class="badge badge-role">${rango}</span></td>
            `;
            tbody.appendChild(tr);
        });

        const deptSelect = document.getElementById('filtroDepartamentoEmpleado');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">Todos los departamentos</option>';
            const depts = new Set();
            datos.forEach(emp => {
                if (emp.departamento) depts.add(emp.departamento);
            });
            depts.forEach(d => {
                const option = document.createElement('option');
                option.value = d.toLowerCase();
                option.textContent = d;
                deptSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al cargar empleados:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #e53e3e;">Ocurrió un error al cargar los datos.<br><small>${error.message}</small></td></tr>`;
    }
}

async function cargarAsistencias() {
    const tbody = document.querySelector('#tablaAsistencias tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #718096;">Cargando datos...</td></tr>';

    try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            window.location.href = 'Login.html';
            return;
        }

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
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px; color: #718096;">No se encontraron asistencias.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        datos.forEach(asis => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><span class="badge badge-id"># ${asis.idEmpleado || 'N/D'}</span></td>
                <td style="font-weight: 500; color: #2d3748;">${asis.nomEmpleado || 'N/D'}</td>
                <td>${asis.puesto || 'N/D'}</td>
                <td>${asis.fecha || 'N/D'}</td>
                <td>${asis.hora || 'N/D'}</td>
                <td><span class="badge badge-role">${asis.verificacion || 'N/D'}</span></td>
                <td><span class="badge badge-role">${asis.estado || 'N/D'}</span></td>
                <td>${asis.dispotivo || 'N/D'}</td>
            `;
            tbody.appendChild(tr);
        });

        const areaSelect = document.getElementById('filtroDepartamentoAsistencia');
        if (areaSelect) {
            areaSelect.innerHTML = '<option value="">Todas las áreas / puestos</option>';
            const areas = new Set();
            datos.forEach(asis => {
                if (asis.puesto) areas.add(asis.puesto);
            });
            areas.forEach(a => {
                const option = document.createElement('option');
                option.value = a.toLowerCase();
                option.textContent = a;
                areaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al cargar asistencias:", error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: #e53e3e;">Ocurrió un error al cargar los datos.<br><small>${error.message}</small></td></tr>`;
    }
}

function filtrarEmpleados() {
    const input = document.getElementById('busquedaNombreEmpleado');
    const filter = input.value.toLowerCase();
    const deptoSelect = document.getElementById('filtroDepartamentoEmpleado');
    const deptoFilter = deptoSelect ? deptoSelect.value : "";
    const table = document.getElementById('tablaEmpleados');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        if (tr[i].cells.length === 1) continue;
        
        const tdNombre = tr[i].getElementsByTagName('td')[1]; 
        const tdDepto = tr[i].getElementsByTagName('td')[3]; 
        
        if (tdNombre && tdDepto) {
            const txtValue = tdNombre.textContent || tdNombre.innerText;
            const txtDepto = tdDepto.textContent || tdDepto.innerText;
            
            const coincideNombre = txtValue.toLowerCase().indexOf(filter) > -1;
            const coincideDepto = deptoFilter === "" || txtDepto.toLowerCase() === deptoFilter;
            
            if (coincideNombre && coincideDepto) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function filtrarAsistencias() {
    const inputBusqueda = document.getElementById('busquedaAsistencia').value.toLowerCase();
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const areaSelect = document.getElementById('filtroDepartamentoAsistencia');
    const areaFilter = areaSelect ? areaSelect.value : "";
    
    const table = document.getElementById('tablaAsistencias');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        if (tr[i].cells.length === 1) continue; 

        const tdID = tr[i].getElementsByTagName('td')[0];
        const tdNombre = tr[i].getElementsByTagName('td')[1];
        const tdArea = tr[i].getElementsByTagName('td')[2];
        const tdFecha = tr[i].getElementsByTagName('td')[3];
        
        if (tdNombre && tdFecha && tdID && tdArea) {
            const txtNombre = tdNombre.textContent || tdNombre.innerText;
            const txtID = tdID.textContent || tdID.innerText;
            const txtArea = tdArea.textContent || tdArea.innerText;
            const txtFecha = tdFecha.textContent || tdFecha.innerText; 
            
            let coincideBusqueda = txtNombre.toLowerCase().indexOf(inputBusqueda) > -1 || txtID.toLowerCase().indexOf(inputBusqueda) > -1;
            let coincideArea = areaFilter === "" || txtArea.toLowerCase() === areaFilter;
            
            let coincideFecha = true;
            let strFila = txtFecha;
            if (strFila) {
                strFila = strFila.split('T')[0].trim();
                if (fechaInicio && strFila < fechaInicio) coincideFecha = false;
                if (fechaFin && strFila > fechaFin) coincideFecha = false;
            }
            
            if (coincideBusqueda && coincideFecha && coincideArea) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function generarReporteAsistencias() {
    const table = document.getElementById('tablaAsistencias');
    const tr = table.getElementsByTagName('tr');
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    
    
    csvContent += "ID Empleado,Nombre Completo,Puesto,Fecha,Hora,Verificacion,Estado,Dispositivo\n";
    
    for (let i = 1; i < tr.length; i++) {
        if (tr[i].style.display !== "none" && tr[i].cells.length > 1) {
            let rowContent = [];
            for (let j = 0; j < tr[i].cells.length; j++) {
                let text = tr[i].cells[j].innerText || tr[i].cells[j].textContent;
                text = text.replace(/(\r\n|\n|\r|,)/gm, " ").trim();
                if (j === 0 && text.startsWith("# ")) {
                    text = text.substring(2);
                }
                rowContent.push(`"${text}"`);
            }
            csvContent += rowContent.join(",") + "\n";
        }
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_asistencias.csv");
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
}
