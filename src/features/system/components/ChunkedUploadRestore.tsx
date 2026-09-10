import React, { useState, useCallback, useRef } from 'react';
import {
  AlertTriangle, UploadCloud, CheckCircle2, XCircle,
  RefreshCw, FileArchive, Loader2, ChevronRight
} from 'lucide-react';
import { systemService } from '../../../api/systemService';
import { toast } from '../../../shared/utils/toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

// ---- Hằng số ----
const CHUNK_SIZE = 5 * 1024 * 1024;        // 5MB mỗi chunk
const MAX_CONCURRENT_CHUNKS = 3;            // Upload song song tối đa 3 chunk
const MAX_RETRY_PER_CHUNK = 3;             // Retry tối đa mỗi chunk khi lỗi

type Phase =
  | 'idle'          // Chưa làm gì
  | 'hashing'       // Đang đọc file (chỉ lấy metadata ở đây)
  | 'uploading'     // Đang upload chunks
  | 'finalizing'    // Đang ghép file / restore trên Server
  | 'done'          // Xong
  | 'error';        // Lỗi

interface UploadState {
  phase: Phase;
  uploadedChunks: number;
  totalChunks: number;
  speed: string;        // Ví dụ "12.4 MB/s"
  eta: string;          // Ví dụ "00:42"
  errorMsg?: string;
}

interface ChunkedUploadRestoreProps {
  onSuccess?: () => void;
}

// ==================== UTILITY ====================

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

