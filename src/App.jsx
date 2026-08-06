import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, Settings, Upload, UserCheck, UserX, Briefcase, 
  Activity, Truck, Fuel, Map, DollarSign, AlertTriangle, Scale, Loader2, Cloud, Filter, FileText, CheckCircle, Droplet, Shield, Menu,
  Car, MapPin, Smartphone, LogOut, Download, Stethoscope, X
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, LabelList } from 'recharts';
import Login from './components/Login';
import SupervisorApp from './components/SupervisorApp';
import Monitoramento from './components/Monitoramento';
import Usuarios from './components/Usuarios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const FALTAS_COLORS = ['#ef4444', '#f97316', '#f43f5e', '#d946ef', '#8b5cf6', '#f59e0b'];


const hasAccess = (user, screen) => {
  if (!user) return false;
  if (user.role === 'SUPERVISOR' && screen !== 'app_supervisor') return false;
  if (!user.allowed_screens || user.allowed_screens.length === 0) return true;
  return user.allowed_screens.includes(screen);
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('acoweb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeMenu, setActiveMenu] = useState(() => {
    const saved = localStorage.getItem('acoweb_menu');
    return saved || (currentUser?.role === 'SUPERVISOR' ? 'app_supervisor' : 'rh');
  });

  const [ApresentacaoStep, setApresentacaoStep] = useState(0);
  const [tvScreens, setTvScreens] = useState(() => {
    const saved = localStorage.getItem('acoweb_tv_screens');
    return saved ? JSON.parse(saved) : ['rh', 'frota', 'disciplina', 'atestados'];
  });
  
  useEffect(() => {
    localStorage.setItem('acoweb_tv_screens', JSON.stringify(tvScreens));
  }, [tvScreens]);

  const [tvInterval, setTvInterval] = useState(() => {
    const saved = localStorage.getItem('acoweb_tv_interval');
    return saved ? parseInt(saved, 10) : 15;
  });

  useEffect(() => {
    localStorage.setItem('acoweb_menu', activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    localStorage.setItem('acoweb_tv_interval', tvInterval);
  }, [tvInterval]);

  useEffect(() => {
    let interval;
      if (activeMenu === 'Apresentação') {
        interval = setInterval(() => {
          setApresentacaoStep(prev => tvScreens.length > 0 ? (prev + 1) % tvScreens.length : 0);
        }, tvInterval * 1000); 
      }
    return () => clearInterval(interval);
  }, [activeMenu, tvInterval, tvScreens.length]);

  const handleLoginSuccess = (user) => {
    sessionStorage.setItem('acoweb_user', JSON.stringify(user));
    setCurrentUser(user);
    setActiveMenu(user.role === 'SUPERVISOR' ? 'app_supervisor' : 'rh');
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('acoweb_user');
    setCurrentUser(null);
    await supabase.auth.signOut();
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [lastSync, setLastSync] = useState(null);
  
  // Raw Data States
  const [rawEfetivos, setRawEfetivos] = useState([]);
  const [rawPresencas, setRawPresencas] = useState([]);
  const [rawFrota, setRawFrota] = useState([]);
  const [rawDisciplina, setRawDisciplina] = useState([]);
  const [rawAtestados, setRawAtestados] = useState([]);

  // Filters State
  const initF = { dataInicio: '', dataFim: '', cliente: '', posto: '' };
  const [allFilters, setAllFilters] = useState({
    rh: {...initF}, frota: {...initF}, disciplina: {...initF}, atestados: {...initF}, monitoramento: {...initF}, app_supervisor: {...initF}, usuarios: {...initF}, Apresentação: {...initF}
  });
  const filters = allFilters[activeMenu] || initF;

  // Calculated States for RH
  const [efetivoPorCliente, setEfetivoPorCliente] = useState([]);
  const [presencaDiaria, setPresencaDiaria] = useState([]);
  const [tiposDeFalta, setTiposDeFalta] = useState([]);
  const [folgasTrabalhadas, setFolgasTrabalhadas] = useState([]);
  const [reservaTecnica, setReservaTecnica] = useState([]);
  const [totalsRH, setTotalsRH] = useState({ efetivo: 0, faltas: 0, folgas: 0 });
  const [atestadosRanking, setAtestadosRanking] = useState([]);
  const [atestadosPorCliente, setAtestadosPorCliente] = useState([]);
  const [selectedAtestadoPerson, setSelectedAtestadoPerson] = useState(null);
  const [totalsAtestados, setTotalsAtestados] = useState({ diasPerdidos: 0, totalColaboradores: 0, clienteCritico: 'Nenhum' });

  // Calculated States for Frota
  const [frotaDesempenho, setFrotaDesempenho] = useState([]); 

  const uniqueClientesAtestados = useMemo(() => {
    if (activeMenu !== 'atestados') return [];
    const set = new Set();
    rawAtestados.forEach(row => {
      if (row.nomecli) set.add(row.nomecli.toString().toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [rawAtestados, activeMenu]);

  const uniqueClientesRH = useMemo(() => {
    if (activeMenu !== 'rh') return [];
    const set = new Set();
    rawEfetivos.forEach(row => {
      if (row.cliente) set.add(row.cliente.toString().toUpperCase().trim());
    });
    rawPresencas.forEach(row => {
      if (row.cliente) set.add(row.cliente.toString().toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [rawEfetivos, rawPresencas, activeMenu]);

  const uniqueAreasDisciplina = useMemo(() => {
    if (activeMenu !== 'disciplina') return [];
    const set = new Set();
    rawDisciplina.forEach(row => {
      if (row.area) set.add(row.area.toString().toUpperCase().trim());
    });
    return Array.from(set).sort();
  }, [rawDisciplina, activeMenu]);
  const [frotaConsumo, setFrotaConsumo] = useState([]); 
  const [frotaRanking, setFrotaRanking] = useState([]); 
  const [frotaCombustivel, setFrotaCombustivel] = useState([]); 
  const [totalsFrota, setTotalsFrota] = useState({ custo: 0, km: 0, kml_medio: 0 });

  // Calculated States for Disciplina
  const [discFaltasPorDia, setDiscFaltasPorDia] = useState([]);
  const [discFaltasPorArea, setDiscFaltasPorArea] = useState([]);
  const [discRanking, setDiscRanking] = useState([]);
  const [discAlertas, setDiscAlertas] = useState([]);
  const [selectedDisciplinaPerson, setSelectedDisciplinaPerson] = useState(null);
  const [totalsDisc, setTotalsDisc] = useState({ total_s: 0 });

  // List of unique clients for the filter dropdown
  const clientsList = useMemo(() => {
    const list = new Set();
    rawEfetivos.forEach(r => r.cliente && list.add(r.cliente));
    rawPresencas.forEach(r => r.cliente && list.add(r.cliente));
    return Array.from(list).sort();
  }, [rawEfetivos, rawPresencas]);

  // List of unique postos for the filter dropdown
  const postosList = useMemo(() => {
    const list = new Set();
    const isValid = p => p && !p.toString().toUpperCase().includes('FALTA INJUSTIFICADA');
    
    if (!filters.cliente) {
      rawEfetivos.forEach(r => isValid(r.posto) && list.add(r.posto.trim()));
      rawPresencas.forEach(r => isValid(r.posto) && list.add(r.posto.trim()));
    } else {
      rawEfetivos.forEach(r => {
        if (isValid(r.posto) && r.cliente && r.cliente.toString().trim() === filters.cliente.trim()) list.add(r.posto.trim());
      });
      rawPresencas.forEach(r => {
        if (isValid(r.posto) && r.cliente && r.cliente.toString().trim() === filters.cliente.trim()) list.add(r.posto.trim());
      });
    }
    return Array.from(list).sort();
  }, [rawEfetivos, rawPresencas, filters.cliente]);

  // --- SUPABASE SYNC LOGIC --- //
  useEffect(() => {
    if (currentUser) fetchFromSupabase();
  }, [currentUser]);

  const fetchFromSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('Baixando dados da nuvem...');
    
    const fetchAll = async (table) => {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (!count) return [];
      
      const step = 1000;
      const chunks = [];
      for (let from = 0; from < count; from += step) {
        chunks.push({ from, to: from + step - 1 });
      }

      const results = [];
      // Process in batches of 5 concurrent requests to avoid network stall
      for (let i = 0; i < chunks.length; i += 5) {
        const batch = chunks.slice(i, i + 5);
        const batchPromises = batch.map(c => 
          supabase.from(table).select('*').range(c.from, c.to)
        );
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ data: chunkData }) => {
          if (chunkData) {
            if (table === 'visitas') {
              chunkData.forEach(v => {
                const fixTime = (ds) => {
                  if (!ds) return null;
                  let d = new Date(ds);
                  if (isNaN(d)) return ds;
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 5);
                  while (d > now) { d.setHours(d.getHours() - 3); }
                  return d.toISOString();
                };
                v.hora_chegada = fixTime(v.hora_chegada);
                v.hora_saida = fixTime(v.hora_saida);
              });
            }
            results.push(...chunkData);
          }
        });
      }
      
      return results;
    };

    try {
      const eData = await fetchAll('efetivos');
      if (eData.length > 0) setRawEfetivos(eData.filter(r => r != null && typeof r === 'object'));

      const pData = await fetchAll('presencas');
      if (pData.length > 0) setRawPresencas(pData.filter(r => r != null && typeof r === 'object'));

      const fData = await fetchAll('frota');
      if (fData.length > 0) setRawFrota(fData.filter(r => r != null && typeof r === 'object'));

      const dData = await fetchAll('disciplina');
      if (dData.length > 0) setRawDisciplina(dData.filter(r => r != null && typeof r === 'object'));
      
      const aData = await fetchAll('atestados');
      if (aData.length > 0) setRawAtestados(aData.filter(r => r != null && typeof r === 'object'));
      
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Erro ao buscar Supabase:", error);
    }
    setIsSyncing(false);
  };

  const uploadToSupabase = async (tableName, data, mapperFn, shouldReplace = false) => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus(`Salvando no banco (${tableName})...`);
    
    if (shouldReplace) {
      await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const BATCH_SIZE = 1000;
    const total = data.length;
    
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE).map(mapperFn);
      setSyncStatus(`Salvando ${tableName} na nuvem: ${Math.round((i / total) * 100)}%`);
      setSyncProgress(Math.round((i / total) * 100));
      
      const { error } = await supabase.from(tableName).insert(batch);
      if (error) {
        console.error("Erro no insert:", error);
        alert(`Erro do Banco de Dados (${tableName}): ${error.message}\nVerifique os dados da planilha.`);
        setSyncStatus('Erro na sincronização.');
        setIsSyncing(false);
        return;
      }
    }
    
    setSyncProgress(100);
    setSyncStatus('Sincronização concluída!');
    setTimeout(() => { 
      setIsSyncing(false); 
      setLastSync(new Date().toLocaleTimeString());
      fetchFromSupabase(); 
    }, 2000);
  };

  // --- FILTERING LOGIC --- //
  const parseDateBR = (dateStr) => {
    if (!dateStr) return null;
    try {
      const str = dateStr.toString().trim().split(' ')[0]; // Remove time if exists
      const parts = str.split(/[\/\-]/); 
      if (parts.length === 3) {
        if (parts[2].length === 4) return new Date(parts[2], parseInt(parts[1])-1, parts[0]);
        if (parts[0].length === 4) return new Date(parts[0], parseInt(parts[1])-1, parts[2]);
      }
    } catch (e) {
      console.warn("Date parse error", dateStr, e);
    }
    return null;
  };

  const checkFilters = (row, dateKey, clientKey) => {
    if (row.posto) {
      const p = row.posto.toString().toUpperCase();
      if (p.includes('FALTA INJUSTIFICADA') || p.includes('RESERVA JURIDICA') || p.includes('RESERVA JURÍDICA')) return false;
    }
    if (filters.cliente && clientKey && row[clientKey]) {
      if (row[clientKey].toString().toUpperCase().trim() !== filters.cliente.toString().toUpperCase().trim()) return false;
    }
    if (filters.posto && row.posto) {
      if (row.posto.toString().toUpperCase().trim() !== filters.posto.toString().toUpperCase().trim()) return false;
    }
    if ((filters.dataInicio || filters.dataFim) && dateKey && row[dateKey]) {
      const rowDate = parseDateBR(row[dateKey]);
      if (rowDate) {
        if (filters.dataInicio && rowDate < new Date(filters.dataInicio + 'T00:00:00')) return false;
        if (filters.dataFim && rowDate > new Date(filters.dataFim + 'T23:59:59')) return false;
      } else {
        // Se a data existe mas não conseguiu parsear, exclui do filtro para não dar falso positivo
        return false;
      }
    }
    return true;
  };

    useEffect(() => {
      processFrotaCSV(rawFrota.filter(r => checkFilters(r, 'data', null)));
      processDisciplinaCSV(rawDisciplina.filter(r => checkFilters(r, 'data', 'area')));
    }, [rawFrota, rawDisciplina, filters]);

  const parseFloatBR = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '').replace(',', '.')) || 0;
  };

  const getFrotaValor = (row) => {
    const keys = Object.keys(row);
    const valKeys = keys.filter(k => k.toLowerCase().includes('valor'));
    if (valKeys.length === 0) return row.valor_total ? parseFloatBR(row.valor_total) : 0;
    
    let bestKey = valKeys.find(k => {
      const lk = k.toLowerCase();
      return lk.includes('total') || lk.includes('pago') || lk.includes('bruto') || lk.includes('l\u00EDquido') || lk.includes('liquido');
    });
    
    if (!bestKey) {
      bestKey = valKeys.find(k => {
        const lk = k.toLowerCase();
        return !lk.includes('unit') && !lk.includes('desc');
      }) || valKeys[0];
    }
    
    let v = parseFloatBR(row[bestKey]);
    
    if (v > 0 && v < 15) {
      let consumo = 0;
      if (row.consumo) {
        consumo = parseFloatBR(row.consumo);
      } else {
        const consKey = keys.find(k => k.toLowerCase().includes('consumo') || k.toLowerCase().includes('litro'));
        if (consKey) consumo = parseFloatBR(row[consKey]);
      }
      if (consumo > 0) v = v * consumo;
    }
    
    return v;
  };

  useEffect(() => {
    const reservaList = [];
    const globalReservaSet = new Set();
    const globalPostoWorkers = new Set();
    const uniqueReservaNames = new Set();
    
    rawPresencas.forEach(row => {
      if (filters.posto && row.posto && row.posto.toString().toUpperCase().trim() === filters.posto.toString().toUpperCase().trim()) {
        if (row.re) globalPostoWorkers.add(row.re.toString().trim());
      }
      
      if (filters.posto) {
        if (!row.posto || row.posto.toUpperCase() !== filters.posto.toUpperCase()) return;
      }
      if (filters.cliente && filters.cliente.toUpperCase() !== 'RESERVA TECNICA') {
        const c = row.cliente ? row.cliente.toUpperCase() : "";
        if (c !== filters.cliente.toUpperCase()) return;
      }
      
      const p = row.posto ? row.posto.toUpperCase() : "";
      const c = row.cliente ? row.cliente.toUpperCase() : "";
      const isReserva = p === "PLANTAO - RESERVA" || p.includes("RESERVA TEC") || p.includes("RESERVA TÉC") || c.includes("RESERVA TEC") || c.includes("RESERVA TÉC");
      
      if (isReserva) {
        const nomeUpper = row.nome ? row.nome.toUpperCase() : (row.re ? row.re.toString() : "DESCONHECIDO");
        if (!uniqueReservaNames.has(nomeUpper)) {
          uniqueReservaNames.add(nomeUpper);
          reservaList.push({ id: row.re || Math.random(), nome: row.nome || row.re || 'Desconhecido', posto: row.posto || row.cliente || 'Reserva Técnica' });
        }
        if (row.re) globalReservaSet.add(row.re.toString().trim());
      }
    });
    setReservaTecnica(reservaList);

    const checkEfetivoFilters = (row) => {
      if (row.posto) {
        const p = row.posto.toString().toUpperCase();
        if (p.includes('FALTA INJUSTIFICADA') || p.includes('RESERVA JURIDICA') || p.includes('RESERVA JURÍDICA')) return false;
      }
      if (filters.cliente) {
        if (filters.cliente.toUpperCase().trim() === 'RESERVA TECNICA' && row.re) {
          if (!globalReservaSet.has(row.re.toString().trim())) return false;
        } else if (row.cliente) {
          if (row.cliente.toString().toUpperCase().trim() !== filters.cliente.toString().toUpperCase().trim()) return false;
        } else {
          return false;
        }
      }
      if (filters.posto) {
        const matchesEfetivo = row.posto && row.posto.toString().toUpperCase().trim() === filters.posto.toString().toUpperCase().trim();
        const matchesPresenca = row.re && globalPostoWorkers.has(row.re.toString().trim());
        if (!matchesEfetivo && !matchesPresenca) return false;
      }
      return true;
    };

    let totalEfetivo = 0;
    const efetivoCliente = {};
    const processedEfetivos = new Set();
    
    rawEfetivos.forEach(row => {
      if (!checkEfetivoFilters(row)) return;
      
      const empId = row.re ? row.re.toString().trim() : (row.nomevigil ? row.nomevigil.toString().trim() : Math.random());
      if (processedEfetivos.has(empId)) return;
      processedEfetivos.add(empId);
      
      totalEfetivo++;
      const cName = (filters.cliente && filters.cliente.toUpperCase() === 'RESERVA TECNICA') ? 'RESERVA TÉCNICA' : (row.cliente || 'Sem Cliente');
      efetivoCliente[cName] = (efetivoCliente[cName] || 0) + 1;
    });

    const arrEfetivo = Object.keys(efetivoCliente)
      .map(key => {
        let label = key;
        if (label.length > 22) label = label.substring(0, 22) + '...';
        return { cliente: label, efetivo: efetivoCliente[key], fullCliente: key };
      })
      .sort((a, b) => b.efetivo - a.efetivo)
      .slice(0, 10);
    
    setEfetivoPorCliente(arrEfetivo);

    const presencaData = {};
    const faltasData = {};
    const folgasData = {};
    const globalFaltas = new Set();
    const globalFolgas = new Set();
    const globalFolgasTrab = new Set();
    
    rawPresencas.forEach(row => {
      if (!checkFilters(row, 'data', 'cliente')) return;
      
      const sithoje = row.sithoje ? row.sithoje.toString().toUpperCase() : "";
      const empId = row.re ? row.re.toString().trim() : (row.nome ? row.nome.toString().trim() : Math.random());
      const uniqueEventId = `${empId}_${row.data}`;

      const isFalta = sithoje.includes("FALTA") || sithoje.includes("ATESTADO") || sithoje.includes("SUSPENS") || sithoje.includes("DISPENSADO");
      const isFolga = sithoje.includes("FOLGA") && !sithoje.includes("TRAB") && !sithoje.includes("DOBRA");
      const isPresent = !isFalta && !isFolga;

      if (isPresent) {
        if (!presencaData[row.data]) presencaData[row.data] = new Set();
        presencaData[row.data].add(empId);
      }
      
      if (sithoje.includes("FALTA") || sithoje.includes("ATESTADO") || sithoje.includes("SUSPENS") || sithoje.includes("DISPENSADO")) {
        let tipoFalta = sithoje.replace(" - REGION", "").trim();
        if (!faltasData[tipoFalta]) faltasData[tipoFalta] = new Set();
        faltasData[tipoFalta].add(uniqueEventId);
        globalFaltas.add(uniqueEventId);
      }
      
      const clienteGrp = row.cliente ? row.cliente.trim() : (row.posto ? row.posto.trim() : "Sem Cliente");
      if (!folgasData[clienteGrp]) folgasData[clienteGrp] = { normal: new Set(), ft_cash: new Set(), dobra: new Set() };
      
      if (sithoje.includes("DOBRA")) {
        folgasData[clienteGrp].dobra.add(uniqueEventId);
        globalFolgasTrab.add(uniqueEventId);
      } else if (sithoje.includes("CASH") && (sithoje.includes("FT") || sithoje.includes("FOLGA"))) {
        folgasData[clienteGrp].ft_cash.add(uniqueEventId);
        globalFolgasTrab.add(uniqueEventId);
      } else if (sithoje.includes("FOLGA TRAB") || sithoje.includes("FTM")) {
        folgasData[clienteGrp].normal.add(uniqueEventId);
        globalFolgasTrab.add(uniqueEventId);
      } else if (sithoje.includes("FOLGA")) {
        globalFolgas.add(uniqueEventId); 
      }
    });

    const arrPresenca = Object.keys(presencaData)
      .map(key => ({ dia: key.substring(0, 5), presencas: presencaData[key].size, rawDate: key }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
      
    const faltasSorted = Object.keys(faltasData)
      .map(key => ({ name: key, value: faltasData[key].size }))
      .sort((a, b) => b.value - a.value);
      
    const folgasSorted = Object.keys(folgasData)
      .map(key => ({ 
        cliente: key, 
        'Normal': folgasData[key].normal.size, 
        'FT Cash': folgasData[key].ft_cash.size,
        'Dobra': folgasData[key].dobra.size,
        total: folgasData[key].normal.size + folgasData[key].ft_cash.size + folgasData[key].dobra.size
      }))
      .filter(f => f.total > 0)
      .sort((a, b) => b.total - a.total);

    let arrFaltas = faltasSorted.slice(0, 5);
    if (faltasSorted.length > 5) {
      arrFaltas.push({ name: 'Outros', value: faltasSorted.slice(5).reduce((acc, curr) => acc + curr.value, 0) });
    }

    setPresencaDiaria(arrPresenca);
    setTiposDeFalta(arrFaltas);
    setFolgasTrabalhadas(folgasSorted.slice(0, 10));
    setTotalsRH(prev => ({ ...prev, efetivo: totalEfetivo, faltas: globalFaltas.size, folgas: globalFolgasTrab.size }));
  }, [rawEfetivos, rawPresencas, filters]);

  // Process Atestados
  useEffect(() => {
    const atestadoData = {};
    const atestadoClienteData = {};

    rawAtestados.forEach(row => {
      if (!checkFilters(row, 'iniocor', 'nomecli')) return;

      const pessoaNome = row.nomevigil ? row.nomevigil.toUpperCase().trim() : (row.codvigil ? row.codvigil.toString().trim() : "DESCONHECIDO");
      const clienteGrpAtest = row.nomecli ? row.nomecli.trim() : "Sem Cliente";
      const dias = parseFloatBR(row.tot_dias || 0);
      
      if (!atestadoData[pessoaNome]) atestadoData[pessoaNome] = { nome: pessoaNome, dias: [], cliente: clienteGrpAtest, total: 0 };
      
      atestadoData[pessoaNome].dias.push({ 
        data: (row.iniocor || '') + ' a ' + (row.fimocor || ''), 
        posto: clienteGrpAtest,
        doenca: row.doenca || row.codcid || 'Não informada',
        hosp: row.nomehosp || 'Não informado',
        medico: row.nomemedi || 'Não informado',
        crm: row.crm || ''
      });
      atestadoData[pessoaNome].total += dias;

      if (!atestadoClienteData[clienteGrpAtest]) atestadoClienteData[clienteGrpAtest] = 0;
      atestadoClienteData[clienteGrpAtest] += dias;
    });

    const arrAtestados = Object.values(atestadoData)
      .sort((a, b) => b.total - a.total)
      .map(p => {
        let cor = '#10b981'; // verde
        if (p.total >= 5) cor = '#ef4444'; // vermelho
        else if (p.total >= 3) cor = '#f59e0b'; // amarelo
        return { ...p, cor };
      });
      
    const arrAtestCliente = Object.keys(atestadoClienteData)
      .map(k => ({ cliente: k, total: atestadoClienteData[k] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
      
      let totalDias = 0;
      arrAtestados.forEach(p => totalDias += p.total);
      const critico = arrAtestCliente.length > 0 ? arrAtestCliente[0].cliente : 'Nenhum';

      setAtestadosRanking(arrAtestados.slice(0, 50)); // Top 50 campeões
      setAtestadosPorCliente(arrAtestCliente);
      setTotalsAtestados({ diasPerdidos: totalDias, totalColaboradores: arrAtestados.length, clienteCritico: critico });

  }, [rawAtestados, filters]);

  const processFrotaCSV = (data) => {
    let totCusto = 0;
    let totKm = 0;
    let sumKml = 0;
    let countKml = 0;
    const porPlaca = {};
    const porMotorista = {};
    const porCombustivel = {};

    data.forEach(row => {
      const placa = row.placa || row.Placa;
      if (!placa) return;
      const motorista = row.motorista || row.Motorista || "Desconhecido";
      const produto = row.produto || row.Produto || "Outro";
      const distKey = Object.keys(row).find(k => k.toLowerCase().includes('dist'));
      const km = parseFloatBR(distKey ? row[distKey] : (row.distancia || 0));
      const valor = getFrotaValor(row);
      const consKey = Object.keys(row).find(k => k.toLowerCase().includes('consumo'));
      const consumo = parseFloatBR(consKey ? row[consKey] : (row.consumo || 0)); 
      totCusto += valor;
      totKm += km;
      if (consumo > 0) {
        sumKml += consumo;
        countKml++;
      }
      if (!porPlaca[placa]) porPlaca[placa] = { placa, km: 0, valor: 0, consumos: [], kml_medio: 0 };
      porPlaca[placa].km += km;
      porPlaca[placa].valor += valor;
      if (consumo > 0) porPlaca[placa].consumos.push(consumo);
      if (!porMotorista[motorista]) porMotorista[motorista] = { motorista, valor: 0 };
      porMotorista[motorista].valor += valor;
      const prodUpper = produto.toUpperCase();
      if (!prodUpper.includes("FLUIDO") && !prodUpper.includes("LUBRIFICANTE") && !prodUpper.includes("OLEO") && !prodUpper.includes("ÓLEO") && !prodUpper.includes("ARLA") && !prodUpper.includes("ADITIVO")) {
        if (!porCombustivel[produto]) porCombustivel[produto] = 0;
        porCombustivel[produto] += consumo;
      }
    });

    const arrPlaca = Object.values(porPlaca).map(p => {
      p.kml_medio = p.consumos.length > 0 ? (p.consumos.reduce((a,b)=>a+b,0) / p.consumos.length) : 0;
      p.valor = parseFloat(p.valor.toFixed(2));
      p.km = parseFloat(p.km.toFixed(2));
      p.kml_medio = parseFloat(p.kml_medio.toFixed(2));
      return p;
    });

    setFrotaDesempenho([...arrPlaca].sort((a, b) => b.valor - a.valor).slice(0, 15));
    setFrotaConsumo([...arrPlaca].filter(p => p.kml_medio > 0).sort((a, b) => b.kml_medio - a.kml_medio).slice(0, 15));
    setFrotaRanking(Object.values(porMotorista).map(m => ({ motorista: m.motorista, valor: Math.round(m.valor) })).sort((a, b) => b.valor - a.valor).slice(0, 10));
    setFrotaCombustivel(Object.keys(porCombustivel).map(k => ({ name: k, value: parseFloat(porCombustivel[k].toFixed(2)) })));
    setTotalsFrota({ custo: arrPlaca.reduce((acc, curr) => acc + curr.valor, 0), km: arrPlaca.reduce((acc, curr) => acc + curr.km, 0), kml_medio: countKml > 0 ? (sumKml/countKml) : 0 });
  };

  const processDisciplinaCSV = (data) => {
    let totFaltasS = 0;
    const faltasDia = {};
    const faltasArea = {};
    const faltasPessoa = {};

    data.forEach(row => {
      if (!row.tipo || !row.tipo.toUpperCase().includes('S')) return;
      const dataFalta = row.data;
      let area = row.area || "Não Informada";
      const nome = row.nome || "Desconhecido";
      area = area.trim().split(" ")[0].toUpperCase();
      totFaltasS++;
      if (dataFalta) {
        if (!faltasDia[dataFalta]) faltasDia[dataFalta] = 0;
        faltasDia[dataFalta]++;
      }
      if (!faltasArea[area]) faltasArea[area] = 0;
      faltasArea[area]++;
      if (!faltasPessoa[nome]) faltasPessoa[nome] = { nome, faltas: 0, ocorrencias: [] };
      faltasPessoa[nome].faltas++;
      faltasPessoa[nome].ocorrencias.push({
        data: dataFalta || "Data não informada",
        nomeocor: row.nomeocor || "Ocorrência",
        area: row.area || "Não informada",
        codocor: row.codocor || ""
      });
    });

    const arrPessoaAll = Object.values(faltasPessoa).sort((a, b) => b.faltas - a.faltas);
    setDiscFaltasPorDia(Object.keys(faltasDia).map(k => ({ dia: k.substring(0, 5), faltas: faltasDia[k], rawDate: k })).sort((a, b) => a.rawDate.localeCompare(b.rawDate)));
    setDiscFaltasPorArea(Object.keys(faltasArea).map(k => ({ name: k, value: faltasArea[k] })).sort((a, b) => b.value - a.value));
    setDiscRanking(arrPessoaAll.slice(0, 10));
    setDiscAlertas(arrPessoaAll.filter(p => p.faltas >= 3).map(p => {
      if (p.faltas >= 15) return { ...p, alerta: 'Abandono (>15)', cor: '#ef4444' };
      if (p.faltas >= 5) return { ...p, alerta: 'Telegrama (5)', cor: '#f59e0b' };
      return { ...p, alerta: 'Telegrama (3)', cor: '#3b82f6' };
    }));
    setTotalsDisc({ total_s: totFaltasS });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";", 
      complete: function(results) {
        const data = results.data;
        if (!data || data.length === 0) return alert("Planilha vazia.");
        const firstRowKeys = Object.keys(data[0]);
        const getField = (row, keyStr) => {
          const key = firstRowKeys.find(k => k.toLowerCase().trim() === keyStr.toLowerCase());
          return key ? row[key] : '';
        };
        const hasField = (keyStr) => firstRowKeys.some(k => k.toLowerCase().trim() === keyStr.toLowerCase());

        let sheetType = 'unknown';
        if (hasField('tot_dias') || hasField('nomehosp')) sheetType = 'atestados';
        else if (hasField('nomevigil')) sheetType = 'efetivos';
        else if (hasField('nomeocor') || hasField('codocor')) sheetType = 'disciplina';
        else if (hasField('sithoje')) sheetType = 'presencas';
        else if (hasField('placa')) sheetType = 'frota';

        let isValidForPage = false;
        if (activeMenu === 'rh' && (sheetType === 'efetivos' || sheetType === 'presencas')) isValidForPage = true;
        else if (activeMenu === 'disciplina' && sheetType === 'disciplina') isValidForPage = true;
        else if (activeMenu === 'frota' && sheetType === 'frota') isValidForPage = true;
        else if (activeMenu === 'atestados' && sheetType === 'atestados') isValidForPage = true;

        if (!isValidForPage) {
          alert("Esta planilha não pertence a esta página. Por favor, acesse o menu correto antes de importar.");
          return;
        }

        if (sheetType === 'efetivos') {
          uploadToSupabase('efetivos', data, row => ({ 
            re: getField(row, 're'), nomevigil: getField(row, 'nomevigil'), cliente: getField(row, 'cliente'), posto: getField(row, 'posto') 
          }), true);
        } else if (sheetType === 'disciplina') {
          uploadToSupabase('disciplina', data, row => ({ 
            re: getField(row, 're'), nome: getField(row, 'nome'), data: getField(row, 'data'), codocor: getField(row, 'codocor'), nomeocor: getField(row, 'nomeocor'), tipo: getField(row, 'tipo'), area: getField(row, 'area') 
          }), true);
        } else if (sheetType === 'presencas') {
          uploadToSupabase('presencas', data, row => ({ 
            data: getField(row, 'data'), cliente: getField(row, 'cliente'), sithoje: getField(row, 'sithoje'), posto: getField(row, 'posto'), re: getField(row, 're'), nome: getField(row, 'nome'), tipo: getField(row, 'tipo') 
          }), true);
        } else if (sheetType === 'atestados') {
          uploadToSupabase('atestados', data, row => ({
            codvigil: getField(row, 'codvigil'), nomevigil: getField(row, 'nomevigil'), nomeocor: getField(row, 'nomeocor'), dtadmissao: getField(row, 'dtadmissao'),
            codcli: getField(row, 'codcli'), nomecli: getField(row, 'nomecli'), codpos: getField(row, 'codpos'), iniocor: getField(row, 'iniocor'),
            fimocor: getField(row, 'fimocor'), tot_dias: parseFloatBR(getField(row, 'tot_dias')), codcid: getField(row, 'codcid'), doenca: getField(row, 'doenca'),
            codhosp: getField(row, 'codhosp'), nomehosp: getField(row, 'nomehosp'), crm: getField(row, 'crm'), nomemedi: getField(row, 'nomemedi')
          }), true);
        } else if (sheetType === 'frota') {
          setActiveMenu('frota');
          const mapped = data.map(row => ({
            placa: getField(row, 'placa'), data: getField(row, 'data'), motorista: getField(row, 'motorista'), produto: getField(row, 'produto'),
            distancia: parseFloatBR(getField(row, 'distancia')), consumo: parseFloatBR(getField(row, 'consumo')), valor_total: getFrotaValor(row)
          }));
          uploadToSupabase('frota', mapped, row => row, false);
        } else alert("Planilha não reconhecida.");
      }
    });
  };

  const CustomEfetivoTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
          <p style={{ color: '#f8fafc', margin: '0 0 6px', fontSize: '13px' }}>{data.fullCliente || label}</p>
          <p style={{ color: '#a855f7', margin: 0, fontSize: '13px' }}>Efetivos: <strong>{data.efetivo}</strong></p>
        </div>
      );
    }
    return null;
  };

    const renderRH = () => (
    <>
      <div className="stats-grid">
        <div className="card stat-card glass-panel">
          <div className="stat-title">Total de Efetivos</div>
          <div className="stat-value">{totalsRH.efetivo}</div>
        </div>
        <div className="card stat-card glass-panel">
          <div className="stat-title">Faltas</div>
          <div className="stat-value">{totalsRH.faltas}</div>
        </div>
        <div className="card stat-card glass-panel">
          <div className="stat-title">Folgas Trabalhadas</div>
          <div className="stat-value">{totalsRH.folgas}</div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Efetivo por Cliente (Top 10)</div></div>
          <div className="chart-wrapper">
            {efetivoPorCliente.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efetivoPorCliente} margin={{ top: 25, right: 20, left: 0, bottom: 30 }}>
                    <defs>
                      <linearGradient id="colorEfetivo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false}/>
                    <XAxis dataKey="cliente" type="category" stroke="#94a3b8" tick={{fontSize: 11}} angle={-25} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis type="number" stroke="#94a3b8" hide />
                    <Tooltip content={<CustomEfetivoTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                    <Bar dataKey="efetivo" fill="url(#colorEfetivo)" radius={[4, 4, 0, 0]} barSize={40}>
                      <LabelList dataKey="efetivo" position="top" fill="#e2e8f0" fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Tipos de Falta</div></div>
          <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {tiposDeFalta.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tiposDeFalta} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                    {tiposDeFalta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name && entry.name.toString().toUpperCase().includes('DISPENSADO') ? '#10b981' : FALTAS_COLORS[index % FALTAS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8'}}>Sem dados</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Folgas Trabalhadas</div></div>
          <div className="chart-wrapper">
            {folgasTrabalhadas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={folgasTrabalhadas} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="cliente" stroke="#94a3b8" tick={{fontSize: 11}} interval={0} angle={-45} textAnchor="end" height={80}/>
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px' }}/>
                  <Bar dataKey="Normal" name="Normal" stackId="a" fill="#14b8a6" />
                  <Bar dataKey="FT Cash" name="FT Cash" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Dobra" name="Dobra" stackId="a" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header" style={{ marginBottom: '16px' }}><div className="chart-title">Reserva Técnica</div></div>
          <div className="chart-wrapper" style={{ overflowY: 'auto' }}>
            <div className="reserva-table">
            {reservaTecnica && reservaTecnica.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Nome</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Posto Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {reservaTecnica.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px' }}>{row.nome}</td>
                      <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '12px' }}>{row.posto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (<div style={{color: '#94a3b8', padding: '12px'}}>Sem registros.</div>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );

    const renderFrota = () => (
    <>
      <div className="stats-grid">
        <div className="card stat-card glass-panel">
          <div className="stat-title">Custo Total (R$)</div>
          <div className="stat-value">R$ {totalsFrota.custo.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
        <div className="card stat-card glass-panel">
          <div className="stat-title">KM Rodado</div>
          <div className="stat-value">{totalsFrota.km.toLocaleString('pt-BR')} km</div>
        </div>
        <div className="card stat-card glass-panel">
          <div className="stat-title">Consumo Médio</div>
          <div className="stat-value">{totalsFrota.kml_medio.toFixed(2)}</div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '24px' }}>
        <div className="card chart-card glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header"><div className="chart-title">Custo e KM por Placa (Top 15)</div></div>
          <div className="chart-wrapper">
            {frotaDesempenho.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={frotaDesempenho} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="placa" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={50}/>
                  <YAxis yAxisId="left" stroke="#06b6d4" orientation="left" width={90} tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`} />
                  <YAxis yAxisId="right" stroke="#f59e0b" orientation="right" width={80} tickFormatter={(val) => `${val.toLocaleString('pt-BR')} km`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(value, name) => {
                      if (name === 'Custo (R$)') return [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`, name];
                      if (name === 'Distância (KM)') return [`${value.toLocaleString('pt-BR')} km`, name];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar yAxisId="left" name="Custo (R$)" dataKey="valor" fill="url(#colorCusto)" radius={[4,4,0,0]} />
                  <Line yAxisId="right" name="Distância (KM)" type="monotone" dataKey="km" stroke="#f59e0b" strokeWidth={3} dot={{r:4, fill:'#f59e0b', strokeWidth: 2, stroke:'#1e293b'}} activeDot={{r: 6}} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Importe a planilha de Frota</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Consumo por Placa (Km/L)</div></div>
          <div className="chart-wrapper">
            {frotaConsumo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...frotaConsumo].sort((a,b) => b.kml_medio - a.kml_medio)} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="placa" type="category" stroke="#94a3b8" tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="kml_medio" fill="url(#colorConsumo)" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Ranking de Condutores (Custo)</div></div>
          <div className="chart-wrapper">
             {frotaRanking.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frotaRanking} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="motorista" stroke="#94a3b8" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#94a3b8" width={90} tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`, 'Custo (R$)']}
                  />
                  <Bar dataKey="valor" name="Custo (R$)" fill="url(#colorRanking)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Consumo por Produto (Litros)</div></div>
          <div className="chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {frotaCombustivel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={frotaCombustivel} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" label>
                    {frotaCombustivel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#d946ef'][index % 7]} />
                    ))} 
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8'}}>Sem dados</div>)}
          </div>
        </div>
      </div>
    </>
  );

    const handleExportDisciplina = () => {
    const faltasData = rawDisciplina.filter(r => checkFilters(r, 'data', null) && r.tipo && r.tipo.toUpperCase().includes('S'));
    
    if (faltasData.length === 0) {
      alert("Nenhum dado encontrado para exportar com os filtros atuais.");
      return;
    }

    const csvRows = [
      ['RE', 'NOME', 'DATA DA FALTA', 'AREA'].join(';')
    ];
    
    faltasData.forEach(row => {
      const rowData = [
        row.re || '',
        row.nome || '',
        row.data || '',
        row.area || ''
      ].map(v => `"${v}"`);
      csvRows.push(rowData.join(';'));
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Faltas_Disciplina_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAtestados = () => (
    <>
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card stat-card glass-panel">
          <div className="stat-title">Total de Dias Perdidos</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{totalsAtestados.diasPerdidos}</div>
        </div>
        <div className="card stat-card glass-panel">
          <div className="stat-title">Colaboradores Afastados</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{totalsAtestados.totalColaboradores}</div>
        </div>
        <div className="card stat-card glass-panel" style={{ borderColor: 'var(--border-color)' }}>
          <div className="stat-title" style={{ color: '#10b981' }}>Cliente Crítico (1º)</div>
          <div className="stat-value" style={{ color: '#10b981', fontSize: '20px' }}>{totalsAtestados.clienteCritico}</div>
        </div>
      </div>
      
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card chart-card glass-panel" style={{ overflowY: 'auto', maxHeight: '600px' }}>
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div className="chart-title" style={{ color: '#ef4444' }}>Campeões de Atestado (Ranking)</div>
          </div>
          <div className="reserva-table">
            {atestadosRanking && atestadosRanking.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Posição</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Nome do Colaborador</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500, textAlign: 'center' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {atestadosRanking.map((row, idx) => {
                    let badge = <span style={{ color: '#94a3b8' }}>{idx + 1}º</span>;
                    if (idx === 0) badge = <span style={{ fontSize: '18px' }}>ðŸ†</span>;
                    if (idx === 1) badge = <span style={{ fontSize: '18px' }}>🥈</span>;
                    if (idx === 2) badge = <span style={{ fontSize: '18px' }}>🥉</span>;

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedAtestadoPerson(row)}
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', 
                          background: `rgba(${row.cor === '#ef4444' ? '239, 68, 68' : row.cor === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                        onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <td style={{ padding: '12px 8px', width: '50px', textAlign: 'center' }}>{badge}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{row.nome}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{row.cliente}</div>
                        </td>
                        <td style={{ padding: '12px 8px', color: row.cor, fontWeight: 700, textAlign: 'center', fontSize: '18px' }}>
                          {row.total}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{color: '#94a3b8', padding: '12px'}}>Nenhum atestado encontrado.</div>
            )}
          </div>
        </div>

        <div className="card chart-card glass-panel" style={{ maxHeight: '600px' }}>
          <div className="chart-header"><div className="chart-title">Atestados por Cliente (Top 15)</div></div>
          <div className="chart-wrapper">
            {atestadosPorCliente.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atestadosPorCliente} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false}/>
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="cliente" type="category" stroke="#94a3b8" width={120} tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="total" name="Total de Atestados" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>
      </div>

      {selectedAtestadoPerson && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
                <Stethoscope size={20} color={selectedAtestadoPerson.cor} />
                Ficha Médica
              </h2>
              <button onClick={() => setSelectedAtestadoPerson(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='#fff'} onMouseOut={(e)=>e.currentTarget.style.color='#94a3b8'}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: selectedAtestadoPerson.cor, marginBottom: '8px' }}>{selectedAtestadoPerson.nome}</div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Cliente Principal: {selectedAtestadoPerson.cliente}</div>
              <div style={{ color: '#e2e8f0', fontSize: '14px', marginTop: '12px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'inline-block' }}>
                Total de Dias Afastado: <strong style={{ color: selectedAtestadoPerson.cor, fontSize: '16px' }}>{selectedAtestadoPerson.total}</strong>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', backdropFilter: 'blur(4px)' }}>
                  <tr>
                    <th style={{ padding: '16px', fontWeight: 600, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período</th>
                    <th style={{ padding: '16px', fontWeight: 600, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnóstico / Hospital</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAtestadoPerson.dias.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '16px', color: '#e2e8f0', fontSize: '14px', verticalAlign: 'top' }}>{d.data}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{d.doenca}</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                          Hospital: {d.hosp}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></div>
                          Médico: {d.medico} {d.crm ? `(CRM: ${d.crm})` : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderDisciplina = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={handleExportDisciplina}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
            background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' 
          }}
        >
          <Download size={18} /> Exportar Faltas (CSV)
        </button>
      </div>
      <div className="stats-grid">
        <div className="card stat-card glass-panel">
          <div className="stat-title">Faltas (Tipo S)</div>
          <div className="stat-value">{totalsDisc.total_s}</div>
        </div>
        <div className="card stat-card glass-panel" style={{ borderColor: discAlertas && discAlertas.length > 0 ? '#ef4444' : 'var(--border-color)' }}>
          <div className="stat-title" style={{ color: discAlertas && discAlertas.length > 0 ? '#ef4444' : 'inherit' }}>Alertas (Telegramas)</div>
          <div className="stat-value" style={{ color: discAlertas && discAlertas.length > 0 ? '#ef4444' : 'inherit' }}>{discAlertas ? discAlertas.length : 0}</div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gridAutoRows: 'minmax(280px, 1fr)', marginBottom: '24px' }}>
        <div className="card chart-card glass-panel" style={{ gridColumn: '1 / span 2' }}>
          <div className="chart-header"><div className="chart-title">Ocorrências por Dia (Tipo S)</div></div>
          <div className="chart-wrapper">
            {discFaltasPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={discFaltasPorDia} margin={{ bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorFaltasDisc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="dia" stroke="#94a3b8" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={40}/>
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="faltas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFaltasDisc)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Importe a planilha de Disciplina</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel">
          <div className="chart-header"><div className="chart-title">Concentração por Área</div></div>
          <div className="chart-wrapper">
            {discFaltasPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discFaltasPorArea} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false}/>
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="value" name="Faltas (S)" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (<div style={{color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>Sem dados</div>)}
          </div>
        </div>

        <div className="card chart-card glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div className="chart-title" style={{ color: '#ef4444' }}>Ação de RH: Emissão de Telegramas</div>
          </div>
          <div className="chart-wrapper" style={{ overflowY: 'auto' }}>
            <div className="reserva-table">
            {discAlertas && discAlertas.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Nome</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Faltas</th>
                    <th style={{ padding: '12px 8px', fontWeight: 500 }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {discAlertas.map((row, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedDisciplinaPerson(row)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: `rgba(${row.cor === '#ef4444' ? '239, 68, 68' : row.cor === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.1)`, cursor: 'pointer', transition: 'filter 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.2)'}
                      onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                    >
                      <td style={{ padding: '12px 8px' }}>{row.nome}</td>
                      <td style={{ padding: '12px 8px', color: row.cor, fontWeight: 700 }}>{row.faltas}</td>
                      <td style={{ padding: '12px 8px' }}><span style={{ backgroundColor: row.cor, color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{row.alerta}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{color: '#10b981', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                Nenhum colaborador precisando de telegrama.
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {selectedDisciplinaPerson && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
                <AlertTriangle size={20} color={selectedDisciplinaPerson.cor || '#ef4444'} />
                Ficha Disciplinar
              </h2>
              <button onClick={() => setSelectedDisciplinaPerson(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='#fff'} onMouseOut={(e)=>e.currentTarget.style.color='#94a3b8'}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: selectedDisciplinaPerson.cor || '#ef4444', marginBottom: '8px' }}>{selectedDisciplinaPerson.nome}</div>
              <div style={{ color: '#e2e8f0', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-block' }}>
                Total de Ocorrências: <strong>{selectedDisciplinaPerson.faltas}</strong>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#1e293b', backdropFilter: 'blur(4px)' }}>
                  <tr>
                    <th style={{ padding: '16px', fontWeight: 600, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data</th>
                    <th style={{ padding: '16px', fontWeight: 600, color: '#94a3b8', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ocorrência / Área</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDisciplinaPerson.ocorrencias.map((oc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseOut={(e)=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '16px', color: '#e2e8f0', fontSize: '14px', verticalAlign: 'top' }}>{oc.data}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>{oc.nomeocor} {oc.codocor ? `(${oc.codocor})` : ''}</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></div>
                          {oc.area}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;

  if (currentUser.role === 'SUPERVISOR') {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
            <img src="/logo.jpg" alt="GSolimpio" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59, 130, 246, 0.5)' }} />
            GS-Control App
          </div>
          <button onClick={handleLogout} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'transparent', border: 'none', fontWeight: 600 }}>
            <LogOut size={18} /> Sair
          </button>
        </div>
        <SupervisorApp currentUser={currentUser} />
      </div>
    );
  }

  if (activeMenu === 'Apresentação' || activeMenu === 'Apresentação' || activeMenu === 'Apresentação') {
    return (
      <div className="tv-mode" style={{ background: 'transparent', minHeight: '100vh', padding: '20px' }}>
        <style>{`body { overflow: hidden !important; margin: 0; padding: 0; }`}</style>
        <svg style={{ height: 0, position: 'absolute' }}>
          <defs>
            <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.9}/>
            </linearGradient>
            <linearGradient id="colorConsumo" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#059669" stopOpacity={0.9}/>
            </linearGradient>
            <linearGradient id="colorRanking" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#d97706" stopOpacity={0.9}/>
            </linearGradient>
          </defs>
        </svg>

        <button 
          onClick={() => setActiveMenu('rh')} 
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Sair do Modo TV
        </button>
        
        {/* Usando animação suave de fade na transição se possível, mas React sozinho re-renderiza brusco. O importante é alternar. */}
        {tvScreens[ApresentacaoStep] === 'rh' && renderRH()}
        {tvScreens[ApresentacaoStep] === 'frota' && renderFrota()}
        {tvScreens[ApresentacaoStep] === 'disciplina' && renderDisciplina()}
        {tvScreens[ApresentacaoStep] === 'atestados' && renderAtestados()}
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <svg style={{ height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorConsumo" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#059669" stopOpacity={0.9}/>
          </linearGradient>
          <linearGradient id="colorRanking" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#d97706" stopOpacity={0.9}/>
          </linearGradient>
        </defs>
      </svg>
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.jpg" alt="GSolimpio" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59, 130, 246, 0.5)' }} />
          GS-Control
        </div>
                        <nav className="nav-menu">
          {currentUser.role !== 'SUPERVISOR' && (
            <>
              {hasAccess(currentUser, 'rh') && (
                <a className={`nav-item ${activeMenu === 'rh' ? 'active' : ''}`} onClick={() => setActiveMenu('rh')}>
                  <Users size={20} />
                  <span>Gestão de Efetivos</span>
                </a>
              )}
              {hasAccess(currentUser, 'frota') && (
                <a className={`nav-item ${activeMenu === 'frota' ? 'active' : ''}`} onClick={() => setActiveMenu('frota')}>
                  <Car size={20} />
                  <span>Gestão de Frota</span>
                </a>
              )}
              {hasAccess(currentUser, 'disciplina') && (
                <a className={`nav-item ${activeMenu === 'disciplina' ? 'active' : ''}`} onClick={() => setActiveMenu('disciplina')}>
                  <FileText size={20} />
                  <span>Disciplina</span>
                </a>
              )}
              {hasAccess(currentUser, 'atestados') && (
                <a className={`nav-item ${activeMenu === 'atestados' ? 'active' : ''}`} onClick={() => setActiveMenu('atestados')}>
                  <Stethoscope size={20} />
                  <span>Campeões de Atestado</span>
                </a>
              )}
              {hasAccess(currentUser, 'monitoramento') && (
                <a className={`nav-item ${activeMenu === 'monitoramento' ? 'active' : ''}`} onClick={() => setActiveMenu('monitoramento')}>
                  <MapPin size={20} />
                  <span>Monitoramento</span>
                </a>
              )}
              {hasAccess(currentUser, 'Apresentação') && (
                <a className={`nav-item ${activeMenu === 'Apresentação' ? 'active' : ''}`} onClick={() => setActiveMenu('Apresentação')}>
                  <Activity size={20} />
                  <span>Modo Apresentação (TV)</span>
                </a>
              )}
              
              {hasAccess(currentUser, 'Apresentação') && (
                <div style={{ margin: '8px 16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Tempo no Modo TV:</label>
                  <select 
                    value={tvInterval}
                    onChange={(e) => setTvInterval(Number(e.target.value))}
                    style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '6px', fontSize: '13px', width: '100%', cursor: 'pointer' }}
                  >
                    <option value={5}>5 segundos</option>
                    <option value={10}>10 segundos</option>
                    <option value={15}>15 segundos</option>
                    <option value={30}>30 segundos</option>
                    <option value={60}>1 minuto</option>
                  </select>
                  
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginTop: '12px' }}>Telas do Modo TV:</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {[
                      { id: 'rh', label: 'Efetivo (RH)' },
                      { id: 'frota', label: 'Frota' },
                      { id: 'disciplina', label: 'Disciplina' },
                      { id: 'atestados', label: 'Atestados' }
                    ].map(tela => (
                      <label key={tela.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={tvScreens.includes(tela.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTvScreens(prev => [...prev, tela.id]);
                            } else {
                              setTvScreens(prev => prev.length > 1 ? prev.filter(id => id !== tela.id) : prev);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        {tela.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentUser.role === 'MASTER' && (
            <a className={`nav-item ${activeMenu === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveMenu('usuarios')}>
              <Settings size={20} />
              <span>Usuários</span>
            </a>
          )}
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '0 16px', color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
            Olá, <strong style={{color: '#fff'}}>{currentUser.username}</strong> ({currentUser.role})
          </div>
          <a className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </a>
        </div>
      </aside>

      <main className="main-content">
        <header className="header" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Painel de Controle</h1>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(30, 41, 59, 0.4)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mês Ref:</label>
                <input 
                  type="month" 
                  value={filters.dataInicio ? filters.dataInicio.substring(0, 7) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setAllFilters({ ...allFilters, [activeMenu]: { ...filters, dataInicio: '', dataFim: '' } });
                    } else {
                      const [year, month] = val.split('-');
                      const lastDay = new Date(year, month, 0).getDate();
                      setAllFilters({ 
                        ...allFilters, 
                        [activeMenu]: {
                          ...filters,
                          dataInicio: `${val}-01`, 
                          dataFim: `${val}-${lastDay}` 
                        }
                      });
                    }
                  }}
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    border: '1px solid rgba(148, 163, 184, 0.2)', 
                    color: '#f8fafc', 
                    padding: '6px 12px', 
                    borderRadius: '8px',
                    outline: 'none',
                    colorScheme: 'dark',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }} 
                  onMouseOver={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.5)'}
                  onMouseOut={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                />
              </div>

              {(activeMenu === 'rh' || activeMenu === 'atestados' || activeMenu === 'disciplina') && (
                <>
                  <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {activeMenu === 'disciplina' ? 'Área:' : 'Cliente:'}
                    </label>
                    <select 
                      value={filters.cliente || ''}
                      onChange={(e) => {
                        setAllFilters({ 
                          ...allFilters, 
                          [activeMenu]: { ...filters, cliente: e.target.value } 
                        });
                      }}
                      style={{ 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        border: '1px solid rgba(148, 163, 184, 0.2)', 
                        color: '#f8fafc', 
                        padding: '6px 12px', 
                        borderRadius: '8px',
                        outline: 'none',
                        maxWidth: '220px',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        appearance: 'auto'
                      }}
                      onMouseOver={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.5)'}
                      onMouseOut={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                    >
                      <option value="">Todos os {activeMenu === 'disciplina' ? 'Setores' : 'Clientes'}</option>
                      {activeMenu === 'rh' && uniqueClientesRH.map(c => <option key={c} value={c}>{c}</option>)}
                      {activeMenu === 'atestados' && uniqueClientesAtestados.map(c => <option key={c} value={c}>{c}</option>)}
                      {activeMenu === 'disciplina' && uniqueAreasDisciplina.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <label className="upload-btn">
                <input type="file" onChange={handleFileUpload} />
                Importar Planilha
              </label>
            </div>
          </div>
        </header>

        
        {activeMenu === 'rh' && renderRH()}
        {activeMenu === 'frota' && renderFrota()}
        {activeMenu === 'disciplina' && renderDisciplina()}
        {activeMenu === 'atestados' && renderAtestados()}
        {activeMenu === 'monitoramento' && <Monitoramento currentUser={currentUser} />}
        {activeMenu === 'app_supervisor' && <SupervisorApp currentUser={currentUser} />}
        {activeMenu === 'usuarios' && <Usuarios currentUser={currentUser} />}
      </main>
    </div>
  );
};

export default App;
