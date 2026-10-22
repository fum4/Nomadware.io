import { describe, expect, it } from 'vitest';

import { emailMessage, escapeHtml } from './email-message';

describe('emailMessage', () => {
  const message = emailMessage({
    name: 'Ada <script>',
    email: 'ada@example.com',
    brief: 'Build "this" & <b>that</b>\nnext line',
  });

  it('subjects with the name', () => expect(message.subject).toBe('New project — Ada <script>'));

  it('keeps plain text as typed', () =>
    expect(message.text).toBe(
      'Build "this" & <b>that</b>\nnext line\n\n— Ada <script> <ada@example.com>',
    ));

  it('escapes every value in the HTML', () => {
    expect(message.html).not.toContain('<b>');
    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('Build &quot;this&quot; &amp; &lt;b&gt;that&lt;/b&gt;');
    expect(message.html).toContain('&lt;ada@example.com&gt;');
  });
});

describe('escapeHtml', () => {
  it('escapes the five HTML metacharacters', () =>
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;'));
});
