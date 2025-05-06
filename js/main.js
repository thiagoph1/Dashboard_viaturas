import { processUnitData, processStatusData, processAvailabilityData } from './dataProcessor.js';
import { renderUnitChart, renderStatusChart, renderAvailabilityChart } from './chartRenderer.js';
import { renderAvailabilityTable, sortAvailabilityTable } from './tableRenderer.js';

// Estado global
let planilhaData = null;
let unitChartInstance = null;
let statusChartInstance = null;
let availabilityChartInstance = null;
let currentSort = { column: 'total', direction: 'desc' };

// Expor funções globais para eventos no HTML
window.processFile = processFile;
window.goBack = goBack;
window.showUnitCountChart = showUnitCountChart;
window.showStatusCountChart = showStatusCountChart;
window.showAvailabilityTable = showAvailabilityTable;
window.showAvailabilityChart = showAvailabilityChart;
window.sortTable = sortTable;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Verificando Chart.js e datalabels...');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregou. Verifique a conexão com a CDN.');
        document.getElementById('uploadError').textContent = 'Erro: Chart.js não carregado. Verifique sua conexão com a internet.';
    } else if (typeof ChartDataLabels === 'undefined') {
        console.error('Chart.js datalabels não carregou. Verifique a conexão com a CDN.');
        document.getElementById('uploadError').textContent = 'Erro: Plugin datalabels não carregado. Verifique sua conexão com a internet.';
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
                document.getElementById('uploadError').textContent = 'Nenhum dado encontrado na planilha. Verifique o arquivo.';
                return;
            }

            console.log('Colunas encontradas:', Object.keys(planilhaData[0]));
            showAnalysisScreen();
        } catch (error) {
            console.error('Erro ao processar a planilha:', error);
            document.getElementById('uploadError').textContent = 'Erro ao processar a planilha. Verifique se o arquivo é um Excel válido (.xlsx ou .xls).';
        }
    };
    reader.readAsArrayBuffer(file);
}

function showAnalysisScreen() {
    const totalRecords = planilhaData.length;
    document.getElementById('totalRecords').textContent = totalRecords;

    document.getElementById('uploadScreen').classList.remove('active');
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

function goBack() {
    if (planilhaData) {
        showAnalysisScreen();
    } else {
        document.getElementById('analysisScreen').classList.remove('active');
        document.getElementById('uploadScreen').classList.add('active');
        document.getElementById('fileInput').value = '';
        document.getElementById('analysisError').textContent = '';
    }
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