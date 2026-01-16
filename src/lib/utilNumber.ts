// 大きな数値を「兆」「億」「万」で丸めるヘルパー
export const fmtLarge = (
  val: number | null | undefined,
  unit: string = "",
  isMillionYen: boolean = false,
) => {
  if (val === null || val === undefined) return "---";

  let num = val;
  let suffix = unit;

  // 時価総額（百万円単位）の場合の特別処理
  if (isMillionYen) {
    num = val * 1000000;
    suffix = "円";
  }

  const abs = Math.abs(num);

  if (abs >= 1000000000000) {
    return (
      (num / 1000000000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }) +
      "兆" +
      suffix
    );
  }
  if (abs >= 100000000) {
    return (
      (num / 100000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }) +
      "億" +
      suffix
    );
  }
  if (abs >= 10000) {
    return (
      (num / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
      "万" +
      suffix
    );
  }

  if (isMillionYen) {
    return val.toLocaleString() + "百万円";
  }

  return num.toLocaleString() + suffix;
};
