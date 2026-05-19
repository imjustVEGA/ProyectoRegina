async function cargarEmpleados() {
    const tbody = document.querySelector('#tablaEmpleados tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #718096;">Cargando datos...</td></tr>';

    try {
        const response = await fetch('http://localhost:3000/users');
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
    } catch (error) {
        console.error("Error al cargar empleados:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #e53e3e;">Ocurrió un error al cargar los datos.<br><small>${error.message}</small></td></tr>`;
    }
}
