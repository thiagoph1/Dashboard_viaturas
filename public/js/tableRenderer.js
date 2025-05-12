function renderAvailabilityTable(tableBodyId, sortedUnits, availability) {
    console.log('Renderizando tabela de disponibilidade...');
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error('Elemento da tabela não encontrado:', tableBodyId);
        return;
    }

    tableBody.innerHTML = '';
    availability.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.unit}</td>
            <td>${item.available}</td>
            <td>${item.unavailable}</td>
            <td>${item.total}</td>
        `;
        tableBody.appendChild(row);
    });
}

function sortAvailabilityTable(tableBodyId, column, currentSort) {
    console.log('Ordenando tabela por:', column);
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        console.error('Elemento da tabela não encontrado:', tableBodyId);
        return currentSort;
    }

    const rows = Array.from(tableBody.getElementsByTagName('tr'));
    const isAscending = currentSort.column === column && currentSort.direction === 'desc' ? 'asc' : 'desc';

    rows.sort((a, b) => {
        let aValue, bValue;
        switch (column) {
            case 'unit':
                aValue = a.cells[0].textContent;
                bValue = b.cells[0].textContent;
                return isAscending === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            case 'available':
                aValue = parseInt(a.cells[1].textContent);
                bValue = parseInt(b.cells[1].textContent);
                return isAscending === 'asc' ? aValue - bValue : bValue - aValue;
            case 'unavailable':
                aValue = parseInt(a.cells[2].textContent);
                bValue = parseInt(b.cells[2].textContent);
                return isAscending === 'asc' ? aValue - bValue : bValue - aValue;
            case 'total':
                aValue = parseInt(a.cells[3].textContent);
                bValue = parseInt(a.cells[3].textContent);
                return isAscending === 'asc' ? aValue - bValue : bValue - aValue;
            default:
                return 0;
        }
    });

    tableBody.innerHTML = '';
    rows.forEach(row => tableBody.appendChild(row));

    return { column, direction: isAscending };
}