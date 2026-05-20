import React, { useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Breadcrumb from './Breadcrumb';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'password' | 'email';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface GenericFormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<boolean>;
  title: string;
  backPath?: string;
}

const GenericForm: React.FC<GenericFormProps> = ({ fields, initialValues, onSubmit, title, backPath }) => {
  const navigate = useNavigate();

  const buildDefaults = useMemo(() => {
    const defaults: Record<string, any> = {};
    fields.forEach(f => {
      defaults[f.name] = initialValues?.[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'number' ? '' : '');
    });
    return defaults;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, fields]);

  const validationSchema = Yup.object().shape(
    Object.fromEntries(
      fields
        .filter(f => f.required)
        .map(f => [
          f.name,
          f.type === 'number'
            ? Yup.number().required('Requerido').typeError('Debe ser un número')
            : Yup.string().required('Requerido'),
        ])
    )
  );

  const handleSubmit = async (values: Record<string, any>) => {
    const success = await onSubmit(values);
    if (success) {
      Swal.fire({ title: 'Completado', text: 'Registro guardado correctamente', icon: 'success', timer: 2000, showConfirmButton: false });
      if (backPath) navigate(backPath);
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el registro', icon: 'error' });
    }
  };

  const inputClass =
    'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

  return (
    <div>
      <Breadcrumb pageName={title} />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <Formik
            initialValues={buildDefaults}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {fields.map(field => (
                <div key={field.name} className={field.type === 'textarea' || field.type === 'checkbox' ? 'md:col-span-2' : ''}>
                  <label className="mb-2.5 block text-black dark:text-white">
                    {field.label} {field.required && <span className="text-meta-1">*</span>}
                  </label>

                  {field.type === 'select' && (
                    <Field as="select" name={field.name} className={inputClass}>
                      <option value="">Seleccionar...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Field>
                  )}

                  {field.type === 'textarea' && (
                    <Field as="textarea" name={field.name} placeholder={field.placeholder} rows={4} className={inputClass} />
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <Field type="checkbox" name={field.name} className="h-5 w-5 cursor-pointer" />
                      <span className="text-sm text-body dark:text-bodydark">{field.placeholder}</span>
                    </div>
                  )}

                  {!['select', 'textarea', 'checkbox'].includes(field.type) && (
                    <Field type={field.type} name={field.name} placeholder={field.placeholder} className={inputClass} />
                  )}

                  <ErrorMessage name={field.name} component="p" className="mt-1 text-xs text-meta-1" />
                </div>
              ))}

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition"
                >
                  Guardar
                </button>
                {backPath && (
                  <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </Form>
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default GenericForm;
