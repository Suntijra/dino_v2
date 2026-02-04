
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GameStatus, 
  Obstacle, 
  GameState,
  Particle
} from './types';
import { 
  GRAVITY, 
  JUMP_FORCE, 
  GROUND_Y, 
  INITIAL_SPEED, 
  SPEED_INCREMENT, 
  MAX_SPEED, 
  DINO_WIDTH, 
  DINO_HEIGHT, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_MAX
} from './constants';
 

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    coins: 0,
    highScore: parseInt(localStorage.getItem('dinoHighScore') || '0'),
    status: 'START',
    dinoY: 0,
    velocity: 0,
    isJumping: false,
    obstacles: [],
    gameSpeed: INITIAL_SPEED,

  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const nextSpawnTimeRef = useRef<number>(0);
  const stateRef = useRef(gameState);
  
  /* Removed AI refs */
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const isGameOverProcessing = useRef(false);
  
  const lastScoreMilestoneRef = useRef(0);
  const lastCoinMilestoneRef = useRef(0);


  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // --- Retro SFX Synthesizers (No API Required) ---
  const playJumpSound = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playCoinSound = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const playHitSound = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const startGame = useCallback(() => {
    isGameOverProcessing.current = false;
    lastScoreMilestoneRef.current = 0;
    lastCoinMilestoneRef.current = 0;
    
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      score: 0,
      coins: 0,
      dinoY: 0,
      velocity: 0,
      isJumping: false,
      obstacles: [],
      gameSpeed: INITIAL_SPEED,
    }));
    // AI Bubble removed
    setParticles([]);
    lastTimeRef.current = performance.now();
    nextSpawnTimeRef.current = performance.now() + 1000;
  }, []);



  const gameOver = async () => {
    if (isGameOverProcessing.current) return;
    isGameOverProcessing.current = true;

    playHitSound();
    
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 300);
    
    const finalScore = Math.floor(stateRef.current.score);
    const newHighScore = Math.max(stateRef.current.highScore, finalScore);
    localStorage.setItem('dinoHighScore', newHighScore.toString());

    setGameState(prev => ({
      ...prev,
      status: 'GAME_OVER',
      highScore: newHighScore,
    }));
    // AI Message removed

    createParticles(120, GROUND_Y + stateRef.current.dinoY - 40, '#ff0055', 30);
    
    // AI commentary removed
  };

  const handleJump = useCallback((e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    const current = stateRef.current;
    if (current.status === 'START') startGame();
    else if (current.status === 'PLAYING' && !current.isJumping) {
      playJumpSound();
      setGameState(prev => ({ ...prev, isJumping: true, velocity: JUMP_FORCE }));
    } else if (current.status === 'GAME_OVER') startGame();
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') handleJump(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  const update = (time: number) => {
    const deltaTime = time - (lastTimeRef.current || time);
    lastTimeRef.current = time;

    if (stateRef.current.status === 'PLAYING') {
      const currentScore = stateRef.current.score;
      const currentCoins = stateRef.current.coins;
      
      const scoreMilestone = Math.floor(currentScore / 1000);
      if (scoreMilestone > lastScoreMilestoneRef.current) {
          lastScoreMilestoneRef.current = scoreMilestone;
          triggerMidGameAI(currentScore, currentCoins, 'DISTANCE');
      }

      const coinMilestone = Math.floor(currentCoins / 15);
      if (coinMilestone > lastCoinMilestoneRef.current && currentCoins > 0) {
          lastCoinMilestoneRef.current = coinMilestone;
          triggerMidGameAI(currentScore, currentCoins, 'COINS');
      }

      setGameState(prev => {
        let newY = prev.dinoY + prev.velocity;
        let newVelocity = prev.velocity + GRAVITY;
        let newIsJumping = prev.isJumping;

        if (newY >= 0) {
          newY = 0;
          newVelocity = 0;
          newIsJumping = false;
        }

        let newObstacles = [...prev.obstacles];
        if (time > nextSpawnTimeRef.current) {
          const rand = Math.random();
          let type: 'CACTUS' | 'BIRD' | 'COIN' = rand > 0.9 ? 'COIN' : rand > 0.7 ? 'BIRD' : 'CACTUS';
          let height = type === 'CACTUS' ? 50 + Math.random() * 30 : type === 'BIRD' ? 45 : 35;
          let width = type === 'CACTUS' ? 40 : type === 'BIRD' ? 60 : 35;
          let y = type === 'BIRD' ? -80 - Math.random() * 100 : type === 'COIN' ? -120 - Math.random() * 100 : 0;
          newObstacles.push({ id: Date.now(), x: CANVAS_WIDTH, width, height, type, y, collected: false });
          nextSpawnTimeRef.current = time + (SPAWN_INTERVAL_MIN + Math.random() * 1200) / (prev.gameSpeed / INITIAL_SPEED);
        }

        let coinsEarned = 0;
        const remainingObstacles: Obstacle[] = [];
        let collision = false;

        for (const obs of newObstacles) {
          const nx = obs.x - prev.gameSpeed;
          if (nx + obs.width < -100) continue;
          
          const padding = 15;
          const dinoBox = {
            l: 100 + padding, r: 100 + DINO_WIDTH - padding,
            t: GROUND_Y + newY - DINO_HEIGHT + padding, b: GROUND_Y + newY - padding
          };
          const obsBox = {
            l: nx + padding, r: nx + obs.width - padding,
            t: GROUND_Y + obs.y - obs.height + padding, b: GROUND_Y + obs.y - padding
          };

          const isColliding = dinoBox.l < obsBox.r && dinoBox.r > obsBox.l && dinoBox.t < obsBox.b && dinoBox.b > obsBox.t;
          
          if (isColliding) {
            if (obs.type === 'COIN' && !obs.collected) {
              obs.collected = true;
              coinsEarned++;
              playCoinSound();
              createParticles(nx + 17, GROUND_Y + obs.y - 17, '#fbbf24', 15);
              continue;
            } else if (obs.type !== 'COIN') {
              collision = true;
            }
          }
          remainingObstacles.push({ ...obs, x: nx });
        }

        if (collision) {
          gameOver();
          return { ...prev, status: 'GAME_OVER' };
        }

        return {
          ...prev,
          score: prev.score + (deltaTime * 0.02),
          coins: prev.coins + coinsEarned,
          dinoY: newY,
          velocity: newVelocity,
          isJumping: newIsJumping,
          obstacles: remainingObstacles,
          gameSpeed: Math.min(prev.gameSpeed + SPEED_INCREMENT, MAX_SPEED)
        };
      });
    }

    setParticles(prev => prev
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 0.015 }))
      .filter(p => p.life > 0)
    );

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for(let i=0; i<30; i++) {
        const x = (i * 197 + Date.now() / 80) % CANVAS_WIDTH;
        const y = (i * 91) % (CANVAS_HEIGHT - 100);
        ctx.fillRect(x, y, 2, 2);
    }

    // Grid
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
    const spacing = 120;
    const offset = (Date.now() / 10 * (stateRef.current.gameSpeed || 1)) % spacing;
    for (let i = -2; i <= CANVAS_WIDTH / spacing + 2; i++) {
      const x = i * spacing - offset;
      ctx.beginPath(); ctx.moveTo(x + 300, GROUND_Y); ctx.lineTo(x - 300, CANVAS_HEIGHT); ctx.stroke();
    }

    // Ground
    ctx.shadowBlur = 15; ctx.shadowColor = '#6366f1';
    ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_WIDTH, GROUND_Y); ctx.stroke();
    ctx.shadowBlur = 0;

    // Dino
    const dy = GROUND_Y + stateRef.current.dinoY - DINO_HEIGHT;
    const dx = 100;
    ctx.shadowBlur = 20; ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#22d3ee';
    
    // Body Parts
    ctx.fillRect(dx + 15, dy, 35, 45); // Main Body
    ctx.fillRect(dx + 40, dy - 15, 25, 25); // Head
    ctx.fillRect(dx, dy + 15, 15, 20); // Tail
    ctx.fillStyle = '#fff'; ctx.fillRect(dx + 55, dy - 8, 5, 5); // Eye
    
    // Dino Legs Animation
    ctx.fillStyle = '#22d3ee';
    if (stateRef.current.status === 'PLAYING' && !stateRef.current.isJumping) {
      // Calculate leg movement based on score (distance) for sync
      const legToggle = Math.floor(stateRef.current.score * 0.7) % 2 === 0;
      
      // Leg 1 (Left)
      ctx.fillRect(dx + 20, dy + 45 + (legToggle ? 0 : 8), 10, 14);
      // Leg 2 (Right)
      ctx.fillRect(dx + 38, dy + 45 + (legToggle ? 8 : 0), 10, 14);
    } else if (stateRef.current.isJumping) {
      // Jumping pose: legs tucked slightly
      ctx.fillRect(dx + 20, dy + 45, 10, 10);
      ctx.fillRect(dx + 38, dy + 45, 10, 10);
    } else {
      // Static pose for Start/Game Over
      ctx.fillRect(dx + 20, dy + 45, 10, 14);
      ctx.fillRect(dx + 38, dy + 45, 10, 14);
    }
    
    ctx.shadowBlur = 0;

    // Obstacles
    stateRef.current.obstacles.forEach(obs => {
      ctx.shadowBlur = 12;
      if (obs.type === 'CACTUS') {
        ctx.shadowColor = '#10b981'; ctx.fillStyle = '#10b981';
        ctx.fillRect(obs.x + 12, GROUND_Y - obs.height, 16, obs.height);
      } else if (obs.type === 'BIRD') {
        ctx.shadowColor = '#f472b6'; ctx.fillStyle = '#f472b6';
        const flap = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.fillRect(obs.x, GROUND_Y + obs.y - obs.height, obs.width, 15);
        ctx.fillRect(obs.x + 15, GROUND_Y + obs.y - obs.height + (flap ? -20 : 20), 25, 12);
      } else if (obs.type === 'COIN') {
        const b = Math.sin(Date.now() / 120) * 8;
        ctx.shadowColor = '#fbbf24'; ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(obs.x + 17, GROUND_Y + obs.y - 17 + b, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('$', obs.x + 17, GROUND_Y + obs.y - 11 + b);
      }
      ctx.shadowBlur = 0;
    });

    particles.forEach(p => {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, []);

  return (
    <div 
      className={`relative w-full h-full flex items-center justify-center bg-black transition-all duration-300 ${isScreenShaking ? 'scale-105' : 'scale-100'}`}
      onMouseDown={() => handleJump()}
      onTouchStart={(e) => handleJump(e)}
    >
      <div className="relative w-full max-w-[1400px] aspect-[2/1] bg-slate-900 shadow-[0_0_150px_rgba(0,0,0,1)] overflow-hidden sm:rounded-2xl border border-white/5">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full object-cover pointer-events-none"/>

        {/* HUD */}
        <div className="absolute top-[4%] left-[4%] right-[4%] flex justify-between items-start pointer-events-none select-none z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-xl flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-sm sm:text-xl font-extrabold text-yellow-500">✨ {gameState.coins}</span>
          </div>
          <div className="text-right">
             <div className="text-2xl sm:text-6xl font-['JetBrains_Mono'] font-extrabold text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                {Math.floor(gameState.score).toString().padStart(6, '0')}
             </div>
             <p className="text-[7px] sm:text-[9px] font-black text-cyan-500 tracking-[0.3em] uppercase">METERS</p>
          </div>
        </div>

        {/* AI Message */}
        {/* AI Message removed */}

        {gameState.status === 'START' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-30">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-pulse">
               <span className="text-xl sm:text-4xl translate-x-1 text-white">▶</span>
            </div>
            <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tighter mt-8 mb-2 uppercase italic">Neon Runner</h1>
            <p className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-[8px] sm:text-sm">Initiate System</p>
          </div>
        )}

        {gameState.status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-in zoom-in duration-300 p-6 z-40">
            <h2 className="text-4xl sm:text-7xl font-black text-white mb-2 tracking-tighter uppercase italic">Crash Detected</h2>
            <div className="flex gap-10 my-6">
               <div className="text-center">
                  <p className="text-[10px] text-red-300 font-bold uppercase tracking-widest">Distance</p>
                  <p className="text-2xl sm:text-5xl font-extrabold font-['JetBrains_Mono'] text-white">{Math.floor(gameState.score)}m</p>
               </div>
               <div className="text-center border-l border-white/10 pl-10">
                  <p className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest">Hi-Score</p>
                  <p className="text-2xl sm:text-5xl font-extrabold font-['JetBrains_Mono'] text-yellow-400">{gameState.highScore}m</p>
               </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm sm:text-xl hover:bg-cyan-400 transition-all hover:scale-110 uppercase">Restart System</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
