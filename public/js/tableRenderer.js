export function renderAvailabilityTable(tableBodyId, sortedUnits, availability) {
       console.log('Renderizando tabela de disponibilidade...');
       console.log('sortedUnits:', sortedUnits);
       console.log('availability:', availability);

       const tbody = document.getElementById(tableBodyId);
       if (!tbody) {
           console.error('Elemento tbody não encontrado:', tableBodyId);
           throw new Error(`Elemento ${tableBodyId} não encontrado`);
       }

       tbody.innerHTML = '';

       sortedUnits.forEach(unit => {
           const unitAvailability = availability.find(a => a.unit === unit) || {
               unit,
               available: 0,
               unavailable: 0,
               total: 0
           };
           const row = document.createElement('tr');
           row.innerHTML = `
               <td>${unit}</td>
               <td>${unitAvailability.available}</td>
               <td>${unitAvailability.unavailable}</td>
           `;
           tbody.appendChild(row);
       });

       console.log('Tabela renderizada com sucesso');
   }

   export function sortAvailabilityTable(tableBodyId, column, currentSort) {
       console.log(`Ordenando por ${column}...`);
       const tbody = document.getElementById(tableBodyId);
       if (!tbody) {
           console.error('Elemento tbody não encontrado:', tableBodyId);
           throw new Error(`Elemento ${tableBodyId} não encontrado`);
       }

       const rows = Array.from(tbody.querySelectorAll('tr'));
       const direction = currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc';

       rows.sort((a, b) => {
           const aText = a.cells[column === 'unit' ? 0 : column === 'available' ? 1 : 2].textContent;
           const bText = b.cells[column === 'unit' ? 0 : column === 'available' ? 1 : 2].textContent;
           if (column === 'unit') {
               return direction === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
           }
           const aValue = parseInt(aText) || 0;
           const bValue = parseInt(bText) || 0;
           return direction === 'asc' ? aValue - bValue : bValue - aValue;
       });

       tbody.innerHTML = '';
       rows.forEach(row => tbody.appendChild(row));

       document.querySelectorAll('.sort-indicator').forEach(indicator => {
           indicator.textContent = '';
       });
       const indicator = document.getElementById(`sortIndicator${column.charAt(0).toUpperCase() + column.slice(1)}`);
       if (indicator) {
           indicator.textContent = direction === 'asc' ? '↑' : '↓';
       }

       console.log('Tabela ordenada com sucesso');
       return { column, direction };
   }