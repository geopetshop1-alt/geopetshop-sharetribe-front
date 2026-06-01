import React, { useMemo, useState } from 'react';

import css from './LeadFormPage.module.css';

const WEBHOOK_URL = process.env.REACT_APP_GEOPETSHOP_FORM_WEBHOOK_URL;

const ASSET_BASE = '/static/geopetshop-form';

const CAT_FIELD_KEYS = [
  { nameKey: 'question_V0l5X6', birthKey: 'question_P6E5Lx' },
  { nameKey: 'question_xpQYE5', birthKey: 'question_N6Vovj' },
  { nameKey: 'question_EX1Qe2', birthKey: 'question_r6KARX' },
  { nameKey: 'question_Gz1GXz', birthKey: 'question_OzP2dA' },
  { nameKey: 'question_V0levl', birthKey: 'question_P6Exv0' },
  { nameKey: 'question_EX1RvL', birthKey: 'question_r6K4GL' },
  { nameKey: 'question_48k6Ao', birthKey: 'question_jyMR59' },
  { nameKey: 'question_2ekW1b', birthKey: 'question_xpQq49' },
  { nameKey: 'question_R04Nvv', birthKey: 'question_oyBPK5' },
  { nameKey: 'question_Gz1GXQ', birthKey: 'question_OzP2dk' },
];

const QUANTITY_OPTIONS = [
  { id: '3f9f5adc-965d-4279-9a77-652f4d15ac45', text: '1' },
  { id: '4cd76c3e-ad8d-45a9-991d-dc048135e669', text: '2' },
  { id: '5afdb9e3-34cc-4185-9601-747a249f2337', text: '3' },
  { id: 'a7679b9a-609c-4ace-8154-98329abb775a', text: '4' },
  { id: '404f1b90-bfff-4ece-afae-b8ce7f89b4cf', text: '5' },
  { id: 'cb9bafb9-2952-4a57-9224-78a82fce9e01', text: '6' },
  { id: 'd32d96ba-6923-40c3-91d8-bb0711035771', text: '7' },
  { id: '965f34bc-e7c1-4c39-ae11-9a74ade8aa85', text: '8' },
  { id: '8bc385ef-bb62-4fc0-8717-0311e3bcfd8c', text: '9' },
  { id: '5e09d5c6-9b84-477e-bbde-ef28e603000c', text: '10' },
];

const yesNoOptions = [
  { id: 'yes', text: 'Si' },
  { id: 'no', text: 'No' },
];

const initialPets = [{ name: '', birthDate: '' }];

const todayISO = () => new Date().toISOString().slice(0, 10);

const getQuantityOptionId = quantity => {
  const option = QUANTITY_OPTIONS.find(o => o.text === String(quantity));
  return option ? option.id : QUANTITY_OPTIONS[0].id;
};

const field = ({ key, label, type, value, options }) => ({
  key,
  label,
  type,
  value,
  ...(options ? { options } : {}),
});

const getDiploma = ({ pets, saleAfuera, convive }) => {
  const hasYoungPet = pets.some(p => {
    if (!p.birthDate) return false;

    const birthDate = new Date(`${p.birthDate}T00:00:00`);
    const now = new Date();
    const ageMs = now.getTime() - birthDate.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);

    return ageYears < 1;
  });

  if (hasYoungPet) {
    return {
      title: 'Tutor primerizo',
      file: 'diploma_primeriza.png',
    };
  }

  if (saleAfuera === 'No' && convive === 'No') {
    return {
      title: 'Tutor sobreprotector',
      file: 'diploma_sobreprotectora.png',
    };
  }

  if (convive === 'Si' || pets.length > 1) {
    return {
      title: 'Tutor social',
      file: 'diploma_jugadora.png',
    };
  }

  return {
    title: 'Tutor zen',
    file: 'diploma_zen.png',
  };
};

