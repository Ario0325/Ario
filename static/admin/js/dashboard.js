document.addEventListener('DOMContentLoaded', function() {
    const statsGrid = document.querySelector('.dashboard-stats-grid');
    if (!statsGrid) return;

    const STATUS_LABELS = {
        'pending': 'در انتظار',
        'paid': 'پرداخت شده',
        'processing': 'در حال پردازش',
        'shipped': 'ارسال شده',
        'delivered': 'تحویل شده',
        'cancelled': 'لغو شده'
    };

    const STATUS_COLORS = [
        '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#1b5e20', '#f44336'
    ];

    function formatNumber(n) {
        return Number(n).toLocaleString('fa-IR');
    }

    function formatCurrency(n) {
        return formatNumber(n) + ' تومان';
    }

    fetch('/admin/core/dashboard-stats/')
        .then(r => r.json())
        .then(data => {
            renderSalesChart(data.sales);
            renderStatusChart(data.statuses);
            renderTopProducts(data.top_products);
        })
        .catch(err => console.error('Dashboard stats error:', err));

    function renderSalesChart(sales) {
        const ctx = document.getElementById('salesChart');
        if (!ctx || !sales.length) return;

        const labels = sales.map(s => {
            const d = new Date(s.date);
            return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'فروش (تومان)',
                    data: sales.map(s => s.total),
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#7c3aed',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(ctx) {
                                return formatCurrency(ctx.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        reverse: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#888', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: '#888',
                            font: { size: 11 },
                            callback: function(v) {
                                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderStatusChart(statuses) {
        const ctx = document.getElementById('statusChart');
        if (!ctx || !statuses.length) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statuses.map(s => STATUS_LABELS[s.status] || s.status),
                datasets: [{
                    data: statuses.map(s => s.count),
                    backgroundColor: STATUS_COLORS,
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true,
                        labels: {
                            color: '#888',
                            padding: 12,
                            font: { size: 12 },
                            usePointStyle: true,
                            pointStyleWidth: 8
                        }
                    },
                    tooltip: {
                        rtl: true,
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': ' + ctx.parsed + ' سفارش';
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function renderTopProducts(products) {
        const tbody = document.getElementById('topProductsBody');
        if (!tbody || !products.length) return;

        function esc(str) {
            const d = document.createElement('div');
            d.textContent = str;
            return d.innerHTML;
        }

        tbody.innerHTML = products.map((p, i) =>
            '<tr>' +
            '<td style="text-align:center;font-weight:600;">' + (i + 1) + '</td>' +
            '<td>' + esc(p.name) + '</td>' +
            '<td style="text-align:center;">' + formatNumber(p.sold) + '</td>' +
            '<td>' + formatCurrency(p.revenue) + '</td>' +
            '</tr>'
        ).join('');
    }
});
