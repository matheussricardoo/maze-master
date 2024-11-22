const THEMES = {
    CLASSIC: {
        name: 'classic',
        background: '#f0f0f0',
        walls: '#2c3e50',
        player: '#e74c3c',
        start: '#2ecc71',
        end: '#3498db'
    },
    SPACE: {
        name: 'space',
        background: '#0a0a2a',
        walls: '#4a4a8a',
        player: '#ff6b6b',
        start: '#4ecdc4',
        end: '#ffbe0b'
    },
    FOREST: {
        name: 'forest',
        background: '#1a472a',
        walls: '#90ee90',
        player: '#ff7f50',
        start: '#90ee90',
        end: '#40e0d0'
    }
};

class Labirinto {
    constructor(linhas, colunas) {
        this.linhas = linhas;
        this.colunas = colunas;
        this.grade = [];
        this.pilha = [];
        this.solucao = [];
        this.dificuldade = 1;
        this.jogadorLinha = 0;
        this.jogadorColuna = 0;
        this.tempoInicio = null;
        this.pontuacao = 0;
        this.jogoTerminado = false;
        this.modoTimeAttack = false;
        this.modoMirror = false;
        this.gameMode = 'normal';
        this.tempoMaximo = 10;
        this.visibilityRadius = 2;
        this.isPaused = false;
        this.tempoPausado = 0;
        this.tempoDecorridoAntesDoUltimoPause = 0;
        this.currentTheme = THEMES.CLASSIC;
        this.inicializar();
    }

    inicializar() {
        // Criar grade 2D
        for (let i = 0; i < this.linhas; i++) {
            this.grade[i] = [];
            for (let j = 0; j < this.colunas; j++) {
                this.grade[i][j] = {
                    visitado: false,
                    paredes: [true, true, true, true] // cima, direita, baixo, esquerda
                };
            }
        }
    }

    gerarLabirinto(linha = 0, coluna = 0) {
        this.grade[linha][coluna].visitado = true;
        
        // Direções: cima (0), direita (1), baixo (2), esquerda (3)
        let direcoes = this.embaralharDirecoes();
        
        for (let direcao of direcoes) {
            let novaLinha = linha;
            let novaColuna = coluna;
            
            switch(direcao) {
                case 0: novaLinha -= 1; break;  // cima
                case 1: novaColuna += 1; break;  // direita
                case 2: novaLinha += 1; break;  // baixo
                case 3: novaColuna -= 1; break;  // esquerda
            }
            
            if (this.ehValido(novaLinha, novaColuna) && !this.grade[novaLinha][novaColuna].visitado) {
                // Remover parede entre células
                this.removerParede(linha, coluna, direcao);
                this.gerarLabirinto(novaLinha, novaColuna);
            }
        }
    }

    embaralharDirecoes() {
        let direcoes = [0, 1, 2, 3];
        for (let i = direcoes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [direcoes[i], direcoes[j]] = [direcoes[j], direcoes[i]];
        }
        return direcoes;
    }

    ehValido(linha, coluna) {
        return linha >= 0 && linha < this.linhas && coluna >= 0 && coluna < this.colunas;
    }

    removerParede(linha, coluna, direcao) {
        // Remove a parede da célula atual
        this.grade[linha][coluna].paredes[direcao] = false;
        
        // Remove a parede correspondente da célula vizinha
        let novaLinha = linha;
        let novaColuna = coluna;
        let direcaoOposta;
        
        switch(direcao) {
            case 0: // cima
                novaLinha -= 1;
                direcaoOposta = 2;
                break;
            case 1: // direita
                novaColuna += 1;
                direcaoOposta = 3;
                break;
            case 2: // baixo
                novaLinha += 1;
                direcaoOposta = 0;
                break;
            case 3: // esquerda
                novaColuna -= 1;
                direcaoOposta = 1;
                break;
        }
        
        if (this.ehValido(novaLinha, novaColuna)) {
            this.grade[novaLinha][novaColuna].paredes[direcaoOposta] = false;
        }
    }

    encontrarSolucao() {
        const visitados = Array(this.linhas).fill().map(() => Array(this.colunas).fill(false));
        const caminho = [];
        
        const encontrarCaminho = (linha, coluna) => {
            // Se chegou ao destino
            if (linha === this.linhas - 1 && coluna === this.colunas - 1) {
                caminho.push([linha, coluna]);
                return true;
            }
            
            // Se posição inválida ou já visitada
            if (!this.ehValido(linha, coluna) || visitados[linha][coluna]) {
                return false;
            }
            
            visitados[linha][coluna] = true;
            caminho.push([linha, coluna]);
            
            // Tenta cada direção
            const direcoes = [
                [0, 1],  // direita
                [1, 0],  // baixo
                [-1, 0], // cima
                [0, -1]  // esquerda
            ];
            
            for (let [dLinha, dColuna] of direcoes) {
                const novaLinha = linha + dLinha;
                const novaColuna = coluna + dColuna;
                
                if (this.ehValido(novaLinha, novaColuna) && 
                    !visitados[novaLinha][novaColuna] &&
                    !this.grade[linha][coluna].paredes[this.getDirecaoIndex(dLinha, dColuna)]) {
                    
                    if (encontrarCaminho(novaLinha, novaColuna)) {
                        return true;
                    }
                }
            }
            
            caminho.pop();
            return false;
        };
        
        encontrarCaminho(0, 0);
        return caminho;
    }

    setDificuldade(nivel) {
        this.dificuldade = nivel;
        const config = NIVEIS[nivel];
        this.linhas = config.tamanho;
        this.colunas = config.tamanho;
        this.tempoMaximo = config.tempoMaximo;
        this.inicializar();
    }

