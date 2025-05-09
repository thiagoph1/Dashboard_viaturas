import { processUnitData, processStatusData, processAvailabilityData } from './dataProcessor.js';
import { renderUnitChart, renderStatusChart, renderAvailabilityChart, renderHistoryChart } from './chartRenderer.js';
import { renderAvailabilityTable, sortAvailabilityTable } from './tableRenderer.js';

// Estado global
let planilhaData = null;
let unitChartInstance = null;
let statusChartInstance = null;
let availabilityChartInstance = null;
let historyChartInstance = null;
let currentSort = { column: 'total', direction: 'desc' };
let availableUnits = [];
const SISTRAN_UNITS = [
    'AFA', 'BAAN', 'BABV', 'BACG', 'BAFL', 'BAFZ', 'BANT', 'BAPV', 'BASC', 'BASM', 'BASV',
    'CISCEA', 'CLA', 'COMARA', 'CPBV-CC', 'CRCEA-SE', 'DACTA I', 'DACTA II', 'DACTA III',
    'DACTA IV', 'DECEA', 'EEAR', 'EPCAR', 'GABAER', 'GAP-AF', 'GAP-BE', 'GAP-BR', 'GAP-CO',
    'GAP-DF', 'GAP-GL', 'GAP-LS', 'GAP-MN', 'GAP-RF', 'GAP-RJ', 'GAP-SJ', 'GAP-SP', 'ICEA', 'PAME'
];

// Expor funções globais
window.processFile = processFile;
window.applyUnitFilter = applyUnitFilter;
window.skipUnitFilter = skipUnitFilter;
window.goBack = goBack;
window.goBackFromHistory = goBackFromHistory;
window.showUnitCountChart = showUnitCountChart;
window.showStatusCountChart = showStatusCountChart;
window.showAvailabilityTable = showAvailabilityTable;
window.showAvailabilityChart = showAvailabilityChart;
window.sortTable = sortTable;
window.showHistoryScreen = showHistoryScreen;
window.showHistoricalData = showHistoricalData;
window.exportHistory = exportHistory;
window.importHistory = importHistory;
window.triggerImportHistory = triggerImportHistory;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Verificando Chart.js e datalabels...');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregou.');
        document.getElementById('uploadError').textContent = 'Erro: Chart.js não carregado.';
    } else if (typeof ChartDataLabels === 'undefined') {
        console.error('Chart.js datalabels não carregou.');
        document.getElementById('uploadError').textContent = 'Erro: Plugin datalabels não carregado.';
    } else {
        console.log('Chart.js e datalabels carregados com sucesso.');
        Chart.register(ChartDataLabels);
    }
});

function processFile() {
    console.log('processFile chamado.');
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        console.log('Nenhum arquivo selecionado.');
        document.getElementById('uploadError').textContent = 'Por favor, selecione um arquivo Excel (.xlsx ou .xls).';
        return;
    }

    console.log('Arquivo selecionado:', file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log('Lendo arquivo Excel...');
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            planilhaData = XLSX.utils.sheet_to_json(worksheet);

            if (!planilhaData || planilhaData.length === 0) {
                console.log('Nenhum dado encontrado na planilha.');
                document.getElementById('uploadError').textContent = 'Nenhum dado encontrado na planilha.';
                return;
            }

            console.log('Colunas encontradas:', Object.keys(planilhaData[0]));
            showFilterScreen();
        } catch (error) {
            console.error('Erro ao processar a planilha:', error);
            document.getElementById('uploadError').textContent = 'Erro ao processar a planilha.';
        }
    };
    reader.readAsArrayBuffer(file);
}

