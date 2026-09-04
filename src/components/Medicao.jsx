import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { 
  Calculator, Download, Upload, Search, Filter, RefreshCw, Plus, Edit2, Trash2, 
  CheckCircle2, DollarSign, Calendar, Building, Clock, Users, FileText, ChevronRight, 
  X, AlertCircle, Sparkles, Layers, ShieldCheck, Briefcase, FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { defaultPreviaPostos } from '../data/previaPostos';

const SITUACOES_TRABALHO = [
  'TRABALHO',
  'FOLGA TRAB. CASH',
  'DOBRA CASH',
  'CONVOCAÇÃO NORMAL',
  'CONVOCACAO NORMAL',
  'COBERTURA',
  'DOBRA',
  'FOLGA TRABALHADA',
  'DOBRA CONV. CASH',
  'EXTRA ENTRADA CASH',
  'EXTRA SAIDA CASH'
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

const formatMoney = (val) => {
  if (val == null || isNaN(val)) return 'R$ 0,00';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Componente de linha para postos pendentes (com state local para inputs de valor)
function PendenteRow({ item, onCadastrar, onVerDetalhes }) {
  const [valorDia, setValorDia] = useState('');
  const [valorMensal, setValorMensal] = useState('');
  const [cadastrado, setCadastrado] = useState(false);

  const handleValorDiaChange = (e) => {
    const val = e.target.value;
    setValorDia(val);
    if (val !== '' && !isNaN(val)) {
      setValorMensal((parseFloat(val) * 30).toFixed(2));
    } else {
      setValorMensal('');
    }
  };

  const handleValorMensalChange = (e) => {
    const val = e.target.value;
    setValorMensal(val);
    if (val !== '' && !isNaN(val)) {
      setValorDia((parseFloat(val) / 30).toFixed(3));
    } else {
      setValorDia('');
    }
  };

  const handleCadastrar = () => {
    if (!valorDia || parseFloat(valorDia) <= 0) {
      alert('Informe o Valor da Diária antes de cadastrar.');
      return;
    }
    onCadastrar(item, valorDia, valorMensal);
    setCadastrado(true);
  };

  if (cadastrado) {
    return (
      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(16, 185, 129, 0.06)' }}>
        <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.codcli}</td>
        <td style={{ padding: '10px 8px', color: '#e2e8f0', fontWeight: 600 }}>{item.cliente}</td>
        <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.codpos}</td>
        <td style={{ padding: '10px 8px', color: '#f8fafc', fontWeight: 500 }}>{item.posto}</td>
        <td colSpan={6} style={{ padding: '10px 8px', textAlign: 'center' }}>
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 14px', borderRadius: '6px', 
            background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', 
            fontWeight: 600, fontSize: '12px' 
          }}>
            <CheckCircle2 size={14} /> Cadastrado com sucesso!
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ 
      borderBottom: '1px solid rgba(255,255,255,0.04)', 
      borderLeft: '3px solid #f59e0b',
      background: 'rgba(245, 158, 11, 0.03)'
    }}>
      <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.codcli}</td>
      <td style={{ padding: '10px 8px', color: '#e2e8f0', fontWeight: 600 }}>{item.cliente}</td>
      <td style={{ padding: '10px 8px', color: '#64748b' }}>{item.codpos}</td>
      <td style={{ padding: '10px 8px', color: '#f8fafc', fontWeight: 500 }}>{item.posto}</td>
      <td style={{ padding: '10px 8px' }}>
        <span style={{ 
          padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
          background: item.turno === 'NOTURNO' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          color: item.turno === 'NOTURNO' ? '#a78bfa' : '#60a5fa'
        }}>
          {item.turno}
        </span>
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
        <span style={{ 
          padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px',
          background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24'
        }}>
          {item.dias_trabalhados}
        </span>
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#a78bfa', fontWeight: 600 }}>
        {item.total_colaboradores}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
        <input
          type="number" step="0.001" placeholder="0,000"
          value={valorDia} onChange={handleValorDiaChange}
          style={{ 
            width: '100px', padding: '5px 8px', 
            background: '#1e293b', border: '1px solid rgba(245, 158, 11, 0.4)', 
            borderRadius: '6px', color: '#fbbf24', fontSize: '12px', textAlign: 'right',
            fontFamily: 'monospace'
          }}
        />
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
        <input
          type="number" step="0.01" placeholder="0,00"
          value={valorMensal} onChange={handleValorMensalChange}
          style={{ 
            width: '100px', padding: '5px 8px', 
            background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.15)', 
            borderRadius: '6px', color: '#e2e8f0', fontSize: '12px', textAlign: 'right',
            fontFamily: 'monospace'
          }}
        />
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          <button
            onClick={handleCadastrar}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              color: '#fff', border: 'none', padding: '5px 10px', 
              borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer'
            }}
            title="Cadastrar posto com os valores informados"
          >
            <Plus size={12} /> Cadastrar
          </button>
          <button
            onClick={() => onVerDetalhes(item)}
            style={{ 
              background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', 
              border: 'none', padding: '5px 8px', borderRadius: '6px', 
              fontSize: '11px', cursor: 'pointer'
            }}
            title="Ver detalhes dos colaboradores"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Medicao({ rawPresencas = [], currentUser }) {
  // Base de postos cadastrados (Prévia)
  const [postosBase, setPostosBase] = useState(() => {
    const saved = localStorage.getItem('medicao_postos_db_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return defaultPreviaPostos;
  });

  // Dados da Ficha de Presença carregada na tela de medição (ou herdada do global)
  const [presencasLocais, setPresencasLocais] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');
  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoCobranca, setTipoCobranca] = useState('executado'); // 'executado' ou 'cheio'

  // Modais
  const [detalhePosto, setDetalhePosto] = useState(null);
  const [showGerenciarPostos, setShowGerenciarPostos] = useState(false);
  const [showPendentes, setShowPendentes] = useState(false);
  const [editingPosto, setEditingPosto] = useState(null);
  const [isNovoPosto, setIsNovoPosto] = useState(false);

  // KMs
  const [kmsData, setKmsData] = useState(() => {
    const saved = localStorage.getItem("medicao_kms_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {};
  });
  const [showKmModal, setShowKmModal] = useState(false);
  const [kmForm, setKmForm] = useState({ key: "", km: "", valor_km: "" });

  useEffect(() => {
    localStorage.setItem("medicao_kms_v1", JSON.stringify(kmsData));
  }, [kmsData]);

  // Salvar base no localStorage
  useEffect(() => {
    localStorage.setItem('medicao_postos_db_v2', JSON.stringify(postosBase));
  }, [postosBase]);

  // Se o usuário já tiver presencas no estado global e não tiver subido local
  const presencasEfetivas = useMemo(() => {
    if (presencasLocais.length > 0) return presencasLocais;
    return rawPresencas;
  }, [presencasLocais, rawPresencas]);

  // Função para classificar o turno a partir do horário
  const calcularTurno = (horInicio) => {
    if (!horInicio && horInicio !== 0) return 'DIURNO';
    try {
      const hStr = horInicio.toString().trim();
      const hNum = parseInt(hStr, 10);
      if (isNaN(hNum) || hNum === 0) return 'DIURNO';
      if (hNum >= 500 && hNum <= 1200) return 'DIURNO';
      return 'NOTURNO';
    } catch (e) {
      return 'DIURNO';
    }
  };

  // Helper para verificar datas
  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.toString().trim().split(/[\/\-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) return new Date(parts[2], parseInt(parts[1], 10) - 1, parts[0]);
        if (parts[0].length === 4) return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
      }
    } catch (e) { }
    return null;
  };

  // Upload da Ficha Presença CSV
  const handleFichaPresencaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'latin1',
      complete: (results) => {
        setIsUploading(false);
        const data = results.data;
        if (!data || data.length === 0) {
          alert('Planilha vazia ou em formato incorreto.');
          return;
        }

        // Mapear campos
        const firstRow = data[0];
        const keys = Object.keys(firstRow);
        const getKey = (name) => keys.find(k => k.toLowerCase().trim() === name.toLowerCase()) || name;

        const kCodCli = getKey('COD_CLI') || getKey('codcli');
        const kCliente = getKey('CLIENTE') || getKey('cliente');
        const kCodPos = getKey('COD_POS') || getKey('codpos');
        const kPosto = getKey('POSTO') || getKey('posto');
        const kSitHoje = getKey('SITHOJE') || getKey('sithoje');
        const kCSitHoje = getKey('CSITHOJE') || getKey('csithoje');
        const kHorInicio = getKey('HOR_INICIO') || getKey('hor_inicio');
        const kHorFim = getKey('HOR_FIM') || getKey('hor_fim');
        const kData = getKey('DATA') || getKey('data');
        const kRe = getKey('RE') || getKey('re');
        const kNome = getKey('NOME') || getKey('nome');
        const kCargo = getKey('DESC_CARGO') || getKey('CARGO') || getKey('cargo');

        const parsed = data.map(row => {
          const codcli = parseInt(row[kCodCli], 10) || 0;
          const codpos = parseInt(row[kCodPos], 10) || 0;
          const sithoje = (row[kSitHoje] || '').toString().toUpperCase().trim();
          const hor_inicio = row[kHorInicio];
          const turno = calcularTurno(hor_inicio);

          return {
            codcli,
            cliente: row[kCliente] || '',
            codpos,
            posto: row[kPosto] || '',
            sithoje,
            csithoje: row[kCSitHoje],
            hor_inicio,
            hor_fim: row[kHorFim],
            turno,
            data: row[kData] || '',
            re: row[kRe] || '',
            nome: row[kNome] || '',
            cargo: row[kCargo] || ''
          };
        });

        setPresencasLocais(parsed);
        setUploadStats({
          fileName: file.name,
          totalRows: parsed.length,
          totalTrabalhados: parsed.filter(p => SITUACOES_TRABALHO.some(st => p.sithoje.includes(st))).length
        });
      },
      error: (err) => {
        setIsUploading(false);
        console.error('Erro ao ler CSV:', err);
        alert('Erro ao processar arquivo: ' + err.message);
      }
    });
  };

  // Processamento e Cruzamento da Medição
  const medicaoProcessada = useMemo(() => {
    // 1. Filtrar as presenças por data se houver
    let presFiltradas = presencasEfetivas;
    if (dataInicio || dataFim) {
      const dIni = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
      const dFim = dataFim ? new Date(dataFim + 'T23:59:59') : null;

      presFiltradas = presFiltradas.filter(p => {
        const dt = parseDateStr(p.data);
        if (!dt) return true;
        if (dIni && dt < dIni) return false;
        if (dFim && dt > dFim) return false;
        return true;
      });
    }

    // 1.5 Identificar a quantidade de dias do mês (30 ou 31) baseando-se nas datas presentes na ficha
    const diasDoMes = new Set(presFiltradas.map(p => p.data).filter(Boolean)).size || 30;

    // 2. Filtrar apenas registros de trabalho efetivo
    const presTrabalhadas = presFiltradas.filter(p => {
      const sit = (p.sithoje || '').toString().toUpperCase().trim();
      return SITUACOES_TRABALHO.some(st => sit.includes(st));
    });

    // 3. Agrupar por [codcli, codpos, turno]
    const mapaPresencas = new Map();
    const clientesNaFicha = new Set();
    presTrabalhadas.forEach(p => {
      clientesNaFicha.add(parseInt(p.codcli, 10) || 0);
      const key = `${p.codcli}_${p.codpos}_${p.turno}`;
      if (!mapaPresencas.has(key)) {
        mapaPresencas.set(key, {
          count: 0,
          colaboradores: new Set(),
          detalhes: []
        });
      }
      const item = mapaPresencas.get(key);
      item.count += 1;
      if (p.re || p.nome) item.colaboradores.add(p.re || p.nome);
      item.detalhes.push(p);
    });

    // 4. Cruzar com a base de Prévia Postos
    const postosBaseKeys = new Set(postosBase.map(p => `${p.codcli}_${p.codpos}_${p.turno}`));

    const resultado = postosBase.map(posto => {
      const key = `${posto.codcli}_${posto.codpos}_${posto.turno}`;
      const presInfo = mapaPresencas.get(key) || { count: 0, colaboradores: new Set(), detalhes: [] };

      const diasTrabalhados = presInfo.count;
      const valorDia = Number(posto.valor_dia || 0);
      const valorMensal = Number(posto.valor_mensal || 0);
      
      const valorTotalReal = diasTrabalhados * valorDia;
      
      // O contrato cheio considera todos os postos do ficha presença
      // Se não houver presença para esse posto (ex: arquivo de 1 cliente só), não cobra nada
      const isPresente = diasTrabalhados > 0;
      const valorTotalCheio = isPresente ? (valorMensal / 30) * diasDoMes : 0;
      const valorTotal = tipoCobranca === 'cheio' ? valorTotalCheio : valorTotalReal;
      
      const diasExibicao = tipoCobranca === 'cheio' ? (isPresente ? diasDoMes : 0) : diasTrabalhados;
      
      const diferenca = valorTotalReal - valorMensal;

      return {
        ...posto,
        dias_trabalhados: diasExibicao,
        dias_trabalhados_reais: diasTrabalhados,
        total_colaboradores: presInfo.colaboradores.size,
        valor_total: valorTotal, // Valor que será exibido e totalizado
        valor_total_real: valorTotalReal, // O valor executado independentemente do tipo de cobrança
        diferenca_mensal: diferenca,
        detalhes: presInfo.detalhes
      };
    });

    // 5. Incluir postos que existem na Ficha Presença mas NÃO estão no cadastro prévio
    mapaPresencas.forEach((presInfo, key) => {
      if (!postosBaseKeys.has(key)) {
        // Extrair dados do primeiro registro de presença para preencher informações do posto
        const primeiro = presInfo.detalhes[0] || {};
        resultado.push({
          id: `auto_${key}`,
          codcli: parseInt(primeiro.codcli, 10) || 0,
          cliente: primeiro.cliente || 'Não Identificado',
          codpos: parseInt(primeiro.codpos, 10) || 0,
          posto: primeiro.posto || 'Não Identificado',
          turno: primeiro.turno || 'DIURNO',
          filial: 0,
          empresa: '',
          produto: primeiro.cargo || '',
          escala: '',
          valor_mensal: 0,
          valor_dia: 0,
          dias_trabalhados: presInfo.count,
          total_colaboradores: presInfo.colaboradores.size,
          valor_total: 0,
          diferenca_mensal: 0,
          detalhes: presInfo.detalhes,
          _nao_cadastrado: true,
          status_divergencia: "NAO_CADASTRADO"
        });
      }
    });

    return resultado;
  }, [postosBase, presencasEfetivas, dataInicio, dataFim, tipoCobranca]);

  // Lista de Clientes, Empresas, Turnos e Produtos únicos para filtros
  const clientesList = useMemo(() => [...new Set(postosBase.map(p => p.cliente))].filter(Boolean).sort(), [postosBase]);
  const empresasList = useMemo(() => [...new Set(postosBase.map(p => p.empresa))].filter(Boolean).sort(), [postosBase]);
  const turnosList = useMemo(() => [...new Set(postosBase.map(p => p.turno))].filter(Boolean).sort(), [postosBase]);
  const produtosList = useMemo(() => [...new Set(postosBase.map(p => p.produto))].filter(Boolean).sort(), [postosBase]);

  // Aplicar filtros de exibição
  const medicaoFiltrada = useMemo(() => {
    return medicaoProcessada.filter(item => {
      if (filtroCliente && item.cliente !== filtroCliente) return false;
      if (filtroEmpresa && item.empresa !== filtroEmpresa) return false;
      if (filtroTurno && item.turno !== filtroTurno) return false;
      if (filtroProduto && item.produto !== filtroProduto) return false;
      if (filtroBusca) {
        const termo = filtroBusca.toLowerCase();
        const texto = `${item.codcli} ${item.cliente} ${item.codpos} ${item.posto} ${item.produto} ${item.empresa}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });
  }, [medicaoProcessada, filtroCliente, filtroEmpresa, filtroTurno, filtroProduto, filtroBusca]);

  // Totais Gerais dos Cards KPI
  const totais = useMemo(() => {
    let valorMedicao = 0;
    let valorContratado = 0;
    let totalDias = 0;
    let postosComTrabalho = 0;
    let postosSemCadastro = 0;

    medicaoFiltrada.forEach(item => {
      valorMedicao += Number(item.valor_total || 0);
      valorContratado += Number(item.valor_mensal || 0);
      totalDias += item.dias_trabalhados;
      if (item.dias_trabalhados > 0) postosComTrabalho += 1;
      if (item._nao_cadastrado) postosSemCadastro += 1;
    });

    return {
      valorMedicao,
      valorContratado,
      totalDias,
      postosComTrabalho,
      totalPostos: medicaoFiltrada.length,
      saldoGeral: valorMedicao - valorContratado,
      postosSemCadastro
    };
  }, [medicaoFiltrada]);

  // Lista de postos pendentes de cadastro (não cadastrados previamente, com dias trabalhados)
  const postosPendentes = useMemo(() => {
    return medicaoProcessada
      .filter(item => item._nao_cadastrado && item.dias_trabalhados > 0)
      .sort((a, b) => b.dias_trabalhados - a.dias_trabalhados);
  }, [medicaoProcessada]);

  // Cadastrar um posto pendente na base (com valores informados)
  const handleCadastrarPendente = (pendente, valorDia, valorMensal) => {
    const novoId = Math.max(0, ...postosBase.map(p => p.id || 0)) + 1;
    const novo = {
      id: novoId,
      codcli: pendente.codcli,
      cliente: pendente.cliente,
      codpos: pendente.codpos,
      posto: pendente.posto,
      turno: pendente.turno,
      filial: 0,
      empresa: pendente.empresa || '',
      produto: pendente.produto || '',
      escala: '',
      valor_mensal: parseFloat(valorMensal) || 0,
      valor_dia: parseFloat(valorDia) || 0
    };
    setPostosBase(prev => [...prev, novo]);
  };

  // Dados para gráficos
  const chartClienteData = useMemo(() => {
    const map = {};
    medicaoFiltrada.forEach(item => {
      const cli = item.cliente || 'Outros';
      if (!map[cli]) map[cli] = { name: cli, valor: 0, dias: 0 };
      map[cli].valor += item.valor_total;
      map[cli].dias += item.dias_trabalhados;
    });
    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [medicaoFiltrada]);

  const chartTurnoData = useMemo(() => {
    const map = { DIURNO: 0, NOTURNO: 0 };
    medicaoFiltrada.forEach(item => {
      const t = item.turno === 'NOTURNO' ? 'NOTURNO' : 'DIURNO';
      map[t] += item.valor_total;
    });
    return [
      { name: 'Diurno', value: map.DIURNO },
      { name: 'Noturno', value: map.NOTURNO }
    ];
  }, [medicaoFiltrada]);

  // Exportar para CSV
  const handleExportCSV = (tipo = 'resumo') => {
    if (tipo === 'resumo') {
      const rows = medicaoFiltrada.map(item => ({
        'Cód. Cliente': item.codcli,
        'Cliente': item.cliente,
        'Cód. Posto': item.codpos,
        'Posto': item.posto,
        'Turno': item.turno,
        'Filial': item.filial,
        'Empresa': item.empresa,
        'Função / Produto': item.produto,
        'Escala': item.escala,
        'Valor Diária (R$)': Number(item.valor_dia || 0).toFixed(3).replace('.', ','),
        'Dias Trabalhados': item.dias_trabalhados,
        [`Valor Medição ${tipoCobranca === 'cheio' ? 'CHEIO' : 'EXECUTADO'} (R$)`]: Number(item.valor_total || 0).toFixed(2).replace('.', ','),
        'Valor Mensal Contratado (R$)': Number(item.valor_mensal || 0).toFixed(2).replace('.', ','),
        'Diferença (R$)': Number(item.diferenca_mensal || 0).toFixed(2).replace('.', ','),
        'Status Cadastro': item._nao_cadastrado ? 'NÃO CADASTRADO' : 'CADASTRADO'
      }));

      const csv = Papa.unparse(rows, { delimiter: ';' });
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Medicao_Servicos_Resumo_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (tipo === 'analitico') {
      const rows = [];
      medicaoFiltrada.forEach(item => {
        if (item.detalhes && item.detalhes.length > 0) {
          item.detalhes.forEach(d => {
            rows.push({
              'Cód. Cliente': item.codcli,
              'Cliente': item.cliente,
              'Cód. Posto': item.codpos,
              'Posto': item.posto,
              'Turno': item.turno,
              'Empresa': item.empresa,
              'Função': item.produto,
              'Valor Diária (R$)': Number(item.valor_dia || 0).toFixed(3).replace('.', ','),
              'Data': d.data,
              'RE': d.re,
              'Nome Colaborador': d.nome,
              'Situação Presença': d.sithoje,
              'Horário Início': d.hor_inicio,
              'Horário Fim': d.hor_fim
            });
          });
        }
      });

      if (rows.length === 0) {
        alert('Nenhum detalhamento de presença disponível para exportar no filtro atual.');
        return;
      }

      const csv = Papa.unparse(rows, { delimiter: ';' });
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Medicao_Servicos_Espelho_Analitico_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Salvar edição ou criação de posto na base
  const handleSavePosto = (e) => {
    e.preventDefault();
    if (!editingPosto) return;

    if (isNovoPosto) {
      const novoId = Math.max(0, ...postosBase.map(p => p.id || 0)) + 1;
      const novo = {
        ...editingPosto,
        id: novoId,
        codcli: parseInt(editingPosto.codcli, 10) || 0,
        codpos: parseInt(editingPosto.codpos, 10) || 0,
        filial: parseInt(editingPosto.filial, 10) || 0,
        valor_mensal: parseFloat(editingPosto.valor_mensal) || 0,
        valor_dia: parseFloat(editingPosto.valor_dia) || 0
      };
      setPostosBase(prev => [...prev, novo]);
    } else {
      setPostosBase(prev => prev.map(p => p.id === editingPosto.id ? {
        ...editingPosto,
        codcli: parseInt(editingPosto.codcli, 10) || 0,
        codpos: parseInt(editingPosto.codpos, 10) || 0,
        filial: parseInt(editingPosto.filial, 10) || 0,
        valor_mensal: parseFloat(editingPosto.valor_mensal) || 0,
        valor_dia: parseFloat(editingPosto.valor_dia) || 0
      } : p));
    }

    setEditingPosto(null);
    setIsNovoPosto(false);
  };

  const handleDeletePosto = (id) => {
    if (window.confirm('Deseja realmente remover este posto do cadastro de medição?')) {
      setPostosBase(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleRestaurarPadrao = () => {
    if (window.confirm('Restaurar a base de postos e diárias original da planilha PRÉVIA POSTOS? Todas as alterações personalizadas serão redefinidas.')) {
      setPostosBase(defaultPreviaPostos);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header com Ações Rápidas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Calculator size={26} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Medição de Serviços Prestados
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                {postosBase.length} Postos Cadastrados
              </span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
              Cruzamento automático de dias trabalhados (Ficha Presença) com a Prévia de Postos, Turnos e Diárias.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Botão Importar Ficha Presença */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            color: '#fff', 
            padding: '10px 18px', 
            borderRadius: '10px', 
            fontWeight: 600, 
            fontSize: '13px', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s'
          }}>
            <Upload size={16} />
            <span>{isUploading ? 'Processando Ficha...' : 'Importar Ficha Presença'}</span>
            <input type="file" accept=".csv" onChange={handleFichaPresencaUpload} style={{ display: 'none' }} />
          </label>

          {/* Botão Gerenciar / Ver Base Prévia */}
          <button 
            onClick={() => setShowGerenciarPostos(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(51, 65, 85, 0.6)', 
              color: '#e2e8f0', 
              padding: '10px 16px', 
              borderRadius: '10px', 
              fontWeight: 600, 
              fontSize: '13px', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={16} color="#38bdf8" />
            <span>Cadastro de Postos & Diárias</span>
          </button>

          {/* Botão Exportar CSV */}
          <button 
            onClick={() => handleExportCSV('resumo')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              color: '#fff', 
              padding: '10px 18px', 
              borderRadius: '10px', 
              fontWeight: 600, 
              fontSize: '13px', 
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} />
            <span>Exportar CSV (Resumo)</span>
          </button>

          {/* Botão Exportar Analítico */}
          <button 
            onClick={() => handleExportCSV('analitico')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(16, 185, 129, 0.15)', 
              color: '#34d399', 
              padding: '10px 16px', 
              borderRadius: '10px', 
              fontWeight: 600, 
              fontSize: '13px', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Exportar Espelho Analítico</span>
          </button>
        </div>
      </div>

      {/* Notificação de Status de Ficha Carregada */}
      {uploadStats && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.25)', 
          borderRadius: '12px', 
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#e2e8f0',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>
              Ficha Presença carregada com sucesso: <strong>{uploadStats.fileName}</strong> ({uploadStats.totalRows.toLocaleString()} linhas | <strong>{uploadStats.totalTrabalhados.toLocaleString()}</strong> dias trabalhados identificados)
            </span>
          </div>
          <button 
            onClick={() => { setPresencasLocais([]); setUploadStats(null); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
          >
            Limpar importação
          </button>
        </div>
      )}

      {/* Toggle de Cenário (Cálculo) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        background: 'rgba(15, 23, 42, 0.4)', 
        padding: '6px', 
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setTipoCobranca('executado')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s', border: 'none',
            background: tipoCobranca === 'executado' ? '#3b82f6' : 'transparent',
            color: tipoCobranca === 'executado' ? '#fff' : '#94a3b8',
            boxShadow: tipoCobranca === 'executado' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          <Calendar size={18} />
          Cenário: Real Executado
        </button>
        <button
          onClick={() => setTipoCobranca('cheio')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s', border: 'none',
            background: tipoCobranca === 'cheio' ? '#10b981' : 'transparent',
            color: tipoCobranca === 'cheio' ? '#fff' : '#94a3b8',
            boxShadow: tipoCobranca === 'cheio' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <Building size={18} />
          Cenário: Contrato Cheio
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        {/* Card Valor Total Medição */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.7))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Valor Total Medição</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#60a5fa', marginTop: '12px' }}>
            {formatMoney(totais.valorMedicao)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Baseado nos dias efetivamente trabalhados
          </div>
        </div>

        {/* Card Total Dias Trabalhados */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.7))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Dias Trabalhados</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#34d399', marginTop: '12px' }}>
            {totais.totalDias.toLocaleString('pt-BR')} <span style={{ fontSize: '15px', fontWeight: 'normal', color: '#94a3b8' }}>diárias</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Em {totais.postosComTrabalho} postos com escala ativa
          </div>
        </div>

        {/* Card Valor Mensal Contratado */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.7))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Contratado Mensal</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fbbf24', marginTop: '12px' }}>
            {formatMoney(totais.valorContratado)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Diferença: <strong style={{ color: totais.saldoGeral >= 0 ? '#10b981' : '#ef4444' }}>{formatMoney(totais.saldoGeral)}</strong>
          </div>
        </div>

        {/* Card Postos Ativos */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.7))',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Postos / Turnos</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <Building size={20} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#a78bfa', marginTop: '12px' }}>
            {totais.postosComTrabalho} / {totais.totalPostos}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            {((totais.postosComTrabalho / (totais.totalPostos || 1)) * 100).toFixed(1)}% com operação registrada
          </div>
        </div>

      </div>

      {/* Alerta de Postos Sem Cadastro */}
      {totais.postosSemCadastro > 0 && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.25)', 
          borderRadius: '12px', 
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          color: '#fbbf24',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <strong>{totais.postosSemCadastro} posto(s)</strong> da Ficha Presença não possuem cadastro na Prévia de Postos. 
              Estão com diária R$ 0,00 e não entram no cálculo da medição.
            </div>
          </div>
          <button
            onClick={() => setShowPendentes(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', border: 'none', padding: '9px 18px',
              borderRadius: '8px', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Search size={15} />
            Analisar Pendentes ({postosPendentes.length})
          </button>
        </div>
      )}

      {/* Barra de Filtros Interativos */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', 
        padding: '16px 20px', 
        borderRadius: '14px', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center'
      }}>
        
        {/* Busca por texto */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Buscar posto, cliente, código..." 
            value={filtroBusca} 
            onChange={(e) => setFiltroBusca(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 12px 8px 36px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              outline: 'none'
            }} 
          />
        </div>

        {/* Filtro Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Cliente:</label>
          <select 
            value={filtroCliente} 
            onChange={(e) => setFiltroCliente(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos os Clientes</option>
            {clientesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Filtro Empresa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Empresa:</label>
          <select 
            value={filtroEmpresa} 
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="">Todas</option>
            {empresasList.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Filtro Turno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Turno:</label>
          <select 
            value={filtroTurno} 
            onChange={(e) => setFiltroTurno(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="">Todos os Turnos</option>
            {turnosList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Filtro Função/Produto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Função:</label>
          <select 
            value={filtroProduto} 
            onChange={(e) => setFiltroProduto(e.target.value)}
            style={{ 
              padding: '8px 12px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="">Todas</option>
            {produtosList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Filtro Data Início / Fim */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>De:</label>
          <input 
            type="date" 
            value={dataInicio} 
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ 
              padding: '6px 10px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              colorScheme: 'dark'
            }}
          />
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Até:</label>
          <input 
            type="date" 
            value={dataFim} 
            onChange={(e) => setDataFim(e.target.value)}
            style={{ 
              padding: '6px 10px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px', 
              color: '#f8fafc', 
              fontSize: '13px',
              colorScheme: 'dark'
            }}
          />
        </div>

        {/* Limpar Filtros */}
        {(filtroCliente || filtroEmpresa || filtroTurno || filtroProduto || filtroBusca || dataInicio || dataFim) && (
          <button 
            onClick={() => {
              setFiltroCliente('');
              setFiltroEmpresa('');
              setFiltroTurno('');
              setFiltroProduto('');
              setFiltroBusca('');
              setDataInicio('');
              setDataFim('');
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#f87171', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
            Limpar Filtros
          </button>
        )}

      </div>

      {/* Gráficos Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Gráfico 1: Medição por Cliente */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          padding: '20px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255, 255, 255, 0.08)' 
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={18} color="#60a5fa" />
            Valor Medido por Contrato / Cliente
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartClienteData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(val) => [formatMoney(val), 'Valor Total']}
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="valor" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Turno */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          padding: '20px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255, 255, 255, 0.08)' 
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#34d399" />
            Distribuição da Medição por Turno (Diurno vs Noturno)
          </h3>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={chartTurnoData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90} 
                  innerRadius={50}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatMoney(val), 'Valor Medido']}
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tabela Principal de Medição */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', 
        borderRadius: '16px', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Detalhamento da Medição por Posto e Turno
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Mostrando {medicaoFiltrada.length} postos/turnos filtrados. Clique em qualquer linha para ver os colaboradores.
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '560px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '12px 14px' }}>Cód</th>
                <th style={{ padding: '12px 14px' }}>Cliente</th>
                <th style={{ padding: '12px 14px' }}>Posto</th>
                <th style={{ padding: '12px 14px' }}>Turno</th>
                <th style={{ padding: '12px 14px' }}>Função / Produto</th>
                <th style={{ padding: '12px 14px' }}>Status Ficha</th>
                <th style={{ padding: '12px 14px' }}>KM Extra</th>
                <th style={{ padding: '12px 14px' }}>Escala</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Valor Diária</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Dias Trabalhados</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Medição</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Contrato Mensal</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {medicaoFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhum posto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                medicaoFiltrada.map((item, idx) => (
                  <tr 
                    key={item.id || idx}
                    onClick={() => setDetalhePosto(item)}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: item._nao_cadastrado 
                        ? 'rgba(245, 158, 11, 0.04)' 
                        : (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'),
                      borderLeft: item._nao_cadastrado ? '3px solid #f59e0b' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = item._nao_cadastrado 
                      ? 'rgba(245, 158, 11, 0.04)' 
                      : (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)')}
                  >
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {item.codcli}-{item.codpos}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#e2e8f0' }}>
                      {item.cliente}
                      {item._nao_cadastrado && (
                        <span style={{ 
                          marginLeft: '8px', fontSize: '10px', padding: '2px 6px', 
                          borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', 
                          color: '#fbbf24', fontWeight: 600, verticalAlign: 'middle'
                        }}>
                          SEM CADASTRO
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 500 }}>
                      {item.posto}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        background: item.turno === 'NOTURNO' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: item.turno === 'NOTURNO' ? '#a78bfa' : '#60a5fa'
                      }}>
                        {item.turno}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                      {item.produto || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px' }}>
                      {item.status_divergencia === 'FALTA_NA_FICHA' && (
                        <span style={{ background: '#ef444420', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>FALTA NA FICHA</span>
                      )}
                      {item.status_divergencia === 'NAO_CADASTRADO' && (
                        <span style={{ background: '#eab30820', color: '#eab308', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>NÃO CADASTRADO</span>
                      )}
                      {item.status_divergencia === 'OK' && (
                        <span style={{ background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>OK</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                      {item.total_km > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>+{formatMoney(item.total_km)}</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{item.km_info?.km}km x {formatMoney(item.km_info?.valor_km)}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#94a3b8' }}>
                      {item.escala || '12x36'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {formatMoney(item.valor_dia)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        minWidth: '28px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        background: item.dias_trabalhados > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.dias_trabalhados > 0 ? '#34d399' : '#f87171'
                      }}>
                        {item.dias_trabalhados}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: item.valor_total > 0 ? '#60a5fa' : '#94a3b8', fontFamily: 'monospace' }}>
                      {formatMoney(item.valor_total)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {formatMoney(item.valor_mensal)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDetalhePosto(item); }}
                        style={{ 
                          background: 'rgba(59, 130, 246, 0.15)', 
                          color: '#60a5fa', 
                          border: 'none', 
                          padding: '4px 8px', 
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                      >
                        Ver <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Detalhamento Analítico dos Colaboradores do Posto */}
      <AnimatePresence>
        {detalhePosto && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                background: '#0f172a', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                borderRadius: '16px', 
                width: '100%', 
                maxWidth: '850px', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Header do Modal */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                    {detalhePosto.posto} ({detalhePosto.turno})
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Cliente: <strong>{detalhePosto.cliente}</strong> | Cód. Cli: {detalhePosto.codcli} | Cód. Pos: {detalhePosto.codpos} | Função: {detalhePosto.produto}
                  </p>
                </div>
                <button 
                  onClick={() => setDetalhePosto(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Métricas Rápidas do Posto */}
              <div style={{ padding: '16px 24px', background: 'rgba(30, 41, 59, 0.5)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Valor da Diária</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{formatMoney(detalhePosto.valor_dia)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Dias Trabalhados</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>{detalhePosto.dias_trabalhados}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Medição</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{formatMoney(detalhePosto.valor_total)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Colaboradores</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#a78bfa' }}>{detalhePosto.total_colaboradores} distintos</div>
                </div>
              </div>

              {/* Lista dos registros de presença */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
                  Espelho Analítico dos Colaboradores ({detalhePosto.detalhes?.length || 0} registros)
                </h4>

                {(!detalhePosto.detalhes || detalhePosto.detalhes.length === 0) ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 8px', color: '#f59e0b' }} />
                    <p style={{ margin: 0 }}>Nenhuma presença registrada para este posto no período selecionado.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>Data</th>
                        <th style={{ padding: '8px 10px' }}>RE</th>
                        <th style={{ padding: '8px 10px' }}>Nome Colaborador</th>
                        <th style={{ padding: '8px 10px' }}>Situação</th>
                        <th style={{ padding: '8px 10px' }}>Horário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalhePosto.detalhes.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '8px 10px', color: '#f8fafc', fontWeight: 500 }}>{d.data}</td>
                          <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{d.re}</td>
                          <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: 500 }}>{d.nome}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399'
                            }}>
                              {d.sithoje}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                            {d.hor_inicio ? `${d.hor_inicio} - ${d.hor_fim}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer do Modal */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setDetalhePosto(null)}
                  style={{ background: 'rgba(51, 65, 85, 0.8)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Gerenciar Base de Postos & Diárias */}
      <AnimatePresence>
        {showKmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#f8fafc", margin: 0 }}>Lan�ar KM Rodado</h2>
              <button onClick={() => setShowKmModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>Selecionar Posto (Base)</label>
                <select
                  value={kmForm.key}
                  onChange={(e) => setKmForm({ ...kmForm, key: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                >
                  <option value="">-- Selecione um posto --</option>
                  {postosBase.map(p => (
                    <option key={`${p.codcli}_${p.codpos}_${p.turno}`} value={`${p.codcli}_${p.codpos}_${p.turno}`}>
                      [{p.codcli}] {p.posto} - {p.turno}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>KM Rodado (Quantidade)</label>
                <input
                  type="number" step="0.01"
                  value={kmForm.km}
                  onChange={(e) => setKmForm({ ...kmForm, km: e.target.value })}
                  placeholder="Ex: 2311.5"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>Valor por KM (R$)</label>
                <input
                  type="number" step="0.001"
                  value={kmForm.valor_km}
                  onChange={(e) => setKmForm({ ...kmForm, valor_km: e.target.value })}
                  placeholder="Ex: 0.81"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                />
              </div>

              <button
                onClick={() => {
                  if (!kmForm.key) return alert("Selecione um posto");
                  setKmsData({
                    ...kmsData,
                    [kmForm.key]: {
                      km: Number(kmForm.km) || 0,
                      valor_km: Number(kmForm.valor_km) || 0
                    }
                  });
                  setShowKmModal(false);
                  setKmForm({ key: "", km: "", valor_km: "" });
                }}
                style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}
              >
                Adicionar KM
              </button>
            </div>
          </div>
        </div>
      )}

      {showGerenciarPostos && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.8)', 
            backdropFilter: 'blur(6px)', 
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                background: '#0f172a', 
                border: '1px solid rgba(255, 255, 255, 0.15)', 
                borderRadius: '16px', 
                width: '100%', 
                maxWidth: '950px', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={20} color="#38bdf8" />
                    Cadastro & Configuração de Postos, Turnos e Diárias
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Base previamente carregada da planilha PRÉVIA POSTOS ({postosBase.length} postos). Você pode editar diárias ou adicionar novos.
                  </p>
                </div>
                <button 
                  onClick={() => { setShowGerenciarPostos(false); setEditingPosto(null); }}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Ações do Cadastro */}
              <div style={{ padding: '14px 24px', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setEditingPosto({
                      codcli: '', cliente: '', codpos: '', posto: '', turno: 'DIURNO',
                      filial: 10, empresa: 'BELLS', produto: 'VIGILANTE', escala: '12x36',
                      valor_mensal: 0, valor_dia: 0
                    });
                    setIsNovoPosto(true);
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: '#2563eb', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Adicionar Novo Posto
                </button>

                <button 
                  onClick={handleRestaurarPadrao}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    color: '#f87171', 
                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} /> Restaurar Padrão da Planilha
                </button>
              </div>

              {/* Formulário de Edição se ativo */}
              {editingPosto && (
                <form onSubmit={handleSavePosto} style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#60a5fa' }}>
                    {isNovoPosto ? 'Novo Posto' : 'Editar Posto / Diária'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Cód. Cli</label>
                      <input 
                        type="number" 
                        required 
                        value={editingPosto.codcli} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, codcli: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Cliente</label>
                      <input 
                        type="text" 
                        required 
                        value={editingPosto.cliente} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, cliente: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Cód. Pos</label>
                      <input 
                        type="number" 
                        required 
                        value={editingPosto.codpos} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, codpos: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Nome do Posto</label>
                      <input 
                        type="text" 
                        required 
                        value={editingPosto.posto} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, posto: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Turno</label>
                      <select 
                        value={editingPosto.turno} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, turno: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      >
                        <option value="DIURNO">DIURNO</option>
                        <option value="NOTURNO">NOTURNO</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Função / Produto</label>
                      <input 
                        type="text" 
                        value={editingPosto.produto} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, produto: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Valor Diária (R$)</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        required 
                        value={editingPosto.valor_dia} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, valor_dia: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Valor Mensal (R$)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={editingPosto.valor_mensal} 
                        onChange={(e) => setEditingPosto({ ...editingPosto, valor_mensal: e.target.value })}
                        style={{ width: '100%', padding: '6px', background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditingPosto(null)}
                      style={{ background: '#475569', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Salvar Posto
                    </button>
                  </div>
                </form>
              )}

              {/* Tabela de Postos Cadastrados */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textAlign: 'left', position: 'sticky', top: 0, background: '#0f172a' }}>
                      <th style={{ padding: '8px' }}>Cód</th>
                      <th style={{ padding: '8px' }}>Cliente</th>
                      <th style={{ padding: '8px' }}>Posto</th>
                      <th style={{ padding: '8px' }}>Turno</th>
                      <th style={{ padding: '8px' }}>Função</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Valor Diária</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Valor Mensal</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postosBase.map((p, idx) => (
                      <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: '#64748b' }}>{p.codcli}-{p.codpos}</td>
                        <td style={{ padding: '8px', color: '#e2e8f0' }}>{p.cliente}</td>
                        <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 500 }}>{p.posto}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: p.turno === 'NOTURNO' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: p.turno === 'NOTURNO' ? '#a78bfa' : '#60a5fa' }}>
                            {p.turno}
                          </span>
                        </td>
                        <td style={{ padding: '8px', color: '#cbd5e1' }}>{p.produto}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#34d399', fontFamily: 'monospace' }}>{formatMoney(p.valor_dia)}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#94a3b8', fontFamily: 'monospace' }}>{formatMoney(p.valor_mensal)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => { setEditingPosto(p); setIsNovoPosto(false); }}
                              style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '2px' }}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeletePosto(p.id)}
                              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => { setShowGerenciarPostos(false); setEditingPosto(null); }}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Concluir & Voltar para Medição
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Análise de Postos Pendentes de Cadastro */}
      <AnimatePresence>
        {showPendentes && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', 
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                background: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.3)', 
                borderRadius: '16px', width: '100%', maxWidth: '1050px', 
                maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={22} color="#f59e0b" />
                    Postos Pendentes de Cadastro — Análise
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      {postosPendentes.length} pendentes
                    </span>
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                    Esses postos foram encontrados na Ficha Presença mas não constam no cadastro de Prévia de Postos.
                    Informe o <strong>Valor da Diária</strong> e <strong>Valor Mensal</strong> e clique em <strong>Cadastrar</strong> para incluí-los na medição.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPendentes(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={22} />
                </button>
              </div>

              {/* Resumo rápido */}
              <div style={{ padding: '12px 24px', background: 'rgba(245, 158, 11, 0.05)', display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Postos Pendentes</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{postosPendentes.length}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Diárias S/ Valor</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>
                    {postosPendentes.reduce((sum, p) => sum + p.dias_trabalhados, 0).toLocaleString('pt-BR')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Colaboradores Envolvidos</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#a78bfa' }}>
                    {postosPendentes.reduce((sum, p) => sum + p.total_colaboradores, 0)}
                  </div>
                </div>
              </div>

              {/* Tabela de Pendentes */}
              <div style={{ padding: '0 24px', overflowY: 'auto', flex: 1 }}>
                {postosPendentes.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#34d399' }}>Nenhum posto pendente!</p>
                    <p style={{ fontSize: '13px' }}>Todos os postos da Ficha Presença já estão cadastrados na base.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left', position: 'sticky', top: 0, background: '#0f172a', zIndex: 5 }}>
                        <th style={{ padding: '10px 8px' }}>Cód. Cli</th>
                        <th style={{ padding: '10px 8px' }}>Cliente</th>
                        <th style={{ padding: '10px 8px' }}>Cód. Pos</th>
                        <th style={{ padding: '10px 8px' }}>Posto</th>
                        <th style={{ padding: '10px 8px' }}>Turno</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center' }}>Dias Trab.</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center' }}>Colaborad.</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Valor Diária</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right' }}>Valor Mensal</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postosPendentes.map((p, idx) => (
                        <PendenteRow 
                          key={p.id || idx} 
                          item={p} 
                          onCadastrar={handleCadastrarPendente} 
                          onVerDetalhes={(item) => { setDetalhePosto(item); setShowPendentes(false); }}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowPendentes(false)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Fechar Análise
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