    desenharLabirinto(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellSize = 30;
        
        canvas.width = this.colunas * cellSize;
        canvas.height = this.linhas * cellSize;
        
        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Pegar o tema atual
        const theme = this.currentTheme || THEMES.CLASSIC;
        
        // Desenhar fundo
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar paredes
        ctx.strokeStyle = theme.walls;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.linhas; i++) {
            for (let j = 0; j < this.colunas; j++) {
                const x = j * cellSize;
                const y = i * cellSize;
                
                // Desenhar paredes
                ctx.beginPath();
                if (this.grade[i][j].paredes[0]) { // cima
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cellSize, y);
                }
                if (this.grade[i][j].paredes[1]) { // direita
                    ctx.moveTo(x + cellSize, y);
                    ctx.lineTo(x + cellSize, y + cellSize);
                }
                if (this.grade[i][j].paredes[2]) { // baixo
                    ctx.moveTo(x, y + cellSize);
                    ctx.lineTo(x + cellSize, y + cellSize);
                }
                if (this.grade[i][j].paredes[3]) { // esquerda
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cellSize);
                }
                ctx.stroke();
            }
        }
        
        // Desenhar início (verde)
        ctx.fillStyle = theme.start;
        ctx.beginPath();
        ctx.arc(cellSize/2, cellSize/2, cellSize/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenhar fim (azul)
        ctx.fillStyle = theme.end;
        ctx.beginPath();
        ctx.arc(
            (this.colunas - 0.5) * cellSize,
            (this.linhas - 0.5) * cellSize,
            cellSize/3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Desenhar jogador
        ctx.fillStyle = theme.player;
        ctx.beginPath();
        ctx.arc(
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            cellSize/3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Adicionar efeito de brilho ao jogador
        const gradient = ctx.createRadialGradient(
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            0,
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            cellSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            cellSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Atualizar tempo normal (quando não está no modo time attack)
        if (!this.modoTimeAttack && this.primeiroMovimento) {
            let tempoExibir;
            if (this.isPaused) {
                tempoExibir = Math.floor(this.tempoDecorridoAntesDoUltimoPause / 1000);
            } else {
                tempoExibir = Math.floor((Date.now() - this.tempoInicio) / 1000);
            }
            document.getElementById('tempo').textContent = tempoExibir;
        } else if (this.modoTimeAttack) {
            // Se estiver no modo contra o tempo, esconde o tempo normal
            document.getElementById('tempo').textContent = '-';
        }

        // Mostrar timer no modo contra o tempo
        if (this.modoTimeAttack && this.primeiroMovimento) {
            let tempoDecorrido;
            if (this.isPaused) {
                tempoDecorrido = this.tempoDecorridoAntesDoUltimoPause / 1000;
            } else {
                tempoDecorrido = Math.floor((Date.now() - this.tempoInicio) / 1000);
            }
            
            const tempoRestante = Math.max(0, this.tempoMaximo - tempoDecorrido);
            
            // Desenhar fundo do timer
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(canvas.width/2 - 40, 10, 80, 30);
            
            // Desenhar texto do timer
            ctx.fillStyle = tempoRestante <= 3 ? '#ff0000' : '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(tempoRestante)}`, canvas.width/2, 32);
            
            // Verificar se o tempo acabou apenas se não estiver pausado
            if (tempoRestante === 0 && !this.jogoTerminado && !this.isPaused) {
                this.finalizarJogo(true);
            }
        }

        // Mostrar tela de pause para todos os modos
        if (this.isPaused) {
            const t = TRANSLATIONS[currentLanguage];
            // Overlay escuro semi-transparente
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Texto "PAUSADO"
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.pause.paused, canvas.width/2, canvas.height/2);

            // Texto adicional
            ctx.font = 'bold 18px Arial';
            ctx.fillText(t.pause.pressText, canvas.width/2, canvas.height/2 + 40);
        }
    }

    moverJogador(direcao) {
        if (this.jogoTerminado || this.isPaused) return;
        
        // Se for o primeiro movimento, inicia o timer
        if (!this.primeiroMovimento) {
            this.primeiroMovimento = true;
            this.tempoInicio = Date.now();
        }
        
        // Aplicar efeito espelho no modo mirror
        if (this.modoMirror) {
            switch(direcao) {
                case 'ArrowLeft':
                    direcao = 'ArrowRight';
                    break;
                case 'ArrowRight':
                    direcao = 'ArrowLeft';
                    break;
                case 'ArrowUp':
                    direcao = 'ArrowDown';
                    break;
                case 'ArrowDown':
                    direcao = 'ArrowUp';
                    break;
            }
        }
        
        let novaLinha = this.jogadorLinha;
        let novaColuna = this.jogadorColuna;
        let direcaoParede;

        switch(direcao) {
            case 'ArrowUp':
                novaLinha -= 1;
                direcaoParede = 0;
                break;
            case 'ArrowRight':
                novaColuna += 1;
                direcaoParede = 1;
                break;
            case 'ArrowDown':
                novaLinha += 1;
                direcaoParede = 2;
                break;
            case 'ArrowLeft':
                novaColuna -= 1;
                direcaoParede = 3;
                break;
            default:
                return;
        }

        if (this.ehValido(novaLinha, novaColuna) && 
            !this.grade[this.jogadorLinha][this.jogadorColuna].paredes[direcaoParede]) {
            this.jogadorLinha = novaLinha;
            this.jogadorColuna = novaColuna;
            
            // Verificar se chegou ao final
            if (this.jogadorLinha === this.linhas - 1 && 
                this.jogadorColuna === this.colunas - 1) {
                this.finalizarJogo(false);
            }
            
            // Redesenhar o labirinto após o movimento
            this.desenharLabirinto(document.getElementById('labirintoCanvas'));
        }
    }

    iniciarJogo() {
        this.jogadorLinha = 0;
        this.jogadorColuna = 0;
        this.tempoInicio = null;
        this.jogoTerminado = false;
        this.pontuacao = 0;
        this.primeiroMovimento = false;
    }

    finalizarJogo(perdeuPorTempo = false) {
        this.jogoTerminado = true;
        const tempoTotal = (Date.now() - this.tempoInicio) / 1000;
        const t = TRANSLATIONS[currentLanguage];
        
        if (perdeuPorTempo) {
            this.pontuacao = 0;
            const modal = document.getElementById('modal');
            const overlay = document.querySelector('.overlay');
            
            modal.querySelector('h2').textContent = t.timeUp.title;
            modal.querySelector('p').textContent = t.timeUp.message;
            document.getElementById('tempoFinal').textContent = `${this.tempoMaximo}s`;
            document.getElementById('pontuacaoFinal').textContent = '0';
            
            modal.style.display = 'block';
            overlay.style.display = 'block';
        } else {
            // Novo cálculo da pontuação para vitória
            const tempoMaximo = this.modoTimeAttack ? this.tempoMaximo : NIVEIS[this.dificuldade].tempoMaximo;
            const pontuacaoBase = 1000 * this.dificuldade;
            const multiplicadorTempo = Math.max(0, 1 - (tempoTotal / tempoMaximo));
            this.pontuacao = Math.floor(pontuacaoBase * multiplicadorTempo);
            
            // Bônus para modos especiais
            if (this.modoMirror) this.pontuacao *= 1.5;
            if (this.modoTimeAttack) this.pontuacao *= 2;
            
            // Garantir que a pontuação seja pelo menos 100 pontos por completar
            this.pontuacao = Math.max(100, this.pontuacao);
            
            // Verificar conquistas
            verificarConquistas(tempoTotal, this.pontuacao, this.dificuldade);
            
            atualizarRecordes(this.dificuldade, tempoTotal, this.pontuacao);
            mostrarModalVitoria(tempoTotal, this.pontuacao);
        }
    }

    desenharSolucao() {
        const canvas = document.getElementById('labirintoCanvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 30;

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        for (let i = 0; i < this.solucao.length; i++) {
            const [linha, coluna] = this.solucao[i];
            const x = coluna * cellSize + cellSize/2;
            const y = linha * cellSize + cellSize/2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }

    adicionarEfeitos() {
        const canvas = document.getElementById('labirintoCanvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 30;
        
        // Efeito de brilho no jogador
        const gradient = ctx.createRadialGradient(
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            cellSize/4,
            this.jogadorColuna * cellSize + cellSize/2,
            this.jogadorLinha * cellSize + cellSize/2,
            cellSize
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.jogadorColuna * cellSize - cellSize/2,
            this.jogadorLinha * cellSize - cellSize/2,
            cellSize * 2,
            cellSize * 2
        );
    }

    debug() {
        console.log('Posição do jogador:', {
            linha: this.jogadorLinha,
            coluna: this.jogadorColuna
        });
        console.log('Paredes da célula atual:', 
            this.grade[this.jogadorLinha][this.jogadorColuna].paredes
        );
    }

    gerarLabirintoUnico() {
        let tentativas = 0;
        const maxTentativas = 10;
        let labirintoHash = '';
        
        do {
            this.inicializar();
            this.gerarLabirinto(0, 0);
            labirintoHash = this.gerarHash();
            tentativas++;
        } while (this.verificarLabirintoRepetido(labirintoHash) && tentativas < maxTentativas);
        
        this.salvarLabirintoHash(labirintoHash);
    }

    gerarHash() {
        // Cria uma string representando o estado do labirinto
        return JSON.stringify(this.grade.map(linha => 
            linha.map(celula => celula.paredes)
        ));
    }

    verificarLabirintoRepetido(hash) {
        const labirintosAnteriores = JSON.parse(localStorage.getItem('labirintosGerados') || '[]');
        return labirintosAnteriores.includes(hash);
    }

    salvarLabirintoHash(hash) {
        const labirintosAnteriores = JSON.parse(localStorage.getItem('labirintosGerados') || '[]');
        labirintosAnteriores.push(hash);
        // Manter apenas os últimos 50 labirintos
        if (labirintosAnteriores.length > 50) {
            labirintosAnteriores.shift();
        }
        localStorage.setItem('labirintosGerados', JSON.stringify(labirintosAnteriores));
    }

    desenharCaminhoSolucao() {
        const canvas = document.getElementById('labirintoCanvas');
        const ctx = canvas.getContext('2d');
        const cellSize = 30;

        // Primeiro, redesenha o labirinto
        this.desenharLabirinto(canvas);

        // Encontra a solução
        const solucao = this.encontrarSolucao();
        
        if (solucao && solucao.length > 0) {
            // Desenha o caminho
            ctx.beginPath();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = cellSize/3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            solucao.forEach(([linha, coluna], index) => {
                const x = coluna * cellSize + cellSize/2;
                const y = linha * cellSize + cellSize/2;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Desenha os círculos com números
            solucao.forEach(([linha, coluna], index) => {
                const x = coluna * cellSize + cellSize/2;
                const y = linha * cellSize + cellSize/2;

                // Círculo branco
                ctx.beginPath();
                ctx.fillStyle = '#FFFFFF';
                ctx.arc(x, y, cellSize/4, 0, Math.PI * 2);
                ctx.fill();

                // Número
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(index + 1, x, y);
            });
        }
    }

    getDirecaoIndex(dLinha, dColuna) {
        if (dLinha === -1) return 0; // cima
        if (dColuna === 1) return 1;  // direita
        if (dLinha === 1) return 2;   // baixo
        if (dColuna === -1) return 3; // esquerda
        return -1;
    }

    setGameMode(mode) {
        // Primeiro, desativa todos os modos
        this.modoTimeAttack = false;
        this.modoMirror = false;
        
        this.gameMode = mode;
        
        switch (mode) {
            case 'timeAttack':
                this.modoTimeAttack = true;
                const nivelAtual = parseInt(document.getElementById('dificuldade').value) || 1;
                this.tempoMaximo = NIVEIS[nivelAtual].tempoMaximo;
                document.getElementById('tempo').textContent = '-';
                break;
                
            case 'mirror':
                this.modoMirror = true;
                break;
                
            case 'normal':
            default:
                break;
        }
        
        this.iniciarJogo();
        this.desenharLabirinto(document.getElementById('labirintoCanvas'));
    }

    mudarDificuldade() {
        const nivel = parseInt(document.getElementById('dificuldade').value) || 1;
        if (this.modoTimeAttack) {
            this.tempoMaximo = NIVEIS[nivel].tempoMaximo;
        }
        iniciarNovoJogo();
    }

    setTheme(theme) {
        if (THEMES[theme]) {
            this.currentTheme = THEMES[theme];
            const canvas = document.getElementById('labirintoCanvas');
            this.desenharLabirinto(canvas);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const t = TRANSLATIONS[currentLanguage];
        
        if (this.isPaused) {
            if (this.primeiroMovimento) {
                this.tempoPausado = Date.now();
                this.tempoDecorridoAntesDoUltimoPause = this.tempoPausado - this.tempoInicio;
            }
            document.querySelector('.btn.pause-btn').innerHTML = 
                `<span class="btn-icon">▶️</span>${t.pause.continue}`;
        } else {
            if (this.primeiroMovimento) {
                const tempoEmPause = Date.now() - this.tempoPausado;
                this.tempoInicio = Date.now() - this.tempoDecorridoAntesDoUltimoPause;
            }
            document.querySelector('.btn.pause-btn').innerHTML = 
                `<span class="btn-icon">⏸️</span>${t.pause.pause}`;
        }
        
        this.desenharLabirinto(document.getElementById('labirintoCanvas'));
    }
}

// Inicialização e controles globais
let labirinto;
let intervalId;

// Adicione estas constantes no início do arquivo, após a definição da classe
const NIVEIS = {
    1: { nome: "Fácil", tamanho: 7, tempoMaximo: 10 },    // 10 segundos
    2: { nome: "Médio", tamanho: 11, tempoMaximo: 15 },   // 15 segundos
    3: { nome: "Difícil", tamanho: 15, tempoMaximo: 20 }  // 20 segundos
};

// Adicione no início do arquivo, após as constantes
const TRANSLATIONS = {
    pt: {
        title: "Labirinto Mágico",
        subtitle: "Desenvolva sua mente enquanto se diverte!",
        whyPlay: "Por que jogar?",
        benefits: {
            logic: {
                title: "Raciocínio Lógico",
                desc: "Melhora a capacidade de resolver problemas e tomar decisões estratégicas."
            },
            spatial: {
                title: "Percepção Espacial",
                desc: "Desenvolve a orientação espacial e memória visual."
            },
            focus: {
                title: "Concentração",
                desc: "Aumenta o foco e a capacidade de concentração."
            },
            planning: {
                title: "Planejamento",
                desc: "Exercita a capacidade de planejar e executar estratégias."
            }
        },
        levels: {
            1: "Nível 1 - Iniciante",
            2: "Nível 2 - Intermediário",
            3: "Nível 3 - Avançado"
        },
        buttons: {
            newGame: "Novo Jogo",
            showPath: "Mostrar Caminho",
            sound: "Som",
            language: "EN"
        },
        stats: {
            time: "Tempo",
            score: "Pontuação",
            record: "Recorde"
        },
        howToPlay: {
            title: "Como Jogar",
            movement: "Use as setas para mover",
            goal: "Chegue ao final do labirinto"
        },
        ranking: "Ranking",
        modal: {
            congrats: "Parabéns!",
            completed: "Você completou o labirinto!",
            playAgain: "Jogar Novamente",
            time: "Tempo",
            score: "Pontuação"
        },
        footer: "© 2024 Matheus Ricardo - Todos os direitos reservados",
        gameModes: {
            normal: "Modo Normal",
            timeAttack: "Contra o Tempo",
            mirror: "Modo Espelho"
        },
        themes: {
            CLASSIC: "Clássico",
            SPACE: "Espacial",
            FOREST: "Floresta"
        },
        pause: {
            pause: "PAUSE",
            continue: "CONTINUAR",
            paused: "PAUSADO",
            pressText: "Pressione CONTINUAR para voltar ao jogo"
        },
        timeUp: {
            title: "❌ Tempo Esgotado!",
            message: "Você não conseguiu completar o labirinto a tempo!"
        }
    },
    en: {
        title: "Magic Maze",
        subtitle: "Develop your mind while having fun!",
        whyPlay: "Why play?",
        benefits: {
            logic: {
                title: "Logical Thinking",
                desc: "Improves problem-solving ability and strategic decision making."
            },
            spatial: {
                title: "Spatial Awareness",
                desc: "Develops spatial orientation and visual memory."
            },
            focus: {
                title: "Concentration",
                desc: "Increases focus and concentration capacity."
            },
            planning: {
                title: "Planning",
                desc: "Exercises planning and strategy execution skills."
            }
        },
        levels: {
            1: "Level 1 - Beginner",
            2: "Level 2 - Intermediate",
            3: "Level 3 - Advanced"
        },
        buttons: {
            newGame: "New Game",
            showPath: "Show Path",
            sound: "Sound",
            language: "PT"
        },
        stats: {
            time: "Time",
            score: "Score",
            record: "Record"
        },
        howToPlay: {
            title: "How to Play",
            movement: "Use arrow keys to move",
            goal: "Reach the end of the maze"
        },
        ranking: "Ranking",
        modal: {
            congrats: "Congratulations!",
            completed: "You completed the maze!",
            playAgain: "Play Again",
            time: "Time",
            score: "Score"
        },
        footer: "© 2024 Matheus Ricardo - All rights reserved",
        gameModes: {
            normal: "Normal Mode",
            timeAttack: "Time Attack",
            mirror: "Mirror Mode"
        },
        themes: {
            CLASSIC: "Classic",
            SPACE: "Space",
            FOREST: "Forest"
        },
        pause: {
            pause: "PAUSE",
            continue: "CONTINUE",
            paused: "PAUSED",
            pressText: "Press CONTINUE to resume game"
        },
        timeUp: {
            title: "❌ Time's Up!",
            message: "You didn't complete the maze in time!"
        }
    }
};

let currentLanguage = 'pt';

function toggleLanguage() {
    currentLanguage = currentLanguage === 'pt' ? 'en' : 'pt';
    updateLanguage();
    criarSecaoConquistas(); // Recriar seção de conquistas com novo idioma
    localStorage.setItem('preferredLanguage', currentLanguage);
}

function updateLanguage() {
    const t = TRANSLATIONS[currentLanguage];
    
    // Atualizar título e subtítulo
    document.querySelector('.game-title').textContent = t.title;
    document.querySelector('.hero-subtitle').textContent = t.subtitle;
    
    // Atualizar select de dificuldade
    const select = document.getElementById('dificuldade');
    select.options[0].text = t.levels[1];
    select.options[1].text = t.levels[2];
    select.options[2].text = t.levels[3];
    
    // Atualizar botões
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        if (btn.classList.contains('primary')) {
            btn.innerHTML = `<span class="btn-icon">🎮</span>${t.buttons.newGame}`;
        } else if (btn.classList.contains('secondary')) {
            btn.innerHTML = `<span class="btn-icon">🗺️</span>${t.buttons.showPath}`;
        } else if (btn.classList.contains('language-btn')) {
            btn.textContent = t.buttons.language;
        }
    });
    
    // Atualizar estatísticas
    document.querySelectorAll('.stat-label').forEach(label => {
        if (label.dataset.stat === 'time') label.textContent = t.stats.time;
        if (label.dataset.stat === 'score') label.textContent = t.stats.score;
        if (label.dataset.stat === 'record') label.textContent = t.stats.record;
    });
    
    // Atualizar instruções
    const instructions = document.querySelector('.game-instructions');
    if (instructions) {
        instructions.querySelector('h3').textContent = t.howToPlay.title;
        const instructionTexts = instructions.querySelectorAll('.instruction-item p');
        instructionTexts[0].textContent = t.howToPlay.movement;
        instructionTexts[1].textContent = t.howToPlay.goal;
    }
    
    // Atualizar seção de benefícios
    document.querySelector('.benefits-section .section-title').textContent = t.whyPlay;
    const benefitCards = document.querySelectorAll('.benefit-card');
    const benefitKeys = ['logic', 'spatial', 'focus', 'planning'];
    benefitCards.forEach((card, index) => {
        const key = benefitKeys[index];
        card.querySelector('h3').textContent = t.benefits[key].title;
        card.querySelector('p').textContent = t.benefits[key].desc;
    });
    
    // Atualizar ranking
    const rankingTitle = document.querySelector('.ranking-section .section-title');
    if (rankingTitle) {
        rankingTitle.textContent = t.ranking;
    }
    
    // Atualizar modal
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.querySelector('h2').textContent = t.modal.congrats;
        modal.querySelector('p').textContent = t.modal.completed;
        const modalStats = modal.querySelectorAll('.modal-stat-label');
        modalStats[0].textContent = t.modal.time;
        modalStats[1].textContent = t.modal.score;
        modal.querySelector('.btn').textContent = t.modal.playAgain;
    }
    
    // Atualizar footer
    document.querySelector('.footer p').textContent = t.footer;
    
    // Atualizar seletores de modo e tema
    const gameModeSelect = document.getElementById('gameMode');
    const themeSelect = document.getElementById('theme');
    
    // Atualizar opções do modo de jogo
    Array.from(gameModeSelect.options).forEach(option => {
        option.text = t.gameModes[option.value];
    });
    
    // Atualizar opções de tema
    Array.from(themeSelect.options).forEach(option => {
        option.text = t.themes[option.value];
    });
}

// Funções de controle do jogo
function iniciarNovoJogo() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    
    const nivel = parseInt(document.getElementById('dificuldade').value) || 1;
    const modoAtual = document.getElementById('gameMode').value;
    
    labirinto = new Labirinto(NIVEIS[nivel].tamanho, NIVEIS[nivel].tamanho);
    labirinto.setDificuldade(nivel);
    labirinto.gerarLabirinto(); // Gerar o labirinto antes de definir o modo
    labirinto.setGameMode(modoAtual);
    labirinto.iniciarJogo();
    
    const canvas = document.getElementById('labirintoCanvas');
    canvas.width = labirinto.colunas * 30; // Definir tamanho do canvas
    canvas.height = labirinto.linhas * 30;
    labirinto.desenharLabirinto(canvas);
    
    atualizarExibicaoRecordes(nivel);
    atualizarTela();
    iniciarTimer();
}

function mudarDificuldade() {
    iniciarNovoJogo();
}

function mostrarSolucao() {
    if (!labirinto) return;
    
    const canvas = document.getElementById('labirintoCanvas');
    const ctx = canvas.getContext('2d');
    const cellSize = 30;
    
    // Primeiro redesenha o labirinto
    labirinto.desenharLabirinto(canvas);
    
    // Encontra o caminho
    let linha = 0;
    let coluna = 0;
    const caminho = [];
    
    function podeMover(l, c, direcao) {
        if (l < 0 || l >= labirinto.linhas || c < 0 || c >= labirinto.colunas) return false;
        return !labirinto.grade[linha][coluna].paredes[direcao];
    }
    
    // Encontra o caminho usando um algoritmo mais simples
    while (linha !== labirinto.linhas - 1 || coluna !== labirinto.colunas - 1) {
        caminho.push([linha, coluna]);
        
        // Tenta mover em cada direção
        if (podeMover(linha, coluna + 1, 1)) { // direita
            coluna++;
        } else if (podeMover(linha + 1, coluna, 2)) { // baixo
            linha++;
        } else if (podeMover(linha - 1, coluna, 0)) { // cima
            linha--;
        } else if (podeMover(linha, coluna - 1, 3)) { // esquerda
            coluna--;
        } else {
            break; // Se não pode mover em nenhuma direção
        }
    }
    
    // Adiciona o ponto final
    caminho.push([linha, coluna]);
    
    // Desenha o caminho
    ctx.beginPath();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 10;
    
    caminho.forEach(([l, c], index) => {
        const x = c * cellSize + cellSize/2;
        const y = l * cellSize + cellSize/2;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Desenha círculos nos pontos do caminho
    caminho.forEach(([l, c], index) => {
        const x = c * cellSize + cellSize/2;
        const y = l * cellSize + cellSize/2;
        
        // Círculo branco
        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Número
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), x, y);
    });
    
    // Aplica a penalidade
    labirinto.pontuacao = Math.max(labirinto.pontuacao - 200, 0);
    document.getElementById('pontuacao').textContent = labirinto.pontuacao;
}

function atualizarTela() {
    const canvas = document.getElementById('labirintoCanvas');
    if (labirinto && canvas) {
        labirinto.desenharLabirinto(canvas);
        if (!labirinto.jogoTerminado) {
            requestAnimationFrame(atualizarTela);
        }
    }
}

function iniciarTimer() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        if (labirinto && !labirinto.jogoTerminado && labirinto.primeiroMovimento) {
            const tempo = Math.floor((Date.now() - labirinto.tempoInicio) / 1000);
            document.getElementById('tempo').textContent = tempo;
            document.getElementById('pontuacao').textContent = labirinto.pontuacao;
        }
    }, 1000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    inicializarIdioma();
    criarSecaoConquistas();
    
    // Adicionar botão de pause
    const t = TRANSLATIONS[currentLanguage];
    const controlButtons = document.querySelector('.control-buttons');
    const pauseButton = document.createElement('button');
    pauseButton.className = 'btn pause-btn';
    pauseButton.innerHTML = `<span class="btn-icon">⏸️</span>${t.pause.pause}`;
    pauseButton.onclick = () => {
        if (labirinto) {
            labirinto.togglePause();
        }
    };
    controlButtons.appendChild(pauseButton);
    
    iniciarNovoJogo(); // Iniciar o jogo após criar as conquistas
    setupMobileControls();
});

