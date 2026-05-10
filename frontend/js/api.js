'use strict';

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

/** URL base de la API. Dejar vacío para usar rutas relativas. */
const API = '';


/* ============================================================
   CLIENTE HTTP
   ============================================================ */

/**
 * Realiza una petición autenticada a la API.
 * - Adjunta el token JWT si existe en localStorage o sessionStorage.
 * - Serializa el body a JSON automáticamente (salvo FormData).
 * - Lanza un Error con el mensaje del servidor si la respuesta no es ok.
 *
 * @param {string} url       - Ruta relativa, p. ej. '/api/movies'
 * @param {object} options   - Opciones de fetch (method, body, headers…)
 * @returns {Promise<any>}   - Datos JSON de la respuesta
 */
async function api(url, options = {}) {
  const token   = localStorage.getItem('rsa_token') || sessionStorage.getItem('rsa_token');
  const headers = { ...(options.headers || {}) };

  // Adjuntar token de autorización si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Serializar body a JSON si no es un FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(API + url, { ...options, headers });

    // Sesión expirada o token inválido: limpiar sesión
    if (res.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      return null;
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error del servidor');
    }

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Error de conexión');
    }
    throw err;
  }
}


/* ============================================================
   AUTENTICACIÓN Y SESIÓN
   ============================================================ */

/** Devuelve true si hay un token activo en localStorage o sessionStorage. */
function isLoggedIn() {
  return !!(localStorage.getItem('rsa_token') || sessionStorage.getItem('rsa_token'));
}

/** Devuelve el objeto de usuario guardado en sesión, o null si no hay sesión. */
function getUser() {
  const raw = localStorage.getItem('rsa_user') || sessionStorage.getItem('rsa_user');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Guarda el token y los datos del usuario tras un login o registro exitoso.
 *
 * @param {object}  data      - Respuesta de la API con { token, user }
 * @param {boolean} remember  - Si true, persiste en localStorage; si no, en sessionStorage
 */
function saveAuth(data, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('rsa_token', data.token);
  storage.setItem('rsa_user', JSON.stringify(data.user));
}

/** Cierra la sesión limpiando el almacenamiento y redirigiendo al login. */
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/login.html';
}