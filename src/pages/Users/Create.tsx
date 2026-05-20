import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { userService } from '../../services/userService';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  email: Yup.string().email('Email inválido').required('Requerido'),
  password: Yup.string().required('Requerido'),
  code: Yup.string().required('Requerido'),
  role: Yup.string().required('Requerido'),
  first_name: Yup.string().when('role', {
    is: (r: string) => r === 'STUDENT' || r === 'TEACHER',
    then: s => s.required('Requerido'),
    otherwise: s => s.optional(),
  }),
  last_name: Yup.string().when('role', {
    is: (r: string) => r === 'STUDENT' || r === 'TEACHER',
    then: s => s.required('Requerido'),
    otherwise: s => s.optional(),
  }),
  identification: Yup.string().when('role', {
    is: (r: string) => r === 'STUDENT' || r === 'TEACHER',
    then: s => s.required('Requerido'),
    otherwise: s => s.optional(),
  }),
});

const UserCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: Record<string, any>) => {
    const payload: Record<string, any> = {
      email: values.email,
      password: values.password,
      code: values.code,
      role: values.role,
    };
    if (values.role === 'STUDENT' || values.role === 'TEACHER') {
      payload.first_name = values.first_name;
      payload.last_name = values.last_name;
      payload.identification = values.identification;
    }
    if (values.role === 'TEACHER') {
      if (values.phone) payload.phone = values.phone;
      if (values.specialty) payload.specialty = values.specialty;
    }
    const result = await userService.create(payload);
    if (result) {
      Swal.fire({ title: 'Completado', text: 'Usuario creado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/users/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo crear el usuario. Verifica que el email y código no existan.', icon: 'error' });
    }
  };

  return (
    <div>
      <Breadcrumb pageName="Crear Usuario" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <Formik
            initialValues={{ email: '', password: '', code: '', role: '', first_name: '', last_name: '', identification: '', phone: '', specialty: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values }) => (
              <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-black dark:text-white">Correo electrónico <span className="text-meta-1">*</span></label>
                  <Field type="email" name="email" placeholder="usuario@correo.com" className={inputClass} />
                  <ErrorMessage name="email" component="p" className="mt-1 text-xs text-meta-1" />
                </div>

                <div>
                  <label className="mb-2.5 block text-black dark:text-white">Contraseña <span className="text-meta-1">*</span></label>
                  <Field type="password" name="password" placeholder="••••••••" className={inputClass} />
                  <ErrorMessage name="password" component="p" className="mt-1 text-xs text-meta-1" />
                </div>

                <div>
                  <label className="mb-2.5 block text-black dark:text-white">Código institucional <span className="text-meta-1">*</span></label>
                  <Field type="text" name="code" placeholder="Ej: DOC-001" className={inputClass} />
                  <ErrorMessage name="code" component="p" className="mt-1 text-xs text-meta-1" />
                </div>

                <div>
                  <label className="mb-2.5 block text-black dark:text-white">Rol <span className="text-meta-1">*</span></label>
                  <Field as="select" name="role" className={inputClass}>
                    <option value="">Seleccionar...</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="TEACHER">Docente</option>
                    <option value="STUDENT">Estudiante</option>
                  </Field>
                  <ErrorMessage name="role" component="p" className="mt-1 text-xs text-meta-1" />
                </div>

                {(values.role === 'STUDENT' || values.role === 'TEACHER') && (
                  <>
                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">Nombre <span className="text-meta-1">*</span></label>
                      <Field type="text" name="first_name" placeholder="Ej: Juan" className={inputClass} />
                      <ErrorMessage name="first_name" component="p" className="mt-1 text-xs text-meta-1" />
                    </div>

                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">Apellido <span className="text-meta-1">*</span></label>
                      <Field type="text" name="last_name" placeholder="Ej: Pérez" className={inputClass} />
                      <ErrorMessage name="last_name" component="p" className="mt-1 text-xs text-meta-1" />
                    </div>

                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">Identificación <span className="text-meta-1">*</span></label>
                      <Field type="text" name="identification" placeholder="Ej: 1234567890" className={inputClass} />
                      <ErrorMessage name="identification" component="p" className="mt-1 text-xs text-meta-1" />
                    </div>
                  </>
                )}

                {values.role === 'TEACHER' && (
                  <>
                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">Teléfono</label>
                      <Field type="text" name="phone" placeholder="Ej: 3001234567" className={inputClass} />
                    </div>

                    <div>
                      <label className="mb-2.5 block text-black dark:text-white">Especialidad</label>
                      <Field type="text" name="specialty" placeholder="Ej: Matemáticas" className={inputClass} />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex gap-4 pt-2">
                  <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                    Guardar
                  </button>
                  <button type="button" onClick={() => navigate('/users/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
                    Cancelar
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default UserCreate;
