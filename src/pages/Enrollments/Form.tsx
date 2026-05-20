import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Breadcrumb';
import { enrollmentService } from '../../services/enrollmentService';
import { studentService } from '../../services/studentService';
import { groupService } from '../../services/groupService';
import { registrationService } from '../../services/registrationService';
import { studyPlanService } from '../../services/studyPlanService';
import { subjectService } from '../../services/subjectService';
import { semesterService } from '../../services/semesterService';
import { careerService } from '../../services/careerService';
import { Student } from '../../models/Student';
import { Registration } from '../../models/Registration';
import { StudyPlan } from '../../models/StudyPlan';
import { Semester } from '../../models/Semester';
import { Career } from '../../models/Career';

const CREDIT_LIMIT = 20;

const inputClass =
  'w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary';

interface GroupOption {
  id: string;
  name: string;
  group_code: string;
  subject_id: string;
  subject_name: string;
  credits: number;
  capacity: number;
  enrolled: number;
  available: number;
  isInPlan: boolean;
  alreadyEnrolled: boolean;
}

// ── Checkbox row ──────────────────────────────────────────────────────────────
const GroupCheckbox: React.FC<{
  group: GroupOption;
  checked: boolean;
  onChange: () => void;
}> = ({ group, checked, onChange }) => {
  const isFull = group.available <= 0;
  const disabled = group.alreadyEnrolled || isFull;

  return (
    <label
      className={`flex items-start gap-3 rounded border p-3 transition
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${checked && !disabled
          ? 'border-primary bg-primary bg-opacity-5'
          : 'border-stroke dark:border-strokedark'}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <div className="flex-1 text-sm">
        <div className="font-medium text-black dark:text-white">
          {group.name}{' '}
          <span className="text-xs text-body dark:text-bodydark">({group.group_code})</span>
        </div>
        <div className="mt-0.5 text-body dark:text-bodydark">
          {group.subject_name} · <strong>{group.credits}</strong> crédito(s) · Cupo:{' '}
          <span className={group.available <= 0 ? 'font-medium text-danger' : ''}>
            {group.available}/{group.capacity}
          </span>
        </div>
        {group.alreadyEnrolled && (
          <span className="mt-1 inline-block text-xs font-medium text-success">Ya inscrito</span>
        )}
        {isFull && !group.alreadyEnrolled && (
          <span className="mt-1 inline-block text-xs font-medium text-danger">Sin cupo</span>
        )}
      </div>
    </label>
  );
};

// ── Edit mode ─────────────────────────────────────────────────────────────────
const EditEnrollmentForm: React.FC<{ id: string }> = ({ id }) => {
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [studentName, setStudentName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [enr, studs, grps] = await Promise.all([
        enrollmentService.getById(id),
        studentService.getAll(),
        groupService.getAll(),
      ]);
      if (enr) {
        setEnrollment(enr);
        setStatus(enr.status ?? 'ACTIVE');
        const s = studs.find(x => x.id === enr.student_id);
        setStudentName(s ? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() : enr.student_id);
        const g = grps.find(x => x.id === enr.group_id);
        setGroupName(g ? `${g.name} (${g.group_code})` : enr.group_id);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    const result = await enrollmentService.update(id, { status });
    if (result) {
      Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1500, showConfirmButton: false });
      navigate('/enrollments/list');
    } else {
      Swal.fire({ title: 'Error', text: 'No se pudo actualizar la inscripción.', icon: 'error' });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!enrollment) return <div className="p-6">Inscripción no encontrada.</div>;

  return (
    <div>
      <Breadcrumb pageName="Editar Inscripción" />
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-black dark:text-white">Estudiante: </span>
            <span className="text-body dark:text-bodydark">{studentName}</span>
          </div>
          <div>
            <span className="font-medium text-black dark:text-white">Grupo: </span>
            <span className="text-body dark:text-bodydark">{groupName}</span>
          </div>
          {enrollment.enrollment_date && (
            <div>
              <span className="font-medium text-black dark:text-white">Fecha de inscripción: </span>
              <span className="text-body dark:text-bodydark">{enrollment.enrollment_date}</span>
            </div>
          )}
        </div>

        <div className="mb-6 max-w-xs">
          <label className="mb-2.5 block text-black dark:text-white">Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
            <option value="ACTIVE">Activo</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="COMPLETED">Completado</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white hover:bg-opacity-90 transition"
          >
            Guardar
          </button>
          <button
            onClick={() => navigate('/enrollments/list')}
            className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Create mode ───────────────────────────────────────────────────────────────
const CreateEnrollmentForm: React.FC = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [allStudyPlans, setAllStudyPlans] = useState<StudyPlan[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, any>>({});
  const [careerMap, setCareerMap] = useState<Record<string, Career>>({});
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentRegistration, setStudentRegistration] = useState<Registration | null>(null);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [regs, studs, grps, plans, subjects, enrollments, semesters, careers] = await Promise.all([
        registrationService.getAll(),
        studentService.getAll(),
        groupService.getAll(),
        studyPlanService.getAll(),
        subjectService.getAll(),
        enrollmentService.getAll(),
        semesterService.getAll(),
        careerService.getAll(),
      ]);
      setAllRegistrations(regs);
      setStudents(studs);
      setAllGroups(grps);
      setAllStudyPlans(plans);
      setAllEnrollments(enrollments);
      setSubjectMap(Object.fromEntries(subjects.map(s => [s.id, s])));
      setCareerMap(Object.fromEntries(careers.map(c => [c.id!, c])));
      setActiveSemester(semesters.find(s => s.is_active) ?? null);
      setLoading(false);
    };
    load();
  }, []);

  const handleStudentChange = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedGroupIds([]);
    setGroupOptions([]);
    setStudentRegistration(null);

    if (!studentId) return;

    setLoadingGroups(true);

    const activeReg = allRegistrations.find(r => r.student_id === studentId && r.is_active);
    setStudentRegistration(activeReg ?? null);

    if (!activeReg) {
      setLoadingGroups(false);
      return;
    }

    // Collect subject IDs from all career plans
    const careerPlans = allStudyPlans.filter(p => p.career_id === activeReg.career_id);
    const inPlanSubjectIds = new Set<string>();
    if (careerPlans.length > 0) {
      const subjectArrays = await Promise.all(
        careerPlans.map(p => studyPlanService.getSubjects(p.id!))
      );
      subjectArrays.flat().forEach(s => { if (s.id) inPlanSubjectIds.add(s.id); });
    }

    const options: GroupOption[] = allGroups
      .filter(g => activeSemester && g.semester_id === activeSemester.id)
      .map(g => {
        const subject = subjectMap[g.subject_id ?? ''];
        const enrolledCount = allEnrollments.filter(
          e => e.group_id === g.id && e.status !== 'CANCELLED'
        ).length;
        const alreadyEnrolled = allEnrollments.some(
          e => e.group_id === g.id && e.student_id === studentId && e.status !== 'CANCELLED'
        );
        return {
          id: g.id!,
          name: g.name ?? '',
          group_code: g.group_code ?? '',
          subject_id: g.subject_id ?? '',
          subject_name: subject?.name ?? '—',
          credits: subject?.credits ?? 0,
          capacity: g.capacity ?? 0,
          enrolled: enrolledCount,
          available: (g.capacity ?? 0) - enrolledCount,
          isInPlan: inPlanSubjectIds.has(g.subject_id ?? ''),
          alreadyEnrolled,
        };
      });

    setGroupOptions(options);
    setLoadingGroups(false);
  };

  const toggleGroup = (groupId: string) =>
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );

  const selectedGroups = groupOptions.filter(g => selectedGroupIds.includes(g.id));
  const totalCredits = selectedGroups.reduce((sum, g) => sum + g.credits, 0);

  const handleSubmit = async () => {
    const selected = groupOptions.filter(g => selectedGroupIds.includes(g.id));

    if (selected.length === 0) {
      Swal.fire({ title: 'Selecciona al menos un grupo', icon: 'warning' });
      return;
    }

    // E2: capacity
    const noCapacity = selected.filter(g => g.available <= 0);
    if (noCapacity.length > 0) {
      Swal.fire({
        title: 'Sin cupo disponible',
        text: `Los siguientes grupos no tienen cupo: ${noCapacity.map(g => g.name).join(', ')}.`,
        icon: 'error',
      });
      return;
    }

    // E1: credit limit
    if (totalCredits > CREDIT_LIMIT) {
      Swal.fire({
        title: 'Límite de créditos excedido',
        text: `Total seleccionado: ${totalCredits} créditos. Límite permitido: ${CREDIT_LIMIT} créditos.`,
        icon: 'error',
      });
      return;
    }

    // E4: out-of-plan warning (advierte pero permite continuar)
    const outOfPlan = selected.filter(g => !g.isInPlan);
    if (outOfPlan.length > 0) {
      const { isConfirmed } = await Swal.fire({
        title: 'Asignaturas fuera del plan',
        html: `Los grupos <b>${outOfPlan.map(g => g.name).join(', ')}</b> tienen asignaturas que no pertenecen al plan de estudios de la carrera del estudiante. ¿Desea continuar de todas formas?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
      });
      if (!isConfirmed) return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar inscripción?',
      html: `Se inscribirá al estudiante en <b>${selected.length}</b> grupo(s) — <b>${totalCredits}</b> crédito(s) en total.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Inscribir',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    const results = await Promise.all(
      selected.map(g =>
        enrollmentService.create({ student_id: selectedStudentId, group_id: g.id } as any)
      )
    );

    const succeeded = results.filter(Boolean).length;
    const failed = results.length - succeeded;

    if (failed === 0) {
      Swal.fire({
        title: 'Completado',
        text: `${succeeded} inscripción(es) creadas correctamente.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      navigate('/enrollments/list');
    } else {
      await Swal.fire({
        title: failed === results.length ? 'Error' : 'Resultado parcial',
        text: `${succeeded} inscripción(es) creadas. ${failed} fallaron (posiblemente el estudiante ya estaba inscrito).`,
        icon: succeeded > 0 ? 'warning' : 'error',
      });
      if (succeeded > 0) navigate('/enrollments/list');
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const activeStudents = students.filter(s =>
    allRegistrations.some(r => r.student_id === s.id && r.is_active)
  );
  const inPlanGroups = groupOptions.filter(g => g.isInPlan);
  const outOfPlanGroups = groupOptions.filter(g => !g.isInPlan);

  return (
    <div>
      <Breadcrumb pageName="Inscribir Estudiante en Grupo" />

      {/* Student selector */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark mb-6 p-6">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Seleccionar estudiante</h3>
        <select
          value={selectedStudentId}
          onChange={e => handleStudentChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Seleccionar...</option>
          {activeStudents.map(s => (
            <option key={s.id} value={s.id}>
              {`${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()} — {s.identification ?? ''}
            </option>
          ))}
        </select>

        {/* Student info card */}
        {selectedStudentId && studentRegistration && (
          <div className="mt-4 grid grid-cols-3 gap-3 rounded bg-gray-50 p-4 text-sm dark:bg-meta-4">
            <div>
              <span className="font-medium text-black dark:text-white">Carrera: </span>
              <span className="text-body dark:text-bodydark">
                {careerMap[studentRegistration.career_id ?? '']?.name ?? '—'}
              </span>
            </div>
            <div>
              <span className="font-medium text-black dark:text-white">Período: </span>
              <span className="text-body dark:text-bodydark">{studentRegistration.admission_period ?? '—'}</span>
            </div>
            <div>
              <span className="font-medium text-black dark:text-white">Estado académico: </span>
              <span className="text-body dark:text-bodydark">{studentRegistration.academic_status ?? '—'}</span>
            </div>
          </div>
        )}

        {/* E3: no active registration */}
        {selectedStudentId && !studentRegistration && !loadingGroups && (
          <div className="mt-4 rounded border border-danger bg-danger bg-opacity-10 p-4 text-sm text-danger">
            Este estudiante no tiene una matrícula activa.{' '}
            <Link to="/registrations/form" className="ml-1 font-medium underline">
              Ir a Matrículas →
            </Link>
          </div>
        )}

        {/* No active semester warning */}
        {selectedStudentId && studentRegistration && !activeSemester && !loadingGroups && (
          <div className="mt-4 rounded border border-warning bg-warning bg-opacity-10 p-4 text-sm">
            No hay un semestre activo. Define un semestre activo para ver los grupos disponibles.
          </div>
        )}
      </div>

      {/* Group selection */}
      {selectedStudentId && studentRegistration && activeSemester && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-black dark:text-white">
              Grupos — Semestre {activeSemester.name}
            </h3>
            <span
              className={`text-sm font-medium ${
                totalCredits > CREDIT_LIMIT ? 'text-danger' : 'text-black dark:text-white'
              }`}
            >
              Créditos: <strong>{totalCredits}</strong> / {CREDIT_LIMIT}
            </span>
          </div>

          {loadingGroups ? (
            <p className="text-sm text-body dark:text-bodydark">Cargando grupos...</p>
          ) : groupOptions.length === 0 ? (
            <p className="text-sm text-body dark:text-bodydark">
              No hay grupos disponibles en el semestre activo.
            </p>
          ) : (
            <>
              {inPlanGroups.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-black dark:text-white">
                    Asignaturas del plan de estudios
                  </h4>
                  <div className="space-y-2">
                    {inPlanGroups.map(g => (
                      <GroupCheckbox
                        key={g.id}
                        group={g}
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => toggleGroup(g.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {outOfPlanGroups.length > 0 && (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-warning">
                    ⚠ Asignaturas fuera del plan de estudios
                  </h4>
                  <div className="space-y-2">
                    {outOfPlanGroups.map(g => (
                      <GroupCheckbox
                        key={g.id}
                        group={g}
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={() => toggleGroup(g.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={selectedGroupIds.length === 0 || loadingGroups}
              className="flex justify-center rounded bg-primary py-3 px-10 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Inscribir
            </button>
            <button
              onClick={() => navigate('/enrollments/list')}
              className="flex justify-center rounded border border-stroke py-3 px-10 font-medium text-black transition hover:shadow-1 dark:border-strokedark dark:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!selectedStudentId && (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <p className="text-sm text-body dark:text-bodydark">
            Selecciona un estudiante para ver los grupos disponibles según su plan de estudios.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Entry point ───────────────────────────────────────────────────────────────
const EnrollmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <EditEnrollmentForm id={id} /> : <CreateEnrollmentForm />;
};

export default EnrollmentForm;
