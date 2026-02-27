export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // LLM API proxy
    if (url.pathname === '/api/llm' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { provider, apiKey, model, baseUrl, messages, max_tokens, system } = body;

        let response;
        if (provider === 'anthropic') {
          const payload = { model, max_tokens: max_tokens || 10, messages };
          if (system) payload.system = system;
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(payload),
          });
        } else {
          const apiUrl = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, messages, max_tokens: max_tokens || 10 }),
          });
        }

        const text = await response.text();
        return new Response(text, {
          status: response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
