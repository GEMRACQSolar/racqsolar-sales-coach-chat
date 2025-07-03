<template>
  <div class="sales-coach-wrapper">
    <!-- Test indicator -->
    <div style="position: fixed; top: 20px; left: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 4px; z-index: 10000;">
      Component Rendering ✓ - With API Integration
    </div>
    
    <!-- Chat Container -->
    <div 
      v-if="isVisible" 
      class="sales-coach-container"
      style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 500px; background: #1a1a2e; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 9999;"
    >
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #003478; border-radius: 12px 12px 0 0; color: white;">
        <h3 style="margin: 0; font-size: 16px;">Sales Coach</h3>
        <button @click="closeChat" style="background: none; border: none; color: white; cursor: pointer;">✕</button>
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
          {{ message.content }}
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
          style="background: #FFE600; color: #003478; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; opacity: 1;"
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
      isVisible: true,
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
    console.log('🎯 PROGRESSIVE TEST - WITH API INTEGRATION');
    console.log('Props:', this.content);
    
    // Initialize based on current prop values
    this.initializeChat();
  },
  
  watch: {
    'content.showChat': {
      handler(newVal) {
        console.log('🔄 showChat changed:', newVal);
        this.isVisible = newVal === true || newVal === 'true';
      },
      immediate: true
    },
    
    'content.initialResponse': {
      handler(newVal) {
        console.log('🔄 initialResponse changed:', newVal);
        if (newVal && !this.hasInitialized) {
          this.chatHistory = [{
            role: 'assistant',
            content: newVal
          }];
          this.hasInitialized = true;
        }
      },
      immediate: true
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
    initializeChat() {
      // If no initialResponse in props, use default
      if (!this.content?.initialResponse && this.chatHistory.length === 0) {
        this.chatHistory = [{
          role: 'assistant',
          content: 'Hello! I\'m your RACQ Solar Sales Coach. How can I help you today?'
        }];
      }
      
      // Set default suggested questions for testing
      if (this.suggestedQuestions.length === 0) {
        this.suggestedQuestions = [
          "How do I handle price objections?",
          "What makes RACQ Solar different?",
          "Tell me about battery storage benefits"
        ];
      }
    },
    
    closeChat() {
      this.isVisible = false;
      console.log('Chat closed');
      // Emit event to update WeWeb
      this.$emit('update:content', { ...this.content, showChat: false });
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
        
        // Update conversation history for context
        this.conversationHistory.push(
          { role: 'user', content: userMessage },
          { role: 'assistant', content: data.response }
        );
        
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
.sales-coach-container {
  pointer-events: all;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>