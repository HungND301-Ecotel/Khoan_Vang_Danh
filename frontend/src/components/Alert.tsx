import Swal from 'sweetalert2';

// MUI Dialog dùng z-index 1300, cần vượt qua để hiện trên modal
const HIGH_Z_INDEX = 9999;

export const showSuccessAlert = (message = 'Bạn đã lưu thành công.') => {
    return Swal.fire({
        title: 'Thành công!',
        text: message,
        icon: 'success',
        confirmButtonText: 'Đồng ý',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { container: 'swal-on-top' },
        didOpen: (popup) => {
            const container = popup.closest('.swal2-container') as HTMLElement;
            if (container) container.style.zIndex = String(HIGH_Z_INDEX);
        },
    });
};

export const showErrorAlert = (message = 'Đã xảy ra lỗi.') => {
    return Swal.fire({
        title: 'Lỗi!',
        text: message,
        icon: 'error',
        confirmButtonText: 'Đóng',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true,
        customClass: { container: 'swal-on-top' },
        didOpen: (popup) => {
            const container = popup.closest('.swal2-container') as HTMLElement;
            if (container) container.style.zIndex = String(HIGH_Z_INDEX);
        },
    });
};

export const showConfirmAlert = (message = 'Bạn có chắc chắn không?') => {
    return Swal.fire({
        title: 'Xác nhận',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        customClass: { container: 'swal-on-top' },
        didOpen: (popup) => {
            const container = popup.closest('.swal2-container') as HTMLElement;
            if (container) container.style.zIndex = String(HIGH_Z_INDEX);
        },
    });
};
