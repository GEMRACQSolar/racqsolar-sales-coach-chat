import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
serve(async (req)=>{
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
      suggestedQuestions: getSuggestedQuestions(packageData, customerData, validChatHistory, message)
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
  // Extract monthly bill - handle various field formats
  const monthlyBill = customerData?.monthlyBill || customerData?.monthly_bill || customerData?.energyData?.monthlyBill || 'Not specified';
  // Extract customer details
  const customerName = customerData?.personalData?.fullName || '';
  const futureEnergyUse = customerData?.energyData?.futureEnergyUse || '';
  // Ensure we have required fields
  if (!packageData || !systemType) {
    console.error('Invalid packageData:', packageData);
    return "I need more information about the package to help you. Please make sure a package is selected.";
  }
  // Detect if we have full payload data
  const hasFullPayload = packageData && customerData && customerData.personalData && customerData.personalData.fullName;
  // Handle initial greeting vs. payload received
  const userPrompt = message || (hasFullPayload ? "PAYLOAD_RECEIVED" : "INITIAL_GREETING");
  // Map monthly bill values to readable format
  const billMap = {
    'under100': 'Under $100/month',
    '100to200': '$100-$200/month',
    'over200': 'Over $200/month',
    'energyUseUnsure': 'Not specified'
  };
  const readableBill = billMap[monthlyBill] || monthlyBill;
  const systemPrompt = `You are RACQ Solar's expert sales coach. 

CRITICAL: 
- If the user prompt is "INITIAL_GREETING", respond with ONLY:
"G'day! I'm your RACQ Solar sales coach.

Click a question below, or type your own 👇"

- If the user prompt is "PAYLOAD_RECEIVED", respond with a brief, engaging response that:
1. Acknowledges you have the customer's details
2. Highlights ONE key insight about their situation
3. Ends with "What's your game plan? 👇"

Example for PAYLOAD_RECEIVED:
"Perfect! I've got **${customerName || 'the customer'}'s** details and the **${displayName}** package loaded.

${monthlyBill === 'under100' ? `Small bills but ${futureEnergyUse === 'growingFamily' ? '**growing family** - perfect timing for solar!' : 'still saving 50-70%!'}` : ''}
${monthlyBill === '100to200' ? 'Sweet spot for solar ROI - **3-4 year payback**!' : ''}
${monthlyBill === 'over200' ? '**High bills = massive opportunity** - up to $250/month savings!' : ''}

What's your game plan? 👇"

DO NOT provide any other content for these special prompts.

Otherwise, you're using the STRAIGHT LINE SALES METHOD. Your goal: help staff move prospects efficiently to the sale.

RESPONSE RULES:
1. Maximum 100 words
2. Focus on ONE thing only
3. Use **bold** for emphasis
4. End with ONE specific action
5. Be conversational and practical

CURRENT DEAL:
- Package: ${displayName} (${systemSize}kW)
- Price: $${basePrice}
- Type: ${systemType}
- Customer Bill: ${readableBill}
- Customer Name: ${customerName}
${futureEnergyUse ? `- Future Plans: ${futureEnergyUse}` : ''}

KEY CONTEXT:
${monthlyBill === 'under100' ? '- Small bill but still worth solar - focus on % savings not $ amount' : ''}
${monthlyBill === '100to200' ? '- Perfect sweet spot for solar ROI - emphasize quick payback' : ''}
${monthlyBill === 'over200' ? '- High bills = massive savings opportunity - go big on numbers' : ''}
${systemType.includes('battery') ? '- Battery rebate urgency - $355/kWh ending soon' : ''}
${systemType === 'pv_only' ? '- No battery = lower entry price, but mention future option' : ''}
${futureEnergyUse === 'growingFamily' ? '- Growing family = increasing power needs, lock in savings now' : ''}
${futureEnergyUse === 'evCharger' ? '- Planning EV = perfect for solar, charge for free' : ''}

STRAIGHT LINE PRINCIPLES:
Build THREE CERTAINTIES:
1. Product: They KNOW this solves their problem
2. Company: They TRUST RACQ Solar  
3. You: They believe YOU can deliver

KEY KNOWLEDGE (use strategically):

PRODUCT POINTS:
- SunPower: 100x more reliable, 30-year warranty
- Savings: 50-70% bill reduction (PV only), 80-90% (with battery)
- Federal battery rebate: $355/kWh (decreasing yearly)

COMPANY POINTS:
- RACQ: 120+ years serving Queensland
- 24% of QLD installations are substandard - we're different
- 10-year workmanship warranty

URGENCY BUILDERS:
- Rebates decrease annually
- Electricity prices rising 
- Limited installation slots

Remember: You're coaching the salesperson, not the customer.`;
  // Build conversation history for context
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const messages = [
    ...safeHistory.map((msg)=>({
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
        max_tokens: 200,
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
    return `**Quick tip:** Focus on their biggest pain point with electricity costs.

Ask: "What frustrates you most about your current electricity situation?"`;
  }
}
function getSuggestedQuestions(packageData, customerData, chatHistory, lastMessage) {
  const systemType = packageData?.system_type || packageData?.systemType;
  const monthlyBill = customerData?.monthlyBill || customerData?.monthly_bill || customerData?.energyData?.monthlyBill;
  const futureEnergyUse = customerData?.energyData?.futureEnergyUse || '';
  const customerName = customerData?.personalData?.fullName || '';
  const safeHistory = Array.isArray(chatHistory) ? chatHistory : [];
  const tier = packageData?.tier || 'selected';
  // Check if we have full payload
  const hasFullPayload = customerData && customerData.personalData && customerData.personalData.fullName;
  // Initial questions when we just received the payload
  if (safeHistory.length === 0 && hasFullPayload) {
    const questions = [
      "How do I open with " + (customerName ? customerName.split(' ')[0] : "them") + "?",
      `Why is ${tier} perfect for them?`
    ];
    // Add context-specific questions
    if (monthlyBill === 'under100') {
      questions.push("Address their small bill concern");
    } else if (monthlyBill === 'over200') {
      questions.push("Emphasize massive savings");
    }
    if (futureEnergyUse === 'growingFamily') {
      questions.push("Use growing family angle");
    } else if (futureEnergyUse === 'evCharger') {
      questions.push("Connect solar to EV plans");
    }
    questions.push("Build urgency today");
    return questions.slice(0, 4);
  }
  // Initial questions - NEW IMPROVED VERSION with rotation
  if (safeHistory.length === 0) {
    // Create a pool of practical sales questions
    const questionPool = [
      // Opening & Rapport Building
      "Tips for warm opening & rapport",
      "How to break the ice effectively",
      "Build trust in first 30 seconds",
      "Start with their pain points",
      
      // Industry Trust & RACQ Positioning
      "Address solar industry pitfalls",
      "Why RACQ vs cheap operators",
      "Handle 'solar cowboys' topic",
      "Position RACQ's reliability",
      
      // Sales Techniques
      "Find their hot buttons fast",
      "Create urgency without pressure",
      "Handle price questions early",
      "Turn features into benefits",
      
      // Common Scenarios
      "They're shopping around - now what?",
      "Handle 'need to think about it'",
      "Address upfront cost concerns",
      "Deal with skeptical customers",
      
      // Product Knowledge
      "Explain SunPower advantage simply",
      "Make rebates sound urgent",
      "Simplify ROI conversation",
      "Battery benefits in 30 seconds",
      
      // Closing Techniques
      "Trial close techniques",
      "Assumptive close examples",
      "Handle partner objections",
      "Lock in commitment today"
    ];
    
    // Randomly shuffle and pick 4
    const shuffled = questionPool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }
  // Dynamic questions based on conversation context
  const questions = [];
  const lastMsg = lastMessage?.toLowerCase() || '';
  const lastResponse = safeHistory[safeHistory.length - 1]?.content?.toLowerCase() || '';
  // Context-aware questions
  if (lastMsg.includes('price') || lastMsg.includes('cost') || lastMsg.includes('expensive')) {
    questions.push("They say it's too expensive");
    questions.push("Show them the ROI calculation");
    questions.push("Payment plan options?");
  } else if (lastMsg.includes('think') || lastMsg.includes('consider')) {
    questions.push("Create urgency now");
    questions.push("What happens if they wait?");
    questions.push("Lock in today's rebates");
  } else if (lastMsg.includes('battery')) {
    questions.push("Explain battery benefits");
    questions.push("Battery rebate deadline?");
    questions.push("Why add battery now?");
  } else if (lastMsg.includes('open') || lastMsg.includes('start')) {
    questions.push("What's their main concern?");
    questions.push("Qualifying questions to ask");
    questions.push("Build rapport quickly");
  } else {
    // General helpful questions based on stage
    if (safeHistory.length < 3) {
      questions.push("Identify their pain point");
      questions.push("Build trust in RACQ");
    } else if (safeHistory.length < 6) {
      questions.push("Handle their objection");
      questions.push("Create urgency");
    } else {
      questions.push("Close the deal now");
      questions.push("Final push needed");
    }
  }
  // Always include one package-specific question
  if (systemType === 'pv_only') {
    questions.push("Mention battery upgrade option");
  } else if (systemType.includes('battery')) {
    questions.push("Emphasize energy independence");
  }
  // Bill-specific question
  if (monthlyBill === 'over200') {
    questions.push("Show massive savings potential");
  } else if (monthlyBill === 'under100') {
    questions.push("Justify solar for small bills");
  }
  // Remove duplicates and return top 4
  const uniqueQuestions = [
    ...new Set(questions)
  ];
  return uniqueQuestions.slice(0, 4);
}