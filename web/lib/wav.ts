/**
 * Đóng gói tiếng thu từ micro thành file WAV.
 *
 * Vì sao không dùng MediaRecorder: Chrome trên Android ghi ra webm, Safari trên
 * iPhone ghi ra mp4 — cả hai đều không nằm trong danh sách định dạng tiếng mà
 * Gemini ghi trong tài liệu (WAV, MP3, AIFF, AAC, OGG, FLAC). Tự đóng WAV thì
 * máy nào gửi lên cũng y hệt nhau và chắc chắn Gemini đọc được.
 *
 * Hạ về 16 kHz một kênh: Gemini tự hạ về mức đó khi nghe, gửi cao hơn chỉ tốn
 * sóng. 16 kHz × 16 bit = 32 KB mỗi giây, 60 giây chưa tới 2 MB.
 */

export const TAN_SO_GUI = 16000;

/** Hạ tần số lấy mẫu bằng cách lấy trung bình từng cụm — đủ lọc cho giọng nói. */
export function haTanSo(vao: Float32Array, tu: number, ve = TAN_SO_GUI): Float32Array {
  if (tu === ve) return vao;
  const tiLe = tu / ve;
  const ra = new Float32Array(Math.floor(vao.length / tiLe));
  for (let i = 0; i < ra.length; i++) {
    const a = Math.floor(i * tiLe);
    const b = Math.min(vao.length, Math.floor((i + 1) * tiLe));
    let tong = 0;
    for (let j = a; j < b; j++) tong += vao[j];
    ra[i] = b > a ? tong / (b - a) : 0;
  }
  return ra;
}

/** Mẫu số thực [-1, 1] → file WAV PCM 16 bit, một kênh. */
export function dongWav(mau: Float32Array, tanSo = TAN_SO_GUI): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(44 + mau.length * 2);
  const v = new DataView(buf);
  const chu = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  chu(0, "RIFF");
  v.setUint32(4, 36 + mau.length * 2, true);
  chu(8, "WAVE");
  chu(12, "fmt ");
  v.setUint32(16, 16, true);        // cỡ khối fmt
  v.setUint16(20, 1, true);         // PCM
  v.setUint16(22, 1, true);         // một kênh
  v.setUint32(24, tanSo, true);
  v.setUint32(28, tanSo * 2, true); // byte mỗi giây
  v.setUint16(32, 2, true);         // byte mỗi mẫu
  v.setUint16(34, 16, true);        // bit mỗi mẫu
  chu(36, "data");
  v.setUint32(40, mau.length * 2, true);
  for (let i = 0; i < mau.length; i++) {
    const x = Math.max(-1, Math.min(1, mau[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

/** Đọc lại phần đầu file WAV — để máy chủ kiểm file thợ gửi lên có đúng khuôn không. */
export function docDauWav(b: Uint8Array): { tanSo: number; kenh: number; bit: number; giay: number } | null {
  if (b.length < 44) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const chu = (o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  if (chu(0) !== "RIFF" || chu(8) !== "WAVE" || chu(12) !== "fmt " || v.getUint16(20, true) !== 1) return null;
  const tanSo = v.getUint32(24, true);
  const kenh = v.getUint16(22, true);
  const bit = v.getUint16(34, true);
  if (!tanSo || !kenh || !bit) return null;
  const duLieu = Math.max(0, b.length - 44);
  return { tanSo, kenh, bit, giay: duLieu / (tanSo * kenh * (bit / 8)) };
}
