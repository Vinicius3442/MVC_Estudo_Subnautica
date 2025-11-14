// --- DRAG & DROP GLOBAL ---
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.src); }

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    let target = ev.target;
    if (!target.classList.contains('drop-zone')) target = target.closest('.drop-zone');

    if (target) {
        target.classList.add('has-item');
        const oldImg = target.querySelector('img');
        if(oldImg) oldImg.remove();

        const newImg = document.createElement('img');
        newImg.src = data;
        target.appendChild(newImg);
    }
}

// --- MODEL (Agora com LocalStorage!) ---
const FabricatorModel = {
    itens: [],
    capacidadeMaxima: 30,
    
    // Salva no navegador
    salvarDados() {
        localStorage.setItem('subnautica_inventory', JSON.stringify(this.itens));
    },

    // Carrega do navegador
    carregarDados() {
        const dadosSalvos = localStorage.getItem('subnautica_inventory');
        if (dadosSalvos) {
            this.itens = JSON.parse(dadosSalvos);
        }
    },

    adicionar(item) {
        if (this.itens.length < this.capacidadeMaxima) {
            this.itens.push(item);
            this.salvarDados(); // Salva sempre que adiciona!
            return true;
        }
        return false;
    },
    obterTodos() { return this.itens; }
};

// --- VIEW ---
const FabricatorView = {
    gridElement: document.getElementById('gridInventario'),

    inicializarGrid() {
        this.gridElement.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const slot = document.createElement('div');
            slot.classList.add('inv-slot');
            slot.id = `slot-${i}`;
            this.gridElement.appendChild(slot);
        }
    },

    atualizar(listaItens) {
        // Limpa tudo visualmente
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach(s => { s.className = 'inv-slot'; s.innerHTML = ''; });

        // Re-preenche com base nos dados
        listaItens.forEach((item, index) => {
            const slot = document.getElementById(`slot-${index}`);
            if (slot) {
                slot.classList.add('filled');
                const img = document.createElement('img');
                img.src = item.imagem || 'https://static.wikia.nocookie.net/subnautica/images/a/aeb/Titanium.png';
                img.draggable = true;
                img.ondragstart = drag;
                slot.appendChild(img);
                slot.setAttribute('title', `${item.nome} (⚡${item.preco})`);
            }
        });
    }
};

// --- CONTROLLER ---
const FabricatorController = {
    init() {
        // 1. Inicia a tela de Boot
        this.executarBoot();

        // 2. Configura a View
        FabricatorView.inicializarGrid();
        
        // 3. Tenta carregar dados salvos do passado
        FabricatorModel.carregarDados();
        FabricatorView.atualizar(FabricatorModel.obterTodos());

        // 4. Eventos
        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.fabricar();
        });
    },

    executarBoot() {
        // Toca o som de boot (usando o mesmo arquivo de warning por enquanto, ou outro se tiver)
        const audio = document.getElementById('audioOxygen');
        // Dica: Navegadores bloqueiam autoplay. O som pode não tocar na primeira vez sem clique.
        
        setTimeout(() => {
            // Tenta tocar um bip curto simulado
            if(audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }
            
            // Inicia o sistema de oxigênio só depois do boot
            OxygenSystem.iniciar();
        }, 500);

        // Depois de 3.5 segundos (tempo da animação CSS), esconde a tela
        setTimeout(() => {
            document.getElementById('boot-screen').classList.add('boot-complete');
        }, 3500);
    },

    fabricar() {
        const nomeInput = document.getElementById('nome');
        const precoInput = document.getElementById('preco');
        const imgInput = document.getElementById('imgUrl');
        
        if (nomeInput.value && precoInput.value) {
            const sucesso = FabricatorModel.adicionar({
                nome: nomeInput.value,
                preco: precoInput.value,
                imagem: imgInput.value
            });

            if (sucesso) {
                FabricatorView.atualizar(FabricatorModel.obterTodos());
                nomeInput.value = ''; precoInput.value = ''; imgInput.value = '';
            } else {
                alert("INVENTORY FULL");
            }
        }
    }
};

// --- OXYGEN SYSTEM (Mantido igual) ---
const OxygenSystem = {
    nivel: 45, maximo: 45, intervalo: null, audioTocado: false,
    
    iniciar() { 
        // Garante que não inicie duas vezes
        if(this.intervalo) clearInterval(this.intervalo);
        this.intervalo = setInterval(() => this.respirar(), 1000); 
    },
    
    respirar() {
        if (this.nivel > 0) {
            this.nivel--;
            this.view();
            if(this.nivel <= 10) this.alerta();
        } else {
            this.blackout();
        }
    },
    view() {
        const valEl = document.getElementById('oxygenValue');
        if(valEl) {
            valEl.innerText = this.nivel;
            const pct = (this.nivel / this.maximo) * 100;
            document.querySelector('.oxygen-fill').style.setProperty('--o2-percent', `${pct}%`);
        }
    },
    alerta() {
        document.body.classList.add('critical-state');
        if(this.nivel === 10 && !this.audioTocado) {
            const audio = document.getElementById('audioOxygen');
            if(audio) { audio.volume = 1.0; audio.play().catch(()=>{}); }
            this.audioTocado = true;
        }
    },
    blackout() {
        clearInterval(this.intervalo);
        document.body.classList.add('passed-out');
        setTimeout(() => {
            this.nivel = 45; this.audioTocado = false;
            document.body.classList.remove('passed-out', 'critical-state');
            this.iniciar();
        }, 4000);
    }
};
const sfx = {
    hover: new Audio('hover.mp3'), // Você precisa ter esse arquivo
    click: new Audio('click.mp3'), // E esse também
    craft: new Audio('craft.mp3'), // Opcional: som de martelo/construção
    
    play(tipo) {
        // Clona o áudio para poder tocar sons sobrepostos rapidamente
        const som = this[tipo].cloneNode();
        som.volume = 0.3; // Volume mais baixo para não irritar
        som.play().catch(() => {}); // Ignora erro se não tiver interagido ainda
    }
};

// Adiciona som a todos os botões e slots interativos automaticamente
function ativarSonsInterface() {
    // Pega tudo que é clicável
    const interativos = document.querySelectorAll('button, .tab, .slot-circle, .inv-slot, .drop-zone');

    interativos.forEach(el => {
        el.addEventListener('mouseenter', () => sfx.play('hover'));
        el.addEventListener('click', () => sfx.play('click'));
    });
}
// INICIA O SISTEMA
FabricatorController.init();