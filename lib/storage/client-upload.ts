import { extractFirstUploadUrl } from "./client";

/** File IDs are stable for a form draft. Reuse acknowledged uploads and join concurrent retries. */
export class DraftFileUploader {
  private completed = new Map<string, string>();
  private pending = new Map<string, Promise<string>>();
  private requests = new Set<XMLHttpRequest>();
  private disposed = false;

  constructor(private createRequest = () => new XMLHttpRequest()) {}

  upload(id: string, file: File, onProgress: (progress: number) => void = () => {}): Promise<string> {
    if (this.disposed) return Promise.reject(new Error("ยกเลิกการอัปโหลดแล้ว"));
    const url = this.completed.get(id);
    if (url) return Promise.resolve(url);
    const pending = this.pending.get(id);
    if (pending) return pending;
    const operation = new Promise<string>((resolve, reject) => {
      const request = this.createRequest();
      this.requests.add(request);
      const finish = () => { this.requests.delete(request); };
      const fail = (message: string) => { finish(); reject(new Error(message)); };
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total * 100);
      };
      request.onload = () => {
        finish();
        if (request.status >= 200 && request.status < 300) {
          try {
            const result = extractFirstUploadUrl(JSON.parse(request.responseText));
            this.completed.set(id, result);
            resolve(result);
          } catch { reject(new Error("รูปแบบข้อมูลตอบกลับไม่ถูกต้อง")); }
          return;
        }
        let message = "อัปโหลดไฟล์ไม่สำเร็จ";
        try {
          const result = JSON.parse(request.responseText);
          if (typeof result.error === "string") message = result.error;
        } catch { /* Retain the readable fallback. */ }
        reject(new Error(message));
      };
      request.onerror = () => fail("เกิดปัญหาเครือข่ายระหว่างอัปโหลด");
      request.ontimeout = () => fail("อัปโหลดหมดเวลา กรุณาลองใหม่");
      request.onabort = () => fail("ยกเลิกการอัปโหลดแล้ว");
      try {
        request.open("POST", "/api/upload");
        request.withCredentials = true;
        request.timeout = 120_000;
        const body = new FormData();
        body.append("files", file);
        request.send(body);
      } catch { fail("ไม่สามารถเริ่มอัปโหลดได้ กรุณาลองใหม่"); }
    });
    this.pending.set(id, operation);
    // Clear only this operation; avoid an unhandled rejected promise from finally().
    void operation.then(() => this.pending.delete(id), () => this.pending.delete(id));
    return operation;
  }

  abortAll(): void {
    this.disposed = true;
    for (const request of this.requests) request.abort();
    this.requests.clear();
  }
}
