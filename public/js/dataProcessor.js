function processUnitData(data) {
    console.log('Processando dados de unidades...');
    if (!data || !Array.isArray(data)) {
        console.error('Dados inválidos em processUnitData');
        return { totalRecords: 0, unitCount: {}, sortedUnits: [] };
    }

    const unitCount = {};
    data.forEach(row => {
        const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
        const unit = unitKey && row[unitKey] !== undefined ? String(row[unitKey]).trim() : '';
        if (unit) {
            unitCount[unit] = (unitCount[unit] || 0) + 1;
        }
    });

    const sortedUnits = Object.keys(unitCount).sort();
    const totalRecords = data.length;

    return { totalRecords, unitCount, sortedUnits };
}

function processStatusData(data) {
    console.log('Processando dados de status...');
    if (!data || !Array.isArray(data)) {
        console.error('Dados inválidos em processStatusData');
        return { statusCount: {}, sortedStatuses: [] };
    }

    const statusCount = {};
    data.forEach(row => {
        const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');
        const status = statusKey && row[statusKey] !== undefined ? String(row[statusKey]).trim() : '';
        if (status) {
            statusCount[status] = (statusCount[status] || 0) + 1;
        }
    });

    const sortedStatuses = Object.keys(statusCount).sort();

    return { statusCount, sortedStatuses };
}

function processAvailabilityData(data) {
    console.log('Processando dados de disponibilidade...');
    if (!data || !Array.isArray(data)) {
        console.error('Dados inválidos em processAvailabilityData');
        return {
            sortedUnits: [],
            availability: [],
            hasUnitColumn: false,
            hasStatusColumn: false,
            errorMessage: 'Dados inválidos'
        };
    }

    const unitCount = {};
    const availability = {};

    let hasUnitColumn = false;
    let hasStatusColumn = false;

    // Valores considerados como "Disponível" e "Indisponível"
    const availableStatuses = ['em uso', 'ativo', 'disponível', 'estoque interno', 'em trânsito'];
    const unavailableStatuses = ['em reparo', 'a alienar', 'inativo', 'a reparar'];

    data.forEach((row, index) => {
        const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
        const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');

        if (unitKey) hasUnitColumn = true;
        if (statusKey) hasStatusColumn = true;

        const unit = unitKey && row[unitKey] !== undefined ? String(row[unitKey]).trim() : '';
        const status = statusKey && row[statusKey] !== undefined ? String(row[statusKey]).trim().toLowerCase() : '';

        if (unit) {
            unitCount[unit] = (unitCount[unit] || 0) + 1;
            availability[unit] = availability[unit] || { available: 0, unavailable: 0 };

            if (availableStatuses.includes(status)) {
                availability[unit].available += 1;
            } else if (unavailableStatuses.includes(status)) {
                availability[unit].unavailable += 1;
            } else {
                console.warn(`Status desconhecido na linha ${index + 1}: "${status}"`);
            }
        }
    });

    const sortedUnits = Object.keys(unitCount).sort();
    const availabilityArray = sortedUnits.map(unit => ({
        unit,
        available: availability[unit]?.available || 0,
        unavailable: availability[unit]?.unavailable || 0,
        total: (availability[unit]?.available || 0) + (availability[unit]?.unavailable || 0)
    }));

    // Logs para depuração
    console.log('sortedUnits:', sortedUnits);
    console.log('availability:', availabilityArray);
    console.log('Valores únicos de StatusPatrimonio:', [...new Set(data.map(row => {
        const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');
        return statusKey && row[statusKey] !== undefined ? String(row[statusKey]).trim() : '';
    }))]);

    let errorMessage = '';
    if (!hasUnitColumn) errorMessage = 'Coluna "Unidade" não encontrada na planilha.';
    if (!hasStatusColumn) errorMessage = errorMessage ? `${errorMessage} Coluna "StatusPatrimonio" não encontrada na planilha.` : 'Coluna "StatusPatrimonio" não encontrada na planilha.';

    return { sortedUnits, availability: availabilityArray, hasUnitColumn, hasStatusColumn, errorMessage };
}