"use client";

import React, { useState, useCallback } from 'react';

interface AntiPortfolioDestructionProps {
    file: File;
    onComplete: () => void;
    autoStart?: boolean;
}

export default function AntiPortfolioDestruction({ file, onComplete, autoStart = false }: AntiPortfolioDestructionProps) {
    const [isDestroying, setIsDestroying] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [destructionPhase, setDestructionPhase] = useState(0);
    const [modalPhase, setModalPhase] = useState(0);

    // Trigger destruction
    const handleDestroy = useCallback(() => {
        if (!file) return;

        setIsDestroying(true);
        setDestructionPhase(1); // Shake

        setTimeout(() => setDestructionPhase(2), 400);  // Tear
        setTimeout(() => setDestructionPhase(3), 900);  // Explode
        setTimeout(() => setDestructionPhase(4), 1400); // Burn/Disintegrate
        setTimeout(() => {
            setIsDestroying(false);
            setDestructionPhase(0);
            setShowModal(true);
            // Fasi della modale per animazione sequenziale
            setTimeout(() => setModalPhase(1), 300);
            setTimeout(() => setModalPhase(2), 800);
            setTimeout(() => setModalPhase(3), 1400);
            setTimeout(() => setModalPhase(4), 2000);
        }, 2200);
    }, [file]);

    // Auto-start effect
    React.useEffect(() => {
        if (autoStart) {
            // Small delay to ensure render happens first
            const timer = setTimeout(() => {
                handleDestroy();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoStart, handleDestroy]);

    const handleCloseModal = () => {
        onComplete();
    };

    // Genera pezzi di carta strappati
    const tornPieces = [...Array(24)].map((_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 300 - 50,
        rotation: Math.random() * 720 - 360,
        scale: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 200,
        width: 15 + Math.random() * 30,
        height: 20 + Math.random() * 40,
    }));

    // Genera particelle di fuoco/cenere
    const particles = [...Array(40)].map((_, i) => ({
        id: i,
        x: Math.random() * 160 - 80,
        y: Math.random() * -200 - 50,
        size: 2 + Math.random() * 8,
        delay: Math.random() * 500,
        duration: 800 + Math.random() * 600,
        color: ['#ff6b35', '#ff8c42', '#ffd166', '#ef476f', '#ff4757'][Math.floor(Math.random() * 5)]
    }));

    // Scintille
    const sparks = [...Array(20)].map((_, i) => ({
        id: i,
        angle: (i / 20) * 360,
        distance: 80 + Math.random() * 120,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 300,
    }));

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 relative overflow-visible border border-slate-700">

                    {/* Header semplice - nessun riferimento alla distruzione */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Iniziamo da te</h2>
                        <p className="text-slate-400">Carica il tuo CV per continuare</p>
                    </div>

                    {/* Document Preview con Distruzione */}
                    <div className="relative mb-6 min-h-[120px]">
                        {file && (
                            <div className={`relative ${isDestroying ? 'pointer-events-none' : ''}`}>

                                {/* Documento principale */}
                                <div
                                    className={`
                    relative bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100
                    border-2 border-amber-300 rounded-xl p-5 shadow-lg
                    transition-all origin-center
                    ${destructionPhase === 1 ? 'animate-violent-shake' : ''}
                    ${destructionPhase >= 2 ? 'opacity-0 scale-0' : ''}
                  `}
                                >
                                    {/* Linee del documento (simulano testo CV) */}
                                    <div className="absolute inset-4 opacity-20">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-2 bg-slate-400 rounded mb-2" style={{ width: `${60 + Math.random() * 40}%` }} />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-14 h-16 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg flex items-center justify-center shadow-inner">
                                            <svg className="w-8 h-8 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate text-lg">{file.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>

                                    {/* Crepe durante shake */}
                                    {destructionPhase >= 1 && (
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none animate-crack-appear" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <path d="M30,0 L35,25 L28,45 L40,70 L32,100" stroke="#8B4513" strokeWidth="0.8" fill="none" className="animate-crack-draw" />
                                            <path d="M70,0 L65,20 L72,50 L60,75 L68,100" stroke="#8B4513" strokeWidth="0.8" fill="none" className="animate-crack-draw" style={{ animationDelay: '100ms' }} />
                                            <path d="M0,40 L25,45 L50,38 L75,48 L100,42" stroke="#8B4513" strokeWidth="0.6" fill="none" className="animate-crack-draw" style={{ animationDelay: '200ms' }} />
                                        </svg>
                                    )}
                                </div>

                                {/* PEZZI STRAPPATI */}
                                {destructionPhase >= 2 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {tornPieces.map((piece) => (
                                            <div
                                                key={piece.id}
                                                className="absolute bg-gradient-to-br from-amber-100 to-amber-200 rounded-sm shadow-lg animate-torn-piece"
                                                style={{
                                                    width: piece.width,
                                                    height: piece.height,
                                                    left: '50%',
                                                    top: '50%',
                                                    '--tx': `${piece.x}px`,
                                                    '--ty': `${piece.y}px`,
                                                    '--rot': `${piece.rotation}deg`,
                                                    '--scale': piece.scale,
                                                    animationDelay: `${piece.delay}ms`,
                                                    clipPath: `polygon(
                            ${Math.random() * 20}% ${Math.random() * 20}%,
                            ${80 + Math.random() * 20}% ${Math.random() * 30}%,
                            ${70 + Math.random() * 30}% ${70 + Math.random() * 30}%,
                            ${Math.random() * 30}% ${80 + Math.random() * 20}%
                          )`
                                                } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* ESPLOSIONE */}
                                {destructionPhase >= 3 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="absolute w-4 h-4 bg-orange-500 rounded-full animate-explosion-ring" />
                                        <div className="absolute w-4 h-4 bg-yellow-400 rounded-full animate-explosion-ring" style={{ animationDelay: '50ms' }} />
                                        <div className="absolute w-4 h-4 bg-red-500 rounded-full animate-explosion-ring" style={{ animationDelay: '100ms' }} />

                                        {sparks.map((spark) => (
                                            <div
                                                key={spark.id}
                                                className="absolute rounded-full bg-yellow-300 animate-spark"
                                                style={{
                                                    width: spark.size,
                                                    height: spark.size,
                                                    '--angle': `${spark.angle}deg`,
                                                    '--distance': `${spark.distance}px`,
                                                    animationDelay: `${spark.delay}ms`,
                                                    boxShadow: '0 0 6px 2px rgba(255, 200, 0, 0.8)'
                                                } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* FIAMME */}
                                {destructionPhase >= 3 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {particles.map((particle) => (
                                            <div
                                                key={particle.id}
                                                className="absolute rounded-full animate-fire-particle"
                                                style={{
                                                    width: particle.size,
                                                    height: particle.size,
                                                    backgroundColor: particle.color,
                                                    '--tx': `${particle.x}px`,
                                                    '--ty': `${particle.y}px`,
                                                    animationDelay: `${particle.delay}ms`,
                                                    animationDuration: `${particle.duration}ms`,
                                                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                                                } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* FLASH */}
                                {destructionPhase === 3 && (
                                    <div className="absolute inset-0 bg-white rounded-xl animate-flash pointer-events-none" />
                                )}

                                {/* FUMO */}
                                {destructionPhase >= 4 && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-16 h-16 rounded-full animate-smoke"
                                                style={{
                                                    background: 'radial-gradient(circle, rgba(100,100,100,0.6) 0%, transparent 70%)',
                                                    animationDelay: `${i * 100}ms`,
                                                    '--tx': `${(Math.random() - 0.5) * 60}px`
                                                } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload Area - Rimosso perché il file è passato come prop */}
                    </div>

                    {/* Button neutrale */}
                    <button
                        onClick={handleDestroy}
                        disabled={!file || isDestroying}
                        className={`
              relative w-full py-4 px-6 rounded-xl font-semibold text-lg
              transition-all duration-300 transform overflow-hidden
              ${file && !isDestroying
                                ? 'bg-white text-slate-900 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] shadow-lg'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }
            `}
                    >
                        {isDestroying ? (
                            <span className="flex items-center justify-center gap-3">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Elaborazione...
                            </span>
                        ) : (
                            <span>Continua</span>
                        )}
                    </button>
                </div>
            </div>

            {/* MODAL ANTIPORTFOLIO */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
                        onClick={handleCloseModal}
                    />

                    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-lg w-full animate-modal-rise border border-slate-700/50 overflow-hidden">

                        {/* Sfondo animato con particelle */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full animate-float-particle"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        backgroundColor: ['#8b5cf6', '#d946ef', '#6366f1', '#f472b6', '#c084fc'][Math.floor(Math.random() * 5)],
                                        animationDelay: `${Math.random() * 3}s`,
                                        animationDuration: `${3 + Math.random() * 4}s`,
                                        opacity: 0.5
                                    }}
                                />
                            ))}
                        </div>

                        {/* Contenuto */}
                        <div className="relative z-10 p-10">

                            {/* ANTIPORTFOLIO - Grande e colorato */}
                            <div className={`flex flex-col items-center text-center mb-8 transition-all duration-700 ${modalPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="mb-4">
                                    <span className="text-slate-500 text-sm font-medium tracking-widest uppercase">Benvenuto in</span>
                                </div>
                                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-center">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-text-shimmer">
                                        ANTI
                                    </span>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-amber-400 animate-text-shimmer-delayed">
                                        PORTFOLIO
                                    </span>
                                </h1>

                                {/* Linea decorativa sotto il titolo */}
                                <div className="flex justify-center mt-4 gap-1">
                                    <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                                    <div className="h-1 w-8 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full" />
                                    <div className="h-1 w-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full" />
                                </div>
                            </div>

                            {/* Icona CV barrato */}
                            <div className={`flex justify-center mb-6 transition-all duration-700 ${modalPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                <div className="relative">
                                    <div className="w-20 h-20 bg-slate-800/80 rounded-2xl flex items-center justify-center border border-slate-700">
                                        <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-14 h-1 bg-gradient-to-r from-red-500 to-orange-500 rotate-45 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messaggi - appaiono in sequenza */}
                            <div className="text-center mb-8">
                                <p className={`text-slate-400 text-lg mb-4 transition-all duration-700 ${modalPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    Il tuo CV? <span className="text-slate-300 font-semibold">Non ci serve.</span>
                                </p>

                                <p className={`text-xl text-white font-medium mb-2 transition-all duration-700 delay-100 ${modalPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    Non importa chi sei stato.
                                </p>

                                <p className={`text-2xl font-bold transition-all duration-700 delay-200 ${modalPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                        Ci interessa chi puoi diventare.
                                    </span>
                                </p>
                            </div>

                            {/* Box esplicativo */}
                            <div className={`bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-700/50 transition-all duration-700 ${modalPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <p className="text-slate-300 text-center leading-relaxed">
                                    Ti daremo un <span className="text-white font-semibold">progetto reale</span> basato sulla tua professione.
                                    Sarai valutato su quello, <span className="text-white font-semibold">non sul tuo passato</span>.
                                </p>
                            </div>

                            {/* CTA */}
                            <div className={`transition-all duration-700 ${modalPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <button
                                    onClick={handleCloseModal}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-fuchsia-500/25 group"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Inizia la sfida
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Glow effect ai bordi */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 rounded-3xl blur-xl -z-10 animate-pulse-slow" />
                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes violent-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-8px, -6px) rotate(-3deg); }
          20% { transform: translate(8px, 6px) rotate(3deg); }
          30% { transform: translate(-10px, 4px) rotate(-2deg); }
          40% { transform: translate(10px, -4px) rotate(2deg); }
          50% { transform: translate(-8px, 8px) rotate(-4deg); }
          60% { transform: translate(6px, -8px) rotate(4deg); }
          70% { transform: translate(-12px, 2px) rotate(-3deg); }
          80% { transform: translate(12px, -2px) rotate(3deg); }
          90% { transform: translate(-6px, 6px) rotate(-2deg); }
        }
        
        @keyframes crack-draw {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        
        @keyframes crack-appear {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes torn-piece {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--tx)),
              calc(-50% + var(--ty))
            ) rotate(var(--rot)) scale(var(--scale));
            opacity: 0;
          }
        }
        
        @keyframes explosion-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(25); opacity: 0; }
        }
        
        @keyframes spark {
          0% { transform: rotate(var(--angle)) translateX(0); opacity: 1; }
          100% { transform: rotate(var(--angle)) translateX(var(--distance)); opacity: 0; }
        }
        
        @keyframes fire-particle {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); opacity: 0; }
        }
        
        @keyframes flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes smoke {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0.8; }
          100% { transform: translate(calc(-50% + var(--tx)), -100px) scale(2); opacity: 0; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modal-rise {
          0% {
            transform: translateY(40px) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes float-particle {
          0%, 100% { 
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% { 
            transform: translateY(-20px) scale(1.5);
            opacity: 0.8;
          }
        }
        
        @keyframes text-shimmer {
          0%, 100% { 
            background-size: 200% 100%;
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }
        
        @keyframes text-shimmer-delayed {
          0%, 100% { 
            background-size: 200% 100%;
            background-position: 100% 50%; 
          }
          50% { 
            background-position: 0% 50%; 
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .animate-violent-shake { animation: violent-shake 0.4s ease-in-out; }
        .animate-crack-draw { stroke-dasharray: 200; animation: crack-draw 0.3s ease-out forwards; }
        .animate-crack-appear { animation: crack-appear 0.2s ease-out; }
        .animate-torn-piece { animation: torn-piece 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .animate-explosion-ring { animation: explosion-ring 0.5s ease-out forwards; }
        .animate-spark { animation: spark 0.4s ease-out forwards; }
        .animate-fire-particle { animation: fire-particle 0.8s ease-out forwards; }
        .animate-flash { animation: flash 0.3s ease-out forwards; }
        .animate-smoke { animation: smoke 1.2s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-modal-rise { animation: modal-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-float-particle { animation: float-particle ease-in-out infinite; }
        .animate-text-shimmer { animation: text-shimmer 3s ease infinite; }
        .animate-text-shimmer-delayed { animation: text-shimmer-delayed 3s ease infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
        </div>
    );
}
