"use client";
import { useMemo, useState } from "react";
import { KHU_VUC, KHU_VUC_HAY, boDau } from "@/lib/danh-muc";

export default function ChonKhuVuc({
  dangChon,
  chon,
  dong,
}: {
  dangChon: string | null;
  chon: (k: string) => void;
  dong: () => void;
}) {
  const [q, setQ] = useState("");
  const loc = useMemo(() => {
    const t = boDau(q.trim());
    return t ? KHU_VUC.filter((k) => boDau(k).includes(t)) : null;
  }, [q]);

  const mot = (k: string) => (
    <button key={k} className="it" aria-pressed={dangChon === k} onClick={() => chon(k)}>
      {k}
    </button>
  );

  return (
    <div className="kvov" role="dialog" aria-label="Chọn phường xã">
      <div className="top">
        <input
          id="kv-q"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gõ tên phường, xã, hay quận cũ…"
          autoComplete="off"
        />
        <button onClick={dong}>Đóng</button>
      </div>
      <div className="ls">
        {loc ? (
          loc.length ? (
            loc.map(mot)
          ) : (
            <p className="non">
              Không có phường/xã nào khớp “{q}”.
              <br />
              TP.HCM đã bỏ cấp quận/huyện từ 01/07/2025, giờ chỉ còn phường và xã.
            </p>
          )
        ) : (
          <>
            <div className="gr">Hay làm nhất</div>
            {KHU_VUC_HAY.map(mot)}
            <div className="gr">Tất cả {KHU_VUC.length} phường / xã</div>
            {KHU_VUC.map(mot)}
          </>
        )}
      </div>
    </div>
  );
}
