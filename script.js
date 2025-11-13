document.addEventListener('DOMContentLoaded', () => {
    // 1. Seletores
    const mesas = document.querySelectorAll('.mesa');
    const modalOverlay = document.getElementById('modal-mesa');
    const modalDisplayId = document.getElementById('mesa-id-display');
    const formOcupacao = document.getElementById('form-ocupacao');
    const btnFechar = document.querySelector('.btn-fechar');
    const btnLiberar = document.querySelector('.btn-liberar');
    const btnExportar = document.getElementById('btn-exportar');

    let mesaSelecionada = null;

    // 2. 💾 Carregar dados do LocalStorage ao iniciar
    const carregarStatusMesas = () => {
        mesas.forEach(mesa => {
            const status = localStorage.getItem(`mesa-${mesa.id}-status`);
            const dados = localStorage.getItem(`mesa-${mesa.id}-dados`);

            if (status === 'ocupada') {
                mesa.classList.add('ocupada');
                mesa.dataset.dados = dados;
            } else {
                mesa.classList.remove('ocupada');
                delete mesa.dataset.dados;
            }
        });
    };

    // 3. 🖱️ Adicionar ouvinte de clique para cada mesa
    mesas.forEach(mesa => {
        mesa.addEventListener('click', () => {
            mesaSelecionada = mesa;
            const mesaNome = mesa.dataset.nome;
            const isOcupada = mesa.classList.contains('ocupada');
            
            modalDisplayId.textContent = mesaNome;
            btnLiberar.dataset.mesaId = mesa.id;

            // Preenche o formulário se a mesa já estiver ocupada
            if (isOcupada && mesa.dataset.dados) {
                const dados = JSON.parse(mesa.dataset.dados);
                document.getElementById('nome-ocupante').value = dados.nome || '';
                document.getElementById('observacoes').value = dados.obs || '';
                btnLiberar.style.display = 'block';
                document.querySelector('.btn-ocupar').textContent = 'Atualizar Ocupação';
            } else {
                // Limpa e prepara o formulário para uma nova ocupação
                formOcupacao.reset();
                btnLiberar.style.display = 'none';
                document.querySelector('.btn-ocupar').textContent = 'Confirmar Ocupação';
            }
            
            modalOverlay.style.display = 'flex';
        });
    });

    // 4. 📝 Lógica de Ocupar/Atualizar
    formOcupacao.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (mesaSelecionada) {
            const nome = document.getElementById('nome-ocupante').value;
            const obs = document.getElementById('observacoes').value;
            
            const dadosOcupacao = JSON.stringify({ nome, obs, timestamp: new Date().toISOString() });

            // Salva no LocalStorage
            localStorage.setItem(`mesa-${mesaSelecionada.id}-status`, 'ocupada');
            localStorage.setItem(`mesa-${mesaSelecionada.id}-dados`, dadosOcupacao);

            // Atualiza a interface da mesa
            mesaSelecionada.classList.add('ocupada');
            mesaSelecionada.dataset.dados = dadosOcupacao;

            modalOverlay.style.display = 'none';
            alert(`Mesa ${mesaSelecionada.dataset.nome} ocupada/atualizada!`);
        }
    });

    // 5. 🗑️ Lógica de Liberar
    btnLiberar.addEventListener('click', () => {
        if (mesaSelecionada) {
            // Remove do LocalStorage
            localStorage.removeItem(`mesa-${mesaSelecionada.id}-status`);
            localStorage.removeItem(`mesa-${mesaSelecionada.id}-dados`);
            
            // Atualiza a interface
            mesaSelecionada.classList.remove('ocupada');
            delete mesaSelecionada.dataset.dados;
            
            modalOverlay.style.display = 'none';
            alert(`Mesa ${mesaSelecionada.dataset.nome} liberada!`);
        }
    });

    // 6. Fechar Modal
    btnFechar.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });
    
    // 7. 📊 Lógica de Exportação para CSV (AGORA INCLUI MESAS VAZIAS)
    btnExportar.addEventListener('click', () => {
        // Cabeçalho do CSV
        let dadosCSV = "Mesa;Status;Nome dos Ocupantes;Observacoes\n";
        
        // Flag para garantir que temos pelo menos 1 mesa (além do cabeçalho)
        let mesasEncontradas = false;

        mesas.forEach(mesa => {
            const mesaId = mesa.id;
            const mesaNome = mesa.dataset.nome;
            const status = localStorage.getItem(`mesa-${mesaId}-status`);
            
            let statusDisplay = "LIVRE";
            let nomeOcupante = "";
            let obs = "";

            if (status === 'ocupada') {
                const dadosRaw = localStorage.getItem(`mesa-${mesaId}-dados`);
                
                if (dadosRaw) {
                    try {
                        const dados = JSON.parse(dadosRaw);
                        // Limpa o texto para evitar quebras no CSV (substitui ';' por ',')
                        nomeOcupante = dados.nome ? dados.nome.replace(/;/g, ',') : "";
                        obs = dados.obs ? dados.obs.replace(/;/g, ',') : "";
                    } catch (e) {
                        console.error("Erro ao parsear dados da mesa", mesaNome, e);
                    }
                }
                statusDisplay = "OCUPADA";
            }
            
            // Adiciona a linha ao CSV, independente do status (LIVRE ou OCUPADA)
            // Formato: Mesa;Status;Nome dos Ocupantes;Observacoes
            dadosCSV += `${mesaNome};${statusDisplay};${nomeOcupante};${obs}\n`;
            mesasEncontradas = true;
        });

        if (!mesasEncontradas) {
            alert("Nenhuma mesa foi encontrada para exportação. Verifique se as mesas foram adicionadas ao HTML.");
            return;
        }

        // 🔗 Cria e inicia o download do arquivo
        const nomeArquivo = `Status_Mesas_${new Date().toISOString().slice(0, 10)}.csv`;
        // Adiciona a marca BOM para garantir que acentos e caracteres especiais (UTF-8) funcionem no Excel
        const blob = new Blob(['\ufeff', dadosCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', nomeArquivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Inicia o carregamento
    carregarStatusMesas();
});