import React, { useState } from 'react';

import { getStonyGotchiSupabase } from './stonyGotchiSupabase';
import css from './StonyGotchiSignupForm.module.css';

const EMAIL_REDIRECT_TO = 'https://geopetshop.com/p/app-confirmada';

const StonyGotchiSignupForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();

    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Ingresá tu email.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setInProgress(true);

    try {
      const supabase = getStonyGotchiSupabase();

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: EMAIL_REDIRECT_TO,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccess(true);
    } catch (error) {
      setErrorMessage('No pudimos crear tu cuenta. Intentá nuevamente.');
    } finally {
      setInProgress(false);
    }
  };

  if (success) {
    return (
      <div className={css.success}>
        <h3>Revisá tu email</h3>
        <p>Te enviamos un enlace para confirmar tu cuenta de StonyGotchi.</p>
      </div>
    );
  }

  return (
    <div className={css.wrapper}>
      <form className={css.form} onSubmit={handleSubmit}>
        <label className={css.field}>
          Email
          <input
            className={css.input}
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className={css.field}>
          Contraseña
          <input
            className={css.input}
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        {errorMessage ? (
          <p className={css.error} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button className={css.button} type="submit" disabled={inProgress}>
          {inProgress ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
};

export default StonyGotchiSignupForm;
