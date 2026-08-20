/** Ikki tilli xabar */
export interface I18nMessage {
  uz: string;
  ru: string;
}

/** Standart API javob formati */
export interface ApiResponse<T = any> {
  status: boolean;
  message: I18nMessage;
  data: T;
}

/** Yordamchi funksiyalar */
export function successResponse<T>(
  data: T,
  message: I18nMessage,
): ApiResponse<T> {
  return { status: true, message, data };
}

export function errorResponse(
  message: I18nMessage,
  data: any = null,
): ApiResponse {
  return { status: false, message, data };
}

/** Ko'p ishlatiladigan xabarlar */
export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: {
    uz: 'Tizimga muvaffaqiyatli kirdingiz',
    ru: 'Вы успешно вошли в систему',
  },
  LOGIN_FAILED: {
    uz: "Login yoki parol noto'g'ri",
    ru: 'Неверный логин или пароль',
  },
  UNAUTHORIZED: {
    uz: 'Avtorizatsiya talab qilinadi',
    ru: 'Требуется авторизация',
  },
  FORBIDDEN: { uz: "Ruxsat yo'q", ru: 'Доступ запрещён' },
  TOKEN_EXPIRED: {
    uz: 'Token muddati tugagan',
    ru: 'Срок действия токена истёк',
  },
  TOKEN_REFRESHED: { uz: 'Token yangilandi', ru: 'Токен обновлён' },
  LOGOUT_SUCCESS: { uz: 'Tizimdan chiqdingiz', ru: 'Вы вышли из системы' },

  // CRUD
  CREATED: { uz: 'Muvaffaqiyatli yaratildi', ru: 'Успешно создано' },
  UPDATED: { uz: 'Muvaffaqiyatli yangilandi', ru: 'Успешно обновлено' },
  DELETED: { uz: "Muvaffaqiyatli o'chirildi", ru: 'Успешно удалено' },
  FETCHED: { uz: "Ma'lumotlar olindi", ru: 'Данные получены' },
  NOT_FOUND: { uz: 'Topilmadi', ru: 'Не найдено' },

  // Users
  USER_CREATED: { uz: 'Foydalanuvchi yaratildi', ru: 'Пользователь создан' },
  USER_UPDATED: { uz: 'Foydalanuvchi yangilandi', ru: 'Пользователь обновлён' },
  USER_DELETED: { uz: "Foydalanuvchi o'chirildi", ru: 'Пользователь удалён' },
  USER_NOT_FOUND: {
    uz: 'Foydalanuvchi topilmadi',
    ru: 'Пользователь не найден',
  },
  USER_EXISTS: {
    uz: 'Bu username allaqachon mavjud',
    ru: 'Этот логин уже существует',
  },
  USER_INACTIVE: {
    uz: 'Foydalanuvchi faol emas',
    ru: 'Пользователь неактивен',
  },

  // Departments
  DEPARTMENT_CREATED: { uz: "Bo'lim yaratildi", ru: 'Отдел создан' },
  DEPARTMENT_NOT_FOUND: { uz: "Bo'lim topilmadi", ru: 'Отдел не найден' },

  // Seminars
  SEMINAR_CREATED: { uz: 'Seminar yaratildi', ru: 'Семинар создан' },
  SEMINAR_UPDATED: { uz: 'Seminar yangilandi', ru: 'Семинар обновлён' },
  SEMINAR_DELETED: { uz: "Seminar o'chirildi", ru: 'Семинар удалён' },
  SEMINAR_NOT_FOUND: { uz: 'Seminar topilmadi', ru: 'Семинар не найден' },

  // Files
  FILE_UPLOADED: {
    uz: 'Fayl muvaffaqiyatli yuklandi',
    ru: 'Файл успешно загружен',
  },
  FILE_DELETED: { uz: "Fayl o'chirildi", ru: 'Файл удалён' },
  FILE_NOT_FOUND: { uz: 'Fayl topilmadi', ru: 'Файл не найден' },
  FILE_TOO_LARGE: {
    uz: 'Fayl hajmi chegaradan oshdi',
    ru: 'Размер файла превышает лимит',
  },
  FILE_TYPE_NOT_ALLOWED: {
    uz: 'Bu fayl turi qabul qilinmaydi',
    ru: 'Этот тип файла не поддерживается',
  },

  // Interactions
  LIKED: { uz: "Like qo'yildi", ru: 'Лайк поставлен' },
  UNLIKED: { uz: 'Like olib tashlandi', ru: 'Лайк убран' },
  COMMENT_ADDED: { uz: "Izoh qo'shildi", ru: 'Комментарий добавлен' },
  COMMENT_DELETED: { uz: "Izoh o'chirildi", ru: 'Комментарий удалён' },
  SAVED: { uz: 'Saqlandi', ru: 'Сохранено' },
  UNSAVED: {
    uz: 'Saqlanganlardan olib tashlandi',
    ru: 'Удалено из сохранённых',
  },

  // General
  SERVER_ERROR: { uz: 'Ichki server xatosi', ru: 'Внутренняя ошибка сервера' },
  VALIDATION_ERROR: {
    uz: "Ma'lumotlarni tekshirishda xatolik",
    ru: 'Ошибка валидации данных',
  },
  BAD_REQUEST: { uz: "Noto'g'ri so'rov", ru: 'Некорректный запрос' },
} as const;
