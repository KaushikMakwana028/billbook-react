import Swal from 'sweetalert2';

/**
 * BillBook Custom SweetAlert2 Theme Wrapper
 * Designed to seamlessly blend with BillBook UI tokens (--card, --ink, --mut, --line, Urbanist font).
 */

const baseSwalOptions = {
  buttonsStyling: false,
  showClass: {
    popup: 'swal2-show animate-in zoom-in-95 duration-200',
  },
  hideClass: {
    popup: 'swal2-hide animate-out zoom-out-95 duration-150',
  },
  customClass: {
    popup: 'bb-swal-popup',
    title: 'bb-swal-title',
    htmlContainer: 'bb-swal-html',
    actions: 'bb-swal-actions',
    confirmButton: 'bb-swal-confirm',
    cancelButton: 'bb-swal-cancel',
  },
};

/**
 * Confirmation dialog (e.g. for Disconnect WhatsApp, Delete Record, etc.)
 * Returns a Promise that resolves to true if confirmed, false otherwise.
 */
export const confirmDialog = async ({
  title = 'Are you sure?',
  text = '',
  html = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  icon = 'warning',
  customIconHtml = '',
} = {}) => {
  const result = await Swal.fire({
    ...baseSwalOptions,
    title,
    text: !html ? text : undefined,
    html: customIconHtml
      ? `<div class="bb-swal-custom-icon">${customIconHtml}</div>${html || (text ? `<p>${text}</p>` : '')}`
      : html || undefined,
    icon: customIconHtml ? undefined : icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true, // Cancel on left, Confirm on right
    focusCancel: true,
    customClass: {
      popup: 'bb-swal-popup',
      title: 'bb-swal-title',
      htmlContainer: 'bb-swal-html',
      actions: 'bb-swal-actions',
      confirmButton: isDestructive ? 'bb-swal-confirm bb-swal-confirm-danger' : 'bb-swal-confirm',
      cancelButton: 'bb-swal-cancel',
    },
  });

  return result.isConfirmed;
};

/**
 * Success Alert
 */
export const showSuccessAlert = ({ title = 'Success!', text = '', html = '', timer = 2500 } = {}) => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'success',
    title,
    text: !html ? text : undefined,
    html: html || undefined,
    timer,
    showConfirmButton: !timer,
    confirmButtonText: 'Great!',
  });
};

/**
 * Error Alert
 */
export const showErrorAlert = ({ title = 'Oops...', text = '', html = '' } = {}) => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'error',
    title,
    text: !html ? text : undefined,
    html: html || undefined,
    confirmButtonText: 'Okay',
  });
};

/**
 * Info Alert
 */
export const showInfoAlert = ({ title = 'Information', text = '', html = '' } = {}) => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'info',
    title,
    text: !html ? text : undefined,
    html: html || undefined,
    confirmButtonText: 'Got It',
  });
};

export default Swal;
