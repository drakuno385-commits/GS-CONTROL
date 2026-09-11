const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:GsControl2026!@db.nrppkksgtmtfodmefgim.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString,
  });

  await client.connect();

  const sql = `
    -- 1. Bancos & Saldos
    CREATE TABLE IF NOT EXISTS public.financeiro_bancos_saldos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        empresa TEXT,
        agencia TEXT,
        conta TEXT,
        saldo_inicial NUMERIC DEFAULT 0,
        saldo_atual NUMERIC DEFAULT 0,
        cor TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Despesas
    CREATE TABLE IF NOT EXISTS public.financeiro_despesas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        descricao TEXT,
        valor NUMERIC DEFAULT 0,
        vencimento DATE,
        empresa TEXT,
        departamento TEXT,
        forma_pagamento TEXT,
        banco TEXT,
        status TEXT DEFAULT 'AGUARDANDO_APROVACAO',
        comprovante_inclusao TEXT,
        motivo_recusa TEXT,
        numero_op TEXT,
        comprovante_op TEXT,
        valor_executado NUMERIC,
        data_pagamento DATE,
        comprovante_pagamento TEXT,
        obs_pagamento TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        criado_por UUID REFERENCES auth.users(id)
    );

    -- 3. Entradas (Aportes/Recursos)
    CREATE TABLE IF NOT EXISTS public.financeiro_entradas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        banco_id UUID REFERENCES public.financeiro_bancos_saldos(id) ON DELETE CASCADE,
        valor NUMERIC NOT NULL,
        data DATE NOT NULL,
        origem TEXT,
        descricao TEXT,
        comprovante TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Histórico Bancário (Movimentações consolidadas)
    CREATE TABLE IF NOT EXISTS public.financeiro_historico_bancario (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        banco_id UUID REFERENCES public.financeiro_bancos_saldos(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL, -- 'ENTRADA' ou 'SAIDA'
        valor NUMERIC NOT NULL,
        data DATE NOT NULL,
        descricao TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Faturas (Faturamento)
    CREATE TABLE IF NOT EXISTS public.financeiro_faturas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa TEXT,
        cliente TEXT,
        numero_nota TEXT,
        valor_bruto NUMERIC,
        valor_glosa NUMERIC,
        valor_impostos NUMERIC,
        valor_retencao NUMERIC,
        valor_liquido NUMERIC,
        valor_receber NUMERIC,
        data_prevista DATE,
        banco_previsto_id UUID REFERENCES public.financeiro_bancos_saldos(id) ON DELETE SET NULL,
        observacao TEXT,
        status TEXT DEFAULT 'A RECEBER',
        data_recebimento DATE,
        banco_recebimento_id UUID REFERENCES public.financeiro_bancos_saldos(id) ON DELETE SET NULL,
        valor_recebido NUMERIC,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. Configurações Dinâmicas (Empresas, Departamentos, Clientes, Bancos Padrão)
    CREATE TABLE IF NOT EXISTS public.financeiro_config (
        chave TEXT PRIMARY KEY,
        valor JSONB NOT NULL
    );

    -- 7. Auditoria (Logs)
    CREATE TABLE IF NOT EXISTS public.financeiro_auditoria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data TIMESTAMPTZ DEFAULT NOW(),
        usuario TEXT,
        acao TEXT,
        detalhes TEXT
    );

    -- Insert defaults for Config
    INSERT INTO public.financeiro_config (chave, valor)
    VALUES 
      ('empresas', '["AÇOFORTE", "LÓGICA", "BELLS", "REGIONAL", "LGA", "CORRENTE DO SOL", "CORRENTE SERVIÇOS"]'),
      ('departamentos', '["ADMINISTRATIVO", "COMERCIAL", "OPERAÇÕES", "RH", "TI", "MARKETING", "DIRETORIA"]'),
      ('bancos', '["Itaú", "Bradesco", "Banco do Brasil", "Caixa Econômica", "Santander", "Nubank", "Inter", "C6 Bank", "BTG Pactual", "Sicoob", "Sicredi", "Safra", "Daycoval"]'),
      ('clientes', '[]')
    ON CONFLICT (chave) DO NOTHING;

    -- Enable RLS
    ALTER TABLE public.financeiro_bancos_saldos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_despesas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_entradas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_historico_bancario ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_faturas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_config ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.financeiro_auditoria ENABLE ROW LEVEL SECURITY;

    -- Create RLS Policies for authenticated users
    DROP POLICY IF EXISTS "Permitir tudo para auth bancos" ON public.financeiro_bancos_saldos;
    CREATE POLICY "Permitir tudo para auth bancos" ON public.financeiro_bancos_saldos FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth despesas" ON public.financeiro_despesas;
    CREATE POLICY "Permitir tudo para auth despesas" ON public.financeiro_despesas FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth entradas" ON public.financeiro_entradas;
    CREATE POLICY "Permitir tudo para auth entradas" ON public.financeiro_entradas FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth historico" ON public.financeiro_historico_bancario;
    CREATE POLICY "Permitir tudo para auth historico" ON public.financeiro_historico_bancario FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth faturas" ON public.financeiro_faturas;
    CREATE POLICY "Permitir tudo para auth faturas" ON public.financeiro_faturas FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth config" ON public.financeiro_config;
    CREATE POLICY "Permitir tudo para auth config" ON public.financeiro_config FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Permitir tudo para auth auditoria" ON public.financeiro_auditoria;
    CREATE POLICY "Permitir tudo para auth auditoria" ON public.financeiro_auditoria FOR ALL TO authenticated USING (true);
  `;

  try {
    const res = await client.query(sql);
    console.log('Tables created and policies applied successfully.');
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}
run();
