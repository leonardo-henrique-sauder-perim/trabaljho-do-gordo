
        // Simulação de funcionalidade para visualizar detalhes
        document.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', function() {
                document.getElementById('tabela-historico').classList.add('hidden');
                document.getElementById('detalhes-cliente').classList.remove('hidden');
            });
        });
        
        document.getElementById('fechar-detalhes').addEventListener('click', function() {
            document.getElementById('detalhes-cliente').classList.add('hidden');
            document.getElementById('tabela-historico').classList.remove('hidden');
        });
    