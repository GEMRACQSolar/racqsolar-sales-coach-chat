<template>
  <div class="sales-coach-wrapper">
    <!-- Chat Container -->
    <div 
      v-if="isVisible" 
      :class="['sales-coach-container', { 'sales-coach-minimized': isMinimized }]"
    >
      <!-- Header -->
      <div class="sales-coach-header">
        <div class="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <h3>Sales Coach</h3>
        </div>
        <div class="header-controls">
          <button @click="toggleMinimize" class="control-btn">
            <svg v-if="!isMinimized" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button @click="closeChat" class="control-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Chat Content (hidden when minimized) -->
      <template v-if="!isMinimized">
        <!-- Messages Container -->
        <div class="sales-coach-messages" ref="messagesContainer">
          <div 
            v-for="msg in chatHistory" 
            :key="msg.id" 
            :class="['message', msg.role]"
          >
            <div class="message-content">{{ msg.content }}</div>
          </div>
          
          <!-- Loading Indicator -->
          <div v-if="isLoading" class="loading-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        
        <!-- Suggested Questions -->
        <div 
          v-if="lastAssistantMessage && lastAssistantMessage.suggestedQuestions && !isLoading" 
          class="suggested-questions"
        >
          <button 
            v-for="(question, index) in lastAssistantMessage.suggestedQuestions" 
            :key="index"
            @click="sendMessage(question)" 
            class="suggestion-btn"
          >
            {{ question }}
          </button>
        </div>
        
        <!-- Input Area -->
        <div class="sales-coach-input">
          <input 
            v-model="currentMessage" 
            @keyup.enter="sendMessage(currentMessage)"
            placeholder="Ask your question..."
            :disabled="isLoading"
            class="message-input"
          >
          <button 
            @click="sendMessage(currentMessage)" 
            :disabled="!currentMessage.trim() || isLoading"
            class="send-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true }
  },
  
  emits: [
    'update:content',
    'trigger-event'
  ],
  
  mounted() {
    console.log('🚀 Sales Coach Component Mounted');
    console.log('📦 Full content object:', JSON.stringify(this.content, null, 2));
    console.log('🔍 Initial Response:', this.content.initialResponse);
    console.log('🔍 Initial Response type:', typeof this.content.initialResponse);
    console.log('🔍 Package Data:', this.content.packageData);
    console.log('🔍 Show Chat:', this.content.showChat);
    
    // TEMPORARY TEST: Simulate receiving data
    if (!this.content.showChat && !this.content.initialResponse) {
      console.log('🧪 TEST MODE: Simulating data reception');
      setTimeout(() => {
        this.testWithMockData();
      }, 2000);
    }
  },
  
  data() {
    return {
      isVisible: false,
      isMinimized: false,
      isLoading: false,
      chatHistory: [],
      currentMessage: '',
      hasInitialized: false
    }
  },
  
  computed: {
    lastAssistantMessage() {
      const assistantMessages = this.chatHistory.filter(msg => msg.role === 'assistant');
      return assistantMessages[assistantMessages.length - 1] || null;
    }
  },
  
  watch: {
    'content.showChat': {
      handler(newVal) {
        console.log('👀 Show Chat changed to:', newVal);
        if (newVal && !this.isVisible) {
          this.openChat();
        } else if (!newVal && this.isVisible) {
          this.closeChat();
        }
      },
      immediate: true
    },
    
    // Watch for initial response from workflow
    'content.initialResponse': {
      handler(newVal) {
        console.log('📨 Initial Response watcher triggered');
        console.log('📨 New value:', newVal);
        console.log('📨 New value type:', typeof newVal);
        console.log('📨 Is visible?', this.isVisible);
        console.log('📨 Has initialized?', this.hasInitialized);
        
        if (newVal && !this.hasInitialized && this.isVisible) {
          console.log('✅ Processing initial response...');
          this.hasInitialized = true;
          
          // Add the initial response to chat history
          const assistantMessage = {
            id: Date.now(),
            role: 'assistant',
            content: newVal.response || newVal,
            suggestedQuestions: newVal.suggestedQuestions || []
          };
          
          console.log('💬 Assistant message created:', assistantMessage);
          
          this.chatHistory.push(assistantMessage);
          
          this.$emit('trigger-event', {
            name: 'initial:response:displayed',
            event: {
              response: assistantMessage.content,
              timestamp: new Date().toISOString()
            }
          });
          
          this.$nextTick(() => this.scrollToBottom());
        }
      },
      immediate: true
    }
  },
  
  methods: {
    // TEST METHOD - UPDATED
    testWithMockData() {
      console.log('🧪 Running test with mock data');
      console.log('🧪 Before test - isVisible:', this.isVisible);
      
      // Simulate showChat being true
      this.isVisible = true;
      this.isMinimized = false;
      
      console.log('🧪 After setting - isVisible:', this.isVisible);
      
      // Simulate initial response
      const mockResponse = {
        response: "TEST: Hello! I'm your RACQ Solar Sales Coach. This is a test message to verify the component is working correctly.",
        suggestedQuestions: [
          "How do solar panels work?",
          "What's included in my quote?",
          "Tell me about the warranty"
        ]
      };
      
      this.hasInitialized = true;
      this.chatHistory.push({
        id: Date.now(),
        role: 'assistant',
        content: mockResponse.response,
        suggestedQuestions: mockResponse.suggestedQuestions
      });
      
      // Force Vue to update
      this.$forceUpdate();
      
      console.log('✅ Test data loaded successfully');
      console.log('🧪 Final state - isVisible:', this.isVisible);
      console.log('🧪 Chat history length:', this.chatHistory.length);
      
      // Also try nextTick to ensure DOM updates
      this.$nextTick(() => {
        console.log('🧪 After nextTick - DOM should be updated');
        const chatElement = document.querySelector('.sales-coach-container');
        console.log('🧪 Chat element found:', !!chatElement);
      });
    },
    
    openChat() {
      console.log('📂 Opening chat...');
      console.log('📂 Initial Response at open:', this.content.initialResponse);
      console.log('📂 Has initialized?', this.hasInitialized);
      
      this.isVisible = true;
      this.isMinimized = false;
      
      this.$emit('trigger-event', {
        name: 'chat:opened',
        event: { timestamp: new Date().toISOString() }
      });
      
      // Check if we have an initial response to display
      if (!this.hasInitialized && this.content.initialResponse) {
        console.log('🎯 Processing initial response in openChat...');
        this.hasInitialized = true;
        
        const assistantMessage = {
          id: Date.now(),
          role: 'assistant',
          content: this.content.initialResponse.response || this.content.initialResponse,
          suggestedQuestions: this.content.initialResponse.suggestedQuestions || []
        };
        
        console.log('💬 Assistant message in openChat:', assistantMessage);
        
        this.chatHistory.push(assistantMessage);
        
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    
    closeChat() {
      this.isVisible = false;
      this.$emit('update:content', { showChat: false });
      
      this.$emit('trigger-event', {
        name: 'chat:closed',
        event: { timestamp: new Date().toISOString() }
      });
    },
    
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },
    
    async sendMessage(message) {
      if (!message || !message.trim() || this.isLoading) return;
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: message.trim()
      };
      
      this.chatHistory.push(userMessage);
      this.currentMessage = '';
      this.isLoading = true;
      
      this.$emit('trigger-event', {
        name: 'message:sent',
        event: {
          message: message.trim(),
          timestamp: new Date().toISOString()
        }
      });
      
      // Scroll to bottom
      this.$nextTick(() => this.scrollToBottom());
      
      try {
        // Prepare API request
        const requestData = {
          packageData: this.content.packageData || {},
          customerData: this.content.customerData || {},
          message: message.trim(),
          chatHistory: this.chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        };
        
        console.log('📤 Sending API request:', requestData);
        
        // Make API call
        const response = await fetch(this.content.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.content.apiKey}`,
            'apikey': this.content.apiKey
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 API Response:', data);
        
        // Add assistant response
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          suggestedQuestions: data.suggestedQuestions || []
        };
        
        this.chatHistory.push(assistantMessage);
        
        this.$emit('trigger-event', {
          name: 'response:received',
          event: {
            response: data.response,
            suggestedQuestions: data.suggestedQuestions || [],
            timestamp: new Date().toISOString()
          }
        });
        
      } catch (error) {
        console.error('Sales Coach API Error:', error);
        
        // Add error message
        this.chatHistory.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again or contact support if the issue persists.'
        });
        
        this.$emit('trigger-event', {
          name: 'api:error',
          event: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    
    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    }
  }
}
</script>

<style scoped>
.sales-coach-wrapper {
  pointer-events: none;
}

.sales-coach-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  height: 500px;
  background: #1a1a2e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 9999;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s ease;
  pointer-events: all;
}

.sales-coach-minimized {
  height: 60px;
  overflow: hidden;
}

.sales-coach-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #003478;
  border-radius: 12px 12px 0 0;
  color: white;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.control-btn:hover {
  background: rgba(255,255,255,0.1);
}

.sales-coach-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user .message-content {
  background: #003478;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant .message-content {
  background: #2a2a3e;
  color: white;
  border-bottom-left-radius: 4px;
}

.loading-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 10px 15px;
  background: #2a2a3e;
  border-radius: 8px;
}

.typing-dots span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFE600;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

.suggested-questions {
  padding: 10px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  background: #FFE600;
  color: #003478;
  border: none;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  max-width: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-btn:hover {
  background: #ffd500;
  transform: translateY(-1px);
}

.sales-coach-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.message-input {
  flex: 1;
  background: #2a2a3e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 15px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border 0.2s;
}

.message-input:focus {
  border-color: #FFE600;
}

.message-input::placeholder {
  color: rgba(255,255,255,0.5);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: #FFE600;
  color: #003478;
  border: none;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #ffd500;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .sales-coach-container {
    width: 100%;
    height: 70vh;
    bottom: 0;
    right: 0;
    left: 0;
    border-radius: 12px 12px 0 0;
    max-height: 600px;
  }
  
  .sales-coach-minimized {
    width: auto;
    right: 20px;
    left: auto;
    bottom: 20px;
    border-radius: 12px;
  }
}

/* Scrollbar Styling */
.sales-coach-messages::-webkit-scrollbar {
  width: 6px;
}

.sales-coach-messages::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
}

.sales-coach-messages::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
}

.sales-coach-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.3);
}
</style>