<template>
  <div class="sales-coach-wrapper">
    <!-- Test indicator -->
    <div style="position: fixed; top: 20px; left: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 4px; z-index: 10000;">
      Component Rendering ✓ - With Chat History
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
      </div>

      <!-- Input -->
      <div style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        <input 
          v-model="currentMessage" 
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          style="flex: 1; background: #2a2a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 15px; color: white;"
        >
        <button 
          @click="sendMessage"
          style="background: #FFE600; color: #003478; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer;"
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
      chatHistory: [
        { role: 'assistant', content: 'Hello! I\'m your RACQ Solar Sales Coach. How can I help you today?' }
      ]
    }
  },
  
  mounted() {
    console.log('🎯 PROGRESSIVE TEST - CHAT WITH HISTORY ARRAY');
    console.log('Props:', this.content);
    console.log('Initial chat history:', this.chatHistory);
  },
  
  methods: {
    closeChat() {
      this.isVisible = false;
      console.log('Chat closed');
    },
    
    sendMessage() {
      if (!this.currentMessage.trim()) return;
      
      // Add user message
      this.chatHistory.push({
        role: 'user',
        content: this.currentMessage
      });
      
      // Add fake assistant response for testing
      setTimeout(() => {
        this.chatHistory.push({
          role: 'assistant',
          content: `I received your message: "${this.currentMessage}"`
        });
        this.scrollToBottom();
      }, 500);
      
      console.log('Message sent:', this.currentMessage);
      this.currentMessage = '';
      this.scrollToBottom();
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
</style>