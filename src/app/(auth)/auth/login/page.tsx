"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";

import authenticateService from "@/services/auth/authenticate.service";
import proxyService from "@/services/proxy/proxy.service";
import tokenService from "@/services/token.service";
import cacheService from "@/services/cache.service";
import utilsService from "@/services/utils/utils.service";
import { LOCAL_STORAGE_TOKEN, USER_ROLE, AES_IV } from "@/constants/auth.enum";
import "./login.scss";
import {
  dispatchLogout,
  sendAuthorizationRequest,
} from "@/services/auth/auth-sso.service";

interface LoginFormData {
  username: string;
  password: string;
  newPassword?: string;
  confirmPassword?: string;
  rememberMe?: boolean;
}

interface LoginResult {
  accessToken: string;
  userId?: string;
  roles: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const [requireChangePassword, setRequireChangePassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const redirectUrl = "";

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
      newPassword: "",
      confirmPassword: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    setIsLoaded(true);
    const code = searchParams.get("code");

    const verifySSOCode = async (code: string) => {
      try {
        const response = await proxyService.post<{ result: LoginResult }>(
          "/api/TokenAuth/VerifyCode",
          { code, redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI }
        );
        processLogin(response.data?.result, true);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        setErrorLogin(err.response?.data?.message || "Lỗi xác thực SSO");
      }
    };

    if (code) verifySSOCode(code);
    if (cacheService.get(LOCAL_STORAGE_TOKEN)) router.push("/quan-tri");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoginSubmit = async (data: LoginFormData) => {
    setErrorLogin(null);
    try {
      const result = await authenticateService.authenticate(
        data.username,
        data.password,
        data.newPassword
      );
      processLogin(result);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { code?: string } } } };
      const errCode = error?.response?.data?.error?.code;
      if (errCode === "User:RequireChangePassword") {
        setRequireChangePassword(true);
      } else {
        setErrorLogin("Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.");
      }
    }
  };

  const processLogin = (result: LoginResult | string, isSSO = false) => {
    if (typeof result === "string") { setErrorLogin(result); return; }
    tokenService.storeToken(result.accessToken);
    const tokenDecode = decodeURIComponent(
      escape(utilsService.base64ToArray(result.accessToken?.split(".")[1]))
    );
    const tokenJson = JSON.parse(tokenDecode) as Record<string, unknown>;
    tokenJson.userId = result.userId || "";
    tokenJson.loginSSO = isSSO;
    utilsService.setUserInfo(tokenJson);
    cacheService.set(USER_ROLE, utilsService.encryptAES(JSON.stringify(result.roles), AES_IV));
    window.location.href = redirectUrl || "/quan-tri";
  };

  if (!isLoaded)
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;

  return (
    <div className="login-wrapper">
      <div className="login-blob-br" />

      <div className="login-card">
        {/* ── Header: Logo + Title ── */}
        <div className="card-header">
          <div className="card-logo">
            <Image
              src="/layout/images/quochuy.png"
              width={80}
              height={80}
              alt="Quốc huy Việt Nam"
              priority
            />
          </div>
          <div className="card-org">
            Sở Khoa học và Công nghệ<br />Tỉnh Cà Mau
          </div>
          <div className="card-sub">Chính quyền điện tử</div>
        </div>

        <div className="card-divider" />

        {/* ── Form ── */}
        <div className="card-form">
          <form onSubmit={handleSubmit(onLoginSubmit)}>

            {/* Tài khoản */}
            <Controller
              name="username"
              control={control}
              rules={{ required: "Vui lòng nhập tài khoản" }}
              render={({ field }) => (
                <div className="field-group">
                  <div className="field-label">
                    <i className="pi pi-user" />
                    Tài khoản
                  </div>
                  <div className="input-wrapper">
                    <input
                      {...field}
                      id="username"
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      disabled={requireChangePassword}
                      className={errors.username ? "is-invalid" : ""}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && (
                    <div className="field-error">
                      <i className="pi pi-exclamation-circle" />{errors.username.message}
                    </div>
                  )}
                </div>
              )}
            />

            {/* Mật khẩu / Đổi mật khẩu */}
            {!requireChangePassword ? (
              <Controller
                name="password"
                control={control}
                rules={{ required: "Vui lòng nhập mật khẩu" }}
                render={({ field }) => (
                  <div className="field-group">
                    <div className="field-label">
                      <i className="pi pi-lock" />
                      Mật khẩu
                    </div>
                    <div className="input-wrapper">
                      <input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        className={errors.password ? "is-invalid" : ""}
                        autoComplete="current-password"
                      />
                    </div>
                    {errors.password && (
                      <div className="field-error">
                        <i className="pi pi-exclamation-circle" />{errors.password.message}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <>
                <Controller
                  name="newPassword"
                  control={control}
                  rules={{
                    required: "Vui lòng nhập mật khẩu mới",
                    minLength: { value: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                  }}
                  render={({ field }) => (
                    <div className="field-group">
                      <div className="field-label"><i className="pi pi-key" />Mật khẩu mới</div>
                      <div className="input-wrapper">
                        <input {...field} id="newPassword" type="password" placeholder="Nhập mật khẩu mới"
                          className={errors.newPassword ? "is-invalid" : ""} />
                      </div>
                      {errors.newPassword && <div className="field-error"><i className="pi pi-exclamation-circle" />{errors.newPassword.message}</div>}
                    </div>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={control}
                  rules={{
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (v) => v === watch("newPassword") || "Mật khẩu xác nhận không khớp",
                  }}
                  render={({ field }) => (
                    <div className="field-group">
                      <div className="field-label"><i className="pi pi-check-circle" />Xác nhận mật khẩu</div>
                      <div className="input-wrapper">
                        <input {...field} id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới"
                          className={errors.confirmPassword ? "is-invalid" : ""} />
                      </div>
                      {errors.confirmPassword && <div className="field-error"><i className="pi pi-exclamation-circle" />{errors.confirmPassword.message}</div>}
                    </div>
                  )}
                />
              </>
            )}

            {/* Ghi nhớ + Quên mật khẩu */}
            <div className="form-options">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <label className="remember-check">
                    <input type="checkbox" id="rememberMe" checked={value} onChange={onChange} />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                )}
              />
              <a className="forgot-link">Quên mật khẩu?</a>
            </div>

            {/* Error */}
            {errorLogin && (
              <div className="login-error-alert">
                <i className="pi pi-times-circle" />
                <span>{errorLogin}</span>
              </div>
            )}

            <button type="submit" className="btn-login">
              <i className="pi pi-sign-in" />
              Đăng nhập
            </button>
          </form>
        </div>

        {/* HOẶC */}
        <div className="or-divider"><span>HOẶC</span></div>

        {/* SSO */}
        <div className="sso-buttons">
          <button
            type="button"
            className="btn-sso btn-sso-login"
            onClick={() => sendAuthorizationRequest()}
          >
            <i className="pi pi-shield" />
            Đăng nhập SSO
          </button>
          <button
            type="button"
            className="btn-sso btn-sso-logout"
            onClick={() => dispatchLogout()}
          >
            <i className="pi pi-sign-out" />
            Thoát tài khoản SSO
          </button>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <p>© 2025 Sở Khoa học và Công nghệ tỉnh Cà Mau</p>
        </div>
      </div>
    </div>
  );
}
