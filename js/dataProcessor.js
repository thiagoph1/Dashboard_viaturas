export function processUnitData(data) {
    const unitCount = {};
    let hasUnitColumn = false;

    data.forEach(row => {
        const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
        if (unitKey && row[unitKey] !== undefined && row[unitKey] !== null) {
            hasUnitColumn = true;
            const unit = String(row[unitKey]).trim();
            if (unit) {
                unitCount[unit] = (unitCount[unit] || 0) + 1;
            }
        }
    });

    return { unitCount, hasUnitColumn };
}

export function processStatusData(data) {
    const statusCount = {};
    let hasStatusColumn = false;
    let totalValidStatus = 0;

    data.forEach(row => {
        const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');
        if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null) {
            hasStatusColumn = true;
            const status = String(row[statusKey]).trim();
            if (status) {
                statusCount[status] = (statusCount[status] || 0) + 1;
                totalValidStatus += 1;
            }
        }
    });

    return { statusCount, hasStatusColumn, totalValidStatus };
}

export function processAvailabilityData(data) {
    console.log('Processando dados de disponibilidade...');
    const availabilityData = {};
    let hasUnitColumn = false;
    let hasStatusColumn = false;
    let statusValues = new Set();
    let errorMessage = '';

    try {
        data.forEach(row => {
            const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
            const statusKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'statuspatrimonio');

            const unit = unitKey && row[unitKey] !== undefined && row[unitKey] !== null ? String(row[unitKey]).trim() : '';
            const status = statusKey && row[statusKey] !== undefined && row[statusKey] !== null ? String(row[statusKey]).trim() : '';

            if (unit) {
                hasUnitColumn = true;
                if (!availabilityData[unit]) {
                    availabilityData[unit] = { available: 0, unavailable: 0 };
                }
                if (status) {
                    hasStatusColumn = true;
                    statusValues.add(status);
                    if (status.toLowerCase() === 'em uso') {
                        availabilityData[unit].available += 1;
                    } else {
                        availabilityData[unit].unavailable += 1;
                    }
                }
            }
        });

        console.log('Valores de Status Patrimonio encontrados:', [...statusValues]);

        if (!hasUnitColumn) {
            errorMessage += 'Coluna "Unidade" não encontrada. ';
        }
        if (!hasStatusColumn) {
            errorMessage += 'Coluna "Status Patrimonio" não encontrada.';
        }
        if (!hasUnitColumn || !hasStatusColumn) {
            console.log('Erro: Colunas ausentes:', errorMessage);
            return { availabilityData, hasUnitColumn, hasStatusColumn, sortedUnits: [], errorMessage };
        }

        console.log('Criando sortedUnits...');
        const sortedUnits = Object.keys(availabilityData).map(unit => ({
            unit,
            total: availabilityData[unit].available + availabilityData[unit].unavailable,
            available: availabilityData[unit].available,
            unavailable: availabilityData[unit].unavailable
        })).sort((a, b) => b.total - a.total || a.unit.localeCompare(b.unit));

        console.log('Dados de Disponibilidade por OM ordenados por total:');
        sortedUnits.forEach(item => {
            console.log(`${item.unit}: Total=${item.total} (Disponível=${item.available}, Indisponível=${item.unavailable})`);
        });

        return { availabilityData, hasUnitColumn, hasStatusColumn, sortedUnits, errorMessage };
    } catch (error) {
        console.error('Erro em processAvailabilityData:', error);
        errorMessage = 'Erro ao processar dados de disponibilidade. Verifique a planilha.';
        return { availabilityData, hasUnitColumn, hasStatusColumn, sortedUnits: [], errorMessage };
    }
}