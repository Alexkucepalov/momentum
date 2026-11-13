/** Explicit local browser download; no upload or automatic repair. */
export async function saveRecoveryCopy(payload: string): Promise<void> {
  const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nf-fit-recovery-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function clearRecoveryCopies(): Promise<void> {
  /* Browser owns its downloads. */
}