function showFilterScreen() {
    availableUnits = [];
    const unitSet = new Set();
    let hasUnitColumn = false;

    planilhaData.forEach(row => {
        const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
        if (unitKey && row[unitKey] !== undefined && row[unitKey] !== null) {
            hasUnitColumn = true;
            const unit = String(row[unitKey]).trim();
            if (unit) {
                unitSet.add(unit);
            }
        }
    });

    availableUnits = [...unitSet];
    console.log('Unidades disponíveis:', availableUnits);

    const sistranUnits = availableUnits.filter(unit => SISTRAN_UNITS.includes(unit)).sort();
    const otherUnits = availableUnits.filter(unit => !SISTRAN_UNITS.includes(unit)).sort();
    console.log('Elos do SISTRAN:', sistranUnits);
    console.log('Outros:', otherUnits);

    const sistranList = document.getElementById('sistranUnitsList');
    sistranList.innerHTML = '';
    if (hasUnitColumn && sistranUnits.length > 0) {
        sistranUnits.forEach(unit => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${unit}" class="unit-checkbox">
                ${unit}
            `;
            sistranList.appendChild(label);
        });
    } else {
        sistranList.innerHTML = '<p>Nenhuma unidade do SISTRAN encontrada.</p>';
    }

    const otherList = document.getElementById('otherUnitsList');
    otherList.innerHTML = '';
    if (hasUnitColumn && otherUnits.length > 0) {
        otherUnits.forEach(unit => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" value="${unit}" class="unit-checkbox">
                ${unit}
            `;
            otherList.appendChild(label);
        });
    } else {
        otherList.innerHTML = '<p>Nenhuma outra unidade encontrada.</p>';
    }

    if (!hasUnitColumn || availableUnits.length === 0) {
        document.getElementById('filterError').textContent = 'Nenhuma unidade válida encontrada. Prosseguir sem filtrar?';
    } else {
        document.getElementById('filterError').textContent = '';
    }

    showScreen('filterScreen');
}

async function applyUnitFilter() {
    console.log('Aplicando filtro de unidades...');
    const checkboxes = document.querySelectorAll('.unit-checkbox:checked');
    const unitsToRemove = Array.from(checkboxes).map(cb => cb.value);
    console.log('Unidades a remover:', unitsToRemove);

    if (unitsToRemove.length === availableUnits.length && availableUnits.length > 0) {
        document.getElementById('filterError').textContent = 'Não é possível remover todas as unidades.';
        return;
    }

    if (unitsToRemove.length > 0) {
        planilhaData = planilhaData.filter(row => {
            const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
            const unit = unitKey && row[unitKey] !== undefined ? String(row[unitKey]).trim() : '';
            return !unitsToRemove.includes(unit);
        });
        console.log('Dados após filtro:', planilhaData.length, 'registros');
    }

    if (planilhaData.length === 0) {
        document.getElementById('filterError').textContent = 'Nenhum dado restante após o filtro. Ajuste a seleção.';
        return;
    }

    try {
        await saveDataToServer();
        showAnalysisScreen();
    } catch (error) {
        document.getElementById('filterError').textContent = 'Erro ao salvar dados. Tente novamente.';
    }
}

async function skipUnitFilter() {
    console.log('Prosseguindo sem remover unidades.');
    try {
        await saveDataToServer();
        showAnalysisScreen();
    } catch (error) {
        document.getElementById('filterError').textContent = 'Erro ao salvar dados. Tente novamente.';
    }
}

async function saveDataToServer() {
    console.log('Iniciando saveDataToServer...');
    try {
        // Processar dados
        const unitData = processUnitData(planilhaData);
        const availabilityData = processAvailabilityData(planilhaData);
        console.log('unitData:', unitData);
        console.log('availabilityData:', availabilityData);

        // Validar dados processados
        if (!unitData || typeof unitData.totalRecords !== 'number' || !unitData.unitCount) {
            throw new Error('Dados de unitData inválidos: ' + JSON.stringify(unitData));
        }
        if (!availabilityData || !Array.isArray(availabilityData.sortedUnits) || !availabilityData.availability) {
            throw new Error('Dados de availabilityData inválidos: ' + JSON.stringify(availabilityData));
        }

        const today = new Date().toISOString().split('T')[0];
        const dataToSave = {
            date: today,
            totalRecords: unitData.totalRecords,
            unitCount: unitData.unitCount,
            availability: availabilityData.availability,
        };
        console.log('dataToSave:', dataToSave);

        // Enviar para Netlify Function
        const response = await fetch('/.netlify/functions/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave),
        });

        const responseBody = await response.json();
        console.log('Resposta do servidor:', responseBody);

        if (!response.ok) {
            throw new Error(`Erro do servidor: ${responseBody.error || response.statusText}`);
        }

        console.log('Dados salvos com sucesso:', responseBody);
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        throw error; // Propagar erro para a função chamadora
    }
}