document.addEventListener('keydown', (e) => {
    if (labirinto) {
        e.preventDefault(); // Previne o scroll da página
        labirinto.moverJogador(e.key);
    }
});

// Inicialização do ranking
let ranking = JSON.parse(localStorage.getItem('labirintoRanking')) || [];

function atualizarRanking(pontuacao, tempo) {
    ranking.push({ pontuacao, tempo, data: new Date().toISOString() });
    ranking.sort((a, b) => b.pontuacao - a.pontuacao);
    ranking = ranking.slice(0, 5); // Manter apenas os 5 melhores
    localStorage.setItem('labirintoRanking', JSON.stringify(ranking));
    mostrarRanking();
}

function mostrarRanking() {
    const rankingList = document.getElementById('rankingList');
    if (rankingList) {
        rankingList.innerHTML = ranking.map((score, index) => `
            <div class="ranking-item">
                <span>${index + 1}. ${score.pontuacao} points</span>
                <span>${score.tempo}s</span>
            </div>
        `).join('');
    }
}

// Adicione estas funções para gerenciar recordes
function atualizarRecordes(nivel, tempo, pontuacao) {
    let recordes = JSON.parse(localStorage.getItem('labirintoRecordes')) || {};
    
    if (!recordes[nivel]) {
        recordes[nivel] = {
            melhorTempo: Infinity,
            melhorPontuacao: 0,
            historico: []
        };
    }
    
    // Atualiza melhores marcas
    recordes[nivel].melhorTempo = Math.min(recordes[nivel].melhorTempo, tempo);
    recordes[nivel].melhorPontuacao = Math.max(recordes[nivel].melhorPontuacao, pontuacao);
    
    // Adiciona ao histórico
    recordes[nivel].historico.push({
        tempo,
        pontuacao,
        data: new Date().toISOString()
    });
    
    // Mantém apenas os 10 melhores resultados
    recordes[nivel].historico.sort((a, b) => b.pontuacao - a.pontuacao);
    recordes[nivel].historico = recordes[nivel].historico.slice(0, 10);
    
    localStorage.setItem('labirintoRecordes', JSON.stringify(recordes));
    atualizarExibicaoRecordes(nivel);
}

