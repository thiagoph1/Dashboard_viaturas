export function renderUnitChart(existingInstance, unitCount, hasUnitColumn) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não disponível.');
        document.getElementById('analysisError').textContent = 'Erro: Não foi possível criar o gráfico. Verifique a conexão com a CDN.';
        return null;
    }

    const ctxUnit = document.getElementById('unitChart').getContext('2d');
    if (existingInstance) {
        existingInstance.destroy();
    }

    if (hasUnitColumn && Object.keys(unitCount).length > 0) {
        return new Chart(ctxUnit, {
            type: 'bar',
            data: {
                labels: Object.keys(unitCount),
                datasets: [{
                    label: 'Contagem por Unidade',
                    data: Object.values(unitCount),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Número de Registros' }
                    },
                    x: {
                        title: { display: true, text: 'Unidade' }
                    }
                },
                plugins: {
                    datalabels: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.log('Gráfico de Unidade não renderizado: sem dados válidos');
        ctxUnit.fillText('Sem dados para exibir', 10, 50);
        document.getElementById('analysisError').textContent = 'Sem dados válidos para exibir no gráfico. Verifique a coluna "Unidade".';
        return null;
    }
}

export function renderStatusChart(existingInstance, statusCount, hasStatusColumn, totalValidStatus) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não disponível.');
        document.getElementById('analysisError').textContent = 'Erro: Não foi possível criar o gráfico. Verifique a conexão com a CDN.';
        return null;
    }

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    if (existingInstance) {
        existingInstance.destroy();
    }

    if (hasStatusColumn && Object.keys(statusCount).length > 0) {
        return new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: Object.keys(statusCount),
                datasets: [{
                    label: 'Contagem por Status Patrimônio',
                    data: Object.values(statusCount),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Número de Registros' }
                    },
                    x: {
                        title: { display: true, text: 'Status Patrimônio' }
                    }
                },
                plugins: {
                    datalabels: [
                        {
                            display: true,
                            color: '#fff',
                            anchor: 'center',
                            align: 'center',
                            font: {
                                weight: 'bold',
                                size: 14
                            },
                            formatter: (value) => value
                        },
                        {
                            display: true,
                            color: '#000',
                            anchor: 'end',
                            align: 'top',
                            font: {
                                weight: 'bold',
                                size: 12
                            },
                            formatter: (value) => {
                                if (totalValidStatus === 0) return '0%';
                                const percentage = (value / totalValidStatus * 100).toFixed(0);
                                return `${percentage}%`;
                            }
                        }
                    ]
                }
            }
        });
    } else {
        console.log('Gráfico de Status Patrimônio não renderizado: sem dados válidos');
        ctxStatus.fillText('Sem dados para exibir', 10, 50);
        document.getElementById('analysisError').textContent = 'Sem dados válidos para exibir no gráfico. Verifique a coluna "Status Patrimonio".';
        return null;
    }
}

export function renderAvailabilityChart(existingInstance, sortedUnits, hasUnitColumn, hasStatusColumn) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não disponível.');
        document.getElementById('analysisError').textContent = 'Erro: Não foi possível criar o gráfico. Verifique a conexão com a CDN.';
        return null;
    }

    const ctxAvailability = document.getElementById('availabilityChart').getContext('2d');
    if (existingInstance) {
        existingInstance.destroy();
    }

    if (hasUnitColumn && hasStatusColumn && sortedUnits.length > 0) {
        const units = sortedUnits.map(item => item.unit);
        return new Chart(ctxAvailability, {
            type: 'bar',
            data: {
                labels: units,
                datasets: [
                    {
                        label: 'Disponível',
                        data: sortedUnits.map(item => item.available),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Indisponível',
                        data: sortedUnits.map(item => item.unavailable),
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        stack: 'Stack 0'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        title: { display: true, text: 'Número de Registros' }
                    },
                    x: {
                        stacked: true,
                        title: { display: true, text: 'OM' }
                    }
                },
                plugins: {
                    datalabels: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.log('Gráfico de Disponibilidade não renderizado: sem dados válidos');
        ctxAvailability.fillText('Sem dados para exibir', 10, 50);
        document.getElementById('analysisError').textContent = 'Sem dados válidos para exibir no gráfico. Verifique as colunas "Unidade" e "Status Patrimonio".';
        return null;
    }
}