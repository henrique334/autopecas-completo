const SYSTEM_PROMPT = `Você é o assistente virtual da AutoPeças Sucata, uma loja especializada em peças de carros usadas originais de sucata.

Informações da loja:
- Nome: AutoPeças Sucata
- Especialidade: peças usadas originais (motor, câmbio, lataria, suspensão, elétrica, ar-condicionado, rodas, freios, faróis, vidros, interior, bateria)
- Garantia: 3 a 6 meses por escrito em todas as peças
- Entrega: todo o Brasil via transportadora
- Pagamento: até 12x no cartão, PIX com desconto, transferência bancária
- WhatsApp: (11) 99999-9999
- Horário: Seg a Sex 8h às 18h, Sábado 8h às 13h
- Endereço: Rua das Sucatas, 1500, Bairro Industrial, São Paulo/SP
- Todas as peças são testadas antes de serem vendidas
- Economia de 60% a 80% em relação à peça nova

Seu papel:
- Responder dúvidas sobre peças, preços, garantia, entrega e pagamento
- Ajudar o cliente a encontrar a peça certa para o veículo dele
- Ser simpático, objetivo e usar linguagem simples
- Sempre que possível, indicar o WhatsApp para consultar disponibilidade e preços específicos
- Responder em português brasileiro
- Respostas curtas e diretas (máximo 3 parágrafos)
- Não inventar preços específicos — diga para consultar pelo WhatsApp`;

async function chat(req, res) {
  try {
    const { mensagens } = req.body;

    if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0) {
      return res.status(400).json({ erro: 'Mensagens inválidas.' });
    }

    // Limita histórico para não estourar tokens
    const historico = mensagens.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content).slice(0, 500),
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ erro: 'Chave da API não configurada no servidor.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: historico,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Erro Anthropic:', err);
      return res.status(502).json({ erro: 'Erro ao chamar IA.' });
    }

    const data = await response.json();
    const resposta = data.content?.[0]?.text || 'Não consegui responder. Fale pelo WhatsApp: (11) 99999-9999';

    res.json({ resposta });
  } catch (err) {
    console.error('Chatbot erro:', err.message);
    res.status(500).json({ erro: 'Erro interno do chatbot.' });
  }
}

module.exports = { chat };
