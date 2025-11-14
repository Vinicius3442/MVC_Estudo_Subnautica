// --- FUNÇÕES DE DRAG & DROP (GLOBAIS) ---
function allowDrop(ev) {
    ev.preventDefault(); // Necessário para permitir soltar
}

function drag(ev) {
    // Guarda a URL da imagem sendo arrastada
    ev.dataTransfer.setData("text", ev.target.src);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text"); // Pega a URL
    
    // Identifica o alvo (garante que é a div .drop-zone, não o ícone dentro)
    let target = ev.target;
    if (!target.classList.contains('drop-zone')) {
        target = target.closest('.drop-zone');
    }

    if (target) {
        // Limpa conteúdo anterior
        // target.innerHTML = ''; 
        // Ou melhor: Adiciona classe para esconder ícone e põe a imagem
        
        target.classList.add('has-item');
        
        // Remove imagem antiga se houver
        const oldImg = target.querySelector('img');
        if(oldImg) oldImg.remove();

        // Cria a nova imagem no slot
        const newImg = document.createElement('img');
        newImg.src = data;
        target.appendChild(newImg);
        
        // Toca um somzinho se quiser (opcional)
        // new Audio('equip_sound.mp3').play();
    }
}

// --- MODEL ---
const FabricatorModel = {
    itens: [],
    capacidadeMaxima: 30,
    
    adicionar(item) {
        if (this.itens.length < this.capacidadeMaxima) {
            this.itens.push(item);
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
        // Reseta slots
        const slots = document.querySelectorAll('.inv-slot');
        slots.forEach(s => {
            s.className = 'inv-slot';
            s.innerHTML = '';
        });

        // Preenche slots
        listaItens.forEach((item, index) => {
            const slot = document.getElementById(`slot-${index}`);
            if (slot) {
                slot.classList.add('filled');
                
                // Cria a imagem arrastável
                const img = document.createElement('img');
                // Se não tiver URL, usa uma imagem padrão do Subnautica (cubo)
                img.src = item.imagem || 'https://static.wikia.nocookie.net/subnautica/images/a/aeb/Titanium.png';
                img.draggable = true;
                img.ondragstart = drag; // Vincula função de arrastar
                
                slot.appendChild(img);
                slot.setAttribute('title', `${item.nome} (⚡${item.preco})`);
            }
        });
    }
};

// --- CONTROLLER ---
const FabricatorController = {
    init() {
        FabricatorView.inicializarGrid();
        
        document.getElementById('formProduto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.fabricar();
        });

        OxygenSystem.iniciar();
    },

    fabricar() {
        const nomeInput = document.getElementById('nome');
        const precoInput = document.getElementById('preco');
        const imgInput = document.getElementById('imgUrl');
        
        if (nomeInput.value && precoInput.value) {
            const sucesso = FabricatorModel.adicionar({
                nome: nomeInput.value,
                preco: precoInput.value,
                imagem: imgInput.value // Salva a URL
            });

            if (sucesso) {
                FabricatorView.atualizar(FabricatorModel.obterTodos());
                nomeInput.value = '';
                precoInput.value = '';
                imgInput.value = '';
            } else {
                alert("INVENTORY FULL");
            }
        }
    }
};

// --- OXYGEN SYSTEM (Mantido igual) ---
const OxygenSystem = {
    nivel: 45, maximo: 45, intervalo: null, audioTocado: false,
    iniciar() { this.intervalo = setInterval(() => this.respirar(), 1000); },
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
        document.getElementById('oxygenValue').innerText = this.nivel;
        const pct = (this.nivel / this.maximo) * 100;
        document.querySelector('.oxygen-fill').style.setProperty('--o2-percent', `${pct}%`);
    },
    alerta() {
        document.body.classList.add('critical-state');
        if(this.nivel === 10 && !this.audioTocado) {
            document.getElementById('audioOxygen').play().catch(()=>{});
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

FabricatorController.init();