/**
 * Cloudflare Worker para autenticación OAuth de Static CMS
 * Este worker actúa como intermediario para el flujo OAuth de GitHub
 */

// Configuración de GitHub OAuth
const GITHUB_CLIENT_ID = '<TU-GITHUB-CLIENT-ID>';  // Obtener de GitHub Developer Settings
const GITHUB_CLIENT_SECRET = '<TU-GITHUB-CLIENT-SECRET>';  // Obtener de GitHub Developer Settings
const REDIRECT_URI = '<TU-WORKER-URL>/auth/callback';  // URL de este worker con /auth/callback

// Configuración de Static CMS
const CMS_ORIGIN = '<TU-DOMINIO>';  // Dominio de tu sitio (ej: regazziharina.com)

addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname === '/auth') {
    event.respondWith(handleAuthRequest(event.request));
  } else if (url.pathname === '/auth/callback') {
    event.respondWith(handleAuthCallback(event.request));
  } else {
    event.respondWith(new Response('Not Found', { status: 404 }));
  }
});

async function handleAuthRequest(request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  if (provider !== 'github') {
    return new Response('Only GitHub OAuth is supported', { status: 400 });
  }

  // Generar un estado aleatorio para seguridad
  const state = crypto.randomUUID();

  // Construir URL de autorización de GitHub
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', 'repo');
  authUrl.searchParams.append('state', state);

  // Guardar el estado en cookie para verificar en el callback
  const response = Response.redirect(authUrl.toString(), 302);
  response.headers.set('Set-Cookie', `cms_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);

  return response;
}

async function handleAuthCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verificar el estado de la cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = cookieHeader ? cookieHeader.split(';').map(c => c.trim()) : [];
  const stateCookie = cookies.find(c => c.startsWith('cms_state='));

  if (!stateCookie || !stateCookie.includes(state)) {
    return new Response('Invalid state', { status: 400 });
  }

  // Intercambiar el código por un token de acceso
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`Error getting token: ${tokenData.error}`, { status: 400 });
  }

  // Obtener información del usuario
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${tokenData.access_token}`,
    },
  });

  const userData = await userResponse.json();

  // Crear el token JWT (simplificado - en producción usar una librería JWT real)
  const token = btoa(JSON.stringify({
    login: userData.login,
    name: userData.name,
    avatar_url: userData.avatar_url,
    exp: Date.now() + 3600000, // 1 hora
  }));

  // Redirigir al CMS con el token
  const redirectUrl = new URL(CMS_ORIGIN);
  redirectUrl.hash = `#/access_token=${token}`;

  const response = Response.redirect(redirectUrl.toString(), 302);
  response.headers.set('Set-Cookie', `cms_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);

  return response;
}
