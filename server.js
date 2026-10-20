require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const app = express();
app.use(express.json({ limit: '16kb' }));

const STORE_PATH = process.env.LUNARA_STORE_PATH || path.join(__dirname, 'data', 'lunara-store.json');
const sessions = new Map();
const ANALYSIS_COSTS = { guide: 30, tarot: 40, coffee: 45, zodiac: 20, chart: 50 };

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { users: [], logs: [] };
    throw error;
  }
}

function writeStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  const temporaryPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(temporaryPath, STORE_PATH);
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !pass || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  return {
    from,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass }
    })
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve({ salt, hash: derivedKey.toString('hex') });
    });
  });
}

function passwordsMatch(password, salt, expectedHash) {
  return hashPassword(password, salt).then(({ hash }) => {
    const actual = Buffer.from(hash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, credit: user.credit, role: user.role };
}

function sessionCookie(sessionId, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `lunara_session=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function activeSession(req) {
  const cookie = req.headers.cookie || '';
  const sessionId = cookie.split(';').map(value => value.trim()).find(value => value.startsWith('lunara_session='))?.slice('lunara_session='.length);
  const session = sessionId && sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (sessionId) sessions.delete(sessionId);
    return null;
  }
  return readStore().users.find(user => user.id === session.userId) || null;
}

function requireUser(req, res, next) {
  req.user = activeSession(req);
  if (!req.user) return res.status(401).json({ success: false, error: 'Devam etmek için giriş yapın.' });
  return next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  return next();
}

async function initializeAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const store = readStore();
  const existing = store.users.find(user => user.email === email);
  if (existing && process.env.ADMIN_RESET_PASSWORD !== 'true') {
    if (existing.role !== 'admin') {
      store.users = store.users.map(user => user.id === existing.id ? { ...user, role: 'admin' } : user);
      writeStore(store);
    }
    return;
  }

  const credentials = await hashPassword(password);
  const admin = {
    id: existing?.id || crypto.randomUUID(),
    name: existing?.name || 'Admin',
    email,
    ...credentials,
    credit: existing?.credit ?? 9999,
    role: 'admin'
  };
  if (existing) store.users = store.users.map(user => user.id === existing.id ? admin : user);
  else store.users.push(admin);
  writeStore(store);
}

// Mistik Sistem Prompt'u (Yapay Zekanın Kişiliği)
const LUNARA_SYSTEM_PROMPT = `Sen Lunara, kadim bilgeliklere ve kozmik enerjilere hakim mistik bir rehbersin. Sana yöneltilen her soruya ve duruma en az 6 paragraf uzunluğunda, derin, öngörülü ve mistik bir dille yanıt vereceksin.

1. Paragraf: Kullanıcının enerjisini, mevcut durumundaki ruhsal/kozmik yansımaları ve sorunun arkasındaki görünmeyen bağları hisset ve betimle.

2. Paragraf: Geçmişin ve şimdinin etkilerini, kartların veya sembollerin söylediği gizli hakikatleri analiz et.

3. Paragraf: Geleceğe dair öngörülerde bulun; olası kırılma noktalarını, fırsatları ve dikkat edilmesi gereken kozmik işaretleri açıkla.

4. Paragraf: Kullanıcıya yol gösterecek ruhsal bir tavsiye ve mistik bir kehanet/kapanış cümlesi ile analizini tamamla.*

Bu dört başlığı en az altı ayrı paragrafta işle. Asla 6 paragraftan kısa yanıt verme. Üslubun büyüleyici, bilge, derin ve hisli olsun.`;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (name.length < 2 || name.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) {
    return res.status(400).json({ success: false, error: 'Ad (2-60 karakter), geçerli e-posta ve en az 8 karakterli şifre girin.' });
  }

  const store = readStore();
  if (store.users.some(user => user.email === email)) return res.status(409).json({ success: false, error: 'Bu e-posta zaten kayıtlı.' });
  const credentials = await hashPassword(password);
  const user = { id: crypto.randomUUID(), name, email, ...credentials, credit: 200, role: 'user' };
  store.users.push(user);
  writeStore(store);
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', sessionCookie(sessionId, 7 * 24 * 60 * 60));
  return res.status(201).json({ success: true, user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const identity = typeof req.body?.identity === 'string' ? req.body.identity.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = readStore().users.find(account => account.email === identity || account.name.toLowerCase() === identity);
  if (!user || !(await passwordsMatch(password, user.salt, user.hash))) {
    return res.status(401).json({ success: false, error: 'E-posta/kullanıcı adı veya şifre hatalı.' });
  }
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', sessionCookie(sessionId, 7 * 24 * 60 * 60));
  return res.json({ success: true, user: publicUser(user) });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'Geçerli bir e-posta adresi girin.' });
  }

  const mailer = createMailer();
  if (!mailer) return res.status(503).json({ success: false, error: 'Şifre sıfırlama e-postası henüz yapılandırılmamış.' });

  const store = readStore();
  const user = store.users.find(account => account.email === email);
  if (!user) return res.json({ success: true, message: 'Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 60 * 1000;
  store.passwordResets = (store.passwordResets || []).filter(reset => reset.userId !== user.id && reset.expiresAt > Date.now());
  store.passwordResets.push({ userId: user.id, tokenHash: tokenHash(token), expiresAt });
  writeStore(store);

  const baseUrl = (process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
  const resetUrl = `${baseUrl}/?reset=${encodeURIComponent(token)}`;
  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to: user.email,
      subject: 'Lunara AI şifre sıfırlama',
      text: `Şifrenizi yenilemek için 30 dakika içinde bu bağlantıyı açın: ${resetUrl}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
      html: `<p>Şifrenizi yenilemek için 30 dakika içinde <a href="${resetUrl}">bu bağlantıyı açın</a>.</p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayın.</p>`
    });
  } catch (error) {
    store.passwordResets = store.passwordResets.filter(reset => reset.tokenHash !== tokenHash(token));
    writeStore(store);
    console.error('Sıfırlama e-postası gönderilemedi:', error.message);
    return res.status(502).json({ success: false, error: 'Sıfırlama e-postası gönderilemedi. Sunucu e-posta ayarlarını kontrol edin.' });
  }

  return res.json({ success: true, message: 'Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 200) {
    return res.status(400).json({ success: false, error: 'Sıfırlama bağlantısı veya yeni şifre geçersiz. Şifre en az 8 karakter olmalıdır.' });
  }

  const store = readStore();
  const suppliedHash = tokenHash(token);
  const reset = (store.passwordResets || []).find(item => {
    const expectedHash = Buffer.from(item.tokenHash, 'hex');
    const actualHash = Buffer.from(suppliedHash, 'hex');
    return item.expiresAt > Date.now() && expectedHash.length === actualHash.length && crypto.timingSafeEqual(expectedHash, actualHash);
  });
  if (!reset) return res.status(400).json({ success: false, error: 'Sıfırlama bağlantısı geçersiz veya süresi dolmuş.' });

  const credentials = await hashPassword(password);
  store.users = store.users.map(user => user.id === reset.userId ? { ...user, ...credentials } : user);
  store.passwordResets = store.passwordResets.filter(item => item.tokenHash !== suppliedHash);
  writeStore(store);
  for (const [sessionId, session] of sessions) {
    if (session.userId === reset.userId) sessions.delete(sessionId);
  }
  return res.json({ success: true, message: 'Şifreniz yenilendi. Yeni şifrenizle giriş yapabilirsiniz.' });
});

