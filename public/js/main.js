import { processUnitData, processStatusData, processAvailabilityData } from './dataProcessor.js';
import { renderUnitChart, renderStatusChart, renderAvailabilityChart, renderHistoryChart } from './chartRenderer.js';
import { renderAvailabilityTable, sortAvailabilityTable } from './tableRenderer.js';

// Estado global
let planilhaData = null;
let historicalData = null;
let unitChartInstance = null;
let statusChartInstance = null;
let availabilityChartInstance = null;
let historyChartInstance = null;
let currentSort = { column: 'total', direction: 'desc' };
let currentType = 'all'; // Rastreia o tipo atual (sistran ou all)
const SISTRAN_UNITS = [
    'AFA', 'BAAN', 'BABV', 'BACG', 'BAFL', 'BAFZ', 'BANT', 'BAPV', 'BASC', 'BASM', 'BASV',
    'CISCEA', 'CLA', 'COMARA', 'CPBV-CC', 'CRCEA-SE', 'DACTA I', 'DACTA II', 'DACTA III',
    'DACTA IV', 'DECEA', 'EEAR', 'EPCAR', 'GABAER', 'GAP-AF', 'GAP-BE', 'GAP-BR', 'GAP-CO',
    'GAP-DF', 'GAP-GL', 'GAP-LS', 'GAP-MN', 'GAP-RF', 'GAP-RJ', 'GAP-SJ', 'GAP-SP', 'ICEA', 'PAME'
];

// Expor funções globais
window.processFile = processFile;
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
window.deleteDuplicates = deleteDuplicates;
window.loadDataByDate = loadDataByDate;
window.showUploadScreen = showUploadScreen;
window.goBackToInitial = goBackToInitial;
window.loadDataByDateFromTable = loadDataByDateFromTable;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded: Inicializando...');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregou.');
        document.getElementById('initialError').textContent = 'Erro: Chart.js não carregado.';
    } else if (typeof ChartDataLabels === 'undefined') {
        console.error('Chart.js datalabels não carregou.');
        document.getElementById('initialError').textContent = 'Erro: Plugin datalabels não carregado.';
    } else {
        console.log('Chart.js e datalabels carregados.');
        Chart.register(ChartDataLabels);
    }

    // Carregar totais diários
    await loadDailyTotals();
});

async function loadDailyTotals() {
    console.log('Carregando totais diários...');
    const tableBody = document.getElementById('dailyTotalsTableBody');
    if (!tableBody) {
        console.error('Elemento #dailyTotalsTableBody não encontrado');
        document.getElementById('initialError').textContent = 'Erro: Elemento da tabela de totais não encontrado.';
        return;
    }

    try {
        console.log('Fazendo requisição para /.netlify/functions/get-daily-totals');
        const response = await fetch('/.netlify/functions/get-daily-totals');
        console.log('Resposta recebida:', response.status, response.statusText);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Corpo do erro:', errorBody);
            throw new Error(`Erro ao buscar totais diários: ${response.status} ${response.statusText}`);
        }
        const dailyTotals = await response.json();
        console.log('Totais diários recebidos:', dailyTotals);

        tableBody.innerHTML = '';
        if (dailyTotals.length === 0) {
            console.warn('Nenhum total diário disponível');
            document.getElementById('initialError').textContent = 'Nenhum dado diário encontrado no banco de dados.';
        } else {
            dailyTotals.forEach(item => {
                console.log('Adicionando dia:', item);
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.setAttribute('data-date', item.date);
                row.innerHTML = `
                    <td>${item.date} (${item.month}/${item.year})</td>
                    <td>${item.totalViaturas}</td>
                `;
                row.addEventListener('click', () => loadDataByDateFromTable(item.date));
                tableBody.appendChild(row);
            });
            document.getElementById('initialError').textContent = '';
        }
    } catch (error) {
        console.error('Erro em loadDailyTotals:', error);
        document.getElementById('initialError').textContent = `Erro ao carregar totais diários: ${error.message}`;
    }
}

