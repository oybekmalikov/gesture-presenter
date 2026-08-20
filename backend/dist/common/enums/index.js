"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionStatus = exports.NotificationType = exports.Gender = exports.FileAccess = exports.SeminarStatus = void 0;
var SeminarStatus;
(function (SeminarStatus) {
    SeminarStatus["DRAFT"] = "draft";
    SeminarStatus["SCHEDULED"] = "scheduled";
    SeminarStatus["LIVE"] = "live";
    SeminarStatus["COMPLETED"] = "completed";
    SeminarStatus["CANCELLED"] = "cancelled";
})(SeminarStatus || (exports.SeminarStatus = SeminarStatus = {}));
var FileAccess;
(function (FileAccess) {
    FileAccess["PUBLIC"] = "public";
    FileAccess["READABLE"] = "readable";
    FileAccess["PRIVATE"] = "private";
})(FileAccess || (exports.FileAccess = FileAccess = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
})(Gender || (exports.Gender = Gender = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["SEMINAR_REMINDER"] = "seminar_reminder";
    NotificationType["SEMINAR_STARTED"] = "seminar_started";
    NotificationType["FILE_DELETE_WARNING"] = "file_delete_warning";
    NotificationType["COMMENT_REPLY"] = "comment_reply";
    NotificationType["LIKE_RECEIVED"] = "like_received";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var LiveSessionStatus;
(function (LiveSessionStatus) {
    LiveSessionStatus["WAITING"] = "waiting";
    LiveSessionStatus["ACTIVE"] = "active";
    LiveSessionStatus["ENDED"] = "ended";
})(LiveSessionStatus || (exports.LiveSessionStatus = LiveSessionStatus = {}));
__exportStar(require("./role.enum"), exports);
//# sourceMappingURL=index.js.map