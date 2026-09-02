import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import loadable from '@loadable/component';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  displayDeliveryPickup,
  displayDeliveryShipping,
  displayPrice,
} from '../../util/configHelpers';
import {
  propTypes,
  AVAILABILITY_MULTIPLE_SEATS,
  LISTING_STATE_CLOSED,
  LINE_ITEM_NIGHT,
  LINE_ITEM_DAY,
  LINE_ITEM_HOUR,
  LINE_ITEM_FIXED,
  LINE_ITEM_ITEM,
  STOCK_MULTIPLE_ITEMS,
  STOCK_INFINITE_MULTIPLE_ITEMS,
  LISTING_STATE_PUBLISHED,
} from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug, parse, stringify } from '../../util/urlHelpers';
import { userDisplayNameAsString } from '../../util/data';
import {
  OFFER,
  REQUEST,
  getSupportedProcessesInfo,
  isBookingProcess,
  isNegotiationProcess,
  isInquiryProcess,
  isPurchaseProcess,
  resolveLatestProcessName,
} from '../../transactions/transaction';

import { ModalInMobile, PrimaryButton, AvatarSmall, H1, H2 } from '../../components';
import PriceVariantPicker from './PriceVariantPicker/PriceVariantPicker';
import SubmitFinePrint from './SubmitFinePrint/SubmitFinePrint';

import css from './OrderPanel.module.css';

const BookingTimeForm = loadable(() =>
  import(/* webpackChunkName: "BookingTimeForm" */ './BookingTimeForm/BookingTimeForm')
);
const BookingDatesForm = loadable(() =>
  import(/* webpackChunkName: "BookingDatesForm" */ './BookingDatesForm/BookingDatesForm')
);
const BookingFixedDurationForm = loadable(() =>
  import(
    /* webpackChunkName: "BookingFixedDurationForm" */ './BookingFixedDurationForm/BookingFixedDurationForm'
  )
);
const InquiryWithoutPaymentForm = loadable(() =>
  import(
    /* webpackChunkName: "InquiryWithoutPaymentForm" */ './InquiryWithoutPaymentForm/InquiryWithoutPaymentForm'
  )
);
const ProductOrderForm = loadable(() =>
  import(/* webpackChunkName: "ProductOrderForm" */ './ProductOrderForm/ProductOrderForm')
);

const NegotiationForm = loadable(() =>
  import(/* webpackChunkName: "NegotiationForm" */ './NegotiationForm/NegotiationForm')
);

const NegotiationRequestQuoteForm = loadable(() =>
  import(
    /* webpackChunkName: "NegotiationRequestQuoteForm" */ './NegotiationRequestQuoteForm/NegotiationRequestQuoteForm'
  )
);

// This defines when ModalInMobile shows content as Modal
const MODAL_BREAKPOINT = 1023;
const TODAY = new Date();
const ORDER_PANEL_SUBMIT_BUTTON_ID = 'orderPanelSubmitButton';

const WhatsAppIcon = () => (
  <svg
    className={css.whatsappIcon}
    viewBox="0 0 448 512"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.8l-6.7-4-69.8 18.3 18.6-68-4.4-7c-18.5-29.4-28.2-63.4-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.1-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.8-10.5-6.6z"
    />
  </svg>
);

const isPublishedListing = listing => {
  return listing.attributes.state === LISTING_STATE_PUBLISHED;
};

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

const getCheapestPriceVariant = (priceVariants = []) => {
  return priceVariants.reduce((cheapest, current) => {
    return current.priceInSubunits < cheapest.priceInSubunits ? current : cheapest;
  }, priceVariants[0]);
};

const formatMoneyIfSupportedCurrency = (price, intl) => {
  try {
    return formatMoney(intl, price);
  } catch (e) {
    return `(${price.currency})`;
  }
};

