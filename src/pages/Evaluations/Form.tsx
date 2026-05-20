import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { evaluationService } from '../../services/evaluationService';
import { subjectService } from '../../services/subjectService';
import { groupService } from '../../services/groupService';
import { Subject } from '../../models/Subject';
import { Group } from '../../models/Group';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  name: Yup.string().required('Requerido'),
  weight: Yup.number()
    .typeError('Debe ser un número')
    .required('Requerido')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  subject_id: Yup.string().required('Requerido'),
  group_id: Yup.string().required('Requerido'),
});

const empty = { name: '', description: '', weight: '', subject_id: '', group_id: '' };

const EvaluationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [initial, setInitial] = useState<Record<string, any>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, grps] = await Promise.all([
          subjectService.getAll(),
          groupService.getAll(),
        ]);
        setSubjects(subs);
        setGroups(grps);

        if (id) {
          const ev = await evaluationService.getById(id);
          if (ev) {
            setInitial({
              name: ev.name ?? '',
              description: ev.description ?? '',
              weight: ev.weight ?? '',
              subject_id: ev.subject_id ?? '',
              group_id: ev.group_id ?? '',
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      description: values.description,
      weight: Number(values.weight),
      subject_id: values.subject_id,
      group_id: values.group_id,
    };

    const result = id
      ? await evaluationService.update(id, payload)
      : await evaluationService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Completado', text: 'Evaluación guardada correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/evaluations/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar la evaluación.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Evaluación' : 'Crear Evaluación'} />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <Formik initialValues={initial} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
            <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white">Nombre <span className="text-meta-1">*</span></label>
                <Field type="text" name="name" placeholder="Ej: Parcial 1" className={inputClass} />
                <ErrorMessage name="name" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white">Descripción</label>
                <Field as="textarea" name="description" rows={3} placeholder="Descripción de la evaluación" className={inputClass} />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Peso (%) <span className="text-meta-1">*</span></label>
                <Field type="number" name="weight" placeholder="30" min="0" max="100" className={inputClass} />
                <ErrorMessage name="weight" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Asignatura <span className="text-meta-1">*</span></label>
                <Field as="select" name="subject_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </Field>
                <ErrorMessage name="subject_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Grupo <span className="text-meta-1">*</span></label>
                <Field as="select" name="group_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.group_code})</option>
                  ))}
                </Field>
                <ErrorMessage name="group_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/evaluations/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
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

export default EvaluationForm;