function atualizarExibicaoRecordes(nivel) {
    const recordes = JSON.parse(localStorage.getItem('labirintoRecordes')) || {};
    const recordeNivel = recordes[nivel] || { melhorTempo: '-', melhorPontuacao: 0, historico: [] };
    
    document.getElementById('melhorTempo').textContent = 
        recordeNivel.melhorTempo === Infinity ? '-' : `${Math.floor(recordeNivel.melhorTempo)}s`;
    
    // Atualiza o ranking
    const rankingList = document.getElementById('rankingList');
    if (rankingList) {
        rankingList.innerHTML = recordeNivel.historico.map((record, index) => `
            <div class="ranking-item">
                <span>#${index + 1}</span>
                <span>${record.pontuacao} pts</span>
                <span>${Math.floor(record.tempo)}s</span>
                <span>${new Date(record.data).toLocaleDateString()}</span>
            </div>
        `).join('');
    }
}

function mostrarModalVitoria(tempo, pontuacao) {
    const modal = document.getElementById('modal');
    const overlay = document.querySelector('.overlay');
    const t = TRANSLATIONS[currentLanguage];
    
    modal.querySelector('h2').textContent = t.modal.congrats;
    modal.querySelector('p').textContent = t.modal.completed;
    document.getElementById('tempoFinal').textContent = `${Math.floor(tempo)}s`;
    document.getElementById('pontuacaoFinal').textContent = pontuacao;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
}

