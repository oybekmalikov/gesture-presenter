export declare enum SeminarStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    LIVE = "live",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum FileAccess {
    PUBLIC = "public",
    READABLE = "readable",
    PRIVATE = "private"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female"
}
export declare enum NotificationType {
    SEMINAR_REMINDER = "seminar_reminder",
    SEMINAR_STARTED = "seminar_started",
    FILE_DELETE_WARNING = "file_delete_warning",
    COMMENT_REPLY = "comment_reply",
    LIKE_RECEIVED = "like_received",
    SYSTEM = "system"
}
export declare enum LiveSessionStatus {
    WAITING = "waiting",
    ACTIVE = "active",
    ENDED = "ended"
}
export * from './role.enum';
