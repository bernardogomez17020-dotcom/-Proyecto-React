import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { semesterService } from '../../services/semesterService';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  name: Yup.string().required('Requerido'),
  code: Yup.string().required('Requerido'),
  start_date: Yup.date().required('Requerido').typeError('Fecha inválida'),
  end_date: Yup.date()
    .required('Requerido')
    .typeError('Fecha inválida')
    .min(Yup.ref('start_date'), 'La fecha de fin debe ser posterior a la de inicio'),
});

const empty = { name: '', code: '', start_date: '', end_date: '', is_active: false };

const SemesterForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<Record<string, any>>(empty);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    semesterService.getById(id).then(data => {
      if (data) setInitial(data);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      code: values.code,
      start_date: values.start_date,
      end_date: values.end_date,
      is_active: values.is_active,
    };
    const result = id
      ? await semesterService.update(id, payload)
      : await semesterService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Completado', text: 'Semestre guardado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/semesters/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el semestre. Verifica que las fechas sean válidas y el código no exista.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Semestre' : 'Crear Semestre'} />
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
                <label className="mb-2.5 block text-black dark:text-white">Nombre <span className="text-meta-1">*</span></label>
                <Field type="text" name="name" placeholder="Ej: 2026-1" className={inputClass} />
                <ErrorMessage name="name" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Código <span className="text-meta-1">*</span></label>
                <Field type="text" name="code" placeholder="Ej: SEM-2026-1" className={inputClass} />
                <ErrorMessage name="code" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Fecha de inicio <span className="text-meta-1">*</span></label>
                <Field type="date" name="start_date" className={inputClass} />
                <ErrorMessage name="start_date" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Fecha de fin <span className="text-meta-1">*</span></label>
                <Field type="date" name="end_date" className={inputClass} />
                <ErrorMessage name="end_date" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <Field type="checkbox" name="is_active" className="h-5 w-5 cursor-pointer" />
                <label className="text-black dark:text-white">Semestre activo (desactiva automáticamente el anterior)</label>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/semesters/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
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

export default SemesterForm;
