// --- GERENCIADOR DE ÁUDIO GLOBAL ---
const AudioManager = {
    bgm: new Audio('menu.mp3'),
    craftSfx: new Audio('craft.mp3'),
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    musicaIniciada: false,

    init() {
        // Configurações da Música de Fundo
        this.bgm.loop = true;   // Toca para sempre
        this.bgm.volume = 0.4;  // Volume ambiente (não muito alto)
        
        // Configura som de craft
        this.craftSfx.volume = 0.8;

        // GATILHO: Toca música no primeiro clique em qualquer lugar
        document.body.addEventListener('click', () => {
            if (!this.musicaIniciada) {
                this.bgm.play().catch(e => console.log("Erro BGM:", e));
                
                // Destrava o sintetizador de áudio também
                if (this.ctx.state === 'suspended') this.ctx.resume();
                
                this.musicaIniciada = true;
            }
        }, { once: true }); // Remove o evento depois de tocar a primeira vez
    },

    // Toca efeitos sonoros (Sintetizados ou Arquivos)
    playSFX(tipo) {
        // Se for CRAFT, usa o arquivo mp3
        if (tipo === 'craft') {
            this.craftSfx.currentTime = 0; // Reinicia se já estiver tocando
            this.craftSfx.play().catch(e => {});
            return;
        }

        // É mais rápido para sons de interface repetitivos
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;

        if (tipo === 'hover') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } 
        else if (tipo === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
        else if (tipo === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    },

    // Adiciona som de hover/click em tudo
    ativarSonsUI() {
        const interativos = document.querySelectorAll('button, .tab, .slot-circle, .inv-slot, .drop-zone, input');
        interativos.forEach(el => {
            // Remove antigos para não duplicar
            el.removeEventListener('mouseenter', this.hoverHandler);
            el.removeEventListener('click', this.clickHandler);
            
            // Cria handlers para poder remover depois se precisar
            el.hoverHandler = () => this.playSFX('hover');
            el.clickHandler = () => this.playSFX('click');

            el.addEventListener('mouseenter', el.hoverHandler);
            el.addEventListener('click', el.clickHandler);
        });
    }
};

// --- DRAG & DROP ---
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
        
        // Toca som mecânico ao equipar (opcional, reusando o click)
        AudioManager.playSFX('click');
    }
}

// --- MODEL (Persistência) ---
const FabricatorModel = {
    itens: [],
    capacidadeMaxima: 30,
    
    salvarDados() { localStorage.setItem('subnautica_inventory', JSON.stringify(this.itens)); },
    carregarDados() {
        const dadosSalvos = localStorage.getItem('subnautica_inventory');
        if (dadosSalvos) this.itens = JSON.parse(dadosSalvos);
    },

    adicionar(item) {
        if (this.itens.length < this.capacidadeMaxima) {
            this.itens.push(item);
            this.salvarDados();
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
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach(s => { s.className = 'inv-slot'; s.innerHTML = ''; });

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
        AudioManager.init(); // Prepara a música de fundo
        this.executarBoot();

        FabricatorView.inicializarGrid();
        FabricatorModel.carregarDados();
        FabricatorView.atualizar(FabricatorModel.obterTodos());
        
        AudioManager.ativarSonsUI(); // Ativa sons nos elementos iniciais

        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.fabricar();
        });
    },

    executarBoot() {
        const audio = document.getElementById('audioBoot');
        
        setTimeout(() => {
            if(audio) { audio.volume = 0.5; audio.play().catch(()=>{}); }
            OxygenSystem.iniciar();
        }, 500);

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
                // TOCA O SOM DO ARQUIVO
                AudioManager.playSFX('craft');
                
                FabricatorView.atualizar(FabricatorModel.obterTodos());
                nomeInput.value = ''; precoInput.value = ''; imgInput.value = '';
                
                // Reativa sons nos novos itens
                AudioManager.ativarSonsUI();
            } else {
                AudioManager.playSFX('error');
                alert("INVENTORY FULL");
            }
        }
    }
};

// --- OXYGEN SYSTEM ---
const OxygenSystem = {
    nivel: 45, maximo: 45, intervalo: null, audioTocado: false,
    
    iniciar() { 
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

// START
FabricatorController.init();