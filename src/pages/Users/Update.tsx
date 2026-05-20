import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { userService } from '../../services/userService';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  email: Yup.string().email('Email inválido').required('Requerido'),
  code: Yup.string().required('Requerido'),
});

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  STUDENT: 'Estudiante',
};

const UserUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!id) return;
    userService.getById(id).then(data => {
      if (!data) return;
      const flat: Record<string, any> = { ...data };
      if (data.profile) {
        Object.assign(flat, data.profile);
        delete flat.profile;
      }
      setInitial(flat);
    });
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const result = id ? await userService.update(id, values) : null;
    if (result) {
      Swal.fire({ title: 'Completado', text: 'Usuario actualizado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/users/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo actualizar el usuario', icon: 'error' });
    }
  };

  if (!initial) return <div className="p-6">Cargando...</div>;

  const role = initial.role as string;
  const hasProfile = role === 'STUDENT' || role === 'TEACHER';

  return (
    <div>
      <Breadcrumb pageName="Editar Usuario" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <Formik
            initialValues={initial}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">Correo electrónico <span className="text-meta-1">*</span></label>
                <Field type="email" name="email" className={inputClass} />
                <ErrorMessage name="email" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Código institucional <span className="text-meta-1">*</span></label>
                <Field type="text" name="code" className={inputClass} />
                <ErrorMessage name="code" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Rol</label>
                <div className={`${inputClass} bg-gray-100 dark:bg-meta-4 cursor-not-allowed`}>
                  {ROLE_LABELS[role] ?? role}
                </div>
                <p className="mt-1 text-xs text-gray-400">El rol no puede modificarse después de la creación.</p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Field type="checkbox" name="is_active" className="h-5 w-5 cursor-pointer" />
                <label className="text-black dark:text-white">Usuario activo en el sistema</label>
              </div>

              {hasProfile && (
                <>
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">Nombre</label>
                    <Field type="text" name="first_name" className={inputClass} />
                  </div>

                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">Apellido</label>
                    <Field type="text" name="last_name" className={inputClass} />
                  </div>

                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">Identificación</label>
                    <Field type="text" name="identification" className={inputClass} />
                  </div>
                </>
              )}

              {role === 'TEACHER' && (
                <>
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">Teléfono</label>
                    <Field type="text" name="phone" className={inputClass} />
                  </div>

                  <div>
                    <label className="mb-2.5 block text-black dark:text-white">Especialidad</label>
                    <Field type="text" name="specialty" className={inputClass} />
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
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default UserUpdate;