const openOrderModal = (isOwnListing, isClosed, history, location) => {
  if (isOwnListing || isClosed) {
    window.scrollTo(0, 0);
  } else {
    const { pathname, search, state } = location;
    const searchString = `?${stringify({ ...parse(search), orderOpen: true })}`;
    history.push(`${pathname}${searchString}`, state);
  }
};

const closeOrderModal = (history, location) => {
  const { pathname, search, state } = location;
  const { orderOpen, ...searchParams } = parse(search);
  const searchString = `?${stringify(searchParams)}`;
  history.push(`${pathname}${searchString}`, state);
};

const handleSubmit = (isOwnListing, isClosed, isDirectSubmit, onSubmit, history, location) => {
  // TODO: currently, inquiry-process does not have any form to ask more order data.
  // We can submit without opening any inquiry/order modal.
  return isDirectSubmit
    ? () => onSubmit({})
    : () => openOrderModal(isOwnListing, isClosed, history, location);
};

const dateFormattingOptions = { month: 'short', day: 'numeric', weekday: 'short' };

const PriceMaybe = props => {
  const {
    price,
    publicData,
    validListingTypes,
    intl,
    marketplaceCurrency,
    showCurrencyMismatch = false,
  } = props;
  const { listingType, unitType } = publicData || {};

  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  const isPriceVariationsInUse = !!publicData?.priceVariationsEnabled;
  const hasMultiplePriceVariants = publicData?.priceVariants?.length > 1;

  if (!showPrice || !price || (isPriceVariationsInUse && hasMultiplePriceVariants)) {
    return null;
  }

  // Get formatted price or currency code if the currency does not match with marketplace currency
  const { formattedPrice, priceTitle } = priceData(price, marketplaceCurrency, intl);
  const priceValue = (
    <span className={css.priceValue}>{formatMoneyIfSupportedCurrency(price, intl)}</span>
  );
  const pricePerUnit = (
    <span className={css.perUnit}>
      <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
    </span>
  );

  // TODO: In CTA, we don't have space to show proper error message for a mismatch of marketplace currency
  //       Instead, we show the currency code in place of the price
  return showCurrencyMismatch ? (
    <div className={css.priceContainerInCTA}>
      <div className={css.priceValueInCTA} title={priceTitle}>
        <FormattedMessage
          id="OrderPanel.priceInMobileCTA"
          values={{ priceValue: formattedPrice }}
        />
      </div>
      <div className={css.perUnitInCTA}>
        <FormattedMessage id="OrderPanel.perUnit" values={{ unitType }} />
      </div>
    </div>
  ) : (
    <div className={css.priceContainer}>
      <p className={css.price}>
        <FormattedMessage id="OrderPanel.price" values={{ priceValue, pricePerUnit }} />
      </p>
    </div>
  );
};

const PriceMissing = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingPriceMissing" />
    </p>
  );
};
const InvalidCurrency = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingCurrencyInvalid" />
    </p>
  );
};

const InvalidPriceVariants = () => {
  return (
    <p className={css.error}>
      <FormattedMessage id="OrderPanel.listingPriceVariantsAreInvalid" />
    </p>
  );
};

const hasUniqueVariants = priceVariants => {
  const priceVariantsSlugs = priceVariants?.map(variant =>
    variant.name ? createSlug(variant.name) : 'no-name'
  );
  return new Set(priceVariantsSlugs).size === priceVariants.length;
};

const hasValidPriceVariants = priceVariants => {
  const isArray = Array.isArray(priceVariants);
  const hasItems = isArray && priceVariants.length > 0;
  const variantsHaveNames = hasItems && priceVariants.every(variant => variant.name);
  const namesAreUnique = hasItems && hasUniqueVariants(priceVariants);

  return variantsHaveNames && namesAreUnique;
};

/**
 * @typedef {Object} ListingTypeConfig
 * @property {string} listingType - The type of the listing
 * @property {string} transactionType - The type of the transaction
 * @property {string} transactionType.process - The process descriptionof the transaction
 * @property {string} transactionType.alias - The alias of the transaction process
 * @property {string} transactionType.unitType - The unit type of the transaction
 */