// Adicione a função para fechar o modal
function fecharModal() {
    document.getElementById('modal').style.display = 'none';
    document.querySelector('.overlay').style.display = 'none';
    iniciarNovoJogo();
}

// Verificar idioma preferido ao carregar
function inicializarIdioma() {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        updateLanguage();
    }
}

// Adicione estas variáveis no início do arquivo
let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;
const SWIPE_THRESHOLD = 30; // Pixels mínimos para considerar um swipe

// Adicione estas funções para lidar com eventos touch
function handleTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
        // Determinar a direção do swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Movimento horizontal
            if (deltaX > 0) {
                labirinto.moverJogador('ArrowRight');
            } else {
                labirinto.moverJogador('ArrowLeft');
            }
        } else {
            // Movimento vertical
            if (deltaY > 0) {
                labirinto.moverJogador('ArrowDown');
            } else {
                labirinto.moverJogador('ArrowUp');
            }
        }
        
        // Resetar posição inicial do touch
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
}

function handleTouchEnd() {
    isDragging = false;
}

// Adicione esta funço para configurar os controles móveis
function setupMobileControls() {
    const canvas = document.getElementById('labirintoCanvas');
    
    // Configurar botões de controle móvel
    document.querySelectorAll('.mobile-btn').forEach(btn => {
        let isPressed = false;
        let moveInterval;

        function startMoving(direction) {
            if (isPressed) return;
            isPressed = true;
            
            function move() {
                if (labirinto) {
                    labirinto.moverJogador(direction);
                }
            }
            
            move(); // Movimento inicial
            moveInterval = setInterval(move, 150); // Continua movendo enquanto pressionado
        }

        function stopMoving() {
            isPressed = false;
            if (moveInterval) {
                clearInterval(moveInterval);
                moveInterval = null;
            }
        }

        // Touch events
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const direction = btn.getAttribute('data-direction');
            startMoving(direction);
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopMoving();
        });

        // Mouse events (para teste em desktop)
        btn.addEventListener('mousedown', (e) => {
            const direction = btn.getAttribute('data-direction');
            startMoving(direction);
        });

        btn.addEventListener('mouseup', stopMoving);
        btn.addEventListener('mouseleave', stopMoving);
    });
} 

