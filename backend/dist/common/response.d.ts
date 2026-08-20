export interface I18nMessage {
    uz: string;
    ru: string;
}
export interface ApiResponse<T = any> {
    status: boolean;
    message: I18nMessage;
    data: T;
}
export declare function successResponse<T>(data: T, message: I18nMessage): ApiResponse<T>;
export declare function errorResponse(message: I18nMessage, data?: any): ApiResponse;
export declare const MESSAGES: {
    readonly LOGIN_SUCCESS: {
        readonly uz: "Tizimga muvaffaqiyatli kirdingiz";
        readonly ru: "Вы успешно вошли в систему";
    };
    readonly LOGIN_FAILED: {
        readonly uz: "Login yoki parol noto'g'ri";
        readonly ru: "Неверный логин или пароль";
    };
    readonly UNAUTHORIZED: {
        readonly uz: "Avtorizatsiya talab qilinadi";
        readonly ru: "Требуется авторизация";
    };
    readonly FORBIDDEN: {
        readonly uz: "Ruxsat yo'q";
        readonly ru: "Доступ запрещён";
    };
    readonly TOKEN_EXPIRED: {
        readonly uz: "Token muddati tugagan";
        readonly ru: "Срок действия токена истёк";
    };
    readonly TOKEN_REFRESHED: {
        readonly uz: "Token yangilandi";
        readonly ru: "Токен обновлён";
    };
    readonly LOGOUT_SUCCESS: {
        readonly uz: "Tizimdan chiqdingiz";
        readonly ru: "Вы вышли из системы";
    };
    readonly CREATED: {
        readonly uz: "Muvaffaqiyatli yaratildi";
        readonly ru: "Успешно создано";
    };
    readonly UPDATED: {
        readonly uz: "Muvaffaqiyatli yangilandi";
        readonly ru: "Успешно обновлено";
    };
    readonly DELETED: {
        readonly uz: "Muvaffaqiyatli o'chirildi";
        readonly ru: "Успешно удалено";
    };
    readonly FETCHED: {
        readonly uz: "Ma'lumotlar olindi";
        readonly ru: "Данные получены";
    };
    readonly NOT_FOUND: {
        readonly uz: "Topilmadi";
        readonly ru: "Не найдено";
    };
    readonly USER_CREATED: {
        readonly uz: "Foydalanuvchi yaratildi";
        readonly ru: "Пользователь создан";
    };
    readonly USER_UPDATED: {
        readonly uz: "Foydalanuvchi yangilandi";
        readonly ru: "Пользователь обновлён";
    };
    readonly USER_DELETED: {
        readonly uz: "Foydalanuvchi o'chirildi";
        readonly ru: "Пользователь удалён";
    };
    readonly USER_NOT_FOUND: {
        readonly uz: "Foydalanuvchi topilmadi";
        readonly ru: "Пользователь не найден";
    };
    readonly USER_EXISTS: {
        readonly uz: "Bu username allaqachon mavjud";
        readonly ru: "Этот логин уже существует";
    };
    readonly USER_INACTIVE: {
        readonly uz: "Foydalanuvchi faol emas";
        readonly ru: "Пользователь неактивен";
    };
    readonly DEPARTMENT_CREATED: {
        readonly uz: "Bo'lim yaratildi";
        readonly ru: "Отдел создан";
    };
    readonly DEPARTMENT_NOT_FOUND: {
        readonly uz: "Bo'lim topilmadi";
        readonly ru: "Отдел не найден";
    };
    readonly SEMINAR_CREATED: {
        readonly uz: "Seminar yaratildi";
        readonly ru: "Семинар создан";
    };
    readonly SEMINAR_UPDATED: {
        readonly uz: "Seminar yangilandi";
        readonly ru: "Семинар обновлён";
    };
    readonly SEMINAR_DELETED: {
        readonly uz: "Seminar o'chirildi";
        readonly ru: "Семинар удалён";
    };
    readonly SEMINAR_NOT_FOUND: {
        readonly uz: "Seminar topilmadi";
        readonly ru: "Семинар не найден";
    };
    readonly FILE_UPLOADED: {
        readonly uz: "Fayl muvaffaqiyatli yuklandi";
        readonly ru: "Файл успешно загружен";
    };
    readonly FILE_DELETED: {
        readonly uz: "Fayl o'chirildi";
        readonly ru: "Файл удалён";
    };
    readonly FILE_NOT_FOUND: {
        readonly uz: "Fayl topilmadi";
        readonly ru: "Файл не найден";
    };
    readonly FILE_TOO_LARGE: {
        readonly uz: "Fayl hajmi chegaradan oshdi";
        readonly ru: "Размер файла превышает лимит";
    };
    readonly FILE_TYPE_NOT_ALLOWED: {
        readonly uz: "Bu fayl turi qabul qilinmaydi";
        readonly ru: "Этот тип файла не поддерживается";
    };
    readonly LIKED: {
        readonly uz: "Like qo'yildi";
        readonly ru: "Лайк поставлен";
    };
    readonly UNLIKED: {
        readonly uz: "Like olib tashlandi";
        readonly ru: "Лайк убран";
    };
    readonly COMMENT_ADDED: {
        readonly uz: "Izoh qo'shildi";
        readonly ru: "Комментарий добавлен";
    };
    readonly COMMENT_DELETED: {
        readonly uz: "Izoh o'chirildi";
        readonly ru: "Комментарий удалён";
    };
    readonly SAVED: {
        readonly uz: "Saqlandi";
        readonly ru: "Сохранено";
    };
    readonly UNSAVED: {
        readonly uz: "Saqlanganlardan olib tashlandi";
        readonly ru: "Удалено из сохранённых";
    };
    readonly SERVER_ERROR: {
        readonly uz: "Ichki server xatosi";
        readonly ru: "Внутренняя ошибка сервера";
    };
    readonly VALIDATION_ERROR: {
        readonly uz: "Ma'lumotlarni tekshirishda xatolik";
        readonly ru: "Ошибка валидации данных";
    };
    readonly BAD_REQUEST: {
        readonly uz: "Noto'g'ri so'rov";
        readonly ru: "Некорректный запрос";
    };
};