/**
 * OrderPanel is a component that renders a panel for making bookings, purchases, or inquiries for a listing.
 * It handles different transaction processes and displays appropriate forms based on the listing type.
 *
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overwrites the default class for the root element
 * @param {string} [props.className] - Custom class that extends
 * @param {string} [props.titleClassName] - Custom class name for the title
 * @param {propTypes.listing} props.listing - The listing data (either regular or own listing)
 * @param {Array<ListingTypeConfig>} props.validListingTypes - Array of valid listing type configurations
 * @param {boolean} [props.isOwnListing=false] - Whether the listing belongs to the current user
 * @param {listingType.user|listingType.currentUser} props.author - The listing author's user data
 * @param {ReactNode} [props.authorLink] - Custom component for rendering the author link
 * @param {ReactNode} [props.payoutDetailsWarning] - Warning message about payout details
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {ReactNode|string} props.title - Title of the panel
 * @param {ReactNode} [props.titleDesktop] - Alternative title for desktop view
 * @param {ReactNode|string} [props.subTitle] - Subtitle text
 * @param {Function} props.onManageDisableScrolling - Handler for managing scroll behavior
 * @param {Function} props.onFetchTimeSlots - Handler for fetching available time slots
 * @param {Object} [props.monthlyTimeSlots] - Available time slots by month
 * @param {Function} props.onFetchTransactionLineItems - Handler for fetching transaction line items
 * @param {Function} [props.onContactUser] - Handler for contacting the listing author
 * @param {Array} [props.lineItems] - Array of line items for the transaction
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {Object} [props.fetchLineItemsError] - Error object if line items fetch failed
 * @param {string} props.marketplaceCurrency - The currency used in the marketplace
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {string} props.marketplaceName - Name of the marketplace
 *
 * @returns {JSX.Element} Component that displays the order panel with appropriate form
 */
