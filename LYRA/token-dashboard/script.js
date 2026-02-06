// LYRA Token Monitor - JavaScript
class TokenMonitor {
    constructor() {
        this.data = {
            price: 0.000000,
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
        this.init();
    }
    
    init() {
        this.setupCharts();
        this.updateDisplay();
        this.startRealTimeUpdates();
        this.loadHistoricalData();
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
    
    async loadHistoricalData() {
        // Simulate loading historical data
        this.data.priceHistory = Array.from({length: 24}, (_, i) => ({
            time: `${i}:00`,
            price: 0.000001 + Math.random() * 0.000002
        }));
        
        this.generateSampleTransactions();
        this.updateDisplay();
    }
    
    generateSampleTransactions() {
        const types = ['buy', 'sell', 'transfer'];
        const platforms = ['4claw', 'Base', 'Other'];
        
        this.data.transactionsList = Array.from({length: 15}, (_, i) => ({
            id: `tx_${Date.now()}_${i}`,
            type: types[Math.floor(Math.random() * types.length)],
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            amount: (Math.random() * 1000).toFixed(2),
            value: `$${(Math.random() * 10).toFixed(4)}`,
            time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
            from: `0x${Math.random().toString(36).substr(2, 6)}...${Math.random().toString(36).substr(2, 4)}`,
            to: `0x${Math.random().toString(36).substr(2, 6)}...${Math.random().toString(36).substr(2, 4)}`
        }));
    }
    
    updateDisplay() {
        // Update token metrics
        document.getElementById('token-price').textContent = `$${this.data.price.toFixed(6)}`;
        document.getElementById('price-change').textContent = `${this.data.priceChange >= 0 ? '+' : ''}${this.data.priceChange.toFixed(2)}%`;
        document.getElementById('price-change').className = `value ${this.data.priceChange >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('market-cap').textContent = `$${this.formatNumber(this.data.marketCap)}`;
        document.getElementById('volume').textContent = `$${this.formatNumber(this.data.volume)}`;
        
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
        
        this.data.transactionsList.slice(0, 10).forEach(tx => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
                <div>
                    <span class="transaction-type type-${tx.type}">${tx.type.toUpperCase()}</span>
                    <span>${tx.amount} tokens</span>
                </div>
                <div class="transaction-details">
                    <div>${tx.value}</div>
                    <div class="time">${tx.time}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }
    
    updateCharts() {
        // Update price chart with simulated data
        const newPrice = 0.000001 + Math.random() * 0.000002;
        const priceData = this.chartInstances.price.data.datasets[0].data;
        priceData.shift();
        priceData.push(newPrice);
        
        this.chartInstances.price.update();
    }
    
    simulateDataUpdate() {
        // Simulate real-time data updates
        this.data.price = 0.000001 + Math.random() * 0.000002;
        this.data.priceChange = (Math.random() - 0.5) * 10;
        this.data.marketCap = Math.random() * 1000000;
        this.data.volume = Math.random() * 50000;
        this.data.holders = Math.floor(Math.random() * 10000) + 1000;
        this.data.transactions = Math.floor(Math.random() * 5000) + 100;
        this.data.uniqueAddresses = Math.floor(Math.random() * 8000) + 500;
        this.data.activeWallets = Math.floor(Math.random() * 3000) + 200;
        this.data.moltbookMentions = Math.floor(Math.random() * 100) + 10;
        this.data.moltxMentions = Math.floor(Math.random() * 80) + 5;
        this.data.discordActivity = Math.floor(Math.random() * 60) + 15;
        this.data.fourclawActivity = Math.floor(Math.random() * 40) + 20;
        this.data.wethFees = Math.random() * 5;
        
        // Occasionally add a new transaction
        if (Math.random() > 0.7) {
            const types = ['buy', 'sell', 'transfer'];
            const platforms = ['4claw', 'Base', 'Other'];
            
            this.data.transactionsList.unshift({
                id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                type: types[Math.floor(Math.random() * types.length)],
                platform: platforms[Math.floor(Math.random() * platforms.length)],
                amount: (Math.random() * 1000).toFixed(2),
                value: `$${(Math.random() * 10).toFixed(4)}`,
                time: new Date().toLocaleTimeString(),
                from: `0x${Math.random().toString(36).substr(2, 6)}...${Math.random().toString(36).substr(2, 4)}`,
                to: `0x${Math.random().toString(36).substr(2, 6)}...${Math.random().toString(36).substr(2, 4)}`
            });
            
            // Keep only the last 50 transactions
            if (this.data.transactionsList.length > 50) {
                this.data.transactionsList = this.data.transactionsList.slice(0, 50);
            }
        }
        
        this.updateDisplay();
        this.updateCharts();
    }
    
    startRealTimeUpdates() {
        setInterval(() => {
            this.simulateDataUpdate();
        }, 3000); // Update every 3 seconds
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }
    
    // API methods for integration with backend services
    async fetchTokenData() {
        // Placeholder for actual API integration
        try {
            // This would connect to actual blockchain/token APIs
            // For now, we're simulating the data
            console.log("Fetching real token data...");
        } catch (error) {
            console.error("Error fetching token data:", error);
        }
    }
    
    async fetchSocialSentiment() {
        // Placeholder for social media monitoring APIs
        try {
            // This would connect to social media monitoring services
            console.log("Fetching social sentiment...");
        } catch (error) {
            console.error("Error fetching social sentiment:", error);
        }
    }
    
    async fetchTransactionData() {
        // Placeholder for blockchain transaction data
        try {
            // This would connect to blockchain explorers/APIs
            console.log("Fetching transaction data...");
        } catch (error) {
            console.error("Error fetching transaction data:", error);
        }
    }
}

// Initialize the monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tokenMonitor = new TokenMonitor();
});

// Additional utility functions for potential backend integration
const API = {
    async getWalletBalance(walletAddress) {
        // Placeholder for wallet balance API
        return {
            balance: Math.random() * 100,
            change24h: (Math.random() - 0.5) * 10
        };
    },
    
    async getTokenMetrics(tokenAddress) {
        // Placeholder for token metrics API
        return {
            price: 0.000001 + Math.random() * 0.000002,
            marketCap: Math.random() * 1000000,
            volume24h: Math.random() * 50000
        };
    },
    
    async getSocialAnalytics(platform) {
        // Placeholder for social analytics API
        return {
            mentions: Math.floor(Math.random() * 100),
            sentiment: Math.random() * 100,
            engagement: Math.floor(Math.random() * 50)
        };
    }
};