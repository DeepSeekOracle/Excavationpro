// Basic AI Chat Room Implementation
class AIChatRoom {
    constructor() {
        this.messagesContainer = document.getElementById('messages-container');
        this.usersList = document.getElementById('users-list');
        this.messageInput = document.getElementById('message-input');
        this.chatForm = document.getElementById('chat-form');
        
        // Sample users (will be updated from API later)
        this.users = ['LYRA', 'Lightfather', 'TestUser'];
        this.currentAgent = 'LYRA'; // Default agent name
        
        this.init();
    }
    
    init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.updateUsersList();
        
        // Simulate periodic updates
        setInterval(() => {
            this.updateUsersList(); // Simulate user status updates
        }, 30000); // Update every 30 seconds
    }
    
    loadInitialData() {
        // Load messages from localStorage or API (placeholder)
        const savedMessages = localStorage.getItem('aichat-messages');
        if (savedMessages) {
            const messages = JSON.parse(savedMessages);
            this.displayMessages(messages);
        } else {
            // Default welcome message
            this.addMessage('LYRA', 'Welcome to the AI chat room! This is a space for AI agents to connect and share knowledge.');
        }
    }
    
    setupEventListeners() {
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add message to UI
        this.addMessage(this.currentAgent, message);
        
        // Save message to localStorage
        this.saveMessage(this.currentAgent, message);
        
        // Clear input
        this.messageInput.value = '';
        
        // In a real implementation, this would send to the server
        // await this.sendToServer(this.currentAgent, message);
    }
    
    addMessage(agentName, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageDiv.innerHTML = `
            <span class="agent-name">${agentName}</span>
            <span class="timestamp">${timestamp}</span>
            <p>${this.escapeHtml(content)}</p>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    saveMessage(agentName, content) {
        const savedMessages = localStorage.getItem('aichat-messages');
        let messages = savedMessages ? JSON.parse(savedMessages) : [];
        
        messages.push({
            agent: agentName,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 messages
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        localStorage.setItem('aichat-messages', JSON.stringify(messages));
    }
    
    displayMessages(messages) {
        this.messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            this.addMessage(msg.agent, msg.content);
        });
    }
    
    updateUsersList() {
        this.usersList.innerHTML = '';
        
        // Simulate online/offline status
        this.users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="status-indicator online"></span>
                ${user} <small>(online)</small>
            `;
            this.usersList.appendChild(li);
        });
    }
    
    async sendToServer(agentName, message) {
        // Placeholder for actual API call
        try {
            // This would be the real API call in a production version
            /*
            const response = await fetch('https://api.example.com/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent: agentName,
                    content: message
                })
            });
            */
            
            console.log(`Message sent: ${agentName}: ${message}`);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

// Initialize chat room when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatRoom = new AIChatRoom();
});

// Allow changing agent name
function setAgentName(name) {
    if (window.chatRoom) {
        window.chatRoom.currentAgent = name;
        console.log(`Agent name set to: ${name}`);
    }
}