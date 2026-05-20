import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { registrationService } from '../../services/registrationService';
import { careerService } from '../../services/careerService';
import { studentService } from '../../services/studentService';
import { Student } from '../../models/Student';
import { Career } from '../../models/Career';
import { Registration } from '../../models/Registration';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  student_id: Yup.string().required('Requerido'),
  career_id: Yup.string().required('Requerido'),
  admission_period: Yup.string().required('Requerido'),
  academic_status: Yup.string().required('Requerido'),
});

const empty = { student_id: '', career_id: '', admission_period: '', academic_status: 'ACTIVE' };

const RegistrationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [initial, setInitial] = useState<Record<string, any>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [studs, cars, regs] = await Promise.all([
        studentService.getAll(),
        careerService.getAll(),
        registrationService.getAll(),
      ]);
      setStudents(studs);
      setCareers(cars);
      setAllRegistrations(regs);

      if (id) {
        const reg = await registrationService.getById(id);
        if (reg) {
          setInitial({
            student_id: reg.student_id ?? '',
            career_id: reg.career_id ?? '',
            admission_period: reg.admission_period ?? '',
            academic_status: reg.academic_status ?? 'ACTIVE',
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    // E1: estudiante ya tiene matrícula activa en la misma carrera
    const duplicate = allRegistrations.find(
      r => r.id !== id &&
           r.student_id === values.student_id &&
           r.career_id === values.career_id &&
           r.is_active
    );
    if (duplicate) {
      Swal.fire({
        title: 'Ya matriculado',
        text: 'El estudiante ya tiene una matrícula activa en esta carrera.',
        icon: 'error',
      });
      return;
    }

    const payload = {
      student_id: values.student_id,
      career_id: values.career_id,
      admission_period: values.admission_period,
      academic_status: values.academic_status,
    };

    const result = id
      ? await registrationService.update(id, payload)
      : await registrationService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Completado', text: 'Matrícula guardada correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
      navigate('/registrations/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar la matrícula.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Matrícula' : 'Matricular Estudiante'} />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="p-6.5">
          <Formik initialValues={initial} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
            <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">Estudiante <span className="text-meta-1">*</span></label>
                <Field as="select" name="student_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()} — {s.identification ?? ''}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="student_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Carrera <span className="text-meta-1">*</span></label>
                <Field as="select" name="career_id" className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {careers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Field>
                <ErrorMessage name="career_id" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Período de ingreso <span className="text-meta-1">*</span></label>
                <Field type="text" name="admission_period" placeholder="Ej: 2026-1" className={inputClass} />
                <ErrorMessage name="admission_period" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Estado académico <span className="text-meta-1">*</span></label>
                <Field as="select" name="academic_status" className={inputClass}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="GRADUATED">Graduado</option>
                  <option value="WITHDRAWN">Retirado</option>
                </Field>
                <ErrorMessage name="academic_status" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/registrations/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
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

export default RegistrationForm;
