export function renderUnitChart(canvasId, sortedUnits, unitCount) {
    return new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
            labels: sortedUnits,
            datasets: [{
                label: 'Quantidade por Unidade',
                data: sortedUnits.map(unit => unitCount[unit] || 0),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round,
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Unidade'
                    }
                }
            }
        }
    });
}

export function renderStatusChart(canvasId, sortedStatuses, statusCount) {
    return new Chart(document.getElementById(canvasId), {
        type: 'pie',
        data: {
            labels: sortedStatuses,
            datasets: [{
                label: 'Status',
                data: sortedStatuses.map(status => statusCount[status] || 0),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    formatter: (value, ctx) => {
                        let sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        let percentage = (value * 100 / sum).toFixed(2) + '%';
                        return percentage;
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

export function renderAvailabilityChart(canvasId, sortedUnits, availability) {
    return new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
            labels: sortedUnits,
            datasets: [
                {
                    label: 'Disponível',
                    data: sortedUnits.map(unit => availability.find(a => a.unit === unit)?.available || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Indisponível',
                    data: sortedUnits.map(unit => availability.find(a => a.unit === unit)?.unavailable || 0),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            plugins: {
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: Math.round,
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Unidade'
                    }
                }
            }
        }
    });
}

export function renderHistoryChart(canvasId, history) {
    return new Chart(document.getElementById(canvasId), {
        type: 'line',
        data: {
            labels: history.map(item => item.date),
            datasets: [{
                label: 'Total de Registros por Dia',
                data: history.map(item => item.totalRecords),
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    align: 'top',
                    formatter: Math.round,
                    font: {
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total de Registros'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Data'
                    }
                }
            }
        }
    });
}