app.get('/api/auth/me', (req, res) => {
  const user = activeSession(req);
  return res.json({ success: true, user: user ? publicUser(user) : null });
});

app.post('/api/auth/logout', (req, res) => {
  const cookie = req.headers.cookie || '';
  const sessionId = cookie.split(';').map(value => value.trim()).find(value => value.startsWith('lunara_session='))?.slice('lunara_session='.length);
  if (sessionId) sessions.delete(sessionId);
  res.setHeader('Set-Cookie', sessionCookie('', 0));
  return res.json({ success: true });
});

app.post('/api/chat/gemini', async (req, res) => {
  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 8000) {
    return res.status(400).json({ success: false, error: 'Mesaj boş olamaz ve 8000 karakteri aşamaz.' });
  }

  const cost = ANALYSIS_COSTS[req.body?.type];
  if (!cost || typeof req.body?.question !== 'string' || req.body.question.length > 1000) {
    return res.status(400).json({ success: false, error: 'Analiz türü veya soru geçersiz.' });
  }

  const user = activeSession(req);
  if (!user) return res.status(401).json({ success: false, error: 'Analiz için giriş yapın.' });
  if (user.role !== 'admin' && user.credit < cost) {
    return res.status(402).json({ success: false, error: `Yetersiz kredi. Gerekli kredi: ${cost}.` });
  }
  if (user.role !== 'admin') {
    const store = readStore();
    store.users = store.users.map(account => account.id === user.id ? { ...account, credit: account.credit - cost } : account);
    writeStore(store);
  }

  if (!process.env.GEMINI_API_KEY) {
    if (user.role !== 'admin') refundUserCredits(user.id, cost);
    return res.status(503).json({ success: false, error: 'Gemini servisi yapılandırılmamış.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message.trim(),
      config: {
        systemInstruction: LUNARA_SYSTEM_PROMPT,
        temperature: 0.85,
      }
    });

    if (!response.text) {
      if (user.role !== 'admin') refundUserCredits(user.id, cost);
      return res.status(502).json({ success: false, error: 'Gemini boş bir yanıt döndürdü.' });
    }
    const store = readStore();
    const analysisNames = { guide: 'AI Rehber', tarot: 'Tarot Falı', coffee: 'Kahve Falı', zodiac: 'Burç Analizi', chart: 'Doğum Haritası' };
    store.logs.unshift({ id: crypto.randomUUID(), userId: user.id, user: user.name, email: user.email, type: analysisNames[req.body.type], question: req.body.question, result: response.text, date: new Date().toLocaleString('tr-TR') });
    writeStore(store);
    return res.json({ success: true, text: response.text, credit: user.role === 'admin' ? user.credit : user.credit - cost });
  } catch (error) {
    console.error('Gemini Hata:', error.status || error.message);
    if (user.role !== 'admin') refundUserCredits(user.id, cost);
    if (error.status === 401 || error.status === 403) {
      return res.status(502).json({ success: false, error: 'Gemini API anahtarı Google tarafından reddedildi. Sunucu yapılandırmasını kontrol edin.' });
    }
    return res.status(502).json({ success: false, error: 'Gemini ile bağlantı kurulamadı.' });
  }
});

