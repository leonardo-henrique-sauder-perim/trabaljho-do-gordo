// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let servicos = JSON.parse(localStorage.getItem('servicos')) || [];
    let barbeiros = JSON.parse(localStorage.getItem('barbeiros')) || [];
    let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
    let financeiro = JSON.parse(localStorage.getItem('financeiro')) || [];
    let currentYear = new Date().getFullYear();
    let anosFinanceiro = Array.from({length: 5}, (_, i) => currentYear - i);
    let chartInstance = null;

    // Elementos do DOM
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a');
    const modalContainer = document.getElementById('modal-container');
    const modals = document.querySelectorAll('.modal');
    
    // Inicialização
    initAnosFinanceiro();
    initEspecialidades();
    loadDashboard();
    setupNavigation();
    setupModals();
    setupEventListeners();
    // Garante que a tabela de clientes do histórico sempre aparece ao carregar a página
    renderTabelaHistoricoClientes();

    // Funções de inicialização
    function initAnosFinanceiro() {
        const selectAno = document.getElementById('ano-financeiro');
        selectAno.innerHTML = anosFinanceiro.map(year => 
            `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
        ).join('');
    }

    function initEspecialidades() {
        const especialidades = ['Corte de Cabelo', 'Barba', 'Sobrancelha', 'Pézinho', 'Hidratação', 'Progressiva'];
        const selectEspecialidades = document.getElementById('barbeiro-especialidades');
        selectEspecialidades.innerHTML = especialidades.map(esp => 
            `<option value="${esp}">${esp}</option>`
        ).join('');
    }

    // Navegação entre seções
    function setupNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                
                // Atualiza navegação ativa
                navLinks.forEach(navLink => navLink.classList.remove('active'));
                this.classList.add('active');
                
                // Mostra a seção correspondente
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === sectionId) {
                        section.classList.add('active');
                        
                        // Carrega dados específicos da seção
                        switch(sectionId) {
                            case 'dashboard':
                                loadDashboard();
                                break;
                            case 'agendamentos':
                                loadAgendamentos();
                                break;
                            case 'clientes':
                                loadClientes();
                                break;
                            case 'servicos':
                                loadServicos();
                                break;
                            case 'barbeiros':
                                loadBarbeiros();
                                break;
                            case 'financeiro':
                                loadFinanceiro();
                                break;
                        }
                    }
                // (Bloco de lixeira drag and drop removido - exclusão agora só via botão de lixeira nas tabelas)

});
            });
        });
    }

    // Modais
    function setupModals() {
        // Fechar modais ao clicar fora
        modalContainer.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });

        // Botões para abrir modais
        document.getElementById('novo-agendamento').addEventListener('click', () => openModal('agendamento'));
        document.getElementById('novo-cliente').addEventListener('click', () => openModal('cliente'));
        document.getElementById('novo-servico').addEventListener('click', () => openModal('servico'));
        document.getElementById('novo-barbeiro').addEventListener('click', () => openModal('barbeiro'));

        // Botões de cancelar
        document.getElementById('cancelar-agendamento').addEventListener('click', () => closeAllModals());
        document.getElementById('cancelar-cliente').addEventListener('click', () => closeAllModals());
        document.getElementById('cancelar-servico').addEventListener('click', () => closeAllModals());
        document.getElementById('cancelar-barbeiro').addEventListener('click', () => closeAllModals());

        // Formulários
        document.getElementById('form-agendamento').addEventListener('submit', handleAgendamentoSubmit);
        document.getElementById('form-cliente').addEventListener('submit', handleClienteSubmit);
        document.getElementById('form-servico').addEventListener('submit', handleServicoSubmit);
        document.getElementById('form-barbeiro').addEventListener('submit', handleBarbeiroSubmit);
    }

    function openModal(modalType, id = null) {
        closeAllModals();
        modalContainer.style.display = 'flex';
        
        const modal = document.getElementById(`modal-${modalType}`);
        modal.style.display = 'block';
        
        // Configura o modal com dados existentes se um ID for fornecido
        if (id) {
            document.getElementById(`${modalType}-id`).value = id;
            document.getElementById(`modal-${modalType}-titulo`).textContent = 'Editar';
            
            switch(modalType) {
                case 'agendamento':
                    loadAgendamentoData(id);
                    break;
                case 'cliente':
                    loadClienteData(id);
                    break;
                case 'servico':
                    loadServicoData(id);
                    break;
                case 'barbeiro':
                    loadBarbeiroData(id);
                    break;
            }
        } else {
            document.getElementById(`${modalType}-id`).value = '';
            document.getElementById(`modal-${modalType}-titulo`).textContent = 'Novo';
            
            // Limpa os campos
            const form = document.getElementById(`form-${modalType}`);
            if (form) form.reset();
            
            // Preenche selects dinâmicos
            if (modalType === 'agendamento') {
                populateAgendamentoSelects();
            }
        }
    }

    function closeAllModals() {
        modalContainer.style.display = 'none';
        modals.forEach(modal => modal.style.display = 'none');
    }

    // Funções para carregar dados
    function loadDashboard() {
        // Atualiza estatísticas
        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = agendamentos.filter(a => a.data === hoje).length;
        document.getElementById('agendamentos-hoje').textContent = agendamentosHoje;
        document.getElementById('total-clientes').textContent = clientes.length;
        
        // Calcula faturamento mensal
        const mesAtual = new Date().getMonth() + 1;
        const faturamento = agendamentos
            .filter(a => new Date(a.data).getMonth() + 1 === mesAtual && a.status === 'finalizado')
            .reduce((total, a) => total + parseFloat(a.valor || 0), 0);
        document.getElementById('faturamento-mensal').textContent = `R$ ${faturamento.toFixed(2)}`;
        
        // Carrega tabela de agendamentos do dia
        loadTabelaAgendamentosHoje();
    }

    function loadTabelaAgendamentosHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = agendamentos.filter(a => a.data === hoje);
        const tbody = document.querySelector('#tabela-agendamentos-hoje tbody');
        
        tbody.innerHTML = agendamentosHoje.map(agendamento => {
            const cliente = clientes.find(c => c.id === agendamento.clienteId) || {};
            const servico = servicos.find(s => s.id === agendamento.servicoId) || {};
            const barbeiro = barbeiros.find(b => b.id === agendamento.barbeiroId) || {};
            
            return `
                <tr>
                    <td>${agendamento.hora}</td>
                    <td>${cliente.nome || 'N/A'}</td>
                    <td>${servico.nome || 'N/A'}</td>
                    <td>${barbeiro.nome || 'N/A'}</td>
                    <td><span class="status ${agendamento.status}">${agendamento.status}</span></td>
                    <td>
                        <button class="btn-icon edit" data-id="${agendamento.id}" data-type="agendamento">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" data-id="${agendamento.id}" data-type="agendamento">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function loadAgendamentos() {
        const tbody = document.querySelector('#tabela-agendamentos tbody');
        tbody.innerHTML = agendamentos.map(agendamento => {
            const cliente = clientes.find(c => c.id === agendamento.clienteId) || {};
            const servico = servicos.find(s => s.id === agendamento.servicoId) || {};
            const barbeiro = barbeiros.find(b => b.id === agendamento.barbeiroId) || {};
            
            return `
                <tr>
                    <td>${formatDate(agendamento.data)}</td>
                    <td>${agendamento.hora}</td>
                    <td>${cliente.nome || 'N/A'}</td>
                    <td>${servico.nome || 'N/A'}</td>
                    <td>${barbeiro.nome || 'N/A'}</td>
                    <td><span class="status ${agendamento.status}">${agendamento.status}</span></td>
                    <td>
                        <button class="btn-icon edit" data-id="${agendamento.id}" data-type="agendamento">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" data-id="${agendamento.id}" data-type="agendamento">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function loadClientes() {
        const tbody = document.querySelector('#tabela-clientes tbody');
        tbody.innerHTML = clientes.map(cliente => {
            const agendamentosCliente = agendamentos.filter(a => a.clienteId === cliente.id).length;
            return `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.cpf || 'N/A'}</td>
                    <td>${cliente.rg || 'N/A'}</td>
                    <td>${formatPhone(cliente.telefone)}</td>
                    <td>${cliente.email || 'N/A'}</td>
                    <td>${agendamentosCliente}</td>
                    <td>
                        <button class="btn-icon edit" data-id="${cliente.id}" data-type="cliente">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" data-id="${cliente.id}" data-type="cliente">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function loadServicos() {
        const tbody = document.querySelector('#tabela-servicos tbody');
        tbody.innerHTML = servicos.map(servico => {
            return `
                <tr>
                    <td>${servico.nome}</td>
                    <td>${servico.duracao}</td>
                    <td>R$ ${servico.preco.toFixed(2)}</td>
                    <td>
                        <button class="btn-icon edit" data-id="${servico.id}" data-type="servico">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" data-id="${servico.id}" data-type="servico">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function loadBarbeiros() {
        const tbody = document.querySelector('#tabela-barbeiros tbody');
        tbody.innerHTML = barbeiros.map(barbeiro => {
            return `
                <tr>
                    <td>${barbeiro.nome}</td>
                    <td>${barbeiro.cpf || 'N/A'}</td>
                    <td>${barbeiro.rg || 'N/A'}</td>
                    <td>${formatPhone(barbeiro.telefone)}</td>
                    <td>${barbeiro.email || 'N/A'}</td>
                    <td>${barbeiro.especialidades.join(', ')}</td>
                    <td><span class="status ${barbeiro.status}">${barbeiro.status}</span></td>
                    <td>
                        <button class="btn-icon edit" data-id="${barbeiro.id}" data-type="barbeiro">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" data-id="${barbeiro.id}" data-type="barbeiro">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function loadFinanceiro() {
        const mes = document.getElementById('mes-financeiro').value;
        const ano = document.getElementById('ano-financeiro').value;
        
        // Filtra agendamentos finalizados no mês/ano selecionado
        const agendamentosFiltrados = agendamentos.filter(a => {
            const date = new Date(a.data);
            return date.getMonth() + 1 == mes && 
                   date.getFullYear() == ano && 
                   a.status === 'finalizado';
        });
        
        // Atualiza resumo financeiro
        const totalRecebido = agendamentosFiltrados.reduce((total, a) => total + parseFloat(a.valor || 0), 0);
        document.getElementById('total-recebido').textContent = `R$ ${totalRecebido.toFixed(2)}`;
        
        // Serviço mais popular
        const servicosCount = {};
        agendamentosFiltrados.forEach(a => {
            const servico = servicos.find(s => s.id === a.servicoId);
            if (servico) {
                servicosCount[servico.nome] = (servicosCount[servico.nome] || 0) + 1;
            }
        });
        
        const servicoPopular = Object.entries(servicosCount).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('servico-popular').textContent = servicoPopular ? `${servicoPopular[0]} (${servicoPopular[1]}x)` : '-';
        
        // Barbeiro mais ativo
        const barbeirosCount = {};
        agendamentosFiltrados.forEach(a => {
            const barbeiro = barbeiros.find(b => b.id === a.barbeiroId);
            if (barbeiro) {
                barbeirosCount[barbeiro.nome] = (barbeirosCount[barbeiro.nome] || 0) + 1;
            }
        });
        
        const barbeiroAtivo = Object.entries(barbeirosCount).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('barbeiro-ativo').textContent = barbeiroAtivo ? `${barbeiroAtivo[0]} (${barbeiroAtivo[1]}x)` : '-';
        
        // Carrega tabela de relatório
        const tbody = document.querySelector('#tabela-financeiro tbody');
        tbody.innerHTML = agendamentosFiltrados.map(agendamento => {
            const cliente = clientes.find(c => c.id === agendamento.clienteId) || {};
            const servico = servicos.find(s => s.id === agendamento.servicoId) || {};
            const barbeiro = barbeiros.find(b => b.id === agendamento.barbeiroId) || {};
            
            return `
                <tr>
                    <td>${formatDate(agendamento.data)}</td>
                    <td>${cliente.nome || 'N/A'}</td>
                    <td>${servico.nome || 'N/A'}</td>
                    <td>${barbeiro.nome || 'N/A'}</td>
                    <td>R$ ${agendamento.valor?.toFixed(2) || '0.00'}</td>
                    <td><span class="status ${agendamento.status}">${agendamento.status}</span></td>
                </tr>
            `;
        }).join('');
        
        // Atualiza gráfico
        updateChart(agendamentosFiltrados);
    }

    function updateChart(agendamentosFiltrados) {
        const ctx = document.getElementById('grafico-financeiro').getContext('2d');
        
        // Agrupa por semana
        const semanas = {};
        agendamentosFiltrados.forEach(a => {
            const date = new Date(a.data);
            const semana = Math.ceil(date.getDate() / 7);
            const semanaKey = `Semana ${semana}`;
            
            if (!semanas[semanaKey]) {
                semanas[semanaKey] = 0;
            }
            
            semanas[semanaKey] += parseFloat(a.valor || 0);
        });
        
        const labels = Object.keys(semanas);
        const data = Object.values(semanas);
        
        // Destrói o gráfico anterior se existir
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Faturamento por Semana (R$)',
                    data: data,
                    backgroundColor: 'rgba(110, 72, 170, 0.7)',
                    borderColor: 'rgba(110, 72, 170, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Funções auxiliares para formulários
    function populateAgendamentoSelects() {
        const selectCliente = document.getElementById('agendamento-cliente');
        const selectServico = document.getElementById('agendamento-servico');
        const selectBarbeiro = document.getElementById('agendamento-barbeiro');
        
        selectCliente.innerHTML = '<option value="">Selecione um cliente</option>' + 
            clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        
        selectServico.innerHTML = '<option value="">Selecione um serviço</option>' + 
            servicos.map(s => `<option value="${s.id}">${s.nome} (R$ ${s.preco.toFixed(2)})</option>`).join('');
        
        selectBarbeiro.innerHTML = '<option value="">Selecione um barbeiro</option>' + 
            barbeiros.filter(b => b.status === 'ativo').map(b => `<option value="${b.id}">${b.nome}</option>`).join('');
    }

    function loadAgendamentoData(id) {
        const agendamento = agendamentos.find(a => a.id === id);
        if (!agendamento) return;
        
        populateAgendamentoSelects();
        
        document.getElementById('agendamento-cliente').value = agendamento.clienteId;
        document.getElementById('agendamento-servico').value = agendamento.servicoId;
        document.getElementById('agendamento-barbeiro').value = agendamento.barbeiroId;
        document.getElementById('agendamento-data').value = agendamento.data;
        document.getElementById('agendamento-hora').value = agendamento.hora;
        document.getElementById('agendamento-status').value = agendamento.status;
        document.getElementById('agendamento-observacoes').value = agendamento.observacoes || '';
    }

    function loadClienteData(id) {
        const cliente = clientes.find(c => c.id === id);
        if (!cliente) return;
        
        document.getElementById('cliente-nome').value = cliente.nome;
        document.getElementById('cliente-telefone').value = cliente.telefone;
        document.getElementById('cliente-email').value = cliente.email || '';
        document.getElementById('cliente-data-nascimento').value = cliente.dataNascimento || '';
    }

    function loadServicoData(id) {
        const servico = servicos.find(s => s.id === id);
        if (!servico) return;
        
        document.getElementById('servico-nome').value = servico.nome;
        document.getElementById('servico-duracao').value = servico.duracao;
        document.getElementById('servico-preco').value = servico.preco;
        document.getElementById('servico-descricao').value = servico.descricao || '';
    }

    function loadBarbeiroData(id) {
        const barbeiro = barbeiros.find(b => b.id === id);
        if (!barbeiro) return;
        
        document.getElementById('barbeiro-nome').value = barbeiro.nome;
        document.getElementById('barbeiro-telefone').value = barbeiro.telefone;
        document.getElementById('barbeiro-email').value = barbeiro.email || '';
        
        const selectEspecialidades = document.getElementById('barbeiro-especialidades');
        Array.from(selectEspecialidades.options).forEach(option => {
            option.selected = barbeiro.especialidades.includes(option.value);
        });
        
        document.getElementById('barbeiro-status').value = barbeiro.status;
    }

    // Handlers de formulários
    function handleAgendamentoSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('agendamento-id').value;
        const clienteId = document.getElementById('agendamento-cliente').value;
        const servicoId = document.getElementById('agendamento-servico').value;
        const barbeiroId = document.getElementById('agendamento-barbeiro').value;
        const data = document.getElementById('agendamento-data').value;
        const hora = document.getElementById('agendamento-hora').value;
        const status = document.getElementById('agendamento-status').value;
        const observacoes = document.getElementById('agendamento-observacoes').value;
        
        const servico = servicos.find(s => s.id === servicoId);
        
        const agendamento = {
            id: id || generateId(),
            clienteId,
            servicoId,
            barbeiroId,
            data,
            hora,
            status,
            observacoes,
            valor: servico?.preco || 0
        };
        
        if (id) {
            // Atualiza agendamento existente
            const index = agendamentos.findIndex(a => a.id === id);
            agendamentos[index] = agendamento;
        } else {
            // Adiciona novo agendamento
            agendamentos.push(agendamento);
        }
        
        saveData();
        closeAllModals();
        loadAgendamentos();
        loadDashboard();
    }

    function handleClienteSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('cliente-id').value;
        const nome = document.getElementById('cliente-nome').value;
        const telefone = document.getElementById('cliente-telefone').value;
        const email = document.getElementById('cliente-email').value;
        const dataNascimento = document.getElementById('cliente-data-nascimento').value;
        const cpf = document.getElementById('cliente-cpf') ? document.getElementById('cliente-cpf').value : '';
        const rg = document.getElementById('cliente-rg') ? document.getElementById('cliente-rg').value : '';
        
        const cliente = {
            id: id || generateId(),
            nome,
            telefone,
            email,
            dataNascimento,
            cpf,
            rg
        };
        
        if (id) {
            // Atualiza cliente existente
            const index = clientes.findIndex(c => c.id === id);
            clientes[index] = cliente;
        } else {
            // Adiciona novo cliente
            clientes.push(cliente);
        }
        
        saveData();
        closeAllModals();
        loadClientes();
    }

    function handleServicoSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('servico-id').value;
        const nome = document.getElementById('servico-nome').value;
        const duracao = document.getElementById('servico-duracao').value;
        const preco = document.getElementById('servico-preco').value;
        const descricao = document.getElementById('servico-descricao').value;
        
        const servico = {
            id: id || generateId(),
            nome,
            duracao: parseInt(duracao),
            preco: parseFloat(preco),
            descricao
        };
        
        if (id) {
            // Atualiza serviço existente
            const index = servicos.findIndex(s => s.id === id);
            servicos[index] = servico;
        } else {
            // Adiciona novo serviço
            servicos.push(servico);
        }
        
        saveData();
        closeAllModals();
        loadServicos();
    }

    function handleBarbeiroSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('barbeiro-id').value;
        const nome = document.getElementById('barbeiro-nome').value;
        const telefone = document.getElementById('barbeiro-telefone').value;
        const email = document.getElementById('barbeiro-email').value;
        const especialidades = Array.from(document.getElementById('barbeiro-especialidades').selectedOptions)
            .map(option => option.value);
        const status = document.getElementById('barbeiro-status').value;
        const cpf = document.getElementById('barbeiro-cpf') ? document.getElementById('barbeiro-cpf').value : '';
        const rg = document.getElementById('barbeiro-rg') ? document.getElementById('barbeiro-rg').value : '';
        
        const barbeiro = {
            id: id || generateId(),
            nome,
            telefone,
            email,
            especialidades,
            status,
            cpf,
            rg
        };
        
        if (id) {
            // Atualiza barbeiro existente
            const index = barbeiros.findIndex(b => b.id === id);
            barbeiros[index] = barbeiro;
        } else {
            // Adiciona novo barbeiro
            barbeiros.push(barbeiro);
        }
        
        saveData();
        closeAllModals();
        loadBarbeiros();
    }

    // Funções de utilidade
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    function saveData() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
        localStorage.setItem('servicos', JSON.stringify(servicos));
        localStorage.setItem('barbeiros', JSON.stringify(barbeiros));
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        localStorage.setItem('financeiro', JSON.stringify(financeiro));
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function formatPhone(phone) {
        if (!phone) return 'N/A';
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Configuração de event listeners
    function setupEventListeners() {
        // Filtros de agendamentos
        document.getElementById('filtro-data').addEventListener('change', loadAgendamentos);
        document.getElementById('filtro-barbeiro').addEventListener('change', loadAgendamentos);
        document.getElementById('filtro-status').addEventListener('change', loadAgendamentos);
        
        // Filtros de financeiro
        document.getElementById('mes-financeiro').addEventListener('change', loadFinanceiro);
        document.getElementById('ano-financeiro').addEventListener('change', loadFinanceiro);
        
        // Botões de ação
        document.getElementById('gerar-relatorio').addEventListener('click', loadFinanceiro);
        document.getElementById('exportar-relatorio').addEventListener('click', exportRelatorio);
        
        // Buscas
        document.getElementById('btn-busca-cliente').addEventListener('click', searchClientes);
        document.getElementById('btn-busca-servico').addEventListener('click', searchServicos);
        document.getElementById('btn-busca-barbeiro').addEventListener('click', searchBarbeiros);

        // Histórico: busca e interação
        document.getElementById('btn-busca-historico-cliente').addEventListener('click', renderTabelaHistoricoClientes);
        document.getElementById('busca-historico-cliente').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') renderTabelaHistoricoClientes();
            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === ' ') {
                if (this.value.trim() === '') renderTabelaHistoricoClientes();
            }
        });
        document.getElementById('fechar-historico-cliente').addEventListener('click', function() {
            document.getElementById('painel-historico-cliente').style.display = 'none';
        });

        // Sempre renderiza a tabela de clientes ao abrir a aba Histórico
        document.querySelector('a[data-section="historico"]').addEventListener('click', function() {
            setTimeout(renderTabelaHistoricoClientes, 100); // timeout para garantir que a aba está visível
        });

        // Editar/Excluir via tabelas
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit') || e.target.closest('.edit')) {
                const button = e.target.classList.contains('edit') ? e.target : e.target.closest('.edit');
                const id = button.getAttribute('data-id');
                const type = button.getAttribute('data-type');
                openModal(type, id);
            }
            
            if (e.target.classList.contains('delete') || e.target.closest('.delete')) {
                const button = e.target.classList.contains('delete') ? e.target : e.target.closest('.delete');
                const id = button.getAttribute('data-id');
                const type = button.getAttribute('data-type');
                confirmDelete(type, id);
            }
            // Histórico: ver histórico do cliente
            if (e.target.classList.contains('btn-ver-historico')) {
                const id = e.target.getAttribute('data-id');
                mostrarHistoricoCliente(id);
            }
        });
    }

    // Renderiza as tabelas de clientes na aba Histórico
    function renderTabelaHistoricoClientes() {
        const termo = document.getElementById('busca-historico-cliente').value.toLowerCase();
        const todosTbody = document.querySelector('#tabela-todos-clientes tbody');
        const pesquisaContainer = document.getElementById('tabela-pesquisa-clientes-container');
        const pesquisaTbody = document.querySelector('#tabela-pesquisa-clientes tbody');
        // Tabela de todos os clientes (sempre visível)
        let listaTodos = [...clientes];
        listaTodos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        todosTbody.innerHTML = listaTodos.map(cliente => `
            <tr>
                <td>${cliente.nome}</td>
                <td>${cliente.cpf || 'N/A'}</td>
                <td>${cliente.rg || 'N/A'}</td>
                <td>${formatPhone(cliente.telefone)}</td>
                <td>${cliente.email || 'N/A'}</td>
                <td><button class="btn-primary btn-ver-historico" data-id="${cliente.id}">Ver Histórico</button></td>
            </tr>
        `).join('');
        // Tabela de pesquisa (só aparece se houver termo)
        if (termo) {
            let listaPesquisa = listaTodos.filter(cliente =>
                (cliente.nome && cliente.nome.toLowerCase().includes(termo)) ||
                (cliente.cpf && cliente.cpf.toLowerCase().includes(termo)) ||
                (cliente.rg && cliente.rg.toLowerCase().includes(termo))
            );
            pesquisaTbody.innerHTML = listaPesquisa.map(cliente => `
                <tr>
                    <td>${cliente.nome}</td>
                    <td>${cliente.cpf || 'N/A'}</td>
                    <td>${cliente.rg || 'N/A'}</td>
                    <td>${formatPhone(cliente.telefone)}</td>
                    <td>${cliente.email || 'N/A'}</td>
                    <td><button class="btn-primary btn-ver-historico" data-id="${cliente.id}">Ver Histórico</button></td>
                </tr>
            `).join('');
            pesquisaContainer.style.display = '';
        } else {
            pesquisaTbody.innerHTML = '';
            pesquisaContainer.style.display = 'none';
        }
    }

    // Mostra o painel de histórico do cliente
    function mostrarHistoricoCliente(clienteId) {
        const cliente = clientes.find(c => String(c.id) === String(clienteId));
        if (!cliente) return;
        document.getElementById('painel-historico-cliente').style.display = 'block';
        document.getElementById('nome-historico-cliente').textContent = cliente.nome;
        const tbody = document.querySelector('#tabela-historico-agendamentos tbody');
        // Apenas agendamentos FINALIZADOS
        const ags = agendamentos.filter(a => String(a.clienteId) === String(clienteId) && a.status === 'finalizado');
        if (ags.length === 0) {
            tbody.innerHTML = '';
            document.getElementById('mensagem-sem-historico').style.display = 'block';
        } else {
            document.getElementById('mensagem-sem-historico').style.display = 'none';
            tbody.innerHTML = ags.map(a => {
                const servico = servicos.find(s => String(s.id) === String(a.servicoId));
                const barbeiro = barbeiros.find(b => String(b.id) === String(a.barbeiroId));
                return `<tr>
                    <td>${formatDate(a.data)}</td>
                    <td>${a.hora}</td>
                    <td>${servico ? servico.nome : 'N/A'}</td>
                    <td>${barbeiro ? barbeiro.nome : 'N/A'}</td>
                    <td>${a.status}</td>
                    <td>R$ ${a.valor ? a.valor.toFixed(2) : '0,00'}</td>
                </tr>`;
            }).join('');
        }
    }

    function searchClientes() {
        const termo = document.getElementById('busca-cliente').value.toLowerCase();
        const tbody = document.querySelector('#tabela-clientes tbody');
        
        tbody.innerHTML = clientes
            .filter(cliente => {
                return (
                    (cliente.nome && cliente.nome.toLowerCase().includes(termo)) ||
                    (cliente.cpf && cliente.cpf.toLowerCase().includes(termo)) ||
                    (cliente.rg && cliente.rg.toLowerCase().includes(termo))
                );
            })
            .map(cliente => {
                const agendamentosCliente = agendamentos.filter(a => a.clienteId === cliente.id).length;
                return `
                    <tr>
                        <td>${cliente.nome}</td>
                        <td>${cliente.cpf || 'N/A'}</td>
                        <td>${cliente.rg || 'N/A'}</td>
                        <td>${formatPhone(cliente.telefone)}</td>
                        <td>${cliente.email || 'N/A'}</td>
                        <td>${agendamentosCliente}</td>
                        <td>
                            <button class="btn-icon edit" data-id="${cliente.id}" data-type="cliente">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" data-id="${cliente.id}" data-type="cliente">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
    }

    function searchServicos() {
        const termo = document.getElementById('busca-servico').value.toLowerCase();
        const tbody = document.querySelector('#tabela-servicos tbody');
        
        tbody.innerHTML = servicos
            .filter(servico => servico.nome.toLowerCase().includes(termo))
            .map(servico => {
                return `
                    <tr>
                        <td>${servico.nome}</td>
                        <td>${servico.duracao}</td>
                        <td>R$ ${servico.preco.toFixed(2)}</td>
                        <td>
                            <button class="btn-icon edit" data-id="${servico.id}" data-type="servico">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" data-id="${servico.id}" data-type="servico">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
    }

    function searchBarbeiros() {
        const termo = document.getElementById('busca-barbeiro').value.toLowerCase();
        const tbody = document.querySelector('#tabela-barbeiros tbody');
        
        tbody.innerHTML = barbeiros
            .filter(barbeiro => {
                return (
                    (barbeiro.nome && barbeiro.nome.toLowerCase().includes(termo)) ||
                    (barbeiro.cpf && barbeiro.cpf.toLowerCase().includes(termo)) ||
                    (barbeiro.rg && barbeiro.rg.toLowerCase().includes(termo))
                );
            })
            .map(barbeiro => {
                return `
                    <tr>
                        <td>${barbeiro.nome}</td>
                        <td>${barbeiro.cpf || 'N/A'}</td>
                        <td>${barbeiro.rg || 'N/A'}</td>
                        <td>${formatPhone(barbeiro.telefone)}</td>
                        <td>${barbeiro.email || 'N/A'}</td>
                        <td>${barbeiro.especialidades.join(', ')}</td>
                        <td><span class="status ${barbeiro.status}">${barbeiro.status}</span></td>
                        <td>
                            <button class="btn-icon edit" data-id="${barbeiro.id}" data-type="barbeiro">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" data-id="${barbeiro.id}" data-type="barbeiro">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
    }

    function confirmDelete(type, id) {
        // Garante que o modal de confirmação aparece
        const modalContainer = document.getElementById('modal-container');
        const modalConfirmacao = document.getElementById('modal-confirmacao');
        if (modalContainer && modalConfirmacao) {
            modalContainer.style.display = 'flex';
            modalConfirmacao.style.display = 'block';
        }
        document.getElementById('modal-confirmacao-titulo').textContent = `Excluir ${type}`;
        document.getElementById('modal-confirmacao-mensagem').textContent = `Tem certeza que deseja excluir este ${type}? Esta ação não pode ser desfeita.`;

        // Remove todos os event listeners antigos do botão de confirmar
        const btnConfirmar = document.getElementById('confirmar-acao');
        const btnConfirmarClone = btnConfirmar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(btnConfirmarClone, btnConfirmar);

        // Remove todos os event listeners antigos do botão de cancelar
        const btnCancelar = document.getElementById('cancelar-acao');
        if (btnCancelar) {
            const btnCancelarClone = btnCancelar.cloneNode(true);
            btnCancelar.parentNode.replaceChild(btnCancelarClone, btnCancelar);
            btnCancelarClone.addEventListener('click', function() {
                if (modalContainer && modalConfirmacao) {
                    modalContainer.style.display = 'none';
                    modalConfirmacao.style.display = 'none';
                }
            });
        }

        btnConfirmarClone.addEventListener('click', function() {
            let atualizou = false;
            // Garante comparação de id como string
            const idStr = String(id);
            switch(type) {
                case 'agendamento':
                    agendamentos = agendamentos.filter(a => String(a.id) !== idStr);
                    atualizou = true;
                    break;
                case 'cliente':
                    clientes = clientes.filter(c => String(c.id) !== idStr);
                    agendamentos = agendamentos.filter(a => String(a.clienteId) !== idStr);
                    atualizou = true;
                    break;
                case 'servico':
                    servicos = servicos.filter(s => String(s.id) !== idStr);
                    agendamentos = agendamentos.filter(a => String(a.servicoId) !== idStr);
                    atualizou = true;
                    break;
                case 'barbeiro':
                    barbeiros = barbeiros.filter(b => String(b.id) !== idStr);
                    agendamentos = agendamentos.filter(a => String(a.barbeiroId) !== idStr);
                    atualizou = true;
                    break;
            }
            if (atualizou) {
                saveData();
            }
            if (modalContainer && modalConfirmacao) {
                modalContainer.style.display = 'none';
                modalConfirmacao.style.display = 'none';
            }
            switch(type) {
                case 'agendamento':
                    loadAgendamentos();
                    loadDashboard();
                    break;
                case 'cliente':
                    loadClientes();
                    break;
                case 'servico':
                    loadServicos();
                    break;
                case 'barbeiro':
                    loadBarbeiros();
                    break;
            }
        });
    }

    function exportRelatorio() {
        const mes = document.getElementById('mes-financeiro').value;
        const ano = document.getElementById('ano-financeiro').value;
        
        const agendamentosFiltrados = agendamentos.filter(a => {
            const date = new Date(a.data);
            return date.getMonth() + 1 == mes && 
                   date.getFullYear() == ano && 
                   a.status === 'finalizado';
        });
        
        let csv = 'Data,Cliente,Serviço,Barbeiro,Valor,Status\n';
        
        agendamentosFiltrados.forEach(agendamento => {
            const cliente = clientes.find(c => c.id === agendamento.clienteId) || {};
            const servico = servicos.find(s => s.id === agendamento.servicoId) || {};
            const barbeiro = barbeiros.find(b => b.id === agendamento.barbeiroId) || {};
            
            csv += `"${formatDate(agendamento.data)}","${cliente.nome || 'N/A'}","${servico.nome || 'N/A'}","${barbeiro.nome || 'N/A'}","${agendamento.valor?.toFixed(2) || '0.00'}","${agendamento.status}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_financeiro_${mes}_${ano}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
      // (Bloco duplicado removido para evitar conflitos e garantir funcionamento correto da exclusão nas tabelas)

// Adicione esta função para validar datas
function validarDataAgendamento(data, hora) {
    const hoje = new Date();
    const dataAgendamento = new Date(`${data}T${hora}`);
    
    return dataAgendamento >= hoje;
}

// Modifique a função handleAgendamentoSubmit para incluir a validação
function handleAgendamentoSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('agendamento-id').value;
    const clienteId = document.getElementById('agendamento-cliente').value;
    const servicoId = document.getElementById('agendamento-servico').value;
    const barbeiroId = document.getElementById('agendamento-barbeiro').value;
    const data = document.getElementById('agendamento-data').value;
    const hora = document.getElementById('agendamento-hora').value;
    const status = document.getElementById('agendamento-status').value;
    const observacoes = document.getElementById('agendamento-observacoes').value;
    
    // Validação da data
    if (!validarDataAgendamento(data, hora)) {
        alert('Não é possível agendar para datas/horários passados!');
        return;
    }
    
    const servico = servicos.find(s => s.id === servicoId);
    
    const agendamento = {
        id: id || generateId(),
        clienteId,
        servicoId,
        barbeiroId,
        data,
        hora,
        status,
        observacoes,
        valor: servico?.preco || 0,
        createdAt: new Date().toISOString() // Adiciona data de criação
    };
    
    // Restante da função permanece igual...
}

// Adicione esta função para inicializar a data mínima no input
function setupDateInputs() {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('agendamento-data').min = hoje;
    document.getElementById('filtro-data').min = hoje;
}

// Chame esta função no final do DOMContentLoaded
setupDateInputs();
const itens = document.querySelectorAll('.item');
    const lixeira = document.getElementById('lixeira');

    itens.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
      });
    });

    lixeira.addEventListener('dragover', (e) => {
      e.preventDefault(); // Necessário para permitir o drop
    });

    lixeira.addEventListener('drop', (e) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const item = document.getElementById(id);
      if (item) {
        item.remove(); // Remove o item da tela
      }
    });
    document.getElementById('formAgendamento').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita o recarregamento da página

    // Pega os valores do formulário
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const servico = document.getElementById('servico').value;

    // Cria um objeto com os dados
    const agendamento = {
        nome,
        telefone,
        data,
        horario,
        servico
    };

    // Salva no localStorage (simulando um "banco de dados")
    salvarAgendamento(agendamento);

    // Atualiza a lista de agendamentos
    atualizarLista();

    // Limpa o formulário
    this.reset();
});

