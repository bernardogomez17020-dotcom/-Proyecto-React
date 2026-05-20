import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GenericForm, { FormField } from '../../components/GenericForm';
import { teacherService } from '../../services/teacherService';
import { userService } from '../../services/userService';

const TeacherForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Record<string, any> | undefined>();
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    userService.search({ role: 'TEACHER' }).then(users => {
      setFields([
        {
          name: 'user_id', label: 'Usuario', type: 'select', required: true,
          options: users.map(u => ({ value: u.id!, label: u.email! })),
        },
        { name: 'first_name', label: 'Nombre', type: 'text', required: true },
        { name: 'last_name', label: 'Apellido', type: 'text', required: true },
        { name: 'identification', label: 'Identificación', type: 'text', required: true },
        { name: 'specialty', label: 'Especialidad', type: 'text' },
        { name: 'phone', label: 'Teléfono', type: 'text' },
      ]);
    });

    if (id) teacherService.getById(id).then(data => data && setInitial(data));
  }, [id]);

  const handleSubmit = async (values: Record<string, any>) => {
    const result = id
      ? await teacherService.update(id, values)
      : await teacherService.create(values);
    return !!result;
  };

  return (
    <GenericForm
      title={id ? 'Editar Docente' : 'Crear Docente'}
      fields={fields}
      initialValues={initial}
      onSubmit={handleSubmit}
      backPath="/teachers/list"
    />
  );
};

export default TeacherForm;
