'use strict';

/* ============================================================
   UTILIDADES DE UI
   ============================================================ */

/** Muestra una notificación tipo toast durante `duration` milisegundos. */
function showToast(msg, duration) {
  duration = duration || 3000;
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/** Valida que un string tenga formato de correo electrónico. */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Marca un campo como inválido y muestra el mensaje de error. */
function showFieldError(input, errorEl, message) {
  input.classList.add('error');
  errorEl.textContent = message;
}

/** Limpia el estado de error de un campo. */
function clearFieldError(input, errorEl) {
  input.classList.remove('error');
  errorEl.textContent = '';
}

/** Agrega la animación de shake a un botón al haber errores de validación. */
function shakeButton(btn) {
  btn.classList.add('shake');
  btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
}


/* ============================================================
   PARTÍCULAS DE FONDO
   ============================================================ */

/** Genera partículas flotantes decorativas en el contenedor #particles. */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 18; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    const size = Math.random() * 4 + 2;
    particle.style.width  = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left   = (Math.random() * 100) + '%';
    particle.style.bottom = '-' + size + 'px';
    particle.style.setProperty('--dur',   (Math.random() * 15 + 10) + 's');
    particle.style.setProperty('--delay', (Math.random() * 15) + 's');
    particle.style.setProperty('--op',    (Math.random() * 0.25 + 0.05).toFixed(2));

    container.appendChild(particle);
  }
}


/* ============================================================
   TOGGLE DE CONTRASEÑA
   ============================================================ */

/** Alterna la visibilidad del campo de contraseña y actualiza el ícono. */
function initPasswordToggle() {
  const toggleBtn  = document.getElementById('togglePw');
  const passwordEl = document.getElementById('password');
  const eyeIcon    = document.getElementById('eyeIcon');
  if (!toggleBtn || !passwordEl || !eyeIcon) return;

  const EYE_OPEN = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  `;
  const EYE_CLOSED = `
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  `;

  let visible = false;

  toggleBtn.addEventListener('click', () => {
    visible          = !visible;
    passwordEl.type  = visible ? 'text' : 'password';
    eyeIcon.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
  });
}


/* ============================================================
   FORMULARIO DE LOGIN
   ============================================================ */

/** Inicializa el formulario de inicio de sesión con validación y envío. */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const btnLogin = document.getElementById('btnLogin');
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const emailErr = document.getElementById('emailError');
  const passErr  = document.getElementById('passError');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email    = emailEl.value.trim();
    const password = passEl.value;
    let hasError   = false;

    clearFieldError(emailEl, emailErr);
    clearFieldError(passEl, passErr);

    // Validaciones
    if (!email) {
      showFieldError(emailEl, emailErr, 'El correo es requerido.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError(emailEl, emailErr, 'Ingresa un correo valido.');
      hasError = true;
    }

    if (!password) {
      showFieldError(passEl, passErr, 'La contrasena es requerida.');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError(passEl, passErr, 'Minimo 6 caracteres.');
      hasError = true;
    }

    if (hasError) {
      shakeButton(btnLogin);
      return;
    }

    // Envío a la API
    btnLogin.classList.add('loading');
    btnLogin.disabled = true;

    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body:   { email, password },
      });

      if (result) {
        const remember = document.getElementById('remember');
        saveAuth(result, remember && remember.checked);
        showToast('🎬 ¡Bienvenido al Reino!', 3000);
        setTimeout(() => window.location.href = '/', 1000);
      }
    } catch (err) {
      showToast('⚠️ ' + err.message, 4000);
    } finally {
      btnLogin.classList.remove('loading');
      btnLogin.disabled = false;
    }
  });
}


/* ============================================================
   FORMULARIO DE REGISTRO
   ============================================================ */

/** Inicializa el formulario de registro con validación y envío. */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const btnRegister = document.getElementById('btnRegister');
  const nameEl      = document.getElementById('name');
  const emailEl     = document.getElementById('email');
  const passEl      = document.getElementById('password');
  const nameErr     = document.getElementById('nameError');
  const emailErr    = document.getElementById('emailError');
  const passErr     = document.getElementById('passError');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name     = nameEl.value.trim();
    const email    = emailEl.value.trim();
    const password = passEl.value;
    let hasError   = false;

    clearFieldError(nameEl,  nameErr);
    clearFieldError(emailEl, emailErr);
    clearFieldError(passEl,  passErr);

    // Validaciones
    if (!name) {
      showFieldError(nameEl, nameErr, 'El nombre es requerido.');
      hasError = true;
    }

    if (!email) {
      showFieldError(emailEl, emailErr, 'El correo es requerido.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError(emailEl, emailErr, 'Ingresa un correo valido.');
      hasError = true;
    }

    if (!password) {
      showFieldError(passEl, passErr, 'La contrasena es requerida.');
      hasError = true;
    } else if (password.length < 6) {
      showFieldError(passEl, passErr, 'Minimo 6 caracteres.');
      hasError = true;
    }

    if (hasError) {
      shakeButton(btnRegister);
      return;
    }

    // Envío a la API
    btnRegister.classList.add('loading');
    btnRegister.disabled = true;

    try {
      const result = await api('/api/auth/register', {
        method: 'POST',
        body:   { name, email, password },
      });

      if (result) {
        saveAuth(result, false);
        showToast('🎬 ¡Cuenta creada! Bienvenido al Reino!', 3000);
        setTimeout(() => window.location.href = '/', 1000);
      }
    } catch (err) {
      showToast('⚠️ ' + err.message, 4000);
    } finally {
      btnRegister.classList.remove('loading');
      btnRegister.disabled = false;
    }
  });
}


/* ============================================================
   VALIDACIÓN EN TIEMPO REAL
   ============================================================ */

/**
 * Limpia errores mientras el usuario corrige un campo,
 * y los muestra al salir (blur) si el valor sigue siendo inválido.
 */
function initRealtimeValidation() {
  const emailEl  = document.getElementById('email');
  const passEl   = document.getElementById('password');
  const emailErr = document.getElementById('emailError');
  const passErr  = document.getElementById('passError');
  if (!emailEl || !passEl) return;

  // Limpiar error al corregir
  emailEl.addEventListener('input', () => {
    if (emailEl.classList.contains('error') && isValidEmail(emailEl.value)) {
      clearFieldError(emailEl, emailErr);
    }
  });
  passEl.addEventListener('input', () => {
    if (passEl.classList.contains('error') && passEl.value.length >= 6) {
      clearFieldError(passEl, passErr);
    }
  });

  // Mostrar error al salir del campo
  emailEl.addEventListener('blur', () => {
    const val = emailEl.value.trim();
    if (val && !isValidEmail(val)) {
      showFieldError(emailEl, emailErr, 'Ingresa un correo valido.');
    }
  });
  passEl.addEventListener('blur', () => {
    if (passEl.value && passEl.value.length < 6) {
      showFieldError(passEl, passErr, 'Minimo 6 caracteres.');
    }
  });
}


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initPasswordToggle();
  initLoginForm();
  initRegisterForm();
  initRealtimeValidation();
});