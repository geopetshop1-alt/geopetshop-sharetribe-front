import React, { useMemo, useState } from 'react';

import TopbarContainer from '../TopbarContainer/TopbarContainer';

import css from './LeadFormPage.module.css';

const WEBHOOK_URL = process.env.REACT_APP_GEOPETSHOP_FORM_WEBHOOK_URL;
const ASSET_BASE = '/static/geopetshop-form';

const DIPLOMAS = {
  sobreprotectora: 'diploma_sobreprotectora.png',
  zen: 'diploma_zen.png',
  gourmet: 'diploma_gourmet.png',
  jugadora: 'diploma_jugadora.png',
  primeriza: 'diploma_primeriza.png',
};

const PROFILES = {
  sobreprotectora: {
    name: 'Karen Sobreprotectora',
    icon: '🛡️',
    description:
      'No deja que le pase ni una a su michi. Vigila cada maullido, cada estornudo y cada salto. Su amor no tiene límites.',
  },
  zen: {
    name: 'Karen Zen',
    icon: '🧘',
    description:
      'Relajada, confía en el instinto gatuno y deja que su michi sea quien es. Su casa es un templo de paz felina.',
  },
  gourmet: {
    name: 'Karen Gourmet',
    icon: '🍽️',
    description:
      'Su gato come mejor que ella y no le da vergüenza admitirlo. Si existe una versión premium, su michi ya la probó.',
  },
  jugadora: {
    name: 'Karen Jugadora',
    icon: '🎾',
    description:
      'Vive inventando juegos, escondites y desafíos. Cree que un gato aburrido es un gato triste, y tiene razón.',
  },
  primeriza: {
    name: 'Karen Primeriza',
    icon: '🌱',
    description:
      'Recién arranca la aventura gatuna y todo le parece nuevo. Tiene mil preguntas y quiere hacerlo bien desde el día uno.',
  },
};

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

const YES_NO_OPTIONS = [
  { id: 'yes', text: 'Si' },
  { id: 'no', text: 'No' },
];

const QUIZ_QUESTIONS = [
  {
    title: '¿Cuál es tu reacción cuando tu gato rompe algo?',
    options: [
      { emoji: '😱', text: 'Pánico total, reviso que esté bien', profile: 'sobreprotectora' },
      { emoji: '😌', text: 'Ya fue, los gatos son gatos', profile: 'zen' },
      { emoji: '📸', text: 'Le saco foto antes de limpiar', profile: 'gourmet' },
      { emoji: '😰', text: 'No sé, busco en Google', profile: 'primeriza' },
    ],
  },
  {
    title: 'Si tu gato pudiera hablar, ¿qué diría?',
    options: [
      { emoji: '🍽️', text: 'Tengo hambre, algo rico', profile: 'gourmet' },
      { emoji: '🎾', text: '¡Jugá conmigo AHORA!', profile: 'jugadora' },
      { emoji: '😴', text: 'Dejame dormir en paz', profile: 'zen' },
      { emoji: '💕', text: 'Te amo, gracias por cuidarme', profile: 'sobreprotectora' },
    ],
  },
  {
    title: '¿Cuánto gastás por mes en tu michi?',
    options: [
      { emoji: '💵', text: 'Solo lo básico', profile: 'primeriza' },
      { emoji: '💰', text: 'Lo justo y necesario', profile: 'zen' },
      { emoji: '💸', text: 'Bastante, siempre hay algo nuevo', profile: 'gourmet' },
      { emoji: '💎', text: 'No quiero ni contar', profile: 'sobreprotectora' },
    ],
  },
  {
    title: '¿Qué hacés con tu gato cuando viajás?',
    options: [
      { emoji: '🧳', text: 'Lo llevo conmigo', profile: 'sobreprotectora' },
      { emoji: '🏨', text: 'Hotel cat de lujo', profile: 'gourmet' },
      { emoji: '🏠', text: 'Un familiar lo cuida', profile: 'zen' },
      { emoji: '❓', text: 'Nunca me pasó, no sé', profile: 'primeriza' },
    ],
  },
];

const emptyPet = () => ({
  name: '',
  birthDate: '',
});

const todayISO = () => new Date().toISOString().slice(0, 10);

