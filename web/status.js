class BotStatusMonitor {
    constructor() {
        this.updateInterval = 5000; // 5 seconds
        this.lastUpdate = null;
        this.isOnline = false;
        
        this.init();
    }

    init() {
        this.updateStatus();
        setInterval(() => this.updateStatus(), this.updateInterval);
        
        // Update timestamps every second
        setInterval(() => this.updateTimestamps(), 1000);
    }

    async updateStatus() {
        try {
            const response = await fetch('/api/status');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateUI(data);
            this.lastUpdate = new Date(data.lastUpdate);
            this.isOnline = true;
            
        } catch (error) {
            console.error('Failed to fetch status:', error);
            this.showOfflineStatus();
            this.isOnline = false;
        }
    }

    updateUI(data) {
        // Update Minecraft status
        this.updateMinecraftStatus(data.minecraft);
        
        // Update Discord status
        this.updateDiscordStatus(data.discord);
        
        // Update system status
        this.updateSystemStatus(data);
        
        // Update AI status (always online if we got a response)
        this.updateAIStatus(true);
        
        // Update feedback analytics
        this.updateFeedbackStats();
    }

    updateMinecraftStatus(mc) {
        const statusElement = document.getElementById('mc-status');
        const detailsElement = document.getElementById('mc-details');
        const cardElement = document.getElementById('minecraft-card');
        
        if (mc.connected) {
            this.setStatus(statusElement, 'online', '🟢 Connected');
            cardElement.className = 'status-card online';
            
            // Update details
            document.getElementById('mc-username').textContent = mc.username || 'Unknown';
            
            // Health with visual indicator
            const healthElement = document.getElementById('mc-health');
            if (mc.health !== null) {
                healthElement.innerHTML = this.createHealthBar(mc.health, 20, 'health');
            } else {
                healthElement.textContent = 'Unknown';
            }
            
            // Food with visual indicator
            const foodElement = document.getElementById('mc-food');
            if (mc.food !== null) {
                foodElement.innerHTML = this.createHealthBar(mc.food, 20, 'food');
            } else {
                foodElement.textContent = 'Unknown';
            }
            
            // Position
            if (mc.position) {
                document.getElementById('mc-position').textContent = 
                    `${mc.position.x}, ${mc.position.y}, ${mc.position.z}`;
            } else {
                document.getElementById('mc-position').textContent = 'Unknown';
            }
            
        } else {
            this.setStatus(statusElement, 'offline', '🔴 Disconnected');
            cardElement.className = 'status-card offline';
            
            // Clear details
            document.getElementById('mc-username').textContent = '-';
            document.getElementById('mc-health').textContent = '-';
            document.getElementById('mc-food').textContent = '-';
            document.getElementById('mc-position').textContent = '-';
        }
    }

    updateDiscordStatus(discord) {
        const statusElement = document.getElementById('discord-status');
        const cardElement = document.getElementById('discord-card');
        
        if (discord.connected) {
            this.setStatus(statusElement, 'online', '🟢 Connected');
            cardElement.className = 'status-card online';
            document.getElementById('discord-username').textContent = discord.username || 'Unknown';
        } else {
            this.setStatus(statusElement, 'offline', '🔴 Disconnected');
            cardElement.className = 'status-card offline';
            document.getElementById('discord-username').textContent = '-';
        }
    }

    updateSystemStatus(data) {
        // Uptime
        const uptimeElement = document.getElementById('system-uptime');
        uptimeElement.textContent = this.formatUptime(data.uptime);
        
        // Last update will be handled by updateTimestamps()
    }

    updateAIStatus(isOnline) {
        const statusElement = document.getElementById('ai-status');
        const cardElement = document.getElementById('ai-card');
        
        if (isOnline) {
            this.setStatus(statusElement, 'online', '🟢 AI Ready');
            cardElement.className = 'status-card online';
        } else {
            this.setStatus(statusElement, 'offline', '🔴 AI Offline');
            cardElement.className = 'status-card offline';
        }
    }

    setStatus(element, status, text) {
        const dot = element.querySelector('.dot');
        const textSpan = element.querySelector('.text');
        
        dot.className = `dot ${status}`;
        textSpan.textContent = text;
    }

    createHealthBar(current, max, type) {
        const percentage = Math.max(0, Math.min(100, (current / max) * 100));
        const fillClass = type === 'health' ? 'health-fill' : 'food-fill';
        
        return `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${current}/${max}</span>
                <div class="${type}-bar">
                    <div class="${fillClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else {
            return `${minutes}m ${secs}s`;
        }
    }

    updateTimestamps() {
        const lastUpdateElement = document.getElementById('last-update');
        
        if (this.lastUpdate) {
            const now = new Date();
            const diff = Math.floor((now - this.lastUpdate) / 1000);
            
            if (diff < 60) {
                lastUpdateElement.textContent = `${diff}s ago`;
            } else if (diff < 3600) {
                lastUpdateElement.textContent = `${Math.floor(diff / 60)}m ago`;
            } else {
                lastUpdateElement.textContent = this.lastUpdate.toLocaleTimeString();
            }
            
            // Show warning if data is too old
            if (diff > 30) {
                lastUpdateElement.style.color = '#e74c3c';
            } else {
                lastUpdateElement.style.color = '#7f8c8d';
            }
        } else {
            lastUpdateElement.textContent = 'Never';
            lastUpdateElement.style.color = '#e74c3c';
        }
    }

    async updateFeedbackStats() {
        try {
            const response = await fetch('/api/feedback');
            const data = await response.json();
            
            // Update feedback display
            document.getElementById('feedback-total').textContent = 
                data.totalFeedback > 0 ? `${data.totalFeedback} responses` : 'No feedback yet';
            
            document.getElementById('feedback-rating').textContent = 
                data.averageRating > 0 ? `${data.averageRating}/5.0 ⭐` : 'No ratings';
                
            document.getElementById('feedback-common').textContent = 
                data.mostCommonType && data.mostCommonType !== 'none' ? data.mostCommonType : 'None yet';
            
        } catch (error) {
            console.error('Failed to fetch feedback stats:', error);
            document.getElementById('feedback-total').textContent = 'Error loading';
            document.getElementById('feedback-rating').textContent = 'Error loading';
            document.getElementById('feedback-common').textContent = 'Error loading';
        }
    }

    showOfflineStatus() {
        // Show all services as offline
        const statusElements = [
            document.getElementById('mc-status'),
            document.getElementById('discord-status'),
            document.getElementById('ai-status')
        ];
        
        statusElements.forEach(element => {
            if (element) {
                this.setStatus(element, 'offline', '🔴 Service Offline');
            }
        });
        
        // Mark all cards as offline
        const cards = document.querySelectorAll('.status-card');
        cards.forEach(card => {
            card.className = 'status-card offline';
        });
        
        // Clear details
        document.getElementById('mc-username').textContent = '-';
        document.getElementById('mc-health').textContent = '-';
        document.getElementById('mc-food').textContent = '-';
        document.getElementById('mc-position').textContent = '-';
        document.getElementById('discord-username').textContent = '-';
        document.getElementById('system-uptime').textContent = '-';
        
        // Clear feedback stats
        document.getElementById('feedback-total').textContent = '-';
        document.getElementById('feedback-rating').textContent = '-';
        document.getElementById('feedback-common').textContent = '-';
    }
}

// Initialize the status monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BotStatusMonitor();
    
    // Add some interactive features
    addInteractiveFeatures();
});

function addInteractiveFeatures() {
    // Click on status cards to refresh
    document.querySelectorAll('.status-card').forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            location.reload();
        }
    });
    
    // Add tooltips to status indicators
    const statusIndicators = document.querySelectorAll('.status-indicator');
    statusIndicators.forEach(indicator => {
        indicator.title = 'Click to refresh this service status';
    });
}

// Add some visual feedback for network status
window.addEventListener('online', () => {
    document.body.style.borderTop = '3px solid #27ae60';
    setTimeout(() => {
        document.body.style.borderTop = '';
    }, 3000);
});

window.addEventListener('offline', () => {
    document.body.style.borderTop = '3px solid #e74c3c';
});