function showAnalysisScreen() {
    const totalRecords = planilhaData.length;
    document.getElementById('totalRecords').textContent = totalRecords;

    document.getElementById('uploadScreen').classList.remove('active');
    document.getElementById('filterScreen').classList.remove('active');
    document.getElementById('historyScreen').classList.remove('active');
    document.getElementById('analysisScreen').classList.add('active');
    document.getElementById('uploadError').textContent = '';
    document.getElementById('unitChartContainer').classList.remove('active');
    document.getElementById('statusChartContainer').classList.remove('active');
    document.getElementById('availabilityTableContainer').classList.remove('active');

    if (unitChartInstance) {
        unitChartInstance.destroy();
        unitChartInstance = null;
    }
    if (statusChartInstance) {
        statusChartInstance.destroy();
        statusChartInstance = null;
    }
    if (availabilityChartInstance) {
        availabilityChartInstance.destroy();
        availabilityChartInstance = null;
    }
    currentSort = { column: 'total', direction: 'desc' };
}

function showUnitCountChart() {
    if (!planilhaData) {
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload de uma planilha.';
        return;
    }

    document.getElementById('statusChartContainer').classList.remove('active');
    document.getElementById('availabilityTableContainer').classList.remove('active');
    if (statusChartInstance) {
        statusChartInstance.destroy();
        statusChartInstance = null;
    }
    if (availabilityChartInstance) {
        availabilityChartInstance.destroy();
        availabilityChartInstance = null;
    }

    const { unitCount, hasUnitColumn } = processUnitData(planilhaData);
    console.log('Contagem de Unidades:', unitCount, 'Coluna Unidade:', hasUnitColumn);

    unitChartInstance = renderUnitChart(unitChartInstance, unitCount, hasUnitColumn);
    if (unitChartInstance || !hasUnitColumn) {
        document.getElementById('unitChartContainer').classList.add('active');
    }
}

function showStatusCountChart() {
    if (!planilhaData) {
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload de uma planilha.';
        return;
    }

    document.getElementById('unitChartContainer').classList.remove('active');
    document.getElementById('availabilityTableContainer').classList.remove('active');
    if (unitChartInstance) {
        unitChartInstance.destroy();
        unitChartInstance = null;
    }
    if (availabilityChartInstance) {
        availabilityChartInstance.destroy();
        availabilityChartInstance = null;
    }

    const { statusCount, hasStatusColumn, totalValidStatus } = processStatusData(planilhaData);
    console.log('Contagem de Status:', statusCount, 'Coluna Status:', hasStatusColumn);

    statusChartInstance = renderStatusChart(statusChartInstance, statusCount, hasStatusColumn, totalValidStatus);
    if (statusChartInstance || !hasStatusColumn) {
        document.getElementById('statusChartContainer').classList.add('active');
    }
}

