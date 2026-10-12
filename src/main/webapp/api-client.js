/* API client dùng chung cho giao diện Web-RapPhim. */
'use strict';
const API = {
  base: new URL('api/', document.baseURI).toString(),
  async request(path, options = {}) {
    let response;
    try {
      response = await fetch(this.base + String(path).replace(/^\/+/, ''), {
        credentials: 'same-origin',
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options.body ? {'Content-Type': 'application/json'} : {}),
          ...(options.headers || {})
        }
      });
    } catch (e) {
      throw new Error('Không kết nối được máy chủ. Hãy kiểm tra Tomcat và địa chỉ triển khai ứng dụng.');
    }
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch (_) {
      if (!response.ok) throw new Error(`Máy chủ trả lỗi HTTP ${response.status}.`);
      throw new Error('Máy chủ không trả về JSON hợp lệ. Kiểm tra mapping /api/* và log Tomcat.');
    }
    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body = {}) { return this.request(path, {method: 'POST', body: JSON.stringify(body)}); },
  put(path, body = {}) { return this.request(path, {method: 'PUT', body: JSON.stringify(body)}); },
  delete(path) { return this.request(path, {method: 'DELETE'}); }
};
