"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const response_1 = require("../response");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = response_1.MESSAGES.SERVER_ERROR;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();
            if (typeof exResponse === 'object' && exResponse !== null) {
                const res = exResponse;
                if (res.message && typeof res.message === 'object' && res.message.uz) {
                    message = res.message;
                }
                else if (typeof res.message === 'string') {
                    message = { uz: res.message, ru: res.message };
                }
                else if (Array.isArray(res.message)) {
                    const joined = res.message.map(String).join('; ');
                    message = { uz: joined, ru: joined };
                }
            }
            else if (typeof exResponse === 'string') {
                message = { uz: exResponse, ru: exResponse };
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
            message = { uz: exception.message, ru: exception.message };
        }
        response.status(status).json({
            status: false,
            message,
            data: null,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map