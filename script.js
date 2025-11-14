const FabricatorModel = {
    itens: [],
    adicionar(item) { this.itens.push(item); },
    obterTodos() { return this.itens; }
};

const FabricatorView = {
    renderizar(lista) {
        const ul = document.getElementById('listaProdutos');
        ul.innerHTML = '';
        lista.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nome}</span>
                <span style="color: #ffcc00;">⚡ ${item.preco}</span>
            `;
            ul.appendChild(li);
        });
    }
};

const FabricatorController = {
    init() {
        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.criarItem();
        });
    },
    criarItem() {
        const nome = document.getElementById('nome').value;
        const preco = document.getElementById('preco').value;
        if(nome && preco) {
            FabricatorModel.adicionar({ nome, preco });
            FabricatorView.renderizar(FabricatorModel.obterTodos());
            document.getElementById('nome').value = '';
            document.getElementById('preco').value = '';
        }
    }
};

FabricatorController.init();

// --- SISTEMA DE SOBREVIVÊNCIA (HUD) ---

const OxygenSystem = {
    nivel: 45,
    maximo: 45,
    intervalo: null,
    audioTocado: false,

    iniciar() {
        // Atualiza a cada 1 segundo
        this.intervalo = setInterval(() => {
            this.respirar();
        }, 500);
    },

    respirar() {
        if (this.nivel > 0) {
            this.nivel--;
            this.atualizarView();
            this.checarPerigo();
        } else {
            this.morrer();
        }
    },

    checarPerigo() {
        // Tocar áudio quando chegar em 10 segundos (só uma vez)
        if (this.nivel === 10 && !this.audioTocado) {
            const audio = document.getElementById('audioOxygen');
            if(audio) audio.play().catch(e => console.log("Clique na tela para permitir áudio"));
            this.audioTocado = true;
        }

        // Ativar o alerta vermelho visual
        if (this.nivel <= 10) {
            document.body.classList.add('critical-state');
            document.getElementById('oxygenGauge').classList.add('oxygen-low');
        }
    },

    atualizarView() {
        const valueEl = document.getElementById('oxygenValue');
        const gaugeEl = document.querySelector('.oxygen-fill');
        
        // Atualiza número
        valueEl.innerText = this.nivel;

        // Calcula porcentagem para o gráfico circular (CSS)
        // Se 45 é 100%, quanto é o nível atual?
        const porcentagem = (this.nivel / this.maximo) * 100;
        gaugeEl.style.setProperty('--o2-percent', `${porcentagem}%`);
    },

    morrer() {
        // 1. Para o contador para não ficar negativo
        clearInterval(this.intervalo);

        // 2. Ativa o "Blackout" (tela preta)
        document.body.classList.add('passed-out');
        
        // document.getElementById('audioOxygen').pause();

        console.log("Desmaiou... Reiniciando sistemas.");

        // 4. Espera 4 segundos no escuro e reinicia
        setTimeout(() => {
            this.renascer();
        }, 4000);
    },

    renascer() {
        // 1. Restaura o oxigênio
        this.nivel = 45;
        this.audioTocado = false; // Permite tocar o alerta de novo depois
        
        // 2. Atualiza a tela visualmente (tira o vermelho)
        this.atualizarView();
        document.body.classList.remove('critical-state');
        document.getElementById('oxygenGauge').classList.remove('oxygen-low');

        // 3. Remove o blackout (a tela clareia devagar por causa do CSS transition)
        document.body.classList.remove('passed-out');

        // 4. Reinicia o loop de tempo
        this.iniciar();
    }
};

OxygenSystem.iniciar();

document.body.addEventListener('click', () => {
    const audio = document.getElementById('audioOxygen');
    audio.muted = false;
}, { once: true });