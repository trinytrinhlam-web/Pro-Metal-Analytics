"use client";
import { dongWav, haTanSo } from "@/lib/wav";

/** Thợ quên bấm dừng thì tự dừng — một khách đọc chừng 15–30 giây là đủ. */
export const GIAY_TOI_DA = 60;

export type PhienGhi = { dung: () => Blob; huy: () => void };

/**
 * Thu tiếng bằng Web Audio rồi tự đóng thành WAV (xem lib/wav.ts vì sao không
 * dùng MediaRecorder). Phải gọi ngay trong lúc thợ bấm nút: Safari chỉ cho
 * chạy tiếng khi được tạo từ một cú bấm.
 */
export async function batDauGhi(): Promise<PhienGhi> {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  let s: MediaStream;
  try {
    s = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (e) {
    ctx.close().catch(() => {});
    throw e;
  }
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  const nguon = ctx.createMediaStreamSource(s);
  const xuLy = ctx.createScriptProcessor(4096, 1, 1);
  const manh: Float32Array[] = [];
  xuLy.onaudioprocess = (e) => manh.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  nguon.connect(xuLy);
  // Chrome chỉ chạy onaudioprocess khi khối xử lý có nối ra loa. Đầu ra để
  // trống nên loa không phát ra tiếng gì.
  xuLy.connect(ctx.destination);

  const tat = () => {
    xuLy.onaudioprocess = null;
    try { nguon.disconnect(); xuLy.disconnect(); } catch { /* đã ngắt rồi */ }
    s.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };

  return {
    dung() {
      const tanSo = ctx.sampleRate;
      tat();
      const gop = new Float32Array(manh.reduce((n, m) => n + m.length, 0));
      let o = 0;
      for (const m of manh) { gop.set(m, o); o += m.length; }
      return new Blob([dongWav(haTanSo(gop, tanSo))], { type: "audio/wav" });
    },
    huy: tat,
  };
}