// Função modificada para lidar com agendamentos
function handleAgendamentoSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('agendamento-id').value;
    const clienteId = document.getElementById('agendamento-cliente').value;
    const servicoId = document.getElementById('agendamento-servico').value;
    const barbeiroId = document.getElementById('agendamento-barbeiro').value;
    const data = document.getElementById('agendamento-data').value;
    const hora = document.getElementById('agendamento-hora').value;
    const status = document.getElementById('agendamento-status').value;
    const observacoes = document.getElementById('agendamento-observacoes').value;

    // Validações básicas
    if (!clienteId || !servicoId || !barbeiroId || !data || !hora) {
        showAlert('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    // Verifica conflito de horário
    if (hasAgendamentoConflict(barbeiroId, data, hora, id)) {
        showAlert('Barbeiro já possui agendamento neste horário!', 'error');
        return;
    }

    const servico = servicos.find(s => s.id === servicoId);
    
    const novoAgendamento = {
        id: id || generateId(),
        clienteId,
        servicoId,
        barbeiroId,
        data,
        hora,
        status: status || 'agendado',
        observacoes,
        valor: servico?.preco || 0,
        criadoEm: new Date().toISOString()
    };

    // Atualiza ou adiciona novo agendamento
    if (id) {
        const index = agendamentos.findIndex(a => a.id === id);
        agendamentos[index] = novoAgendamento;
    } else {
        agendamentos.push(novoAgendamento);
    }

    saveData();
    closeAllModals();
    loadAgendamentos();
    loadDashboard();
    showAlert('Agendamento salvo com sucesso!', 'success');
}

// Função para verificar conflitos de horário
function hasAgendamentoConflict(barbeiroId, data, hora, agendamentoId = null) {
    return agendamentos.some(a => {
        // Ignora o próprio agendamento durante edição
        if (agendamentoId && a.id === agendamentoId) return false;
        
        return a.barbeiroId === barbeiroId && 
               a.data === data && 
               a.hora === hora &&
               a.status !== 'cancelado';
    });
}

// Função para exibir alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Função para popular selects de agendamento
function populateAgendamentoSelects() {
    const selectCliente = document.getElementById('agendamento-cliente');
    const selectServico = document.getElementById('agendamento-servico');
    const selectBarbeiro = document.getElementById('agendamento-barbeiro');
    
    // Limpa e popula clientes
    selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id;
        option.textContent = `${cliente.nome} (${formatPhone(cliente.telefone)})`;
        selectCliente.appendChild(option);
    });

    // Limpa e popula serviços
    selectServico.innerHTML = '<option value="">Selecione um serviço</option>';
    servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = `${servico.nome} (${servico.duracao}min - R$ ${servico.preco.toFixed(2)})`;
        selectServico.appendChild(option);
    });

    // Limpa e popula barbeiros disponíveis
    selectBarbeiro.innerHTML = '<option value="">Selecione um barbeiro</option>';
    barbeiros.filter(b => b.status === 'ativo').forEach(barbeiro => {
        const option = document.createElement('option');
        option.value = barbeiro.id;
        option.textContent = `${barbeiro.nome} (${barbeiro.especialidades.join(', ')})`;
        selectBarbeiro.appendChild(option);
    });
}
 // Classe para representar um serviço da barbearia
