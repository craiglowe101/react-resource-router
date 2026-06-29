import { isSafeUrl } from './index';

describe('isSafeUrl', () => {
  it('allows http: URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com/path?query=1')).toBe(true);
  });

  it('allows https: URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('https://example.com/path?query=1#hash')).toBe(true);
  });

  it('allows relative paths', () => {
    expect(isSafeUrl('/foo/bar')).toBe(true);
    expect(isSafeUrl('/foo?q=1')).toBe(true);
    expect(isSafeUrl('/')).toBe(true);
  });

  it('blocks javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('javascript://alert(1)')).toBe(false);
    expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  it('blocks data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
  });

  it('blocks vbscript: URLs', () => {
    expect(isSafeUrl('vbscript:MsgBox("XSS")')).toBe(false);
  });

  it('blocks file: URLs', () => {
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
  });

  it('blocks ftp: URLs', () => {
    expect(isSafeUrl('ftp://example.com/file')).toBe(false);
  });

  it('allows empty string (resolves to current page)', () => {
    expect(isSafeUrl('')).toBe(true);
  });
});
