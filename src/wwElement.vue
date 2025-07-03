<template>
  <div class="test-wrapper">
    <div style="position: fixed; bottom: 20px; right: 20px; background: #FFE600; color: #003478; padding: 20px; border-radius: 8px; z-index: 9999;">
      <h3>Test Component Working!</h3>
      <p>ShowChat: {{ content.showChat }}</p>
      <p>Data: {{ JSON.stringify(content) }}</p>
      <button @click="testClick" style="background: #003478; color: white; padding: 10px; border: none; border-radius: 4px; cursor: pointer;">
        Click Me
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true }
  },
  
  mounted() {
    console.log('🎯 MINIMAL TEST COMPONENT MOUNTED');
    console.log('Props received:', this.content);
  },
  
  methods: {
    testClick() {
      console.log('Button clicked!');
      alert('Component is interactive!');
    }
  }
}
</script>

<style scoped>
.test-wrapper {
  pointer-events: none;
}
.test-wrapper > div {
  pointer-events: all;
}
</style>