// Adicionar constante para as conquistas
const ACHIEVEMENTS = {
    SPEED_RUNNER: {
        id: 'speedRunner',
        icon: '⚡',
        titlePt: 'Velocista',
        titleEn: 'Speed Runner',
        descPt: 'Complete em menos de 30s',
        descEn: 'Complete under 30s'
    },
    MAZE_MASTER: {
        id: 'mazeMaster',
        icon: '👑',
        titlePt: 'Mestre do Labirinto',
        titleEn: 'Maze Master',
        descPt: 'Complete todos os níveis',
        descEn: 'Complete all levels'
    },
    PERFECTIONIST: {
        id: 'perfectionist',
        icon: '🎯',
        titlePt: 'Perfeccionista',
        titleEn: 'Perfectionist',
        descPt: 'Obtenha pontuação máxima',
        descEn: 'Get max score'
    },
    PERSISTENT: {
        id: 'persistent',
        icon: '🏆',
        titlePt: 'Persistente',
        titleEn: 'Persistent',
        descPt: 'Complete 10 labirintos',
        descEn: 'Complete 10 mazes'
    }
};

// Adicionar função para criar a seção de conquistas
function criarSecaoConquistas() {
    const achievementsSection = document.querySelector('.achievements-section');
    const achievementsGrid = document.createElement('div');
    achievementsGrid.className = 'achievements-grid';

    // Atualizar o título da seção baseado no idioma
    achievementsSection.innerHTML = `
        <h2 class="section-title">${currentLanguage === 'pt' ? 'Conquistas' : 'Achievements'}</h2>
    `;

    // Criar cards para cada conquista
    Object.values(ACHIEVEMENTS).forEach(achievement => {
        const card = document.createElement('div');
        card.className = 'achievement-card';
        card.id = `achievement-${achievement.id}`;
        
        const isUnlocked = verificarConquistaDesbloqueada(achievement.id);
        if (isUnlocked) {
            card.classList.add('unlocked');
        }

        // Usar o ícone correto baseado no idioma
        let icon;
        switch(achievement.id) {
            case 'speedRunner':
                icon = '⚡';
                break;
            case 'mazeMaster':
                icon = '👑';
                break;
            case 'perfectionist':
                icon = '🎯';
                break;
            case 'persistent':
                icon = '🏆';
                break;
        }

        card.innerHTML = `
            <div class="achievement-icon">${icon}</div>
            <h3>${currentLanguage === 'pt' ? achievement.titlePt : achievement.titleEn}</h3>
            <p>${currentLanguage === 'pt' ? achievement.descPt : achievement.descEn}</p>
        `;

        achievementsGrid.appendChild(card);
    });

    achievementsSection.appendChild(achievementsGrid);
}

