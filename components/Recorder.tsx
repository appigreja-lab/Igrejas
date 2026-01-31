
import React, { useState, useRef, useEffect } from 'react';

interface RecorderProps {
  type: 'audio' | 'video';
  onSave: (recording: { id: string, type: 'audio' | 'video', data: string, title: string, description: string, timestamp: number }) => void;
}

const Recorder: React.FC<RecorderProps> = ({ type, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [recordingData, setRecordingData] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const constraints = type === 'video' ? { 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      } : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: type === 'video' ? 'video/mp4' : 'audio/webm' });
        setMediaBlobUrl(URL.createObjectURL(blob));
        const base64 = await blobToBase64(blob);
        setRecordingData(base64);
        setTitle(`Live ${type === 'video' ? 'Vídeo' : 'Áudio'} - ${new Date().toLocaleDateString()}`);
        setDescription('');
      };

      mediaRecorder.start(1000); 
      setIsRecording(true);
      setMediaBlobUrl(null);
      setRecordingData(null);
    } catch (err) {
      console.error("Erro ao acessar mídia:", err);
      alert("Certifique-se de dar permissão de câmera e microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const handleFinalSave = () => {
    if (!recordingData) return;
    const timestamp = Date.now();
    const id = `fu_rec_${type}_${timestamp}`;
    
    const recordingMetadata = {
      id,
      type,
      data: recordingData,
      timestamp,
      title: title || `Gravação ${timestamp}`,
      description: description
    };

    localStorage.setItem(id, JSON.stringify(recordingMetadata));
    onSave(recordingMetadata);
    setMediaBlobUrl(null);
    setRecordingData(null);
  };

  return (
    <div className={`p-4 border rounded-3xl bg-white shadow-xl flex flex-col items-center w-full transition-all ${isRecording ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100'}`}>
      <div className="flex justify-between w-full items-center mb-4">
        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter">
          {isRecording ? (
            <span className="flex items-center gap-2 text-red-600 animate-pulse">
              <span className="w-3 h-3 bg-red-600 rounded-full"></span> AO VIVO
            </span>
          ) : (
            `Gravar ${type === 'video' ? 'Vídeo' : 'Áudio'}`
          )}
        </h3>
        {isRecording && (
          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">
            {formatTime(duration)}
          </span>
        )}
      </div>
      
      {type === 'video' && !mediaBlobUrl && (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden mb-4 shadow-inner">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className={`w-full h-full object-cover transition-opacity ${isRecording ? 'opacity-100' : 'opacity-40'}`}
          />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 flex-col gap-2">
              <span className="text-4xl">📹</span>
              <p className="text-xs font-bold uppercase tracking-widest">Câmera Pronta</p>
            </div>
          )}
        </div>
      )}

      {mediaBlobUrl && !isRecording && (
        <div className="mb-4 w-full flex flex-col items-center animate-fade-in bg-blue-50/50 p-4 rounded-3xl border border-blue-100">
          <p className="text-[10px] text-blue-500 mb-3 uppercase font-black tracking-widest">Revisar Gravação:</p>
          {type === 'video' ? (
            <video src={mediaBlobUrl} controls className="w-full rounded-xl shadow-md border-2 border-white mb-4" />
          ) : (
            <audio src={mediaBlobUrl} controls className="w-full mb-4" />
          )}
          
          <div className="w-full space-y-3">
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Título da gravação"
              className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
            />
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Adicione uma breve descrição ou versículo..."
              className="w-full p-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none h-20"
            />
            <div className="flex gap-2">
              <button onClick={() => { setMediaBlobUrl(null); setRecordingData(null); }} className="flex-1 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase">Descartar</button>
              <button onClick={handleFinalSave} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200">Salvar na Biblioteca</button>
            </div>
          </div>
        </div>
      )}

      {!mediaBlobUrl && (
        <div className="flex gap-3 w-full">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
            >
              Iniciar Gravação
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
            >
              Finalizar
            </button>
          )}
        </div>
      )}
      
      {!mediaBlobUrl && (
        <p className="mt-3 text-[10px] text-gray-400 font-medium text-center leading-tight">
          {isRecording 
            ? "Gravando em tempo real. Você poderá adicionar título e descrição ao finalizar." 
            : "Suas gravações ficam salvas na sua biblioteca pessoal."}
        </p>
      )}
    </div>
  );
};

export default Recorder;
