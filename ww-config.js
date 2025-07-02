export default {
  editor: {
    label: {
      en: "RACQ Sales Coach Chat"
    },
    icon: "message-circle",
    customStylePropertiesOrder: [],
    customSettingsPropertiesOrder: [
      "apiEndpoint", 
      "apiKey", 
      "packageData", 
      "customerData",
      "showChat",
      "initialMessage",
      "initialResponse"
    ]
  },
  
  properties: {
    apiEndpoint: {
      label: {
        en: "API Endpoint"
      },
      type: "Text",
      bindable: true,
      defaultValue: "https://xcujkzbqaatboeskvmhl.supabase.co/functions/v1/package-sales-help"
    },
    apiKey: {
      label: {
        en: "API Key (Bearer Token)"
      },
      type: "Text",
      bindable: true,
      defaultValue: ""
    },
    packageData: {
      label: {
        en: "Package Data"
      },
      type: "Object",
      bindable: true,
      defaultValue: null
    },
    customerData: {
      label: {
        en: "Customer Data"
      },
      type: "Object",
      bindable: true,
      defaultValue: null
    },
    showChat: {
      label: {
        en: "Show Chat"
      },
      type: "OnOff",
      bindable: true,
      defaultValue: false
    },
    initialMessage: {
      label: {
        en: "Initial Message"
      },
      type: "Text",
      bindable: true,
      defaultValue: "Help me sell this package"
    },
    initialResponse: {
      label: {
        en: "Initial Response"
      },
      type: "Object",
      bindable: true,
      defaultValue: null
    }
  },
  
  triggerEvents: [
    {
      name: "chat:opened",
      label: { en: "On Chat Opened" },
      event: {
        timestamp: ""
      }
    },
    {
      name: "chat:closed",
      label: { en: "On Chat Closed" },
      event: {
        timestamp: ""
      }
    },
    {
      name: "message:sent",
      label: { en: "On Message Sent" },
      event: {
        message: "",
        timestamp: ""
      }
    },
    {
      name: "response:received",
      label: { en: "On Response Received" },
      event: {
        response: "",
        suggestedQuestions: [],
        timestamp: ""
      }
    },
    {
      name: "api:error",
      label: { en: "On API Error" },
      event: {
        error: "",
        timestamp: ""
      }
    }
  ]
}