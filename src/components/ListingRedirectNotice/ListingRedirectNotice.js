import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import Modal from '../Modal/Modal';

import css from './ListingRedirectNotice.module.css';

const AUTO_CLOSE_MS = 4500;

const ListingRedirectNotice = props => {
  const { onManageDisableScrolling } = props;

  const history = useHistory();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectType = searchParams.get('listingRedirect');

  const [isOpen, setIsOpen] = useState(
    redirectType === 'updated' || redirectType === 'unavailable'
  );

  const removeRedirectParam = () => {
    const params = new URLSearchParams(location.search);
    params.delete('listingRedirect');

    const search = params.toString();

    history.replace({
      pathname: location.pathname,
      search: search ? `?${search}` : '',
      hash: location.hash,
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    removeRedirectParam();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeout = setTimeout(handleClose, AUTO_CLOSE_MS);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  if (!redirectType) {
    return null;
  }

  const isUpdated = redirectType === 'updated';

  return (
    <Modal
      id="ListingRedirectNotice"
      isOpen={isOpen}
      onClose={handleClose}
      usePortal
      onManageDisableScrolling={onManageDisableScrolling}
      contentClassName={css.content}
    >
      <div className={css.notice}>
        <h2 className={css.title}>
          {isUpdated ? 'Publicación actualizada' : 'Publicación no disponible'}
        </h2>

        <p className={css.message}>
          {isUpdated
            ? 'Esta publicación fue actualizada. Te redirigimos a la publicación vigente.'
            : 'Esta publicación ya no está disponible. Te mostramos otras opciones similares.'}
        </p>
      </div>
    </Modal>
  );
};

export default ListingRedirectNotice;
