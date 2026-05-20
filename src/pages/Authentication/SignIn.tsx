import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { User } from "../../models/User";
import SecurityService from '../../services/securityService';
import { useNavigate } from "react-router-dom";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (values: Pick<User, 'email' | 'password'>) => {
    setLoginError(null);
    try {
      const loggedUser = await SecurityService.login(values as User);
      if (loggedUser?.role === 'ADMIN') navigate('/careers/list');
      else if (loggedUser?.role === 'TEACHER') navigate('/rubrics/list');
      else navigate('/student/my-evaluations');
    } catch {
      setLoginError('Credenciales inválidas. Verifique su correo y contraseña.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-2 dark:bg-boxdark-2">
      <div className="w-full max-w-md rounded-sm border border-stroke bg-white p-8 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Sistema de Evaluación por Rúbricas
          </h2>
          <p className="mt-2 text-sm text-body dark:text-bodydark">
            Ingrese sus credenciales para continuar
          </p>
        </div>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={Yup.object({
            email: Yup.string().email("Email inválido").required("El email es obligatorio"),
            password: Yup.string().required("La contraseña es obligatoria"),
          })}
          onSubmit={handleLogin}
        >
          {({ handleSubmit }) => (
            <Form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Correo electrónico
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className="w-full rounded border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
                <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-500" />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-black dark:text-white">
                  Contraseña
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className="w-full rounded border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
                <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-500" />
              </div>

              {loginError && (
                <p className="text-sm text-red-500">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
              >
                Iniciar Sesión
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SignIn;