const OrderPanel = props => {
  const [mounted, setMounted] = useState(false);
  const intl = useIntl();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    rootClassName,
    className,
    titleClassName,
    listing,
    validListingTypes,
    lineItemUnitType: lineItemUnitTypeMaybe,
    isOwnListing,
    onSubmit,
    title,
    titleDesktop,
    author,
    authorLink,
    onManageDisableScrolling,
    onFetchTimeSlots,
    monthlyTimeSlots,
    timeSlotsForDate,
    onFetchTransactionLineItems,
    onContactUser,
    lineItems,
    marketplaceCurrency,
    dayCountAvailableForBooking,
    marketplaceName,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    payoutDetailsWarning,
    showListingImage,
    whatsappPhone,
    whatsappMessage,
  } = props;

  const publicData = listing?.attributes?.publicData || {};
  const { listingType, unitType, transactionProcessAlias = '', priceVariants, startTimeInterval } =
    publicData || {};

  const normalizedWhatsAppPhone = String(whatsappPhone || '').replace(/\D/g, '');
  const whatsappUrl = normalizedWhatsAppPhone
    ? `https://wa.me/${normalizedWhatsAppPhone}?text=${encodeURIComponent(
        whatsappMessage || 'Hola, vengo de GeoPetshop.'
      )}`
    : null;

  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const lineItemUnitType = lineItemUnitTypeMaybe || `line-item/${unitType}`;

  const price = listing?.attributes?.price;
  const isInquiry = isInquiryProcess(processName);
  const isBooking = isBookingProcess(processName);
  const isPurchase = isPurchaseProcess(processName);
  const isNegotiation = isNegotiationProcess(processName);
  const isPaymentProcess = isBooking || isPurchase || isNegotiation;

  const showPriceMissing = isPaymentProcess && !isNegotiation && !price;
  const showInvalidCurrency =
    isPaymentProcess && !isNegotiation && price?.currency !== marketplaceCurrency;

  const timeZone = listing?.attributes?.availabilityPlan?.timezone;
  const isClosed = listing?.attributes?.state === LISTING_STATE_CLOSED;

  const shouldHaveFixedBookingDuration = isBooking && [LINE_ITEM_FIXED].includes(lineItemUnitType);
  const showBookingFixedDurationForm =
    mounted && shouldHaveFixedBookingDuration && !isClosed && timeZone && priceVariants?.length > 0;

  const shouldHaveBookingTime = isBooking && [LINE_ITEM_HOUR].includes(lineItemUnitType);
  const showBookingTimeForm = mounted && shouldHaveBookingTime && !isClosed && timeZone;

  const shouldHaveBookingDates =
    isBooking && [LINE_ITEM_DAY, LINE_ITEM_NIGHT].includes(lineItemUnitType);
  const showBookingDatesForm = mounted && shouldHaveBookingDates && !isClosed && timeZone;

  // The listing resource has a relationship: `currentStock`,
  // which you should include when making API calls.
  const shouldHavePurchase = isPurchase && lineItemUnitType === LINE_ITEM_ITEM;
  const currentStock = listing.currentStock?.attributes?.quantity;
  const isOutOfStock = shouldHavePurchase && !isClosed && currentStock === 0;

  // Show form only when stock is fully loaded. This avoids "Out of stock" UI by
  // default before all data has been downloaded.
  const showProductOrderForm =
    mounted && shouldHavePurchase && !isClosed && typeof currentStock === 'number';

  const showInquiryForm = mounted && !isClosed && isInquiry;
  // if listing is a request, we show the negotiation form (reverse negotiation). User (provider) needs to make an offer first.
  const showNegotiationForm = mounted && !isClosed && isNegotiation && unitType === REQUEST;
  // if listing is an offer, we show the "request a quote" form as user needs to ask for a quote first from the provider.
  const showRequestQuoteForm = mounted && !isClosed && isNegotiation && unitType === OFFER;

  const supportedProcessesInfo = getSupportedProcessesInfo();
  const isKnownProcess = supportedProcessesInfo.map(info => info.name).includes(processName);

  const { pickupEnabled, shippingEnabled } = listing?.attributes?.publicData || {};

  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const displayShipping = displayDeliveryShipping(listingTypeConfig);
  const displayPickup = displayDeliveryPickup(listingTypeConfig);
  const allowOrdersOfMultipleItems = [STOCK_MULTIPLE_ITEMS, STOCK_INFINITE_MULTIPLE_ITEMS].includes(
    listingTypeConfig?.stockType
  );

  const searchParams = parse(location.search);
  const isOrderOpen = !!searchParams.orderOpen;
  const preselectedPriceVariantSlug = searchParams.bookableOption;

  const seatsEnabled = [AVAILABILITY_MULTIPLE_SEATS].includes(listingTypeConfig?.availabilityType);

  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  const isPriceVariationsInUse = !!publicData?.priceVariationsEnabled;
  const preselectedPriceVariant =
    Array.isArray(priceVariants) && preselectedPriceVariantSlug && isPriceVariationsInUse
      ? priceVariants.find(pv => pv?.name && createSlug(pv?.name) === preselectedPriceVariantSlug)
      : null;

  const priceVariantsMaybe = isPriceVariationsInUse
    ? {
        isPriceVariationsInUse,
        priceVariants,
        priceVariantFieldComponent: PriceVariantPicker,
        preselectedPriceVariant,
        isPublishedListing: isPublishedListing(listing),
      }
    : !isPriceVariationsInUse && showBookingFixedDurationForm
    ? {
        isPriceVariationsInUse: false,
        priceVariants: [getCheapestPriceVariant(priceVariants)],
        priceVariantFieldComponent: PriceVariantPicker,
      }
    : {};

  const showInvalidPriceVariantsMessage =
    isPriceVariationsInUse && !hasValidPriceVariants(priceVariants);

  const sharedProps = {
    lineItemUnitType,
    onSubmit,
    price,
    marketplaceCurrency,
    listingId: listing.id,
    isOwnListing,
    marketplaceName,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
    payoutDetailsWarning,
  };

  const showClosedListingHelpText = listing.id && isClosed;

  const subTitleText = showClosedListingHelpText
    ? intl.formatMessage({ id: 'OrderPanel.subTitleClosedListing' })
    : null;

  const authorDisplayName = userDisplayNameAsString(author, '');

  const classes = classNames(rootClassName || css.root, className);
  const titleClasses = classNames(titleClassName || css.orderTitle);

  return (
    <div className={classes}>
      <ModalInMobile
        containerClassName={css.modalContainer}
        id="OrderFormInModal"
        isModalOpenOnMobile={isOrderOpen}
        onClose={() => {
          closeOrderModal(history, location);
          document.getElementById(ORDER_PANEL_SUBMIT_BUTTON_ID)?.focus();
        }}
        showAsModalMaxWidth={MODAL_BREAKPOINT}
        onManageDisableScrolling={onManageDisableScrolling}
        usePortal
      >
        <div className={css.modalHeading}>
          <H1 className={css.heading}>{title}</H1>
        </div>

        {showListingImage && (
          <div className={css.orderHeading}>
            {titleDesktop ? titleDesktop : <H2 className={titleClasses}>{title}</H2>}
            {subTitleText ? <div className={css.orderHelp}>{subTitleText}</div> : null}
          </div>
        )}

        <PriceMaybe
          price={price}
          publicData={publicData}
          validListingTypes={validListingTypes}
          intl={intl}
          marketplaceCurrency={marketplaceCurrency}
        />

        <div className={css.author}>
          <AvatarSmall user={author} className={css.providerAvatar} />
          <span className={css.providerNameLinked}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorLink }} />
          </span>
          <span className={css.providerNamePlain}>
            <FormattedMessage id="OrderPanel.author" values={{ name: authorDisplayName }} />
          </span>
        </div>

        {showPriceMissing ? (
          <PriceMissing />
        ) : showInvalidCurrency ? (
          <InvalidCurrency />
        ) : showInvalidPriceVariantsMessage ? (
          <InvalidPriceVariants />
        ) : showBookingFixedDurationForm ? (
          <BookingFixedDurationForm
            seatsEnabled={seatsEnabled}
            className={css.bookingForm}
            formId="OrderPanelBookingFixedDurationForm"
            dayCountAvailableForBooking={dayCountAvailableForBooking}
            monthlyTimeSlots={monthlyTimeSlots}
            timeSlotsForDate={timeSlotsForDate}
            onFetchTimeSlots={onFetchTimeSlots}
            startDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
            startTimeInterval={startTimeInterval}
            timeZone={timeZone}
            finePrintComponent={SubmitFinePrint}
            {...priceVariantsMaybe}
            {...sharedProps}
          />
        ) : showBookingTimeForm ? (
          <BookingTimeForm
            seatsEnabled={seatsEnabled}
            className={css.bookingForm}
            formId="OrderPanelBookingTimeForm"
            dayCountAvailableForBooking={dayCountAvailableForBooking}
            monthlyTimeSlots={monthlyTimeSlots}
            timeSlotsForDate={timeSlotsForDate}
            onFetchTimeSlots={onFetchTimeSlots}
            startDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
            endDatePlaceholder={intl.formatDate(TODAY, dateFormattingOptions)}
            timeZone={timeZone}
            finePrintComponent={SubmitFinePrint}
            {...priceVariantsMaybe}
            {...sharedProps}
          />
        ) : showBookingDatesForm ? (
          <BookingDatesForm
            seatsEnabled={seatsEnabled}
            className={css.bookingForm}
            formId="OrderPanelBookingDatesForm"
            dayCountAvailableForBooking={dayCountAvailableForBooking}
            monthlyTimeSlots={monthlyTimeSlots}
            onFetchTimeSlots={onFetchTimeSlots}
            timeZone={timeZone}
            finePrintComponent={SubmitFinePrint}
            {...priceVariantsMaybe}
            {...sharedProps}
          />
        ) : showProductOrderForm ? (
          <ProductOrderForm
            formId="OrderPanelProductOrderForm"
            currentStock={currentStock}
            allowOrdersOfMultipleItems={allowOrdersOfMultipleItems}
            pickupEnabled={pickupEnabled && displayPickup}
            shippingEnabled={shippingEnabled && displayShipping}
            displayDeliveryMethod={displayPickup || displayShipping}
            onContactUser={onContactUser}
            {...sharedProps}
          />
        ) : showInquiryForm ? (
          <>
            {whatsappUrl ? (
              <a
                className={css.whatsappButton}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                <span>Consultar por WhatsApp</span>
              </a>
            ) : null}

            <div className={whatsappUrl ? css.geoPetshopInquiryForm : undefined}>
              <InquiryWithoutPaymentForm
                formId="OrderPanelInquiryForm"
                onSubmit={onSubmit}
                finePrintComponent={SubmitFinePrint}
                isOwnListing={isOwnListing}
                submitButtonText="Enviar consulta en GeoPetshop"
                compact={!!whatsappUrl}
              />
            </div>
          </>
        ) : showNegotiationForm ? (
          <NegotiationForm
            formId="OrderPanelNegotiationForm"
            onSubmit={onSubmit}
            finePrintComponent={SubmitFinePrint}
            payoutDetailsWarning={payoutDetailsWarning}
            isOwnListing={isOwnListing}
          />
        ) : showRequestQuoteForm ? (
          <NegotiationRequestQuoteForm
            formId="OrderPanelRequestQuoteForm"
            onSubmit={onSubmit}
            finePrintComponent={SubmitFinePrint}
            payoutDetailsWarning={payoutDetailsWarning}
            isOwnListing={isOwnListing}
          />
        ) : !isKnownProcess ? (
          <p className={css.errorSidebar}>
            <FormattedMessage id="OrderPanel.unknownTransactionProcess" />
          </p>
        ) : null}
      </ModalInMobile>
      <div className={css.openOrderForm}>
        <PriceMaybe
          price={price}
          publicData={publicData}
          validListingTypes={validListingTypes}
          intl={intl}
          marketplaceCurrency={marketplaceCurrency}
          showCurrencyMismatch
        />

        {isClosed ? (
          <div className={css.closedListingButton}>
            <FormattedMessage id="OrderPanel.closedListingButtonText" />
          </div>
        ) : whatsappUrl && showInquiryForm ? (
          <div className={css.mobileCtaStack}>
            <a
              className={css.whatsappButton}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              <span>Consultar por WhatsApp</span>
            </a>

            <PrimaryButton
              id={ORDER_PANEL_SUBMIT_BUTTON_ID}
              onClick={handleSubmit(
                isOwnListing,
                isClosed,
                showInquiryForm || showNegotiationForm,
                onSubmit,
                history,
                location
              )}
              disabled={isOutOfStock}
            >
              Enviar consulta por GeoPetshop
            </PrimaryButton>
          </div>
        ) : (
          <PrimaryButton
            id={ORDER_PANEL_SUBMIT_BUTTON_ID}
            onClick={handleSubmit(
              isOwnListing,
              isClosed,
              showInquiryForm || showNegotiationForm,
              onSubmit,
              history,
              location
            )}
            disabled={isOutOfStock}
          >
            {isBooking ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageBooking" />
            ) : isOutOfStock ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageNoStock" />
            ) : isPurchase ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessagePurchase" />
            ) : showNegotiationForm ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageMakeOffer" />
            ) : showRequestQuoteForm ? (
              <FormattedMessage id="OrderPanel.ctaButtonMessageRequestAQuote" />
            ) : (
              'Enviar consulta por GeoPetshop'
            )}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

export default OrderPanel;