function formatEta(remainingBytes: number, bytesPerSec: number): string {
  if (bytesPerSec <= 0) return '--:--';
  const secs = Math.ceil(remainingBytes / bytesPerSec);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ==================== COMPONENT ====================

const ChunkedUploadRestore: React.FC<ChunkedUploadRestoreProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [restoreAfterUpload, setRestoreAfterUpload] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<UploadState>({
    phase: 'idle', uploadedChunks: 0, totalChunks: 0, speed: '', eta: ''
  });

  const abortRef = useRef(false);
  const speedSampleRef = useRef<{ time: number; bytes: number }[]>([]);

  // ---- Chọn file ----
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setState({ phase: 'idle', uploadedChunks: 0, totalChunks: 0, speed: '', eta: '' });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setState({ phase: 'idle', uploadedChunks: 0, totalChunks: 0, speed: '', eta: '' }); }
  }, []);

  // ---- Tính speed & ETA ----
  const updateSpeed = useCallback((bytesUploaded: number, totalBytes: number) => {
    const now = Date.now();
    speedSampleRef.current.push({ time: now, bytes: bytesUploaded });
    // Giữ mẫu trong 5 giây gần nhất
    const cutoff = now - 5000;
    speedSampleRef.current = speedSampleRef.current.filter(s => s.time >= cutoff);
    if (speedSampleRef.current.length >= 2) {
      const oldest = speedSampleRef.current[0];
      const deltaBytes = bytesUploaded - oldest.bytes;
      const deltaMs = now - oldest.time;
      const bps = deltaMs > 0 ? (deltaBytes / deltaMs) * 1000 : 0;
      const remaining = totalBytes - bytesUploaded;
      setState(prev => ({ ...prev, speed: formatSpeed(bps), eta: formatEta(remaining, bps) }));
    }
  }, []);

  // ---- Retry 1 chunk với backoff ----
  const uploadChunkWithRetry = useCallback(async (
    uploadId: string, index: number, chunk: Blob
  ) => {
    for (let attempt = 0; attempt < MAX_RETRY_PER_CHUNK; attempt++) {
      if (abortRef.current) throw new Error('Upload bị huỷ');
      try {
        await systemService.uploadChunk(uploadId, index, chunk);
        return;
      } catch (err) {
        if (attempt === MAX_RETRY_PER_CHUNK - 1) throw err;
        // Backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }, []);

  // ---- Luồng upload chính ----
  const startUpload = useCallback(async () => {
    if (!file) return;
    abortRef.current = false;
    speedSampleRef.current = [];

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    setState({ phase: 'uploading', uploadedChunks: 0, totalChunks, speed: '', eta: '' });

    try {
      // Bước 1: Init session
      const session = await systemService.initChunkUpload(file.name, file.size, totalChunks);

      // Bước 2: Upload chunks với concurrency control (tối đa 3 song song)
      let doneChunks = 0;
      let bytesUploaded = 0;

      // Pool: chia index thành từng lô MAX_CONCURRENT_CHUNKS
      for (let i = 0; i < totalChunks; i += MAX_CONCURRENT_CHUNKS) {
        if (abortRef.current) throw new Error('Upload bị huỷ bởi người dùng');

        const batch = [];
        for (let j = i; j < Math.min(i + MAX_CONCURRENT_CHUNKS, totalChunks); j++) {
          const start = j * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          batch.push(
            uploadChunkWithRetry(session.uploadId, j, chunk).then(() => {
              doneChunks++;
              bytesUploaded += end - start;
              setState(prev => ({ ...prev, uploadedChunks: doneChunks }));
              updateSpeed(bytesUploaded, file.size);
            })
          );
        }
        await Promise.all(batch);
      }

      // Bước 3: Finalize
      setState(prev => ({ ...prev, phase: 'finalizing' }));
      await systemService.finalizeChunkUpload(session.uploadId, restoreAfterUpload);

      setState(prev => ({ ...prev, phase: 'done' }));
      toast.success(restoreAfterUpload ? 'Upload & Restore thành công!' : 'Upload hoàn tất! File đã lưu trên server.');
      onSuccess?.();

    } catch (err: any) {
      if (!abortRef.current) {
        setState(prev => ({ ...prev, phase: 'error', errorMsg: err?.message ?? 'Lỗi không xác định' }));
        toast.error('Upload thất bại: ' + (err?.message ?? 'Lỗi không xác định'));
      } else {
        setState({ phase: 'idle', uploadedChunks: 0, totalChunks: 0, speed: '', eta: '' });
      }
    }
  }, [file, restoreAfterUpload, uploadChunkWithRetry, updateSpeed, onSuccess]);

  const handleAbort = () => { abortRef.current = true; };
  const handleReset = () => { setFile(null); setState({ phase: 'idle', uploadedChunks: 0, totalChunks: 0, speed: '', eta: '' }); };

  // ---- Phần trăm ----
  const pct = state.totalChunks > 0 ? Math.round((state.uploadedChunks / state.totalChunks) * 100) : 0;
  const isUploading = state.phase === 'uploading' || state.phase === 'finalizing';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-blue-500" />
        Upload & Khôi phục CSDL (hỗ trợ 5GB+)
      </h2>
      <p className="text-xs text-gray-400 mb-5">File sẽ được chia thành nhiều mảnh nhỏ (5MB) và ghép lại trên server.</p>

      {/* Warning */}
      {restoreAfterUpload && (
        <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg mb-4 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 font-medium">
            Chế độ "Restore ngay" đang bật — sau khi upload xong, toàn bộ dữ liệu hiện tại sẽ bị xóa và thay thế.
          </p>
        </div>
      )}

      {/* File drop zone */}
      {state.phase === 'idle' && (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            onClick={() => document.getElementById('chunkedFileInput')?.click()}
          >
            <input
              id="chunkedFileInput"
              type="file"
              className="hidden"
              accept=".sql,.backup,.dump,.zip"
              onChange={handleFileSelect}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileArchive className="w-10 h-10 text-blue-500" />
                <span className="font-semibold text-gray-800 text-sm">{file.name}</span>
                <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-10 h-10 text-gray-300" />
                <p className="text-sm text-gray-500 font-medium">Kéo thả file hoặc click để chọn</p>
                <p className="text-xs text-gray-400">.sql, .backup, .dump, .zip — không giới hạn dung lượng</p>
              </div>
            )}
          </div>

          {/* Options */}
          <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-orange-500"
              checked={restoreAfterUpload}
              onChange={e => setRestoreAfterUpload(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Restore DB ngay sau khi upload xong</span>
          </label>

          {/* Action button */}
          <button
            disabled={!file}
            onClick={() => restoreAfterUpload ? setConfirmOpen(true) : startUpload()}
            className="mt-4 w-full py-3 rounded-lg font-bold text-white transition-all
              bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {file ? 'Bắt đầu Upload' : 'Chọn file để bắt đầu'}
          </button>
        </>
      )}

      {/* Progress view */}
      {(isUploading || state.phase === 'error' || state.phase === 'done') && (
        <div className="space-y-4">
          {/* Status icon + label */}
          <div className="flex items-center gap-3">
            {state.phase === 'uploading' && <Loader2 className="w-6 h-6 text-blue-500 animate-spin shrink-0" />}
            {state.phase === 'finalizing' && <Loader2 className="w-6 h-6 text-purple-500 animate-spin shrink-0" />}
            {state.phase === 'done' && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
            {state.phase === 'error' && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {state.phase === 'uploading' && `Đang upload... ${pct}%`}
                {state.phase === 'finalizing' && 'Server đang ghép file...'}
                {state.phase === 'done' && 'Hoàn tất!'}
                {state.phase === 'error' && 'Thất bại'}
              </p>
              <p className="text-xs text-gray-400">
                {state.phase === 'uploading' && `${state.uploadedChunks}/${state.totalChunks} chunk · ${state.speed} · còn ${state.eta}`}
                {state.phase === 'error' && state.errorMsg}
                {state.phase === 'finalizing' && 'Vui lòng đợi, không đóng trình duyệt...'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {(state.phase === 'uploading' || state.phase === 'finalizing') && (
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300
                  ${state.phase === 'finalizing' ? 'bg-purple-400 animate-pulse w-full' : 'bg-blue-500'}`}
                style={{ width: state.phase === 'uploading' ? `${pct}%` : '100%' }}
              />
            </div>
          )}

          {/* Chunk breakdown */}
          {state.phase === 'uploading' && (
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(state.totalChunks, 60) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-sm transition-colors ${i < state.uploadedChunks ? 'bg-blue-400' : 'bg-gray-200'}`}
                  title={`Chunk ${i + 1}`}
                />
              ))}
              {state.totalChunks > 60 && <span className="text-xs text-gray-400">+{state.totalChunks - 60} nữa</span>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isUploading && (
              <button
                onClick={handleAbort}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Huỷ
              </button>
            )}
            {(state.phase === 'done' || state.phase === 'error') && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Upload lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm modal cho Restore mode */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); startUpload(); }}
        title="CẢNH BÁO NGUY HIỂM"
        message="Upload và Restore sẽ xóa TOÀN BỘ dữ liệu hiện tại và thay thế bằng file bạn vừa chọn. Hành động này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn?"
        type="danger"
        confirmText="Vẫn tiếp tục"
      />
    </div>
  );
};

export default ChunkedUploadRestore;
