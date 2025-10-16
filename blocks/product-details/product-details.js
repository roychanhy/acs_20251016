import {
  InLineAlert,
  Icon,
  Button,
  provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
import { initializers } from '@dropins/tools/initializer.js';

import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Order Dropin Components
import * as orderApi from '@dropins/storefront-order/api.js';
import * as checkoutApi from '@dropins/storefront-checkout/api.js';
import CustomerDetails from '@dropins/storefront-order/containers/CustomerDetails.js';
import OrderCostSummary from '@dropins/storefront-order/containers/OrderCostSummary.js';
import OrderHeader from '@dropins/storefront-order/containers/OrderHeader.js';
import OrderProductList from '@dropins/storefront-order/containers/OrderProductList.js';
import OrderStatus from '@dropins/storefront-order/containers/OrderStatus.js';
import ShippingStatus from '@dropins/storefront-order/containers/ShippingStatus.js';
import { render as OrderProvider } from '@dropins/storefront-order/render.js';

// Auth Dropin
import SignUp from '@dropins/storefront-auth/containers/SignUp.js';
import { render as AuthProvider } from '@dropins/storefront-auth/render.js';

// Cart Dropin
import GiftOptions from '@dropins/storefront-cart/containers/GiftOptions.js';
import { render as CartProvider } from '@dropins/storefront-cart/render.js';

// Payment Services Dropin
import ApplePay from '@dropins/storefront-payment-services/containers/ApplePay.js';
import { render as PaymentServices } from '@dropins/storefront-payment-services/render.js';
import { PaymentLocation, PaymentMethodCode } from '@dropins/storefront-payment-services/api.js';

// Block-level
import createModal from '../modal/modal.js';
import { getUserTokenCookie } from '../../scripts/initializers/index.js';

// Libs
import {
  rootLink,
  setJsonLd,
  fetchPlaceholders,
  getProductLink,
} from '../../scripts/commerce.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';
import '../../scripts/initializers/payment-services.js';

// For order confirmation block
// Link to support page
const SUPPORT_PATH = '/support';

// Slots
const authPrivacyPolicyConsentSlot = {};

const swatchImageSlot = (ctx) => {
  const { data, defaultImageProps } = ctx;
  tryRenderAemAssetsImage(ctx, {
    alias: data.sku,
    imageProps: defaultImageProps,
    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  });
};

/**
 * Checks if the page has prerendered product JSON-LD data
 * @returns {boolean} True if product JSON-LD exists and contains @type=Product
 */
function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

// Function to update the Add to Cart button text
function updateAddToCartButtonText(addToCartInstance, inCart, labels) {
  const buttonText = inCart
    ? labels.Global?.UpdateProductInCart
    : labels.Global?.AddProductToCart;
  if (addToCartInstance) {
    addToCartInstance.setProps((prev) => ({
      ...prev,
      children: buttonText,
    }));
  }
}

export default async function decorate(block) {
  const product = events.lastPayload('pdp/data') ?? null;
  const labels = await fetchPlaceholders();

  // Read itemUid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');

  // State to track if we are in update mode
  let isUpdateMode = false;

  // Layout
  const fragment = document.createRange().createContextualFragment(`
    <div class="product-details__alert"></div>
    <div class="product-details__wrapper">
      <div class="product-details__left-column">
        <div class="product-details__gallery"></div>
      </div>
      <div class="product-details__right-column">
        <div class="product-details__header"></div>
        <div class="product-details__price"></div>
        <div class="product-details__gallery"></div>
        <div class="product-details__short-description"></div>
        <div class="product-details__gift-card-options"></div>
        <div class="product-details__configuration">
          <div class="product-details__options"></div>
          <div class="product-details__quantity"></div>
          <div class="product-details__buttons">
            <div class="product-details__buttons__add-to-cart"></div>
            <div class="product-details__buttons__add-to-wishlist"></div>
            <div class="product-details__buttons__payment-services-apple-pay"></div>
          </div>
        </div>
        <div class="product-details__description"></div>
        <div class="product-details__attributes"></div>
      </div>
    </div>
  `);

  const $alert = fragment.querySelector('.product-details__alert');
  const $gallery = fragment.querySelector('.product-details__gallery');
  const $header = fragment.querySelector('.product-details__header');
  const $price = fragment.querySelector('.product-details__price');
  const $galleryMobile = fragment.querySelector('.product-details__right-column .product-details__gallery');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $options = fragment.querySelector('.product-details__options');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $giftCardOptions = fragment.querySelector('.product-details__gift-card-options');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $applePay = fragment.querySelector('.product-details__buttons__payment-services-apple-pay');
  const $wishlistToggleBtn = fragment.querySelector('.product-details__buttons__add-to-wishlist');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');

  block.replaceChildren(fragment);

  const gallerySlots = {
    CarouselThumbnail: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
        wrapper: document.createElement('span'),
      });
    },

    CarouselMainImage: (ctx) => {
      tryRenderAemAssetsImage(ctx, {
        ...imageSlotConfig(ctx),
      });
    },
  };

  // Alert
  let inlineAlert = null;
  const routeToWishlist = '/wishlist';

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    wishlistToggleBtn,
    applePayButton,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($galleryMobile),

    // Gallery (Desktop)
    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsColumn',
      arrows: true,
      peak: true,
      gap: 'small',
      loop: false,
      imageParams: {
        ...IMAGES_SIZES,
      },

      slots: gallerySlots,
    })($gallery),

    // Header
    pdpRendered.render(ProductHeader, {})($header),

    // Price
    pdpRendered.render(ProductPrice, {})($price),

    // Short Description
    pdpRendered.render(ProductShortDescription, {})($shortDescription),

    // Configuration - Swatches
    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: (ctx) => {
          tryRenderAemAssetsImage(ctx, {
            ...imageSlotConfig(ctx),
            wrapper: document.createElement('span'),
          });
        },
      },
    })($options),

    // Configuration  Quantity
    pdpRendered.render(ProductQuantity, {})($quantity),

    // Configuration  Gift Card Options
    pdpRendered.render(ProductGiftCardOptions, {})($giftCardOptions),

    // Description
    pdpRendered.render(ProductDescription, {})($description),

    // Attributes
    pdpRendered.render(ProductAttributes, {})($attributes),

    // Wishlist button - WishlistToggle Container
    wishlistRender.render(WishlistToggle, {
      product,
    })($wishlistToggleBtn),

    PaymentServices.render(ApplePay, {
      location: PaymentLocation.PRODUCT_DETAIL,
      createCart: {
        getCartItems: () => {
          const values = events.lastPayload('pdp/values');
          if (!values) {
            throw new Error('No products selected.');
          }
          return [{
            sku: values.sku,
            quantity: values.quantity,
            selectedOptions: values.optionsUIDs,
            enteredOptions: values.enteredOptions,
          }];
        },
      },
      onSuccess: ({ cartId }) => orderApi.placeOrder(cartId),
      onError: async (error) => {
        console.error('Apple Pay payment failed:', error);
        inlineAlert = await UI.render(InLineAlert, {
          heading: 'Apple Pay error',
          description: 'An unexpected error occurred while processing your Apple Pay payment. '
            + 'Please try again or contact support.',
          icon: h(Icon, { source: 'OrderError' }),
          'aria-live': 'assertive',
          role: 'alert',
          type: 'error',
          onDismiss: () => inlineAlert.remove(),
        })($alert);
      },
      hidden: true,
    })($applePay),
  ]);

  // Configuration – Button - Add to Cart
  const addToCart = await UI.render(Button, {
    children: labels.Global?.AddProductToCart,
    icon: h(Icon, { source: 'Cart' }),
    onClick: async () => {
      const buttonActionText = isUpdateMode
        ? labels.Global?.UpdatingInCart
        : labels.Global?.AddingToCart;
      try {
        addToCart.setProps((prev) => ({
          ...prev,
          children: buttonActionText,
          disabled: true,
        }));

        // get the current selection values
        const values = pdpApi.getProductConfigurationValues();
        const valid = pdpApi.isProductConfigurationValid();

        // add or update the product in the cart
        if (valid) {
          if (isUpdateMode) {
            // --- Update existing item ---
            const { updateProductsFromCart } = await import(
              '@dropins/storefront-cart/api.js'
            );

            await updateProductsFromCart([{ ...values, uid: itemUidFromUrl }]);

            // --- START REDIRECT ON UPDATE ---
            const updatedSku = values?.sku;
            if (updatedSku) {
              const cartRedirectUrl = new URL(
                rootLink('/cart'),
                window.location.origin,
              );
              cartRedirectUrl.searchParams.set('itemUid', itemUidFromUrl);
              window.location.href = cartRedirectUrl.toString();
            } else {
              // Fallback if SKU is somehow missing (shouldn't happen in normal flow)
              console.warn(
                'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
              );
              window.location.href = rootLink('/cart');
            }
            return;
          }
          // --- Add new item ---
          const { addProductsToCart } = await import(
            '@dropins/storefront-cart/api.js'
          );
          await addProductsToCart([{ ...values }]);
        }

        // reset any previous alerts if successful
        inlineAlert?.remove();
      } catch (error) {
        // add alert message
        inlineAlert = await UI.render(InLineAlert, {
          heading: 'Error',
          description: error.message,
          icon: h(Icon, { source: 'Warning' }),
          'aria-live': 'assertive',
          role: 'alert',
          onDismiss: () => {
            inlineAlert.remove();
          },
        })($alert);

        // Scroll the alertWrapper into view
        $alert.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } finally {
        // Reset button text using the helper function which respects the current mode
        updateAddToCartButtonText(addToCart, isUpdateMode, labels);
        // Re-enable button
        addToCart.setProps((prev) => ({
          ...prev,
          disabled: false,
        }));
      }
    },
  })($addToCart);

  // Lifecycle Events
  events.on('pdp/valid', (valid) => {
    // update add to cart button disabled state based on product selection validity
    addToCart.setProps((prev) => ({ ...prev, disabled: !valid }));
    applePayButton.setProps((prev) => ({ ...prev, disabled: !valid }));
  }, { eager: true });

  // Handle option changes
  events.on('pdp/values', () => {
    if (wishlistToggleBtn) {
      const configValues = pdpApi.getProductConfigurationValues();

      // Check URL parameter for empty optionsUIDs
      const urlOptionsUIDs = urlParams.get('optionsUIDs');

      // If URL has empty optionsUIDs parameter, treat as base product (no options)
      const optionUIDs = urlOptionsUIDs === '' ? undefined : (configValues?.optionsUIDs || undefined);

      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
        },
      }));
    }
  }, { eager: true });

  events.on('wishlist/alert', ({ action, item }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($alert);

    setTimeout(() => {
      $alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      $alert.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 0);
  });

  // --- Add new event listener for cart/data ---
  events.on(
    'cart/data',
    (cartData) => {
      let itemIsInCart = false;
      if (itemUidFromUrl && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUidFromUrl,
        );
      }
      // Set the update mode state
      isUpdateMode = itemIsInCart;

      // Update button text based on whether the item is in the cart
      updateAddToCartButtonText(addToCart, itemIsInCart, labels);
    },
    { eager: true },
  );

  // Set JSON-LD and Meta Tags
  events.on('aem/lcp', () => {
    const isPrerendered = isProductPrerendered();
    if (product && !isPrerendered) {
      setJsonLdProduct(product);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  events.on('payment-services/method-available/product-detail', (paymentMethodCode) => {
    if (paymentMethodCode === PaymentMethodCode.APPLE_PAY) {
      applePayButton.setProps((prev) => ({ ...prev, hidden: false }));
    }
  }, { eager: true });

  // Handle order placed event
  events.on('order/placed', (orderData) => handleOrderPlaced(orderData, block));

  return Promise.resolve();
}

/**
 * Handle order placed event
 * @param {Object} orderData - The order data
 * @param {Object} block - The block
 */
async function handleOrderPlaced(orderData, block) {
  const token = getUserTokenCookie();
  const orderRef = token ? orderData.number : orderData.token;
  const orderNumber = orderData.number;
  const encodedOrderRef = encodeURIComponent(orderRef);
  const encodedOrderNumber = encodeURIComponent(orderNumber);

  const url = token
    ? rootLink(`/order-details?orderRef=${encodedOrderRef}`)
    : rootLink(`/order-details?orderRef=${encodedOrderRef}&orderNumber=${encodedOrderNumber}`);

  window.history.pushState({}, '', url);

  await displayOrderConfirmation(orderData, block);
}

/**
 * Display the order confirmation
 * @param {Object} orderData - The order data
 * @param {Object} block - The block
 */
async function displayOrderConfirmation(orderData, block) {
  // Scroll to the top of the page
  window.scrollTo(0, 0);

  const orderConfirmationFragment = document.createRange()
    .createContextualFragment(`
    <div class="order-confirmation">
      <div class="order-confirmation__main">
        <div class="order-confirmation__block order-confirmation__header"></div>
        <div class="order-confirmation__block order-confirmation__order-status"></div>
        <div class="order-confirmation__block order-confirmation__shipping-status"></div>
        <div class="order-confirmation__block order-confirmation__customer-details"></div>
      </div>
      <div class="order-confirmation__aside">
        <div class="order-confirmation__block order-confirmation__order-cost-summary"></div>
        <div class="order-confirmation__block order-confirmation__gift-options"></div>
        <div class="order-confirmation__block order-confirmation__order-product-list"></div>
        <div class="order-confirmation__block order-confirmation__footer"></div>
      </div>
    </div>
`);

  // Order confirmation elements
  const $orderConfirmationHeader = orderConfirmationFragment.querySelector(
    '.order-confirmation__header',
  );
  const $orderStatus = orderConfirmationFragment.querySelector(
    '.order-confirmation__order-status',
  );
  const $shippingStatus = orderConfirmationFragment.querySelector(
    '.order-confirmation__shipping-status',
  );
  const $customerDetails = orderConfirmationFragment.querySelector(
    '.order-confirmation__customer-details',
  );
  const $orderCostSummary = orderConfirmationFragment.querySelector(
    '.order-confirmation__order-cost-summary',
  );
  const $orderGiftOptions = orderConfirmationFragment.querySelector(
    '.order-confirmation__gift-options',
  );
  const $orderProductList = orderConfirmationFragment.querySelector(
    '.order-confirmation__order-product-list',
  );
  const $orderConfirmationFooter = orderConfirmationFragment.querySelector(
    '.order-confirmation__footer',
  );

  const labels = await fetchPlaceholders();
  const langDefinitions = {
    default: {
      ...labels,
    },
  };
  await initializers.mountImmediately(orderApi.initialize, { orderData, langDefinitions });

  block.replaceChildren(orderConfirmationFragment);

  const handleSignUpClick = async ({
    inputsDefaultValueSet,
    addressesData,
  }) => {
    const signUpForm = document.createElement('div');
    AuthProvider.render(SignUp, {
      routeSignIn: () => rootLink('/customer/login'),
      routeRedirectOnEmailConfirmationClose: () => rootLink('/customer/account'),
      inputsDefaultValueSet,
      addressesData,
      slots: {
        ...authPrivacyPolicyConsentSlot,
      },
    })(signUpForm);

    await createModal(signUpForm);
  };

  OrderProvider.render(OrderHeader, {
    handleEmailAvailability: checkoutApi.isEmailAvailable,
    handleSignUpClick,
    orderData,
  })($orderConfirmationHeader);

  OrderProvider.render(OrderStatus, { slots: { OrderActions: () => null } })(
    $orderStatus,
  );
  OrderProvider.render(ShippingStatus)($shippingStatus);
  OrderProvider.render(CustomerDetails)($customerDetails);
  OrderProvider.render(OrderCostSummary)($orderCostSummary);
  CartProvider.render(GiftOptions, {
    view: 'order',
    dataSource: 'order',
    isEditable: false,
    readOnlyFormOrderView: 'secondary',
    slots: {
      SwatchImage: swatchImageSlot,
    },
  })($orderGiftOptions);
  OrderProvider.render(OrderProductList, {
    slots: {
      Footer: (ctx) => {
        const giftOptions = document.createElement('div');

        CartProvider.render(GiftOptions, {
          item: ctx.item,
          view: 'product',
          dataSource: 'order',
          isEditable: false,
          slots: {
            SwatchImage: swatchImageSlot,
          },
        })(giftOptions);

        ctx.appendChild(giftOptions);
      },
      CartSummaryItemImage: (ctx) => {
        const { data, defaultImageProps } = ctx;
        tryRenderAemAssetsImage(ctx, {
          alias: data.product.sku,
          imageProps: defaultImageProps,

          params: {
            width: defaultImageProps.width,
            height: defaultImageProps.height,
          },
        });
      },
    },
  })($orderProductList);

  $orderConfirmationFooter.innerHTML = `
    <div class="order-confirmation-footer__continue-button"></div>
    <div class="order-confirmation-footer__contact-support">
      <p>
        Need help?
        <a
          href="${rootLink(SUPPORT_PATH)}"
          rel="noreferrer"
          class="order-confirmation-footer__contact-support-link"
          data-testid="order-confirmation-footer__contact-support-link"
        >
          Contact us
        </a>
      </p>
    </div>
  `;

  const $orderConfirmationFooterContinueBtn = $orderConfirmationFooter.querySelector(
    '.order-confirmation-footer__continue-button',
  );

  UI.render(Button, {
    children: 'Continue shopping',
    'data-testid': 'order-confirmation-footer__continue-button',
    className: 'order-confirmation-footer__continue-button',
    size: 'medium',
    variant: 'primary',
    type: 'submit',
    href: rootLink('/'),
  })($orderConfirmationFooterContinueBtn);
}

async function setJsonLdProduct(product) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  // get variants
  const { data } = await pdpApi.fetchGraphQl(`
    query GET_PRODUCT_VARIANTS($sku: String!) {
      variants(sku: $sku) {
        variants {
          product {
            sku
            name
            inStock
            images(roles: ["image"]) {
              url
            }
            ...on SimpleProductView {
              price {
                final { amount { currency value } }
              }
            }
          }
        }
      }
    }
  `, {
    method: 'GET',
    variables: { sku },
  });

  const variants = data?.variants?.variants || [];

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}

/**
 * Returns the configuration for an image slot.
 * @param ctx - The context of the slot.
 * @returns The configuration for the image slot.
 */
function imageSlotConfig(ctx) {
  const { data, defaultImageProps } = ctx;
  return {
    alias: data.sku,
    imageProps: defaultImageProps,

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  };
}