async function loadDataByDateFromTable(date) {
    console.log('Carregando dados para data:', date);
    try {
        const response = await fetch('/.netlify/functions/get-data-by-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });
        console.log('Resposta recebida:', response.status, response.statusText);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Corpo do erro:', errorBody);
            throw new Error(`Erro ao buscar dados da data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (!data || !data.unitCount || !data.availability) {
            throw new Error('Dados inválidos recebidos');
        }

        historicalData = data;
        planilhaData = convertToPlanilhaData(data);
        console.log('planilhaData convertido:', planilhaData);

        showAnalysisScreen();
    } catch (error) {
        console.error('Erro em loadDataByDateFromTable:', error);
        document.getElementById('initialError').textContent = `Erro ao carregar dados da data: ${error.message}`;
    }
}

async function loadDataByDate() {
    console.log('Carregando dados por data...');
    const dateSelect = document.getElementById('historyDateSelect');
    const selectedDate = dateSelect.value;
    if (!selectedDate) {
        document.getElementById('historyError').textContent = 'Selecione uma data.';
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/get-data-by-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate }),
        });
        if (!response.ok) {
            throw new Error('Erro ao buscar dados: ' + response.statusText);
        }
        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (!data || !data.unitCount || !data.availability) {
            throw new Error('Dados inválidos recebidos');
        }

        historicalData = data;
        planilhaData = convertToPlanilhaData(data);
        console.log('planilhaData convertido:', planilhaData);

        showAnalysisScreen();
    } catch (error) {
        console.error('Erro em loadDataByDate:', error);
        document.getElementById('historyError').textContent = 'Erro ao carregar dados da data selecionada.';
    }
}

function convertToPlanilhaData(data) {
    console.log('Convertendo dados históricos para planilhaData...');
    const result = [];
    data.availability.forEach(item => {
        for (let i = 0; i < item.available; i++) {
            result.push({
                Unidade: item.unit,
                StatusPatrimonio: 'Em Uso'
            });
        }
        for (let i = 0; i < item.unavailable; i++) {
            result.push({
                Unidade: item.unit,
                StatusPatrimonio: 'Inativo'
            });
        }
    });
    return result;
}

function filterDataByUnits(data, type) {
    console.log(`Filtrando dados para tipo: ${type}`);
    if (type === 'sistran') {
        return data.filter(row => {
            const unitKey = Object.keys(row).find(key => key.toLowerCase().replace(/\s+/g, '') === 'unidade');
            const unit = unitKey && row[unitKey] !== undefined ? String(row[unitKey]).trim() : '';
            return SISTRAN_UNITS.includes(unit);
        });
    }
    return data; // 'all' retorna todos os dados
}

function showUploadScreen() {
    console.log('Exibindo uploadScreen...');
    planilhaData = null;
    historicalData = null;
    showScreen('uploadScreen');
}

function goBackToInitial() {
    console.log('Voltando para initialScreen...');
    showScreen('initialScreen');
    loadDailyTotals();
}

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
    reader.onload = async function(e) {
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
            await saveDataToServer();
            showAnalysisScreen();
        } catch (error) {
            console.error('Erro ao processar a planilha:', error);
            document.getElementById('uploadError').textContent = 'Erro ao processar a planilha.';
        }
    };
    reader.readAsArrayBuffer(file);
}

async function saveDataToServer() {
    console.log('Iniciando saveDataToServer...');
    try {
        const unitData = processUnitData(planilhaData);
        const availabilityData = processAvailabilityData(planilhaData);
        console.log('unitData:', unitData);
        console.log('availabilityData:', availabilityData);

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

        const responseCheck = await fetch('/.netlify/functions/get-data-by-date', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today }),
        });
        if (responseCheck.ok) {
            console.log('Documento existente, atualizando...');
            await fetch('/.netlify/functions/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dataToSave, update: true }),
            });
        } else {
            await fetch('/.netlify/functions/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            });
        }

        console.log('Dados salvos com sucesso');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        throw error;
    }
}

function showAnalysisScreen() {
    console.log('Exibindo analysisScreen...');
    console.log('planilhaData:', planilhaData);

    if (!planilhaData || planilhaData.length === 0) {
        console.error('Nenhum dado disponível para exibir.');
        document.getElementById('analysisError').textContent = 'Nenhum dado disponível. Volte e faça upload ou selecione uma data.';
        showScreen('initialScreen');
        return;
    }

    try {
        const { totalRecords } = processUnitData(planilhaData);
        console.log('Total de Registros:', totalRecords);

        const totalRecordsElement = document.getElementById('totalRecords');
        if (totalRecordsElement) {
            totalRecordsElement.textContent = totalRecords;
        } else {
            console.error('Elemento #totalRecords não encontrado.');
            document.getElementById('analysisError').textContent = 'Erro: Elemento de resumo não encontrado.';
        }

        document.getElementById('unitChartContainer').style.display = 'none';
        document.getElementById('statusChartContainer').style.display = 'none';
        document.getElementById('availabilityTableContainer').style.display = 'none';
        document.getElementById('analysisError').textContent = '';

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

        showScreen('analysisScreen');
    } catch (error) {
        console.error('Erro em showAnalysisScreen:', error);
        document.getElementById('analysisError').textContent = 'Erro ao carregar a tela de análise.';
    }
}

function showUnitCountChart(type) {
    console.log(`Exibindo gráfico de unidades (${type})...`);
    if (!planilhaData) {
        console.error('Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload ou selecione uma data.';
        return;
    }

    try {
        const filteredData = filterDataByUnits(planilhaData, type);
        if (filteredData.length === 0) {
            document.getElementById('analysisError').textContent = 'Nenhum dado disponível para as unidades selecionadas.';
            return;
        }
        const { unitCount, sortedUnits } = processUnitData(filteredData);
        if (unitChartInstance) unitChartInstance.destroy();
        unitChartInstance = renderUnitChart('unitChart', sortedUnits, unitCount);
        document.getElementById('unitChartContainer').style.display = 'block';
        document.getElementById('statusChartContainer').style.display = 'none';
        document.getElementById('availabilityTableContainer').style.display = 'none';
        document.getElementById('analysisError').textContent = '';
    } catch (error) {
        console.error('Erro em showUnitCountChart:', error);
        document.getElementById('analysisError').textContent = 'Erro ao exibir gráfico de unidades.';
    }
}

function showStatusCountChart(type) {
    console.log(`Exibindo gráfico de status (${type})...`);
    if (!planilhaData) {
        console.error('Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload ou selecione uma data.';
        return;
    }

    try {
        const filteredData = filterDataByUnits(planilhaData, type);
        if (filteredData.length === 0) {
            document.getElementById('analysisError').textContent = 'Nenhum dado disponível para as unidades selecionadas.';
            return;
        }
        const { statusCount, sortedStatuses } = processStatusData(filteredData);
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = renderStatusChart('statusChart', sortedStatuses, statusCount);
        document.getElementById('unitChartContainer').style.display = 'none';
        document.getElementById('statusChartContainer').style.display = 'block';
        document.getElementById('availabilityTableContainer').style.display = 'none';
        document.getElementById('analysisError').textContent = '';
    } catch (error) {
        console.error('Erro em showStatusCountChart:', error);
        document.getElementById('analysisError').textContent = 'Erro ao exibir gráfico de status.';
    }
}

function showAvailabilityTable(type) {
    console.log(`Exibindo tabela de disponibilidade (${type})...`);
    if (!planilhaData) {
        console.error('Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload ou selecione uma data.';
        return;
    }

    try {
        currentType = type; // Armazenar o tipo atual
        const filteredData = filterDataByUnits(planilhaData, type);
        if (filteredData.length === 0) {
            document.getElementById('analysisError').textContent = 'Nenhum dado disponível para as unidades selecionadas.';
            return;
        }
        const { sortedUnits, availability, hasUnitColumn, hasStatusColumn, errorMessage } = processAvailabilityData(filteredData);
        console.log('sortedUnits:', sortedUnits);
        console.log('availability:', availability);
        if (!hasUnitColumn || !hasStatusColumn) {
            console.error('Erro de colunas:', errorMessage);
            document.getElementById('analysisError').textContent = errorMessage;
            return;
        }
        renderAvailabilityTable('availabilityTableBody', sortedUnits, availability);
        document.getElementById('unitChartContainer').style.display = 'none';
        document.getElementById('statusChartContainer').style.display = 'none';
        document.getElementById('availabilityTableContainer').style.display = 'block';
        document.getElementById('availabilityTable').style.display = 'table';
        document.getElementById('availabilityChart').style.display = 'none';
        document.getElementById('generateChartButton').style.display = 'inline-block';
        document.getElementById('backToTableButton').style.display = 'none';
        document.getElementById('analysisError').textContent = '';
    } catch (error) {
        console.error('Erro em showAvailabilityTable:', error);
        document.getElementById('analysisError').textContent = 'Erro ao exibir tabela de disponibilidade.';
    }
}

function showAvailabilityChart(type) {
    console.log(`Exibindo gráfico de disponibilidade (${type})...`);
    if (!planilhaData) {
        console.error('Nenhum dado carregado.');
        document.getElementById('analysisError').textContent = 'Nenhum dado carregado. Volte e faça upload ou selecione uma data.';
        return;
    }

    try {
        const filteredData = filterDataByUnits(planilhaData, type);
        if (filteredData.length === 0) {
            document.getElementById('analysisError').textContent = 'Nenhum dado disponível para as unidades selecionadas.';
            return;
        }
        const { sortedUnits, availability } = processAvailabilityData(filteredData);
        if (!availability || availability.length === 0) {
            document.getElementById('analysisError').textContent = 'Nenhum dado de disponibilidade disponível.';
            return;
        }
        if (availabilityChartInstance) {
            availabilityChartInstance.destroy();
            availabilityChartInstance = null;
        }
        availabilityChartInstance = renderAvailabilityChart('availabilityChart', sortedUnits, availability);
        document.getElementById('availabilityTable').style.display = 'none';
        document.getElementById('availabilityChart').style.display = 'block';
        document.getElementById('generateChartButton').style.display = 'none';
        document.getElementById('backToTableButton').style.display = 'inline-block';
        document.getElementById('analysisError').textContent = '';
    } catch (error) {
        console.error('Erro em showAvailabilityChart:', error);
        document.getElementById('analysisError').textContent = 'Erro ao exibir gráfico de disponibilidade: ' + error.message;
    }
}

function sortTable(column) {
    console.log('Ordenando tabela por:', column);
    try {
        currentSort = sortAvailabilityTable('availabilityTableBody', column, currentSort);
    } catch (error) {
        console.error('Erro em sortTable:', error);
        document.getElementById('analysisError').textContent = 'Erro ao ordenar tabela.';
    }
}

async function showHistoryScreen() {
    console.log('Exibindo historyScreen...');
    try {
        const response = await fetch('/.netlify/functions/get-history');
        if (!response.ok) {
            throw new Error('Erro ao recuperar histórico: ' + response.statusText);
        }
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

        if (historyChartInstance) historyChartInstance.destroy();
        historyChartInstance = renderHistoryChart('historyChart', history);
        document.getElementById('historyChartContainer').style.display = 'block';
        document.getElementById('historyError').textContent = '';

        showScreen('historyScreen');
    } catch (error) {
        console.error('Erro em showHistoryScreen:', error);
        document.getElementById('historyError').textContent = 'Erro ao carregar histórico.';
    }
}

async function deleteDuplicates() {
    console.log('Excluindo duplicatas...');
    const dateSelect = document.getElementById('historyDateSelect');
    const selectedDate = dateSelect.value;
    if (!selectedDate) {
        document.getElementById('historyError').textContent = 'Selecione uma data.';
        return;
    }
    try {
        const response = await fetch('/.netlify/functions/delete-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate }),
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('historyError').textContent = result.message;
            showHistoryScreen();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erro ao excluir duplicatas:', error);
        document.getElementById('historyError').textContent = 'Erro ao excluir duplicatas.';
    }
}

function showHistoricalData() {
    const dateSelect = document.getElementById('historyDateSelect');
    const selectedDate = dateSelect.value;
    if (selectedDate) {
        console.log('Exibir dados de:', selectedDate);
        loadDataByDate();
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
            console.error('Erro em exportHistory:', error);
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
            console.error('Erro em importHistory:', error);
            document.getElementById('historyError').textContent = 'Erro ao importar histórico.';
        }
    };
    reader.readAsText(file);
}

function goBack() {
    console.log('Voltando...');
    showScreen('initialScreen');
    loadDailyTotals();
}

function goBackFromHistory() {
    console.log('Voltando de historyScreen...');
    showScreen('initialScreen');
    loadDailyTotals();
}

function showScreen(screenId) {
    console.log('Exibindo tela:', screenId);
    document.querySelectorAll('.screen').forEach(screen => {
        console.log('Removendo active de:', screen.id);
        screen.classList.remove('active');
    });
    const screenElement = document.getElementById(screenId);
    if (screenElement) {
        screenElement.classList.add('active');
    } else {
        console.error('Tela não encontrada:', screenId);
        document.getElementById('initialError').textContent = `Erro: Tela ${screenId} não encontrada.`;
    }
}