class Servico {
    constructor(descricao, quantidade, preco, barbeiro) {
        this.descricao = descricao;
        this.quantidade = quantidade;
        this.preco = preco;
        this.barbeiro = barbeiro;
    }

    getTotal() {
        return this.quantidade * this.preco;
    }
}

// Função para formatar números como moeda (R$)
function formatarMoeda(valor) {
    return 'R$' + valor.toFixed(2).replace('.', ',');
}

// Função principal para gerar o relatório
function gerarRelatorioBarbearia() {
    // Dados da barbearia
    const titulo = "RELATÓRIO DIÁRIO - BARBEARIA GRAGAS";
    const slogan = "Onde o estilo encontra a tradição!";
    const endereco = "Av. dos Cortes, 123 - Centro";
    const telefone = "(11) 98765-4321";
    
    // Serviços realizados no dia
    const servicos = [
        new Servico("Corte Social", 15, 35.00, "João"),
        new Servico("Barba Completa", 8, 25.00, "Carlos"),
        new Servico("Corte + Barba", 12, 55.00, "Miguel"),
        new Servico("Pézinho", 5, 15.00, "João"),
        new Servico("Sobrancelha", 7, 10.00, "Carlos")
    ];

    // Gerar o conteúdo do relatório
    let relatorio = "";
    
    // Cabeçalho
    relatorio += "✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️\n";
    relatorio += `           ${titulo}\n`;
    relatorio += `       "${slogan}"\n`;
    relatorio += "✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️\n\n";
    
    // Informações da barbearia
    const dataAtual = new Date();
    relatorio += `Endereço: ${endereco}\n`;
    relatorio += `Telefone: ${telefone}\n`;
    relatorio += `Data: ${dataAtual.toLocaleDateString('pt-BR')}\n`;
    relatorio += `Hora da emissão: ${dataAtual.toLocaleTimeString('pt-BR')}\n`;
    relatorio += "--------------------------------------------------\n\n";

    // Tabela de serviços
    relatorio += `${"SERVIÇO".padEnd(20)} ${"BARBEIRO".padEnd(10)} ${"QUANTIDADE".padEnd(10)} ${"PREÇO".padEnd(12)} ${"TOTAL".padEnd(12)}\n`;
    
    let totalGeral = 0;
    servicos.forEach(servico => {
        relatorio += `${servico.descricao.padEnd(20)} ${servico.barbeiro.padEnd(10)} ${servico.quantidade.toString().padEnd(10)} ${formatarMoeda(servico.preco).padEnd(12)} ${formatarMoeda(servico.getTotal()).padEnd(12)}\n`;
        totalGeral += servico.getTotal();
    });

    // Resumo por barbeiro
    relatorio += "\n👉 RESUMO POR BARBEIRO\n";
    relatorio += "--------------------------------------------------\n";
    
    const totaisBarbeiros = {};
    servicos.forEach(servico => {
        if (!totaisBarbeiros[servico.barbeiro]) {
            totaisBarbeiros[servico.barbeiro] = 0;
        }
        totaisBarbeiros[servico.barbeiro] += servico.getTotal();
    });
    
    for (const [barbeiro, total] of Object.entries(totaisBarbeiros)) {
        relatorio += `${barbeiro.padEnd(10)}: ${formatarMoeda(total)}\n`;
    }

    // Rodapé
    relatorio += "\n--------------------------------------------------\n";
    relatorio += `TOTAL GERAL DO DIA: ${formatarMoeda(totalGeral)}\n`;
    relatorio += "✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️\n";
    relatorio += "        Obrigado pela preferência! Volte sempre!\n";
    relatorio += "✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️✂️\n";

    return relatorio;
}

// Função para salvar o relatório em um arquivo (Node.js)
function salvarRelatorio(conteudo) {
    const fs = require('fs');
    const dataAtual = new Date();
    const nomeArquivo = `relatorio_gragas_${dataAtual.getDate()}${dataAtual.getMonth()+1}${dataAtual.getFullYear()}.txt`;
    
    fs.writeFile(nomeArquivo, conteudo, (err) => {
        if (err) {
            console.error("Erro ao salvar o relatório:", err);
        } else {
            console.log(`Relatório salvo com sucesso como: ${nomeArquivo}`);
        }
    });
}

// Execução principal
const relatorio = gerarRelatorioBarbearia();
console.log(relatorio);

// Se estiver no Node.js, descomente a linha abaixo para salvar em arquivo
// salvarRelatorio(relatorio);
});