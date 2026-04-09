import ErrorMessages from "@/constants/errorMessage.enum";

/**
 * Interface định nghĩa cấu trúc lỗi trả về từ ABP Framework
 */
interface AbpErrorResponse {
  code?: string;
  message?: string;
  details?: string;
  data?: any;
}

export const errorMessageHandlingService = {
  getErrorMessage,
};

/**
 * Hàm xử lý và chuyển đổi mã lỗi từ server sang thông báo thân thiện
 * @param responseData Dữ liệu lỗi từ API (response.data.error)
 * @returns Chuỗi thông báo lỗi đã được xử lý
 */
function getErrorMessage(responseData: AbpErrorResponse | null | undefined): string {
  if (!responseData) return ErrorMessages.DEFAULT_ERROR || "Đã có lỗi xảy ra";

  let errorCode = responseData.code;

  // Xử lý các lỗi thuộc module Identity của ABP Framework
  if (errorCode && errorCode.includes("Volo.Abp.Identity")) {
    const slicedCode = sliceErrorCode(errorCode);
    
    switch (slicedCode) {
      case "PasswordTooShort":
        return ErrorMessages.PASSWORD_TOO_SHORT;
      case "PasswordRequiresNonAlphanumeric":
        return ErrorMessages.PASSWORD_REQUIRES_NON_ALPHANUMERIC;
      case "PasswordRequiresDigit":
        return ErrorMessages.PASSWORD_REQUIRES_DIGIT;
      case "PasswordRequiresLower":
        return ErrorMessages.PASSWORD_REQUIRES_LOWER;
      case "PasswordRequiresUpper":
        return ErrorMessages.PASSWORD_REQUIRES_UPPER;
      case "DefaultError":
        return ErrorMessages.DEFAULT_ERROR;
      case "ConcurrencyFailure":
        return ErrorMessages.CONCURRENCY_FAILURE;
      case "PasswordMismatch":
        return ErrorMessages.PASSWORD_MISMATCH;
      case "InvalidToken":
        return ErrorMessages.INVALID_TOKEN;
      case "LoginAlreadyAssociated":
        return ErrorMessages.LOGIN_ALREADY_ASSOCIATED;
      case "InvalidUserName":
        return ErrorMessages.INVALID_USERNAME;
      case "InvalidEmail":
        return ErrorMessages.INVALID_EMAIL;
      case "DuplicateUserName":
        return ErrorMessages.DUPLICATE_USERNAME;
      case "DuplicateEmail":
        return ErrorMessages.DUPLICATE_EMAIL;
      case "InvalidRoleName":
        return ErrorMessages.INVALID_ROLENAME;
      case "DuplicateRoleName":
        return ErrorMessages.DUPLICATE_ROLENAME;
      case "UserAlreadyHasPassword":
        return ErrorMessages.USER_ALREADY_HAS_PASSWORD;
      case "UserLockoutNotEnabled":
        return ErrorMessages.USER_LOCKOUT_NOT_ENABLED;
      case "UserAlreadyInRole":
        return ErrorMessages.USER_ALREADY_IN_ROLE;
      case "UserNotInRole":
        return ErrorMessages.USER_NOT_IN_ROLE;
      default:
        // Trả về message mặc định từ server nếu không khớp case nào
        return responseData.message || ErrorMessages.DEFAULT_ERROR;
    }
  }

  // Nếu không phải lỗi Identity, ưu tiên hiển thị message từ server hoặc details
  return responseData.message || responseData.details || ErrorMessages.DEFAULT_ERROR;
}

/**
 * Cắt bỏ tiền tố "Volo.Abp.Identity:" để lấy mã lỗi chính
 */
function sliceErrorCode(originCode: string): string {
  // Chuỗi "Volo.Abp.Identity:" có độ dài 18 ký tự
  return originCode.startsWith("Volo.Abp.Identity:") 
    ? originCode.slice(18) 
    : originCode;
}

export default errorMessageHandlingService;