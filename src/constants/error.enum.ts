export const ErrorMessages = {
    PASSWORD_TOO_SHORT : 'Mật khẩu phải có ít nhất 6 ký tự.',
    PASSWORD_REQUIRES_NON_ALPHANUMERIC : 'Mật khẩu phải có ít nhất một ký tự không phải chữ và số.',
    PASSWORD_REQUIRES_DIGIT : 'Mật khẩu phải có ít nhất một chữ số (0 - 9).',
    PASSWORD_REQUIRES_LOWER : 'Mật khẩu phải có ít nhất một chữ thường (a - z).',
    PASSWORD_REQUIRES_UPPER : 'Mật khẩu phải có ít nhất một chữ hoa (A - Z).',
    DEFAULT_ERROR : 'Đã xảy ra lỗi không xác định.',
    CONCURRENCY_FAILURE : 'Thao tác cập nhật thất bại, không thể đồng thời sửa đổi dữ liệu.',
    PASSWORD_MISMATCH : 'Mật khẩu không đúng.',
    INVALID_TOKEN : 'Token không hợp lệ.',
    LOGIN_ALREADY_ASSOCIATED : 'Người dùng với thông tin đăng nhập này đã tồn tại.',
    INVALID_USERNAME : 'Tên người dùng không hợp lệ, chỉ có thể chứa các chữ cái hoặc chữ số.',
    INVALID_EMAIL : 'Email không hợp lệ.',
    DUPLICATE_USERNAME : 'Tên người dùng đã được sử dụng.',
    DUPLICATE_EMAIL : 'Email đã được sử dụng.',
    INVALID_ROLENAME : 'Tên vai trò không hợp lệ.',
    DUPLICATE_ROLENAME : 'Tên vai trò đã được sử dụng.',
    USER_ALREADY_HAS_PASSWORD : 'Người dùng đã đặt mật khẩu.',
    USER_LOCKOUT_NOT_ENABLED : 'Khóa không được bật cho người dùng này.',
    USER_ALREADY_IN_ROLE : 'Người dùng đã có vai trò này.',
    USER_NOT_IN_ROLE : 'Người dùng không có vai trò này.',
};

export default ErrorMessages;


export const PASSWORD = {
    value: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/,
    message: 'MSG0001'
};

export const EMAIL = {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'MSG0002'
};