const buildTallyCompatiblePayload = formData => {
  const {
    fullName,
    email,
    phone,
    quantity,
    pets,
    saleAfuera,
    convive,
    diplomaTitle,
  } = formData;

  const quantityOptionId = getQuantityOptionId(quantity);
  const saleAfueraOptionId = saleAfuera === 'Si' ? 'yes' : 'no';
  const conviveOptionId = convive === 'Si' ? 'yes' : 'no';

  const fields = [
    field({
      key: 'question_48krRY',
      label: 'Nombre y apellido',
      type: 'INPUT_TEXT',
      value: fullName,
    }),
    field({
      key: 'question_ZNz0M0',
      label: 'Apellido',
      type: 'INPUT_TEXT',
      value: '',
    }),
    field({
      key: 'question_vABYaD',
      label: 'Email',
      type: 'INPUT_EMAIL',
      value: email,
    }),
    field({
      key: 'question_kyAE4e',
      label: 'Número de celular',
      type: 'INPUT_PHONE_NUMBER',
      value: phone,
    }),
    field({
      key: 'question_oyBPKM',
      label: '¿Cuantos gatos tenes?',
      type: 'DROPDOWN',
      value: [quantityOptionId],
      options: QUANTITY_OPTIONS,
    }),
  ];

  CAT_FIELD_KEYS.forEach((keys, index) => {
    const pet = pets[index] || { name: null, birthDate: null };

    fields.push(
      field({
        key: keys.nameKey,
        label: `${index + 1}- Nombre de tu gato`,
        type: 'INPUT_TEXT',
        value: pet.name || null,
      })
    );

    fields.push(
      field({
        key: keys.birthKey,
        label: 'Fecha de nacimiento',
        type: 'INPUT_DATE',
        value: pet.birthDate || null,
      })
    );
  });

  fields.push(
    field({
      key: 'question_N6JkaG',
      label: '¿El gato sale afuera?',
      type: 'DROPDOWN',
      value: [saleAfueraOptionId],
      options: yesNoOptions,
    })
  );

  fields.push(
    field({
      key: 'question_qdK692',
      label: '¿Convive o esta en contacto con otros gatos?',
      type: 'DROPDOWN',
      value: [conviveOptionId],
      options: yesNoOptions,
    })
  );

  fields.push(
    field({
      key: 'geopetshop_diploma',
      label: 'Diploma GeoPetShop',
      type: 'INPUT_TEXT',
      value: diplomaTitle,
    })
  );

  const now = new Date().toISOString();

  return {
    eventId: `geopetshop-${Date.now()}`,
    eventType: 'FORM_RESPONSE',
    createdAt: now,
    data: {
      responseId: `geo-${Date.now()}`,
      submissionId: `geo-${Date.now()}`,
      respondentId: '',
      formId: 'geopetshop-formulario',
      formName: 'Registrate para recibir el calendario de vacunación',
      createdAt: now,
      fields,
    },
  };
};

const LeadFormPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [pets, setPets] = useState(initialPets);
  const [saleAfuera, setSaleAfuera] = useState('No');
  const [convive, setConvive] = useState('No');
  const [accepted, setAccepted] = useState(false);

  const [submitState, setSubmitState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resultDiploma, setResultDiploma] = useState(null);

  const maxBirthDate = useMemo(() => todayISO(), []);

  const updateQuantity = value => {
    const nextQuantity = Number(value);
    setQuantity(nextQuantity);

    setPets(currentPets => {
      const nextPets = [...currentPets];

      while (nextPets.length < nextQuantity) {
        nextPets.push({ name: '', birthDate: '' });
      }

      return nextPets.slice(0, nextQuantity);
    });

    if (nextQuantity > 1) {
      setConvive('Si');
    }
  };

  const updatePet = (index, key, value) => {
    setPets(currentPets => {
      const nextPets = [...currentPets];
      nextPets[index] = {
        ...nextPets[index],
        [key]: value,
      };
      return nextPets;
    });
  };

  const validate = () => {
    if (!fullName.trim()) return 'Completá tu nombre y apellido.';
    if (!email.trim()) return 'Completá tu email.';
    if (!phone.trim()) return 'Completá tu WhatsApp o celular.';

    for (let i = 0; i < pets.length; i++) {
      if (!pets[i].name.trim()) return `Completá el nombre del gato ${i + 1}.`;
      if (!pets[i].birthDate) return `Completá la fecha de nacimiento del gato ${i + 1}.`;
    }

    if (!accepted) return 'Tenés que aceptar recibir comunicaciones para continuar.';

    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!WEBHOOK_URL) {
      setErrorMessage('No está configurado el webhook del formulario.');
      return;
    }

    setSubmitState('loading');
    setErrorMessage('');

    const diploma = getDiploma({ pets, saleAfuera, convive });

    const tallyPayload = buildTallyCompatiblePayload({
      fullName,
      email,
      phone,
      quantity,
      pets,
      saleAfuera,
      convive,
      diplomaTitle: diploma.title,
    });

    const payload = {
      body: tallyPayload,
      source: 'geopetshop-sharetribe-front',
      page: '/formulario',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook error ${response.status}`);
      }

      setResultDiploma(diploma);
      setSubmitState('success');
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(
        'No pudimos enviar el formulario. Probá de nuevo en unos minutos.'
      );
    }
  };

  const diplomaUrl = resultDiploma ? `${ASSET_BASE}/${resultDiploma.file}` : '';

  const downloadDiploma = () => {
    if (!diplomaUrl) return;

    const link = document.createElement('a');
    link.href = diplomaUrl;
    link.download = resultDiploma.file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareDiploma = async () => {
    if (!resultDiploma) return;

    const shareText = `Me registré en GeoPetShop y obtuve mi diploma: ${resultDiploma.title}`;

    try {
      const response = await fetch(diplomaUrl);
      const blob = await response.blob();
      const file = new File([blob], resultDiploma.file, { type: blob.type || 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi diploma GeoPetShop',
          text: shareText,
          files: [file],
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Mi diploma GeoPetShop',
          text: shareText,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
        return;
      }

      downloadDiploma();
    } catch (error) {
      downloadDiploma();
    }
  };

  return (
    <main className={css.page}>
      <section className={css.hero}>
        <div className={css.heroContent}>
          <img
            src={`${ASSET_BASE}/stonecat-logo.jpg`}
            alt="Stonecat"
            className={css.partnerLogo}
          />
          <p className={css.eyebrow}>Calendario de vacunación</p>
          <h1>Registrá a tus gatos y recibí avisos útiles</h1>
          <p className={css.heroText}>
            Te ayudamos a recordar fechas importantes, cuidados y novedades para acompañar mejor a tus mascotas.
          </p>
        </div>
        <div className={css.heroImageWrap}>
          <img
            src={`${ASSET_BASE}/portada-mvp.webp`}
            alt="Gato feliz"
            className={css.heroImage}
          />
        </div>
      </section>

      <section className={css.formSection}>
        <div className={css.formIntro}>
          <h2>Completá tus datos</h2>
          <p>
            Podés cargar más de un gato. Al finalizar vas a poder descargar o compartir tu diploma.
          </p>
        </div>

        {submitState === 'success' && resultDiploma ? (
          <div className={css.successCard}>
            <p className={css.eyebrow}>Registro completado</p>
            <h2>¡Listo! Ya estás registrado.</h2>
            <p>
              Tu resultado es: <strong>{resultDiploma.title}</strong>
            </p>
            <img
              src={diplomaUrl}
              alt={`Diploma ${resultDiploma.title}`}
              className={css.diploma}
            />
            <div className={css.actions}>
              <button type="button" className={css.primaryButton} onClick={shareDiploma}>
                Compartir diploma
              </button>
              <button type="button" className={css.secondaryButton} onClick={downloadDiploma}>
                Descargar
              </button>
            </div>
          </div>
        ) : (
          <form className={css.form} onSubmit={handleSubmit}>
            <div className={css.grid2}>
              <label className={css.field}>
                <span>Nombre y apellido</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ej. Majo Pérez"
                />
              </label>

              <label className={css.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="tu@email.com"
                />
              </label>
            </div>

            <div className={css.grid2}>
              <label className={css.field}>
                <span>WhatsApp / celular</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+54 9 11..."
                />
              </label>

              <label className={css.field}>
                <span>¿Cuántos gatos tenés?</span>
                <select value={quantity} onChange={e => updateQuantity(e.target.value)}>
                  {QUANTITY_OPTIONS.map(option => (
                    <option key={option.id} value={option.text}>
                      {option.text}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={css.petBox}>
              <h3>Datos de tus gatos</h3>
              {pets.map((pet, index) => (
                <div className={css.petRow} key={`pet-${index}`}>
                  <label className={css.field}>
                    <span>Nombre del gato {index + 1}</span>
                    <input
                      type="text"
                      value={pet.name}
                      onChange={e => updatePet(index, 'name', e.target.value)}
                      placeholder="Ej. Garfield"
                    />
                  </label>

                  <label className={css.field}>
                    <span>Fecha de nacimiento</span>
                    <input
                      type="date"
                      value={pet.birthDate}
                      max={maxBirthDate}
                      onChange={e => updatePet(index, 'birthDate', e.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className={css.grid2}>
              <label className={css.field}>
                <span>¿Alguno sale afuera?</span>
                <select value={saleAfuera} onChange={e => setSaleAfuera(e.target.value)}>
                  <option value="No">No</option>
                  <option value="Si">Si</option>
                </select>
              </label>

              <label className={css.field}>
                <span>¿Convive o está en contacto con otros gatos?</span>
                <select
                  value={convive}
                  onChange={e => setConvive(e.target.value)}
                  disabled={quantity > 1}
                >
                  <option value="No">No</option>
                  <option value="Si">Si</option>
                </select>
              </label>
            </div>

            <label className={css.checkbox}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
              />
              <span>Acepto recibir comunicaciones de GeoPetShop sobre vacunación, cuidados y novedades.</span>
            </label>

            {errorMessage ? <p className={css.error}>{errorMessage}</p> : null}

            <button
              type="submit"
              className={css.primaryButton}
              disabled={submitState === 'loading'}
            >
              {submitState === 'loading' ? 'Enviando...' : 'Quiero recibir avisos'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default LeadFormPage;
