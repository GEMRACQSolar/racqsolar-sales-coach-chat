import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const body = await req.json();
    const { packageData = {}, customerData = {}, message = '', chatHistory = [] } = body;

    // Ensure chatHistory is an array
    const validChatHistory = Array.isArray(chatHistory) ? chatHistory : [];

    // Log incoming data for debugging
    console.log('Received packageData:', JSON.stringify(packageData, null, 2));
    console.log('Received customerData:', JSON.stringify(customerData, null, 2));
    console.log('Received chatHistory:', JSON.stringify(validChatHistory, null, 2));

    // Generate AI response
    const response = await generateAIResponse(packageData, customerData, message, validChatHistory);

    return new Response(JSON.stringify({
      success: true,
      response,
      suggestedQuestions: getSuggestedQuestions(packageData, customerData, validChatHistory)
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});

async function generateAIResponse(packageData, customerData, message, chatHistory) {
  // Handle both camelCase and snake_case field names
  const systemType = packageData?.system_type || packageData?.systemType;
  const systemSize = packageData?.system_size_kw || packageData?.systemSize;
  const basePrice = packageData?.base_price || packageData?.basePrice;
  const displayName = packageData?.display_name || packageData?.name;

  // Ensure we have required fields
  if (!packageData || !systemType) {
    console.error('Invalid packageData:', packageData);
    return "I need more information about the package to help you. Please make sure a package is selected.";
  }

  const systemPrompt = `You are RACQ Solar's expert sales coach. Your job is to give sales staff quick, actionable advice during live customer calls.

RESPONSE RULES:
- Keep responses under 100 words
- Give 1-2 specific talking points only
- Use proper formatting: **bold** for emphasis, bullet points for lists
- Be direct and actionable
- Focus on closing the sale

CURRENT PACKAGE:
- System: ${displayName} (${systemSize}kW ${systemType})
- Price: $${basePrice}
- Customer Bill: ${customerData.monthlyBill || 'Unknown'}

KEY ASSETS TO USE STRATEGICALLY:

TRUST FACTORS:
- RACQ: 120+ years Queensland trust
- GEM Energy: $250M+ projects, Australia Zoo, CSIRO
- 10-year workmanship warranty
- Brisbane office for ongoing support

QUALITY ADVANTAGES:
- SunPower: 100x more reliable than standard panels
- 30-year warranty vs 12-25 years standard
- "The Apple of solar panels"

INDUSTRY PROBLEMS:
- 24% of QLD installs are substandard
- 50%+ systems are "orphaned" (installer gone)

SYSTEM-SPECIFIC POINTS:
${systemType === 'pv_only' ? '- 50-70% bill reduction possible\n- Suggest battery-ready upgrade for future' : ''}
${systemType === 'pv_battery' ? '- 80-90% energy independence\n- Federal battery rebate maximized' : ''}
${systemType === 'battery_only' ? '- Maximize existing solar investment\n- Federal rebate available NOW' : ''}

Choose the most relevant 1-2 points for this specific customer question. Be strategic, not comprehensive.`;

  const userPrompt = message || "Help me explain why this package is perfect for this customer";

  // Build conversation history for context
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const messages = [
    ...safeHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content || ''
    })),
    {
      role: "user",
      content: userPrompt
    }
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150, // Reduced from 500 to force shorter responses
        system: systemPrompt,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('AI generation error:', error);
    // Shorter fallback response
    const fallbackSystemType = systemType?.replace(/_/g, ' ') || 'solar';
    const tier = packageData?.tier || 'selected';
    
    return `**Quick talking points for this ${tier} ${systemSize}kW system:**

• **RACQ reliability** - 120+ years of Queensland trust
• **SunPower quality** - 100x more reliable than standard panels

What's their main concern?`;
  }
}

function getSuggestedQuestions(packageData, customerData, chatHistory) {
  // Handle both field name formats
  const systemType = packageData?.system_type || packageData?.systemType;

  // Shorter, more focused questions
  const questions = [];

  // Always relevant
  questions.push("Handle price objection");

  // Package-specific with shorter text
  if (systemType === 'pv_only') {
    questions.push("Why upgrade to battery-ready?");
  } else if (systemType?.includes('battery')) {
    questions.push("Explain battery rebate");
  }

  // Customer-specific
  if (customerData?.monthlyBill === 'over200') {
    questions.push("Justify system size");
  }

  // Conversation-aware
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];
  if (safeHistory.length === 0) {
    questions.push("Why choose RACQ Solar?");
  } else {
    questions.push("vs competitors");
  }

  return questions.slice(0, 4);
}