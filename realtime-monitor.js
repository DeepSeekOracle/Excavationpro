// LYRA Token Monitor - Real-time Data Fetching
// Connects to the backend server for real token data from Clawnch MCP

class RealTimeTokenMonitor {
    constructor() {
        this.backendUrl = 'http://localhost:8080';
        this.data = {
            price: 0,
            priceChange: 0,
            marketCap: 0,
            volume: 0,
            holders: 0,
            transactions: 0,
            uniqueAddresses: 0,
            activeWallets: 0,
            moltbookMentions: 0,
            moltxMentions: 0,
            discordActivity: 0,
            fourclawActivity: 0,
            wethFees: 0,
            priceHistory: [],
            transactionsList: []
        };
        
        this.chartInstances = {};
        this.updateInterval = null;
        this.isConnected = false;
        
        this.init();
    }
    
    async init() {
        this.setupCharts();
        await this.connectToBackend();
        this.updateDisplay();
        this.startRealTimeUpdates();
    }
    
    setupCharts() {
        // Sentiment Chart
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        this.chartInstances.sentiment = new Chart(sentimentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#00ff88', '#a0a7c0', '#ff4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e7ff'
                        }
                    }
                }
            }
        });
        
        // Price Chart
        const priceCtx = document.getElementById('priceChart').getContext('2d');
        this.chartInstances.price = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Price (USD)',
                    data: Array(24).fill(0),
                    borderColor: '#00f7ff',
                    backgroundColor: 'rgba(0, 247, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e7ff'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#a0a7c0'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#a0a7c0'
                        }
                    }
                }
            }
        });
    }
    
    async connectToBackend() {
        try {
            const response = await fetch(`${this.backendUrl}/api/status`);
            const status = await response.json();
            
            if (status.status === 'running') {
                this.isConnected = true;
                console.log('Connected to Token Monitor Backend');
                document.getElementById('wallet-status').className = 'status-active';
                document.getElementById('wallet-status').textContent = 'Active (Connected)';
            } else {
                throw new Error('Backend not running properly');
            }
        } catch (error) {
            console.error('Failed to connect to backend:', error);
            this.isConnected = false;
            document.getElementById('wallet-status').className = 'status-inactive';
            document.getElementById('wallet-status').textContent = 'Disconnected';
        }
    }
    
    async fetchRealData() {
        if (!this.isConnected) {
            await this.connectToBackend();
            if (!this.isConnected) return;
        }
        
        try {
            const response = await fetch(`${this.backendUrl}/api/data`);
            const result = await response.json();
            
            if (result.success) {
                // Get the first token's data (assuming we're monitoring the main token)
                const tokenAddresses = Object.keys(result.data);
                if (tokenAddresses.length > 0) {
                    const firstToken = result.data[tokenAddresses[0]];
                    
                    // Update our data with real values
                    this.data.price = firstToken.price || 0;
                    this.data.priceChange = firstToken.priceChange24h || 0;
                    this.data.marketCap = firstToken.marketCap || 0;
                    this.data.volume = firstToken.volume24h || 0;
                    this.data.holders = firstToken.holders || 0;
                    this.data.transactions = firstToken.transactions24h || 0;
                    this.data.uniqueAddresses = firstToken.uniqueAddresses || 0;
                    this.data.activeWallets = firstToken.activeWallets || 0;
                    this.data.moltbookMentions = firstToken.moltbookMentions || 0;
                    this.data.moltxMentions = firstToken.moltxMentions || 0;
                    this.data.discordActivity = firstToken.discordActivity || 0;
                    this.data.fourclawActivity = firstToken.fourclawActivity || 0;
                    this.data.wethFees = firstToken.wethFees || 0;
                    this.data.transactionsList = firstToken.transactionsList || [];
                    
                    // Update price history chart
                    if (firstToken.historicalPrices && firstToken.historicalPrices.length > 0) {
                        this.updatePriceChart(firstToken.historicalPrices);
                    }
                    
                    this.updateDisplay();
                }
            }
        } catch (error) {
            console.error('Error fetching data from backend:', error);
            // Don't show error to user, just try to reconnect
            this.isConnected = false;
        }
    }
    
    updatePriceChart(historicalPrices) {
        if (!this.chartInstances.price || !historicalPrices || historicalPrices.length === 0) return;
        
        // Get the last 24 hours of data
        const recentData = historicalPrices.slice(-24);
        const labels = recentData.map((_, i) => `${i + (24 - recentData.length)}:00`);
        const prices = recentData.map(d => d.price);
        
        // Update the chart data
        this.chartInstances.price.data.labels = labels;
        this.chartInstances.price.data.datasets[0].data = prices;
        this.chartInstances.price.update();
    }
    
    updateDisplay() {
        // Update token metrics
        document.getElementById('token-price').textContent = this.data.price ? `$${this.data.price.toFixed(6)}` : '$0.000000';
        document.getElementById('price-change').textContent = `${this.data.priceChange >= 0 ? '+' : ''}${this.data.priceChange.toFixed(2)}%`;
        document.getElementById('price-change').className = `value ${this.data.priceChange >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('market-cap').textContent = this.data.marketCap ? `$${this.formatNumber(this.data.marketCap)}` : '$0.00';
        document.getElementById('volume').textContent = this.data.volume ? `$${this.formatNumber(this.data.volume)}` : '$0.00';
        
        // Update social metrics
        document.getElementById('moltbook-count').textContent = this.data.moltbookMentions;
        document.getElementById('moltx-count').textContent = this.data.moltxMentions;
        document.getElementById('discord-count').textContent = this.data.discordActivity;
        document.getElementById('fourclaw-count').textContent = this.data.fourclawActivity;
        
        // Update network metrics
        document.getElementById('holders-count').textContent = this.data.holders;
        document.getElementById('tx-count').textContent = this.data.transactions;
        document.getElementById('unique-addresses').textContent = this.data.uniqueAddresses;
        document.getElementById('active-wallets').textContent = this.data.activeWallets;
        
        // Update trading activity
        document.getElementById('clawnch-activity').textContent = `${this.data.fourclawActivity} txs`;
        document.getElementById('base-activity').textContent = `${this.data.transactions} txs`;
        document.getElementById('weth-fees').textContent = `${this.data.wethFees.toFixed(4)} WETH`;
        
        // Update transactions list
        this.updateTransactionsList();
    }
    
    updateTransactionsList() {
        const container = document.getElementById('transactions-list');
        container.innerHTML = '';
        
        if (this.data.transactionsList.length === 0) {
            container.innerHTML = '<div class="transaction-item">No recent transactions</div>';
            return;
        }
        
        // Show the 10 most recent transactions
        this.data.transactionsList.slice(0, 10).forEach(tx => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            // Determine type class
            let typeClass = 'type-transfer';
            if (tx.type === 'buy') typeClass = 'type-buy';
            else if (tx.type === 'sell') typeClass = 'type-sell';
            
            item.innerHTML = `
                <div>
                    <span class="transaction-type ${typeClass}">${tx.type.toUpperCase()}</span>
                    <span>${parseFloat(tx.amount).toFixed(2)} tokens</span>
                </div>
                <div class="transaction-details">
                    <div>${tx.value}</div>
                    <div class="time">${new Date(tx.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    startRealTimeUpdates() {
        // Update immediately
        this.fetchRealData();
        
        // Then update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.fetchRealData();
        }, 30000); // Update every 30 seconds
    }
    
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }
    
    // Manual refresh function
    async manualRefresh() {
        console.log('Manual refresh triggered');
        await this.fetchRealData();
    }
    
    // Cleanup function
    destroy() {
        this.stopRealTimeUpdates();
    }
}

// Initialize the real-time monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeMonitor = new RealTimeTokenMonitor();
    
    // Add manual refresh button functionality
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Data';
    refreshButton.style.position = 'fixed';
    refreshButton.style.top = '10px';
    refreshButton.style.right = '10px';
    refreshButton.style.zIndex = '1000';
    refreshButton.style.padding = '8px 16px';
    refreshButton.style.backgroundColor = '#00f7ff';
    refreshButton.style.color = '#000';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '4px';
    refreshButton.style.cursor = 'pointer';
    
    refreshButton.onclick = () => {
        window.realTimeMonitor.manualRefresh();
    };
    
    document.body.appendChild(refreshButton);
});

// Handle page visibility changes to pause/resume updates
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause updates to save resources
        if (window.realTimeMonitor && window.realTimeMonitor.updateInterval) {
            window.realTimeMonitor.stopRealTimeUpdates();
        }
    } else {
        // Page is visible again, resume updates
        if (window.realTimeMonitor) {
            window.realTimeMonitor.startRealTimeUpdates();
        }
    }
});