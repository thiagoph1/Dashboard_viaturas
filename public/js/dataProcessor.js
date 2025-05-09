export function processUnitData(data) {
       const unitCount = {};
       let totalRecords = 0;
       let hasUnitColumn = false;

       data.forEach(row => {
           const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
           if (unitKey && row[unitKey] !== undefined && row[unitKey] !== null) {
               hasUnitColumn = true;
               const unit = String(row[unitKey]).trim();
               if (unit) {
                   unitCount[unit] = (unitCount[unit] || 0) + 1;
                   totalRecords++;
               }
           }
       });

       const sortedUnits = Object.keys(unitCount).sort();

       return { unitCount, totalRecords: Number(totalRecords), hasUnitColumn, sortedUnits };
   }

   export function processStatusData(data) {
       const statusCount = {};
       let totalValidStatus = 0;
       let hasStatusColumn = false;

       data.forEach(row => {
           const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');
           if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null) {
               hasStatusColumn = true;
               const status = String(row[statusKey]).trim();
               if (status) {
                   statusCount[status] = (statusCount[status] || 0) + 1;
                   totalValidStatus++;
               }
           }
       });

       const sortedStatuses = Object.keys(statusCount).sort();

       return { statusCount, hasStatusColumn, totalValidStatus, sortedStatuses };
   }

   export function processAvailabilityData(data) {
       const unitCount = {};
       const availability = [];
       let hasUnitColumn = false;
       let hasStatusColumn = false;
       let errorMessage = '';

       data.forEach(row => {
           const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
           const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');

           if (unitKey && row[unitKey] !== undefined && row[unitKey] !== null) {
               hasUnitColumn = true;
               const unit = String(row[unitKey]).trim();
               if (unit) {
                   unitCount[unit] = (unitCount[unit] || 0) + 1;
               }
           }

           if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null) {
               hasStatusColumn = true;
           }
       });

       if (!hasUnitColumn) {
           errorMessage = 'Coluna "Unidade" não encontrada ou sem dados válidos.';
       }
       if (!hasStatusColumn) {
           errorMessage = errorMessage ? errorMessage + ' Coluna "Status Patrimonio" não encontrada ou sem dados válidos.' : 'Coluna "Status Patrimonio" não encontrada ou sem dados válidos.';
       }

       const sortedUnits = Object.keys(unitCount).sort();

       data.forEach(row => {
           const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
           const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');
           const unit = unitKey && row[unitKey] ? String(row[unitKey]).trim() : '';
           const status = statusKey && row[statusKey] ? String(row[statusKey]).trim().toLowerCase() : '';

           if (unit && status) {
               let unitAvailability = availability.find(a => a.unit === unit);
               if (!unitAvailability) {
                   unitAvailability = { unit, available: 0, unavailable: 0, total: 0 };
                   availability.push(unitAvailability);
               }

               if (['em uso', 'ativo'].includes(status)) {
                   unitAvailability.available += 1;
               } else if (['inativo', 'baixado'].includes(status)) {
                   unitAvailability.unavailable += 1;
               }
               unitAvailability.total += 1;
           }
       });

       return { hasUnitColumn, hasStatusColumn, sortedUnits, availability, errorMessage };
   }