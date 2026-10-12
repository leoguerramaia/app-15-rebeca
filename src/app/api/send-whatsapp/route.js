import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, code } = await request.json();
    
    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Telemóvel e código são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const message = `🌹 Olá! O seu código de acesso ao Baile de 15 Anos Rebeca Guerra Maia (Tema: Bela e a Fera) é: *${code}*`;

    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME;

    // Se as credenciais estiverem configuradas, executa o disparo real pela Evolution API
    if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
      const evoResponse = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: message
        })
      });

      const evoData = await evoResponse.json();

      if (!evoResponse.ok) {
        console.error('Erro retornado pela Evolution API:', evoData);
        return NextResponse.json(
          { success: false, error: 'Falha ao disparar mensagem via Evolution API.' },
          { status: 500 }
        );
      }
    } else {
      // Modo de segurança/desenvolvimento caso as chaves não estejam preenchidas
      console.log(`[EVOLUTION API - MODO SIMULAÇÃO] Mensagem para ${formattedNumber}: ${message}`);
    }

    return NextResponse.json(
      { success: true, message: 'Código enviado automaticamente com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro crítico no endpoint send-whatsapp:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar o envio.' },
      { status: 500 }
    );
  }
}