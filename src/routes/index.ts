import { lazy } from 'react';

type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AppRoute {
  path: string;
  title: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  roles?: UserRole[];
}

// Páginas existentes
const Calendar = lazy(() => import('../pages/Calendar'));
const Chart = lazy(() => import('../pages/Chart'));
const FormElements = lazy(() => import('../pages/Form/FormElements'));
const FormLayout = lazy(() => import('../pages/Form/FormLayout'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const Tables = lazy(() => import('../pages/Tables'));
const Alerts = lazy(() => import('../pages/UiElements/Alerts'));
const Buttons = lazy(() => import('../pages/UiElements/Buttons'));
const UserList = lazy(() => import('../pages/Users/ListUsers'));
const UserCreate = lazy(() => import('../pages/Users/Create'));
const UserUpdate = lazy(() => import('../pages/Users/Update'));

// Estudiantes
const StudentList = lazy(() => import('../pages/Students/List'));
const StudentForm = lazy(() => import('../pages/Students/Form'));

// Docentes
const TeacherList = lazy(() => import('../pages/Teachers/List'));
const TeacherForm = lazy(() => import('../pages/Teachers/Form'));
const RoleList = lazy(() => import('../pages/Roles/List'));
const Posts = lazy(() => import('../pages/Posts/List'));

// Carreras
const CareerList = lazy(() => import('../pages/Careers/List'));
const CareerForm = lazy(() => import('../pages/Careers/Form'));

// Semestres
const SemesterList = lazy(() => import('../pages/Semesters/List'));
const SemesterForm = lazy(() => import('../pages/Semesters/Form'));

// Asignaturas
const SubjectList = lazy(() => import('../pages/Subjects/List'));
const SubjectForm = lazy(() => import('../pages/Subjects/Form'));

// Plan de estudios
const StudyPlanList = lazy(() => import('../pages/StudyPlans/List'));
const StudyPlanForm = lazy(() => import('../pages/StudyPlans/Form'));

// Grupos
const GroupList = lazy(() => import('../pages/Groups/List'));
const GroupForm = lazy(() => import('../pages/Groups/Form'));
const AssignTeacher = lazy(() => import('../pages/Groups/AssignTeacher'));
const FinalGrades = lazy(() => import('../pages/Groups/FinalGrades'));

// Matrículas
const RegistrationList = lazy(() => import('../pages/Registrations/List'));
const RegistrationForm = lazy(() => import('../pages/Registrations/Form'));

// Inscripciones
const EnrollmentList = lazy(() => import('../pages/Enrollments/List'));
const EnrollmentForm = lazy(() => import('../pages/Enrollments/Form'));

// Rúbricas
const RubricList = lazy(() => import('../pages/Rubrics/List'));
const RubricForm = lazy(() => import('../pages/Rubrics/Form'));

// Evaluaciones
const EvaluationList = lazy(() => import('../pages/Evaluations/List'));
const EvaluationForm = lazy(() => import('../pages/Evaluations/Form'));
const GradeStudents = lazy(() => import('../pages/Evaluations/Grade'));
const AssociateRubric = lazy(() => import('../pages/Evaluations/AssociateRubric'));

// Estudiante
const MyEvaluations = lazy(() => import('../pages/Student/MyEvaluations'));
const MyGrades = lazy(() => import('../pages/Student/MyGrades'));
const ViewRubric = lazy(() => import('../pages/Student/ViewRubric'));

const coreRoutes: AppRoute[] = [
  // Usuarios
  { path: '/users/list', title: 'Usuarios', component: UserList, roles: ['ADMIN'] },
  { path: '/users/create', title: 'Crear Usuario', component: UserCreate, roles: ['ADMIN'] },
  { path: '/users/update/:id', title: 'Editar Usuario', component: UserUpdate, roles: ['ADMIN'] },

  // Estudiantes (perfiles académicos)
  { path: '/students/list', title: 'Estudiantes', component: StudentList, roles: ['ADMIN'] },
  { path: '/students/form', title: 'Crear Estudiante', component: StudentForm, roles: ['ADMIN'] },
  { path: '/students/form/:id', title: 'Editar Estudiante', component: StudentForm, roles: ['ADMIN'] },

  // Docentes (perfiles académicos)
  { path: '/teachers/list', title: 'Docentes', component: TeacherList, roles: ['ADMIN'] },
  { path: '/teachers/form', title: 'Crear Docente', component: TeacherForm, roles: ['ADMIN'] },
  { path: '/teachers/form/:id', title: 'Editar Docente', component: TeacherForm, roles: ['ADMIN'] },
  { path: '/posts/list', title: 'Posts', component: Posts },
  { path: '/roles-list', title: 'Roles', component: RoleList, roles: ['ADMIN'] },

  // Carreras
  { path: '/careers/list', title: 'Carreras', component: CareerList, roles: ['ADMIN'] },
  { path: '/careers/form', title: 'Crear Carrera', component: CareerForm, roles: ['ADMIN'] },
  { path: '/careers/form/:id', title: 'Editar Carrera', component: CareerForm, roles: ['ADMIN'] },

  // Semestres
  { path: '/semesters/list', title: 'Semestres', component: SemesterList, roles: ['ADMIN'] },
  { path: '/semesters/form', title: 'Crear Semestre', component: SemesterForm, roles: ['ADMIN'] },
  { path: '/semesters/form/:id', title: 'Editar Semestre', component: SemesterForm, roles: ['ADMIN'] },

  // Asignaturas
  { path: '/subjects/list', title: 'Asignaturas', component: SubjectList, roles: ['ADMIN'] },
  { path: '/subjects/form', title: 'Crear Asignatura', component: SubjectForm, roles: ['ADMIN'] },
  { path: '/subjects/form/:id', title: 'Editar Asignatura', component: SubjectForm, roles: ['ADMIN'] },

  // Plan de estudios
  { path: '/study-plans/list', title: 'Plan de Estudios', component: StudyPlanList, roles: ['ADMIN'] },
  { path: '/study-plans/form', title: 'Crear Plan', component: StudyPlanForm, roles: ['ADMIN'] },
  { path: '/study-plans/form/:id', title: 'Editar Plan', component: StudyPlanForm, roles: ['ADMIN'] },

  // Grupos
  { path: '/groups/list', title: 'Grupos', component: GroupList, roles: ['ADMIN'] },
  { path: '/groups/form', title: 'Crear Grupo', component: GroupForm, roles: ['ADMIN'] },
  { path: '/groups/form/:id', title: 'Editar Grupo', component: GroupForm, roles: ['ADMIN'] },
  { path: '/groups/assign-teacher/:id', title: 'Asignar Docente', component: AssignTeacher, roles: ['ADMIN'] },
  { path: '/groups/final-grades/:id', title: 'Notas Finales', component: FinalGrades, roles: ['ADMIN', 'TEACHER'] },

  // Matrículas
  { path: '/registrations/list', title: 'Matrículas', component: RegistrationList, roles: ['ADMIN'] },
  { path: '/registrations/form', title: 'Matricular Estudiante', component: RegistrationForm, roles: ['ADMIN'] },
  { path: '/registrations/form/:id', title: 'Editar Matrícula', component: RegistrationForm, roles: ['ADMIN'] },

  // Inscripciones
  { path: '/enrollments/list', title: 'Inscripciones', component: EnrollmentList, roles: ['ADMIN'] },
  { path: '/enrollments/form', title: 'Inscribir Estudiante', component: EnrollmentForm, roles: ['ADMIN'] },
  { path: '/enrollments/form/:id', title: 'Editar Inscripción', component: EnrollmentForm, roles: ['ADMIN'] },

  // Rúbricas
  { path: '/rubrics/list', title: 'Rúbricas', component: RubricList, roles: ['ADMIN', 'TEACHER'] },
  { path: '/rubrics/form', title: 'Crear Rúbrica', component: RubricForm, roles: ['ADMIN', 'TEACHER'] },
  { path: '/rubrics/form/:id', title: 'Editar Rúbrica', component: RubricForm, roles: ['ADMIN', 'TEACHER'] },

  // Evaluaciones
  { path: '/evaluations/list', title: 'Evaluaciones', component: EvaluationList, roles: ['ADMIN', 'TEACHER'] },
  { path: '/evaluations/form', title: 'Crear Evaluación', component: EvaluationForm, roles: ['ADMIN', 'TEACHER'] },
  { path: '/evaluations/form/:id', title: 'Editar Evaluación', component: EvaluationForm, roles: ['ADMIN', 'TEACHER'] },
  { path: '/evaluations/grade/:id', title: 'Calificar', component: GradeStudents, roles: ['ADMIN', 'TEACHER'] },
  { path: '/evaluations/associate-rubric/:id', title: 'Asociar Rúbrica', component: AssociateRubric, roles: ['ADMIN', 'TEACHER'] },

  // Estudiante
  { path: '/student/my-evaluations', title: 'Mis Evaluaciones', component: MyEvaluations, roles: ['STUDENT'] },
  { path: '/student/grades/:evaluationId', title: 'Mis Notas', component: MyGrades, roles: ['STUDENT'] },
  { path: '/student/rubric/:id', title: 'Ver Rúbrica', component: ViewRubric, roles: ['STUDENT'] },

  // Rutas base
  { path: '/calendar', title: 'Calendario', component: Calendar },
  { path: '/profile', title: 'Perfil', component: Profile },
  { path: '/forms/form-elements', title: 'Form Elements', component: FormElements },
  { path: '/forms/form-layout', title: 'Form Layout', component: FormLayout },
  { path: '/tables', title: 'Tables', component: Tables },
  { path: '/settings', title: 'Settings', component: Settings },
  { path: '/chart', title: 'Chart', component: Chart },
  { path: '/ui/alerts', title: 'Alerts', component: Alerts },
  { path: '/ui/buttons', title: 'Buttons', component: Buttons },
];

const routes = [...coreRoutes];
export default routes;
