<template>
  <div class="sales-coach-wrapper">
    <!-- Minimized State -->
    <div 
      v-if="isMinimized" 
      class="sales-coach-minimized"
      @click="isMinimized = false"
      style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: #FFE600; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 9999;"
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#003478">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.19.22 2.34.6 3.41L1.11 22l6.59-1.49c1.07.38 2.22.6 3.41.6 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.08 0-2.14-.21-3.13-.62l-.22-.12-3.48.79.79-3.48-.12-.22A7.91 7.91 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
        <circle cx="8.5" cy="9.5" r="1"/>
        <circle cx="12" cy="9.5" r="1"/>
        <circle cx="15.5" cy="9.5" r="1"/>
      </svg>
    </div>

    <!-- Chat Container -->
    <div 
      v-if="!isMinimized" 
      class="sales-coach-container"
      style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; background: #1a1a2e; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 9999;"
    >
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #003478; border-radius: 12px 12px 0 0; color: white;">
        <h3 style="margin: 0; font-size: 16px;">Sales Coach</h3>
        <button @click="isMinimized = true" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">－</button>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" style="flex: 1; overflow-y: auto; padding: 20px;">
        <div 
          v-for="(message, index) in chatHistory" 
          :key="index"
          :style="{
            background: message.role === 'user' ? '#FFE600' : '#2a2a3e',
            color: message.role === 'user' ? '#003478' : 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            marginBottom: '10px',
            marginLeft: message.role === 'user' ? '50px' : '0',
            marginRight: message.role === 'user' ? '0' : '50px'
          }"
        >
          <div v-html="formatMessage(message.content)" class="message-content"></div>
        </div>
        
        <!-- Loading indicator -->
        <div v-if="isLoading" style="display: flex; align-items: center; gap: 10px; color: #888; margin: 10px 0;">
          <div style="display: flex; gap: 4px;">
            <span style="animation: bounce 1.4s infinite ease-in-out; animation-delay: -0.32s;">•</span>
            <span style="animation: bounce 1.4s infinite ease-in-out; animation-delay: -0.16s;">•</span>
            <span style="animation: bounce 1.4s infinite ease-in-out;">•</span>
          </div>
          <span style="font-size: 14px;">Sales Coach is thinking...</span>
        </div>
        
        <!-- Suggested Questions -->
        <div v-if="showSuggestedQuestions && suggestedQuestions.length > 0" style="margin-top: 15px;">
          <p style="color: #888; font-size: 12px; margin-bottom: 10px;">Suggested questions:</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button 
              v-for="(question, index) in suggestedQuestions" 
              :key="'q-' + index"
              @click="askSuggestedQuestion(question)"
              :disabled="isLoading"
              style="background: rgba(255, 230, 0, 0.1); border: 1px solid rgba(255, 230, 0, 0.3); color: #FFE600; padding: 8px 12px; border-radius: 6px; text-align: left; cursor: pointer; font-size: 13px; transition: all 0.2s;"
              @mouseover="$event.target.style.background = 'rgba(255, 230, 0, 0.2)'"
              @mouseout="$event.target.style.background = 'rgba(255, 230, 0, 0.1)'"
            >
              {{ question }}
            </button>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        <input 
          v-model="currentMessage" 
          @keyup.enter="sendMessage"
          :disabled="isLoading"
          placeholder="Type a message..."
          style="flex: 1; background: #2a2a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 15px; color: white;"
        >
        <button 
          @click="sendMessage"
          :disabled="isLoading || !currentMessage.trim()"
          style="background: #FFE600; color: #003478; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; font-weight: 500;"
          :style="{ opacity: (isLoading || !currentMessage.trim()) ? '0.5' : '1' }"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true }
  },
  
  data() {
    return {
      isMinimized: false,
      currentMessage: '',
      chatHistory: [],
      hasInitialized: false,
      showSuggestedQuestions: true,
      suggestedQuestions: [],
      isLoading: false,
      conversationHistory: [] // For API context
    }
  },
  
  mounted() {
    console.log('🎯 Sales Coach Chat Component Mounted');
    console.log('Props:', this.content);
    
    // Start minimized
    this.isMinimized = true;
    
    // Wait for packageData before initializing
    this.checkAndInitialize();
  },
  
  watch: {
    'content.packageData': {
      handler(newVal) {
        console.log('🔄 packageData changed:', newVal);
        if (newVal && newVal.systemType && !this.hasInitialized) {
          this.initializeChat();
        }
      },
      immediate: true,
      deep: true
    },
    
    'content.suggestedQuestions': {
      handler(newVal) {
        console.log('🔄 suggestedQuestions changed:', newVal);
        if (newVal) {
          // Handle if it's a string (JSON) or array
          if (typeof newVal === 'string') {
            try {
              this.suggestedQuestions = JSON.parse(newVal);
            } catch (e) {
              console.log('Could not parse suggested questions:', e);
              this.suggestedQuestions = [];
            }
          } else if (Array.isArray(newVal)) {
            this.suggestedQuestions = newVal;
          } else {
            this.suggestedQuestions = [];
          }
        }
      },
      immediate: true
    }
  },
  
  methods: {
    checkAndInitialize() {
      // Check if packageData is available
      if (this.content.packageData && this.content.packageData.systemType && !this.hasInitialized) {
        this.initializeChat();
      } else {
        console.log('Waiting for packageData...');
        // Check again in 500ms
        setTimeout(() => {
          if (!this.hasInitialized) {
            this.checkAndInitialize();
          }
        }, 500);
      }
    },
    
    initializeChat() {
      console.log('🚀 Initializing chat with packageData:', this.content.packageData);
      this.hasInitialized = true;
      // Call API with empty message to get initial greeting
      this.callAPI('');
    },
    
    formatMessage(text) {
      // Convert markdown bold to HTML strong tags
      // Also handle italics
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>'); // Also handle line breaks
    },
    
    async callAPI(userMessage) {
      try {
        // Get API endpoint from WeWeb props or use default
        const apiEndpoint = this.content.apiEndpoint || 'https://xcujkzbqaatboeskvmhl.supabase.co/functions/v1/package-sales-help';
        const apiKey = this.content.apiKey;
        
        // Prepare headers
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add Authorization header if API key is provided
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        console.log('📡 Calling API with packageData:', this.content.packageData);
        
        // Call the API
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            packageData: this.content.packageData || {},
            customerData: this.content.customerData || {},
            message: userMessage,
            chatHistory: this.conversationHistory
          })
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Add assistant response
        this.chatHistory.push({
          role: 'assistant',
          content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.'
        });
        
        // Update conversation history for context (but only if it's not the initial greeting)
        if (userMessage) {
          this.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: data.response }
          );
        }
        
        // Update suggested questions if provided
        if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
          this.suggestedQuestions = data.suggestedQuestions;
          this.showSuggestedQuestions = true;
        }
        
      } catch (error) {
        console.error('Error calling API:', error);
        this.chatHistory.push({
          role: 'assistant',
          content: 'I apologize, but I\'m having trouble connecting. Please try again in a moment.'
        });
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },
    
    async sendMessage() {
      if (!this.currentMessage.trim() || this.isLoading) return;
      
      const userMessage = this.currentMessage.trim();
      
      // Add user message to chat
      this.chatHistory.push({
        role: 'user',
        content: userMessage
      });
      
      // Hide suggested questions after first message
      this.showSuggestedQuestions = false;
      
      // Clear input and show loading
      this.currentMessage = '';
      this.isLoading = true;
      this.scrollToBottom();
      
      // Call the API
      await this.callAPI(userMessage);
    },
    
    askSuggestedQuestion(question) {
      if (this.isLoading) return;
      this.currentMessage = question;
      this.sendMessage();
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
        }
      });
    }
  }
}
</script>

<style scoped>
.sales-coach-wrapper {
  pointer-events: none;
}
.sales-coach-container,
.sales-coach-minimized {
  pointer-events: all;
}

.sales-coach-container {
  max-height: 80vh;
}

.sales-coach-minimized {
  transition: all 0.3s ease;
}

.sales-coach-minimized:hover {
  transform: scale(1.1);
}

.message-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.4;
}

.message-content strong {
  font-weight: 600;
}

.message-content em {
  font-style: italic;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .sales-coach-container {
    width: calc(100vw - 20px) !important;
    height: 70vh !important;
    right: 10px !important;
    bottom: 10px !important;
  }
  
  .sales-coach-minimized {
    width: 50px !important;
    height: 50px !important;
  }
}
</style>