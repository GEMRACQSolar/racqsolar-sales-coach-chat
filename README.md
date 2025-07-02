# RACQ Solar Sales Coach Chat Component

An interactive AI-powered chat interface for the RACQ Solar Estimator that provides real-time sales coaching and assistance.

## Features

- 🤖 AI-powered sales coaching via Supabase Edge Function
- 💬 Real-time chat interface with message history
- 💡 Suggested questions for easy interaction
- 📱 Mobile-responsive design
- 🎯 Contextual responses based on package and customer data
- 🔄 Minimize/maximize functionality
- 🎨 RACQ branded styling

## Installation

1. In WeWeb, add this component via the marketplace or custom component installation
2. Configure the component properties (API endpoint and key)
3. Bind the necessary data properties

## Configuration

### Required Properties

- **API Endpoint**: The Supabase Edge Function URL (default provided)
- **API Key**: Your Supabase anon key for authentication
- **Package Data**: Current package information object
- **Customer Data**: Customer profile information
- **Show Chat**: Boolean to control chat visibility

### Events

The component emits the following events:

- `chat:opened` - When the chat is opened
- `chat:closed` - When the chat is closed
- `message:sent` - When a user sends a message
- `response:received` - When an AI response is received
- `api:error` - When an API error occurs

## Usage Example

```javascript
// In your WeWeb workflows

// Open the chat
changeVariable('showSalesCoach', true);

// Pass package data
changeVariable('packageData', {
  id: selectedPackage.id,
  name: selectedPackage.display_name,
  tier: selectedPackage.tier,
  systemType: selectedPackage.system_type,
  systemSize: selectedPackage.system_size_kw,
  basePrice: selectedPackage.base_price
});

// Pass customer data
changeVariable('customerData', {
  name: personalData.fullName,
  monthlyBill: energyData.monthlyBill,
  energyTiming: energyData.energyTiming,
  systemType: energyData.systemType
});
```

## API Integration

The component expects the API to accept:

```json
{
  "packageData": {},
  "customerData": {},
  "message": "user question",
  "chatHistory": []
}
```

And return:

```json
{
  "success": true,
  "response": "AI response text",
  "suggestedQuestions": ["question1", "question2", "question3"]
}
```

## Styling

The component uses RACQ brand colors:
- Primary Blue: #003478
- Yellow: #FFE600
- Dark backgrounds for chat interface

## Mobile Behavior

- On mobile devices, the chat expands to full width
- Maintains 70vh height for better usability
- Minimized state becomes a floating button

## Development

```bash
# Install dependencies
npm install

# Serve for development
npm run serve

# Build for production
npm run build
```

## Support

For issues or questions, please contact the RACQ Solar development team.