// Função para verificar se uma conquista está desbloqueada
function verificarConquistaDesbloqueada(achievementId) {
    const conquistas = JSON.parse(localStorage.getItem('conquistas')) || {};
    return conquistas[achievementId] || false;
}

// Função para mostrar notificação de conquista
function mostrarNotificacaoConquista(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <h4>${currentLanguage === 'pt' ? achievement.titlePt : achievement.titleEn}</h4>
            <p>${currentLanguage === 'pt' ? achievement.descPt : achievement.descEn}</p>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }, 100);
}

// Função para desbloquear uma conquista
function desbloquearConquista(achievementId) {
    const conquistas = JSON.parse(localStorage.getItem('conquistas')) || {};
    if (!conquistas[achievementId]) {
        conquistas[achievementId] = true;
        localStorage.setItem('conquistas', JSON.stringify(conquistas));
        
        const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
        if (achievement) {
            mostrarNotificacaoConquista(achievement);
            const card = document.getElementById(`achievement-${achievementId}`);
            if (card) {
                card.classList.add('unlocked');
            }
        }
    }
}

// Adicionar função para verificar conquistas
function verificarConquistas(tempo, pontuacao, nivel) {
    // Speed Runner - Complete em menos de 30s
    if (tempo < 30) {
        desbloquearConquista('speedRunner');
    }

    // Perfectionist - Pontuação máxima
    const pontuacaoMaximaPossivel = 1000 * nivel;
    if (pontuacao >= pontuacaoMaximaPossivel) {
        desbloquearConquista('perfectionist');
    }

    // Persistent - Complete 10 labirintos
    const labirintosCompletados = parseInt(localStorage.getItem('labirintosCompletados') || '0') + 1;
    localStorage.setItem('labirintosCompletados', labirintosCompletados);
    if (labirintosCompletados >= 10) {
        desbloquearConquista('persistent');
    }

    // Maze Master - Complete todos os níveis
    const niveisCompletados = JSON.parse(localStorage.getItem('niveisCompletados') || '{}');
    niveisCompletados[nivel] = true;
    localStorage.setItem('niveisCompletados', JSON.stringify(niveisCompletados));
    
    if (Object.keys(niveisCompletados).length >= 3) {
        desbloquearConquista('mazeMaster');
    }
} 

