import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CloudSyncService } from '../../services/cloudSync';
import { 
  X, 
  Cloud, 
  RefreshCw, 
  Smartphone, 
  Check, 
  Copy, 
  QrCode, 
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SyncModalProps {
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ onClose }) => {
  const { syncCode, setSyncCode, syncStatus, syncNow, lastSyncedTime } = useApp();
  
  const [inputCode, setInputCode] = useState(syncCode || '');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCode = async (codeToSave: string) => {
    if (!codeToSave.trim()) return;
    setIsSaving(true);
    const clean = codeToSave.trim().toLowerCase();
    setSyncCode(clean);
    await syncNow();
    setIsSaving(false);
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5 }
    });
  };

  const handleGenerateNew = () => {
    const newCode = CloudSyncService.generatePairCode().toLowerCase();
    setInputCode(newCode);
    handleSaveCode(newCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // URL that automatically configures the sync code and vault when opened on iPhone
  const pairUrl = CloudSyncService.getPairUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pairUrl)}&color=131D33&bgcolor=FAF7F2`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-recime-parchment-border flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-recime-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-recime-mango to-recime-corn flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                <span>Sincronização em Nuvem</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-recime-sage text-white font-sans">
                  Tempo Real
                </span>
              </h2>
              <p className="text-xs text-gray-300">
                Conecte seu iPhone e Computador de forma transparente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            syncCode 
              ? 'bg-recime-sage-light/60 border-recime-sage/30 text-recime-navy' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${syncCode ? 'bg-recime-sage animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <h4 className="font-bold text-xs">
                  {syncCode ? `Conectado ao cofre: "${syncCode}"` : 'Sincronização Desativada (Apenas Local)'}
                </h4>
                <p className="text-[11px] text-recime-muted">
                  {syncCode 
                    ? lastSyncedTime ? `Última sincronização: ${lastSyncedTime}` : 'Sincronizando alterações automaticamente...'
                    : 'Defina uma chave ou escaneie o QR Code para conectar seus aparelhos.'}
                </p>
              </div>
            </div>

            {syncCode && (
              <button
                onClick={syncNow}
                disabled={syncStatus === 'syncing'}
                className="p-2 rounded-xl bg-white shadow-xs hover:bg-gray-50 text-recime-navy transition-all active:scale-95 shrink-0"
                title="Forçar sincronização agora"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin text-recime-mango' : ''}`} />
              </button>
            )}
          </div>

          {/* Sync Key input & Pairing Form */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-recime-navy">
              Sua Chave de Sincronização / Nome da Conta:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="ex: joka-receitas ou familia-silva"
                className="flex-1 p-3 rounded-xl bg-recime-parchment text-sm font-bold border border-recime-parchment-border focus:ring-2 focus:ring-recime-mango focus:outline-none tracking-wide"
              />
              <button
                onClick={() => handleSaveCode(inputCode)}
                disabled={isSaving || !inputCode.trim()}
                className="px-5 py-3 rounded-xl bg-recime-mango hover:bg-recime-mango-hover text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Conectar'}
              </button>
            </div>

            <p className="text-[11px] text-recime-muted">
              💡 <strong>Como funciona:</strong> Digite a <strong>mesma palavra ou chave</strong> no seu computador e no seu iPhone. Automaticamente todas as suas receitas, cardápios e compras serão sincronizados entre eles em tempo real.
            </p>
          </div>

          {/* QR Code Quick Connect for iPhone */}
          {syncCode && (
            <div className="pt-2 border-t border-recime-parchment-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-recime-navy flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-recime-mango" />
                  Conectar iPhone instantaneamente:
                </span>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="text-xs text-recime-mango font-bold hover:underline flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Ocultar QR Code' : 'Mostrar QR Code'}</span>
                </button>
              </div>

              {showQr && (
                <div className="p-4 rounded-2xl bg-recime-parchment border border-recime-parchment-border flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code de Pareamento"
                    className="w-44 h-44 rounded-xl border-4 border-white shadow-md"
                  />
                  <p className="text-[11px] text-recime-charcoal text-center max-w-xs font-medium">
                    Aponte a câmera do seu <strong>iPhone</strong> para este QR Code. O aplicativo abrirá já configurado e sincronizado com este computador!
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2.5 rounded-xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-navy text-xs font-bold border border-recime-parchment-border transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-recime-sage" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Chave Copiada!' : 'Copiar Chave'}</span>
                </button>

                <button
                  onClick={handleGenerateNew}
                  className="py-2.5 px-3 rounded-xl bg-recime-parchment hover:bg-recime-parchment-subtle text-recime-muted hover:text-recime-navy text-xs font-bold border border-recime-parchment-border transition-colors"
                  title="Gerar nova chave aleatória"
                >
                  Gerar Nova Chave
                </button>
              </div>
            </div>
          )}

          {/* Security & Privacy details */}
          <div className="p-3.5 rounded-2xl bg-recime-parchment-subtle border border-recime-parchment-border flex items-start gap-2.5 text-xs text-recime-muted">
            <ShieldCheck className="w-4 h-4 text-recime-sage shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Privacidade & Criptografia:</strong> Seus dados são salvos com isolamento exclusivo para a sua chave. Ninguém tem acesso às suas receitas sem saber a chave exata que você definiu.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
