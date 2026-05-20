import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { subjectService } from '../../services/subjectService';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  name: Yup.string().required('Requerido'),
  code: Yup.string().required('Requerido'),
  credits: Yup.number()
    .required('Requerido')
    .typeError('Debe ser un número')
    .integer('Debe ser un número entero')
    .min(1, 'Los créditos deben ser mayor a cero'),
});

const empty = { name: '', code: '', description: '', credits: '' };

const SubjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<Record<string, any>>(empty);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    subjectService.getById(id).then(data => {
      if (data) setInitial({ name: data.name ?? '', code: data.code ?? '', description: data.description ?? '', credits: data.credits ?? '' });
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      code: values.code,
      description: values.description,
      credits: Number(values.credits),
    };
    const result = id
      ? await subjectService.update(id, payload)
      : await subjectService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Completado', text: 'Asignatura guardada correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/subjects/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar. Verifica que el código no exista y los créditos sean válidos.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Asignatura' : 'Crear Asignatura'} />
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
                <Field type="text" name="name" placeholder="Ej: Cálculo I" className={inputClass} />
                <ErrorMessage name="name" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Código <span className="text-meta-1">*</span></label>
                <Field type="text" name="code" placeholder="Ej: MAT-101" className={inputClass} />
                <ErrorMessage name="code" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Créditos <span className="text-meta-1">*</span></label>
                <Field type="number" name="credits" placeholder="3" min="1" className={inputClass} />
                <ErrorMessage name="credits" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white">Descripción</label>
                <Field as="textarea" name="description" rows={3} placeholder="Descripción de la asignatura" className={inputClass} />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/subjects/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
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

export default SubjectForm;
