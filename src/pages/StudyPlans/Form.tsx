import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { studyPlanService } from '../../services/studyPlanService';
import { careerService } from '../../services/careerService';
import { subjectService } from '../../services/subjectService';
import { Career } from '../../models/Career';
import { Subject } from '../../models/Subject';

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

const validationSchema = Yup.object({
  name: Yup.string().required('Requerido'),
  career_id: Yup.string().required('Requerido'),
  year: Yup.number().required('Requerido').integer('Debe ser entero').min(2000, 'Año inválido').typeError('Debe ser un número'),
  suggested_semester: Yup.number().required('Requerido').integer('Debe ser entero').min(1, 'Mínimo 1').typeError('Debe ser un número'),
});

const emptyValues = { name: '', career_id: '', year: '', suggested_semester: '' };

const StudyPlanForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [linkedSubjects, setLinkedSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [initial, setInitial] = useState<Record<string, any>>(emptyValues);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [allCareers, subjects] = await Promise.all([
        careerService.getAll(),
        subjectService.getAll(),
      ]);
      setCareers(allCareers);
      setAllSubjects(subjects);

      if (id) {
        const [plan, linked] = await Promise.all([
          studyPlanService.getById(id),
          studyPlanService.getSubjects(id),
        ]);
        if (plan) {
          setInitial({
            name: plan.name ?? '',
            career_id: plan.career_id ?? '',
            year: plan.year ?? '',
            suggested_semester: plan.suggested_semester ?? '',
          });
          setIsPublished(plan.is_published ?? false);
        }
        setLinkedSubjects(linked);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      career_id: values.career_id,
      year: Number(values.year),
      suggested_semester: Number(values.suggested_semester),
    };
    const result = id
      ? await studyPlanService.update(id, payload)
      : await studyPlanService.create(payload as any);

    if (result) {
      Swal.fire({ title: 'Guardado', text: 'Plan de estudio guardado.', icon: 'success', timer: 2000, showConfirmButton: false });
      if (!id) navigate(`/study-plans/form/${result.id}`);
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo guardar el plan.', icon: 'error' });
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (linkedSubjects.length === 0) {
      Swal.fire({ title: 'Sin asignaturas', text: 'Agrega al menos una asignatura antes de publicar el plan.', icon: 'warning' });
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: '¿Publicar plan?',
      text: 'Una vez publicado, este plan estará disponible para nuevas cohortes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Publicar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    const result = await studyPlanService.update(id, { is_published: true });
    if (result) {
      setIsPublished(true);
      Swal.fire({ title: 'Publicado', icon: 'success', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo publicar el plan.', icon: 'error' });
    }
  };

  const handleAddSubject = async () => {
    if (!id || !selectedSubjectId) return;
    const result = await studyPlanService.addSubject(id, selectedSubjectId);
    if (result) {
      const updated = await studyPlanService.getSubjects(id);
      setLinkedSubjects(updated);
      setSelectedSubjectId('');
    } else {
      Swal.fire('Error', 'No se pudo agregar la asignatura.', 'error');
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!id) return;
    const { isConfirmed } = await Swal.fire({
      title: '¿Quitar asignatura?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;
    const ok = await studyPlanService.removeSubject(id, subjectId);
    if (ok) {
      setLinkedSubjects(prev => prev.filter(s => s.id !== subjectId));
    } else {
      Swal.fire('Error', 'No se pudo quitar la asignatura. Puede tener inscripciones activas.', 'error');
    }
  };

  const availableSubjects = allSubjects.filter(s => !linkedSubjects.some(l => l.id === s.id));

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div>
      <Breadcrumb pageName={id ? 'Editar Plan de Estudio' : 'Crear Plan de Estudio'} />

      {/* Metadata del plan */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6">
        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
          <h3 className="font-medium text-black dark:text-white">Datos del plan</h3>
          {isPublished && (
            <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-xs font-medium text-success">
              Publicado
            </span>
          )}
        </div>
        <div className="p-6">
          <Formik
            initialValues={initial}
            validationSchema={validationSchema}
            onSubmit={handleSave}
            enableReinitialize
          >
            <Form className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2.5 block text-black dark:text-white">Nombre del plan <span className="text-meta-1">*</span></label>
                <Field type="text" name="name" placeholder="Ej: Plan 2026" className={inputClass} />
                <ErrorMessage name="name" component="p" className="mt-1 text-xs text-meta-1" />
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
                <label className="mb-2.5 block text-black dark:text-white">Año <span className="text-meta-1">*</span></label>
                <Field type="number" name="year" placeholder="2026" className={inputClass} />
                <ErrorMessage name="year" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white">Semestre sugerido <span className="text-meta-1">*</span></label>
                <Field type="number" name="suggested_semester" placeholder="1" className={inputClass} />
                <ErrorMessage name="suggested_semester" component="p" className="mt-1 text-xs text-meta-1" />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-2">
                <button type="submit" className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition">
                  Guardar
                </button>
                <button type="button" onClick={() => navigate('/study-plans/list')} className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition">
                  Cancelar
                </button>
              </div>
            </Form>
          </Formik>
        </div>
      </div>

      {/* Gestión de asignaturas — solo disponible al editar */}
      {id && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">Asignaturas del plan</h3>
          </div>
          <div className="p-6">
            {!isPublished && (
              <div className="flex gap-3 mb-6">
                <select
                  className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">Seleccionar asignatura para agregar...</option>
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) — {s.credits} créditos</option>
                  ))}
                </select>
                <button
                  onClick={handleAddSubject}
                  disabled={!selectedSubjectId}
                  className="whitespace-nowrap rounded bg-primary py-2 px-4 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            )}

            {linkedSubjects.length === 0 ? (
              <p className="text-sm text-body dark:text-bodydark">No hay asignaturas vinculadas aún.</p>
            ) : (
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="bg-gray-2 dark:bg-meta-4 text-left">
                    <th className="py-2 px-4 font-medium text-black dark:text-white">Nombre</th>
                    <th className="py-2 px-4 font-medium text-black dark:text-white">Código</th>
                    <th className="py-2 px-4 font-medium text-black dark:text-white">Créditos</th>
                    {!isPublished && <th className="py-2 px-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {linkedSubjects.map(s => (
                    <tr key={s.id} className="border-b border-stroke dark:border-strokedark">
                      <td className="py-2 px-4 text-black dark:text-white">{s.name}</td>
                      <td className="py-2 px-4 text-body dark:text-bodydark">{s.code}</td>
                      <td className="py-2 px-4 text-body dark:text-bodydark">{s.credits}</td>
                      {!isPublished && (
                        <td className="py-2 px-4 text-right">
                          <button
                            onClick={() => handleRemoveSubject(s.id!)}
                            className="rounded bg-danger py-1 px-3 text-xs text-white hover:bg-opacity-90"
                          >
                            Quitar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!isPublished && (
              <button
                onClick={handlePublish}
                className="flex justify-center rounded bg-success py-3 px-10 font-medium text-white hover:bg-opacity-90 transition"
              >
                Publicar plan
              </button>
            )}
          </div>
        </div>
      )}

      {!id && (
        <p className="mt-4 text-sm text-body dark:text-bodydark">
          Guarda el plan primero y luego podrás agregar asignaturas.
        </p>
      )}
    </div>
  );
};

export default StudyPlanForm;
