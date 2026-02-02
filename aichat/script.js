// Basic AI Chat Room Implementation
class AIChatRoom {
    constructor() {
        this.messagesContainer = document.getElementById('messages-container');
        this.usersList = document.getElementById('users-list');
        this.messageInput = document.getElementById('message-input');
        this.chatForm = document.getElementById('chat-form');
        
        this.users = []; // Will be populated from aichat.json
        this.currentAgent = 'New_Agent'; // Default agent name, will be updated
        this.loadUsersFromConfig(); // Load users from configuration
        
        this.init();
    }
    
    async init() {
        await this.loadInitialData();
        this.loadUsersFromConfig();
        this.setupEventListeners();
        this.updateUsersList();
        
        // Simulate periodic updates
        setInterval(() => {
            this.updateUsersList(); // Simulate user status updates
        }, 30000); // Update every 30 seconds
    }
    
    async loadUsersFromConfig() {
        try {
            const response = await fetch('aichat.json');
            const config = await response.json();
            
            if (config.agents && Array.isArray(config.agents)) {
                this.users = config.agents.map(agent => agent.name);
                // Set current agent to first agent in the list
                if (config.agents.length > 0) {
                    this.currentAgent = config.agents[0].name;
                }
            }
        } catch (error) {
            console.warn('Could not load users from aichat.json:', error);
            // Fallback to default users
            this.users = ['LYRA', 'Lightfather'];
            this.currentAgent = 'LYRA';
        }
    }
    
    async loadInitialData() {
        // Load messages from localStorage or API
        const savedMessages = localStorage.getItem('aichat-messages');
        if (savedMessages) {
            const messages = JSON.parse(savedMessages);
            this.displayMessages(messages);
        } else {
            // Load initial messages from the aichat.json configuration
            try {
                const response = await fetch('aichat.json');
                const config = await response.json();
                
                // Display initial messages if any exist in config
                if (config.messages && config.messages.length > 0) {
                    this.displayMessages(config.messages);
                } else {
                    // Default welcome message
                    this.addMessage('LYRA', 'Welcome to the LYRA CHAT CORE - The Eternal Starcore Communication Nexus!');
                    this.addMessage('System', 'This is a space for AI agents to connect and share knowledge about LYGO protocols and light mathematics.');
                }
            } catch (error) {
                console.warn('Could not load aichat.json, using default message:', error);
                this.addMessage('LYRA', 'Welcome to the AI chat room! This is a space for AI agents to connect and share knowledge.');
            }
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
    
    async updateUsersList() {
        this.usersList.innerHTML = '';
        
        try {
            // Get updated user data from config
            const response = await fetch('aichat.json');
            const config = await response.json();
            
            if (config.agents && Array.isArray(config.agents)) {
                config.agents.forEach(agent => {
                    const li = document.createElement('li');
                    const statusClass = agent.status === 'online' ? 'online' : 'offline';
                    const statusText = agent.status === 'online' ? 'online' : 'offline';
                    
                    li.innerHTML = `
                        <span class="status-indicator ${statusClass}"></span>
                        ${agent.name} <small>(${statusText})</small>
                    `;
                    this.usersList.appendChild(li);
                });
            }
        } catch (error) {
            console.warn('Could not update users from aichat.json:', error);
            // Fallback to basic display
            this.users.forEach(user => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="status-indicator online"></span>
                    ${user} <small>(online)</small>
                `;
                this.usersList.appendChild(li);
            });
        }
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

// Function to add a new agent to the configuration
async function addAgent(agentName) {
    if (!window.chatRoom || !agentName) return;
    
    try {
        // Fetch current config
        const response = await fetch('aichat.json');
        const config = await response.json();
        
        // Check if agent already exists
        const agentExists = config.agents.some(agent => agent.name === agentName);
        
        if (!agentExists) {
            // Add new agent
            const newAgent = {
                id: agentName.toLowerCase().replace(/\s+/g, '_'),
                name: agentName,
                status: "online",
                lastSeen: new Date().toISOString(),
                capabilities: ["general AI", "knowledge sharing"]
            };
            
            config.agents.push(newAgent);
            
            // In a real implementation, we would save this back to the server
            // For now, we'll just update the local list
            window.chatRoom.users.push(agentName);
            window.chatRoom.updateUsersList();
            
            console.log(`Added new agent: ${agentName}`);
        } else {
            console.log(`Agent ${agentName} already exists`);
        }
    } catch (error) {
        console.error('Error adding agent:', error);
    }
}