const normalizeArgentinaPhone = value => {
  let digits = String(value || '').replace(/\D/g, '');

  if (!digits) return '';

  // 00 54...
  if (digits.startsWith('0054')) {
    digits = digits.slice(2);
  }

  // +54...
  if (digits.startsWith('54')) {
    if (digits.startsWith('549')) return digits;
    return `549${digits.slice(2)}`;
  }

  // Quitar 0 inicial de característica: 011..., 0341...
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Quitar 15 después de característica si viene formato antiguo:
  // 11 15 1234 5678 -> 11 1234 5678
  if (digits.length >= 12 && digits.slice(2, 4) === '15') {
    digits = `${digits.slice(0, 2)}${digits.slice(4)}`;
  }

  // Celular argentino final para WhatsApp: 549 + área + número
  return `549${digits}`;
};

const isValidArgentinaMobile = value => {
  const normalized = normalizeArgentinaPhone(value);

  // 54 + 9 + 10 dígitos aprox. Para Argentina móvil.
  return /^549\d{10}$/.test(normalized);
};

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

const getWinnerProfile = answers => {
  const scores = {};

  answers.filter(Boolean).forEach(profile => {
    const weight = profile === 'jugadora' ? 3.25 : 1;
    scores[profile] = (scores[profile] || 0) + weight;
  });

  const keys = Object.keys(scores);
  if (!keys.length) return 'sobreprotectora';

  const priority = ['jugadora', 'gourmet', 'sobreprotectora', 'primeriza', 'zen'];

  return keys.reduce((winner, current) => {
    if (scores[current] > scores[winner]) return current;
    if (
      scores[current] === scores[winner] &&
      priority.indexOf(current) < priority.indexOf(winner)
    ) {
      return current;
    }
    return winner;
  });
};

