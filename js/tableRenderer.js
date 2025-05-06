export function renderAvailabilityTable(sortedData, currentSort) {
    console.log('Renderizando tabela com dados:', sortedData);
    const tbody = document.getElementById('availabilityTableBody');
    tbody.innerHTML = '';

    if (!sortedData || sortedData.length === 0) {
        console.log('Nenhum dado para renderizar na tabela.');
        document.getElementById('analysisError').textContent = 'Sem dados válidos para exibir na tabela. Verifique as colunas "Unidade" e "Status Patrimonio".';
        return;
    }

    let sorted = [...sortedData];
    if (currentSort.column === 'unit') {
        sorted.sort((a, b) => {
            const comparison = a.unit.localeCompare(b.unit);
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
    } else if (currentSort.column === 'available' || currentSort.column === 'unavailable') {
        sorted.sort((a, b) => {
            const valueA = a[currentSort.column];
            const valueB = b[currentSort.column];
            let comparison = valueA - valueB;
            if (comparison === 0) {
                comparison = a.unit.localeCompare(b.unit);
            }
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
    } else {
        sorted.sort((a, b) => {
            let comparison = b.total - a.total;
            if (comparison === 0) {
                comparison = a.unit.localeCompare(b.unit);
            }
            return comparison;
        });
    }

    sorted.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.unit}</td>
            <td>${item.available}</td>
            <td>${item.unavailable}</td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('analysisError').textContent = '';

    // Atualizar indicadores de ordenação
    document.getElementById('sortIndicatorUnit').textContent = (currentSort.column === 'unit' ? (currentSort.direction === 'asc' ? '↑' : '↓') : '');
    document.getElementById('sortIndicatorAvailable').textContent = (currentSort.column === 'available' ? (currentSort.direction === 'asc' ? '↑' : '↓') : '');
    document.getElementById('sortIndicatorUnavailable').textContent = (currentSort.column === 'unavailable' ? (currentSort.direction === 'asc' ? '↑' : '↓') : '');
}

export function sortAvailabilityTable(sortedUnits, currentSort) {
    renderAvailabilityTable(sortedUnits, currentSort);
}