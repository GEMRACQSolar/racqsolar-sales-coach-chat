<template>
  <div class="sales-coach-wrapper">
    <!-- Test indicator -->
    <div style="position: fixed; top: 20px; left: 20px; background: #4CAF50; color: white; padding: 10px; border-radius: 4px; z-index: 10000;">
      Component Rendering ✓
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
      <div style="flex: 1; overflow-y: auto; padding: 20px;">
        <div style="background: #2a2a3e; color: white; padding: 10px 15px; border-radius: 8px; margin-bottom: 10px;">
          Hello! This is a test message.
        </div>
      </div>

      <!-- Input -->
      <div style="display: flex; gap: 10px; padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        <input 
          v-model="currentMessage" 
          placeholder="Type a message..."
          style="flex: 1; background: #2a2a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 15px; color: white;"
        >
        <button 
          @click="sendTestMessage"
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
      currentMessage: ''
    }
  },
  
  mounted() {
    console.log('🎯 PROGRESSIVE TEST - BASIC CHAT UI');
    console.log('Props:', this.content);
  },
  
  methods: {
    closeChat() {
      this.isVisible = false;
      console.log('Chat closed');
    },
    
    sendTestMessage() {
      console.log('Message sent:', this.currentMessage);
      alert('Message: ' + this.currentMessage);
      this.currentMessage = '';
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