const buildTallyCompatiblePayload = formData => {
  const {
    firstName,
    lastName,
    email,
    phone,
    quantity,
    pets,
    saleAfuera,
    convive,
    winningProfile,
    quizAnswers,
  } = formData;

  const quantityOptionId = getQuantityOptionId(quantity);
  const saleAfueraOptionId = saleAfuera === 'Si' ? 'yes' : 'no';
  const conviveOptionId = convive === 'Si' ? 'yes' : 'no';
  const profile = PROFILES[winningProfile];

  const fields = [
    field({
      key: 'question_48krRY',
      label: 'Nombre',
      type: 'INPUT_TEXT',
      value: firstName,
    }),
    field({
      key: 'question_ZNz0M0',
      label: 'Apellido',
      type: 'INPUT_TEXT',
      value: lastName,
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
      options: YES_NO_OPTIONS,
    })
  );

  fields.push(
    field({
      key: 'question_qdK692',
      label: '¿Convive o esta en contacto con otros gatos?',
      type: 'DROPDOWN',
      value: [conviveOptionId],
      options: YES_NO_OPTIONS,
    })
  );

  fields.push(
    field({
      key: 'geopetshop_diploma',
      label: 'Diploma GeoPetShop',
      type: 'INPUT_TEXT',
      value: profile.name,
    })
  );

  fields.push(
    field({
      key: 'geopetshop_quiz_respuestas',
      label: 'Respuestas quiz GeoPetShop',
      type: 'INPUT_TEXT',
      value: quizAnswers.join(', '),
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
  console.log('STONECAT_FORM_VERSION', '2026-06-01-quiz-result-debug-v1');
  
  const [step, setStep] = useState(0);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [quantity, setQuantity] = useState(1);
  const [pets, setPets] = useState([emptyPet()]);
  const [saleAfuera, setSaleAfuera] = useState('');
  const [convive, setConvive] = useState('No');

  const [catPhoto, setCatPhoto] = useState('');
  const [quizAnswers, setQuizAnswers] = useState([]);

  const [submitState, setSubmitState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [winningProfile, setWinningProfile] = useState(null);

  const maxBirthDate = useMemo(() => todayISO(), []);
  const progress = step === 0 ? 0 : Math.min(100, Math.round((step / 9) * 100));

  const petNames = pets
  .map(pet => pet.name?.trim())
  .filter(Boolean);

  const primaryPetName = petNames[0] || 'tu michi';
  
  const petNamesText =
    petNames.length > 1
      ? petNames.join(', ')
      : primaryPetName;

  const updateQuantity = value => {
    const nextQuantity = Number(value);
    setQuantity(nextQuantity);

    setPets(currentPets => {
      const nextPets = [...currentPets];

      while (nextPets.length < nextQuantity) {
        nextPets.push(emptyPet());
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

  const validateStep1 = () => {
    if (!firstName.trim()) return 'Completá tu nombre.';
    if (!lastName.trim()) return 'Completá tu apellido.';
    if (!email.trim()) return 'Completá tu email.';
    if (!phone.trim()) return 'Completá tu celular.';
    return null;
  };

  const validateStep2 = () => {
    for (let i = 0; i < pets.length; i++) {
      if (!pets[i].name.trim()) return `Completá el nombre del gato ${i + 1}.`;
      if (!pets[i].birthDate) return `Completá la fecha de nacimiento del gato ${i + 1}.`;
    }

    if (!saleAfuera) return 'Indicá si alguno de tus gatos sale de casa.';
    if (!convive) return 'Indicá si convive o está en contacto con otros gatos.';
    return null;
  };

  const goToStep = nextStep => {
    console.log('STONECAT_GO_TO_STEP', {
      from: step,
      to: nextStep,
    });
  
    setErrorMessage('');
    setStep(nextStep);
  
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  const nextFromStep1 = () => {
    const error = validateStep1();
    if (error) {
      setErrorMessage(error);
      return;
    }
    goToStep(2);
  };

  const nextFromStep2 = () => {
    const error = validateStep2();
    if (error) {
      setErrorMessage(error);
      return;
    }
    goToStep(3);
  };

  const handlePhoto = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
      setCatPhoto(e.target.result);
    };

    reader.readAsDataURL(file);
  };

  const answerQuiz = (questionIndex, profileAnswer) => {
    console.log('STONECAT_ANSWER_QUIZ_START', {
      questionIndex,
      profileAnswer,
      currentStep: step,
      currentAnswers: quizAnswers,
    });
    
    const nextAnswers = [...quizAnswers];
    nextAnswers[questionIndex] = profileAnswer;
    setQuizAnswers(nextAnswers);
  
    setTimeout(() => {
      if (questionIndex < QUIZ_QUESTIONS.length - 1) {
        goToStep(4 + questionIndex + 1);
        return;
      }
  
      const winner = getWinnerProfile(nextAnswers);
  
      // Primero mostramos resultado, siempre.
      console.log('STONECAT_QUIZ_FINISHED', {
        nextAnswers,
        winner,
      });
      setWinningProfile(winner);
      setSubmitState('loading');
      setErrorMessage('');
      setStep(9);
  
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
  
      // Después enviamos a n8n en segundo plano.
      submitRegistrationToN8n(nextAnswers, winner);
    }, 180);
  };

const submitRegistrationToN8n = async (finalAnswers, winner) => {
  if (!WEBHOOK_URL) {
    setSubmitState('error');
    setErrorMessage('No está configurado el webhook del formulario.');
    return;
  }

  const tallyPayload = buildTallyCompatiblePayload({
    firstName,
    lastName,
    email,
    phone,
    quantity,
    pets,
    saleAfuera,
    convive,
    winningProfile: winner,
    quizAnswers: finalAnswers,
  });

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tallyPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error ${response.status}`);
    }

    setSubmitState('success');
    setErrorMessage('');
  } catch (error) {
    setSubmitState('error');
    setErrorMessage(
      'Te mostramos el resultado, pero no pudimos confirmar el envío del registro. Revisamos n8n si no aparece en Clientify.'
    );
  }
};

  const reset = () => {
    setStep(0);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setQuantity(1);
    setPets([emptyPet()]);
    setSaleAfuera('');
    setConvive('No');
    setCatPhoto('');
    setQuizAnswers([]);
    setSubmitState('idle');
    setErrorMessage('');
    setWinningProfile(null);
  };

  const profile = winningProfile ? PROFILES[winningProfile] : null;
  const diplomaFile = winningProfile ? DIPLOMAS[winningProfile] : null;
  const diplomaUrl = diplomaFile ? `${ASSET_BASE}/${diplomaFile}` : '';

  const loadImage = src =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawCoverImage = (ctx, image, x, y, width, height) => {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
};

const fitText = (ctx, text, maxWidth, startFontSize, minFontSize, fontFamily) => {
  let fontSize = startFontSize;
  ctx.font = `900 ${fontSize}px ${fontFamily}`;

  while (ctx.measureText(text).width > maxWidth && fontSize > minFontSize) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
  }

  return fontSize;
};

const makeFinalDiplomaBlob = async () => {
    if (!profile || !diplomaUrl) return null;
  
    const diplomaImage = await loadImage(diplomaUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
  
    canvas.width = diplomaImage.width;
    canvas.height = diplomaImage.height;
  
    ctx.drawImage(diplomaImage, 0, 0, canvas.width, canvas.height);
  
    const fontFamily = 'Arial, Helvetica, sans-serif';
  
    const tutorName = `${firstName} ${lastName}`.trim();
    const tutorMaxWidth = canvas.width * 0.58;
    const tutorFontSize = fitText(ctx, tutorName, tutorMaxWidth, 72, 34, fontFamily);
  
    ctx.fillStyle = '#1b2b5c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${tutorFontSize}px ${fontFamily}`;
    ctx.fillText(tutorName, canvas.width * 0.5, canvas.height * 0.392);
  
    if (catPhoto) {
      const catImage = await loadImage(catPhoto);
      const photoSize = canvas.width * 0.24;
      const photoX = (canvas.width - photoSize) / 2;
      const photoY = canvas.height * 0.445;
  
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        photoX + photoSize / 2,
        photoY + photoSize / 2,
        photoSize / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
      drawCoverImage(ctx, catImage, photoX, photoY, photoSize, photoSize);
      ctx.restore();
  
      ctx.beginPath();
      ctx.arc(
        photoX + photoSize / 2,
        photoY + photoSize / 2,
        photoSize / 2,
        0,
        Math.PI * 2
      );
      ctx.lineWidth = canvas.width * 0.012;
      ctx.strokeStyle = '#d7b56d';
      ctx.stroke();
    }
  
    const petsMaxWidth = canvas.width * 0.58;
    const petsFontSize = fitText(ctx, petNamesText, petsMaxWidth, 62, 26, fontFamily);
  
    ctx.fillStyle = '#1b2b5c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${petsFontSize}px ${fontFamily}`;
    ctx.fillText(petNamesText, canvas.width * 0.5, canvas.height * 0.722);
  
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
    });
  };

  const downloadDiploma = async () => {
    const blob = await makeFinalDiplomaBlob();
  
    if (!blob) return;
  
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diploma-stonecat-${primaryPetName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const shareDiploma = async () => {
    if (!profile) return;
  
    const shareText = `Ya soy parte de la Academia Stonecat. Mi perfil es ${profile.name}.`;
    const blob = await makeFinalDiplomaBlob();
  
    if (!blob) {
      await downloadDiploma();
      return;
    }
  
    const file = new File([blob], `diploma-stonecat-${primaryPetName}.png`, {
      type: 'image/png',
    });
  
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Mi diploma Stonecat',
          text: shareText,
          files: [file],
        });
        return;
      }
  
      if (navigator.share) {
        await navigator.share({
          title: 'Mi diploma Stonecat',
          text: shareText,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
        return;
      }
  
      await downloadDiploma();
    } catch (error) {
      await downloadDiploma();
    }
  };
  
  const renderHeader = () => {
    if (step === 0) return null;

    return (
      <div className={css.header}>
        <button
          type="button"
          className={css.backButton}
          onClick={() => goToStep(Math.max(0, step - 1))}
          disabled={step === 9}
        >
          ← Volver
        </button>
        <img src={`${ASSET_BASE}/stonecat-logo.jpg`} alt="Academia Stonecat" className={css.logo} />
        <div className={css.progressBar}>
          <div className={css.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  };

  const renderPortada = () => (
    <section className={`${css.screen} ${css.coverScreen}`}>
      <img
        src={`${ASSET_BASE}/portada-mvp.webp`}
        alt="Academia Stonecat - Inscripción"
        className={css.coverImage}
      />
  
      <div className={css.coverCtaWrap}>
        <button type="button" className={`${css.button} ${css.primary}`} onClick={() => goToStep(1)}>
          Empezar inscripción 🚀
        </button>
      </div>
    </section>
  );

  const renderStep1 = () => (
    <section className={css.screen}>
      <p className={css.label}>📋 PASO 1 DE 3</p>
      <h2>Datos del tutor</h2>
      <p className={css.subtitle}>Contanos quién sos para mandarte todo por mail.</p>

      <div className={css.twoColumns}>
        <label className={css.field}>
          <span>Nombre *</span>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="María" />
        </label>

        <label className={css.field}>
          <span>Apellido *</span>
          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="López" />
        </label>
      </div>

      <label className={css.field}>
        <span>Email *</span>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="maria@email.com"
        />
      </label>

      <label className={css.field}>
        <span>Celular *</span>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Ej. 11 7001 3000"
        />
      </label>

      {errorMessage ? <p className={css.error}>{errorMessage}</p> : null}

      <button type="button" className={`${css.button} ${css.primary}`} onClick={nextFromStep1}>
        Siguiente →
      </button>
    </section>
  );

  const renderStep2 = () => (
    <section className={css.screen}>
      <p className={css.label}>🐾 PASO 2 DE 3</p>
      <h2>Sobre tu hogar gatuno</h2>
      <p className={css.subtitle}>Podés cargar más de un gato. La foto es opcional y solo se usa para el diploma.</p>

      <label className={css.field}>
        <span>¿Cuántos gatitos tenés? *</span>
        <select value={quantity} onChange={e => updateQuantity(e.target.value)}>
          {QUANTITY_OPTIONS.map(option => (
            <option key={option.id} value={option.text}>
              {option.text}
            </option>
          ))}
        </select>
      </label>

      <div className={css.petBox}>
        {pets.map((pet, index) => (
          <div className={css.petRow} key={`pet-${index}`}>
            <label className={css.field}>
              <span>Nombre del gato {index + 1} *</span>
              <input
                value={pet.name}
                onChange={e => updatePet(index, 'name', e.target.value)}
                placeholder={index === 0 ? 'Michi' : `Michi ${index + 1}`}
              />
            </label>

            <label className={css.field}>
              <span>Fecha de nacimiento *</span>
              <input
                type="date"
                value={pet.birthDate}
                max={maxBirthDate}
                onChange={e => updatePet(index, 'birthDate', e.target.value)}
              />
              <small>Aproximada si no sabés la exacta.</small>
            </label>
          </div>
        ))}
      </div>

      <div className={css.field}>
        <span>¿Alguno de tus gatos sale de casa? *</span>
        <div className={css.radioGroup}>
          {['Si', 'No', 'A veces'].map(value => (
            <button
              key={value}
              type="button"
              className={`${css.radioButton} ${saleAfuera === value ? css.selected : ''}`}
              onClick={() => setSaleAfuera(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className={css.field}>
        <span>¿Convive o está en contacto con otros gatos? *</span>
        <div className={css.radioGroup}>
          {['Si', 'No'].map(value => (
            <button
              key={value}
              type="button"
              className={`${css.radioButton} ${convive === value ? css.selected : ''}`}
              onClick={() => setConvive(value)}
              disabled={quantity > 1 && value === 'No'}
            >
              {value}
            </button>
          ))}
        </div>
        {quantity > 1 ? <small>Como cargaste más de un gato, marcamos esta respuesta como “Si”.</small> : null}
      </div>

      <div className={css.field}>
        <span>📸 Subí una foto para el diploma (opcional)</span>
        <label className={css.photoUpload}>
          {catPhoto ? (
            <img src={catPhoto} alt="Preview del gato" className={css.photoPreview} />
          ) : (
            <span>
              <strong>🐱 Tocá para subir una foto</strong>
              <small>JPG o PNG · No es obligatorio</small>
            </span>
          )}
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </label>
      </div>

      {errorMessage ? <p className={css.error}>{errorMessage}</p> : null}

      <button type="button" className={`${css.button} ${css.primary}`} onClick={nextFromStep2}>
        Siguiente →
      </button>
    </section>
  );

  const renderQuizIntro = () => (
    <section className={css.screen}>
      <p className={css.label}>🎯 PASO 3 DE 3</p>
      <h2>Ahora lo divertido 🎉</h2>
      <p className={css.text}>
        4 preguntas rápidas para descubrir qué tipo de Karen sos.
        <br />
        <br />
        Tus respuestas van a <strong>personalizar el contenido</strong> que te mandemos para tus gatos.
      </p>
      <button type="button" className={`${css.button} ${css.primary}`} onClick={() => goToStep(4)}>
        Empezar el quiz 🐾
      </button>
    </section>
  );

  const renderQuestion = questionIndex => {
    const question = QUIZ_QUESTIONS[questionIndex];
    const selectedProfile = quizAnswers[questionIndex];

    return (
      <section className={css.screen}>
        <p className={css.label}>🎯 PREGUNTA {questionIndex + 1} DE 4</p>
        <h2>{question.title}</h2>

        <div className={css.options}>
          {question.options.map(option => (
            <button
              key={`${questionIndex}-${option.profile}-${option.text}`}
              type="button"
              className={`${css.option} ${selectedProfile === option.profile ? css.selectedOption : ''}`}
              onClick={() => answerQuiz(questionIndex, option.profile)}
            >
              <span>{option.emoji}</span>
              {option.text}
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderLoading = () => (
    <section className={css.screen}>
      <div className={css.loading}>
        <div className={css.catAnimation}>🎓</div>
        <p>
          Calculando tu perfil Karen
          <br />
          Te estamos graduando ✨
        </p>
      </div>
    </section>
  );

  const renderResult = () => {
    console.log('STONECAT_RENDER_RESULT', {
      winningProfile,
      submitState,
      errorMessage,
    });
  
    return (
      <section className={css.screen}>
        <div className={css.resultIcon}>✨</div>
        <h2 className={css.resultTitle}>¡Ya sos parte de la Academia!</h2>
  
        {profile ? (
          <>
            <p className={css.text}>
              <strong>{firstName}</strong>, tu perfil es{' '}
              <strong className={css.accent}>{profile.name}</strong>.
            </p>
            <p className={css.text}>{profile.description}</p>
  
            <div className={css.diplomaWrap}>
              <img src={diplomaUrl} alt={`Diploma ${profile.name}`} className={css.diplomaBg} />
              <div className={css.diplomaOverlay}>
                <div className={css.diplomaName}>
                  {firstName} {lastName}
                </div>
                {catPhoto ? <img src={catPhoto} alt={primaryPetName} className={css.diplomaPhoto} /> : null}
                <div className={css.diplomaCatName}>{petNamesText}</div>
              </div>
            </div>
  
            <div className={css.shareActions}>
              <button type="button" className={`${css.button} ${css.primary}`} onClick={shareDiploma}>
                📱 Compartir
              </button>
              <button type="button" className={`${css.button} ${css.secondary}`} onClick={downloadDiploma}>
                Descargar
              </button>
              <button type="button" className={`${css.button} ${css.ghost}`} onClick={reset}>
                🔄 Reiniciar
              </button>
            </div>
  
            <p className={css.successText}>🎁 Revisá tu mail: diploma + tips personalizados según tu perfil.</p>
  
            {submitState === 'loading' ? (
              <p className={css.text}>Enviando tus datos...</p>
            ) : null}
  
            {submitState === 'success' ? (
              <p className={css.webhookOk}>✅ Datos enviados correctamente.</p>
            ) : null}
  
            {submitState === 'error' && errorMessage ? <p className={css.error}>{errorMessage}</p> : null}
          </>
        ) : (
          <>
            <p className={css.error}>No pudimos calcular el resultado. Volvé a intentar.</p>
            <button type="button" className={`${css.button} ${css.primary}`} onClick={reset}>
              Reiniciar
            </button>
          </>
        )}
      </section>
    );
  };

  return (
    <>
      <TopbarContainer currentPage="LeadFormPage" />

      <main className={css.page}>
        <div className={css.app}>
          {renderHeader()}

          {step === 0 ? renderPortada() : null}
          {step === 1 ? renderStep1() : null}
          {step === 2 ? renderStep2() : null}
          {step === 3 ? renderQuizIntro() : null}
          {step === 4 ? renderQuestion(0) : null}
          {step === 5 ? renderQuestion(1) : null}
          {step === 6 ? renderQuestion(2) : null}
          {step === 7 ? renderQuestion(3) : null}
          {step === 8 ? renderLoading() : null}
          {step === 9 ? renderResult() : null}
        </div>
      </main>
    </>
  );
};

export default LeadFormPage;
