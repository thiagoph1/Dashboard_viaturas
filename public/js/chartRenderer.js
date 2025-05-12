function renderUnitChart(canvasId, sortedUnits, unitCount) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado em renderUnitChart.');
        throw new Error('Chart.js não carregado.');
    }
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedUnits,
            datasets: [{
                label: 'Total de Viaturas',
                data: sortedUnits.map(unit => unitCount[unit] || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderStatusChart(canvasId, sortedStatuses, statusCount) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado em renderStatusChart.');
        throw new Error('Chart.js não carregado.');
    }
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedStatuses,
            datasets: [{
                label: 'Status',
                data: sortedStatuses.map(status => statusCount[status] || 0),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)'
                ]
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round
                }
            }
        }
    });
}

function renderAvailabilityChart(canvasId, sortedUnits, availability) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado em renderAvailabilityChart.');
        throw new Error('Chart.js não carregado.');
    }
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedUnits,
            datasets: [
                {
                    label: 'Disponíveis',
                    data: availability.map(item => item.available),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
                {
                    label: 'Indisponíveis',
                    data: availability.map(item => item.unavailable),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                }
            ]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderHistoryChart(canvasId, history) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregado em renderHistoryChart.');
        throw new Error('Chart.js não carregado.');
    }
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.map(item => item.date),
            datasets: [{
                label: 'Total de Viaturas',
                data: history.map(item => item.totalRecords),
                fill: false,
                borderColor: 'rgba(54, 162, 235, 1)',
                tension: 0.1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}