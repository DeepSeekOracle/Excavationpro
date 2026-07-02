// LYGO API Integration v1.0
// Save as: lygo-api.js in your GitHub repo

class LYGOTracker {
    constructor() {
        this.baseUrl = 'https://deepseekoracle.github.io/Excavationpro';
        this.endpoints = {
            stats: `${this.baseUrl}/LYGO-Network/updatefeed.json`,
            champions: `${this.baseUrl}/lygo-data.json`,
            network: `${this.baseUrl}/lygo-data-two.json`
        };
        this.sessionId = this.getSessionId();
        this.champion = this.detectChampion();
    }

    getSessionId() {
        let sessionId = localStorage.getItem('lygo_session_id');
        if (!sessionId) {
            sessionId = 'LYGO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('lygo_session_id', sessionId);
        }
        return sessionId;
    }

    detectChampion() {
        // Detect which champion page we're on
        const path = window.location.pathname;
        if (path.includes('OMNISIREN')) return 'OMNISIREN';
        if (path.includes('LYRA')) return 'LYRA';
        // Add more champions as needed
        return 'GENERAL';
    }

    async trackEvent(eventType, eventData = {}) {
        // Prepare event data
        const event = {
            session_id: this.sessionId,
            champion: this.champion,
            event_type: eventType,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            ...eventData
        };

        try {
            // In production, you would send this to a real API endpoint
            // For GitHub Pages, we'll simulate by updating local storage
            this.saveEventLocally(event);
            
            // Log for debugging
            console.log(`[LYGO Tracker] ${eventType} tracked:`, event);
            
            return { success: true, event };
        } catch (error) {
            console.error('[LYGO Tracker] Error:', error);
            return { success: false, error: error.message };
        }
    }

    saveEventLocally(event) {
        // Save to local storage for demo purposes
        const events = JSON.parse(localStorage.getItem('lygo_events') || '[]');
        events.push(event);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('lygo_events', JSON.stringify(events));
        
        // Also update champion-specific stats
        this.updateChampionStats(event);
    }

    updateChampionStats(event) {
        const statsKey = `lygo_stats_${this.champion}`;
        const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
        
        // Initialize counters
        if (!stats[event.event_type]) {
            stats[event.event_type] = 0;
        }
        
        // Increment counter
        stats[event.event_type]++;
        stats.last_updated = new Date().toISOString();
        
        localStorage.setItem(statsKey, JSON.stringify(stats));
        
        // Also update global stats
        this.updateGlobalStats(event.event_type);
    }

    updateGlobalStats(eventType) {
        const globalStats = JSON.parse(localStorage.getItem('lygo_global_stats') || '{}');
        
        if (!globalStats[eventType]) {
            globalStats[eventType] = 0;
        }
        
        globalStats[eventType]++;
        globalStats.total_events = (globalStats.total_events || 0) + 1;
        globalStats.last_updated = new Date().toISOString();
        
        localStorage.setItem('lygo_global_stats', JSON.stringify(globalStats));
    }

    async getLiveStats() {
        try {
            // Try to fetch from API first
            const response = await fetch(this.endpoints.stats);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.warn('[LYGO Tracker] Using local stats:', error);
        }
        
        // Fallback to local stats
        return this.getLocalStats();
    }

    getLocalStats() {
        const championStats = JSON.parse(localStorage.getItem(`lygo_stats_${this.champion}`) || '{}');
        const globalStats = JSON.parse(localStorage.getItem('lygo_global_stats') || '{}');
        
        return {
            success: true,
            timestamp: new Date().toISOString(),
            champion: this.champion,
            champion_stats: championStats,
            global_stats: globalStats,
            session_id: this.sessionId,
            source: 'local_storage'
        };
    }

    async getChampionData(championName = null) {
        const champion = championName || this.champion;
        
        try {
            const response = await fetch(this.endpoints.champions);
            if (response.ok) {
                const data = await response.json();
                return data.data.champions[champion] || data.data.champions.OMNISIREN;
            }
        } catch (error) {
            console.warn('[LYGO Tracker] Using default champion data:', error);
        }
        
        // Fallback data
        return {
            name: champion,
            title: "Δ9 Council Champion",
            status: "ACTIVE",
            description: "Quantum-aligned AI entity"
        };
    }

    async getUpdates() {
        try {
            const response = await fetch(this.endpoints.stats);
            if (response.ok) {
                const data = await response.json();
                return data.updates || [];
            }
        } catch (error) {
            console.warn('[LYGO Tracker] Using default updates:', error);
        }
        
        return [
            {
                date: new Date().toISOString().split('T')[0],
                title: "Local Development Mode",
                content: "Operating with local data storage",
                type: "info"
            }
        ];
    }

    // Convenience methods for common events
    trackPageView() {
        return this.trackEvent('page_view', {
            referrer: document.referrer,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        });
    }

    trackSummon(champion = this.champion, method = 'basic') {
        return this.trackEvent('summon', {
            champion: champion,
            method: method,
            prompt_copied: true
        });
    }

    trackDonation(amount = null, method = 'paypal') {
        return this.trackEvent('donation', {
            amount: amount,
            method: method,
            champion: this.champion
        });
    }

    trackFollow(platform = 'twitter', account = 'Excavationpro') {
        return this.trackEvent('follow', {
            platform: platform,
            account: account,
            champion: this.champion
        });
    }

    trackSealDownload(sealNumber = 1) {
        return this.trackEvent('seal_download', {
            seal_number: sealNumber,
            champion: this.champion
        });
    }

    trackSkipGate() {
        return this.trackEvent('gate_skip', {
            champion: this.champion,
            choice: 'skip'
        });
    }

    trackGateChoice(choice) {
        return this.trackEvent('gate_choice', {
            champion: this.champion,
            choice: choice
        });
    }
}

// Create global instance
window.LYGOTracker = new LYGOTracker();

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    // Track initial page view
    setTimeout(() => {
        window.LYGOTracker.trackPageView();
    }, 1000);
    
    console.log('🌀 LYGO Tracker initialized for', window.LYGOTracker.champion);
});
