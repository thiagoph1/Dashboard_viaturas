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

async function processFile() {
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

    showScreen('filterScreen');
}

async function applyUnitFilter() {
    const checkboxes = document.querySelectorAll('.unit-checkbox:checked');
    const unitsToRemove = Array.from(checkboxes).map(cb => cb.value);
    console.log('Unidades a remover:', unitsToRemove);

    if (unitsToRemove.length > 0) {
        planilhaData = planilhaData.filter(row => {
            const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
            return unitKey && !unitsToRemove.includes(String(row[unitKey]).trim());
        });
        console.log('Dados após filtro:', planilhaData.length);
    }

    await saveDataToServer();
    showAnalysisScreen();
}

async function skipUnitFilter() {
    console.log('Prosseguindo sem filtro.');
    await saveDataToServer();
    showAnalysisScreen();
}

async function saveDataToServer() {
    try {
        // Processar dados para salvar
        const { unitCount, totalRecords } = processUnitData(planilhaData);
        const { availability } = processAvailabilityData(planilhaData);
        const today = new Date().toISOString().split('T')[0]; // ex.: 2025-05-09

        const dataToSave = {
            date: today,
            totalRecords,
            unitCount,
            availability,
        };

        // Enviar para Netlify Function
        const response = await fetch('/.netlify/functions/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSave),
        });

        if (!response.ok) {
            throw new Error('Erro ao salvar dados no servidor');
        }

        console.log('Dados salvos com sucesso:', await response.json());
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        document.getElementById('analysisError').textContent = 'Erro ao salvar dados no servidor.';
    }
}

function showAnalysisScreen() {
    const { totalRecords } = processUnitData(planilhaData);
    document.getElementById('totalRecords').textContent = totalRecords;
    showScreen('analysisScreen');
}

function showUnitCountChart() {
    const { unitCount, sortedUnits } = processUnitData(planilhaData);
    if (unitChartInstance) unitChartInstance.destroy();
    unitChartInstance = renderUnitChart('unitChart', sortedUnits, unitCount);
    document.getElementById('unitChartContainer').style.display = 'block';
    document.getElementById('statusChartContainer').style.display = 'none';
    document.getElementById('availabilityTableContainer').style.display = 'none';
}

function showStatusCountChart() {
    const { statusCount, sortedStatuses } = processStatusData(planilhaData);
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = renderStatusChart('statusChart', sortedStatuses, statusCount);
    document.getElementById('unitChartContainer').style.display = 'none';
    document.getElementById('statusChartContainer').style.display = 'block';
    document.getElementById('availabilityTableContainer').style.display = 'none';
}

function showAvailabilityTable() {
    const { sortedUnits, availability } = processAvailabilityData(planilhaData);
    renderAvailabilityTable('availabilityTableBody', sortedUnits, availability);
    document.getElementById('unitChartContainer').style.display = 'none';
    document.getElementById('statusChartContainer').style.display = 'none';
    document.getElementById('availabilityTableContainer').style.display = 'block';
    document.getElementById('availabilityTable').style.display = 'table';
    document.getElementById('availabilityChart').style.display = 'none';
    document.getElementById('generateChartButton').style.display = 'inline-block';
    document.getElementById('backToTableButton').style.display = 'none';
}

function showAvailabilityChart() {
    const { sortedUnits, availability } = processAvailabilityData(planilhaData);
    if (availabilityChartInstance) availabilityChartInstance.destroy();
    availabilityChartInstance = renderAvailabilityChart('availabilityChart', sortedUnits, availability);
    document.getElementById('availabilityTable').style.display = 'none';
    document.getElementById('availabilityChart').style.display = 'block';
    document.getElementById('generateChartButton').style.display = 'none';
    document.getElementById('backToTableButton').style.display = 'inline-block';
}

function sortTable(column) {
    currentSort = sortAvailabilityTable('availabilityTableBody', column, currentSort);
}

async function showHistoryScreen() {
    try {
        // Recuperar dados históricos
        const response = await fetch('/.netlify/functions/get-history');
        if (!response.ok) {
            throw new Error('Erro ao recuperar histórico');
        }
        const history = await response.json();

        // Preencher select com datas
        const dateSelect = document.getElementById('historyDateSelect');
        dateSelect.innerHTML = '<option value="">Selecione uma data</option>';
        history.forEach(item => {
            const option = document.createElement('option');
            option.value = item.date;
            option.textContent = item.date;
            dateSelect.appendChild(option);
        });

        // Renderizar gráfico histórico (Total de Registros por dia)
        if (historyChartInstance) historyChartInstance.destroy();
        historyChartInstance = renderHistoryChart('historyChart', history);
        document.getElementById('historyChartContainer').style.display = 'block';

        showScreen('historyScreen');
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historyError').textContent = 'Erro ao carregar histórico.';
    }
}

function showHistoricalData() {
    const dateSelect = document.getElementById('historyDateSelect');
    const selectedDate = dateSelect.value;
    if (selectedDate) {
        // Implementar visualização de dados de uma data específica (ex.: gráficos/tabelas)
        console.log('Exibir dados de:', selectedDate);
        // Pode reutilizar showUnitCountChart, showStatusCountChart, etc., com dados do servidor
    }
}

function exportHistory() {
    // Exportar histórico como JSON
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
            // Enviar para o servidor
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
    showScreen('analysisScreen');
    document.getElementById('unitChartContainer').style.display = 'none';
    document.getElementById('statusChartContainer').style.display = 'none';
    document.getElementById('availabilityTableContainer').style.display = 'none';
}

function goBackFromHistory() {
    showScreen('analysisScreen');
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}