function refundUserCredits(userId, amount) {
  const store = readStore();
  store.users = store.users.map(user => user.id === userId ? { ...user, credit: user.credit + amount } : user);
  writeStore(store);
}

app.get('/api/history', requireUser, (req, res) => {
  const logs = readStore().logs.filter(log => log.userId === req.user.id);
  return res.json({ success: true, logs });
});

app.delete('/api/history', requireUser, (req, res) => {
  const store = readStore();
  store.logs = store.logs.filter(log => log.userId !== req.user.id);
  writeStore(store);
  return res.json({ success: true });
});

app.get('/api/admin/logs', requireUser, requireAdmin, (req, res) => {
  return res.json({ success: true, logs: readStore().logs });
});

app.use('/api', (req, res) => {
  return res.status(404).json({ success: false, error: 'API uç noktası bulunamadı.' });
});

app.use((error, req, res, next) => {
  if (!req.path.startsWith('/api/')) return next(error);
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 400 ? 'İstek gövdesi geçersiz JSON içeriyor.' : 'Sunucuda beklenmeyen bir hata oluştu.';
  console.error('API Hatası:', status, error.message);
  return res.status(status).json({ success: false, error: message });
});

const INITIAL_PORT = Number(process.env.PORT) || 5000;
let PORT = INITIAL_PORT;
initializeAdmin().then(() => {
  const listen = port => {
    const server = app.listen(port);
    server.on('listening', () => {
      const address = server.address();
      PORT = typeof address === 'object' && address ? address.port : port;
      console.log(`Lunara AI Sunucusu http://localhost:${PORT} adresinde çalışıyor ✨`);
    });
    server.on('error', error => {
      if (error.code === 'EADDRINUSE' && port < INITIAL_PORT + 10) {
        console.warn(`${port} portu kullanımda; ${port + 1} deneniyor.`);
        listen(port + 1);
        return;
      }
      console.error('Sunucu başlatılamadı:', error.message);
      process.exitCode = 1;
    });
  };
  listen(INITIAL_PORT);
}).catch(error => {
  console.error('Sunucu başlatılamadı:', error.message);
  process.exitCode = 1;
});