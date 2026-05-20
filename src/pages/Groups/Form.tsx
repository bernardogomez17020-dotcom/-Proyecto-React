import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { groupService } from '../../services/groupService';
import { subjectService } from '../../services/subjectService';
import { semesterService } from '../../services/semesterService';
import { teacherService } from '../../services/teacherService';
import { Subject } from '../../models/Subject';
import { Semester } from '../../models/Semester';
import { Teacher } from '../../models/Teacher';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  name: Yup.string().required('Requerido'),
  group_code: Yup.string().required('Requerido'),
  subject_id: Yup.string().required('Requerido'),
  semester_id: Yup.string().required('Requerido'),
  teacher_id: Yup.string().required('Requerido'),
  capacity: Yup.number().typeError('Debe ser un número').min(1, 'Mínimo 1').optional(),
});

const empty = { name: '', group_code: '', subject_id: '', semester_id: '', teacher_id: '', capacity: 30 };

const GroupForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [initial, setInitial] = useState<Record<string, any>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [subs, sems, tchs] = await Promise.all([
        subjectService.getAll(),
        semesterService.getAll(),
        teacherService.getAll(),
      ]);
      setSubjects(subs);
      setSemesters(sems);
      setTeachers(tchs);

      if (id) {
        const grp = await groupService.getById(id);
        if (grp) {
          setInitial({
            name: grp.name ?? '',
            group_code: grp.group_code ?? '',
            subject_id: grp.subject_id ?? '',
            semester_id: grp.semester_id ?? '',
            teacher_id: grp.teacher_id ?? '',
            capacity: grp.capacity ?? 30,
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      group_code: values.group_code,
      subject_id: values.subject_id,
      semester_id: values.semester_id,
      teacher_id: values.teacher_id,
      capacity: Number(values.capacity) || 30,
    };
    const result = id
      ? await groupService.update(id, payload)
      : await groupService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Completado', text: 'Grupo guardado correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/groups/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el grupo. Verifica que el código no exista.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Grupo' : 'Crear Grupo'} />
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
                <Field type="text" name="name" placeholder="Ej: Grupo A" className={inputClass} />
                <ErrorMessage name="name" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Código de grupo <span className="text-meta-1">*</span></label>
                <Field type="text" name="group_code" placeholder="Ej: ISC-101-A" className={inputClass} />
                <ErrorMessage name="group_code" component="p" className="mt-1 text-xs text-meta-1" />
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
                <label className="mb-2.5 block text-black dark:text-white">Semestre <span className="text-meta-1">*</span></label>
                <Field as="select" name="semester_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.is_active ? ' (activo)' : ''}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="semester_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Docente <span className="text-meta-1">*</span></label>
                <Field as="select" name="teacher_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {`${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()} — {t.identification ?? ''}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="teacher_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Capacidad</label>
                <Field type="number" name="capacity" placeholder="30" min="1" className={inputClass} />
                <ErrorMessage name="capacity" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/groups/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
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

export default GroupForm;