function showAvailabilityTable() {
    if (!planilhaData) {
        console.log('Erro: Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload de uma planilha.';
        return;
    }

    console.log('Mostrando tabela de Disponibilidade por OM...');

    document.getElementById('unitChartContainer').classList.remove('active');
    document.getElementById('statusChartContainer').classList.remove('active');
    if (unitChartInstance) {
        unitChartInstance.destroy();
        unitChartInstance = null;
    }
    if (statusChartInstance) {
        statusChartInstance.destroy();
        statusChartInstance = null;
    }
    if (availabilityChartInstance) {
        availabilityChartInstance.destroy();
        availabilityChartInstance = null;
    }

    document.getElementById('availabilityTable').classList.add('active');
    document.getElementById('availabilityChart').classList.remove('active');
    document.getElementById('availabilityTableContainer').classList.add('active');
    document.getElementById('generateChartButton').style.display = 'inline-block';
    document.getElementById('backToTableButton').style.display = 'none';

    const { hasUnitColumn, hasStatusColumn, sortedUnits, errorMessage } = processAvailabilityData(planilhaData);
    if (!hasUnitColumn || !hasStatusColumn) {
        console.log('Erro: Colunas ausentes:', errorMessage);
        document.getElementById('analysisError').textContent = errorMessage;
        return;
    }

    renderAvailabilityTable(sortedUnits, currentSort);
}

function showAvailabilityChart() {
    if (!planilhaData) {
        console.log('Erro: Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload de uma planilha.';
        return;
    }

    console.log('Mostrando gráfico de Disponibilidade por OM...');

    document.getElementById('availabilityTable').classList.remove('active');
    document.getElementById('availabilityChart').classList.add('active');
    document.getElementById('availabilityTableContainer').classList.add('active');
    document.getElementById('generateChartButton').style.display = 'none';
    document.getElementById('backToTableButton').style.display = 'inline-block';

    const { hasUnitColumn, hasStatusColumn, sortedUnits, errorMessage } = processAvailabilityData(planilhaData);
    if (!hasUnitColumn || !hasStatusColumn) {
        console.log('Erro: Colunas ausentes:', errorMessage);
        document.getElementById('analysisError').textContent = errorMessage;
        return;
    }

    availabilityChartInstance = renderAvailabilityChart(availabilityChartInstance, sortedUnits, hasUnitColumn, hasStatusColumn);
    if (availabilityChartInstance || !hasUnitColumn || !hasStatusColumn) {
        document.getElementById('availabilityTableContainer').classList.add('active');
    }
}

function sortTable(column) {
    console.log(`Ordenando por ${column} (${currentSort.column === column && currentSort.direction === 'asc' ? 'descendente' : 'crescente'})`);

    const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
    currentSort = { column, direction };

    const { hasUnitColumn, hasStatusColumn, sortedUnits, errorMessage } = processAvailabilityData(planilhaData);
    if (!hasUnitColumn || !hasStatusColumn) {
        console.log('Erro: Colunas ausentes:', errorMessage);
        document.getElementById('analysisError').textContent = errorMessage;
        return;
    }

    sortAvailabilityTable(sortedUnits, currentSort);
}

async function showHistoryScreen() {
    console.log('Mostrando tela de histórico...');
    try {
        const response = await fetch('/.netlify/functions/get-history');
        const history = await response.json();
        console.log('Histórico recebido:', history);

        const dateSelect = document.getElementById('historyDateSelect');
        dateSelect.innerHTML = '<option value="">Selecione uma data</option>';
        history.forEach(item => {
            const option = document.createElement('option');
            option.value = item.date;
            option.textContent = item.date;
            dateSelect.appendChild(option);
        });

        if (historyChartInstance) {
            historyChartInstance.destroy();
            historyChartInstance = null;
        }
        historyChartInstance = renderHistoryChart(historyChartInstance, history);
        document.getElementById('historyChartContainer').classList.add('active');

        document.getElementById('uploadScreen').classList.remove('active');
        document.getElementById('filterScreen').classList.remove('active');
        document.getElementById('analysisScreen').classList.remove('active');
        document.getElementById('historyScreen').classList.add('active');
        document.getElementById('historyError').textContent = '';
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historyError').textContent = 'Erro ao carregar histórico.';
    }
}

function showHistoricalData() {
    const date = document.getElementById('historyDateSelect').value;
    if (date) {
        console.log('Visualizar dados históricos para:', date);
        // Implementar lógica para exibir dados de uma data específica
    }
}

function exportHistory() {
    console.log('Exportando histórico...');
    fetch('/.netlify/functions/get-history')
        .then(response => response.json())
        .then(history => {
            const dataStr = JSON.stringify(history, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'historico.json';
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Erro ao exportar histórico:', error);
            document.getElementById('historyError').textContent = 'Erro ao exportar histórico.';
        });
}

function triggerImportHistory() {
    document.getElementById('importHistoryInput').click();
}

function importHistory() {
    console.log('Importando histórico...');
    const fileInput = document.getElementById('importHistoryInput');
    const file = fileInput.files[0];
    if (!file) {
        document.getElementById('historyError').textContent = 'Selecione um arquivo JSON.';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const history = JSON.parse(e.target.result);
            for (const item of history) {
                await fetch('/.netlify/functions/save-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item),
                });
            }
            showHistoryScreen();
        } catch (error) {
            console.error('Erro ao importar histórico:', error);
            document.getElementById('historyError').textContent = 'Erro ao importar histórico.';
        }
    };
    reader.readAsText(file);
}

function goBack() {
    if (planilhaData) {
        showFilterScreen();
    } else {
        document.getElementById('analysisScreen').classList.remove('active');
        document.getElementById('filterScreen').classList.remove('active');
        document.getElementById('historyScreen').classList.remove('active');
        document.getElementById('uploadScreen').classList.add('active');
        document.getElementById('fileInput').value = '';
        document.getElementById('analysisError').textContent = '';
    }
}

function goBackFromHistory() {
    document.getElementById('historyScreen').classList.remove('active');
    document.getElementById('analysisScreen').classList.add('active');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}