// Atualizar a função que inicializa o select de modos de jogo
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...

    // Limpar e recriar o select de modos de jogo
    const gameModeSelect = document.getElementById('gameMode');
    const t = TRANSLATIONS[currentLanguage];
    
    // Definir as opções diretamente
    gameModeSelect.innerHTML = `
        <option value="normal">${t.gameModes.normal}</option>
        <option value="timeAttack">${t.gameModes.timeAttack}</option>
        <option value="mirror">${t.gameModes.mirror}</option>
    `;

    // Atualizar a função updateLanguage para também atualizar o select de modos
    function updateLanguage() {
        const t = TRANSLATIONS[currentLanguage];
        const gameModeSelect = document.getElementById('gameMode');
        
        // Atualizar as opções do select com o idioma correto
        const options = gameModeSelect.options;
        options[0].text = t.gameModes.normal;
        options[1].text = t.gameModes.timeAttack;
        options[2].text = t.gameModes.mirror;
        
        // ... resto do código de updateLanguage ...
    }

    // ... resto do código do DOMContentLoaded ...
});

// Atualizar a função mudarModoJogo para garantir que apenas modos válidos sejam aceitos
function mudarModoJogo() {
    const modoSelecionado = document.getElementById('gameMode').value;
    const modosValidos = ['normal', 'timeAttack', 'mirror'];
    
    if (labirinto && modosValidos.includes(modoSelecionado)) {
        labirinto.setGameMode(modoSelecionado);
    }
} 

// Adicionar função para mudar tema
function mudarTema() {
    const temaSelect = document.getElementById('theme');
    const temaSelecionado = temaSelect.value;
    
    if (labirinto && THEMES[temaSelecionado]) {
        labirinto.setTheme(temaSelecionado);
    }
} 